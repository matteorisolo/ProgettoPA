import { Transaction } from 'sequelize';
import downloadDao from '../dao/downloadDao';
import purchaseDao from '../dao/purchaseDao';
import Download from '../models/download';
import Purchase from '../models/purchase';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';

export interface IDownloadDetailsDTO {
    download: Download;
    purchase: Purchase;
}

export interface IDownloadRepository {
    getByUrlWithPurchase(downloadUrl: string): Promise<IDownloadDetailsDTO>;
    getByUrl(downloadUrl: string): Promise<Download | null>;
    setUsedBuyerByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction },
    ): Promise<void>;
    setUsedRecipientByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction },
    ): Promise<void>;
    setExpiration(
        idDownload: number,
        expiresAt: Date | null,
        opts?: { transaction?: Transaction },
    ): Promise<Download>;
    listForUser(userId: number): Promise<IDownloadDetailsDTO[]>;
    listForPurchase(purchaseId: number): Promise<Download[]>;
    isExpired(downloadUrl: string): Promise<boolean>;
    getAllByUrl(downloadUrl: string): Promise<Download[] | null>;
}

class DownloadRepository implements IDownloadRepository {
    /**
     * Function to retrieve a download along with its associated purchase.
     *
     * @param downloadUrl - The URL of the download.
     * @returns {Promise<IDownloadDetailsDTO>} - A promise resolving with the download and purchase data.
     */
    async getByUrlWithPurchase(
        downloadUrl: string,
    ): Promise<IDownloadDetailsDTO> {
        const download = await downloadDao.getByDownloadUrl(downloadUrl);
        const purchase = await purchaseDao.getById(download.purchaseId);
        return { download, purchase };
    }

    /**
     * Function to retrieve a download by its URL.
     *
     * @param downloadUrl - The URL of the download.
     * @returns {Promise<Download | null>} - A promise resolving with the download or null if not found.
     */
    async getByUrl(downloadUrl: string): Promise<Download | null> {
        const download = await Download.findOne({
            where: { downloadUrl: downloadUrl },
        });
        return download;
        if (!download) {
            return null;
        }
    }

    /**
     * Function to set that the buyer has used the download link.
     *
     * @param downloadUrl - The URL of the download.
     * @param opts - Optional Sequelize transaction configuration.
     * @returns {Promise<void>} - A promise resolving when the update is complete.
     */
    async setUsedBuyerByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction },
    ): Promise<void> {
        try {
            const downloads = await this.getAllByUrl(downloadUrl);

            if (!downloads) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download not found for url ${downloadUrl}.`,
                );
            }

            for (const d of downloads) {
                d.usedBuyer = true;
                await d.save({ transaction: opts?.transaction });
            }
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error incrementing timesUsed for url ${downloadUrl}.`,
            );
        }
    }

    /**
     * Function to set that the recipient has used the download link.
     *
     * @param downloadUrl - The URL of the download.
     * @param opts - Optional Sequelize transaction configuration.
     * @returns {Promise<void>} - A promise resolving when the update is complete.
     */
    async setUsedRecipientByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction },
    ): Promise<void> {
        try {
            const downloads = await this.getAllByUrl(downloadUrl);

            if (!downloads) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download not found for url ${downloadUrl}.`,
                );
            }

            for (const d of downloads) {
                d.usedRecipient = true;
                await d.save({ transaction: opts?.transaction });
            }
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error incrementing timesUsed for url ${downloadUrl}.`,
            );
        }
    }

    /**
     * Function to set or clear the expiration date for a download.
     *
     * @param idDownload - The ID of the download to update.
     * @param expiresAt - The expiration date, or null to remove it.
     * @param opts - Optional Sequelize transaction configuration.
     * @returns {Promise<Download>} - A promise resolving with the updated download.
     */
    async setExpiration(
        idDownload: number,
        expiresAt: Date | null,
        opts?: { transaction?: Transaction },
    ): Promise<Download> {
        try {
            const d = await downloadDao.getById(idDownload);
            d.expiresAt = expiresAt ?? null;
            await d.save({ transaction: opts?.transaction });
            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error setting expiration for download ${idDownload}.`,
            );
        }
    }

    /**
     * Function to list all downloads associated with a user's purchases.
     *
     * @param userId - The ID of the user.
     * @returns {Promise<IDownloadDetailsDTO[]>} - A promise resolving with downloads and their associated purchases.
     */
    async listForUser(userId: number): Promise<IDownloadDetailsDTO[]> {
        const purchases = await purchaseDao.getByFilters({ buyerId: userId });
        if (!purchases.length) return [];

        const chunks = await Promise.all(
            purchases.map(async (p) => {
                const downloads = await downloadDao.getAllByPurchase(
                    p.idPurchase,
                );
                return downloads.map(
                    (d) =>
                        ({ download: d, purchase: p }) as IDownloadDetailsDTO,
                );
            }),
        );

        return chunks.flat();
    }

    /**
     * Function to list all downloads for a specific purchase.
     *
     * @param purchaseId - The ID of the purchase.
     * @returns {Promise<Download[]>} - A promise resolving with an array of downloads.
     */
    async listForPurchase(purchaseId: number): Promise<Download[]> {
        await purchaseDao.getById(purchaseId);
        return downloadDao.getAllByPurchase(purchaseId);
    }

    /**
     * Function to check if a download link is expired.
     *
     * @param downloadUrl - The URL of the download.
     * @returns {Promise<boolean>} - True if expired, otherwise false.
     */
    async isExpired(downloadUrl: string): Promise<boolean> {
        const download = await this.getByUrl(downloadUrl);
        if (!download?.expiresAt) return false;
        return new Date() > download.expiresAt;
    }

    /**
     * Function to retrieve all downloads by URL.
     *
     * @param downloadUrl - The URL of the download.
     * @returns {Promise<Download[] | null>} - A promise resolving with downloads or null if not found.
     */
    async getAllByUrl(downloadUrl: string): Promise<Download[] | null> {
        const downloads = await Download.findAll({
            where: { downloadUrl: downloadUrl },
        });
        return downloads;
        if (!downloads) {
            return null;
        }
    }

    /**
     * Function to update the URL of a download.
     *
     * @param downloadId - The ID of the download to update.
     * @param newDownloadUrl - The new URL to set.
     * @returns {Promise<void>} - A promise resolving when the update is complete.
     */
    async updateDownloadUrl(
        downloadId: number,
        newDownloadUrl: string,
    ): Promise<void> {
        downloadDao.updateDownloadUrl(downloadId, newDownloadUrl);
    }
}

export default new DownloadRepository();
