import { Server, Socket } from "socket.io";
import Document from "../models/Document";

const roomUsers = new Map<
  string,
  Set<string>
>();

export const setupSocket = (io: Server) => {
  
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);
    //JOIN ROOM
    socket.on(
  "join-room",
  ({
    roomId,
    username,
  }) => {

    socket.join(roomId);

    if (
      !roomUsers.has(roomId)
    ) {
      roomUsers.set(
        roomId,
        new Set()
      );
    }

    roomUsers
      .get(roomId)!
      .add(username);

    io.to(roomId).emit(
  "activity-update",
  {
    type: "join",
    username,
    time:
      new Date()
        .toLocaleTimeString(),
  }
);

io.to(roomId).emit(
  "users-update",
  Array.from(
    roomUsers.get(roomId)!
  )
);

    socket.data.roomId =
      roomId;

    socket.data.username =
      username;
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

  {
    content: text,
  },

  {
    new: true,
    upsert: true,
  }
);

        //broadcast to others
        socket
          .to(roomId)
          .emit("receive_text", text);
      }
    );
    //CURSOR MOVEMENT
    socket.on("cursor_move", (data) => {
  socket
    .to(data.roomId)
    .emit("receive_cursor", data);
});
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
    socket.on(
  "disconnect",
  () => {

    console.log(
      "User disconnected:",
      socket.id
    );

    const roomId =
      socket.data.roomId;

    const username =
      socket.data.username;

    if (
      roomId &&
      username &&
      roomUsers.has(roomId)
    ) {
      io.to(roomId).emit(
  "activity-update",
  {
    type: "leave",
    username,
    time:
      new Date()
        .toLocaleTimeString(),
  }
);

      roomUsers
        .get(roomId)!
        .delete(username);

      io.to(roomId).emit(
        "users-update",
        Array.from(
          roomUsers.get(roomId)!
        )
      );
    }
  }
);
socket.on(
  "activity",
  (activity) => {

    io.to(
      activity.roomId
    ).emit(
      "activity-update",
      activity
    );

  }
);
  });
};