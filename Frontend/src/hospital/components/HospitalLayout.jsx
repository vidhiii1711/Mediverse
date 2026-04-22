import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useHospital } from "../context/HospitalContext";
import "./HospitalLayout.css";

const navItems = [
  {
    to: "/hospital/dashboard",
    label: "Overview",
    end: true,
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: "/hospital/dashboard/appointments",
    label: "Appointments",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
      </svg>
    ),
  },
  // {
  //   to: "/hospital/dashboard/patients",
  //   label: "Patients",
  //   icon: (
  //     <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
  //       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  //       <circle cx="12" cy="7" r="4"/>
  //     </svg>
  //   ),
  // },

];

const settingsItems = [
  {
    to: "/hospital/dashboard/profile",
    label: "Hospital Profile",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
];

export default function HospitalLayout({ children }) {
  const navigate = useNavigate();
  const { hospital } = useHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  const initials = hospital?.name
    ? hospital.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "H";

  const hospName = hospital?.name || "Hospital";

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  return (
    <div className="hl-shell">
      {sidebarOpen && (
        <div className="hl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`hl-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="hl-logo-wrap">
          <div className="hl-logo">Medi<span>verse</span></div>
          <div className="hl-hosp-badge">
            <div className="hl-hosp-dot" />
            {hospName}
          </div>
        </div>

        <div className="hl-nav-label">Main Menu</div>
        <nav className="hl-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `hl-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="hl-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hl-nav-sep" />
        <div className="hl-nav-label">Settings</div>
        <nav className="hl-nav">
          {settingsItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `hl-nav-item ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="hl-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hl-sidebar-foot">
          <button className="hl-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      <div className="hl-main">
        <header className="hl-topbar">
          <button
            className="hl-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="hl-topbar-title">
            {getGreeting()}, <strong>{hospName}</strong> 👋
          </div>
          <div className="hl-topbar-av">{initials}</div>
        </header>

        <main className="hl-content">{children}</main>
      </div>
    </div>
  );
}
