import multer from 'multer';
import { HttpErrorFactory } from '../../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../../utils/errors/HttpErrorCodes';

// Middleware to handle file uploads with size and type restrictions
export const uploadProduct = multer({
    // Store files in memory for further processing to avoid saving invalid files
    storage: multer.memoryStorage(),
    // Set file size limit to 50MB
    limits: { fileSize: 50 * 1024 * 1024 },
    // Accept only image and video file types
    fileFilter: (_, file, cb) => {
        if (!file.mimetype.match(/(image|video)/))
            return cb(
                HttpErrorFactory.createError(
                    HttpErrorCodes.BadRequest,
                    'Only image and video files are allowed.',
                ),
            );
        cb(null, true);
    },
});
