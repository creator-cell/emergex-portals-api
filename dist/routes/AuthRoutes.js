"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthContollers_1 = require("../controllers/AuthContollers");
const authValidators_1 = require("../validations/authValidators");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const router = express_1.default.Router();
router.post('/register', authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), authValidators_1.validateRegister, checkValidationsMiddleware_1.checkValidationResult, AuthContollers_1.register);
router.post('/login', authValidators_1.validateLogin, checkValidationsMiddleware_1.checkValidationResult, AuthContollers_1.login);
exports.default = router;
