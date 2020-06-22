import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestDeps } from './test-deps';
import { JwtService } from '@nestjs/jwt';
import { getDebugLogger } from '../util/get-debug-logger';
import { UserService } from '../user/user.service';
import { MomoUserController } from '../momo/momo-user.controller';
import { getSomeOrThrow } from '../util/fpts-getter';
import { absent } from '../util/absent';
import { buildTesteeAppBundle } from './test-app-factory';

const logger = getDebugLogger(__filename);

describe('AppController (e2e)', () => {
  const { testBundle, bundledAfterAll, bundledBeforeAll } = buildTesteeAppBundle();
  let app: INestApplication;
  let jwtService: JwtService;
  let userService: UserService;

  beforeAll(async () => {
    await bundledBeforeAll();
    app = testBundle.app;
    jwtService = testBundle.jwtService;
    userService = testBundle.userService;
  });

  beforeEach(TestDeps.resetTestDB);

  afterAll(bundledAfterAll);

  describe.skip(MomoUserController, () => {
    it('GET /user/self with proper auth returns resolved user', async () => {
      const userAccount1 = getSomeOrThrow(await userService.findUser({ userId: '' }), () => absent('user by shortId'));

      const jwtToken = await userService.createJwtTokenForUser(userAccount1);

      await request(app.getHttpServer()).get('/user/self').set('Authorization', `Bearer ${jwtToken}`).expect(200);

      await request(app.getHttpServer()).get('/momo/user/self').set('Authorization', `Bearer ${jwtToken}`).expect(200);
    });

    it('PUT /user/self updated resolved user', async () => {
      const userAccount1 = getSomeOrThrow(await userService.findUser({ userId: '' }), () => absent('user by shortId'));

      const jwtToken = await userService.createJwtTokenForUser(userAccount1);

      const { body } = await request(app.getHttpServer())
        .put('/user/self')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ nickName: 'samuel mf jackson', avatarUrl: 'https://corp.com/a.gif' })
        .expect(200);

      expect(body).toMatchSnapshot('updated user');

      const { body: body2 } = await request(app.getHttpServer())
        .get('/user/self')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(body2).toEqual(body);
    });
  });
});
