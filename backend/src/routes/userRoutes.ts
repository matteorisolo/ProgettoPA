import { Router } from 'express';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../enums/UserRole';
import {
    getMyTokens,
    getUserTokens,
    updateUserTokens,
} from '../controllers/userController';
import {
    getUserCreditValidate,
    updateTokensValidate,
} from '../middlewares/validators/userValidate';

// Define the router
const router = Router();

// Route for getting the token of the logged-in user
router.get(
    '/users/me/tokens',
    authMiddleware, // Middleware to authenticate the user
    authorize([UserRole.USER]), // Only authorized user
    getMyTokens, // Controller
);

// Route for getting the token of a specific user by ID (admin only)
router.get(
    '/users/:id/tokens',
    authMiddleware, // Middleware to authenticate the user
    authorize([UserRole.ADMIN]), // Only admin
    getUserCreditValidate, // Validate parameters
    getUserTokens, // Controller
);

// Route for updating the token of a specific user by ID (admin only)
router.patch(
    '/users/:id/tokens',
    authMiddleware, // Middleware to authenticate the user
    authorize([UserRole.ADMIN]), // Only admin
    updateTokensValidate, // Validate parameters
    updateUserTokens, // Controller
);

export default router;
