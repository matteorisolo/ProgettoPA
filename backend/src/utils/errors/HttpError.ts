import { StatusCodes } from "http-status-codes";

// Custom HTTP Error class extending the built-in Error class
export class HttpError extends Error {
    public readonly statusCode: StatusCodes;
    public readonly code: string;

    constructor(statusCode: StatusCodes, message: string, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        // Necessary to maintain proper prototype chain for custom error classes
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}