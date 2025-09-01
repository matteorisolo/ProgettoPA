import productDao from '../dao/productDao';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IProductCreationAttributes } from '../models/product';
import { ProductType } from '../enums/ProductType'; 
import { FormatType } from '../enums/FormatType';

// Input DTO for creating a product
export interface ICreateProductInput {
    title: string;
    type: ProductType;
    year: number;
    format: FormatType;
    cost: number;
    path: string;
}

// Interface for product list filters
export interface IProductListFilters {
    type?: ProductType | string;
    year?: number;
    format?: FormatType | string;
}

export class ProductService {
  // Create a new product
  static async createProduct(input: IProductCreationAttributes) {
        const created: ICreateProductInput = await productDao.create({
            title: input.title,
            type: input.type,
            year: input.year,
            format: input.format,
            cost: input.cost,
            path: input.path,
        });

        return created;
  }

  // Get a product by its ID
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

  // List products with optional filters
  static async list(filters: IProductListFilters = {}) {
    // Check if any filter is provided
    const hasAnyFilter =
      typeof filters.type !== 'undefined' ||
      typeof filters.year !== 'undefined' ||
      typeof filters.format !== 'undefined';

    // No filters -> return all
    if (!hasAnyFilter) {
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