import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from './authMiddleware';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function createToken(userId: string) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
}

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Email inválido ou senha com menos de 8 caracteres' });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email já cadastrado' });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  res.status(201).json({
    token: createToken(user.id),
    user: { id: user.id, email: user.email },
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Email ou senha em formato inválido' });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

  if (!user || !passwordOk) {
    res.status(401).json({ error: 'Email ou senha incorretos' });
    return;
  }

  res.json({
    token: createToken(user.id),
    user: { id: user.id, email: user.email },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;
  const user = await prisma.user.findUnique({ where: { id: userId as string } });

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  res.json({ id: user.id, email: user.email });
});