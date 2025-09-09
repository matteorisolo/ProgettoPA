import { Request, Response, NextFunction } from 'express';
import { IPurchaseCreationAttributes } from '../models/purchase';
import { PurchaseType } from '../enums/PurchaseType';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { RequestWithUser } from '../middlewares/authMiddleware';
import { AuthService } from '../services/authService';
import { PurchaseService } from '../services/purchaseService';
import purchaseRepository from '../repositories/purchaseRepository';
import { IDownloadCreationAttributes } from '../models/download';
import { DownloadService } from '../services/downloadService';
import { generatePDF } from '../utils/pdf';
import downloadRepository from '../repositories/downloadRepository';

// Interface to define PurchaseResult to show to the client as response
export interface IPurchaseResult {
    purchaseId: number;
    type: PurchaseType;
    productId: number;
    recipientEmail: string;
}

// Controller function to handle purchasing a product
export const purchaseProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Extract data from request
        const { productIds, recipientEmail } = req.body;
        // Determine if the purchase is a bundle (more than one product)
        const isBundle = productIds.length > 1;
        // Get user info from request (added by authMiddleware)
        const idUser = (req as RequestWithUser).user.id;
        const purchaseTypes: PurchaseType[] = [];
        const purchasesResult: IPurchaseResult[] = [];
        let downloadUrl: string = '';

        // Calculate total cost and validate products
        let totalCost = 0;
        for (let i = 0; i < productIds.length; i++) {
            const product = await purchaseRepository.productExists(
                productIds[i],
            );
            if (!product) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.NotFound,
                    `Product ${productIds[i]} not found.`,
                );
            }

            // Check if a standard purchase already exists for this user and product
            let purchaseType = PurchaseType.STANDARD;
            const existingPurchase =
                await purchaseRepository.hasUserPurchasedProduct(
                    idUser,
                    productIds[i],
                );

            // If yes, set purchaseType to ADDITIONAL_DOWNLOAD, else to GIFT if recipientEmail is provided
            if (existingPurchase && !recipientEmail) {
                purchaseType = PurchaseType.ADDITIONAL_DOWNLOAD;
            }
            // If no existing purchase and recipientEmail is provided, it's a gift
            else if (recipientEmail) {
                purchaseType = PurchaseType.GIFT;
            }

            // Store the determined purchase type for this product (for later use)
            purchaseTypes.push(purchaseType);

            // Calculate cost based on purchase type
            let cost =
                purchaseType === PurchaseType.ADDITIONAL_DOWNLOAD
                    ? 1
                    : product.cost;
            if (purchaseType === PurchaseType.GIFT) {
                cost += 0.5; // Cost for gift is product cost + 0.5 token fee
            }
            totalCost += cost;
        }

        // Check if user has enough tokens to make the purchase
        const user = await AuthService.getUserById(idUser);
        if (user.tokens < totalCost) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.BadRequest,
                'Insufficient tokens for this purchase.',
            );
        }

        // Cycle through products again to create purchases and downloads
        for (let i = 0; i < productIds.length; i++) {
            const productId = productIds[i];
            const purchaseType = purchaseTypes[i];

            // Create purchase record
            const purchaseData: IPurchaseCreationAttributes = {
                buyerId: user.idUser,
                productId: productId,
                type: purchaseType,
                recipientEmail: recipientEmail,
            };
            const purchaseId = (
                await PurchaseService.createPurchase(purchaseData)
            ).purchaseId;

            // Create download record
            const downloadData: IDownloadCreationAttributes = {
                purchaseId: purchaseId,
                usedBuyer: false,
                usedRecipient:
                    purchaseType === PurchaseType.GIFT ? false : undefined,
                expiresAt: null,
                isBundle: isBundle,
            };
            const download = await DownloadService.createDownload(downloadData);
            // For bundles, all downloads share the same downloadUrl
            if (i === 0) downloadUrl = download.downloadUrl;
            // Update downloadUrl for non-first downloads in the bundle (no new UUID)
            else
                await downloadRepository.updateDownloadUrl(
                    download.idDownload,
                    downloadUrl,
                );

            // Prepare response data
            purchasesResult.push({
                purchaseId,
                type: purchaseType,
                productId,
                recipientEmail,
            });
        }

        // Respond with success message and purchase details
        return res.status(201).json({
            message: 'Purchase completed successfully',
            totalCost: totalCost,
            purchases: purchasesResult.map((p) => ({
                purchaseId: p.purchaseId,
                productId: p.productId,
                type: p.type,
                recipientEmail: p.recipientEmail,
            })),
            downloadUrl: downloadUrl,
        });
    } catch (err) {
        // Pass any errors to the error handling middleware
        next(err);
    }
};

// Controller to get purchases of the authenticated user
export const getUserPurchases = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Get authenticated user from request
        const user = (req as RequestWithUser).user;
        // Check requested format from query params (default 'json')
        const format = (req.query.format as string) || 'json';

        // Get all purchases for this user from service/repository
        const purchases = await purchaseRepository.getUserHistory(user.id);

        // Group purchases by type
        const grouped = {
            [PurchaseType.STANDARD]: purchases.filter(
                (p) => p.type === PurchaseType.STANDARD,
            ),
            [PurchaseType.GIFT]: purchases.filter(
                (p) => p.type === PurchaseType.GIFT,
            ),
            [PurchaseType.ADDITIONAL_DOWNLOAD]: purchases.filter(
                (p) => p.type === PurchaseType.ADDITIONAL_DOWNLOAD,
            ),
        };

        // Return PDF if requested
        if (format === 'pdf') {
            const pdfBuffer = await generatePDF(user.id, grouped);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=purchases.pdf',
            );
            return res.send(pdfBuffer);
        }

        // Default: return JSON
        return res.status(200).json(grouped);
    } catch (err) {
        next(err);
    }
};
