import { DAO } from './daoInterface';
import User, { IUserAttributes, IUserCreationAttributes } from '../models/appUser';
import { Transaction } from 'sequelize';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';

// UserDAO interface extending the base DAO interface
interface IUserDAO extends DAO<IUserAttributes, number> {
    getByEmail(email: string): Promise<User | null>;
}

// UserDao class implementing IUserDAO
class UserDao implements IUserDAO {

    public async getAll(): Promise<User[]> {
        try {
            return await User.findAll();
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving all users.'
            );
        }
    }

    public async getById(id: number): Promise<User> {
        try {
            const user = await User.findByPk(id);
            if (!user) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User not found with ID ${id}.`
                );
            }
            return user;
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving user with ID ${id}.`
            );
        }
    }

    public async getByEmail(email: string): Promise<User | null> {
        try {
            const user = await User.findOne({ where: { email } });
            return user;
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving user with email ${email}.`
            );
        }
    }

    public async create(user: IUserCreationAttributes, options?: { transaction?: Transaction }): Promise<User> {
        try {
            return await User.create(user, options);
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error creating new user.`
            );
        }
    }

    public async update(id: number, user: IUserAttributes): Promise<[number, User[]]> {
        try {
            const [rows, updatedUser] = await User.update(user, {
                where: { idUser: id },
                returning: true            // returns the updated rows
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`
                );
            }
            return [rows, updatedUser];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating user with ID ${id}.`
            );
        }
    }

    public async delete(id: number, options?: { transaction?: Transaction }): Promise<[number, User]> {
        try {
            const user = await User.findByPk(id);
            if (!user) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`
                );
            }
            const rows = await User.destroy({ where: { idUser: id }, ...options });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`
                );
            }
            return [rows, user];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error deleting user with ID ${id}.`
            );
        }
    }

    // Update user's token balance
    public async updateTokens(
        id: number,
        newTokens: number,
        options?: { transaction?: Transaction }
    ): Promise<User> {
        try {
            const [rows, updated] = await User.update(
                { tokens: newTokens } as Partial<IUserAttributes>,
                {
                    where: { idUser: id },
                    returning: true,
                    transaction: options?.transaction,
                }   
            );

            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`
                );
            }

        // updated is an array of updated users; return the first one
        return updated[0];
    } catch (error) {
        if (error instanceof HttpError) throw error;
        throw HttpErrorFactory.createError(
            HttpErrorCodes.InternalServerError,
            `Error updating tokens for user with ID ${id}.`
            );
        }
    }
}

export default new UserDao();