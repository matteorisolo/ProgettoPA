import { body } from 'express-validator';
import { query } from 'express-validator';
import validateRequest from './validateRequestMiddleware';
import { ListType } from '../../enums/ListType';

// Validation middleware for purchasing an asset
export const createPurchaseValidate = [
    // productIds must be an array of positive integers, at least 1 element
    body('productIds')
        .isArray({ min: 1 })
        .withMessage('References to product IDs are required.'),
    body('productIds.*')
        .isInt({ min: 1 })
        .withMessage('Product IDs must be positive integers.'),

    // recipientEmail is optional, but if provided, must be a valid email
    body('recipientEmail')
        .optional()
        .isEmail()
        .withMessage('Recipient email must be a valid email.'),

    // Middleware to handle validation results
    validateRequest,
];

// Validation middleware for getting user purchases
export const getPurchasesValidate = [
    // format is optional, but if provided, must be either 'json' or 'pdf'
    query('format')
        .optional()
        .isIn(Object.values(ListType))
        .withMessage(
            `List format must be one of: ${Object.values(ListType).join(', ')}`,
        ),

    // Middleware to handle validation results
    validateRequest,
];
