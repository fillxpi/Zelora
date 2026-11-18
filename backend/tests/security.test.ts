import request from 'supertest';
import { app } from '../src/app';

describe('segurança', () => {
  it('envia cabeçalhos de segurança e esconde o x-powered-by', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});