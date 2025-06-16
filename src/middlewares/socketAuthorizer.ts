import jwt from "jsonwebtoken";
import { config } from "../config/index";
import UserModel from "../models/UserModel";
import { Socket } from "socket.io";
import { IncomingMessage } from "http";

interface CustomRequest extends IncomingMessage {
  user?: any;
  room?: string;
}

export const socketAuthorizer = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.query.token as string;
    if (!token) return next(new Error("Access Denied"));

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) return next(new Error("Access Denied"));

    const req = socket.request as CustomRequest;
    req.user = user;
    req.room = `${user.role}-${user._id}`;

    next();
  } catch (err) {
    console.error("❌ Socket auth error:", err);
    next(new Error("Unauthorized"));
  }
};

export default socketAuthorizer;
