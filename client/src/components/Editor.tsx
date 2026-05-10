import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import MonacoEditor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";

type User = {
  id: string;
  name: string;
};

export default function Editor() {
  const { logout } = useAuth();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [typing, setTyping] = useState("");
  const [connected, setConnected] = useState(false);
  const isRemoteUpdate = useRef(false);

  const joinRoom = () => {
    socket.emit("join_room", {
      roomId,
      username,
    });
  };

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // receive text
    socket.on("receive_text", (newText: string) => {
      isRemoteUpdate.current = true;

      setText(newText);

      isRemoteUpdate.current = false;
    });

    // users update
    socket.on("users_update", (usersData: User[]) => {
      setUsers(usersData);
    });

    // typing indicator
    socket.on("user_typing", (name: string) => {
      setTyping(`${name} is typing...`);

      setTimeout(() => {
        setTyping("");
      }, 1000);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receive_text");
      socket.off("users_update");
      socket.off("user_typing");
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (isRemoteUpdate.current) return;

    setText(e.target.value);

    socket.emit("send_text", {
      roomId,
      text: e.target.value,
    });

    socket.emit("typing", {
      roomId,
      username,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-6">

        <div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold">
    Real-Time Collaborative Editor
  </h1>

  <div className="flex items-center gap-4">
    <p className="text-sm font-medium">
      Status:
      <span
        className={`ml-2 ${
          connected
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {connected ? "Connected" : "Disconnected"}
      </span>
    </p>

    <button
      onClick={logout}
      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
    >
      Logout
    </button>
  </div>
</div>

        <div className="flex gap-4 mb-6">
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
            className="bg-black text-white px-6 rounded-lg hover:bg-gray-800 transition"
          >
            Join
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div>
              <h2 className="font-semibold mb-2">
                Markdown Editor
              </h2>

              <MonacoEditor
  height="500px"
  defaultLanguage="markdown"
  theme="vs-dark"
  value={text}
  onChange={(value) => {
    const newValue = value || "";

    if (isRemoteUpdate.current) return;

    setText(newValue);

    socket.emit("send_text", {
      roomId,
      text: newValue,
    });

    socket.emit("typing", {
      roomId,
      username,
    });
  }}
/>
            </div>
            <div>
              <h2 className="font-semibold mb-2">
                Live Preview
              </h2>

              <div className="border rounded-xl p-4 bg-gray-50 h-full overflow-auto prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {text || "# Live Preview"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="border rounded-xl p-4 bg-gray-50 h-fit">

            <h2 className="font-semibold mb-4">
              Users in Room
            </h2>

            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-200 px-3 py-1 rounded-full text-sm"
                >
                  {user.name}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-6 h-5">
              {typing}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}