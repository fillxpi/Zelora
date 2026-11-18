import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const stamp = Date.now();
const emailA = `sync-a-${stamp}@zelora.test`;
const emailB = `sync-b-${stamp}@zelora.test`;
const password = 'senha12345';
let tokenA = '';
let tokenB = '';

const bearer = (token: string) => `Bearer ${token}`;
const getSync = (token: string) => request(app).get('/sync').set('Authorization', bearer(token));
const putSync = (token: string, body: object) =>
  request(app).put('/sync').set('Authorization', bearer(token)).send(body);

const emptyGame = {
  coins: 0,
  xp: 0,
  freezes: 0,
  frozenDates: [],
  lastCheckedDate: null,
  claimedMilestones: [],
};

const content = {
  habits: [
    { id: 'h2', title: 'Estudar', completedDates: ['2026-11-17', '2026-11-18'] },
    { id: 'h1', title: 'Ler', completedDates: ['2026-11-18'] },
  ],
  goals: [
    {
      id: 'g1',
      title: 'Ler 30 dias',
      habitIds: ['h1', 'h2'],
      target: 30,
      createdAt: '2026-11-18',
      milestones: [
        { id: 'm25', title: 'Começo', requiredCompletions: 8 },
        { id: 'm50', title: 'Metade', requiredCompletions: 15 },
      ],
    },
  ],
  game: {
    coins: 120,
    xp: 85,
    freezes: 1,
    frozenDates: ['2026-11-10'],
    lastCheckedDate: '2026-11-18',
    claimedMilestones: ['g1:m25'],
  },
};

beforeAll(async () => {
  const a = await request(app).post('/auth/register').send({ email: emailA, password });
  tokenA = a.body.token;
  const b = await request(app).post('/auth/register').send({ email: emailB, password });
  tokenB = b.body.token;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  await prisma.$disconnect();
});

describe('sincronização', () => {
  it('recusa acesso sem token', async () => {
    const res = await request(app).get('/sync');
    expect(res.status).toBe(401);
  });

  it('devolve tudo vazio e versão 0 para usuário novo', async () => {
    const res = await getSync(tokenA);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ revision: 0, habits: [], goals: [], game: emptyGame });
  });

  it('salva o estado completo, mantém a ordem e sobe a versão', async () => {
    const res = await putSync(tokenA, { baseRevision: 0, ...content });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ revision: 1, ...content });

    const get = await getSync(tokenA);
    expect(get.body).toEqual({ revision: 1, ...content });
  });

  it('responde 409 com os dados do servidor quando a versão está velha', async () => {
    const res = await putSync(tokenA, { baseRevision: 0, ...content });
    expect(res.status).toBe(409);
    expect(res.body.server.revision).toBe(1);
    expect(res.body.server.habits).toHaveLength(2);
  });

  it('substitui tudo quando a versão está certa', async () => {
    const newContent = {
      habits: [{ id: 'h1', title: 'Ler', completedDates: ['2026-11-19'] }],
      goals: [],
      game: { ...content.game, coins: 5, frozenDates: [], claimedMilestones: [] },
    };
    const res = await putSync(tokenA, { baseRevision: 1, ...newContent });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ revision: 2, ...newContent });

    const get = await getSync(tokenA);
    expect(get.body).toEqual({ revision: 2, ...newContent });
  });

  it('recusa meta ligada a hábito que não existe', async () => {
    const res = await putSync(tokenA, {
      baseRevision: 2,
      ...content,
      goals: [{ ...content.goals[0], habitIds: ['nao-existe'] }],
    });
    expect(res.status).toBe(400);
  });

  it('recusa hábitos com id repetido', async () => {
    const res = await putSync(tokenA, {
      baseRevision: 2,
      ...content,
      habits: [content.habits[0], content.habits[0]],
      goals: [],
    });
    expect(res.status).toBe(400);
  });

  it('recusa data inválida', async () => {
    const res = await putSync(tokenA, {
      baseRevision: 2,
      ...content,
      habits: [{ id: 'h1', title: 'Ler', completedDates: ['2026-02-31'] }],
      goals: [],
    });
    expect(res.status).toBe(400);
  });

  it('cada usuário tem a sua própria versão e os seus dados', async () => {
    const res = await getSync(tokenB);
    expect(res.body).toEqual({ revision: 0, habits: [], goals: [], game: emptyGame });
  });
});