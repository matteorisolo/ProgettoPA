import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../enums/UserRole';
import { downloadValidate } from '../middlewares/validators/downloadValidate';
import { getDownload } from '../controllers/downloadController';

// Define the router
const router = Router();

// Route to download a file purchased or a bundle
router.get(
    '/downloads/:downloadUrl',
    authMiddleware,                 // Middleware to authenticate the user
    authorize([UserRole.USER]),     // Only user are authorized
    downloadValidate,               // Validate parameters
    getDownload,                    // Controller to get a download
);

// Export the router
export default router;
