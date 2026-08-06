import { SetMetadata } from '@nestjs/common';

/**
 * Role-based access control decorator.
 * Apply to controller methods to restrict access to specific organization roles.
 * 
 * Usage:
 *   @Roles('admin', 'owner')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   async sensitiveOperation() { ... }
 */
export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
