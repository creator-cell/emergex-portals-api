import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
import { GlobalAdminRoles } from "../config/global-enum";

// All valid roles in the system — any string not in this set is rejected
const VALID_ROLES = new Set<string>(Object.values(GlobalAdminRoles).map((r) => r.toLowerCase()));

/**
 * Role-based access control middleware.
 *
 * Changes from original:
 *  - Validates allowed roles against the GlobalAdminRoles enum (not arbitrary strings)
 *  - Returns void (no implicit return after res.json)
 *  - No unnecessary req.user = req.user reassignment
 */
export const authorizeRoles = (...roles: string[]) => {
  // Validate at route registration time, not per-request
  const normalised = roles.map((r) => r.toLowerCase());
  const invalid = normalised.filter((r) => !VALID_ROLES.has(r));
  if (invalid.length > 0) {
    throw new Error(
      `authorizeRoles called with unknown roles: ${invalid.join(", ")}. ` +
        `Valid roles: ${[...VALID_ROLES].join(", ")}`
    );
  }

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role?.toLowerCase();
    if (!userRole || !normalised.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: req.i18n.t("authorization.RBAS.error"),
      });
      return;
    }
    next();
  };
};
