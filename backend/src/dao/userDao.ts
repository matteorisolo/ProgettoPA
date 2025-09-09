import { DAO } from './daoInterface';
import User, {
    IUserAttributes,
    IUserCreationAttributes,
} from '../models/appUser';
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
    /**
     * Function to retrieve all users.
     *
     * @returns {Promise<User[]>} - A promise resolving with an array of users.
     */
    public async getAll(): Promise<User[]> {
        try {
            return await User.findAll();
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving all users.',
            );
        }
    }

    /**
     * Function to retrieve a user by its ID.
     *
     * @param id - The primary key ID of the user.
     * @returns {Promise<User>} - A promise resolving with the user.
     */
    public async getById(id: number): Promise<User> {
        try {
            const user = await User.findByPk(id);
            if (!user) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User not found with ID ${id}.`,
                );
            }
            return user;
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving user with ID ${id}.`,
            );
        }
    }

    /**
     * Function to retrieve a user by email.
     *
     * @param email - The email of the user.
     * @returns {Promise<User | null>} - A promise resolving with the user or null if not found.
     */
    public async getByEmail(email: string): Promise<User | null> {
        try {
            const user = await User.findOne({ where: { email } });
            return user;
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving user with email ${email}.`,
            );
        }
    }

    /**
     * Function to create a new user.
     *
     * @param user - The attributes required to create the user.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<User>} - A promise resolving with the newly created user.
     */
    public async create(
        user: IUserCreationAttributes,
        options?: { transaction?: Transaction },
    ): Promise<User> {
        try {
            return await User.create(user, options);
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error creating new user.`,
            );
        }
    }

    /**
     * Function to update an existing user.
     *
     * @param id - The ID of the user to update.
     * @param user - The attributes to update.
     * @returns {Promise<[number, User[]]>} - A promise resolving with the number of updated rows and the updated users.
     */
    public async update(
        id: number,
        user: IUserAttributes,
    ): Promise<[number, User[]]> {
        try {
            const [rows, updatedUser] = await User.update(user, {
                where: { idUser: id },
                returning: true, // returns the updated rows
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`,
                );
            }
            return [rows, updatedUser];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating user with ID ${id}.`,
            );
        }
    }

    /**
     * Function to delete a user by its ID.
     *
     * @param id - The ID of the user to delete.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<[number, User]>} - A promise resolving with the number of deleted rows and the deleted user.
     */
    public async delete(
        id: number,
        options?: { transaction?: Transaction },
    ): Promise<[number, User]> {
        try {
            const user = await User.findByPk(id);
            if (!user) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`,
                );
            }
            const rows = await User.destroy({
                where: { idUser: id },
                ...options,
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`,
                );
            }
            return [rows, user];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error deleting user with ID ${id}.`,
            );
        }
    }

    /**
     * Function to update a user's token balance.
     *
     * @param id - The ID of the user to update.
     * @param newTokens - The new token balance to set.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<User>} - A promise resolving with the updated user.
     */
    public async updateTokens(
        id: number,
        newTokens: number,
        options?: { transaction?: Transaction },
    ): Promise<User> {
        try {
            const [rows, updated] = await User.update(
                { tokens: newTokens } as Partial<IUserAttributes>,
                {
                    where: { idUser: id },
                    returning: true,
                    transaction: options?.transaction,
                },
            );

            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `User with ID ${id} not found.`,
                );
            }

            // updated is an array of updated users; return the first one
            return updated[0];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating tokens for user with ID ${id}.`,
            );
        }
    }
}

export default new UserDao();
