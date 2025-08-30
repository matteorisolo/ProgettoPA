import { Request, Response, NextFunction } from 'express';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { HttpError } from '../utils/errors/HttpError';

// Middleware for handling generic and personalized errors
export const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    // Final error object to be sent in the response for the client
    let finalError: HttpError;

    // If the error is already a known HttpError, we use it directly
    if (err && err.statusCode && err.code && err.message) {
        finalError = err;
    }
    // Otherwise, we create a generic InternalServerError as HttpError
    else {
        finalError = HttpErrorFactory.createError(
            HttpErrorCodes.InternalServerError,
            err?.message || 'Internal Server Error'
        );
    }

    // Respond with the appropriate status code and error details
    res.status(finalError.statusCode).json({
        error: {
            statusCode: finalError.statusCode,
            code: finalError.code,
            message: finalError.message
        }
    });
};