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
    // Retrieve all products
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

    // Retrieve a product by its primary key
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

    // Create a new product
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

    // Update an existing product
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

    // Delete a product by its ID
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

    // Get all products by type
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

    // Get all products by year
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

    // Get all products by format
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

    // Combined filters in AND: only the present fields are applied.
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
