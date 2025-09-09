import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../middlewares/authMiddleware';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { FormatType } from '../enums/FormatType';
import { PurchaseType } from '../enums/PurchaseType';
import purchaseRepository from '../repositories/purchaseRepository';
import { DownloadService } from '../services/downloadService';
import { AuthService } from '../services/authService';
import downloadRepository from '../repositories/downloadRepository';
import fs from 'fs';

// Controller function to handle downloading a purchased asset
export const getDownload = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { downloadUrl } = req.params;
        const outputFormat = req.query.outputFormat as FormatType;
        const authUser = (req as RequestWithUser).user;
        // Get the email of the authenticated user
        const userEmail = (await AuthService.getUserById(authUser.id)).email;

        // Retrieve all downloads associated with the provided downloadUrl
        const downloads = await downloadRepository.getAllByUrl(downloadUrl);
        if (!downloads || downloads.length === 0) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                'Download link not found.',
            );
        }

        // Since all downloads with the same URL share the same purchase details, we can check just the first one
        const firstDownload = downloads[0];

        // Check if the download link has expired
        if (await downloadRepository.isExpired(downloadUrl)) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.BadRequest,
                'Download link has expired.',
            );
        }

        for (const d of downloads) {
            const purchaseDetail = await purchaseRepository.getDetailsById(
                d.purchaseId,
            );
            if (!purchaseDetail || !purchaseDetail.product)
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    'Purchase or product not found.',
                );
        }

        // Determine if the authenticated user is the buyer or the gift recipient
        const purchaseDetail = await purchaseRepository.getDetailsById(
            firstDownload.purchaseId,
        );
        const isBuyer = purchaseDetail.buyer.idUser === authUser.id;
        const isGift = purchaseDetail.type === PurchaseType.GIFT;
        const isRecipient =
            isGift &&
            userEmail &&
            !!purchaseDetail.recipient &&
            userEmail === purchaseDetail.recipient.email;
        // Authorization check: ensure the user is either the buyer or the gift recipient
        if (!(isBuyer || isRecipient)) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.Forbidden,
                'You are not allowed to download this item.',
            );
        }

        // Check if the download link has already been used by this user (buyer or recipient)
        if (isBuyer && firstDownload.usedBuyer)
            throw HttpErrorFactory.createError(
                HttpErrorCodes.BadRequest,
                'Download link already used for buyer.',
            );
        else if (isRecipient && firstDownload.usedRecipient)
            throw HttpErrorFactory.createError(
                HttpErrorCodes.BadRequest,
                'Download link already used for recipient.',
            );

        // Process the download (generate file or zip for bundles)
        const { filePath, fileName, contentType } =
            await DownloadService.processDownload(
                firstDownload.downloadUrl,
                isBuyer,
                outputFormat,
            );

        // Send the file or zip to the client and clean up
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.download(filePath, fileName, (err) => {
            if (filePath && fs.existsSync(filePath))
                fs.unlink(filePath, () => {});
            if (err) return next(err);
        });
    } catch (err) {
        next(err);
    }
};
