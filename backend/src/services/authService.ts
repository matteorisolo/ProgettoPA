import bcrypt from 'bcrypt';
import userDao from '../dao/userDao';
import { generateToken } from "../utils/jwt";
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IUserAttributes } from '../models/appUser';

/**
 * DTO returned to the client after a successful login.
 * We explicitly avoid exposing sensitive fields such as `password`.
 */
export interface IAuthLoginResult {
    token: string;
    user: Pick<
        IUserAttributes,
        'idUser' | 'firstName' | 'lastName' | 'email' | 'role' | 'tokens'
    >;
}

export class AuthService {
    static async login(email: string, password: string): Promise<IAuthLoginResult> {
        // 1) Fetch user by email via DAO
         const user = await userDao.getByEmail(email);

        // In case the DAO version returns `null` instead of throwing for not found.
        if (!user) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.Unauthorized,
                'Invalid email or password.'
            );
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
        const token = generateToken({ id: user.idUser, role: user.role});
    
        // 4) Build the response DTO without password or other sensitive fields.
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
}

export default AuthService;