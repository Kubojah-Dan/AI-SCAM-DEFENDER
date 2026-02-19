const features = [
  {
    title: "Email and Message Protection",
    description:
      "Detect social engineering cues, urgent language traps, spoofing patterns, and suspicious links before they become account takeovers.",
  },
  {
    title: "URL and File Intelligence",
    description:
      "Scan risky websites and uploaded files in one workflow so malware, fake portals, and delivery payloads are flagged early.",
  },
  {
    title: "Fraud Behavior Monitoring",
    description:
      "Track transaction anomalies and unusual behavior signals to reduce financial fraud exposure and speed up response decisions.",
  },
];

export default function Features() {
  return (
    <section className="home-card">
      <header className="home-section-header">
        <p className="hero-kicker">What We Offer</p>
        <h2>Built to protect real users from real-world scams.</h2>
      </header>

      <div className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card glass-panel">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>

      <div className="education-strip glass-panel">
        <p>
          Scam prevention works best when users understand attacker behavior. ShieldX combines education and detection so
          people can make safer decisions before damage happens.
        </p>
      </div>
    </section>
  );
}
