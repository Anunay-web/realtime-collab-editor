import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

import MonacoEditor from "@monaco-editor/react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "../context/AuthContext";

import * as monaco from "monaco-editor";

import { useTheme } from "../context/ThemeContext";


// TYPES


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

  const { user, logout } = useAuth();

  useEffect(() => {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const room =
    params.get("room");

  if (room && user) {

    setRoomId(room);

    fetchDocument(room);

    socket.emit(
      "join_room",
      {
        roomId: room,
        username: user.name,
      }
    );
  }

}, [user]);


  const {
    theme,
    toggleTheme,
  } = useTheme();

  // STATES

  const [roomId, setRoomId] =
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

  const [saveStatus, setSaveStatus] =
    useState("Saved");

  const [lastSaved, setLastSaved] =
    useState("");

  // REFS

  const isRemoteUpdate =
    useRef(false);

  const saveTimeout =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const editorRef =
    useRef<monaco.editor.IStandaloneCodeEditor | null>(
      null
    );

  // RANDOM COLORS

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
 



  // COPY LINK

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

  // SAVE DOCUMENT

  const saveDocument =
    async (content: string) => {

      try {

        setSaveStatus(
          "Saving..."
        );

        await fetch(
          "http://localhost:5000/api/documents/save",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              roomId,
              content,
            }),
          }
        );

        setSaveStatus("Saved");

        setLastSaved(
          new Date().toLocaleTimeString()
        );

      } catch (error) {

        setSaveStatus(
          "Save failed"
        );
      }
    };

    const fetchDocument =
  async (room: string) => {

    try {

      const response =
        await fetch(
          `http://localhost:5000/api/documents/${room}`
        );

      const data =
        await response.json();

      if (data.content) {

        setText(data.content);
      }

    } catch (error) {

      console.log(
        "Failed to load document"
      );
    }
  };

  // SOCKET EFFECTS

  useEffect(() => {

    // auto room from URL

    const params =
      new URLSearchParams(
        window.location.search
      );

    const roomFromUrl =
      params.get("room");

    if (roomFromUrl) {

  setRoomId(roomFromUrl);

  fetchDocument(roomFromUrl);
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

    // users

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

    // receive cursors

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

        // Monaco decorations

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

  // HANDLE CHANGE

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

    // autosave status

    setSaveStatus(
      "Typing..."
    );

    // debounce save

    if (saveTimeout.current) {

      clearTimeout(
        saveTimeout.current
      );
    }

    saveTimeout.current =
      setTimeout(() => {

        saveDocument(newValue);

      }, 1000);

    // realtime sync

    socket.emit("send_text", {
      roomId,
      text: newValue,
    });

    socket.emit("typing", {
      roomId,
      username: user?.name,
});
  };

  // UI
 

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white p-6 transition-colors duration-300">

      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 transition-colors duration-300">


        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-bold">
            CollabSpace Workspace
          </h1>

          <div className="flex items-center gap-4">


            <div className="text-sm">

              <p>
                {saveStatus}
              </p>

              {lastSaved && (
                <p className="text-gray-500">
                  Last saved:
                  {" "}
                  {lastSaved}
                </p>
              )}
            </div>


            <button
              onClick={toggleTheme}
              className="bg-gray-800 dark:bg-gray-200 dark:text-black text-white px-4 py-2 rounded-lg transition"
            >
              {theme === "dark"
                ? "☀️ Light"
                : "🌙 Dark"}
            </button>


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

                theme={
                  theme === "dark"
                    ? "vs-dark"
                    : "light"
                }

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

                          username: user?.name,

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

              <div className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 h-full overflow-auto prose dark:prose-invert max-w-none transition-colors duration-300">

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


          <div className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 h-fit transition-colors duration-300">

            <h2 className="font-semibold mb-4">
              Users in Room
            </h2>


            <div className="flex flex-wrap gap-2">

              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
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