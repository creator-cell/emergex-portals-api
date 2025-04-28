"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AnnouncementControllers_1 = require("../controllers/AnnouncementControllers");
const accountmentValidators_1 = require("../validations/accountmentValidators");
const checkValidationsMiddleware_1 = require("../middlewares/checkValidationsMiddleware");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = express_1.default.Router();
// Routes
router.route('/')
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), accountmentValidators_1.validateAnnouncement, checkValidationsMiddleware_1.checkValidationResult, AnnouncementControllers_1.createAnnouncement)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), AnnouncementControllers_1.getAnnouncements);
router.route('/announcement-by-id/:id')
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), accountmentValidators_1.getAnnouncementByIdValidation, checkValidationsMiddleware_1.checkValidationResult, AnnouncementControllers_1.getAnnouncementById)
    // .put( updateAnnouncementByIdValidation,checkValidationResult, updateAnnouncement)
    .delete(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), accountmentValidators_1.getAnnouncementByIdValidation, checkValidationsMiddleware_1.checkValidationResult, AnnouncementControllers_1.deleteAnnouncement);
exports.default = router;
