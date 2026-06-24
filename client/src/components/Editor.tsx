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



export default function Editor() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // STATES

  const [roomId, setRoomId] = useState("");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState("");
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [lastSaved, setLastSaved] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [workspaceType, setWorkspaceType] = useState("developer");
  const [reviewNotes, setReviewNotes] = useState("");
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    diagnosis: "",
  });
  const [assignment, setAssignment] = useState("");
  const [versions, setVersions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);  
  const [activeUsers, setActiveUsers,] = useState< string[]>([]);

  const isRemoteUpdate = useRef(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // ROOM JOIN EFFECT

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");

    if (room && user) {
      setRoomId(room);
      fetchDocument(room);
      fetchComments(room);

      socket.emit(
  "join-room",
  {
    roomId: room,

    username:
      user?.username ||
      "Anonymous",
  }
);
    }
  }, [user]);

  // COMMENTS ROOM SYNC EFFECT

  useEffect(() => {
    if (!roomId) return;
    fetchComments(roomId);
  }, [roomId]);

  // RANDOM COLORS

  const getRandomColor = () => {
    const colors = ["#FF5733", "#33C1FF", "#8D33FF", "#33FF57", "#FF33A8"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // COPY LINK

  const copyRoomLink = async () => {
    if (!roomId) {
      alert("Create or join a room first");
      return;
    }

    const link = `${window.location.origin}/?room=${roomId}`;
    await navigator.clipboard.writeText(link);
    alert("Room link copied!");
  };

  // SAVE DOCUMENT

  const saveDocument = async (content: string) => {
    try {
      setSaveStatus("Saving...");

      await fetch("http://localhost:5000/api/documents/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          content,
        }),
      });

      setSaveStatus("Saved");
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      setSaveStatus("Save failed", error);
    }
  };

  // SOCKET EFFECTS

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("receive_text", (newText: string) => {
      isRemoteUpdate.current = true;
      setText(newText);
      isRemoteUpdate.current = false;
    });

    socket.on(
  "users-update",
  (users: string[]) => {
    setActiveUsers(users);
  }
);

    socket.on("user_typing", (name: string) => {
      setTyping(`${name} is typing...`);
      setTimeout(() => {
        setTyping("");
      }, 1000);
    });

    socket.on("receive_cursor", (data: Cursor) => {
      setCursors((prev) => {
        const filtered = prev.filter((cursor) => cursor.userId !== data.userId);
        return [...filtered, data];
      });

      if (!editorRef.current) return;

      const editor = editorRef.current;

      editor.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(
              data.lineNumber,
              data.column,
              data.lineNumber,
              data.column + 1
            ),
            options: {
              className: "remote-cursor",
              hoverMessage: {
                value: data.username,
              },
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          },
        ]
      );
    });

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

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || "";

    if (isRemoteUpdate.current) return;

    setText(newValue);
    setSaveStatus("Typing...");

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveDocument(newValue);
    }, 1000);

    socket.emit("send_text", {
      roomId,
      text: newValue,
    });

    socket.emit("typing", {
      roomId,
      username: user?.username,
    });
  };

  const fetchVersions = async () => {
    if (!roomId) return;

    const response = await fetch(`http://localhost:5000/api/versions/${roomId}`);
    const data = await response.json();
    setVersions(data);
  };

  const restoreVersion = async (content: string) => {
    setText(content);
    await saveDocument(content);

    socket.emit("send_text", {
      roomId,
      text: content,
    });
  };

  const fetchComments = async (room: string) => {
    const response = await fetch(`http://localhost:5000/api/comments/${room}`);
    const data = await response.json();
    setComments(data);
  };

  const fetchDocument = async (room: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/room/${room}`);

      if (!response.ok) {
        console.error("Document not found:", room);
        return;
      }

      const data = await response.json();

      if (data.workspaceType) {
        setWorkspaceType(data.workspaceType);
      }

      if (data.content) {
        setText(data.content);
      }
      fetchWorkspaceData(room); 
      
    } catch (error) {
      console.error("Failed to load document", error);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;

    await fetch("http://localhost:5000/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        username: user?.username,
        text: commentText,
      }),
    });

    setCommentText("");
    fetchComments(roomId);
  };

  const runCode = async () => {
  try {
    setIsRunning(true);
    setOutput("Running...");

    const response = await fetch(
      "http://localhost:5000/api/compiler/run",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code: text,
        }),
      }
    );

    const data = await response.json();

    setOutput(
      data.run?.stdout ||
      data.run?.stderr ||
      data.output ||
      "No output"
    );
  } catch (error) {
    console.error(error);
    setOutput("Execution failed");
  } finally {
    setIsRunning(false);
  }
};

  const workspaceConfig = {
    developer: {
      title: "💻 Developer Workspace",
      description: "Collaborative coding environment",
      color: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
    medical: {
      title: "🏥 Medical Workspace",
      description: "Patient records & medical notes",
      color: "border-green-500 bg-green-50 dark:bg-green-950/20",
    },
    classroom: {
      title: "🎓 Classroom Workspace",
      description: "Collaborative learning environment",
      color: "border-purple-500 bg-purple-50 dark:bg-purple-950/20",
    },
  };
  const saveWorkspaceData =
async () => {

  await fetch(
    "http://localhost:5000/api/workspace",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        roomId,

        reviewNotes,

        patientName:
          patientInfo.name,

        patientAge:
          patientInfo.age,

        diagnosis:
          patientInfo.diagnosis,

        assignment,
      }),
    }
  );
};


const fetchWorkspaceData =
async (
  room: string
) => {

  const response =
    await fetch(
      `http://localhost:5000/api/workspace/${room}`
    );

  const data =
    await response.json();

  if (!data) return;

  setReviewNotes(
    data.reviewNotes || ""
  );

  setPatientInfo({
    name:
      data.patientName || "",

    age:
      data.patientAge || "",

    diagnosis:
      data.diagnosis || "",
  });

  setAssignment(
    data.assignment || ""
  );
};

  const currentWorkspace = workspaceConfig[workspaceType as keyof typeof workspaceConfig];

  // UI

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">CollabSpace Workspace</h1>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p>{saveStatus}</p>
              {lastSaved && (
                <p className="text-gray-500">
                  Last saved: {lastSaved}
                </p>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="bg-gray-800 dark:bg-gray-200 dark:text-black text-white px-4 py-2 rounded-lg transition"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            <p className="text-sm font-medium">
              Status:
              <span className={`ml-2 ${connected ? "text-green-600" : "text-red-600"}`}>
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

        {/* Workspace Banner */}
        <div className={`mb-6 border rounded-xl p-4 ${currentWorkspace.color}`}>
          <h2 className="text-2xl font-bold">{currentWorkspace.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{currentWorkspace.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={copyRoomLink}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Copy Invite Link
          </button>
          <button
            onClick={() => {
              fetchVersions();
              setShowHistory(!showHistory);
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg"
          >
            History
          </button>
        </div>

        {/* Main Workspace Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={workspaceType === "developer" ? "md:col-span-2" : "md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4"}>
            
            {/* Editor Area */}
            <div>
              {workspaceType === "developer" && (
  <div className="flex gap-3 mb-4">

    <select
      value={language}
      onChange={(e) =>
        setLanguage(e.target.value)
      }
      className="
        border
        dark:border-gray-700
        bg-white
        dark:bg-gray-800
        p-2
        rounded-lg
      "
    >
      <option value="javascript">
        JavaScript
      </option>

      <option value="typescript">
        TypeScript
      </option>

      <option value="python">
        Python
      </option>

      <option value="java">
        Java
      </option>

      <option value="cpp">
        C++
      </option>

    </select>

    <button
      onClick={runCode}
      disabled={isRunning}
      className="
        bg-green-500
        text-white
        px-4
        py-2
        rounded-lg
      "
    >
      {isRunning
        ? "Running..."
        : "▶ Run Code"}
    </button>

  </div>
)}

              <h2 className="font-semibold mb-2">
                {workspaceType === "developer" ? "Code Editor" : "Markdown Editor"}
              </h2>

              <MonacoEditor
                height="500px"
                language={workspaceType === "developer" ? language : "markdown"}
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={text}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidChangeCursorPosition((e) => {
                    socket.emit("cursor_move", {
                      roomId,
                      userId: socket.id,
                      username: user?.username,
                      lineNumber: e.position.lineNumber,
                      column: e.position.column,
                      color: getRandomColor(),
                    });
                  });
                }}
              />
              {workspaceType === "developer" && (
  <div className="mt-4">
    <h3 className="font-semibold mb-2">
      Output
    </h3>

    <pre
      className="
        bg-black
        text-green-400
        p-4
        rounded-lg
        min-h-[120px]
        overflow-auto
      "
    >
      {output ||
        "Run code to see output"}
    </pre>
  </div>
)}
            </div>

            {/* Markdown Live Preview */}
            {workspaceType !== "developer" && (
              <div>
                <h2 className="font-semibold mb-2">Live Preview</h2>
                <div className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 h-full overflow-auto prose dark:prose-invert max-w-none transition-colors duration-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text || "# Live Preview"}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="border dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 h-fit transition-colors duration-300">
            <h2 className="font-semibold mb-4">Users in Room</h2>
            
            {/* Contextual Workspace Tools Component */}
            <div className="mb-6">
              {workspaceType === "developer" && (
                <div className="border border-blue-500 rounded-lg p-3 mb-4">
                  <h3 className="font-bold mb-2">💻 Code Review</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Review notes..."
                    className="w-full p-2 rounded bg-white dark:bg-gray-800 border"
                  />
                  <button
  onClick={saveWorkspaceData}
  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
>
  Save Review
</button>
                </div>
              )}

              {workspaceType === "medical" && (
                <div className="border border-green-500 rounded-lg p-3 mb-4">
                  <h3 className="font-bold mb-2">🏥 Patient Information</h3>
                  <input
  value={patientInfo.name}
  onChange={(e) =>
    setPatientInfo({
      ...patientInfo,
      name: e.target.value,
    })
  }
  placeholder="Patient Name"
  className="w-full mb-2 p-2 rounded border"
/>

<input
  value={patientInfo.age}
  onChange={(e) =>
    setPatientInfo({
      ...patientInfo,
      age: e.target.value,
    })
  }
  placeholder="Age"
  className="w-full mb-2 p-2 rounded border"
/>

<input
  value={patientInfo.diagnosis}
  onChange={(e) =>
    setPatientInfo({
      ...patientInfo,
      diagnosis: e.target.value,
    })
  }
  placeholder="Diagnosis"
  className="w-full p-2 rounded border"
/>
<button
  onClick={saveWorkspaceData}
  className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
>
  Save Patient Info
</button>
                </div>
              )}

              {workspaceType === "classroom" && (
                <div className="border border-purple-500 rounded-lg p-3 mb-4">
                  <h3 className="font-bold mb-2">🎓 Assignment</h3>
                  <textarea
                    value={assignment}
                    onChange={(e) => setAssignment(e.target.value)}
                    placeholder="Create assignment..."
                    className="w-full p-2 rounded border"
                  />
                  <button
  onClick={saveWorkspaceData}
  className="mt-2 bg-purple-500 text-white px-3 py-1 rounded"
>
  Save Assignment
</button>
                </div>
              )}
            </div>

            {/* Connected User Tags */}
            <div className="flex flex-wrap gap-2">
              {activeUsers.map((user) => (
  <div
    key={user}
    className="
      bg-gray-200
      dark:bg-gray-700
      px-3
      py-1
      rounded-full
      text-sm
    "
  >
    {user}
  </div>
))}
            </div>

            {/* History Feed Popup panel */}
            {showHistory && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">
                  {workspaceType === "developer"
                    ? "Code History"
                    : workspaceType === "medical"
                    ? "Patient Record History"
                    : "Lesson History"}
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {versions.map((version) => (
                    <div key={version._id} className="border dark:border-gray-700 rounded p-2">
                      <p className="text-sm">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      <button
                        onClick={() => restoreVersion(version.content)}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workspace Comments Feed Context */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">
                {workspaceType === "developer"
                  ? "Code Review Notes"
                  : workspaceType === "medical"
                  ? "Medical Notes"
                  : "Class Discussion"}
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className="border dark:border-gray-700 rounded p-2">
                    <p className="font-semibold text-sm">{comment.username}</p>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 p-2 rounded mt-3"
                placeholder="Add comment..."
              />
              <div className="
  border
  rounded-lg
  p-4
  mb-4
">

  <h2 className="
    font-semibold
    mb-3
  ">
    Active Users
  </h2>

  <div className="
    space-y-2
  ">

    {activeUsers.map(
      (user) => (

        <div
          key={user}
          className="
            flex
            items-center
            gap-2
          "
        >
          <span>
            🟢
          </span>

          <span>
            {user}
          </span>
        </div>
      )
    )}

  </div>

</div>
              <button
                onClick={addComment}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              >
                Comment
              </button>
            </div>

            {/* Typing Indicator Status */}
            <p className="text-sm text-gray-500 mt-6 h-5">{typing}</p>

            {/* Realtime Remote Cursors Tracker */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Live Cursors</h3>
              <div className="space-y-2">
                {cursors.map((cursor) => (
                  <div key={cursor.userId} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cursor.color }}
                    />
                    <span>{cursor.username}</span>
                    <span className="text-gray-500">
                      line {cursor.lineNumber}, column {cursor.column}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}