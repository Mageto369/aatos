import { SetMetadata } from '@nestjs/common';

export const MFA_ENROLMENT_ALLOWED_KEY = 'mfaEnrolmentAllowed';

/**
 * Marks a route as reachable by a privileged user who has not yet enrolled in
 * MFA.
 *
 * MfaEnrolmentGuard is global: once a user holds a role that requires a second
 * factor, every authenticated route returns 403 `mfa_enrolment_required` until
 * they enrol. Without this escape hatch the enrolment endpoints themselves
 * would be blocked and the user could never get out of the state.
 *
 * Only routes that are part of enrolling — or that report why access is being
 * refused — belong here. Anything else defeats the enforcement.
 */
export const AllowsPendingMfaEnrolment = () => SetMetadata(MFA_ENROLMENT_ALLOWED_KEY, true);
