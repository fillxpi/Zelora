import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const stamp = Date.now();
const emailA = `jogo-a-${stamp}@zelora.test`;
const emailB = `jogo-b-${stamp}@zelora.test`;
const password = 'senha12345';
let tokenA = '';
let tokenB = '';

const bearer = (token: string) => `Bearer ${token}`;

const emptyState = {
  coins: 0,
  xp: 0,
  freezes: 0,
  frozenDates: [],
  lastCheckedDate: null,
  claimedMilestones: [],
};

const fullState = {
  coins: 120,
  xp: 85,
  freezes: 1,
  frozenDates: ['2026-11-10', '2026-11-12'],
  lastCheckedDate: '2026-11-18',
  claimedMilestones: ['g1:m25', 'g1:m50'],
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

describe('estado do jogo', () => {
  it('recusa acesso sem token', async () => {
    const res = await request(app).get('/game');
    expect(res.status).toBe(401);
  });

  it('devolve o estado zerado para um usuário novo', async () => {
    const res = await request(app).get('/game').set('Authorization', bearer(tokenA));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(emptyState);
  });

  it('salva e devolve o estado completo', async () => {
    const put = await request(app).put('/game').set('Authorization', bearer(tokenA)).send(fullState);
    expect(put.status).toBe(200);
    expect(put.body).toEqual(fullState);

    const get = await request(app).get('/game').set('Authorization', bearer(tokenA));
    expect(get.body).toEqual(fullState);
  });

  it('substitui o estado anterior ao salvar de novo', async () => {
    const newState = {
      coins: 10,
      xp: 85,
      freezes: 0,
      frozenDates: [],
      lastCheckedDate: '2026-11-19',
      claimedMilestones: ['g1:m25'],
    };
    const put = await request(app).put('/game').set('Authorization', bearer(tokenA)).send(newState);
    expect(put.status).toBe(200);

    const get = await request(app).get('/game').set('Authorization', bearer(tokenA));
    expect(get.body).toEqual(newState);
  });

  it('ignora datas e marcos repetidos', async () => {
    const res = await request(app)
      .put('/game')
      .set('Authorization', bearer(tokenA))
      .send({
        ...fullState,
        frozenDates: ['2026-11-10', '2026-11-10'],
        claimedMilestones: ['g1:m25', 'g1:m25'],
      });
    expect(res.status).toBe(200);
    expect(res.body.frozenDates).toEqual(['2026-11-10']);
    expect(res.body.claimedMilestones).toEqual(['g1:m25']);
  });

  it('recusa moedas negativas', async () => {
    const res = await request(app)
      .put('/game')
      .set('Authorization', bearer(tokenA))
      .send({ ...fullState, coins: -5 });
    expect(res.status).toBe(400);
  });

  it('recusa data inválida', async () => {
    const res = await request(app)
      .put('/game')
      .set('Authorization', bearer(tokenA))
      .send({ ...fullState, lastCheckedDate: '2026-02-31' });
    expect(res.status).toBe(400);
  });

  it('recusa marco fora do formato idDaMeta:idDoMarco', async () => {
    const res = await request(app)
      .put('/game')
      .set('Authorization', bearer(tokenA))
      .send({ ...fullState, claimedMilestones: ['semdoispontos'] });
    expect(res.status).toBe(400);
  });

  it('cada usuário tem o seu próprio estado', async () => {
    const res = await request(app).get('/game').set('Authorization', bearer(tokenB));
    expect(res.body).toEqual(emptyState);
  });
});