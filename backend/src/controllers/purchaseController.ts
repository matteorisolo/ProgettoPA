import { Request, Response, NextFunction } from "express";
import { IPurchaseCreationAttributes } from "../models/purchase";
import { PurchaseType } from "../enums/PurchaseType";
import { HttpErrorFactory } from "../utils/errors/HttpErrorFactory";
import { HttpErrorCodes } from "../utils/errors/HttpErrorCodes";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { AuthService } from "../services/authService";
import { PurchaseService } from "../services/purchaseService";
import purchaseRepository from "../repositories/purchaseRepository";
import { IDownloadCreationAttributes } from "../models/download";

// Controller function to handle purchasing a product
export const purchaseProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract data from request
        const { productId, recipientEmail } = req.body;
        // Get user info from request (added by authMiddleware)
        const idUser = (req as RequestWithUser).user.id;

        // Check if product to be purchased exists
        const product = await purchaseRepository.productExists(productId);
        if (!product) {
            throw HttpErrorFactory.createError(HttpErrorCodes.NotFound, "Product not found.");
        }

        // Check if a standard purchase already exists for this user and product
        let purchaseType = PurchaseType.STANDARD;
        const existingPurchase = await purchaseRepository.hasUserPurchasedProduct(idUser, productId);
        // If yes, set purchaseType to ADDITIONAL_DOWNLOAD, else to GIFT if recipientEmail is provided
        if (existingPurchase && !recipientEmail) {
            purchaseType = PurchaseType.ADDITIONAL_DOWNLOAD;
        } 
        else if (recipientEmail) {
            purchaseType = PurchaseType.GIFT;
        }

        // Calculate cost based on purchase type
        let cost = product.cost;
        if (purchaseType === PurchaseType.ADDITIONAL_DOWNLOAD) {
            cost = 1;   // Cost for additional download is 1 token
        }

        // Check if user has enough tokens to make the purchase
        const user = await AuthService.getUserById(idUser);
        if (user.tokens < cost) {
            throw HttpErrorFactory.createError(HttpErrorCodes.BadRequest, "Insufficient tokens for this purchase.");
        }

        // Create the purchase record
        const purchaseData: IPurchaseCreationAttributes = {
            buyerId: user.idUser,
            productId: product.idProduct,
            type: purchaseType,
            recipientEmail: recipientEmail || null,
        };
        const purchaseId = await PurchaseService.createPurchase(purchaseData);

        // Create the download record associated with this purchase
        const downloadData: IDownloadCreationAttributes = {
            maxTimes: purchaseType === PurchaseType.GIFT ? 2 : 1,
            timesUsed: 0,
            expiresAt: null            // o data di scadenza se vuoi link temporaneo
        };
        const download = await DownloadService.createDownload(downloadData);

        // Respond with success message and purchase details
        return res.status(201).json({
            message: "Purchase completed successfully",
            purchaseId: purchaseId,
            type: purchaseType,
            downloadUrl: download.downloadUrl
        });
    }
    // Pass any errors to the error handling middleware
    catch (err) {
        next(err);
    }
};