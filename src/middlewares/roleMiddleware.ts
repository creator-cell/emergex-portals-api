import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const rolesSchema = z.array(z.string());

interface AuthenticatedRequest extends Request {
  user?: {
    role: string;
  };
}

export const authorizeRoles = (...roles: string[]) => {

  const validRoles = rolesSchema.parse(roles);

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !validRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: req.i18n.t("authorization.RBAS.error"),
        });
      }
      req.user=req.user;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(500).json({
          success: false,
          error:req.i18n.t("authorization.RBAS.server"),
        });
      }
      return res.status(500).json({
        success: false,
        error: req.i18n.t("authorization.RBAS.unexpected"),
      });
    }
  };
};

