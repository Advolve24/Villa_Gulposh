import { useEffect, useState } from "react";
import { useAuth } from "../store/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (user?.isAdmin) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await toast.promise(
        login(email, password),
        {
          loading: "Signing in...",
          success: "Welcome back!",
          error: (err) =>
            err?.response?.data?.message || err.message || "Login failed",
        }
      );

      const to = location.state?.from?.pathname || "/dashboard";
      navigate(to, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          className="border w-full p-2 rounded"
          placeholder="Email"
          type="email"
          value={email} onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="border w-full p-2 rounded"
          placeholder="Password"
          type="password"
          value={password} onChange={e=>setPassword(e.target.value)}
        />
        <button
          className={`w-full text-white py-2 rounded ${loading ? "bg-gray-500" : "bg-black"}`}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
