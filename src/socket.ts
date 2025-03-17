import { Server as SocketIOServer, Socket } from "socket.io";
import { Server } from "http";

const configureSocket = (server: Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("message", (data) => {
      console.log("Message received:", data);
      io.emit("message", data); // Broadcast message
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default configureSocket;
