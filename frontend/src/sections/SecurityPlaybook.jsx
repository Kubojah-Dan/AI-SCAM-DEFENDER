const playbook = [
  {
    step: "01",
    title: "Verify Identity First",
    details:
      "Always validate who sent the message before opening attachments, sharing OTPs, or confirming payment instructions.",
  },
  {
    step: "02",
    title: "Inspect URLs and Files",
    details:
      "Hover over links, check domains carefully, and scan unknown files. Attackers rely on lookalike URLs and rushed clicks.",
  },
  {
    step: "03",
    title: "Use Layered Security",
    details:
      "Enable MFA, use strong unique passwords, and monitor unusual account behavior to stop small incidents from becoming full breaches.",
  },
  {
    step: "04",
    title: "Report and Respond Fast",
    details:
      "When suspicious activity appears, isolate accounts, report incidents quickly, and document evidence so recovery is faster.",
  },
];

export default function SecurityPlaybook() {
  return (
    <section className="home-card">
      <header className="home-section-header">
        <p className="hero-kicker">Security Education</p>
        <h2>Your daily cyber safety playbook.</h2>
      </header>

      <div className="playbook-grid">
        {playbook.map((item) => (
          <article key={item.step} className="playbook-step glass-panel">
            <span>{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.details}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
