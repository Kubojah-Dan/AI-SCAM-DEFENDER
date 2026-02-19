export default function ScanCard({
  title,
  description,
  children,
  onSubmit,
  busy,
  result,
  actionLabel = "Scan",
}) {
  return (
    <article className="scan-card glass-panel">
      <header className="panel-heading">
        <h3 className="panel-title">{title}</h3>
        <p className="panel-subtitle">{description}</p>
      </header>

      <form
        className="scan-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <button type="submit" className={`btn btn-accent scan-action ${busy ? "btn-disabled" : ""}`}>
          {busy ? "Scanning..." : actionLabel}
        </button>
      </form>

      {result ? (
        <div className={`alert result-alert ${result.severityClass || "alert-info"}`}>
          <div>
            <strong>{result.verdict}</strong>
            <p>
              Risk: {result.risk_score}% | Confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <span className="badge badge-neutral">{String(result.severity || "review").toUpperCase()}</span>
        </div>
      ) : null}
    </article>
  );
}
