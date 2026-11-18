import { Request, Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../auth/authMiddleware';
import { isValidDate } from '../lib/dates';
import { prisma } from '../lib/prisma';

export const gameRouter = Router();

gameRouter.use(requireAuth);

const dateString = z.string().refine(isValidDate, 'Data inválida (use YYYY-MM-DD)');

const claimedKey = z
  .string()
  .max(250)
  .refine((value) => {
    const parts = value.split(':');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }, "Use o formato 'idDaMeta:idDoMarco'");

const gameStateSchema = z.object({
  coins: z.number().int().min(0).max(1_000_000_000),
  xp: z.number().int().min(0).max(1_000_000_000),
  freezes: z.number().int().min(0).max(100),
  frozenDates: z.array(dateString).max(3650),
  lastCheckedDate: dateString.nullable(),
  claimedMilestones: z.array(claimedKey).max(5000),
});

function currentUserId(req: Request): string {
  return (req as AuthRequest).userId as string;
}

export async function loadGameState(userId: string) {
  const [state, frozen, claimed] = await Promise.all([
    prisma.gameState.findUnique({ where: { userId } }),
    prisma.frozenDate.findMany({ where: { userId } }),
    prisma.claimedMilestone.findMany({ where: { userId } }),
  ]);

  return {
    coins: state?.coins ?? 0,
    xp: state?.xp ?? 0,
    freezes: state?.freezes ?? 0,
    frozenDates: frozen.map((f) => f.date).sort(),
    lastCheckedDate: state?.lastCheckedDate ?? null,
    claimedMilestones: claimed.map((c) => `${c.goalId}:${c.milestoneId}`).sort(),
  };
}

gameRouter.get('/', async (req, res) => {
  res.json(await loadGameState(currentUserId(req)));
});

gameRouter.put('/', async (req, res) => {
  const parsed = gameStateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Estado do jogo inválido' });
    return;
  }

  const userId = currentUserId(req);
  const { coins, xp, freezes, lastCheckedDate } = parsed.data;
  const frozenDates = [...new Set(parsed.data.frozenDates)];
  const claimed = [...new Set(parsed.data.claimedMilestones)].map((key) => {
    const [goalId, milestoneId] = key.split(':');
    return { userId, goalId, milestoneId };
  });

  await prisma.$transaction([
    prisma.gameState.upsert({
      where: { userId },
      create: { userId, coins, xp, freezes, lastCheckedDate },
      update: { coins, xp, freezes, lastCheckedDate },
    }),
    prisma.frozenDate.deleteMany({ where: { userId } }),
    prisma.frozenDate.createMany({ data: frozenDates.map((date) => ({ userId, date })) }),
    prisma.claimedMilestone.deleteMany({ where: { userId } }),
    prisma.claimedMilestone.createMany({ data: claimed }),
  ]);

  res.json(await loadGameState(userId));
});