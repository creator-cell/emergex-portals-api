import { Server } from "socket.io";
import { logger } from "./config/logger";

export const userSocketMap: { [key: string]: string } = {};

let socketIOInstance: Server | null = null;

export const setSocketIOInstance = (io: Server) => {
  socketIOInstance = io;
};

export const getSocketIO = (): Server | null => {
  return socketIOInstance;
};

export const setupSocketServer = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  setSocketIOInstance(io);

  io.on("connection", (socket) => {
    // logger.info(`User connected: ${socket.id}`);

    // Setup user connection with authentication
    socket.on("setup", (userData: { _id: string }) => {
      if (!userData?._id) {
        logger.warn("Setup attempted without user data");
        return;
      }

      socket.join(userData._id);
      userSocketMap[userData._id] = socket.id;
      socket.emit("connected");
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userId = Object.keys(userSocketMap).find(
        (key) => userSocketMap[key] === socket.id
      );

      if (userId) {
        delete userSocketMap[userId];
        io.emit("user_status", {
          userId,
          status: "offline",
        });
      }

      // logger.info(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
