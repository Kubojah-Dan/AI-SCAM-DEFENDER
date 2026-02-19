import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import AppShell from "../Components/AppShell";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { token } = useAuth();
  const [privacy, setPrivacy] = useState({
    two_factor_enabled: false,
    email_alerts: true,
    sms_alerts: false,
    share_anonymized_analytics: true,
    data_retention_days: 90,
    profile_visibility: "private",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const payload = await apiRequest("/settings/privacy", { token });
        setPrivacy(payload.privacy);
      } catch (err) {
        setError(err.message);
      }
    }

    loadSettings();
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = await apiRequest("/settings/privacy", {
        method: "PUT",
        token,
        body: {
          ...privacy,
          data_retention_days: Number(privacy.data_retention_days),
        },
      });
      setPrivacy(payload.privacy);
      setMessage("Privacy settings updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Settings & Privacy">
      <section className="settings-card glass-panel">
        <header className="section-header">
          <h3 className="panel-title">Privacy Controls</h3>
          <span className="badge badge-outline">Security</span>
        </header>
        <p className="panel-subtitle">
          Configure how Scam Defender handles your telemetry, alerts, and retention windows.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          <label className="toggle-row">
            <div>
              <strong>Two-factor authentication</strong>
              <small>Require additional verification for account sign-in.</small>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-accent"
              checked={privacy.two_factor_enabled}
              onChange={(event) => setPrivacy((prev) => ({ ...prev, two_factor_enabled: event.target.checked }))}
            />
          </label>

          <label className="toggle-row">
            <div>
              <strong>Email alerts</strong>
              <small>Receive notifications for high and critical threat detections.</small>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-accent"
              checked={privacy.email_alerts}
              onChange={(event) => setPrivacy((prev) => ({ ...prev, email_alerts: event.target.checked }))}
            />
          </label>

          <label className="toggle-row">
            <div>
              <strong>SMS alerts</strong>
              <small>Enable mobile escalation for severe incidents.</small>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-accent"
              checked={privacy.sms_alerts}
              onChange={(event) => setPrivacy((prev) => ({ ...prev, sms_alerts: event.target.checked }))}
            />
          </label>

          <label className="toggle-row">
            <div>
              <strong>Share anonymized analytics</strong>
              <small>Contribute anonymized metrics to improve community protection models.</small>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-accent"
              checked={privacy.share_anonymized_analytics}
              onChange={(event) =>
                setPrivacy((prev) => ({ ...prev, share_anonymized_analytics: event.target.checked }))
              }
            />
          </label>

          <div className="settings-grid">
            <label className="ui-field">
              <span className="ui-label">Data retention (days)</span>
              <input
                className="ui-control ui-input"
                type="number"
                min="7"
                max="3650"
                value={privacy.data_retention_days}
                onChange={(event) => setPrivacy((prev) => ({ ...prev, data_retention_days: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Profile visibility</span>
              <select
                className="ui-control ui-select"
                value={privacy.profile_visibility}
                onChange={(event) => setPrivacy((prev) => ({ ...prev, profile_visibility: event.target.value }))}
              >
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
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

          <button type="submit" className={`btn btn-accent ${saving ? "btn-disabled" : ""}`}>
            {saving ? "Saving..." : "Save Privacy Settings"}
          </button>
        </form>
      </section>
    </AppShell>
  );
}
