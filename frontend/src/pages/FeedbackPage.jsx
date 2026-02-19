import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import AppShell from "../Components/AppShell";
import { useAuth } from "../context/AuthContext";

export default function FeedbackPage() {
  const { token, user } = useAuth();

  const [form, setForm] = useState({
    category: "general",
    rating: 5,
    subject: "",
    message: "",
    contact_email: user?.email || "",
  });
  const [entries, setEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadEntries() {
    try {
      const payload = await apiRequest("/feedback", { token });
      setEntries(payload.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/feedback", {
        method: "POST",
        token,
        body: {
          ...form,
          rating: Number(form.rating),
        },
      });

      setForm((prev) => ({ ...prev, subject: "", message: "" }));
      setMessage("Thanks. Feedback submitted.");
      await loadEntries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Feedback">
      <section className="feedback-grid">
        <article className="feedback-card glass-panel">
          <header className="section-header">
            <h3 className="panel-title">Send Feedback</h3>
            <span className="badge badge-outline">Product Input</span>
          </header>
          <p className="panel-subtitle">Report bugs, feature requests, integration needs, or UX issues.</p>

          <form className="feedback-form" onSubmit={handleSubmit}>
            <label className="ui-field">
              <span className="ui-label">Category</span>
              <select
                className="ui-control ui-select"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option value="general">General</option>
                <option value="bug">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="security">Security Concern</option>
              </select>
            </label>

            <label className="ui-field">
              <span className="ui-label">Subject</span>
              <input
                className="ui-control ui-input"
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Message</span>
              <textarea
                className="ui-control ui-textarea"
                rows="6"
                placeholder="Describe your feedback"
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                required
              />
            </label>

            <div className="feedback-meta">
              <label className="ui-field">
                <span className="ui-label">Contact Email</span>
                <input
                  className="ui-control ui-input"
                  type="email"
                  value={form.contact_email}
                  onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))}
                />
              </label>

              <label className="ui-field">
                <span className="ui-label">Rating (1-5)</span>
                <input
                  className="ui-control ui-input"
                  type="number"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
                />
              </label>
            </div>

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

            <button type="submit" className={`btn btn-accent ${submitting ? "btn-disabled" : ""}`}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </article>

        <article className="feedback-card glass-panel">
          <header className="section-header">
            <h3 className="panel-title">Previous Feedback</h3>
            <span className="badge badge-outline">{entries.length} entries</span>
          </header>

          <div className="feedback-history">
            {entries.length === 0 ? (
              <p>No feedback submitted yet.</p>
            ) : (
              entries.map((entry) => (
                <div className="feedback-item" key={entry.id}>
                  <div>
                    <strong>{entry.subject || entry.category}</strong>
                    <p>{entry.message}</p>
                    <small>{new Date(entry.created_at).toLocaleString()}</small>
                  </div>
                  <span className="badge badge-info">{entry.rating}/5</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
