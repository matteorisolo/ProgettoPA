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
    /**
     * Function to create a new product.
     *
     * @param input - The attributes required to create the product.
     * @returns {Promise<ICreateProductInput>} - A promise resolving with the created product.
     */
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

    /**
     * Function to retrieve a product by its ID.
     *
     * @param idProduct - The ID of the product to retrieve.
     * @returns {Promise<any>} - A promise resolving with the product if found.
     * @throws {HttpError} - Throws BadRequest if the ID is invalid, or NotFound if the product does not exist.
     */
    static async getById(idProduct: number) {
        if (!Number.isFinite(idProduct)) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.BadRequest,
                'Invalid product id.',
            );
        }
        const product = await productDao.getById(idProduct);
        return product;
    }

    /**
     * Function to list products with optional filters.
     * If no filters are provided, all products are returned.
     *
     * @param filters - Optional filters (type, year, format).
     * @returns {Promise<any[]>} - A promise resolving with the list of products.
     */
    static async list(filters: IProductListFilters = {}) {
        const hasAnyFilter =
            typeof filters.type !== 'undefined' ||
            typeof filters.year !== 'undefined' ||
            typeof filters.format !== 'undefined';

        if (!hasAnyFilter) {
            return await productDao.getAll();
        }

        return await productDao.getByFilters({
            type: filters.type,
            year: typeof filters.year === 'number' ? filters.year : undefined,
            format: filters.format,
        });
    }
}

export default ProductService;
