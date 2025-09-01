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
  productExists(productId: number): Promise<boolean>;              // <-- aggiunto
}

class PurchaseRepository implements IPurchaseRepository {
  /** Aggrega purchase + product + buyer + (recipient) */
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

  /** Storico acquisti utente con filtro opzionale per tipo */
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

  /** True se l'utente ha già un acquisto STANDARD per quel prodotto */
  async hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean> {
    const existing = await purchaseDao.getByBuyerAndProduct(
      userId,
      productId
    );
    return !!existing;
  }

  /** Controlla se il prodotto esiste davvero */
  async productExists(productId: number): Promise<boolean> {
  try {
    await productDao.getById(productId); // lancia NotFound se non esiste
    return true;
  } catch (err) {
    if (err instanceof HttpError && err.statusCode === StatusCodes.NOT_FOUND) {
      return false; // prodotto non trovato
    }
    throw err; // altri errori: rilancia (DB down, ecc.)
  }
}
}

export default new PurchaseRepository();