import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="home-card home-footer">
      <div className="footer-grid">
        <section>
          <h3>ShieldX</h3>
          <p>Cybersecurity platform for scam prevention, education, and real-time digital threat visibility.</p>
        </section>

        <section>
          <h4>Product</h4>
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/feedback">Feedback</Link>
        </section>

        <section>
          <h4>Account</h4>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/settings">Settings</Link>
        </section>

        <section>
          <h4>Legal and Contact</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="mailto:security@shieldx.local">security@shieldx.local</a>
        </section>
      </div>

      <p className="footer-note">Copyright {year} ShieldX. All rights reserved.</p>
    </footer>
  );
}
