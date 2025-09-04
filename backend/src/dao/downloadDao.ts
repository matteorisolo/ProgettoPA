import { Transaction, Op } from 'sequelize';
import { DAO } from './daoInterface';
import Download, {
  IDownloadAttributes,
  IDownloadCreationAttributes,
} from '../models/download';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';

export interface IDownloadDAO extends DAO<IDownloadAttributes, number> {
    getByDownloadUrl(downloadUrl: string): Promise<Download>;
    getAllByPurchase(purchaseId: number): Promise<Download[]>;
}

class DownloadDao implements IDownloadDAO {
    
    // Retrieve all downloads
    public async getAll(): Promise<Download[]> {
        try {
            return await Download.findAll();
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving all downloads.'
            );
        }
    }

    // Retrieve a download by its primary key
    public async getById(id: number): Promise<Download> {
        try {
            const d = await Download.findByPk(id);
            if (!d) {
                throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `Download not found with ID ${id}.`
                );
            }
            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving download with ID ${id}.`
            );
        }
    }

    // Create a new download
    public async create(
        data: IDownloadCreationAttributes,
        options?: { transaction?: Transaction }
    ): Promise<Download> {
        try {
            return await Download.create(data, options);
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error creating new download.'
            );
        }
    }

    // Update an existing download
    public async update(
        id: number,
        data: IDownloadAttributes
    ): Promise<[number, Download[]]> {
        try {
            const [rows, updated] = await Download.update(data, {
                where: { idDownload: id },
                returning: true,
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `Download with ID ${id} not found.`
                );
            }
            return [rows, updated];
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating download with ID ${id}.`
            );
        }
    }

    // Delete a download by its primary key
    public async delete(
        id: number,
        options?: { transaction?: Transaction }
    ): Promise<[number, Download]> {
        try {
            const d = await Download.findByPk(id);
            if (!d) {
                throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `Download with ID ${id} not found.`
                );
            }
            const rows = await Download.destroy({ where: { idDownload: id }, ...options });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `Download with ID ${id} not found.`
                );
            }
            return [rows, d];
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error deleting download with ID ${id}.`
            );
        }
    }

    // Retrieve a download by its unique downloadUrl
    public async getByDownloadUrl(downloadUrl: string): Promise<Download> {
        try {
            const d = await Download.findOne({ where: { downloadUrl } });
            if (!d) {
                throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `Download not found for url ${downloadUrl}.`
                );
            }
            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving download by url ${downloadUrl}.`
            );
        }
    }

    // Retrieve all downloads associated with a specific purchase ID
    public async getAllByPurchase(purchaseId: number): Promise<Download[]> {
        try {
            return await Download.findAll({ where: { purchaseId } });
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving downloads for purchase ${purchaseId}.`
            );
        }
    }
}

export default new DownloadDao();