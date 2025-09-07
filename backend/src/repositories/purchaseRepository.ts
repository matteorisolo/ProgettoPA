import purchaseDao from '../dao/purchaseDao';
import productDao from '../dao/productDao';
import userDao from '../dao/userDao';
import { PurchaseType } from '../enums/PurchaseType';
import Product from '../models/product';
import User from '../models/appUser';
import { HttpError } from '../utils/errors/HttpError';
import { StatusCodes } from 'http-status-codes';
import AppUser from '../models/appUser';

export interface IPurchaseDetailsDTO {
	type: PurchaseType;
	product: Product;
	buyer: Omit<User, 'password'>;
	recipient?: Omit<User, 'password'> | null;
}

export interface IPurchaseListAttributes{
	type: PurchaseType;
	product: Omit<Product, 'path'>;
	recipient?: Omit<User, 'idUser, password, role, tokens' > | null;
}

export interface IPurchaseRepository {
	getDetailsById(idPurchase: number): Promise<IPurchaseDetailsDTO>;
	getUserHistory(
		userId: number,
		opts?: { type?: PurchaseType }
	): Promise<IPurchaseListAttributes[]>;
	hasUserPurchasedProduct(userId: number, productId: number): Promise<boolean>;
	productExists(productId: number): Promise<Product | null>;              
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
			type: p.type,
			product,
			buyer: buyer as AppUser,
			recipient: recipient as AppUser,
		};
  	}

	// Get purchase history for a user, optionally filtered by purchase type
	async getUserHistory(
		userId: number
	): Promise<IPurchaseListAttributes[]> {
		const filters = { buyerId: userId };

		const list = await purchaseDao.getByFilters(filters);

		const results = await Promise.all(
			list.map(async (p) => {
				const [product, , recipient] = await Promise.all([
					productDao.getById(p.productId),
					userDao.getById(p.buyerId),
					p.recipientId ? userDao.getById(p.recipientId).catch(() => null) : Promise.resolve(null),
				]);


				return {
					type: p.type,
					product: { idProduct: product.idProduct,
						title: product.title,
						type: product.type,
						year: product.year,
						cost: product.cost,
						format: product.format,},
					recipient: {firstName: recipient?.firstName,
						lastName: recipient?.lastName,
						email: recipient?.email}
				} as IPurchaseListAttributes;
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

	// Check if a product exists by its ID and return the product or null
	async productExists(productId: number): Promise<Product | null> {
		try {
			const product = await productDao.getById(productId); 
			return product;                                       
		}
		catch (err) {
			if (err instanceof HttpError && err.statusCode === StatusCodes.NOT_FOUND) {
				return null;                                       
			}
			throw err;                                            
		}
	}
}

export default new purchaseRepository();