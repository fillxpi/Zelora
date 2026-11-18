import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './auth/authRoutes';
import { habitRouter } from './habits/habitRoutes';
import { goalRouter } from './goals/goalRoutes';
import { gameRouter } from './game/gameRoutes';
import { syncRouter } from './sync/syncRoutes';
export const app = express();

// Atrás do proxy da hospedagem, para enxergar o IP real de quem acessa.
app.set('trust proxy', 1);

app.use(helmet());

// Limita tentativas de login/cadastro (desligado nos testes automatizados).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
  skip: () => process.env.NODE_ENV === 'test',
});

app.use(express.json({ limit: '5mb' }));
app.use('/auth', authLimiter, authRouter);
app.use('/habits', habitRouter);
app.use('/goals', goalRouter);
app.use('/game', gameRouter);
app.use('/sync', syncRouter);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});