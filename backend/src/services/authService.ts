import bcrypt from 'bcrypt';
import userDao from '../dao/userDao';
import { generateToken } from '../utils/jwt';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IUserAttributes } from '../models/appUser';

/**
 * DTO returned to the client after a successful login.
 * Sensitive fields such as `password` are excluded.
 */
export interface IAuthLoginResult {
    token: string;
    user: Pick<
        IUserAttributes,
        'idUser' | 'firstName' | 'lastName' | 'email' | 'role' | 'tokens'
    >;
}

export class AuthService {
    /**
     * Function to log in a user.
     * Validates credentials and returns a signed JWT with user data (excluding sensitive fields).
     *
     * @param email - The user's email.
     * @param password - The user's plaintext password to validate against the stored hash.
     * @returns {Promise<IAuthLoginResult>} - A promise resolving with the authentication result.
     */
    static async login(
        email: string,
        password: string,
    ): Promise<IAuthLoginResult> {
        // Fetch user by email via DAO
        const user = await userDao.getByEmail(email);

        // In case the DAO version returns `null` instead of throwing for not found.
        if (!user) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.Unauthorized,
                'Invalid email or password.',
            );
        }

        // Verify the password using bcrypt (DB must store hashed passwords).
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.Unauthorized,
                'Invalid email or password.',
            );
        }

        // Sign the JWT.
        const token = generateToken({ id: user.idUser, role: user.role });

        // Build the response DTO without password or other sensitive fields.
        const result: IAuthLoginResult = {
            token,
            user: {
                idUser: user.idUser,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                tokens: user.tokens,
            },
        };

        return result;
    }

    /**
     * Function to retrieve user details by ID, excluding sensitive fields.
     *
     * @param idUser - The ID of the user to retrieve.
     * @returns {Promise<Pick<IUserAttributes, 'idUser' | 'firstName' | 'lastName' | 'email' | 'role' | 'tokens'>>}
     * - A promise resolving with the user details.
     */
    static async getUserById(
        idUser: number,
    ): Promise<
        Pick<
            IUserAttributes,
            'idUser' | 'firstName' | 'lastName' | 'email' | 'role' | 'tokens'
        >
    > {
        const user = await userDao.getById(idUser);

        if (!user) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `User not found with id ${idUser}.`,
            );
        }

        return {
            idUser: user.idUser,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            tokens: user.tokens,
        };
    }

    /**
     * Function to update the token balance of a user.
     * Adds the specified amount to the user's current tokens.
     *
     * @param idUser - The ID of the user whose tokens are updated.
     * @param amount - The amount of tokens to add (can be positive or negative).
     * @returns {Promise<number>} - A promise resolving with the new token balance.
     */
    static async updateTokens(idUser: number, amount: number): Promise<number> {
        const user = await userDao.getById(idUser);

        if (!user) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `User not found with id ${idUser}.`,
            );
        }

        const newBalance = user.tokens + amount;

        const updated = await userDao.updateTokens(idUser, newBalance);

        return updated.tokens;
    }
}

export default AuthService;
