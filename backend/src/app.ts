import express from 'express';
import { authRouter } from './auth/authRoutes';
import { habitRouter } from './habits/habitRoutes';
import { goalRouter } from './goals/goalRoutes';
import { gameRouter } from './game/gameRoutes';
export const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/habits', habitRouter);
app.use('/goals', goalRouter);
app.use('/game', gameRouter);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});