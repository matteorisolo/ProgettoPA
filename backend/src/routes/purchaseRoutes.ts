import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { purchaseValidate } from "../middlewares/validators/purchaseValidate";
import { purchaseProduct } from "../controllers/purchaseController";
import { authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../enums/UserRole";

// Define the router
const router = Router();

// Route for purchasing a digital product
router.post(
    "/purchase",
    authMiddleware,                 // Middleware to authenticate the user
    authorize([UserRole.USER]),     // Only authenticated users can make purchases (not admins)
    purchaseValidate,               // Middleware to validate purchase data
    purchaseProduct                 // Controller to handle the purchase
);

// Export the router
export default router;