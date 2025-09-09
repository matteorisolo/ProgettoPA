import { DAO } from './daoInterface';
import Purchase, {
    IPurchaseAttributes,
    IPurchaseCreationAttributes,
} from '../models/purchase';
import { Transaction, WhereOptions } from 'sequelize';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { PurchaseType } from '../enums/PurchaseType';

// PurchaseDAO interface extending the base DAO interface
export interface IPurchaseDAO extends DAO<IPurchaseAttributes, number> {
    getByBuyer(buyerId: number): Promise<Purchase[]>;
    getByProduct(productId: number): Promise<Purchase[]>;
    getByType(type: PurchaseType): Promise<Purchase[]>;
    getByBuyerAndProduct(
        buyerId: number,
        productId: number,
        type?: PurchaseType,
    ): Promise<Purchase | null>;
    getByFilters(filters: {
        buyerId?: number;
        productId?: number;
        type?: PurchaseType;
        recipientEmail?: string;
    }): Promise<Purchase[]>;
}

class PurchaseDao implements IPurchaseDAO {
    /**
     * Function to retrieve all purchases ordered by creation date (descending).
     *
     * @returns {Promise<Purchase[]>} - A promise resolving with an array of purchases.
     */
    public async getAll(): Promise<Purchase[]> {
        try {
            return await Purchase.findAll({ order: [['createdAt', 'DESC']] });
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving all purchases.',
            );
        }
    }

    /**
     * Function to retrieve a purchase by its ID.
     *
     * @param id - The primary key ID of the purchase.
     * @returns {Promise<Purchase>} - A promise resolving with the purchase.
     */
    public async getById(id: number): Promise<Purchase> {
        try {
            const purchase = await Purchase.findByPk(id);
            if (!purchase) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Purchase not found with ID ${id}.`,
                );
            }
            return purchase;
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving purchase with ID ${id}.`,
            );
        }
    }

    /**
     * Function to create a new purchase.
     *
     * @param data - The attributes required to create the purchase.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<Purchase>} - A promise resolving with the newly created purchase.
     */
    public async create(
        data: IPurchaseCreationAttributes,
        options?: { transaction?: Transaction },
    ): Promise<Purchase> {
        try {
            return await Purchase.create(data, options);
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error creating new purchase.',
            );
        }
    }

    /**
     * Function to update an existing purchase.
     *
     * @param id - The ID of the purchase to update.
     * @param data - The attributes to update.
     * @returns {Promise<[number, Purchase[]]>} - A promise resolving with the number of updated rows and the updated purchases.
     */
    public async update(
        id: number,
        data: IPurchaseAttributes,
    ): Promise<[number, Purchase[]]> {
        try {
            const [rows, updated] = await Purchase.update(
                data as IPurchaseAttributes,
                {
                    where: { idPurchase: id },
                    returning: true,
                },
            );
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Purchase with ID ${id} not found.`,
                );
            }
            return [rows, updated];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating purchase with ID ${id}.`,
            );
        }
    }

    /**
     * Function to delete a purchase by its ID.
     *
     * @param id - The ID of the purchase to delete.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<[number, Purchase]>} - A promise resolving with the number of deleted rows and the deleted purchase.
     */
    public async delete(
        id: number,
        options?: { transaction?: Transaction },
    ): Promise<[number, Purchase]> {
        try {
            const purchase = await Purchase.findByPk(id);
            if (!purchase) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Purchase with ID ${id} not found.`,
                );
            }
            const rows = await Purchase.destroy({
                where: { idPurchase: id },
                ...options,
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Purchase with ID ${id} not found.`,
                );
            }
            return [rows, purchase];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error deleting purchase with ID ${id}.`,
            );
        }
    }

    // ------- Custom methods useful for the catalog -------

    /**
     * Function to retrieve purchases by buyer ID.
     *
     * @param buyerId - The ID of the buyer.
     * @returns {Promise<Purchase[]>} - A promise resolving with an array of purchases.
     */
    public async getByBuyer(buyerId: number): Promise<Purchase[]> {
        try {
            return await Purchase.findAll({
                where: { buyerId },
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving purchases for buyer ${buyerId}.`,
            );
        }
    }

    /**
     * Function to retrieve purchases by product ID.
     *
     * @param productId - The ID of the product.
     * @returns {Promise<Purchase[]>} - A promise resolving with an array of purchases.
     */
    public async getByProduct(productId: number): Promise<Purchase[]> {
        try {
            return await Purchase.findAll({
                where: { productId },
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving purchases for product ${productId}.`,
            );
        }
    }

    /**
     * Function to retrieve purchases by type.
     *
     * @param type - The purchase type.
     * @returns {Promise<Purchase[]>} - A promise resolving with an array of purchases.
     */
    public async getByType(type: PurchaseType): Promise<Purchase[]> {
        try {
            return await Purchase.findAll({
                where: { type },
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving purchases by type ${type}.`,
            );
        }
    }

    /**
     * Function to retrieve a purchase by buyer ID and product ID.
     *
     * @param buyerId - The ID of the buyer.
     * @param productId - The ID of the product.
     * @returns {Promise<Purchase | null>} - A promise resolving with the purchase or null if not found.
     */
    public async getByBuyerAndProduct(
        buyerId: number,
        productId: number,
    ): Promise<Purchase | null> {
        try {
            const where: WhereOptions = { buyerId, productId };
            return await Purchase.findOne({ where });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving purchase for buyer ${buyerId} and product ${productId}.`,
            );
        }
    }

    /**
     * Function to retrieve purchases using optional filters.
     *
     * @param filters - The filters to apply (buyerId, productId, type, recipientEmail).
     * @returns {Promise<Purchase[]>} - A promise resolving with an array of purchases.
     */
    public async getByFilters(filters: {
        buyerId?: number;
        productId?: number;
        type?: PurchaseType;
        recipientEmail?: string;
    }): Promise<Purchase[]> {
        try {
            const where: WhereOptions<IPurchaseAttributes> = {};

            if (
                typeof filters.buyerId === 'number' &&
                Number.isFinite(filters.buyerId)
            ) {
                where.buyerId = filters.buyerId;
            }
            if (
                typeof filters.productId === 'number' &&
                Number.isFinite(filters.productId)
            ) {
                where.productId = filters.productId;
            }
            if (filters.type) {
                where.type = filters.type;
            }
            if (filters.recipientEmail && filters.recipientEmail.trim()) {
                where.recipientEmail = filters.recipientEmail.trim();
            }

            return await Purchase.findAll({
                where,
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving purchases by filters.',
            );
        }
    }
}

export default new PurchaseDao();
