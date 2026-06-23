import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page reload
    if (!formData.email || !formData.password) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user.username);
        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 px-4">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/80 w-full max-w-md transition-all duration-300">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Welcome back
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Enter your credentials to access your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all duration-200 text-sm"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Password
              </label>
              <a href="#" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
                Forgot?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all duration-200 text-sm"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 text-white font-medium p-3 rounded-xl hover:bg-neutral-800 active:scale-[0.99] transform transition-all duration-200 shadow-sm flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-8">
          Don't have an account?{" "}
          <a href="#" className="font-medium text-neutral-900 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}