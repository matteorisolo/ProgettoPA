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
    getActiveByUrl(downloadUrl: string): Promise<Download>;
    incrementTimesUsedByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction }
    ): Promise<Download>;
    setExpiration(
        idDownload: number,
        expiresAt: Date | null,
        opts?: { transaction?: Transaction }
    ): Promise<Download>;
    listForUser(userId: number): Promise<IDownloadDetailsDTO[]>;
    listForPurchase(purchaseId: number): Promise<Download[]>;
}

class DownloadRepository implements IDownloadRepository {
  
    // Returns the download along with its associated purchase
    async getByUrlWithPurchase(downloadUrl: string): Promise<IDownloadDetailsDTO> {
        const download = await downloadDao.getByDownloadUrl(downloadUrl); 
        const purchase = await purchaseDao.getById(download.purchaseId);
        return { download, purchase };
    }

    //Returns the download if it's still active (not expired and within usage limits)
    async getActiveByUrl(downloadUrl: string): Promise<Download> {
        try {
            const d = await downloadDao.getByDownloadUrl(downloadUrl); 

            if (d.expiresAt && new Date() > d.expiresAt) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.Forbidden, 
                    'Download link expired.'
                );
            }

            // limite utilizzi
            if (d.timesUsed >= d.maxTimes) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.Forbidden,
                    'Download limit exceeded.'
                );
            }

            return d;
        } catch (err) {
            if (err instanceof HttpError) throw err;
            throw HttpErrorFactory.createError(
                HttpErrorCodes.InternalServerError,
                `Error validating download by url ${downloadUrl}.`
            );
        }
    }

   // Increments the timesUsed counter for a download link after validating its status
    async incrementTimesUsedByUrl(
        downloadUrl: string,
        opts?: { transaction?: Transaction }
    ): Promise<Download> {
        try {
            const d = await this.getActiveByUrl(downloadUrl); // valida stato

            d.timesUsed += 1;
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

    // Retrieve a download by its URL
    async getByUrl(downloadUrl: string): Promise<Download | null> {
         const download = await Download.findOne({ where: { downloadUrl: downloadUrl } });
         return download;
         if (!download) {
            return null;    
        }
    }

    // Check if a download link is expired based on its URL
    async isExpired(downloadUrl: string): Promise<boolean> {
        const download = await this.getByUrl(downloadUrl);
        if (!download?.expiresAt)
            return false;
        return new Date() > download.expiresAt; 
    }

}

export default new DownloadRepository();