import { config } from "./config";
import express from "express";
import { Request, Response } from "express";
import connectDB from "./config/DB_Connect";
import i18next, { setLanguageMiddleware } from "./config/i18n";
import middleware from "i18next-http-middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
connectDB();

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
import transcriptionRoutes from "./routes/transcriptionRoutes"
import conversationRoutes from "./routes/ConversationRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import callRoutes from './routes/CallRoutes';
import speechRoutes from './routes/SpeechRoutes';

import path from "path";
import { validateTwilioWebhook } from "./middlewares/webhookAuthMiddleware";
import { Server } from "socket.io";
import { socketAuthorizer } from "./middlewares/socketAuthorizer";
import { socketConnectionHandler } from "./events";
import { logger } from "./middlewares/logger.middleware";

const app = express();
const port = config.port;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(middleware.handle(i18next));
app.use(setLanguageMiddleware);
app.use(logger)

const uploads = path.join(__dirname, "../uploads/");
app.use("/uploads", express.static(uploads));

// health check route
app.get("/", (_req: Request, res: Response) => {
  return res.status(200).send("Hello World! with typescript");
});

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
app.use('/api/conversations', conversationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/webhook', validateTwilioWebhook, webhookRoutes);
app.use('/api/speech', speechRoutes);

const httpServer = createServer(app);

export const WebsocketServer = new Server(httpServer, {
  cors: {
    origin: '*',
    credentials: true
  }
});

WebsocketServer.use(socketAuthorizer);

WebsocketServer.on('connection', socketConnectionHandler);

httpServer.listen(port, () => {
  console.log("Server is running @ " + port);
});


export default app;
