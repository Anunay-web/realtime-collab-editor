import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Document = {
  _id: string;
  title: string;
  roomId: string;
  updatedAt: string;
  favorite: boolean;
  workspaceType: "developer" | "medical" | "classroom";
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");
  const [workspaceType, setWorkspaceType] = useState<"developer" | "medical" | "classroom">("developer");

  const fetchDocuments = async () => {
    const response = await fetch("http://localhost:5000/api/documents");
    const data = await response.json();

    setDocuments(
      data.sort((a: Document, b: Document) => Number(b.favorite) - Number(a.favorite))
    );
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const createDocument = async () => {
    const response = await fetch("http://localhost:5000/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Untitled Document",
        workspaceType,
      }),
    });

    const data = await response.json();
    navigate(`/?room=${data.roomId}`);
  };

  const deleteDocument = async (id: string) => {
    const confirmed = window.confirm("Delete this document?");
    if (!confirmed) return;

    await fetch(`http://localhost:5000/api/documents/${id}`, {
      method: "DELETE",
    });

    fetchDocuments();
  };

  const renameDocument = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new title", currentTitle);
    if (!newTitle) return;

    await fetch(`http://localhost:5000/api/documents/${id}/title`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTitle,
      }),
    });

    fetchDocuments();
  };

  const toggleFavorite = async (id: string) => {
    await fetch(`http://localhost:5000/api/documents/${id}/favorite`, {
      method: "PATCH",
    });

    fetchDocuments();
  };

  const shareDocument = async (roomId: string) => {
    const link = `${window.location.origin}/?room=${roomId}`;
    await navigator.clipboard.writeText(link);
    setCopied("Link copied!");

    setTimeout(() => {
      setCopied("");
    }, 2000);
  };

  const filteredDocuments = documents
    .filter((doc) => doc.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white p-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Documents</h1>
          <span className="text-gray-500">{documents.length} Documents</span>
        </div>

        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg mb-4"
        />

        {copied && <p className="text-green-500 mb-4">{copied}</p>}

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg"
          />
          
          <select
            value={workspaceType}
            onChange={(e) => setWorkspaceType(e.target.value as "developer" | "medical" | "classroom")}
            className="border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg"
          >
            <option value="developer">Developer</option>
            <option value="medical">Medical</option>
            <option value="classroom">Classroom</option>
          </select>

          <button onClick={createDocument} className="bg-black text-white px-6 rounded-lg">
            Create
          </button>
        </div>

        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold">
                  {doc.workspaceType === "developer" && "🧑‍💻"}
                  {doc.workspaceType === "medical" && "🏥"}
                  {doc.workspaceType === "classroom" && "🎓"}{" "}
                  {doc.title}
                </h2>
                
                <div className="flex gap-2 mt-2 mb-2">
                  {doc.workspaceType === "developer" && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      Developer
                    </span>
                  )}
                  {doc.workspaceType === "medical" && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                      Medical
                    </span>
                  )}
                  {doc.workspaceType === "classroom" && (
                    <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">
                      Classroom
                    </span>
                  )}
                </div>
                
                <p className="text-gray-500 text-sm">Room: {doc.roomId}</p>
                <p className="text-gray-500 text-sm">
                  Updated: {new Date(doc.updatedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => navigate(`/?room=${doc.roomId}`)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Open
                </button>
                <button
                  onClick={() => shareDocument(doc.roomId)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                  Share
                </button>
                <button
                  onClick={() => toggleFavorite(doc._id)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                >
                  {doc.favorite ? "⭐" : "☆"}
                </button>
                <button
                  onClick={() => renameDocument(doc._id, doc.title)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteDocument(doc._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No documents found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}