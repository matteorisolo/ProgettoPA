import purchaseDao from '../dao/purchaseDao';
import productDao from '../dao/productDao';
import userDao from '../dao/userDao';
import { PurchaseType } from '../enums/PurchaseType';
import Purchase from '../models/purchase';
import Product from '../models/product';
import User from '../models/appUser';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { StatusCodes } from 'http-status-codes';

export interface IPurchaseDetailsDTO {
  purchase: Purchase;
  product: Product;
  buyer: Omit<User, 'password'>;
  recipient?: Omit<User, 'password'> | null;
}

export interface IPurchaseRepository {
  getDetailsById(idPurchase: number): Promise<IPurchaseDetailsDTO>;
  getUserHistory(
    userId: number,
    opts?: { type?: PurchaseType }
  ): Promise<IPurchaseDetailsDTO[]>;
  hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean>;
  productExists(productId: number): Promise<boolean>;              
}

class purchaseRepository implements IPurchaseRepository {
  async getDetailsById(idPurchase: number): Promise<IPurchaseDetailsDTO> {
    const p = await purchaseDao.getById(idPurchase);

    const [product, buyer, recipient] = await Promise.all([
      productDao.getById(p.productId),
      userDao.getById(p.buyerId),
      p.recipientId ? userDao.getById(p.recipientId).catch(() => null) : Promise.resolve(null),
    ]);

    return {
      purchase: p,
      product,
      buyer: buyer as any,
      recipient: recipient as any,
    };
  }

  // Get purchase history for a user, optionally filtered by purchase type
  async getUserHistory(
    userId: number,
    opts?: { type?: PurchaseType }
  ): Promise<IPurchaseDetailsDTO[]> {
    const filters: any = { buyerId: userId };
    if (opts?.type) filters.type = opts.type;

    const list = await purchaseDao.getByFilters(filters);

    const results = await Promise.all(
      list.map(async (p) => {
        const [product, buyer, recipient] = await Promise.all([
          productDao.getById(p.productId),
          userDao.getById(p.buyerId),
          p.recipientId ? userDao.getById(p.recipientId).catch(() => null) : Promise.resolve(null),
        ]);

        return {
          purchase: p,
          product,
          buyer: buyer as any,
          recipient: recipient as any,
        } as IPurchaseDetailsDTO;
      })
    );

    return results;
  }

  // Check if a user has purchased a specific product
  async hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean> {
    const existing = await purchaseDao.getByBuyerAndProduct(
      userId,
      productId
    );
    return !!existing;
  }

  // Check if a product exists by its ID
  async productExists(productId: number): Promise<boolean> {
  try {
    await productDao.getById(productId); 
    return true;
  } catch (err) {
    if (err instanceof HttpError && err.statusCode === StatusCodes.NOT_FOUND) {
      return false; 
    }
    throw err; 
  }
}
}

export default new purchaseRepository();