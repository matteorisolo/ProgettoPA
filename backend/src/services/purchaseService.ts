import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import userDao from '../dao/userDao';
import productDao from '../dao/productDao';
import purchaseDao from '../dao/purchaseDao';
import purchaseRepository from '../repositories/purchaseRepository';
import { PurchaseType } from '../enums/PurchaseType';
import { IPurchaseCreationAttributes } from '../models/purchase';
import Database from '../utils/database';

export interface IPurchaseCreatedOutput {
    purchaseId: number;
}

export class PurchaseService {
    /**
     * Function to create a new purchase.
     * Validates user, product, and recipient (if applicable), calculates cost,
     * and performs a transaction to create the purchase and update user tokens.
     *
     * @param input - The attributes required to create a purchase.
     * @returns {Promise<IPurchaseCreatedOutput>} - A promise resolving with the created purchase ID.
     * @throws {HttpError} - Throws BadRequest for invalid input or unsupported type.
     */
    static async createPurchase(
        input: IPurchaseCreationAttributes,
    ): Promise<IPurchaseCreatedOutput> {
        const [user, product] = await Promise.all([
            userDao.getById(input.buyerId),
            productDao.getById(input.productId),
        ]);

        let totalCost = product.cost;
        const toCreate: IPurchaseCreationAttributes = {
            buyerId: input.buyerId,
            productId: input.productId,
            type: input.type,
            recipientId: null,
            recipientEmail: null,
        };

        if (input.type === PurchaseType.GIFT) {
            totalCost = product.cost + 0.5;

            const email = input.recipientEmail!.trim();
            const recipientUser = await userDao.getByEmail(email);
            if (!recipientUser) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.BadRequest,
                    'Recipient must be a registered user.',
                );
            }
            const recipientId = recipientUser.idUser ?? recipientUser.idUser;

            toCreate.recipientId = recipientId;
            toCreate.recipientEmail = email;
        } else if (input.type === PurchaseType.STANDARD) {
            totalCost = product.cost;
        } else if (input.type === PurchaseType.ADDITIONAL_DOWNLOAD) {
            totalCost = 1;
        } else {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.BadRequest,
                `Unsupported purchase type: ${input.type}`,
            );
        }

        // Transaction: check user tokens, create purchase, update user tokens
        const sequelize = Database.getInstance();
        return await sequelize.transaction(async (t) => {
            const purchase = await purchaseDao.create(toCreate, {
                transaction: t,
            });

            await userDao.updateTokens(input.buyerId, user.tokens - totalCost, {
                transaction: t,
            });

            return { purchaseId: purchase.idPurchase };
        });
    }

    /**
     * Function to retrieve purchase details by ID.
     *
     * @param idPurchase - The ID of the purchase.
     * @returns {Promise<any>} - A promise resolving with the purchase details.
     */
    static async getDetailsById(idPurchase: number) {
        return await purchaseRepository.getDetailsById(idPurchase);
    }

    /**
     * Function to retrieve a user's purchase history.
     *
     * @param userId - The ID of the user.
     * @returns {Promise<any[]>} - A promise resolving with the list of purchases.
     */
    static async getUserHistory(userId: number) {
        return await purchaseRepository.getUserHistory(userId);
    }
}

export default PurchaseService;
