import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
const authHeaderSchema = z
  .string()
  .regex(/^Bearer\s.+$/, "Invalid Authorization header format");

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string | undefined;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const validatedHeader = authHeaderSchema.parse(authHeader);
    const token = validatedHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: (decoded as JwtPayload).id,
      role: (decoded as JwtPayload).role,
      email: (decoded as JwtPayload).email,
    };
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: req.i18n.t("authorization.jwt.invalidFormat"),
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
