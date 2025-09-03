import { param, body } from "express-validator";
import validateRequest from "./validateRequestMiddleware";

// Validation middleware for GET /users/:id/token
export const getUserCreditValidate = [
    param("id")
        .notEmpty().withMessage("Id is required.")
        .isInt({ min: 1 }).withMessage("Id must be a positive integer."),

    validateRequest
];

// Validation middleware for PATCH /users/:id/token
export const updateTokensValidate = [
    param("id")
        .notEmpty().withMessage("Id is required.")
        .isInt({ min: 1 }).withMessage("Id must be a positive integer."),

    body("tokens")
        .notEmpty().withMessage("Amount of tokens is required.")
        .isFloat({ min: 0 }).withMessage("Tokens must be a positive number."),

    validateRequest
];