import { randomUUID } from 'crypto';
import { Request, Router } from 'express';
import { z } from 'zod';
import { AuthRequest, requireAuth } from '../auth/authMiddleware';
import { isValidDate } from '../lib/dates';
import { prisma } from '../lib/prisma';

export const habitRouter = Router();

habitRouter.use(requireAuth);

const createSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  title: z.string().trim().min(1).max(100),
});

function currentUserId(req: Request): string {
  return (req as AuthRequest).userId as string;
}


function toApi(habit: { id: string; title: string; completions: { date: string }[] }) {
  return {
    id: habit.id,
    title: habit.title,
    completedDates: habit.completions.map((c) => c.date).sort(),
  };
}

function findHabit(userId: string, id: string) {
  return prisma.habit.findUnique({ where: { userId_id: { userId, id } } });
}

habitRouter.get('/', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: currentUserId(req) },
    include: { completions: true },
  });
  res.json(habits.map(toApi));
});

habitRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Título obrigatório (até 100 caracteres)' });
    return;
  }

  const userId = currentUserId(req);
  const id = parsed.data.id ?? randomUUID();

  if (await findHabit(userId, id)) {
    res.status(409).json({ error: 'Já existe um hábito com esse id' });
    return;
  }

  const habit = await prisma.habit.create({
    data: { userId, id, title: parsed.data.title },
    include: { completions: true },
  });
  res.status(201).json(toApi(habit));
});

habitRouter.delete('/:id', async (req, res) => {
  const result = await prisma.habit.deleteMany({
    where: { userId: currentUserId(req), id: req.params.id },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Hábito não encontrado' });
    return;
  }
  res.status(204).send();
});

habitRouter.put('/:id/completions/:date', async (req, res) => {
  const userId = currentUserId(req);
  const { id, date } = req.params;

  if (!isValidDate(date)) {
    res.status(400).json({ error: 'Data inválida (use YYYY-MM-DD)' });
    return;
  }
  if (!(await findHabit(userId, id))) {
    res.status(404).json({ error: 'Hábito não encontrado' });
    return;
  }

  await prisma.habitCompletion.upsert({
    where: { userId_habitId_date: { userId, habitId: id, date } },
    create: { userId, habitId: id, date },
    update: {},
  });
  res.status(204).send();
});

habitRouter.delete('/:id/completions/:date', async (req, res) => {
  const userId = currentUserId(req);
  const { id, date } = req.params;

  if (!isValidDate(date)) {
    res.status(400).json({ error: 'Data inválida (use YYYY-MM-DD)' });
    return;
  }
  if (!(await findHabit(userId, id))) {
    res.status(404).json({ error: 'Hábito não encontrado' });
    return;
  }

  await prisma.habitCompletion.deleteMany({ where: { userId, habitId: id, date } });
  res.status(204).send();
});