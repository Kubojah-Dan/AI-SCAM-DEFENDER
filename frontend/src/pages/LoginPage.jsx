import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BackgroundCanvas from "../Components/BackgroundCanvas";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, loading, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (token) {
      const redirectTo = location.state?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
    }
  }, [token, navigate, location.state]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <BackgroundCanvas />
      <section className="auth-card glass-panel">
        <h1>Welcome Back</h1>
        <p>Log in to monitor and neutralize scam threats in real time.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-text-input"
              type="email"
              placeholder="analyst@company.com"
              value={form.email}
              onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-text-input"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
              required
            />
          </label>

          {error ? <div className="alert alert-error"><span>{error}</span></div> : null}

          <button type="submit" className={`btn btn-accent ${loading ? "btn-disabled" : ""}`}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}


