import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { HttpErrorFactory } from "../utils/errors/HttpErrorFactory";
import { HttpErrorCodes } from "../utils/errors/HttpErrorCodes";
import { FormatType } from "../enums/FormatType";
import { PurchaseType } from "../enums/PurchaseType";
import purchaseRepository from "../repositories/purchaseRepository";
import { DownloadService } from "../services/downloadService";
import { AuthService } from "../services/authService";
import downloadRepository from "../repositories/downloadRepository";
import fs from "fs";

// Controller function to handle file download requests
export const getDownload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract parameters from request
        const { downloadUrl } = req.params;
        const outputFormat = req.body.outputFormat as FormatType;
        const authUser = (req as RequestWithUser).user;

        // Retrieving and checking the download link
        const download = await downloadRepository.getByUrl(downloadUrl);
        if (!download) {
            throw HttpErrorFactory.createError(HttpErrorCodes.NotFound, "Download link not found.");
        }

        // Check if the download link is expired or has been used up
        if (await downloadRepository.isExpired(downloadUrl)) {
            throw HttpErrorFactory.createError(HttpErrorCodes.BadRequest, "Download link has expired.");
        }
        // Check if the download has already been used the maximum allowed times
        if (download.timesUsed >= download.maxTimes) {
            throw HttpErrorFactory.createError(HttpErrorCodes.BadRequest, "Download link already used.");
        }

        // Retrieve purchase and product details associated with the download
        const purchase = await purchaseRepository.getDetailsById(download.purchaseId);
        if (!purchase || !purchase.product) {
            throw HttpErrorFactory.createError(HttpErrorCodes.NotFound, "Purchase or product not found.");
        }

        const userEmail = (await AuthService.getUserById(authUser.id)).email;
        // isBuyer is true if the authenticated user is the buyer
        const isBuyer = purchase.buyer.idUser === authUser.id;
        const isGift = purchase.type === PurchaseType.GIFT;
        // isRecipient is true if the purchase is a gift and the authenticated user matches the recipient email
        const isRecipient =
            isGift &&
            userEmail &&
            !!purchase.recipient &&
            userEmail === purchase.recipient.email;
        // Authorization check: ensure the user is either the buyer or the gift recipient
        if (!(isBuyer || isRecipient)) {
            throw HttpErrorFactory.createError(HttpErrorCodes.Forbidden, "You are not allowed to download this item.");
        }

        // Process the download and convert format if necessary
        const { filePath, fileName, contentType } = await DownloadService.processDownload(downloadUrl, outputFormat);

        // Send the file to the client and clean up
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.download(filePath, fileName, (err) => {
            if (filePath && fs.existsSync(filePath)) 
                fs.unlink(filePath, () => {});
            if (err) 
                return next(err);
        });
    } 
    catch (err) {
        next(err);
    }
};