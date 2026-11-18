import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const stamp = Date.now();
const emailA = `habitos-a-${stamp}@zelora.test`;
const emailB = `habitos-b-${stamp}@zelora.test`;
const password = 'senha12345';
let tokenA = '';
let tokenB = '';

const bearer = (token: string) => `Bearer ${token}`;

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

describe('hábitos', () => {
  it('recusa acesso sem token', async () => {
    const res = await request(app).get('/habits');
    expect(res.status).toBe(401);
  });

  it('cria um hábito com o id gerado pelo app', async () => {
    const res = await request(app)
      .post('/habits')
      .set('Authorization', bearer(tokenA))
      .send({ id: 'h1', title: 'Beber água' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'h1', title: 'Beber água', completedDates: [] });
  });

  it('recusa id repetido para o mesmo usuário', async () => {
    const res = await request(app)
      .post('/habits')
      .set('Authorization', bearer(tokenA))
      .send({ id: 'h1', title: 'Outro' });
    expect(res.status).toBe(409);
  });

  it('recusa título vazio', async () => {
    const res = await request(app)
      .post('/habits')
      .set('Authorization', bearer(tokenA))
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('marca a conclusão (duas vezes, sem duplicar) e lista', async () => {
    const url = '/habits/h1/completions/2026-11-18';
    const first = await request(app).put(url).set('Authorization', bearer(tokenA));
    const second = await request(app).put(url).set('Authorization', bearer(tokenA));
    expect(first.status).toBe(204);
    expect(second.status).toBe(204);

    const list = await request(app).get('/habits').set('Authorization', bearer(tokenA));
    expect(list.status).toBe(200);
    expect(list.body).toEqual([
      { id: 'h1', title: 'Beber água', completedDates: ['2026-11-18'] },
    ]);
  });

  it('recusa data inválida', async () => {
    const res = await request(app)
      .put('/habits/h1/completions/2026-02-31')
      .set('Authorization', bearer(tokenA));
    expect(res.status).toBe(400);
  });

  it('desmarca a conclusão', async () => {
    const res = await request(app)
      .delete('/habits/h1/completions/2026-11-18')
      .set('Authorization', bearer(tokenA));
    expect(res.status).toBe(204);

    const list = await request(app).get('/habits').set('Authorization', bearer(tokenA));
    expect(list.body[0].completedDates).toEqual([]);
  });

  it('outro usuário não vê nem altera hábitos alheios', async () => {
    const list = await request(app).get('/habits').set('Authorization', bearer(tokenB));
    expect(list.body).toEqual([]);

    const put = await request(app)
      .put('/habits/h1/completions/2026-11-18')
      .set('Authorization', bearer(tokenB));
    expect(put.status).toBe(404);

    const del = await request(app).delete('/habits/h1').set('Authorization', bearer(tokenB));
    expect(del.status).toBe(404);
  });

  it('dois usuários podem ter hábitos com o mesmo id', async () => {
    const res = await request(app)
      .post('/habits')
      .set('Authorization', bearer(tokenB))
      .send({ id: 'h1', title: 'Meditar' });
    expect(res.status).toBe(201);

    const listA = await request(app).get('/habits').set('Authorization', bearer(tokenA));
    expect(listA.body[0].title).toBe('Beber água');
  });

  it('remove o hábito', async () => {
    const res = await request(app).delete('/habits/h1').set('Authorization', bearer(tokenA));
    expect(res.status).toBe(204);

    const list = await request(app).get('/habits').set('Authorization', bearer(tokenA));
    expect(list.body).toEqual([]);
  });
});