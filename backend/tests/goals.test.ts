import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const stamp = Date.now();
const emailA = `metas-a-${stamp}@zelora.test`;
const emailB = `metas-b-${stamp}@zelora.test`;
const password = 'senha12345';
let tokenA = '';
let tokenB = '';

const bearer = (token: string) => `Bearer ${token}`;

const validGoal = {
  id: 'g1',
  title: 'Ler 30 dias',
  target: 30,
  createdAt: '2026-11-18',
  habitIds: ['h1', 'h2'],
  milestones: [
    { id: 'm50', title: 'Metade', requiredCompletions: 15 },
    { id: 'm25', title: 'Começo', requiredCompletions: 8 },
  ],
};

beforeAll(async () => {
  const a = await request(app).post('/auth/register').send({ email: emailA, password });
  tokenA = a.body.token;
  const b = await request(app).post('/auth/register').send({ email: emailB, password });
  tokenB = b.body.token;

  await request(app).post('/habits').set('Authorization', bearer(tokenA)).send({ id: 'h1', title: 'Ler' });
  await request(app).post('/habits').set('Authorization', bearer(tokenA)).send({ id: 'h2', title: 'Estudar' });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  await prisma.$disconnect();
});

describe('metas', () => {
  it('recusa acesso sem token', async () => {
    const res = await request(app).get('/goals');
    expect(res.status).toBe(401);
  });

  it('cria meta com hábitos e marcos', async () => {
    const res = await request(app).post('/goals').set('Authorization', bearer(tokenA)).send(validGoal);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'g1',
      title: 'Ler 30 dias',
      habitIds: ['h1', 'h2'],
      target: 30,
      createdAt: '2026-11-18',
      milestones: [
        { id: 'm25', title: 'Começo', requiredCompletions: 8 },
        { id: 'm50', title: 'Metade', requiredCompletions: 15 },
      ],
    });
  });

  it('lista as metas do usuário', async () => {
    const res = await request(app).get('/goals').set('Authorization', bearer(tokenA));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('g1');
  });

  it('recusa id repetido', async () => {
    const res = await request(app).post('/goals').set('Authorization', bearer(tokenA)).send(validGoal);
    expect(res.status).toBe(409);
  });

  it('recusa hábito que não existe', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', bearer(tokenA))
      .send({ ...validGoal, id: 'g2', habitIds: ['nao-existe'] });
    expect(res.status).toBe(400);
  });

  it('recusa total de conclusões zero', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', bearer(tokenA))
      .send({ ...validGoal, id: 'g2', target: 0 });
    expect(res.status).toBe(400);
  });

  it('recusa data de criação inválida', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', bearer(tokenA))
      .send({ ...validGoal, id: 'g2', createdAt: '2026-02-31' });
    expect(res.status).toBe(400);
  });

  it('recusa marcos com id repetido', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', bearer(tokenA))
      .send({
        ...validGoal,
        id: 'g2',
        milestones: [
          { id: 'm1', title: 'A', requiredCompletions: 5 },
          { id: 'm1', title: 'B', requiredCompletions: 10 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('outro usuário não vê, não apaga e não vincula hábitos alheios', async () => {
    const list = await request(app).get('/goals').set('Authorization', bearer(tokenB));
    expect(list.body).toEqual([]);

    const del = await request(app).delete('/goals/g1').set('Authorization', bearer(tokenB));
    expect(del.status).toBe(404);

    const link = await request(app)
      .post('/goals')
      .set('Authorization', bearer(tokenB))
      .send({ ...validGoal, id: 'g9', habitIds: ['h1'] });
    expect(link.status).toBe(400);
  });

  it('remover um hábito tira ele da meta, sem apagar a meta', async () => {
    const del = await request(app).delete('/habits/h1').set('Authorization', bearer(tokenA));
    expect(del.status).toBe(204);

    const list = await request(app).get('/goals').set('Authorization', bearer(tokenA));
    expect(list.body[0].habitIds).toEqual(['h2']);
  });

  it('remove a meta', async () => {
    const res = await request(app).delete('/goals/g1').set('Authorization', bearer(tokenA));
    expect(res.status).toBe(204);

    const list = await request(app).get('/goals').set('Authorization', bearer(tokenA));
    expect(list.body).toEqual([]);
  });
});