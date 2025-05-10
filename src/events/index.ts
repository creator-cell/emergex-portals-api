import { Socket } from "socket.io";
import { WebsocketServer } from "..";
import { IncomingMessage } from "http";
import { log } from "console";

interface CustomRequest extends IncomingMessage {
    user: { firstName: string; lastName: string; username: string };
    room: string;
}

export const socketConnectionHandler = async (socket: Socket): Promise<void> => {
    const { user, room } = socket.request as CustomRequest;

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.join(room);
    console.log(`${user?.username} joined room: ${room}`);

    socket.on("connected", (data) => console.log("socket connected"))
    socket.emit('notification', { message: 'Welcome!' });


};
