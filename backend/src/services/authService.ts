import bcrypt from 'bcrypt';
import userDao from '../dao/userDao';
import { generateToken } from "../utils/jwt";
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { HttpError } from '../utils/errors/HttpError';
import { IUserAttributes } from '../models/appUser';

/**
 * DTO returned to the client after a successful login.
 * We explicitly avoid exposing sensitive fields such as `password`.
 */
export interface AuthLoginResult {
    token: string;
    user: Pick<
        IUserAttributes,
        'idUser' | 'firstName' | 'lastName' | 'email' | 'role' | 'tokens'
    >;
}

export class AuthService {
    static async login(email: string, password: string): Promise<AuthLoginResult> {
        // 1) Fetch user by email via DAO
        let user = await userDao.getByEmail(email);

        try {
            user = await userDao.getByEmail(email);
        } catch (err) {
            // Se il DAO segnala che l'utente non esiste, mappiamo a 401
            if (err instanceof HttpError && err.code === HttpErrorCodes.NotFound) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.Unauthorized,
                    'Invalid email or password.'
                );
            }
        }

        // 2) Verify the password using bcrypt (DB must store hashed passwords).
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.Unauthorized,
                'Invalid email or password.'
        );
        }

         // 3) Sign the JWT.
        const token = generateToken({ id: user.idUser, ruolo: user.role});
    
        // 4) Build the response DTO without password or other sensitive fields.
        const result: AuthLoginResult = {
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
}

export default AuthService;