"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const zod_1 = require("zod");
const rolesSchema = zod_1.z.array(zod_1.z.string());
const authorizeRoles = (...roles) => {
    const validRoles = rolesSchema.parse(roles);
    return (req, res, next) => {
        try {
            if (!req.user || !validRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: req.i18n.t("authorization.RBAS.error"),
                });
            }
            req.user = req.user;
            next();
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return res.status(500).json({
                    success: false,
                    error: req.i18n.t("authorization.RBAS.server"),
                });
            }
            return res.status(500).json({
                success: false,
                error: req.i18n.t("authorization.RBAS.unexpected"),
            });
        }
    };
};
exports.authorizeRoles = authorizeRoles;
