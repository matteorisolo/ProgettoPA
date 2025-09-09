import { Transaction } from 'sequelize';
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
    updateDownloadUrl(
        downloadId: number,
        newDownloadUrl: string,
    ): Promise<void>;
}

class DownloadDao implements IDownloadDAO {
    /**
     * Function to retrieve all downloads.
     *
     * @returns {Promise<Download[]>} - A promise resolving with an array of downloads.
     */
    public async getAll(): Promise<Download[]> {
        try {
            return await Download.findAll();
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error retrieving all downloads.',
            );
        }
    }

    /**
     * Function to retrieve a download by its ID.
     *
     * @param id - The primary key ID of the download.
     * @returns {Promise<Download>} - A promise resolving with the download.
     */
    public async getById(id: number): Promise<Download> {
        try {
            const d = await Download.findByPk(id);
            if (!d) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download not found with ID ${id}.`,
                );
            }
            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving download with ID ${id}.`,
            );
        }
    }

    /**
     * Function to create a new download.
     *
     * @param data - The attributes required to create the download.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<Download>} - A promise resolving with the newly created download.
     */
    public async create(
        data: IDownloadCreationAttributes,
        options?: { transaction?: Transaction },
    ): Promise<Download> {
        try {
            return await Download.create(data, options);
        } catch {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                'Error creating new download.',
            );
        }
    }

    /**
     * Function to update an existing download.
     *
     * @param id - The ID of the download to update.
     * @param data - The attributes to update.
     * @returns {Promise<[number, Download[]]>} - A promise resolving with the number of updated rows and the updated downloads.
     */
    public async update(
        id: number,
        data: IDownloadAttributes,
    ): Promise<[number, Download[]]> {
        try {
            const [rows, updated] = await Download.update(data, {
                where: { idDownload: id },
                returning: true,
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download with ID ${id} not found.`,
                );
            }
            return [rows, updated];
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating download with ID ${id}.`,
            );
        }
    }

    /**
     * Function to delete a download by its ID.
     *
     * @param id - The ID of the download to delete.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<[number, Download]>} - A promise resolving with the number of deleted rows and the deleted download.
     */
    public async delete(
        id: number,
        options?: { transaction?: Transaction },
    ): Promise<[number, Download]> {
        try {
            const d = await Download.findByPk(id);
            if (!d) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download with ID ${id} not found.`,
                );
            }
            const rows = await Download.destroy({
                where: { idDownload: id },
                ...options,
            });
            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download with ID ${id} not found.`,
                );
            }
            return [rows, d];
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error deleting download with ID ${id}.`,
            );
        }
    }

    /**
     * Function to retrieve a download by its unique download URL.
     *
     * @param downloadUrl - The unique URL of the download.
     * @returns {Promise<Download>} - A promise resolving with the download.
     */
    public async getByDownloadUrl(downloadUrl: string): Promise<Download> {
        try {
            const d = await Download.findOne({ where: { downloadUrl } });
            if (!d) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download not found for url ${downloadUrl}.`,
                );
            }
            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving download by url ${downloadUrl}.`,
            );
        }
    }

    /**
     * Function to retrieve all downloads associated with a specific purchase.
     *
     * @param purchaseId - The purchase ID used to retrieve downloads.
     * @returns {Promise<Download[]>} - A promise resolving with an array of downloads.
     */
    public async getAllByPurchase(purchaseId: number): Promise<Download[]> {
        try {
            return await Download.findAll({ where: { purchaseId } });
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error retrieving downloads for purchase ${purchaseId}.`,
            );
        }
    }

    /**
     * Function to update the download URL of a specific download.
     *
     * @param downloadId - The ID of the download to update.
     * @param newDownloadUrl - The new URL to be set.
     * @param options - Optional Sequelize transaction configuration.
     * @returns {Promise<void>} - A promise that resolves when the update is completed.
     */
    public async updateDownloadUrl(
        downloadId: number,
        newDownloadUrl: string,
        options?: { transaction?: Transaction },
    ): Promise<void> {
        try {
            const [rows] = await Download.update(
                { downloadUrl: newDownloadUrl } as Partial<IDownloadAttributes>,
                {
                    where: { idDownload: downloadId },
                    returning: true,
                    transaction: options?.transaction,
                },
            );

            if (rows === 0) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download with ID ${downloadId} not found.`,
                );
            }
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error updating Download Url for download with ID ${downloadId}.`,
            );
        }
    }
}

export default new DownloadDao();
