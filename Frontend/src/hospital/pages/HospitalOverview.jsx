import { useNavigate } from "react-router-dom";
import { useHospital } from "../context/HospitalContext";
import "./HospitalOverview.css";

function formatTime12(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function StatCard({ icon, value, label, sub, accentColor, iconBg }) {
  return (
    <div className="ho-stat-card">
      <div className="ho-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="ho-stat-val" style={{ color: accentColor }}>{value}</div>
      <div className="ho-stat-lbl">{label}</div>
      {sub && <div className="ho-stat-sub" style={{ color: accentColor }}>{sub}</div>}
    </div>
  );
}

export default function HospitalOverview() {
  const navigate = useNavigate();
  const {
    appointments,
    pendingCount,
    totalPatients,
    confirmedToday,
    loading,
    error,
  } = useHospital();

  const apptList         = Array.isArray(appointments)   ? appointments   : [];
  const confirmedList    = Array.isArray(confirmedToday) ? confirmedToday : [];
  const todayTotal       = apptList.filter((a) => {
    const d = new Date(a.date).toISOString().split("T")[0];
    return d === new Date().toISOString().split("T")[0];
  }).length;

  if (loading) {
    return (
      <div className="ho-loading">
        <div className="ho-spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="ho-root">
      <div className="mv-section-label">Overview</div>

      {error && (
        <div className="ho-error-banner">
          ⚠ Could not connect to server. Showing empty state.
        </div>
      )}

      {/* Stats */}
      <div className="ho-stat-grid">
        <StatCard
          icon={
            <svg fill="none" stroke="#1D9E75" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
          }
          value={todayTotal}
          label="Today's appointments"
          sub={
            todayTotal === 0
              ? "No appointments today"
              : `${confirmedList.length} confirmed · ${pendingCount} pending`
          }
          accentColor="var(--teal)"
          iconBg="var(--teal-light)"
        />

        <StatCard
          icon={
            <svg fill="none" stroke="#BA7517" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
          value={pendingCount}
          label="Pending confirmations"
          sub={pendingCount === 0 ? "All clear!" : "Action required"}
          accentColor="var(--amber)"
          iconBg="var(--amber-light)"
        />

        <StatCard
          icon={
            <svg fill="none" stroke="#185FA5" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
          value={totalPatients}
          label="Total patients"
          sub={totalPatients === 0 ? "No patients yet" : "Registered patients"}
          accentColor="var(--blue)"
          iconBg="var(--blue-light)"
        />
      </div>

      {/* View Appointments block */}
      <div
        className="ho-view-block"
        onClick={() => navigate("appointments")}
      >
        <div className="ho-view-left">
          <div className="ho-view-title">View New Appointments</div>
          <div className="ho-view-sub">
            {pendingCount === 0
              ? "No pending appointment requests right now."
              : `You have ${pendingCount} pending appointment request${pendingCount !== 1 ? "s" : ""} waiting for your confirmation. Click to review and confirm.`
            }
          </div>
        </div>
        <div className="ho-view-arrow">
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12,5 19,12 12,19"/>
          </svg>
        </div>
      </div>

      {/* Today's confirmed schedule */}
      <div className="mv-card">
        <div className="mv-card-hd">
          <span className="mv-card-title">Today's confirmed schedule</span>
          {confirmedList.length > 0 && (
            <span className="mv-badge mv-badge-teal">
              {confirmedList.length} confirmed
            </span>
          )}
        </div>

        {confirmedList.length === 0 ? (
          <div className="mv-empty">
            <div className="mv-empty-icon">📅</div>
            <div className="mv-empty-text">
              {todayTotal === 0
                ? "No appointments scheduled for today"
                : "No confirmed appointments yet — confirm pending requests above"
              }
            </div>
            <div className="mv-empty-sub">
              Confirmed appointments will appear here
            </div>
          </div>
        ) : (
          <div className="ho-sched-grid">
            {confirmedList
              .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
              .map((appt) => (
                <div key={appt._id} className="ho-sched-item">
                  <div className="ho-sched-time">{formatTime12(appt.time)}</div>
                  <div className="ho-sched-info">
                    <div className="ho-sched-spec">{appt.specialization}</div>
                    <div className="ho-sched-doc">{appt.doctor}</div>
                  </div>
                  <span className="mv-badge mv-badge-teal" style={{ fontSize: 10 }}>
                    Confirmed
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
