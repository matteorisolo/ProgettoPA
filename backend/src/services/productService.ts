import productDao from '../dao/productDao';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IProductCreationAttributes } from '../models/product';
import { ProductType } from '../enums/ProductType'; 

// Input DTO for creating a product
export interface CreateProductInput {
    title: string;
    type: ProductType;
    year: number;
    format: string;
    cost: number;
    path: string;
}

/**
 * Filters supported by GET /product (combined with AND).
 */
export interface ProductListFilters {
    type?: ProductType | string;
    year?: number;
    format?: string;
}

export class ProductService {
  // Create a new product
  static async createProduct(input: IProductCreationAttributes) {
        const created: CreateProductInput = await productDao.create({
            title: input.title,
            type: input.type,
            year: input.year,
            format: input.format,
            cost: input.cost,
            path: input.path,
        });

        return created;
  }

  /**
   * Retrieve a single product by ID.
   */
  static async getById(idProduct: number) {
    if (!Number.isFinite(idProduct)) {
        throw HttpErrorFactory.createError(
            HttpErrorCodes.BadRequest,
            'Invalid product id.'
        );
    }
    const product = await productDao.getById(idProduct);
    return product;
  }

  /**
   * List products with optional filters (AND semantics).
   * If no filters are provided, returns all products.
   */
  static async list(filters: ProductListFilters = {}) {
    const hasAnyFilter =
      typeof filters.type !== 'undefined' ||
      typeof filters.year !== 'undefined' ||
      typeof filters.format !== 'undefined';

    if (!hasAnyFilter) {
        // No filters -> return all
        return await productDao.getAll();
    }

    // With filters -> delegate to DAO smart query
    return await productDao.getByFilters({
        type: filters.type,
        year: typeof filters.year === 'number' ? filters.year : undefined,
        format: filters.format,
    });
  }
}

export default ProductService;