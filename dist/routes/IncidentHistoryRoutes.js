"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const IncidentStatusHistoryControllers_1 = require("../controllers/IncidentStatusHistoryControllers");
const incidentValidators_1 = require("../validations/incidentValidators");
const router = express_1.default.Router();
router.get('/status/:id', authMiddleware_1.authenticate, incidentValidators_1.incidentsByIdValidationRules, IncidentStatusHistoryControllers_1.getIncidentStatusHistory);
router.get('/update/:id', authMiddleware_1.authenticate, incidentValidators_1.incidentsByIdValidationRules, IncidentStatusHistoryControllers_1.getIncidentUpdateHistory);
exports.default = router;
