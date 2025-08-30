// Express app configuration
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { HttpErrorFactory } from './utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from './utils/errors/HttpErrorCodes';
import { errorHandler } from './middlewares/errorHandlerMiddleware';

// Environment variables configuration
dotenv.config();

const app = express();

// Middleware JSON parsing
app.use(express.json());

// Routes
app.use('/', authRoutes);

// Middleware for handling 404 errors
app.use((req, res, next) => {
    next(HttpErrorFactory.createError(HttpErrorCodes.NotFound, "Resource not found."));
});

// Generic error handling middleware
app.use(errorHandler);

// Export the configured Express app
export default app;