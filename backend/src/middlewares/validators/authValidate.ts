import { body } from 'express-validator';
import validateRequest from './validateRequestMiddleware';

// Validation middleware for login (array of middlewares)
export const validateLogin = [
  // Check if email is provided and is valid and normalize it
  body('email')
    .notEmpty()
    .withMessage('Email needs to be provided.')
    .isEmail()
    .withMessage('Email not valid.')
    .normalizeEmail(),

  // Check if password is provided and has a minimum length of 6 characters
  body('password')
    .notEmpty()
    .withMessage('Password need to be provided.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  validateRequest,
];
