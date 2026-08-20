import { ArgumentsHost, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/http-exception.filter';

/**
 * The filter rebuilds every error body from scratch, so anything a thrower
 * puts in the exception payload is dropped unless this filter copies it. That
 * silently removed the `code` discriminator from MFA login failures.
 */
describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  let body: any;
  let statusCode: number;

  const host = (url = '/auth/login'): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({
          status: (s: number) => {
            statusCode = s;
            return { json: (b: any) => (body = b) };
          },
        }),
        getRequest: () => ({ url, method: 'POST' }),
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    body = undefined;
    statusCode = 0;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('carries a machine-readable code through to the client', () => {
    filter.catch(
      new UnauthorizedException({
        code: 'mfa_required',
        message: 'Multi-factor authentication code required',
      }),
      host(),
    );

    expect(statusCode).toBe(401);
    expect(body.code).toBe('mfa_required');
    expect(body.detail).toBe('Multi-factor authentication code required');
  });

  it('distinguishes a missing second factor from a rejected one', () => {
    filter.catch(
      new UnauthorizedException({ code: 'mfa_invalid', message: 'Invalid code' }),
      host(),
    );
    expect(body.code).toBe('mfa_invalid');
  });

  it('omits code entirely when the thrower did not set one', () => {
    filter.catch(new UnauthorizedException('Invalid credentials'), host());
    expect(body.code).toBeUndefined();
    expect(body.detail).toBe('Invalid credentials');
  });

  it('does not let a non-string code through', () => {
    filter.catch(
      new HttpException({ code: { nested: 'object' }, message: 'x' }, HttpStatus.BAD_REQUEST),
      host(),
    );
    expect(body.code).toBeUndefined();
  });

  it('still shapes the problem document', () => {
    filter.catch(new UnauthorizedException('nope'), host('/auth/login'));
    expect(body.type).toBe('https://api.aatos.trade/errors/unauthorized');
    expect(body.title).toBe('Unauthorized');
    expect(body.status).toBe(401);
    expect(body.instance).toBe('/auth/login');
  });
});
