import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import { IProductCreationAttributes } from '../models/product';
import { IProductListFilters } from '../services/productService';
import fs from 'fs';
import path from 'path';
import { FormatType } from '../enums/FormatType';

// Define the directory to store uploaded files
const uploadDir = path.join(__dirname, '../../uploads');
// Create the directory if it doesn't exist yet
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Controller function to handle product creation and file saving
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if file is present
    if (!req.file)
      throw HttpErrorFactory.createError(
        HttpErrorCodes.BadRequest,
        'File is required.',
      );

    // Create a unique filename (timestamp + original name) and prepare the file path
    const filename = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadDir, filename);
    // Save the file to the designated path
    fs.writeFileSync(filePath, req.file.buffer);

    // Prepare product data from request body
    const productData: IProductCreationAttributes = {
      title: req.body.title,
      type: req.body.type,
      year: parseInt(req.body.year),
      format: req.body.format,
      cost: parseFloat(req.body.cost),
      // Path where the uploaded file is stored
      path: filePath,
    };

    // Create the product using the service
    const product = await ProductService.createProduct(productData);

    // Return success response with created product details
    return res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
};

// Controller function to handle retrieving products with optional filters
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Prepare filters from query parameters (if provided)
    const filters: IProductListFilters = {
      type: req.query.type as string,
      year: req.query.year ? Number(req.query.year) : undefined,
      format: req.query.format as FormatType,
    };

    // Get the list of products from the service with the applied filters
    const products = await ProductService.list(filters);

    // If no products found, return an empty array with a message
    if (!products || products.length === 0) {
      return res.status(200).json({
        message: 'No products found with the given filters.',
        products: [],
      });
    }

    // Return success response with the list of products
    return res.status(200).json({
      message: 'Products retrieved successfully',
      products,
    });
  } catch (error) {
    // Pass any errors to the error handling middleware
    next(error);
  }
};
