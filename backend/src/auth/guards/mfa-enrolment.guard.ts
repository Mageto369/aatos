import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { MFA_ENROLMENT_ALLOWED_KEY } from '../decorators/mfa-enrolment.decorator';

/**
 * Enforces MFA enrolment for privileged roles.
 *
 * Registered as an APP_GUARD after JwtAuthGuard, so `req.user` is already
 * populated by JwtStrategy — which is where `mfaEnrolmentRequired` is computed
 * from live database state (the user's roles across every organization, and
 * whether `mfa_enabled` is set) rather than from a claim inside the token.
 * That matters twice over: a token minted before enrolment starts working
 * again the instant enrolment completes, and a token cannot be forged into
 * carrying "already enrolled".
 *
 * The alternative designs were worse:
 *
 *   - Refusing to issue a token at all until the user enrols locks every
 *     existing admin out, because enrolment itself needs a token.
 *   - Checking only at login lets a session that predates the role grant keep
 *     full access indefinitely.
 *   - A per-controller decorator has to be remembered on every new route; this
 *     is deny-by-default, so a route added tomorrow is covered automatically.
 */
@Injectable()
export class MfaEnrolmentGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const enrolmentAllowed = this.reflector.getAllAndOverride<boolean>(MFA_ENROLMENT_ALLOWED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (enrolmentAllowed) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user means JwtAuthGuard already rejected the request, or this is not
    // an HTTP route it applies to. Nothing to enforce here either way.
    if (!user) {
      return true;
    }

    if (user.mfaEnrolmentRequired) {
      throw new ForbiddenException({
        code: 'mfa_enrolment_required',
        message:
          'This role requires multi-factor authentication. Enrol at POST /auth/mfa/enroll ' +
          'and confirm at POST /auth/mfa/enroll/confirm before using the API.',
      });
    }

    return true;
  }
}
