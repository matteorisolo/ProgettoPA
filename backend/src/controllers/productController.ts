import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IProductCreationAttributes } from '../models/product';

// Controller function to handle product creation
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check if file is present
        if (!req.file)
            throw HttpErrorFactory.createError(HttpErrorCodes.BadRequest, 'File is required.');

        // Prepare product data from request body
        const productData: IProductCreationAttributes = {
            title: req.body.title,
            type: req.body.type,
            year: parseInt(req.body.year),
            format: req.body.format,
            cost: parseFloat(req.body.cost),
            // Path where the uploaded file is stored
            path: req.file.path 
        };

        // Create the product using the service
        const product = await ProductService.createProduct(productData);

        // Return success response with created product details
        return res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } 
    // Pass any errors to the error handling middleware
    catch (error) {
        next(error);
    }
};