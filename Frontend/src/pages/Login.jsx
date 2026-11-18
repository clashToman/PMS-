
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Zap,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : err.message || "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-main text-white">
      {/* Left branding section */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-dark-border bg-dark-sidebar p-12 lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-yellow/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-yellow/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-xl  p-3  text-black shadow-yellow">
            <img
              src={logo}
              alt="PMS Project Logo"
              className="h-14 w-full max-w-[190px] object-contain object-left"
            />
          </div>
          
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-yellow/20 bg-brand-yellow/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-brand-yellow">
            <BrainCircuit size={15} />
            Smart project management
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Plan better.
            <br />
            Work <span className="text-brand-yellow">smarter.</span>
            <br />
            Deliver faster.
          </h1>

          <p className="mt-6 text-lg leading-8 text-dark-muted">
            Manage projects, coordinate your team, and discover
            actionable insights with AI-powered analysis.
          </p>

          <div className="mt-10 flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-brand-yellow" />
            <div className="h-1 w-5 rounded-full bg-gray-700" />
            <div className="h-1 w-5 rounded-full bg-gray-700" />
          </div>
        </div>

        <p className="relative z-10 text-sm text-gray-600">
          AI-Powered Project Management System
        </p>
      </div>

      {/* Right login section */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          
<div className="mb-10 text-center">
  <div className="mb-6 inline-flex rounded-xl  p-3  lg:hidden">
    <img
      src={logo}
      alt="PMS Project Logo"
      className="mx-auto h-14 w-full max-w-[190px] object-contain"
    />
  </div>

  

  <h2 className="text-3xl font-extrabold tracking-tight text-white">
    Welcome back
  </h2>

  <p className="mt-3 text-sm text-dark-muted">
    Sign in to access your workspace.
  </p>
</div>


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pms.com"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-dark-border bg-dark-card py-3.5 pl-12 pr-4 text-white transition placeholder:text-gray-600 focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-dark-border bg-dark-card py-3.5 pl-12 pr-12 text-white transition placeholder:text-gray-600 focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition hover:bg-dark-elevated hover:text-brand-yellow"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-yellow py-3.5 font-bold text-black shadow-yellow transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Signing in...
                </>
              ) : (
                <>
                  <Zap size={18} fill="currentColor" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-dark-border pt-6">
            <p className="text-center text-xs text-gray-500">
              Secure access to your project workspace
            </p>
            <p className="mt-2 text-center text-xs font-medium text-gray-600">
              Powered by Praveen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
