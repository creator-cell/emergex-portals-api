

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
  room?:string;
}

const authHeaderSchema = z
  .string()
  .regex(/^Bearer\s.+$/, "Invalid Authorization header format");

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies[""];

    let token: string | undefined;

    if (authHeader) {
      const validatedHeader = authHeaderSchema.parse(authHeader);
      token = validatedHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.missingToken"),
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t("authorization.jwt.invalidFormat"),
      });
    }

    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.expired"),
      });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.invalidToken"),
      });
    }

    return res.status(403).json({
      success: false,
      error: req.i18n.t("authorization.jwt.acceesDenied"),
    });
  }
};

