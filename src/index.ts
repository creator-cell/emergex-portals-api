import { validateEnv } from "./utils/validateEnv";
validateEnv(); // Fail fast — must run before any imports that read config

import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import middleware from "i18next-http-middleware";
import { Server } from "socket.io";

import { config } from "./config";
import connectDB from "./config/DB_Connect";
import i18next, { setLanguageMiddleware } from "./config/i18n";
import { socketAuthorizer } from "./middlewares/socketAuthorizer";
import { socketConnectionHandler } from "./events";
import { logger } from "./middlewares/logger.middleware";
import { securityHeaders, mongoSanitize, sanitizeInput } from "./middlewares/security.middleware";
import { errorHandler, notFound } from "./middlewares/error";
import { validateTwilioWebhook } from "./middlewares/webhookAuthMiddleware";

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes from "./routes/AuthRoutes";
import userRoutes from "./routes/UsersRoute";
import employeeRoutes from "./routes/EmployeeRoutes";
import teamRoutes from "./routes/TeamRoutes";
import roleRoutes from "./routes/RoleRoutes";
import projectRoutes from "./routes/ProjectRoutes";
import announcementRoutes from "./routes/AnnouncementRoutes";
import countryRoutes from "./routes/CountryRoutes";
import regionRoutes from "./routes/RegionRoutes";
import worksiteRoutes from "./routes/WorksiteRoutes";
import incidentRoutes from "./routes/IncidentRoutes";
import incidentHistoryRoutes from "./routes/IncidentHistoryRoutes";
import transcriptionRoutes from "./routes/transcriptionRoutes";
import conversationRoutes from "./routes/ConversationRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import callRoutes from "./routes/CallRoutes";
import speechRoutes from "./routes/SpeechRoutes";
import investigationRoutes from "./routes/InvestigationRoutes";
import witnessStatementRoutes from "./routes/WitnessStatementRoutes";
import emergexChartRoutes from "./routes/EmergexChartRoutes";
import investigationChartRoutes from "./routes/InvestigationChartRoutes";
import companyRoutes from "./routes/CompanyRoutes";
import rcaRoutes from "./routes/RcaRoutes";

connectDB();

const app = express();

// ─── 1. Security headers (applied before everything) ─────────────────────────
app.use(securityHeaders);

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins =
  config.nodeEnv === "production"
    ? [config.cors.prodDomain].filter(Boolean)
    : [config.cors.devDomain, "http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman in dev)
      if (!origin || config.nodeEnv !== "production") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  })
);

// ─── 3. Body parsing (size limits enforced) ───────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));
app.use(cookieParser());

// ─── 4. Input sanitization (after parsing, before routes) ────────────────────
app.use(mongoSanitize);   // strips MongoDB operators from body/query/params
app.use(sanitizeInput);   // strips null bytes and control characters

// ─── 5. i18n ─────────────────────────────────────────────────────────────────
app.use(middleware.handle(i18next));
app.use(setLanguageMiddleware);

// ─── 6. Request logger ───────────────────────────────────────────────────────
app.use(logger);

// ─── 7. Static files ─────────────────────────────────────────────────────────
const uploads = path.join(__dirname, "../uploads/");
app.use("/uploads", express.static(uploads));

// ─── 8. Health check (no auth, no rate limit) ─────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", version: config.apiVersion });
});

// ─── 9. API routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/worksites", worksiteRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/incidents-history", incidentHistoryRoutes);
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/webhook", validateTwilioWebhook, webhookRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/investigations", investigationRoutes);
app.use("/api/witness-statements", witnessStatementRoutes);
app.use("/api/emergex-chart", emergexChartRoutes);
app.use("/api/investigation-chart", investigationChartRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/rca", rcaRoutes);

// ─── 10. 404 handler ─────────────────────────────────────────────────────────
// Must be after all routes, before the error handler
app.use(notFound);

// ─── 11. Global error handler ────────────────────────────────────────────────
// Must be last — the 4-argument signature tells Express this is an error handler
app.use(errorHandler);

// ─── WebSocket server ────────────────────────────────────────────────────────
const httpServer = createServer(app);

export const WebsocketServer = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    credentials: true,
  },
});

WebsocketServer.use(socketAuthorizer);
WebsocketServer.on("connection", socketConnectionHandler);

httpServer.listen(config.port, () => {
  console.log(`[portals-api] Server running on port ${config.port} (${config.nodeEnv})`);
});

export default app;
