import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaEnrolmentGuard } from '../guards/mfa-enrolment.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { MFA_ENROLMENT_ALLOWED_KEY } from '../decorators/mfa-enrolment.decorator';

/**
 * The guard is what turns "privileged roles must enrol" from a policy into
 * something the API actually refuses to serve, so it is worth testing that it
 * blocks by default and opens only where it is meant to.
 */
describe('MfaEnrolmentGuard', () => {
  /** Builds a context whose reflector answers with the given metadata. */
  function guardFor(metadata: Record<string, boolean>, user: unknown) {
    const reflector = {
      getAllAndOverride: (key: string) => metadata[key],
    } as unknown as Reflector;

    const context = {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;

    return { guard: new MfaEnrolmentGuard(reflector), context };
  }

  const pending = { userId: 'user-1', role: 'admin', mfaEnrolmentRequired: true };
  const enrolled = { userId: 'user-1', role: 'admin', mfaEnrolmentRequired: false };

  it('blocks an ordinary route for a privileged user who has not enrolled', () => {
    const { guard, context } = guardFor({}, pending);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('reports why it blocked, so the client knows where to go', () => {
    const { guard, context } = guardFor({}, pending);

    try {
      guard.canActivate(context);
      fail('expected the guard to block');
    } catch (err) {
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        code: 'mfa_enrolment_required',
      });
    }
  });

  it('allows the enrolment routes through', () => {
    const { guard, context } = guardFor({ [MFA_ENROLMENT_ALLOWED_KEY]: true }, pending);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('leaves public routes alone', () => {
    const { guard, context } = guardFor({ [IS_PUBLIC_KEY]: true }, pending);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows everything once the user has enrolled', () => {
    const { guard, context } = guardFor({}, enrolled);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows an unprivileged user with no requirement', () => {
    const { guard, context } = guardFor({}, { userId: 'user-2', role: 'viewer' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('defers to JwtAuthGuard when there is no user on the request', () => {
    const { guard, context } = guardFor({}, undefined);

    expect(guard.canActivate(context)).toBe(true);
  });
});
