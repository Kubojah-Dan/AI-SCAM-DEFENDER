import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiClock, FiDatabase, FiRadio, FiShield, FiUsers, FiGlobe, FiBarChart2, FiActivity, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";
import { apiRequest, API_BASE } from "../api/client";
import AppShell from "../Components/AppShell";
import ScanCard from "../Components/ScanCard";
import EnhancedScanResult from "../Components/EnhancedScanResult";
import ThreatReportModal from "../Components/ThreatReportModal";
import { useToast } from "../Components/Toast";
import { useAuth } from "../context/AuthContext";

const initialBusy = {
  email: false,
  message: false,
  url: false,
  file: false,
  fraud: false,
};

function severityClass(severity) {
  if (severity === "critical") {
    return "alert-error";
  }
  if (severity === "high") {
    return "alert-warning";
  }
  if (severity === "medium") {
    return "alert-info";
  }
  return "alert-success";
}

function resultTheme(result) {
  const severity = result?.severity || "low";
  return severityClass(severity);
}

export default function DashboardPage() {
  const { token } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(initialBusy);
  const [results, setResults] = useState({});
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('scanners');
  const [showThreatModal, setShowThreatModal] = useState(false);
  const [modalData, setModalData] = useState({});

  const [emailInput, setEmailInput] = useState({ subject: "", message: "" });
  const [messageInput, setMessageInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [fraudInput, setFraudInput] = useState({
    step: 1,
    type: "TRANSFER",
    amount: 10000,
    nameOrig: "C123456",
    nameDest: "C654321",
  });

  const totalStats = useMemo(() => {
    if (!summary) {
      return [
        { label: "Total Scans", value: "-", icon: FiDatabase },
        { label: "Threat Scans", value: "-", icon: FiAlertTriangle },
        { label: "Recent (7d)", value: "-", icon: FiClock },
        { label: "Open Alerts", value: "-", icon: FiRadio },
      ];
    }

    return [
      { label: "Total Scans", value: summary.totals.total_scans, icon: FiDatabase },
      { label: "Threat Scans", value: summary.totals.threat_scans, icon: FiShield },
      { label: "Recent (7d)", value: summary.totals.recent_scans_7d, icon: FiClock },
      { label: "Open Alerts", value: summary.totals.open_alerts, icon: FiAlertTriangle },
    ];
  }, [summary]);

  async function loadDashboard() {
    try {
      const [summaryPayload, historyPayload, alertPayload] = await Promise.all([
        apiRequest("/dashboard/summary", { token }),
        apiRequest("/dashboard/history?limit=20", { token }),
        apiRequest("/alerts", { token }),
      ]);

      setSummary(summaryPayload);
      setHistory(historyPayload.items || []);
      setAlerts(alertPayload.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!token) {
      console.log('No token found, skipping dashboard load');
      return;
    }
    loadDashboard();
  }, [token, loadDashboard]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const stream = new EventSource(`${API_BASE}/stream/alerts?token=${encodeURIComponent(token)}`);

    stream.addEventListener("alert", (event) => {
      try {
        const alert = JSON.parse(event.data);
        setAlerts((previous) => [alert, ...previous].slice(0, 100));
      } catch {
        // no-op
      }
    });

    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.close();
    };
  }, [token]);

  async function runScan(scanType, requestFactory) {
    setError("");
    setBusy((previous) => ({ ...previous, [scanType]: true }));

    try {
      const result = await requestFactory();
      setResults((previous) => ({
        ...previous,
        [scanType]: {
          ...result,
          severityClass: resultTheme(result),
        },
      }));
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy((previous) => ({ ...previous, [scanType]: false }));
    }
  }

  async function acknowledgeAlert(alertId) {
    try {
      await apiRequest(`/alerts/${alertId}/ack`, { method: "PATCH", token });
      setAlerts((previous) =>
        previous.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
      );
      await loadDashboard();
      showSuccess("Alert acknowledged successfully");
    } catch (err) {
      setError(err.message);
      showError("Failed to acknowledge alert");
    }
  }

  const handleReportThreat = (result, scanType) => {
    setModalData({ result, scanType });
    setShowThreatModal(true);
  };

  const handleMarkSafe = async (result, scanType) => {
    try {
      await apiRequest('/feedback/mark-safe', {
        method: 'POST',
        token,
        body: {
          scanType,
          originalResult: result,
          timestamp: new Date().toISOString()
        }
      });
      showSuccess('Thank you for helping improve Scam Defender!');
      await loadDashboard();
    } catch (err) {
      showError('Failed to mark as safe');
    }
  };

  const handleThreatReportSubmit = async (reportData) => {
    try {
      await apiRequest('/report-threat', {
        method: 'POST',
        token,
        body: reportData
      });
      showSuccess('Threat report submitted successfully. Thank you for helping keep our community safe!');
      await loadDashboard();
    } catch (err) {
      showError('Failed to submit threat report');
    }
  };

  return (
    <AppShell title="Threat Operations Dashboard">
      <section className="dashboard-grid">
        <article className="dashboard-banner glass-panel">
          <div>
            <h3 className="panel-title">Unified Scam Defense Console</h3>
            <p className="panel-subtitle">
              Run real-time scans across email, message, URL, file, and transaction channels from one control plane.
            </p>
          </div>
          <span className="badge badge-info">Live Monitoring</span>
        </article>

        <div className="stat-grid">
          {totalStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="stat-card glass-panel">
                <Icon />
                <div>
                  <h4 className="stat-label">{stat.label}</h4>
                  <strong className="stat-value">{stat.value}</strong>
                </div>
              </article>
            );
          })}
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link
            to="/sandbox"
            className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4 hover:border-purple-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiShield className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
              <div>
                <h3 className="text-white font-semibold">Sandbox Analysis</h3>
                <p className="text-gray-400 text-sm">Secure isolated analysis environment</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/report"
            className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 hover:border-red-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiSend className="w-8 h-8 text-red-400 group-hover:text-red-300" />
              <div>
                <h3 className="text-white font-semibold">Report Threat</h3>
                <p className="text-gray-400 text-sm">Submit malicious threats you've experienced</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/team"
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiUsers className="w-8 h-8 text-blue-400 group-hover:text-blue-300" />
              <div>
                <h3 className="text-white font-semibold">Team Collaboration</h3>
                <p className="text-gray-400 text-sm">Real-time team chat and threat sharing</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/intelligence"
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiGlobe className="w-8 h-8 text-green-400 group-hover:text-green-300" />
              <div>
                <h3 className="text-white font-semibold">Threat Intelligence</h3>
                <p className="text-gray-400 text-sm">External feeds and IOC management</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/analytics"
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiBarChart2 className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
              <div>
                <h3 className="text-white font-semibold">Advanced Analytics</h3>
                <p className="text-gray-400 text-sm">Comprehensive threat analysis and metrics</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/response"
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiActivity className="w-8 h-8 text-orange-400 group-hover:text-orange-300" />
              <div>
                <h3 className="text-white font-semibold">Incident Response</h3>
                <p className="text-gray-400 text-sm">Automated workflows and incident management</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/community"
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <FiDatabase className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300" />
              <div>
                <h3 className="text-white font-semibold">Community Feed</h3>
                <p className="text-gray-400 text-sm">User-reported threats and moderation</p>
              </div>
            </div>
          </Link>
        </div>

        {error ? (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        ) : null}

        <ScanCard
          title="Email Scanner"
          description="DistilBERT phishing and spam detection with confidence scoring."
          onSubmit={() =>
            runScan("email", () =>
              apiRequest("/scan/email", {
                method: "POST",
                token,
                body: emailInput,
              })
            )
          }
          busy={busy.email}
          result={results.email}
        >
          <label className="ui-field">
            <span className="ui-label">Email Subject</span>
            <input
              className="ui-control ui-input"
              placeholder="Subject"
              value={emailInput.subject}
              onChange={(event) => setEmailInput((prev) => ({ ...prev, subject: event.target.value }))}
            />
          </label>
          <label className="ui-field">
            <span className="ui-label">Email Body</span>
            <textarea
              className="ui-control ui-textarea"
              rows={4}
              placeholder="Paste full email body"
              value={emailInput.message}
              onChange={(event) => setEmailInput((prev) => ({ ...prev, message: event.target.value }))}
            />
          </label>
        </ScanCard>

        <ScanCard
          title="Message Scanner"
          description="SMS and chat scam detection with TF-IDF + Random Forest model."
          onSubmit={() =>
            runScan("message", () =>
              apiRequest("/scan/message", {
                method: "POST",
                token,
                body: { message: messageInput },
              })
            )
          }
          busy={busy.message}
          result={results.message}
        >
          <label className="ui-field">
            <span className="ui-label">Message Content</span>
            <textarea
              className="ui-control ui-textarea"
              rows={5}
              placeholder="Paste suspicious SMS or chat message"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
            />
          </label>
        </ScanCard>

        <ScanCard
          title="URL Scanner"
          description="Lexical + XGBoost multi-class malicious URL classification."
          onSubmit={() =>
            runScan("url", () =>
              apiRequest("/scan/url", {
                method: "POST",
                token,
                body: { url: urlInput },
              })
            )
          }
          busy={busy.url}
          result={results.url}
        >
          <label className="ui-field">
            <span className="ui-label">Target URL</span>
            <input
              className="ui-control ui-input"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
            />
          </label>
        </ScanCard>

        <ScanCard
          title="File Malware Scanner"
          description="PE static analysis with XGBoost + Random Forest ensemble."
          onSubmit={() =>
            runScan("file", async () => {
              const formData = new FormData();
              if (fileInput) {
                formData.append("file", fileInput);
              }
              return apiRequest("/scan/file", {
                method: "POST",
                token,
                body: formData,
              });
            })
          }
          busy={busy.file}
          result={results.file}
        >
          <label className="ui-field">
            <span className="ui-label">Upload PE File</span>
            <input
              type="file"
              className="ui-control ui-file"
              onChange={(event) => setFileInput(event.target.files?.[0] || null)}
            />
          </label>
        </ScanCard>

        <ScanCard
          title="Fraud Transaction Scanner"
          description="Behavioral + anomaly scoring for real-time financial fraud."
          onSubmit={() =>
            runScan("fraud", () =>
              apiRequest("/scan/fraud", {
                method: "POST",
                token,
                body: {
                  ...fraudInput,
                  amount: Number(fraudInput.amount),
                  step: Number(fraudInput.step),
                },
              })
            )
          }
          busy={busy.fraud}
          result={results.fraud}
        >
          <div className="fraud-form-grid">
            <label className="ui-field">
              <span className="ui-label">Step</span>
              <input
                className="ui-control ui-input"
                type="number"
                min="1"
                placeholder="Step"
                value={fraudInput.step}
                onChange={(event) => setFraudInput((prev) => ({ ...prev, step: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Type</span>
              <select
                className="ui-control ui-select"
                value={fraudInput.type}
                onChange={(event) => setFraudInput((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="CASH_OUT">CASH_OUT</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CASH_IN">CASH_IN</option>
              </select>
            </label>

            <label className="ui-field">
              <span className="ui-label">Amount</span>
              <input
                className="ui-control ui-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={fraudInput.amount}
                onChange={(event) => setFraudInput((prev) => ({ ...prev, amount: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Origin Account</span>
              <input
                className="ui-control ui-input"
                placeholder="Origin Account"
                value={fraudInput.nameOrig}
                onChange={(event) => setFraudInput((prev) => ({ ...prev, nameOrig: event.target.value }))}
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Destination Account</span>
              <input
                className="ui-control ui-input"
                placeholder="Destination Account"
                value={fraudInput.nameDest}
                onChange={(event) => setFraudInput((prev) => ({ ...prev, nameDest: event.target.value }))}
              />
            </label>
          </div>
        </ScanCard>

        {/* Enhanced Results Display */}
        {Object.entries(results).map(([scanType, result]) => (
          <EnhancedScanResult
            key={scanType}
            result={result}
            scanType={scanType}
            onReportThreat={handleReportThreat}
            onMarkSafe={handleMarkSafe}
          />
        ))}

        <div className="history-alert-grid">
          <article className="glass-panel history-card">
            <header className="section-header">
              <h3 className="panel-title">Recent Scan History</h3>
              <span className="badge badge-outline">{history.length} entries</span>
            </header>

            <div className="history-list">
              {history.length === 0 ? (
                <p>No scans yet. Run a scan to build your timeline.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className={`history-item ${item.severity}`}>
                    <div>
                      <strong>{item.scan_type.toUpperCase()}</strong>
                      <p>{item.verdict} · Risk {item.risk_score}%</p>
                    </div>
                    <small>{new Date(item.created_at).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="glass-panel alerts-card">
            <header className="section-header">
              <h3 className="panel-title">Live Alerts</h3>
              <span className="badge badge-outline">{alerts.length} alerts</span>
            </header>

            <div className="alerts-list">
              {alerts.length === 0 ? (
                <p>No active alerts.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`alert ${severityClass(alert.severity)}`}>
                    <div>
                      <strong>{alert.title}</strong>
                      <p>{alert.message}</p>
                      <small>{new Date(alert.created_at).toLocaleString()}</small>
                    </div>
                    {!alert.acknowledged ? (
                      <button className="btn btn-xs btn-neutral" onClick={() => acknowledgeAlert(alert.id)}>
                        Acknowledge
                      </button>
                    ) : (
                      <span className="badge badge-success">Acknowledged</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      {/* Threat Report Modal */}
      <ThreatReportModal
        isOpen={showThreatModal}
        onClose={() => setShowThreatModal(false)}
        onSubmit={handleThreatReportSubmit}
        scanResult={modalData.result}
        scanType={modalData.scanType}
      />
    </AppShell>
  );
}
