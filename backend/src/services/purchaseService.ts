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
    //Create a new purchase
    static async createPurchase(input: IPurchaseCreationAttributes): Promise<IPurchaseCreatedOutput> {
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
                'Recipient must be a registered user.'
            );
        }
        const recipientId = (recipientUser as any).idUser ?? recipientUser.idUser;

        toCreate.recipientId = recipientId;
        toCreate.recipientEmail = email;
        } else if (input.type !== PurchaseType.STANDARD) {
        throw HttpErrorFactory.createError(
            HttpErrorCodes.BadRequest,
            `Unsupported purchase type: ${input.type}`
        );
        }

        //Transaction: check user tokens, create purchase, update user tokens
        const sequelize = Database.getInstance();
        return await sequelize.transaction(async (t) => {
        const purchase = await purchaseDao.create(toCreate, { transaction: t });

        await userDao.updateTokens(input.buyerId, user.tokens - totalCost, { transaction: t });

        // (futuro) qui potrai aggiungere la generazione del link di download/filigrana
        return { purchaseId: purchase.idPurchase };
        });
    }

    // Retrieve purchase details by ID
    static async getDetailsById(idPurchase: number) {
        return await purchaseRepository.getDetailsById(idPurchase);
    }

    // Retrieve user purchase history with optional type filter
    static async getUserHistory(userId: number, opts?: { type?: PurchaseType }) {
        return await purchaseRepository.getUserHistory(userId, { type: opts?.type });
    }
}

export default PurchaseService;