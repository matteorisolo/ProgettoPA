import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import authService from '../services/authService';

// Controller function for user login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Destructuring email and password from the request body
  const { email, password } = req.body;

  try {
    // Authentication service call and token generation
    const token = await authService.login(email, password);

    // Successful response with the generated token
    res.status(StatusCodes.OK).json({ token });
  } catch (error) {
    // Pass any errors to the next middleware (error handler)
    next(error);
  }
};
