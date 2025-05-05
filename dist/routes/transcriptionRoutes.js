"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const transcriptionController_1 = require("../controllers/transcriptionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
router.post('/', transcriptionController_1.handleTranscription);
router.use(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin));
exports.default = router;
