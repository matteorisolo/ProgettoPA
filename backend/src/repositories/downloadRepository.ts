import { Transaction } from 'sequelize';
import downloadDao from '../dao/downloadDao';
import purchaseDao from '../dao/purchaseDao';
import Download from '../models/download';
import Purchase from '../models/purchase';
import { HttpError } from '../utils/errors/HttpError';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IDownloadAttributes } from '../models/download';


export interface IDownloadDetailsDTO {
    download: Download;
    purchase: Purchase;
}

export interface IDownloadRepository {
    getByUrlWithPurchase(downloadUrl: string): Promise<IDownloadDetailsDTO>;
    getByUrl(downloadUrl: string): Promise<Download | null>;
    setUsedBuyerByUrl(downloadUrl: string, opts?: { transaction?: Transaction }): Promise<Download>;
    setUsedRecipientByUrl(downloadUrl: string, opts?: { transaction?: Transaction }): Promise<Download>;
    setExpiration(
        idDownload: number,
        expiresAt: Date | null,
        opts?: { transaction?: Transaction }
    ): Promise<Download>;
    listForUser(userId: number): Promise<IDownloadDetailsDTO[]>;
    listForPurchase(purchaseId: number): Promise<Download[]>;
    isExpired(downloadUrl: string): Promise<boolean>;
    getAllByUrl(downloadUrl: string): Promise<Download[] | null> 
}

class DownloadRepository implements IDownloadRepository {
  
    // Returns the download along with its associated purchase
    async getByUrlWithPurchase(downloadUrl: string): Promise<IDownloadDetailsDTO> {
        const download = await downloadDao.getByDownloadUrl(downloadUrl); 
        const purchase = await purchaseDao.getById(download.purchaseId);
        return { download, purchase };
    }

    // Retrieve a download by its URL
    async getByUrl(downloadUrl: string): Promise<Download | null> {
         const download = await Download.findOne({ where: { downloadUrl: downloadUrl } });
         return download;
         if (!download) {
            return null;    
        }
    }

    // Sets that the buyer has used the download link
    async setUsedBuyerByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction }
    ): Promise<Download> {
        try {
            const d = await this.getByUrl(downloadUrl); 

            if (!d) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download not found for url ${downloadUrl}.`
                );
            }   

            d.usedBuyer = true; // Mark that the buyer has used the link
            await d.save({ transaction: opts?.transaction });

            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error incrementing timesUsed for url ${downloadUrl}.`
            );
        }
    }

    // Sets that the recipient has used the download link
    async setUsedRecipientByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction }
    ): Promise<Download> {
        try {
            const d = await this.getByUrl(downloadUrl); 

            if (!d) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Download not found for url ${downloadUrl}.`
                );
            }   

            d.usedRecipient = true; // Mark that the recipient has used the link
            await d.save({ transaction: opts?.transaction });

            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error incrementing timesUsed for url ${downloadUrl}.`
            );
        }
    }

    // Sets or clears the expiration date for a download link
    async setExpiration(
        idDownload: number,
        expiresAt: Date | null,
        opts?: { transaction?: Transaction }
    ): Promise<Download> {
        try {
            const d = await downloadDao.getById(idDownload); // 404 se non esiste
            d.expiresAt = expiresAt ?? null;
            await d.save({ transaction: opts?.transaction });
            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error setting expiration for download ${idDownload}.`
            );
        }
    }

    // Lists all downloads associated with a user's purchases
    async listForUser(userId: number): Promise<IDownloadDetailsDTO[]> {
        const purchases = await purchaseDao.getByFilters({ buyerId: userId });
        if (!purchases.length) return [];

        const chunks = await Promise.all(
        purchases.map(async (p) => {
            const downloads = await downloadDao.getAllByPurchase(p.idPurchase);
            return downloads.map((d) => ({ download: d, purchase: p } as IDownloadDetailsDTO));
        })
        );

        return chunks.flat();
    }

    // Lists all downloads for a specific purchase
    async listForPurchase(purchaseId: number): Promise<Download[]> {
        await purchaseDao.getById(purchaseId);
        return downloadDao.getAllByPurchase(purchaseId);
    }

    // Check if a download link is expired based on its URL
    async isExpired(downloadUrl: string): Promise<boolean> {
        const download = await this.getByUrl(downloadUrl);
        if (!download?.expiresAt)
            return false;
        return new Date() > download.expiresAt; 
    }

    //Retrieve all downloads by URL
    async getAllByUrl(downloadUrl: string): Promise<Download[] | null> {
        const downloads = await Download.findAll({ where: { downloadUrl: downloadUrl } });
        return downloads;
        if (!downloads) {
            return null;    
        }
    }

    //Update DownloadUrl
    async updateDownloadUrl(downloadId: number, newDownloadUrl: string): Promise<void> {
        downloadDao.updateDownloadUrl(downloadId, newDownloadUrl);
    }

}

export default new DownloadRepository();