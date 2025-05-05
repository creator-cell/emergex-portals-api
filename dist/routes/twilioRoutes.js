"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const twilioControllers_1 = require("../controllers/twilioControllers");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = express_1.default.Router();
router.get('/token', twilioControllers_1.generateTwilioTokenController);
router.post('/video-room', twilioControllers_1.createVideoRoom);
router.post('/video-room/end', twilioControllers_1.endVideoRoom);
router.use(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin));
exports.default = router;
