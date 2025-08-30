import { Router } from "express";
import { login } from "../controllers/authController";
import { validateLogin } from "../middleware/validators/authValidate";

// Define the router
const router = Router();

// Route for user login
// This route does not require authentication
router.post('/login', validateLogin, login);

// Export the router
export default router;