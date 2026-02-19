import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BackgroundCanvas from "../Components/BackgroundCanvas";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <BackgroundCanvas />
      <section className="auth-card glass-panel">
        <h1>Create Account</h1>
        <p>Set up your Scam Defender workspace for team-level threat response.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">Full Name</span>
            <input
              className="auth-text-input"
              type="text"
              placeholder="Jane Analyst"
              value={form.full_name}
              onChange={(event) => setForm((previous) => ({ ...previous, full_name: event.target.value }))}
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-text-input"
              type="email"
              placeholder="jane@defender.io"
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
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Confirm Password</span>
            <input
              className="auth-text-input"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(event) => setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))}
              required
            />
          </label>

          {error ? <div className="alert alert-error"><span>{error}</span></div> : null}

          <button type="submit" className={`btn btn-accent ${loading ? "btn-disabled" : ""}`}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have access? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}


