import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { RequestWithUser } from '../middlewares/authMiddleware';

// Controller function to get the tokens of the logged-in user
export const getMyTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Retrieve user information from the service
    let user = (req as RequestWithUser).user;
    // Fetch the tokens
    const tokens = (await AuthService.getUserById(user.id)).tokens;

    // Return the user's tokens
    return res.status(200).json({
      message: 'User tokens retrieved successfully.',
      tokens: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// Controller function to get the tokens of a specific user by ID (admin only)
export const getUserTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Extract user ID from request parameters
    const { id } = req.params;

    // Retrieve user information from the service
    const user = await AuthService.getUserById(Number(id));

    // Return the user's tokens
    return res.status(200).json({
      message: 'User tokens retrieved successfully.',
      tokens: user.tokens,
    });
  } catch (error) {
    next(error);
  }
};

// Controller function to update the tokens of a specific user by ID (admin only)
export const updateUserTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Extract user ID from request parameters and new tokens from request body
    const { id } = req.params;
    const { tokens } = req.body;

    // Update the user's tokens using the service
    const newTokens = await AuthService.updateTokens(Number(id), tokens);

    // Return the updated tokens
    return res.status(200).json({
      message: 'User tokens updated successfully.',
      userId: id,
      tokens: newTokens,
    });
  } catch (error) {
    next(error);
  }
};
