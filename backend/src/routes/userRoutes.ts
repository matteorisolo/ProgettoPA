import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/authMiddleware";
import { UserRole } from "../enums/UserRole";
import { getMyTokens, getUserTokens, updateUserTokens } from "../controllers/userController";
import { getUserCreditValidate, updateCreditValidate } from "../middlewares/validators/userValidate";

// Define the router
const router = Router();

// Route for getting the token of the logged-in user
router.get(
    "/users/me/tokens",
    authMiddleware,
    authorize([UserRole.USER]),
    getMyTokens
);

// Route for getting the token of a specific user by ID (admin only)
router.get(
    "/users/:id/tokens",
    authMiddleware,
    authorize([UserRole.ADMIN]),
    getUserCreditValidate,
    getUserTokens
);

// Route for updating the token of a specific user by ID (admin only)
router.patch(
    "/users/:id/tokens",
    authMiddleware,
    authorize([UserRole.ADMIN]),
    updateCreditValidate,   // validazione input (tokens > 0, ecc.)
    updateUserTokens
);

export default router;