import { randomUUID } from 'crypto';
import { Request, Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../auth/authMiddleware';
import { isValidDate } from '../lib/dates';
import { prisma } from '../lib/prisma';

export const goalRouter = Router();

goalRouter.use(requireAuth);

const milestoneSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(100),
  requiredCompletions: z.number().int().min(1).max(100000),
});

const createSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(100),
  target: z.number().int().min(1).max(100000),
  createdAt: z.string().refine(isValidDate, 'Data inválida (use YYYY-MM-DD)').optional(),
  habitIds: z.array(z.string().min(1).max(100)).max(200).default([]),
  milestones: z.array(milestoneSchema).max(50).default([]),
});

const goalInclude = { habitLinks: true, milestones: true };

function currentUserId(req: Request): string {
  return (req as AuthRequest).userId as string;
}

function toApi(goal: {
  id: string;
  title: string;
  target: number;
  createdAt: string;
  habitLinks: { habitId: string }[];
  milestones: { id: string; title: string; requiredCompletions: number }[];
}) {
  return {
    id: goal.id,
    title: goal.title,
    habitIds: goal.habitLinks.map((link) => link.habitId).sort(),
    target: goal.target,
    createdAt: goal.createdAt,
    milestones: goal.milestones
      .map((m) => ({ id: m.id, title: m.title, requiredCompletions: m.requiredCompletions }))
      .sort((a, b) => a.requiredCompletions - b.requiredCompletions),
  };
}

goalRouter.get('/', async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: currentUserId(req) },
    include: goalInclude,
  });
  res.json(goals.map(toApi));
});

goalRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados da meta inválidos' });
    return;
  }

  const userId = currentUserId(req);
  const id = parsed.data.id ?? randomUUID();
  const createdAt = parsed.data.createdAt ?? new Date().toISOString().slice(0, 10);
  const habitIds = [...new Set(parsed.data.habitIds)];
  const milestones = parsed.data.milestones.map((m) => ({ ...m, id: m.id ?? randomUUID() }));

  if (new Set(milestones.map((m) => m.id)).size !== milestones.length) {
    res.status(400).json({ error: 'Há marcos com id repetido' });
    return;
  }

  if (await prisma.goal.findUnique({ where: { userId_id: { userId, id } } })) {
    res.status(409).json({ error: 'Já existe uma meta com esse id' });
    return;
  }

  const habitsFound = await prisma.habit.count({ where: { userId, id: { in: habitIds } } });
  if (habitsFound !== habitIds.length) {
    res.status(400).json({ error: 'Algum hábito vinculado não existe' });
    return;
  }

  await prisma.$transaction([
    prisma.goal.create({
      data: { userId, id, title: parsed.data.title, target: parsed.data.target, createdAt },
    }),
    prisma.goalHabit.createMany({
      data: habitIds.map((habitId) => ({ userId, goalId: id, habitId })),
    }),
    prisma.milestone.createMany({
      data: milestones.map((m) => ({
        userId,
        goalId: id,
        id: m.id,
        title: m.title,
        requiredCompletions: m.requiredCompletions,
      })),
    }),
  ]);

  const goal = await prisma.goal.findUniqueOrThrow({
    where: { userId_id: { userId, id } },
    include: goalInclude,
  });
  res.status(201).json(toApi(goal));
});

goalRouter.delete('/:id', async (req, res) => {
  const result = await prisma.goal.deleteMany({
    where: { userId: currentUserId(req), id: req.params.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Meta não encontrada' });
    return;
  }
  res.status(204).send();
});