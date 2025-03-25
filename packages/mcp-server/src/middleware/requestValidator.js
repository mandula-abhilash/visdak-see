import { validationResult } from "express-validator";
import { createAppError } from "./errorHandler.js";

export const requestValidator = (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createAppError(400, "Invalid request data");
    }
    next();
  } catch (error) {
    next(error);
  }
};
