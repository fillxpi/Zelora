import express from 'express';
import { authRouter } from './auth/authRoutes';
import { habitRouter } from './habits/habitRoutes';
import { goalRouter } from './goals/goalRoutes';
import { gameRouter } from './game/gameRoutes';
import { syncRouter } from './sync/syncRoutes';
export const app = express();

app.use(express.json({ limit: '5mb' }));
app.use('/auth', authRouter);
app.use('/habits', habitRouter);
app.use('/goals', goalRouter);
app.use('/game', gameRouter);
app.use('/sync', syncRouter);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});