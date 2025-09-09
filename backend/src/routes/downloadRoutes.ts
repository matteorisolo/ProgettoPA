import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorize } from '../middlewares/authMiddleware';
import { UserRole } from '../enums/UserRole';
import { downloadValidate } from '../middlewares/validators/downloadValidate';
import { getDownload } from '../controllers/downloadController';

// Define the router
const router = Router();

router.get(
    '/downloads/:downloadUrl',
    authMiddleware,
    authorize([UserRole.USER]), // blocca gli admin
    downloadValidate, // validator sul parametro
    getDownload, // controller
);

// Export the router
export default router;
