import { body } from "express-validator";
import validateRequest from "./validateRequestMiddleware";
import { ProductType } from "../../enums/ProductType";
import { query } from "express-validator";
import { FormatType } from "../../enums/FormatType";

// Validation middleware for creating a Product
export const createProductValidate = [
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
        .isIn((Object.values(FormatType))).withMessage('Format must be jpg, png, tiff or mp4.'),

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

// Validation middleware for getting Products
export const getProductsValidate = [
    // Type must be a valid ProductType if provided (optional)
    query('type')
        .optional()
        .isIn(Object.values(ProductType))
        .withMessage('Type must be a valid ProductType.'),

    // Year must be a positive integer if provided (optional)
    query('year')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Year must be a positive integer.'),

    // Format must be one of the allowed formats if provided (optional)
    query('format')
        .optional()
        .isIn(Object.values(FormatType))
        .withMessage('Format must be jpg, png, tiff or mp4.'),

    // Use the centralized request validation middleware to handle any validation errors
    validateRequest
];