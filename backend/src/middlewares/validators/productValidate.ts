import { body } from "express-validator";
import validateRequest from "./validateRequestMiddleware";
import { ProductType } from "../../enums/ProductType";

// Validation middleware for creating a Product
export const productValidate = [
    // Title must not be empty
    body('title')
        .notEmpty().withMessage('Title is required.'),

    // Type must not be empty and must be a valid ProductType
    body('type')
        .notEmpty().withMessage('Type is required.')
        .isIn(Object.values(ProductType)).withMessage('Type must be a valid ProductType.'),

    // Year must not be empty and must be a positive integer
    body('year')
        .notEmpty().withMessage('Year is required.')
        .isInt({ min: 0 }).withMessage('Year must be a positive integer.'),

    // Format must not be empty and must be one of the allowed formats (jpg, png, tiff, mp4)
    body('format')
        .notEmpty().withMessage('Format is required.')
        .isIn(['jpg', 'png', 'tiff', 'mp4']).withMessage('Format must be jpg, png, tiff or mp4.'),

    // Cost must not be empty and must be a positive number
    body('cost')
        .notEmpty().withMessage('Cost is required.')
        .isFloat({ min: 0 }).withMessage('Cost must be a positive number.'),

    // Check that multer has attached a file (personalized validator)
    body('file')
        .custom((_, { req }) => {
            if (!req.file) 
                throw new Error('File is required.');
            return true;
        }),

    // Use the centralized request validation middleware to handle any validation errors
    validateRequest
];