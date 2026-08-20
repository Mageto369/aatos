import { FindOperator } from 'typeorm';
import { User } from '../entities/user.entity';
import { MfaRecoveryCode } from '../entities/mfa-recovery-code.entity';
import { OrganizationMember } from '../../organizations/entities/organization-member.entity';

/**
 * In-memory stand-ins for the three repositories MfaService uses.
 *
 * These are deliberately behavioural rather than jest.fn() stubs: the
 * single-use guarantee for recovery codes lives in the *criteria* of the
 * UPDATE (`used_at IS NULL`), so a mock that ignores the criteria would let
 * the test pass while the real query allowed a code to be spent twice.
 */

function valueMatches(actual: unknown, expected: unknown): boolean {
  if (expected instanceof FindOperator) {
    if (expected.type === 'isNull') {
      return actual === null || actual === undefined;
    }
    throw new Error(`Test double does not support the "${expected.type}" operator`);
  }
  return actual === expected;
}

function matches(row: Record<string, any>, criteria: Record<string, any>): boolean {
  return Object.entries(criteria).every(([key, expected]) => valueMatches(row[key], expected));
}

export class FakeUserRepository {
  readonly users: User[] = [];

  add(user: User): User {
    this.users.push(user);
    return user;
  }

  async findOne({ where }: { where: Record<string, any> }): Promise<User | null> {
    return this.users.find((user) => matches(user as any, where)) ?? null;
  }

  /**
   * Enough of a query builder for findUserWithSecrets, which authentication
   * uses to pull the columns marked select: false. The double stores whole
   * objects and has no column projection to undo, so addSelect is a no-op
   * here — what is being exercised is that the production code asks for the
   * secrets at all.
   */
  createQueryBuilder(_alias?: string) {
    let criteria: Record<string, any> = {};
    const builder = {
      where: (w: Record<string, any>) => {
        criteria = w;
        return builder;
      },
      addSelect: () => builder,
      getOne: async (): Promise<User | null> =>
        this.users.find((user) => matches(user as any, criteria)) ?? null,
    };
    return builder;
  }

  create(data: Partial<User>): User {
    return data as User;
  }

  async save(user: User): Promise<User> {
    if (!this.users.includes(user)) {
      this.users.push(user);
    }
    return user;
  }

  async update(
    criteria: Record<string, any>,
    partial: Record<string, any>,
  ): Promise<{ affected: number }> {
    const hits = this.users.filter((user) => matches(user as any, criteria));
    for (const hit of hits) {
      Object.assign(hit, partial);
    }
    return { affected: hits.length };
  }
}

export class FakeRecoveryCodeRepository {
  readonly rows: MfaRecoveryCode[] = [];

  async insert(entries: Array<Partial<MfaRecoveryCode>>): Promise<{ identifiers: unknown[] }> {
    for (const entry of entries) {
      this.rows.push({
        id: `recovery-${this.rows.length}`,
        createdAt: new Date(),
        usedAt: null,
        ...entry,
      } as MfaRecoveryCode);
    }
    return { identifiers: [] };
  }

  async delete(criteria: Record<string, any>): Promise<{ affected: number }> {
    const before = this.rows.length;
    const keep = this.rows.filter((row) => !matches(row as any, criteria));
    this.rows.length = 0;
    this.rows.push(...keep);
    return { affected: before - this.rows.length };
  }

  async update(
    criteria: Record<string, any>,
    partial: Record<string, any>,
  ): Promise<{ affected: number }> {
    const hits = this.rows.filter((row) => matches(row as any, criteria));
    for (const hit of hits) {
      Object.assign(hit, partial);
    }
    return { affected: hits.length };
  }

  async count({ where }: { where: Record<string, any> }): Promise<number> {
    return this.rows.filter((row) => matches(row as any, where)).length;
  }
}

export class FakeMemberRepository {
  readonly rows: OrganizationMember[] = [];

  async find({ where }: { where: Record<string, any> }): Promise<OrganizationMember[]> {
    return this.rows.filter((row) => matches(row as any, where));
  }

  async findOne({ where }: { where: Record<string, any> }): Promise<OrganizationMember | null> {
    return this.rows.find((row) => matches(row as any, where)) ?? null;
  }
}

/** ConfigService stand-in with the values MFA reads. */
export function fakeConfigService(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    // NODE_ENV is deliberately 'development' in these tests: that is the
    // environment the removed simulation used to accept '000000' in.
    NODE_ENV: 'development',
    JWT_SECRET: 'test-secret-min-32-chars-longxxxx',
    MFA_ISSUER: 'AATOS',
    ...overrides,
  };
  return {
    get: <T>(key: string, defaultValue?: T): T | string | undefined =>
      key in values ? values[key] : defaultValue,
  };
}

/** A minimal enrolled/unenrolled user row. */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'trader@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'unset',
    status: 'active',
    mfaEnabled: false,
    mfaSecret: null,
    mfaPendingSecret: null,
    mfaEnrolledAt: null,
    mfaLastVerifiedCounter: null,
    mfaRecoveryCodesIssuedAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    loginCount: 0,
    lastLoginAt: null,
    ...overrides,
  } as User;
}
