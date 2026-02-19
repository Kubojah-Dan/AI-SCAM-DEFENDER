import { NavLink, useNavigate } from "react-router-dom";
import { FiActivity, FiLogOut, FiMessageSquare, FiSettings, FiShield, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: FiActivity },
  { label: "Profile", to: "/profile", icon: FiUser },
  { label: "Settings", to: "/settings", icon: FiSettings },
  { label: "Feedback", to: "/feedback", icon: FiMessageSquare },
];

export default function AppShell({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell-layout">
      <aside className="shell-sidebar glass-panel">
        <div className="brand-mark">
          <FiShield />
          <div>
            <h1>Scam Defender</h1>
            <p>Real-Time Security Suite</p>
          </div>
        </div>

        <nav className="shell-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `shell-link ${isActive ? "active" : ""}`}>
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          className="btn btn-outline btn-warning shell-logout"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <FiLogOut /> Sign Out
        </button>
      </aside>

      <main className="shell-main">
        <header className="shell-header glass-panel">
          <div className="shell-header-copy">
            <h2>{title}</h2>
            <p>Stay ahead of scams with layered detection and live alerts.</p>
          </div>
          <div className="shell-user">
            <span>{user?.full_name || "Analyst"}</span>
            <small>{user?.email}</small>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
