/**
 * Standard operational error class.
 * Throw this anywhere in controllers/services — the global error
 * middleware knows how to serialize it consistently.
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // e.g. field-level validation errors
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
