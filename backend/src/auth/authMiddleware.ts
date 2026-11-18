import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export type AuthRequest = Request & { userId?: string };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    if (typeof payload === 'string' || !payload.sub) {
      throw new Error('Token inválido');
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}