import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express handler so uncaught promise rejections are
 * forwarded to the global error handler instead of crashing the process.
 *
 * Usage:
 *   router.get("/path", asyncHandler(myController));
 */
export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
