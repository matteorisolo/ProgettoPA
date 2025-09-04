import { body } from "express-validator";
import validateRequest from "./validateRequestMiddleware";

// Validation middleware for purchasing an asset
export const purchaseValidate = [
	// productId must not be empty and must be a positive integer
	body("productId")
		.notEmpty().withMessage("Reference to product is required.")
		.isInt({ min: 1 }).withMessage("Product ID must be a positive integer."),

	// recipientEmail is optional but if provided, must be a valid email
	body("recipientEmail")
		.optional()
		.isEmail().withMessage("Recipient email must be a valid email."),

	// Middleware to handle validation results
	validateRequest
];