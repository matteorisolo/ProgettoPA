import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { createPurchaseValidate } from '../middlewares/validators/purchaseValidate';
import { getPurchasesValidate } from '../middlewares/validators/purchaseValidate';
import { purchaseProduct } from '../controllers/purchaseController';
import { getUserPurchases } from '../controllers/purchaseController';
import { authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../enums/UserRole';

// Define the router
const router = Router();

// Route for purchasing a digital product
router.post(
    '/purchase',
    authMiddleware, // Middleware to authenticate the user
    authorize([UserRole.USER]), // Only authenticated users can make purchases (not admins)
    createPurchaseValidate, // Middleware to validate purchase data
    purchaseProduct, // Controller to handle the purchase
);

// Route to get all purchases of the authenticated user
router.get(
    '/purchases',
    authMiddleware, // Middleware to authenticate the user
    authorize([UserRole.USER]), // Only standard users (not admin)
    getPurchasesValidate, // Validator for query parameters
    getUserPurchases, // Controller to return user's purchases in JSON or PDF
);

// Export the router
export default router;
