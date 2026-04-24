import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./DashboardLayout.css";
import logo from "../assets/logo.png"; 
const [serverSlow, setServerSlow] = useState(false);

useEffect(() => {
  let timer;
  // Check if server responds within 2 seconds
  const checkServer = async () => {
    timer = setTimeout(() => setServerSlow(true), 2000);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
    } catch {}
    clearTimeout(timer);
    setServerSlow(false);
  };
  checkServer();
  return () => clearTimeout(timer);
}, []);

const navItems = [
  {
    to: "/dashboard",
    label: "Overview",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/dashboard/appointments",
    label: "Appointments",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="16" y1="2" x2="16" y2="6" />
      </svg>
    ),
  },
  {
    to: "/dashboard/medications",
    label: "Medications",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    to: "/dashboard/documents",
    label: "Documents",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
      </svg>
    ),
  },
  {
    to: "/dashboard/ai",
    label: "AI Assistant",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9h.01M15 9h.01M9.5 13.5s1 2 2.5 2 2.5-2 2.5-2" />
      </svg>
    ),
  },
];

const settingsItems = [
  {
    to: "/dashboard/notifications",
    label: "Notifications",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children, user }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "MV";

  return (
    <div className="mv-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mv-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`mv-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="mv-logo">
          <img
            src={logo}
            alt="Mediverse Logo"
            style={{
              width: "100%",
              maxWidth: "120px",
              height: "auto",
              display: "block",
              marginBottom: "8px",
              borderRadius: "6px"
            }}
          />
          
        </div>

        <div className="mv-nav-label">Main Menu</div>
        <nav className="mv-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `mv-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mv-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mv-nav-sep" />
        <div className="mv-nav-label">Settings</div>
        <nav className="mv-nav">
          {settingsItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mv-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="mv-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mv-sidebar-foot">
          <button className="mv-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="mv-main">
        {/* Topbar */}
        <header className="mv-topbar">
          <button
            className="mv-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="mv-topbar-greeting">
            {getGreeting()}, <strong>{user?.name?.split(" ")[0] || "there"}</strong> 👋
          </div>

          <div className="mv-topbar-avatar">
            <div className="mv-avatar-circle">{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="mv-content">{children}</main>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
