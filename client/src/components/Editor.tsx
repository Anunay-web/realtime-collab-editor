import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

import MonacoEditor from "@monaco-editor/react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "../context/AuthContext";

import { v4 as uuidv4 } from "uuid";

import * as monaco from "monaco-editor";


type Cursor = {
  userId: string;
  username: string;

  lineNumber: number;
  column: number;

  color: string;
};

type User = {
  id: string;
  name: string;
};

export default function Editor() {

  const { logout } = useAuth();

  const [roomId, setRoomId] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [text, setText] =
    useState("");

  const [users, setUsers] =
    useState<User[]>([]);

  const [typing, setTyping] =
    useState("");

  const [connected, setConnected] =
    useState(false);

  const [cursors, setCursors] =
    useState<Cursor[]>([]);

  const isRemoteUpdate =
    useRef(false);

  const editorRef =
    useRef<monaco.editor.IStandaloneCodeEditor | null>(
      null
    );
    

  const getRandomColor = () => {
    const colors = [
      "#FF5733",
      "#33C1FF",
      "#8D33FF",
      "#33FF57",
      "#FF33A8",
    ];

    return colors[
      Math.floor(
        Math.random() * colors.length
      )
    ];
  };
  

  const joinRoom = () => {

    if (!roomId || !username) {
      alert(
        "Enter username and room ID"
      );

      return;
    }

    socket.emit("join_room", {
      roomId,
      username,
    });
  };
  
  const createRoom = () => {

    if (!username) {
      alert("Enter username first");

      return;
    }

    const newRoomId = uuidv4();

    setRoomId(newRoomId);

    socket.emit("join_room", {
      roomId: newRoomId,
      username,
    });

    window.history.pushState(
      {},
      "",
      `/?room=${newRoomId}`
    );
  };

  

  const copyRoomLink = async () => {

    if (!roomId) {
      alert(
        "Create or join a room first"
      );

      return;
    }

    const link =
      `${window.location.origin}/?room=${roomId}`;

    await navigator.clipboard.writeText(
      link
    );

    alert("Room link copied!");
  };
  

  useEffect(() => {

    // auto read room from URL

    const params =
      new URLSearchParams(
        window.location.search
      );

    const roomFromUrl =
      params.get("room");

    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    }

    // connected

    socket.on("connect", () => {
      setConnected(true);
    });

    // disconnected

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // receive text

    socket.on(
      "receive_text",
      (newText: string) => {

        isRemoteUpdate.current =
          true;

        setText(newText);

        isRemoteUpdate.current =
          false;
      }
    );

    // users update

    socket.on(
      "users_update",
      (usersData: User[]) => {
        setUsers(usersData);
      }
    );

    // typing

    socket.on(
      "user_typing",
      (name: string) => {

        setTyping(
          `${name} is typing...`
        );

        setTimeout(() => {
          setTyping("");
        }, 1000);
      }
    );
    

    socket.on(
      "receive_cursor",
      (data: Cursor) => {
        

        setCursors((prev) => {

          const filtered =
            prev.filter(
              (cursor) =>
                cursor.userId !==
                data.userId
            );

          return [
            ...filtered,
            data,
          ];
        });
        

        if (!editorRef.current)
          return;

        const editor =
          editorRef.current;

        editor.deltaDecorations(
          [],
          [
            {
              range:
                new monaco.Range(
                  data.lineNumber,
                  data.column,

                  data.lineNumber,
                  data.column + 1
                ),

              options: {
                className:
                  "remote-cursor",

                hoverMessage: {
                  value:
                    data.username,
                },

                stickiness:
                  monaco.editor
                    .TrackedRangeStickiness
                    .NeverGrowsWhenTypingAtEdges,
              },
            },
          ]
        );
      }
    );

    return () => {

      socket.off("connect");

      socket.off("disconnect");

      socket.off("receive_text");

      socket.off("users_update");

      socket.off("user_typing");

      socket.off("receive_cursor");
    };

  }, []);

  

  const handleEditorChange = (
    value: string | undefined
  ) => {

    const newValue =
      value || "";

    if (
      isRemoteUpdate.current
    )
      return;

    setText(newValue);

    socket.emit("send_text", {
      roomId,
      text: newValue,
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
                {connected
                  ? "Connected"
                  : "Disconnected"}
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
        

        <div className="flex flex-wrap gap-4 mb-6">

          <input
            type="text"
            placeholder="Enter name"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            className="border p-3 rounded-lg flex-1"
          />

          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) =>
              setRoomId(
                e.target.value
              )
            }
            className="border p-3 rounded-lg flex-1"
          />

          <button
            onClick={joinRoom}
            className="bg-black text-white px-6 rounded-lg hover:bg-gray-800 transition"
          >
            Join
          </button>

          <button
            onClick={createRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Create Room
          </button>

          <button
            onClick={copyRoomLink}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Copy Invite Link
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

                onChange={
                  handleEditorChange
                }

                onMount={(
                  editor
                ) => {

                  editorRef.current =
                    editor;

                  editor.onDidChangeCursorPosition(
                    (e) => {

                      socket.emit(
                        "cursor_move",
                        {
                          roomId,

                          userId:
                            socket.id,

                          username,

                          lineNumber:
                            e.position
                              .lineNumber,

                          column:
                            e.position
                              .column,

                          color:
                            getRandomColor(),
                        }
                      );
                    }
                  );
                }}
              />
            </div>

            <div>

              <h2 className="font-semibold mb-2">
                Live Preview
              </h2>

              <div className="border rounded-xl p-4 bg-gray-50 h-full overflow-auto prose max-w-none">

                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm,
                  ]}
                >
                  {text ||
                    "# Live Preview"}
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


            <div className="mt-6">

              <h3 className="font-semibold mb-3">
                Live Cursors
              </h3>

              <div className="space-y-2">

                {cursors.map(
                  (cursor) => (
                    <div
                      key={
                        cursor.userId
                      }
                      className="flex items-center gap-2 text-sm"
                    >

                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            cursor.color,
                        }}
                      />

                      <span>
                        {
                          cursor.username
                        }
                      </span>

                      <span className="text-gray-500">
                        line{" "}
                        {
                          cursor.lineNumber
                        }
                        , column{" "}
                        {
                          cursor.column
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}