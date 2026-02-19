import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import AppShell from "../Components/AppShell";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { token, user, setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    avatar_url: "",
    role: "",
    company: "",
    location: "",
    phone: "",
    bio: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const payload = await apiRequest("/auth/me", { token });
        const profile = payload.user.profile || {};
        setForm({
          full_name: payload.user.full_name || "",
          avatar_url: profile.avatar_url || "",
          role: profile.role || "",
          company: profile.company || "",
          location: profile.location || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
        });
      } catch (err) {
        setError(err.message);
      }
    }

    loadProfile();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = await apiRequest("/profile", {
        method: "PUT",
        token,
        body: form,
      });
      setUser(payload.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Profile">
      <section className="profile-card glass-panel">
        <header className="section-header">
          <h3 className="panel-title">Account Profile</h3>
          <span className="badge badge-outline">Identity</span>
        </header>
        <p className="panel-subtitle">
          Keep your analyst identity and contact details current for audit trails and escalation routing.
        </p>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label className="ui-field">
            <span className="ui-label">Name</span>
            <input
              className="ui-control ui-input"
              type="text"
              value={form.full_name}
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
            />
          </label>

          <label className="ui-field">
            <span className="ui-label">Avatar URL</span>
            <input
              className="ui-control ui-input"
              type="url"
              value={form.avatar_url}
              onChange={(event) => setForm((prev) => ({ ...prev, avatar_url: event.target.value }))}
              placeholder="https://example.com/avatar.png"
            />
          </label>

          <div className="profile-form-grid">
            <label className="ui-field">
              <span className="ui-label">Role</span>
              <input
                className="ui-control ui-input"
                type="text"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Company</span>
              <input
                className="ui-control ui-input"
                type="text"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Location</span>
              <input
                className="ui-control ui-input"
                type="text"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Phone</span>
              <input
                className="ui-control ui-input"
                type="text"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
          </div>

          <label className="ui-field">
            <span className="ui-label">Bio</span>
            <textarea
              className="ui-control ui-textarea"
              rows="5"
              placeholder="Short bio"
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            />
          </label>

          {message ? (
            <div className="alert alert-success">
              <span>{message}</span>
            </div>
          ) : null}
          {error ? (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          ) : null}

          <button type="submit" className={`btn btn-accent ${saving ? "btn-disabled" : ""}`}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <small className="profile-note">Signed in as {user?.email}</small>
      </section>
    </AppShell>
  );
}
