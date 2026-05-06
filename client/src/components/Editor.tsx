import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Editor() {
  
  type User = {
    id: string;
    name: string;
  };



  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [typing, setTyping] = useState("");

  let isRemoteUpdate = false;

  const joinRoom = () => {
    socket.emit("join_room", { roomId, username });
  };

  useEffect(() => {
    socket.on("receive_text", (newText: string) => {
      isRemoteUpdate = true;
      setText(newText);
      isRemoteUpdate = false;
    });

    socket.on("users_update", (usersData: User[]) => {
      setUsers(usersData);
    });

    socket.on("user_typing", (name: string) => {
      setTyping(`${name} is typing...`);

      setTimeout(() => setTyping(""), 1000);
    });

    return () => {
      socket.off("receive_text");
      socket.off("users_update");
      socket.off("user_typing");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isRemoteUpdate) return;

    setText(e.target.value);

    socket.emit("send_text", {
      roomId,
      text: e.target.value,
    });

    socket.emit("typing", { roomId, username });
  };

  return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Real-Time Collaborative Editor
      </h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Enter name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />

        <input
          type="text"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />

        <button
          onClick={joinRoom}
          className="bg-black text-white px-5 rounded-lg"
        >
          Join
        </button>
      </div>

      <textarea
        rows={14}
        value={text}
        onChange={handleChange}
        placeholder="Start typing..."
        className="w-full border rounded-xl p-4 outline-none"
      />

      <p className="text-sm text-gray-500 mt-2 h-5">
        {typing}
      </p>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Users in Room</h3>

        <div className="flex gap-2 flex-wrap">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-gray-200 px-3 py-1 rounded-full text-sm"
            >
              {user.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
}