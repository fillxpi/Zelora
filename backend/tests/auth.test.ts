import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const email = `teste-${Date.now()}@zelora.test`;
const password = 'senha12345';
let token = '';

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe('autenticação', () => {
  it('cadastra um usuário e devolve token', async () => {
    const res = await request(app).post('/auth/register').send({ email, password });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('não cadastra o mesmo email duas vezes', async () => {
    const res = await request(app).post('/auth/register').send({ email, password });
    expect(res.status).toBe(409);
  });

  it('recusa senha curta', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'outro@zelora.test', password: '123' });
    expect(res.status).toBe(400);
  });

  it('faz login com a senha certa', async () => {
    const res = await request(app).post('/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  it('recusa login com senha errada', async () => {
    const res = await request(app).post('/auth/login').send({ email, password: 'senhaerrada1' });
    expect(res.status).toBe(401);
  });

  it('GET /auth/me com token devolve o usuário', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('GET /auth/me sem token devolve 401', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});