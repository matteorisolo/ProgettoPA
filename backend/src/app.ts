// Express app configuration
import express from 'express';
import dotenv from 'dotenv';
/*import { HttpErrorCodes, HttpErrorFactory } from './utils/errorHandler';
import { errorHandler } from './middleware/errorHandlerMiddleware';*/

// Environment variables configuration
dotenv.config();

const app = express();

// Middleware JSON parsing
app.use(express.json());

//Definire le rotte qui

// Middleware for handling 404 errors
/*app.use((req, res, next) => {
    next(HttpErrorFactory.createError(HttpErrorCodes.NotFound, "Rotta non trovata."));
});

// Generic error handling middleware
app.use(errorHandler);*/

// Export the configured Express app
export default app;