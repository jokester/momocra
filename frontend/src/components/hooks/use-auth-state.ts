import { useSingletons } from '../../internal/app-context';
import { useMemo } from 'react';
import { useObserved } from '../generic-hooks/use-observed';
import { ApiResponseSync } from '../../services/api/api-convention';
import { UserProfileDto } from '../../services/api-generated/models';
import { map } from 'rxjs/operators';
import { either } from 'fp-ts';
import { Observable } from 'rxjs';

export interface ExposedAuthState {
  user: null | UserProfileDto;
  pendingAuth: boolean;
}

export function useAuthState(): ExposedAuthState {
  const { auth } = useSingletons();
  const authState: Observable<null | ExposedAuthState> = useMemo(
    () =>
      auth.authed.pipe(
        map(
          (v: null | ApiResponseSync<UserProfileDto>) =>
            v &&
            either.fold(
              (l: unknown) => ({ pendingAuth: false, user: null }),
              (user: UserProfileDto) => ({ user, pendingAuth: false } as ExposedAuthState),
            )(v),
        ),
      ),
    [auth],
  );

  return useObserved(authState, null) || { pendingAuth: true, user: null };
}
