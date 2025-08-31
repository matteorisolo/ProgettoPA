import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { HttpErrorFactory } from '../../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../../utils/errors/HttpErrorCodes';

// Define the directory to store uploaded files
const uploadDir = path.join(__dirname, '../../uploads');
// Create the directory if it doesn't exist
if (!fs.existsSync(uploadDir)) 
	fs.mkdirSync(uploadDir);

// Configure multer storage and file naming
const storage = multer.diskStorage({
	// Set the destination directory for uploads
	destination: (_, __, cb) => cb(null, uploadDir),
	// Set the filename to be unique using a timestamp
	filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// Middleware to handle file uploads with size and type restrictions
export const uploadProduct = multer({
	storage,
	// Set file size limit to 50MB
	limits: { fileSize: 50 * 1024 * 1024 },
	// Accept only image and video file types
	fileFilter: (_, file, cb) => {
		if (!file.mimetype.match(/(image|video)/)) 
			return cb(HttpErrorFactory.createError(HttpErrorCodes.BadRequest, 'Only image and video files are allowed.'));
		cb(null, true);
	}
});