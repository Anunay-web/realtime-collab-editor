import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { saveToken } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    const response = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      saveToken(data.token);

      navigate("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 shadow-xl rounded-xl w-96">
        <h1 className="text-2xl font-bold mb-4">
          Login
        </h1>

        <input
          placeholder="Email"
          className="border p-3 w-full mb-3 rounded"
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-3 w-full mb-3 rounded"
          onChange={(e) =>
            setFormData({
              ...formData,
              password: e.target.value,
            })
          }
        />

        <button
          onClick={handleLogin}
          className="bg-black text-white w-full p-3 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
}