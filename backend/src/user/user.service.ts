import { Inject, Injectable } from '@nestjs/common';
import { getDebugLogger } from '../util/get-debug-logger';
import { Either, isLeft, left, right } from 'fp-ts/lib/Either';
import { GoogleOAuthResponse } from './google-oauth.service';
import { TypeORMConnection } from '../db/typeorm-connection.provider';
import { Connection, DeepPartial } from 'typeorm';
import { OAuthAccount, OAuthProvider } from '../db/entities/oauth-account';
import { UserAccount } from '../db/entities/user-account';
import { EntropyService } from '../deps/entropy.service';
import { JwtService } from '@nestjs/jwt';
import { fromNullable, Option } from 'fp-ts/lib/Option';
import { getSomeOrThrow } from '../util/fpts-getter';
import { absent } from '../util/absent';
import { Sanitize } from '../util/input-santinizer';
import { randomAlphaNum } from '../ts-commonutil/text/random-string';

const logger = getDebugLogger(__filename);

interface JwtTokenPayload {
  shortId: string;
}

export interface ResolvedUser {
  shortId: string;
  nickName: string;
  avatarUrl?: string;
}

@Injectable()
export class UserService {
  constructor(
    @Inject(TypeORMConnection) private conn: Connection,
    private jwtService: JwtService,
    private entropy: EntropyService,
  ) {}

  async find(userId: number): Promise<Option<UserAccount>> {
    const existedUser = await this.conn.getRepository(UserAccount).findOne({ userId });

    return fromNullable(existedUser);
  }

  async findByShortId(shortId: string): Promise<Option<UserAccount>> {
    const existedUser = await this.conn.getRepository(UserAccount).findOne({ shortId });

    return fromNullable(existedUser);
  }

  async findUserWithJwtToken(
    jwtToken: string,
    currentTimestamp = this.entropy.now(),
  ): Promise<Either<string, UserAccount>> {
    let payload: JwtTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtTokenPayload>(jwtToken, {
        clockTimestamp: currentTimestamp / 1e3,
      });
    } catch (e) {
      return left('invalid token');
    }

    const user = await this.conn.getRepository(UserAccount).findOne({ shortId: payload.shortId });
    if (!user) {
      throw new Error('user not found');
    }
    return right(user);
  }

  async signUpWithEmail(email: string, password: string): Promise<Either<string, UserAccount>> {
    const sanitizedEmail = Sanitize.email(email),
      sanitizedPass = Sanitize.pass(password);

    // logger('signUpWithEmail params', sanitizedEmail, sanitizedPass);

    if (isLeft(sanitizedEmail)) return sanitizedEmail;
    if (isLeft(sanitizedPass)) return sanitizedPass;

    const user = new UserAccount({
      shortId: this.entropy.createNanoId(),
      userMeta: {},
      emailId: sanitizedEmail.right,
      passwordHash: await this.entropy.bcryptHash(sanitizedPass.right),
    });

    return this.conn
      .getRepository(UserAccount)
      .save(user)
      .then(right, err => {
        logger('UserService#signUpWithEmail error creating', err);
        return left('error creating user');
      });
  }

  async resolveUser(userAccount: UserAccount): Promise<ResolvedUser> {
    const oauthAccounts = await this.conn.getRepository(OAuthAccount).find({ userId: userAccount.userId });
    const resolved: ResolvedUser = {
      shortId: userAccount.shortId,
      nickName: userAccount.userMeta.nickName ?? `(not set)`,
      avatarUrl: userAccount.userMeta.avatarUrl,
    };

    for (const o of oauthAccounts) {
      if (o.isGoogle() && !resolved.avatarUrl) {
        resolved.avatarUrl = o.userInfo.picture || undefined;
      }
    }

    return resolved;
  }

  createJwtTokenForUser(user: UserAccount): Promise<string> {
    return this.jwtService.signAsync({ shortId: user.shortId } as JwtTokenPayload);
  }

  async updateUserMeta(authedUser: UserAccount, meta: {}): Promise<UserAccount> {
    const user = getSomeOrThrow(await this.findByShortId(authedUser.shortId), () => new Error('user not available'));

    user.setMeta(meta);

    await this.conn.getRepository(UserAccount).save(user);
    return user;
  }

  async findOrCreateWithGoogleOAuth(oauthResponse: GoogleOAuthResponse): Promise<Either<string, UserAccount>> {
    if (!(oauthResponse?.userInfo?.verified_email && oauthResponse.userInfo.email)) {
      return left('email must be verified');
    }
    const oAuthAccountRepo = this.conn.getRepository(OAuthAccount);

    const existedOAuth = await oAuthAccountRepo.findOne({ externalId: oauthResponse.credentials.tokens.id_token! });

    // return existed user
    if (existedOAuth) {
      const [user = absent('user by existedOAuth')] = await this.conn
        .getRepository(UserAccount)
        .find({ userId: existedOAuth.userId });

      // update oauth account
      Object.assign(existedOAuth, {
        credentials: oauthResponse.credentials,
        userInfo: oauthResponse.userInfo,
      });

      await oAuthAccountRepo.save(existedOAuth as DeepPartial<OAuthAccount>);

      return right(user);
    }

    const sanitizedEmail = Sanitize.email(oauthResponse.userInfo.email);

    if (isLeft(sanitizedEmail)) return sanitizedEmail;

    const randomHash = await this.entropy.bcryptHash(randomAlphaNum(16));

    // try create
    const res = await this.conn.transaction(async entityManager => {
      const userAccount = await entityManager.save(
        new UserAccount({
          shortId: this.entropy.createNanoId(),
          userMeta: {},
          emailId: sanitizedEmail.right,
          passwordHash: randomHash,
        }),
      );
      const oauthAccount = await entityManager.save(
        new OAuthAccount({
          provider: OAuthProvider.googleOAuth2,
          userId: userAccount.userId,
          externalId: oauthResponse.credentials.tokens.id_token!,
          credentials: oauthResponse.credentials,
          userInfo: oauthResponse.userInfo,
        }),
      );

      return right(userAccount);
    });

    return res;
  }
}
