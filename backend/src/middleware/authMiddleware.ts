import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../enums/UserRole';
import dotenv from 'dotenv';
import { verifyToken } from '../utils/jwt';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';

// Load environment variables
dotenv.config();

// Interface for the user payload contained in the JWT
export interface UserPayload {
    id: number;
    role: string;
}

// Extending the Express Request interface to include user information
export interface RequestWithUser extends Request {
    user: UserPayload;
}

// Middleware for authentication and authorization based on JWT tokens
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check for the presence of the Authorization header and extract the token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw HttpErrorFactory.createError(HttpErrorCodes.InvalidToken, 'Missing token.');
        }
        // Extract and verify the token
        const payload = verifyToken(token);
        // Add user information to the request object
        (req as RequestWithUser).user = { id: payload.id, role: payload.role };
        next();
    } 
    // Handle token verification errors
    catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            next(HttpErrorFactory.createError(HttpErrorCodes.TokenExpiredError, 'Expired token.'));
        } else {
            next(HttpErrorFactory.createError(HttpErrorCodes.InvalidToken, 'Invalid token.'));
        }
    }
}

// Middleware for role-based authorization
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get the user from the request
            const user = (req as RequestWithUser).user;
            if (!user) {
                throw HttpErrorFactory.createError(HttpErrorCodes.Forbidden, 'User not authenticated.');
            }
            // Check if the user's role is included in the allowed roles
            if (!roles.includes(user.role as UserRole)) {
                throw HttpErrorFactory.createError(HttpErrorCodes.Unauthorized, 'User not authorized.');
            }
            next();
        } catch (error) {
            next(error);
        }
    }
};

export default { authMiddleware, authorize };