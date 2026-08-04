import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse = {
      type: `https://api.aatos.trade/errors/${this.getErrorType(status)}`,
      title: this.getErrorTitle(status),
      status,
      detail: exceptionResponse.message || exception.message,
      instance: request.url,
      requestId: (request as any).id || 'unknown',
      timestamp: new Date().toISOString(),
      errors: Array.isArray(exceptionResponse.message) ? exceptionResponse.message : undefined,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${exception.message}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorType(status: number): string {
    const types: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'validation-failed',
      [HttpStatus.UNAUTHORIZED]: 'unauthorized',
      [HttpStatus.FORBIDDEN]: 'forbidden',
      [HttpStatus.NOT_FOUND]: 'not-found',
      [HttpStatus.CONFLICT]: 'conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable',
      [HttpStatus.TOO_MANY_REQUESTS]: 'rate-limited',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal-error',
    };
    return types[status] || 'unknown-error';
  }

  private getErrorTitle(status: number): string {
    const titles: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return titles[status] || 'Error';
  }
}
