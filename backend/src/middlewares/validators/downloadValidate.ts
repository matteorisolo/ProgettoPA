import { body, param, query } from "express-validator";
import validateRequest from "./validateRequestMiddleware";
import { FormatType } from "../../enums/FormatType";

export const downloadValidate = [
    // Validazione del parametro downloadUrl
    param("downloadUrl")
        .notEmpty().withMessage("Download URL is required")
        .isUUID().withMessage("Download URL must be a valid UUID"),

    // Validazione del formato di uscita opzionale
    body("outputFormat")
        .optional()
        .isIn(Object.values(FormatType))
        .withMessage(`Format must be one of: ${Object.values(FormatType).join(", ")}`),

    validateRequest
];