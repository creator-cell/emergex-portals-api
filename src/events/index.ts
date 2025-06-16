import { Socket } from "socket.io";
import { IncomingMessage } from "http";
import { SpeechClient } from "@google-cloud/speech";

interface CustomRequest extends IncomingMessage {
  user: { firstName: string; lastName: string; username: string };
  room: string;
}

export const socketConnectionHandler = async (
  socket: Socket
): Promise<void> => {
  const { user, room } = socket.request as CustomRequest;

  socket.join(room);
  console.log(`${user?.username} joined room: ${room}`);

  socket.on("connected", () => console.log("socket connected"));
  socket.emit("notification", { message: "Welcome!" });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
};
