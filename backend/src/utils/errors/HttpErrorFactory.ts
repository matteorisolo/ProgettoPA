import { StatusCodes } from 'http-status-codes';
import { HttpErrorCodes } from './HttpErrorCodes';
import { HttpError } from './HttpError';

// Factory pattern to create HttpError instances based on error type
export class HttpErrorFactory {
  static createError(type: HttpErrorCodes, message: string): HttpError {
    switch (type) {
      case HttpErrorCodes.BadRequest:
        return new HttpError(StatusCodes.BAD_REQUEST, message, 'BAD_REQUEST');
      case HttpErrorCodes.Unauthorized:
        return new HttpError(StatusCodes.UNAUTHORIZED, message, 'UNAUTHORIZED');
      case HttpErrorCodes.Forbidden:
        return new HttpError(StatusCodes.FORBIDDEN, message, 'FORBIDDEN');
      case HttpErrorCodes.NotFound:
        return new HttpError(StatusCodes.NOT_FOUND, message, 'NOT_FOUND');
      case HttpErrorCodes.InvalidID:
        return new HttpError(StatusCodes.BAD_REQUEST, message, 'INVALID_ID');
      case HttpErrorCodes.InvalidToken:
        return new HttpError(
          StatusCodes.UNAUTHORIZED,
          message,
          'INVALID_TOKEN',
        );
      case HttpErrorCodes.JsonWebTokenError:
        return new HttpError(
          StatusCodes.UNAUTHORIZED,
          message,
          'JSON_WEB_TOKEN_ERROR',
        );
      case HttpErrorCodes.TokenExpiredError:
        return new HttpError(
          StatusCodes.UNAUTHORIZED,
          message,
          'TOKEN_EXPIRED_ERROR',
        );
      default:
        return new HttpError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          message,
          'INTERNAL_SERVER_ERROR',
        );
    }
  }
}
