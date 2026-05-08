import { Server, Socket } from "socket.io";
import Document from "../models/Document";

const roomUsers: Record<
  string,
  { id: string; name: string }[]
> = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);
    //JOIN ROOM
    socket.on(
      "join_room",
      async (data: { roomId: string; username: string }) => {
        const { roomId, username } = data;

        socket.join(roomId);

        // find existing document
        let document = await Document.findOne({
          roomId,
        });

        // create document if not exists
        if (!document) {
          document = await Document.create({
            roomId,
            content: "",
          });
        }

        // send existing content
        socket.emit(
          "receive_text",
          document.content
        );

        // initialize room users
        if (!roomUsers[roomId]) {
          roomUsers[roomId] = [];
        }

        // add current user
        roomUsers[roomId].push({
          id: socket.id,
          name: username,
        });

        // broadcast updated users
        io.to(roomId).emit(
          "users_update",
          roomUsers[roomId]
        );

        console.log(
          `${username} joined room ${roomId}`
        );
      }
    );
    //SEND TEXT
    socket.on(
      "send_text",
      async (data: {
        roomId: string;
        text: string;
      }) => {
        const { roomId, text } = data;

        //save to MongoDB
        await Document.findOneAndUpdate(
          { roomId },
          { content: text }
        );

        //broadcast to others
        socket
          .to(roomId)
          .emit("receive_text", text);
      }
    );
    //CURSOR MOVEMENT
    socket.on(
      "cursor_move",
      (data: {
        roomId: string;
        cursorPos: number;
        userId: string;
      }) => {
        socket
          .to(data.roomId)
          .emit("receive_cursor", data);
      }
    );
    //TYPING
    socket.on(
      "typing",
      (data: {
        roomId: string;
        username: string;
      }) => {
        socket
          .to(data.roomId)
          .emit("user_typing", data.username);
      }
    );
    //DISCONNECT
    socket.on("disconnect", () => {
      console.log(
        "User disconnected:",
        socket.id
      );

      for (const roomId in roomUsers) {
        roomUsers[roomId] =
          roomUsers[roomId].filter(
            (user) => user.id !== socket.id
          );

        io.to(roomId).emit(
          "users_update",
          roomUsers[roomId]
        );
      }
    });
  });
};