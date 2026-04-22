import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import "./Overview.css";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getStatusBadge(status) {
  const map = {
    confirmed: "mv-badge mv-badge-teal",
    pending: "mv-badge mv-badge-amber",
    cancelled: "mv-badge mv-badge-coral",
  };
  return map[status] || "mv-badge mv-badge-blue";
}

const MED_COLOR_MAP = {
  coral:  { bg: "var(--coral-light)",  emoji: "💊" },
  blue:   { bg: "var(--blue-light)",   emoji: "💉" },
  teal:   { bg: "var(--teal-light)",   emoji: "🌿" },
  purple: { bg: "var(--purple-light)", emoji: "💊" },
  amber:  { bg: "var(--amber-light)",  emoji: "🧪" },
};

function StatCard({ icon, value, label, sub, accentColor, iconBg }) {
  return (
    <div className="ov-stat-card">
      <div className="ov-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="ov-stat-val" style={{ color: accentColor }}>{value}</div>
      <div className="ov-stat-lbl">{label}</div>
      {sub && <div className="ov-stat-sub" style={{ color: accentColor }}>{sub}</div>}
    </div>
  );
}

function ApptItem({ appt }) {
  return (
    <div className="ov-appt-item">
      <div className="ov-appt-time-col">
        <div className="ov-appt-time">{formatTime(appt.time)}</div>
        <div className="ov-appt-date">{formatDate(appt.date)}</div>
      </div>
      <div className="ov-appt-vline" />
      <div className="ov-appt-info">
        <div className="ov-appt-doctor">{appt.doctor}</div>
        <div className="ov-appt-spec">{appt.specialization}</div>
        <div className="ov-appt-hosp">{appt.hospital}</div>
      </div>
      <span className={getStatusBadge(appt.status)}>
        {appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : "Scheduled"}
      </span>
    </div>
  );
}

function MedItem({ med, onMarkTaken }) {
  const colorInfo = MED_COLOR_MAP[med.color] || MED_COLOR_MAP.coral;
  return (
    <div className="ov-med-item">
      <div className="ov-med-pill" style={{ background: colorInfo.bg }}>{colorInfo.emoji}</div>
      <div className="ov-med-info">
        <div className="ov-med-name">{med.name}</div>
        <div className="ov-med-dose">{med.dose} · {med.frequency} · {med.instructions}</div>
      </div>
      <div className="ov-med-status">
        {med.takenToday ? (
          <>
            <div className="ov-med-taken">Taken ✓</div>
            <div className="ov-med-time-sub">{med.time}</div>
          </>
        ) : (
          <>
            <div className="ov-med-pending">{med.time}</div>
            <button className="ov-mark-btn" onClick={() => onMarkTaken(med._id)}>
              Mark taken
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Overview() {
  const {
    upcomingAppointments,
    todaysMedications,
    pendingMeds,
    documents,
    adherencePercent,
    loading,
    error,
    markMedicationTaken,
  } = useDashboard();
  const apptList  = Array.isArray(upcomingAppointments) ? upcomingAppointments : [];
  const medList   = Array.isArray(todaysMedications)    ? todaysMedications    : [];
  const pendList  = Array.isArray(pendingMeds)          ? pendingMeds          : [];
  const docList   = Array.isArray(documents)            ? documents            : [];

  if (loading) {
    return (
      <div className="ov-loading">
        <div className="ov-spinner" />
        <span>Loading your dashboard…</span>
      </div>
    );
  }

  const nextAppt        = apptList[0];
  const nextApptLabel   = nextAppt ? formatDate(nextAppt.date) : null;
  const firstDoc        = docList[0];
  const lastUploadLabel = firstDoc
    ? `Last upload ${formatDate(firstDoc.uploadedAt)}`
    : "No documents yet";

  return (
    <div className="ov-root">

      {error && (
        <div className="ov-error-banner">
          ⚠ Could not reach server — showing local data. {error}
        </div>
      )}

      <div className="ov-section-label mv-section-label">Health Summary</div>
      <div className="ov-stats-grid">

        <StatCard
          icon={<svg fill="none" stroke="#1D9E75" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>}
          value={apptList.length}
          label="Upcoming Appointments"
          sub={nextApptLabel ? `Next: ${nextApptLabel}` : "None scheduled"}
          accentColor="var(--teal)"
          iconBg="var(--teal-light)"
        />

        <StatCard
          icon={<svg fill="none" stroke="#BA7517" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          value={medList.length}
          label="Active Medications"
          sub={pendList.length > 0 ? `${pendList.length} due today` : medList.length === 0 ? "None added" : "All taken ✓"}
          accentColor="var(--amber)"
          iconBg="var(--amber-light)"
        />

        <StatCard
          icon={<svg fill="none" stroke="#185FA5" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>}
          value={docList.length}
          label="Medical Documents"
          sub={lastUploadLabel}
          accentColor="var(--blue)"
          iconBg="var(--blue-light)"
        />

        <StatCard
          icon={<svg fill="none" stroke="#D85A30" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>}
          value={`${adherencePercent}%`}
          label="Med Adherence"
          sub={medList.length === 0 ? "No medications" : "Today"}
          accentColor="var(--coral)"
          iconBg="var(--coral-light)"
        />

      </div>

      <div className="ov-grid-2">

        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">Upcoming Appointments</span>
            {apptList.length > 0 && (
              <span className="mv-badge mv-badge-teal">{apptList.length} scheduled</span>
            )}
          </div>
          {apptList.length === 0 ? (
            <div className="mv-empty">
              <div className="mv-empty-icon">📅</div>
              <div className="mv-empty-text">No appointments scheduled</div>
              <div className="mv-empty-text" style={{ fontSize: 11 }}>Book your first appointment below</div>
            </div>
          ) : (
            apptList.slice(0, 3).map((appt) => (
              <ApptItem key={appt._id} appt={appt} />
            ))
          )}
          <Link to="/dashboard/appointments">
            <button className="mv-btn-primary">+ Book New Appointment</button>
          </Link>
        </div>

        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">Today's Medications</span>
            {pendList.length > 0 && (
              <span className="mv-badge mv-badge-amber">{pendList.length} pending</span>
            )}
            {pendList.length === 0 && medList.length > 0 && (
              <span className="mv-badge mv-badge-teal">All taken ✓</span>
            )}
          </div>
          {medList.length === 0 ? (
            <div className="mv-empty">
              <div className="mv-empty-icon">💊</div>
              <div className="mv-empty-text">No medications added yet</div>
              <div className="mv-empty-text" style={{ fontSize: 11 }}>Add medications to track your doses</div>
            </div>
          ) : (
            medList.map((med) => (
              <MedItem key={med._id} med={med} onMarkTaken={markMedicationTaken} />
            ))
          )}
          <Link to="/dashboard/medications">
            <button className="mv-btn-primary" style={{ background: "var(--amber)" }}>
              Manage Medications →
            </button>
          </Link>
        </div>

      </div>

      <div className="mv-card ov-ai-card">
        <div className="mv-card-hd">
          <div className="ov-ai-title">
            <div className="ov-ai-dot" />
            <span className="mv-card-title">AI Assistant — Quick Chat</span>
          </div>
          <span className="mv-badge mv-badge-purple">Online</span>
        </div>
        <div className="ov-ai-preview">
          <div className="ov-chat-bubble ov-chat-ai">
            Hello! I'm your Mediverse AI. You have <strong>{apptList.length}</strong> upcoming
            appointment{apptList.length !== 1 ? "s" : ""} and{" "}
            <strong>{pendList.length}</strong> medication{pendList.length !== 1 ? "s" : ""} due
            today. How can I help you?
          </div>
        </div>
        <Link to="/dashboard/ai">
          <button className="mv-btn-primary ov-ai-btn">Open Full Chat →</button>
        </Link>
      </div>

    </div>
  );
}