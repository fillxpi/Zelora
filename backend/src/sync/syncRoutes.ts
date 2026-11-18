import { Request, Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../auth/authMiddleware';
import { gameStateSchema, loadGameState } from '../game/gameRoutes';
import { isValidDate } from '../lib/dates';
import { prisma } from '../lib/prisma';

export const syncRouter = Router();

syncRouter.use(requireAuth);

class RevisionConflict extends Error {}

const dateString = z.string().refine(isValidDate, 'Data inválida (use YYYY-MM-DD)');
const idString = z.string().min(1).max(100);
const titleString = z.string().trim().min(1).max(100);

const syncSchema = z.object({
  baseRevision: z.number().int().min(0),
  habits: z
    .array(
      z.object({
        id: idString,
        title: titleString,
        completedDates: z.array(dateString).max(3650),
      }),
    )
    .max(500),
  goals: z
    .array(
      z.object({
        id: idString,
        title: titleString,
        habitIds: z.array(idString).max(200),
        target: z.number().int().min(1).max(100000),
        createdAt: dateString,
        milestones: z
          .array(
            z.object({
              id: idString,
              title: titleString,
              requiredCompletions: z.number().int().min(1).max(100000),
            }),
          )
          .max(50),
      }),
    )
    .max(500),
  game: gameStateSchema,
});

function currentUserId(req: Request): string {
  return (req as AuthRequest).userId as string;
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

async function loadSnapshot(userId: string) {
  const [user, habits, goals, game] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { syncRevision: true } }),
    prisma.habit.findMany({
      where: { userId },
      include: { completions: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    }),
    prisma.goal.findMany({
      where: { userId },
      include: { habitLinks: true, milestones: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    }),
    loadGameState(userId),
  ]);

  return {
    revision: user.syncRevision,
    habits: habits.map((h) => ({
      id: h.id,
      title: h.title,
      completedDates: h.completions.map((c) => c.date).sort(),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      habitIds: g.habitLinks.map((l) => l.habitId).sort(),
      target: g.target,
      createdAt: g.createdAt,
      milestones: g.milestones
        .map((m) => ({ id: m.id, title: m.title, requiredCompletions: m.requiredCompletions }))
        .sort((a, b) => a.requiredCompletions - b.requiredCompletions),
    })),
    game,
  };
}

syncRouter.get('/', async (req, res) => {
  res.json(await loadSnapshot(currentUserId(req)));
});

syncRouter.put('/', async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados de sincronização inválidos' });
    return;
  }

  const userId = currentUserId(req);
  const { baseRevision, habits, goals, game } = parsed.data;

  const habitIds = habits.map((h) => h.id);
  const habitIdSet = new Set(habitIds);
  const problem = hasDuplicates(habitIds)
    ? 'Há hábitos com id repetido'
    : hasDuplicates(goals.map((g) => g.id))
      ? 'Há metas com id repetido'
      : goals.some((g) => hasDuplicates(g.milestones.map((m) => m.id)))
        ? 'Há marcos com id repetido'
        : goals.some((g) => g.habitIds.some((id) => !habitIdSet.has(id)))
          ? 'Há meta ligada a um hábito que não existe'
          : null;

  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  const frozenDates = [...new Set(game.frozenDates)];
  const claimed = [...new Set(game.claimedMilestones)].map((key) => {
    const [goalId, milestoneId] = key.split(':');
    return { userId, goalId, milestoneId };
  });

  try {
    await prisma.$transaction(async (tx) => {
      const bumped = await tx.user.updateMany({
        where: { id: userId, syncRevision: baseRevision },
        data: { syncRevision: { increment: 1 } },
      });
      if (bumped.count === 0) throw new RevisionConflict();

      await tx.goal.deleteMany({ where: { userId } });
      await tx.habit.deleteMany({ where: { userId } });

      await tx.habit.createMany({
        data: habits.map((h, index) => ({ userId, id: h.id, title: h.title, position: index })),
      });
      await tx.habitCompletion.createMany({
        data: habits.flatMap((h) =>
          [...new Set(h.completedDates)].map((date) => ({ userId, habitId: h.id, date })),
        ),
      });

      await tx.goal.createMany({
        data: goals.map((g, index) => ({
          userId,
          id: g.id,
          title: g.title,
          target: g.target,
          createdAt: g.createdAt,
          position: index,
        })),
      });
      await tx.goalHabit.createMany({
        data: goals.flatMap((g) =>
          [...new Set(g.habitIds)].map((habitId) => ({ userId, goalId: g.id, habitId })),
        ),
      });
      await tx.milestone.createMany({
        data: goals.flatMap((g) =>
          g.milestones.map((m) => ({
            userId,
            goalId: g.id,
            id: m.id,
            title: m.title,
            requiredCompletions: m.requiredCompletions,
          })),
        ),
      });

      await tx.gameState.upsert({
        where: { userId },
        create: {
          userId,
          coins: game.coins,
          xp: game.xp,
          freezes: game.freezes,
          lastCheckedDate: game.lastCheckedDate,
        },
        update: {
          coins: game.coins,
          xp: game.xp,
          freezes: game.freezes,
          lastCheckedDate: game.lastCheckedDate,
        },
      });
      await tx.frozenDate.deleteMany({ where: { userId } });
      await tx.frozenDate.createMany({ data: frozenDates.map((date) => ({ userId, date })) });
      await tx.claimedMilestone.deleteMany({ where: { userId } });
      await tx.claimedMilestone.createMany({ data: claimed });
    });
  } catch (error) {
    if (error instanceof RevisionConflict) {
      res.status(409).json({
        error: 'Versão desatualizada: o servidor tem dados mais novos',
        server: await loadSnapshot(userId),
      });
      return;
    }
    throw error;
  }

  res.json(await loadSnapshot(userId));
});