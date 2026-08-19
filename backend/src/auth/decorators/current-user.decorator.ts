import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user from the request.
 * 
 * Usage:
 *   async myMethod(@CurrentUser() user: UserPayload) { ... }
 */
export interface UserPayload {
  userId: string;
  email: string;
  orgId: string | null;
  role: string | null;
  /** Whether the account has a confirmed second factor. */
  mfaEnabled: boolean;
  /**
   * True when the user holds a role that requires MFA but has not enrolled.
   * MfaEnrolmentGuard refuses every route except the enrolment ones while set.
   */
  mfaEnrolmentRequired: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext): UserPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
