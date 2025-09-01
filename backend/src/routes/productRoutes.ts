import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../enums/UserRole";
import { uploadProduct } from "../middlewares/validators/uploadValidate";
import { createProductValidate } from "../middlewares/validators/productValidate";
import { getProductsValidate } from "../middlewares/validators/productValidate";
import { createProduct } from "../controllers/productController";
import { getProducts } from "../controllers/productController";


// Define the router
const router = Router();

// Route for uploading a new product (requires admin role)
router.post(
    '/products',
    authMiddleware,                 // Middleware to authenticate the user
    authorize([UserRole.ADMIN]),    // Only admins can upload products
    uploadProduct.single('file'),   // Middleware to handle file upload
    createProductValidate,                // Middleware to validate product data               
    createProduct                   // Controller to handle product creation
);

router.get(
    '/products',
    getProductsValidate,    // Middleware to validate query parameters
    getProducts             // Controller to handle getting products
);

// Export the router
export default router;