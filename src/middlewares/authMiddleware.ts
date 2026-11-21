import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
    companyId?: string;
  };
  room?: string;
}

const authHeaderSchema = z
  .string()
  .regex(/^Bearer\s[\w\-._~+/]+=*$/, "Invalid Authorization header format");

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    // Named cookie key — empty string key was a bug in the original
    const cookieToken = req.cookies?.["portal_token"];

    let token: string | undefined;

    if (authHeader) {
      const validatedHeader = authHeaderSchema.parse(authHeader);
      token = validatedHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.missingToken"),
      });
      return;
    }

    // Reject tokens that are too long (attack vector)
    if (token.length > 4096) {
      res.status(401).json({ success: false, error: "Invalid token" });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Strict claim validation — reject tokens missing critical fields
    const userId = String(decoded.id || "").trim();
    const role = String(decoded.role || "").trim();

    if (!userId || !role) {
      res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.invalidToken"),
      });
      return;
    }

    req.user = {
      id: userId,
      role: role.toLowerCase(),
      email: decoded.email ? String(decoded.email).trim() : undefined,
      companyId: decoded.companyId ? String(decoded.companyId).trim() : undefined,
    };

    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: req.i18n.t("authorization.jwt.invalidFormat"),
      });
      return;
    }
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.expired"),
      });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: req.i18n.t("authorization.jwt.invalidToken"),
      });
      return;
    }
    res.status(403).json({
      success: false,
      error: req.i18n.t("authorization.jwt.acceesDenied"),
    });
  }
};
