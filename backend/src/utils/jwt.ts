import jwt, { JwtPayload } from "jsonwebtoken";
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';

// Load jwt secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
}

// Generates a JWT token with the given payload 
export const generateToken = (payload: JwtPayload): string => {
    try {
        // Generate the token with a 1 hour expiration time
        const token = jwt.sign(payload, JWT_SECRET!, { expiresIn: '1h' });
        return token;
    }
    catch {
        throw HttpErrorFactory.createError(HttpErrorCodes.InternalServerError, "Error generating JWT token.");
    }
}

// Verifies the given JWT token and returns the decoded payload
export const verifyToken = (token: string): JwtPayload => {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JwtPayload;
}