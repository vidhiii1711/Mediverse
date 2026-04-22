import { useState, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";
import "./Medications.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

const QUOTES = [
  "Take care of your body. It's the only place you have to live.",
  "A healthy outside starts from the inside.",
  "Your health is an investment, not an expense.",
  "Small steps every day lead to big health changes.",
  "Consistency is the key to good health.",
  "The greatest wealth is health.",
  "An apple a day keeps the doctor away — so does your medicine!",
];

const PILL_ICONS = ["💊", "💉", "🌿", "🧪", "💙"];
const PILL_COLORS = [
  "var(--coral-light)",
  "var(--blue-light)",
  "var(--teal-light)",
  "var(--purple-light)",
  "var(--amber-light)",
];

function formatTime12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getWeekAdherence(med) {
  if (!med.takenDates || med.takenDates.length === 0) return 0;
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 6);
  const dosesPerDay = med.timings?.length || 1;
  const totalExpected = 7 * dosesPerDay;
  const takenThisWeek = med.takenDates.filter((d) => {
    const date = new Date(d);
    return date >= weekAgo && date <= today;
  }).length;
  return Math.min(Math.round((takenThisWeek / totalExpected) * 100), 100);
}

// ─── Empty state component
function EmptyState({ icon, text, subText }) {
  return (
    <div className="med-empty">
      <div className="med-empty-icon">{icon}</div>
      <div className="med-empty-text">{text}</div>
      {subText && <div className="med-empty-sub">{subText}</div>}
    </div>
  );
}

// ─── Main component
export default function Medications() {
  const { medications, addMedication, toggleMedication, markMedicationTaken, deleteMedication, refetch } =
    useDashboard();

  const medList = Array.isArray(medications) ? medications : [];

  // ── Form state
  const [form, setForm] = useState({
    name: "",
    dose: "",
    frequency: "Once daily",
    time1: "",
    time2: "",
    instructions: "",
    notificationEnabled: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Derived data
  const today = getTodayStr();

  // Build today's schedule — one entry per timing per medicine
  const todaySchedule = medList
    .filter((m) => m.enabled !== false)
    .flatMap((m) => {
      const timings = Array.isArray(m.timings) && m.timings.length > 0
        ? m.timings
        : m.time
        ? [m.time]
        : ["08:00"];
      return timings.map((t) => ({
        medId: m._id,
        name: m.name,
        dose: m.dose,
        time: t,
        taken: Array.isArray(m.takenDates) && m.takenDates.includes(today),
      }));
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const pendingCount    = todaySchedule.filter((s) => !s.taken).length;
  const notifsOnCount   = medList.filter((m) => m.notificationEnabled !== false).length;
  const overallAdherence =
    medList.length === 0
      ? 0
      : Math.round(medList.reduce((sum, m) => sum + getWeekAdherence(m), 0) / medList.length);

  // ── Handle form submit
  async function handleAdd(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!form.name.trim()) return setErrorMsg("Please enter medicine name.");
    if (!form.dose.trim()) return setErrorMsg("Please enter dose.");
    if (!form.time1)       return setErrorMsg("Please set at least one time.");

    const timings = [form.time1];
    if (form.time2) timings.push(form.time2);

    setSubmitting(true);
    try {
      await addMedication({
        name: form.name.trim(),
        dose: form.dose.trim(),
        frequency: form.frequency,
        timings,
        time: form.time1,
        instructions: form.instructions.trim(),
        notificationEnabled: form.notificationEnabled,
        enabled: true,
        takenDates: [],
        colorIndex: medList.length % PILL_COLORS.length,
      });
      setSuccessMsg(`${form.name} added successfully!`);
      setForm({ name:"", dose:"", frequency:"Once daily", time1:"", time2:"", instructions:"", notificationEnabled:true });
      setTimeout(() => setSuccessMsg(""), 3500);
      refetch();
    } catch (err) {
      setErrorMsg(err.message || "Failed to add medication.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Handle toggle notification
  async function handleToggle(med) {
    try {
      await toggleMedication(med._id, !med.notificationEnabled);
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
  }

  // ── Handle mark taken
  async function handleMarkTaken(medId) {
    try {
      await markMedicationTaken(medId);
      refetch();
    } catch (err) {
      alert("Failed to mark: " + err.message);
    }
  }

  // ── Handle delete
  async function handleDelete(medId, name) {
    if (!window.confirm(`Remove ${name} from your medications?`)) return;
    try {
      await deleteMedication(medId);
      refetch();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  }

  return (
    <div className="med-root">
      <div className="mv-section-label">Medications</div>

      {/* ── Stats ── */}
      <div className="med-stat-row">
        <div className="med-stat-card">
          <div className="med-stat-val" style={{ color:"var(--teal)" }}>{medList.length}</div>
          <div className="med-stat-lbl">Active medications</div>
        </div>
        <div className="med-stat-card">
          <div className="med-stat-val" style={{ color:"var(--amber)" }}>{pendingCount}</div>
          <div className="med-stat-lbl">Due today</div>
        </div>
        <div className="med-stat-card">
          <div className="med-stat-val" style={{ color:"var(--teal)" }}>
            {medList.length === 0 ? "—" : `${overallAdherence}%`}
          </div>
          <div className="med-stat-lbl">Doses taken this week</div>
        </div>
        <div className="med-stat-card">
          <div className="med-stat-val" style={{ color:"var(--purple)" }}>{notifsOnCount}</div>
          <div className="med-stat-lbl">Notifications on</div>
        </div>
      </div>

      {/* ── Banners ── */}
      {successMsg && <div className="med-success-banner">✅ {successMsg}</div>}
      {errorMsg   && <div className="med-error-banner">⚠ {errorMsg}</div>}

      <div className="med-grid">

        {/* ── LEFT ── */}
        <div className="med-left">

          {/* Medication list */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">My medications</span>
              {medList.length > 0 && (
                <span className="mv-badge mv-badge-teal">{medList.length} active</span>
              )}
            </div>

            {medList.length === 0 ? (
              <EmptyState
                icon="💊"
                text="No medications added yet"
                subText="Add your first medicine using the form below"
              />
            ) : (
              medList.map((med, idx) => {
                const colorIdx = med.colorIndex ?? idx % PILL_COLORS.length;
                const icon = PILL_ICONS[colorIdx];
                const bg   = PILL_COLORS[colorIdx];
                const notifOn = med.notificationEnabled !== false;
                const timings = Array.isArray(med.timings) && med.timings.length > 0
                  ? med.timings
                  : med.time ? [med.time] : [];
                const timeStr = timings.map(formatTime12).join(" & ");

                return (
                  <div key={med._id} className="med-item">
                    <div className="med-pill" style={{ background: bg }}>{icon}</div>
                    <div className="med-body">
                      <div className="med-name">{med.name}</div>
                      <div className="med-detail">
                        {med.dose} · {med.frequency}
                        {med.instructions ? ` · ${med.instructions}` : ""}
                      </div>
                      <div className={`med-time-badge ${notifOn ? "notif-on" : "notif-off"}`}>
                        ⏰ {timeStr || "No time set"}
                        {!notifOn && " · Notification off"}
                      </div>
                    </div>
                    <div className="med-actions">
                      <button
                        className={`med-toggle ${notifOn ? "on" : "off"}`}
                        onClick={() => handleToggle(med)}
                        title={notifOn ? "Turn off notification" : "Turn on notification"}
                      />
                      <button className="med-del-btn" onClick={() => handleDelete(med._id, med.name)}>
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add medication form */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">Add new medication</span>
            </div>

            <form className="med-form" onSubmit={handleAdd}>
              <div className="med-field">
                <label>Medicine name</label>
                <input
                  placeholder="e.g. Paracetamol"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="med-field-row">
                <div className="med-field">
                  <label>Dose</label>
                  <input
                    placeholder="e.g. 500mg"
                    value={form.dose}
                    onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
                  />
                </div>
                <div className="med-field">
                  <label>Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  >
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
              </div>

              <div className="med-field-row">
                <div className="med-field">
                  <label>Time 1</label>
                  <input
                    type="time"
                    value={form.time1}
                    onChange={(e) => setForm((f) => ({ ...f, time1: e.target.value }))}
                  />
                </div>
                <div className="med-field">
                  <label>Time 2 (if needed)</label>
                  <input
                    type="time"
                    value={form.time2}
                    onChange={(e) => setForm((f) => ({ ...f, time2: e.target.value }))}
                  />
                </div>
              </div>

              <div className="med-field">
                <label>Instructions</label>
                <input
                  placeholder="e.g. With food, after dinner, before meals…"
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                />
              </div>

              <div className="med-notif-toggle-row">
                <div>
                  <div className="med-notif-toggle-label">Enable notification</div>
                  <div className="med-notif-toggle-sub">
                    Get reminded at set time with a health quote
                  </div>
                </div>
                <button
                  type="button"
                  className={`med-toggle ${form.notificationEnabled ? "on" : "off"}`}
                  onClick={() => setForm((f) => ({ ...f, notificationEnabled: !f.notificationEnabled }))}
                />
              </div>

              <button className="med-btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Medication"}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="med-right">

          {/* Today's schedule */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">Today's schedule</span>
              {todaySchedule.length > 0 && pendingCount > 0 && (
                <span className="mv-badge mv-badge-amber">{pendingCount} pending</span>
              )}
              {todaySchedule.length > 0 && pendingCount === 0 && (
                <span className="mv-badge mv-badge-teal">All taken ✓</span>
              )}
            </div>

            {todaySchedule.length === 0 ? (
              <EmptyState
                icon="🕐"
                text="No medicines scheduled for today"
                subText="Add medications to see your daily schedule here"
              />
            ) : (
              todaySchedule.map((item, idx) => {
                const now = new Date();
                const [h, m] = item.time.split(":").map(Number);
                const schedTime = new Date();
                schedTime.setHours(h, m, 0, 0);
                const isPast    = schedTime < now;
                const stateClass = item.taken ? "taken" : isPast ? "pending" : "upcoming";

                return (
                  <div key={`${item.medId}-${idx}`} className={`med-sched-item ${stateClass}`}>
                    <div className="med-sched-time">{formatTime12(item.time)}</div>
                    <div className="med-sched-body">
                      <div className="med-sched-name">
                        {item.name} {item.dose}
                        {item.taken ? " ✓" : ""}
                      </div>
                      <div className="med-sched-status">
                        {item.taken ? "Taken" : isPast ? "Missed / Due" : "Upcoming"}
                      </div>
                    </div>
                    {!item.taken && (
                      <button
                        className="med-mark-btn"
                        onClick={() => handleMarkTaken(item.medId)}
                      >
                        Mark taken
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Notification status */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">Notification status</span>
              {notifsOnCount > 0 && (
                <span className="mv-badge mv-badge-purple">{notifsOnCount} active</span>
              )}
            </div>

            {medList.length === 0 ? (
              <EmptyState
                icon="🔔"
                text="No notifications set up yet"
                subText="Add medications to configure reminders"
              />
            ) : (
              medList.map((med, idx) => {
                const notifOn  = med.notificationEnabled !== false;
                const colorIdx = med.colorIndex ?? idx % PILL_COLORS.length;
                const icon     = PILL_ICONS[colorIdx];
                const bg       = PILL_COLORS[colorIdx];
                const timings  = Array.isArray(med.timings) && med.timings.length > 0
                  ? med.timings : med.time ? [med.time] : [];
                const timeStr  = timings.map(formatTime12).join(" & ");
                const quote    = QUOTES[idx % QUOTES.length];

                return (
                  <div key={med._id} className={`med-notif-item ${notifOn ? "active" : "inactive"}`}>
                    <div
                      className="med-notif-icon"
                      style={{ background: notifOn ? bg : "var(--bg)" }}
                    >
                      {icon}
                    </div>
                    <div className="med-notif-body">
                      <div className={`med-notif-name ${notifOn ? "active" : "inactive"}`}>
                        {med.name} · {timeStr || "No time"}
                      </div>
                      <div className={`med-notif-quote ${!notifOn ? "inactive" : ""}`}>
                        {notifOn ? `"${quote}"` : "Notification disabled"}
                      </div>
                    </div>
                    <span className={`med-notif-badge ${notifOn ? "on" : "off"}`}>
                      {notifOn ? "On" : "Off"}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Doses taken this week */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">Doses taken this week</span>
              {medList.length > 0 && (
                <span className="mv-badge mv-badge-teal">{overallAdherence}% overall</span>
              )}
            </div>

            {medList.length === 0 ? (
              <EmptyState
                icon="📊"
                text="No data yet"
                subText="Add medications to start tracking your weekly doses"
              />
            ) : (
              <>
                <div className="med-adh-desc">
                  Out of all scheduled doses this week, how many you actually took
                </div>
                {medList.map((med, idx) => {
                  const pct = getWeekAdherence(med);
                  const low = pct < 70;
                  return (
                    <div key={med._id} className="med-adh-row">
                      <span className="med-adh-name">{med.name}</span>
                      <div className="med-adh-bar">
                        <div
                          className="med-adh-fill"
                          style={{
                            width: `${pct}%`,
                            background: low ? "var(--amber)" : "var(--teal)",
                          }}
                        />
                      </div>
                      <span
                        className="med-adh-pct"
                        style={{ color: low ? "var(--amber)" : "var(--teal-dark)" }}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
