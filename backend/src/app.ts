import express from 'express';
import { authRouter } from './auth/authRoutes';
import { habitRouter } from './habits/habitRoutes';
export const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/habits', habitRouter);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});