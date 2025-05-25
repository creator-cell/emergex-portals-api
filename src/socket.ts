import { Server } from "socket.io";
import { logger } from "./config/logger";
import { SpeechClient } from "@google-cloud/speech";

const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

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
    logger.info(`User connected: ${socket.id}`);

    let recognizeStream: any = null;

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

    socket.on("startGoogleCloudStream", (audioConfig) => {
      // Create a recognize stream for the client
      recognizeStream = speechClient.streamingRecognize({
        config: {
          encoding: audioConfig.encoding || "LINEAR16",
          sampleRateHertz: audioConfig.sampleRateHertz || 16000,
          languageCode: audioConfig.languageCode || "en-US",
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      });

      // Forward transcription results to the client
      recognizeStream.on("data", (data: any) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcription = data.results[0].alternatives[0].transcript;
          const isFinal = data.results[0].isFinal;

          socket.emit("transcription", {
            transcription,
            isFinal,
          });
        }
      });

      recognizeStream.on("error", (error: any) => {
        console.error("Recognition error:", error);
        socket.emit("error", { error: error.message });
      });

      recognizeStream.on("end", () => {
        console.log("Recognition stream ended");
      });
    });

    // Process audio data from the client
    socket.on("audioData", (data) => {
      if (recognizeStream) {
        recognizeStream.write(data);
      }
    });

    // Stop the recognition stream
    socket.on("endGoogleCloudStream", () => {
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream = null;
      }
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
