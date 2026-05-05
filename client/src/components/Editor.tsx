import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Editor() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [text, setText] = useState("");
  const [users, setUsers] = useState<string[]>([]);
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

    socket.on("users_update", (usersData: any[]) => {
      setUsers(usersData.map((u) => u.name));
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
    <div style={{ padding: "20px" }}>
      <h2>Real-Time Editor</h2>

      <input
        placeholder="Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Room"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join</button>

      <br /><br />

      <textarea
        value={text}
        onChange={handleChange}
        rows={10}
        cols={50}
      />

      <p>{typing}</p>

      <h3>Users:</h3>
      <ul>
        {users.map((u, i) => (
          <li key={i}>{u}</li>
        ))}
      </ul>
    </div>
  );
}