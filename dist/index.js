"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketServer = void 0;
const config_1 = require("./config");
const express_1 = __importDefault(require("express"));
const DB_Connect_1 = __importDefault(require("./config/DB_Connect"));
const i18n_1 = __importStar(require("./config/i18n"));
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
(0, DB_Connect_1.default)();
const AuthRoutes_1 = __importDefault(require("./routes/AuthRoutes"));
const UsersRoute_1 = __importDefault(require("./routes/UsersRoute"));
const EmployeeRoutes_1 = __importDefault(require("./routes/EmployeeRoutes"));
const TeamRoutes_1 = __importDefault(require("./routes/TeamRoutes"));
const RoleRoutes_1 = __importDefault(require("./routes/RoleRoutes"));
const ProjectRoutes_1 = __importDefault(require("./routes/ProjectRoutes"));
const AnnouncementRoutes_1 = __importDefault(require("./routes/AnnouncementRoutes"));
const CountryRoutes_1 = __importDefault(require("./routes/CountryRoutes"));
const RegionRoutes_1 = __importDefault(require("./routes/RegionRoutes"));
const WorksiteRoutes_1 = __importDefault(require("./routes/WorksiteRoutes"));
const IncidentRoutes_1 = __importDefault(require("./routes/IncidentRoutes"));
const IncidentHistoryRoutes_1 = __importDefault(require("./routes/IncidentHistoryRoutes"));
const transcriptionRoutes_1 = __importDefault(require("./routes/transcriptionRoutes"));
const ConversationRoutes_1 = __importDefault(require("./routes/ConversationRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const CallRoutes_1 = __importDefault(require("./routes/CallRoutes"));
const SpeechRoutes_1 = __importDefault(require("./routes/SpeechRoutes"));
const path_1 = __importDefault(require("path"));
const webhookAuthMiddleware_1 = require("./middlewares/webhookAuthMiddleware");
const socket_io_1 = require("socket.io");
const socketAuthorizer_1 = require("./middlewares/socketAuthorizer");
const events_1 = require("./events");
const logger_middleware_1 = require("./middlewares/logger.middleware");
const app = (0, express_1.default)();
const port = config_1.config.port;
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(i18next_http_middleware_1.default.handle(i18n_1.default));
app.use(i18n_1.setLanguageMiddleware);
app.use(logger_middleware_1.logger);
const uploads = path_1.default.join(__dirname, "../uploads/");
app.use("/uploads", express_1.default.static(uploads));
// health check route
app.get("/", (_req, res) => {
    return res.status(200).send("Hello World! with typescript");
});
app.use("/api/auth", AuthRoutes_1.default);
app.use("/api/users", UsersRoute_1.default);
app.use("/api/employees", EmployeeRoutes_1.default);
app.use("/api/teams", TeamRoutes_1.default);
app.use("/api/roles", RoleRoutes_1.default);
app.use("/api/projects", ProjectRoutes_1.default);
app.use("/api/announcements", AnnouncementRoutes_1.default);
app.use("/api/countries", CountryRoutes_1.default);
app.use("/api/regions", RegionRoutes_1.default);
app.use("/api/worksites", WorksiteRoutes_1.default);
app.use("/api/incidents", IncidentRoutes_1.default);
app.use("/api/incidents-history", IncidentHistoryRoutes_1.default);
app.use("/api/transcription", transcriptionRoutes_1.default);
app.use('/api/conversations', ConversationRoutes_1.default);
app.use('/api/calls', CallRoutes_1.default);
app.use('/api/webhook', webhookAuthMiddleware_1.validateTwilioWebhook, webhookRoutes_1.default);
app.use('/api/speech', SpeechRoutes_1.default);
const httpServer = (0, http_1.createServer)(app);
exports.WebsocketServer = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        credentials: true
    }
});
exports.WebsocketServer.use(socketAuthorizer_1.socketAuthorizer);
exports.WebsocketServer.on('connection', events_1.socketConnectionHandler);
httpServer.listen(port, () => {
    console.log("Server is running @ " + port);
});
exports.default = app;
