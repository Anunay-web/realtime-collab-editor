import { Server, Socket } from "socket.io";

const rooms: Record<string, string> = {}; // roomId -> text
const roomUsers: Record<string, { id: string; name: string }[]> = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // Cursor movement
    socket.on(
  "cursor_move",
  (data: { roomId: string; cursorPos: number; userId: string }) => {
    socket.to(data.roomId).emit("receive_cursor", data);
  }
);
    console.log("User connected:", socket.id);

    // Join Room
    socket.on("join_room", (data: { roomId: string; username: string }) => {
  const { roomId, username } = data;

  socket.join(roomId);

  if (!rooms[roomId]) {
    rooms[roomId] = "";
  }

  if (!roomUsers[roomId]) {
    roomUsers[roomId] = [];
  }

  roomUsers[roomId].push({ id: socket.id, name: username });

  // send current doc
  socket.emit("receive_text", rooms[roomId]);

  // send updated user list to room
  io.to(roomId).emit("users_update", roomUsers[roomId]);

  console.log(`${username} joined ${roomId}`);
});
socket.on("typing", (data: { roomId: string; username: string }) => {
  socket.to(data.roomId).emit("user_typing", data.username);
});

    // handle text change
    socket.on(
      "send_text",
      (data: { roomId: string; text: string }) => {
        const { roomId, text } = data;

        rooms[roomId] = text;

        // send updated text to others
        socket.to(roomId).emit("receive_text", text);
      }
    );

    socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);

  for (const roomId in roomUsers) {
    roomUsers[roomId] = roomUsers[roomId].filter(
      (user) => user.id !== socket.id
    );

    io.to(roomId).emit("users_update", roomUsers[roomId]);
  }
});
  });
};