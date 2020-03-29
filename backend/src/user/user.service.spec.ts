import { UserService } from './user.service';
import { MockData, TestDeps } from '../../test/test-deps';
import { UserAccount } from '../db/entities/user-account';
import { OAuthAccount } from '../db/entities/oauth-account';
import { fold } from 'fp-ts/lib/Either';

describe(UserService, () => {
  let testee: UserService;

  beforeEach(async () => {
    const conn = (await TestDeps.testConnection).createEntityManager();
    await conn.clear(UserAccount);
    await conn.clear(OAuthAccount);
    testee = new UserService(await TestDeps.testConnection, TestDeps.entropy);
  });

  const foldUser = fold<string, UserAccount, Partial<UserAccount & { _error: string }>>(
    l => ({ _error: l }),
    r => r,
  );

  describe('create user with google outh', () => {
    it('does create with proper auth info', async () => {
      const created1 = foldUser(await testee.findOrCreateWithGoogleOAuth(MockData.googleOAuthResponseValid));

      expect(created1?.userId).toBeTruthy();
      expect(created1?.shortId).toBeTruthy();

      const created2 = foldUser(await testee.findOrCreateWithGoogleOAuth(MockData.googleOAuthResponseValid));

      expect(created2).toEqual(created1);
    });

    it('refuse to create user when email not verified', async () => {
      const testee = new UserService(await TestDeps.testConnection, TestDeps.entropy);

      const created1 = foldUser(await testee.findOrCreateWithGoogleOAuth(MockData.googleOAuthResponseEmailUnverified));

      expect(created1?._error).toEqual('email must be verified');
    });
  });
});
