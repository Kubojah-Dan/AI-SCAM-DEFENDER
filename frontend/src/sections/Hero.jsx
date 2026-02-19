import { Link } from "react-router-dom";
import shieldxLogoPng from "../Components/shieldx-logo.png";
import shieldxLogoSvg from "../assets/shieldx-logo.svg";

export default function Hero({ auth }) {
  const isSignedIn = Boolean(auth?.token);

  return (
    <section className="home-card home-hero" id="home">
      <div className="hero-brand">
        <img src={shieldxLogoSvg} alt="ShieldX temporary logo" className="hero-logo-svg" />
        <div className="hero-brand-copy">
          <p className="hero-kicker">ShieldX Cybersecurity</p>
          <h1>Secure your data before scammers can exploit it.</h1>
        </div>
      </div>

      <div className="hero-layout">
        <div className="hero-copy">
          <p>
            Every day, attackers use phishing links, fake invoices, and spoofed messages to steal credentials and
            financial information. Most breaches begin with a single click, not a complex exploit.
          </p>
          <p>
            ShieldX gives you layered detection across URLs, emails, files, messages, and suspicious transaction
            behavior so you can identify threats early and act with confidence.
          </p>
          <p>
            Security is not only for enterprises. Individuals, families, and small businesses need clear guidance,
            proactive monitoring, and practical tools to stay safe online.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-accent" to={isSignedIn ? "/dashboard" : "/register"}>
              {isSignedIn ? "Open Dashboard" : "Create Free Account"}
            </Link>
            <Link className="btn btn-outline" to="/login">
              Sign In
            </Link>
          </div>
        </div>

        <aside className="hero-proof glass-panel">
          <img src={shieldxLogoPng} alt="ShieldX logo preview" className="hero-logo-png" />
          <h2>Protection starts with awareness</h2>
          <p>
            Learn common scam patterns, verify digital activity in real time, and reduce your risk with consistent
            security habits.
          </p>

          <div className="hero-metrics">
            <article>
              <strong>24/7</strong>
              <span>Threat Monitoring</span>
            </article>
            <article>
              <strong>5</strong>
              <span>Detection Channels</span>
            </article>
            <article>
              <strong>1</strong>
              <span>Unified Security Console</span>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}
