import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { HttpErrorFactory } from '../../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../../utils/errors/HttpErrorCodes';

// Centralized middleware to handle validation results from express-validator
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract validation errors from the request
    const errors = validationResult(req);

    // If there are validation errors, create and throw a BadRequest error with the first error message
    if (!errors.isEmpty())
      throw HttpErrorFactory.createError(
        HttpErrorCodes.BadRequest,
        errors.array()[0].msg,
      );
    next();
  } catch (error) {
    next(error);
  }
};

export default validateRequest;
