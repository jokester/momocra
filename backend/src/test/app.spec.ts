import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { INestApplication } from '@nestjs/common';
import { GoogleOAuthResponse, GoogleOAuthService } from '../user/google-oauth.service';
import { MockData, TestDeps } from './test-deps';
import { right, isLeft } from 'fp-ts/lib/Either';
import { TypeORMConnection } from '../db/typeorm-connection.provider';
import { JwtService } from '@nestjs/jwt';
import { getDebugLogger } from '../util/get-debug-logger';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { AuthController } from '../user/auth.controller';
import { UserController } from '../user/user.controller';
import { EntropyService } from '../deps/entropy.service';

const logger = getDebugLogger(__filename);

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userService: UserService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TypeORMConnection)
      .useValue(TestDeps.testConnection)
      .overrideProvider(JwtService)
      .useValue(TestDeps.mockedJwtService)
      .overrideProvider(EntropyService)
      .useValue(TestDeps.mockedEntropy)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = await moduleFixture.resolve(JwtService);
    userService = await moduleFixture.resolve(UserService);

    await app.init();
    await TestDeps.clearTestDatabase();

    let nanoIdSeq = 0;

    jest.spyOn(TestDeps.mockedEntropy, 'createNanoId').mockImplementation(() => `nanoid-${++nanoIdSeq}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe(AuthController, () => {
    it('POST /auth/oauth/google returns jwtToken on succeed', async () => {
      jest
        .spyOn(GoogleOAuthService.prototype, 'auth')
        .mockResolvedValue(right<string, GoogleOAuthResponse>(MockData.googleOAuthResponseValid));

      const res = await request(app.getHttpServer())
        .post('/auth/oauth/google')
        .send({ code: '123', redirectUrl: '456' })
        .expect(200);

      const jwtToken = JSON.parse(res.text).jwtToken;
      expect(jwtToken).toBeTruthy();

      const decoded = await jwtService.decode(jwtToken);
      logger('decoded', decoded);

      await jwtService.verifyAsync(jwtToken);

      const { body } = await request(app.getHttpServer())
        .get('/user/self')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(body).toMatchSnapshot('GET /user/self');

      const { body: body2 } = await request(app.getHttpServer())
        .get(`/user/id/${body.shortId}`)
        .expect(200);

      expect(body2).toEqual(body);
    });

    it('POST /auth/oauth/google return 400 on malformed request', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/google')
        .send({ code: '123', redirectUrl: '' })
        .expect(400);
    });

    it('POST /auth/oauth/google return 400 on auth error', async () => {
      jest
        .spyOn(GoogleOAuthService.prototype, 'auth')
        .mockResolvedValue(right<string, GoogleOAuthResponse>(MockData.googleOAuthResponseEmailUnverified));

      await request(app.getHttpServer())
        .post('/auth/oauth/google')
        .send({ code: '123', redirectUrl: 'someUrl' })
        .expect(400);
    });
  });

  describe(UserController, () => {
    it('GET /user/:shortId returns 404', async () => {
      await request(app.getHttpServer())
        .get('/user/__s')
        .expect(404);
    });

    it('GET /user/self without auth return 400', async () => {
      await request(app.getHttpServer())
        .get('/user/self')
        .expect(400);
    });
  });
});
