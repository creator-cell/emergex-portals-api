"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const config_1 = require("../config");
const authHeaderSchema = zod_1.z
    .string()
    .regex(/^Bearer\s.+$/, "Invalid Authorization header format");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const validatedHeader = authHeaderSchema.parse(authHeader);
        const token = validatedHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
        };
        next();
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: req.i18n.t("authorization.jwt.invalidFormat"),
            });
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
exports.authenticate = authenticate;
