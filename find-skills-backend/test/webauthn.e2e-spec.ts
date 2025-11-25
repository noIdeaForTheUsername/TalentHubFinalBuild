import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('WebAuthn (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/webauthn/register/options returns options for known user', async () => {
    const res = await request(app.getHttpServer()).post('/api/webauthn/register/options').send({ login: 'janek' });
    if (![200, 201].includes(res.status)) throw new Error(`unexpected status ${res.status}`);
    expect(res.body).toBeDefined();
    expect(res.body.challenge).toBeDefined();
  });

  it('POST /api/webauthn/login/options returns options (may be empty allowCredentials)', async () => {
    const res = await request(app.getHttpServer()).post('/api/webauthn/login/options').send({ login: 'janek' });
    if (![200, 201].includes(res.status)) throw new Error(`unexpected status ${res.status}`);
    expect(res.body).toBeDefined();
    expect(res.body.challenge).toBeDefined();
  });
});
