import { DAO } from './daoInterface';
import Product, {
    IProductAttributes,
    IProductCreationAttributes,
} from '../models/product';
import { Transaction } from 'sequelize';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';

// ProductDAO interface extending the base DAO interface
export interface IProductDAO extends DAO<IProductAttributes, number> {
    getByType(type: string): Promise<Product[]>;
    getByYear(year: number): Promise<Product[]>;
    getByFormat(format: string): Promise<Product[]>;
    getByFilters(filters: {
        type?: string;
        year?: number;
        format?: string;
    }): Promise<Product[]>;
}

export interface IFilters {
    type: string;
    year: number;
    format: string;
}

class ProductDao implements IProductDAO {
    /**
     * Function to retrieve all products.
     *
     * @returns {Promise<Product[]>} - A promise resolving with an array of products.
     */
    public async getAll(): Promise<Product[]> {
        try {
            return await Product.findAll();
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving all products.',
            );
        }
    }

    /**
     * Function to retrieve a product by its ID.
     *
     * @param id - The primary key ID of the product.
     * @returns {Promise<Product>} - A promise resolving with the product.
     */
    public async getById(id: number): Promise<Product> {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Product not found with ID ${id}.`,
                );
            }
            return product;
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving product with ID ${id}.`,
            );
        }
    }

    /**
     * Function to create a new product.
     *
     * @param product - The attributes required to create the product.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<Product>} - A promise resolving with the newly created product.
     */
    public async create(
        product: IProductCreationAttributes,
        options?: { transaction?: Transaction },
    ): Promise<Product> {
        try {
            return await Product.create(product, options);
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error creating new product.',
            );
        }
    }

    /**
     * Function to update an existing product.
     *
     * @param id - The ID of the product to update.
     * @param product - The attributes to update.
     * @returns {Promise<[number, Product[]]>} - A promise resolving with the number of updated rows and the updated products.
     */
    public async update(
        id: number,
        product: IProductAttributes,
    ): Promise<[number, Product[]]> {
        try {
            const [rows, updated] = await Product.update(product, {
                where: { idProduct: id },
                returning: true, // returns the updated rows
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Product with ID ${id} not found.`,
                );
            }
            return [rows, updated];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating product with ID ${id}.`,
            );
        }
    }

    /**
     * Function to delete a product by its ID.
     *
     * @param id - The ID of the product to delete.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<[number, Product]>} - A promise resolving with the number of deleted rows and the deleted product.
     */
    public async delete(
        id: number,
        options?: { transaction?: Transaction },
    ): Promise<[number, Product]> {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Product with ID ${id} not found.`,
                );
            }
            const rows = await Product.destroy({
                where: { idProduct: id },
                ...options,
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Product with ID ${id} not found.`,
                );
            }
            return [rows, product];
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error deleting product with ID ${id}.`,
            );
        }
    }

    // ------- Custom methods useful for the catalog -------

    /**
     * Function to retrieve products by type.
     *
     * @param type - The product type used as filter.
     * @returns {Promise<Product[]>} - A promise resolving with an array of products.
     */
    public async getByType(type: string): Promise<Product[]> {
        try {
            return await Product.findAll({ where: { type } });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving products by type ${type}.`,
            );
        }
    }

    /**
     * Function to retrieve products by year.
     *
     * @param year - The production/publication year used as filter.
     * @returns {Promise<Product[]>} - A promise resolving with an array of products.
     */
    public async getByYear(year: number): Promise<Product[]> {
        try {
            return await Product.findAll({ where: { year } });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving products by year ${year}.`,
            );
        }
    }

    /**
     * Function to retrieve products by format.
     *
     * @param format - The product format used as filter.
     * @returns {Promise<Product[]>} - A promise resolving with an array of products.
     */
    public async getByFormat(format: string): Promise<Product[]> {
        try {
            return await Product.findAll({ where: { format } });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving products by format ${format}.`,
            );
        }
    }

    /**
     * Function to retrieve products by a combination of filters (AND).
     * Only present fields are applied to the query.
     *
     * @param filters - The optional filters (type, year, format) to apply.
     * @returns {Promise<Product[]>} - A promise resolving with an array of products.
     */
    public async getByFilters(filters: {
        type?: string;
        year?: number;
        format?: string;
    }): Promise<Product[]> {
        try {
            const where: Partial<IFilters> = {};
            if (filters.type) where.type = filters.type;
            if (typeof filters.year === 'number') where.year = filters.year;
            if (filters.format) where.format = filters.format;

            return await Product.findAll({ where });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving products by filters.`,
            );
        }
    }
}

export default new ProductDao();
