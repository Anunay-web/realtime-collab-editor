import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

type Document = {
  _id: string;
  title: string;
  roomId: string;
};

export default function Dashboard() {

  const navigate =
    useNavigate();

  const [documents, setDocuments] =
    useState<Document[]>([]);

  const [title, setTitle] =
    useState("");

  // fetch documents

  const fetchDocuments =
    async () => {

      const response =
        await fetch(
          "http://localhost:5000/api/documents"
        );

      const data =
        await response.json();

      setDocuments(data);
    };

  useEffect(() => {
    fetchDocuments();
  }, []);

 // create document

  const createDocument =
    async () => {

      const response =
        await fetch(
          "http://localhost:5000/api/documents",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title,
            }),
          }
        );

      const data =
        await response.json();

      navigate(
        `/?room=${data.roomId}`
      );
    };
// delete document

  const deleteDocument =
    async (id: string) => {

      await fetch(
        `http://localhost:5000/api/documents/${id}`,
        {
          method: "DELETE",
        }
      );

      fetchDocuments();
    };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white p-6">

      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Documents
        </h1>


        <div className="flex gap-4 mb-8">

          <input
            type="text"
            placeholder="Document title"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-lg"
          />

          <button
            onClick={
              createDocument
            }
            className="bg-black text-white px-6 rounded-lg"
          >
            Create
          </button>
        </div>


        <div className="space-y-4">

          {documents.map(
            (doc) => (
              <div
                key={doc._id}
                className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow flex items-center justify-between"
              >

                <div>

                  <h2 className="text-xl font-semibold">
                    {doc.title}
                  </h2>

                  <p className="text-gray-500 text-sm">
                    Room:
                    {" "}
                    {doc.roomId}
                  </p>
                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      navigate(
                        `/?room=${doc.roomId}`
                      )
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Open
                  </button>

                  <button
                    onClick={() =>
                      deleteDocument(
                        doc._id
                      )
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}