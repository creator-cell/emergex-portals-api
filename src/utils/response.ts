import { Response } from "express";

/**
 * Centralised response helpers.
 * Enforces one consistent shape across all controllers:
 *   { success: boolean, data?: T, message?: string, errors?: any[] }
 *
 * Eliminates the typo variants (succes, sucess, status) found across controllers.
 */

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): Response => {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

export const sendNotFound = (res: Response, resource = "Resource"): Response =>
  sendError(res, `${resource} not found`, 404);

export const sendUnauthorized = (res: Response, message = "Unauthorized"): Response =>
  sendError(res, message, 401);

export const sendForbidden = (res: Response, message = "Forbidden"): Response =>
  sendError(res, message, 403);

export const sendBadRequest = (res: Response, message: string, errors?: unknown): Response =>
  sendError(res, message, 400, errors);
