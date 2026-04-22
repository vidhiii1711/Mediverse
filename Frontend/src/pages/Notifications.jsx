import { useState, useEffect, useRef, useCallback } from "react";
import { useDashboard } from "../context/DashboardContext";
import "./Notifications.css";

// ─── Health quotes for medicine reminders
const QUOTES = [
  "Take care of your body. It's the only place you have to live.",
  "A healthy outside starts from the inside.",
  "Your health is an investment, not an expense.",
  "Small steps every day lead to big health changes.",
  "Consistency is the key to good health.",
  "The greatest wealth is health.",
  "An apple a day keeps the doctor away — so does your medicine!",
];

// ─── In-app notification toast component
function NotifToast({ notifications, onDismiss }) {
  return (
    <div className="notif-toast-container">
      {notifications.map((n) => (
        <div key={n.id} className={`notif-toast notif-toast-${n.type}`}>
          <div className="notif-toast-icon">{n.icon}</div>
          <div className="notif-toast-body">
            <div className="notif-toast-title">{n.title}</div>
            <div className="notif-toast-msg">{n.message}</div>
          </div>
          <button className="notif-toast-close" onClick={() => onDismiss(n.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Helper: format date
function formatDay(iso) { return new Date(iso).getDate(); }
function formatMon(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short" });
}
function daysFromNow(iso) {
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
}
function formatTime12(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ─── Main component
export default function Notifications() {
  const {
    medications,
    upcomingAppointments,
    markMedicationTaken,
    refetch,
  } = useDashboard();

  const medList  = Array.isArray(medications)           ? medications           : [];
  const apptList = Array.isArray(upcomingAppointments)  ? upcomingAppointments  : [];

  // ── Notification preferences state
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem("mv_notif_prefs");
    return saved ? JSON.parse(saved) : {
      master:      true,
      medicine:    true,
      missedDose:  true,
      appointment: true,
      advanceTime: 15, // minutes
    };
  });

  // ── In-app toast notifications
  const [toasts, setToasts] = useState([]);
  const scheduledRef = useRef(new Set()); // track already scheduled notifications

  // Save prefs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mv_notif_prefs", JSON.stringify(prefs));
  }, [prefs]);

  // ── Toggle helper
  function togglePref(key) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function masterToggle() {
    const newVal = !prefs.master;
    setPrefs((prev) => ({
      ...prev,
      master:      newVal,
      medicine:    newVal,
      missedDose:  newVal,
      appointment: newVal,
    }));
  }

  // ── Show in-app toast
  const showToast = useCallback((title, message, type = "medicine", icon = "💊") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type, icon }]);
    // Auto dismiss after 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  }, []);

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Schedule medicine notifications 
  useEffect(() => {
    if (!prefs.master || !prefs.medicine) return;

    const today = new Date().toISOString().split("T")[0];

    medList.forEach((med) => {
      if (med.notificationEnabled === false) return;
      if (med.takenDates?.includes(today)) return;

      const timings = Array.isArray(med.timings) && med.timings.length > 0
        ? med.timings
        : med.time ? [med.time] : [];

      timings.forEach((time) => {
        const key = `${med._id}-${time}-${today}`;
        if (scheduledRef.current.has(key)) return;

        const [h, m] = time.split(":").map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(h, m, 0, 0);

        // Subtract advance time
        const notifyAt = new Date(target.getTime() - prefs.advanceTime * 60 * 1000);
        const msUntil = notifyAt - now;

        if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
          scheduledRef.current.add(key);
          const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
          setTimeout(() => {
            showToast(
              `💊 Time to take ${med.name}!`,
              `${med.dose} · ${med.instructions || med.frequency} · "${quote}"`,
              "medicine",
              "💊"
            );
          }, msUntil);
        }
      });
    });
  }, [medList, prefs.master, prefs.medicine, prefs.advanceTime, showToast]);

  // ── Schedule appointment notifications
  useEffect(() => {
    if (!prefs.master || !prefs.appointment) return;

    apptList.forEach((appt) => {
      const key = `appt-${appt._id}`;
      if (scheduledRef.current.has(key)) return;

      const apptDate = new Date(appt.date);
      const now = new Date();
      const msUntil = apptDate - now - 24 * 60 * 60 * 1000; // 1 day before

      if (msUntil > 0 && msUntil < 48 * 60 * 60 * 1000) {
        scheduledRef.current.add(key);
        setTimeout(() => {
          showToast(
            `📅 Appointment tomorrow!`,
            `${appt.doctor} · ${appt.specialization} · ${appt.hospital}`,
            "appointment",
            "📅"
          );
        }, msUntil);
      }
    });
  }, [apptList, prefs.master, prefs.appointment, showToast]);

  // ── Missed dose check — runs every 5 minutes
  useEffect(() => {
    if (!prefs.master || !prefs.missedDose) return;

    function checkMissed() {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      medList.forEach((med) => {
        if (med.notificationEnabled === false) return;
        if (med.takenDates?.includes(today)) return;

        const timings = Array.isArray(med.timings) && med.timings.length > 0
          ? med.timings : med.time ? [med.time] : [];

        timings.forEach((time) => {
          const [h, m] = time.split(":").map(Number);
          const schedTime = new Date();
          schedTime.setHours(h, m, 0, 0);
          const msPast = now - schedTime;

          // If more than 1 hour past and not taken
          if (msPast > 60 * 60 * 1000 && msPast < 2 * 60 * 60 * 1000) {
            const key = `missed-${med._id}-${time}-${today}`;
            if (!scheduledRef.current.has(key)) {
              scheduledRef.current.add(key);
              showToast(
                `⚠ Missed dose!`,
                `You missed ${med.name} ${med.dose} at ${formatTime12(time)}. Please take it as soon as possible.`,
                "missed",
                "⚠️"
              );
            }
          }
        });
      });
    }

    checkMissed(); // run immediately
    const interval = setInterval(checkMissed, 5 * 60 * 1000); // every 5 mins
    return () => clearInterval(interval);
  }, [medList, prefs.master, prefs.missedDose, showToast]);

  // ── Build today's schedule (pending + missed + upcoming only)
  const today = new Date().toISOString().split("T")[0];
  const now   = new Date();

  const todaySchedule = medList
    .filter((m) => m.enabled !== false)
    .flatMap((m) => {
      const timings = Array.isArray(m.timings) && m.timings.length > 0
        ? m.timings : m.time ? [m.time] : [];
      return timings.map((t) => ({
        medId: m._id,
        name:  m.name,
        dose:  m.dose,
        time:  t,
        taken: m.takenDates?.includes(today) || false,
      }));
    })
    .filter((item) => !item.taken) // remove taken items
    .map((item) => {
      const [h, mn] = item.time.split(":").map(Number);
      const t = new Date(); t.setHours(h, mn, 0, 0);
      const diff = t - now;
      const state = diff < -60 * 60 * 1000 ? "missed"
        : diff < 0 ? "pending"
        : diff < 60 * 60 * 1000 ? "pending"
        : "upcoming";
      return { ...item, state, sortKey: t.getTime() };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  const pendingCount = todaySchedule.filter(s => s.state === "pending").length;
  const missedCount  = todaySchedule.filter(s => s.state === "missed").length;

  // ── Handle mark taken
  async function handleMarkTaken(medId) {
    try {
      await markMedicationTaken(medId);
      showToast("✅ Medicine taken!", "Great job staying consistent with your health!", "taken", "✅");
      refetch();
    } catch (err) {
      alert("Failed to mark: " + err.message);
    }
  }

  // ── Upcoming appointments (next 7 days) 
  const upcomingAppts = apptList
    .filter((a) => {
      const diff = (new Date(a.date) - now) / 86400000;
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const APPT_COLORS = [
    { bg: "var(--teal-light)",   border: "var(--teal)",   day: "var(--teal)",   mon: "var(--teal-mid)" },
    { bg: "var(--blue-light)",   border: "var(--blue)",   day: "var(--blue)",   mon: "var(--blue)" },
    { bg: "var(--purple-light)", border: "var(--purple)", day: "var(--purple)", mon: "var(--purple)" },
    { bg: "var(--amber-light)",  border: "var(--amber)",  day: "var(--amber)",  mon: "var(--amber)" },
  ];

  return (
    <div className="nf-root">
      {/* In-app toast notifications */}
      <NotifToast notifications={toasts} onDismiss={dismissToast} />

      <div className="mv-section-label">Notifications</div>

      {/* Stats */}
      <div className="nf-stat-row">
        <div className="nf-stat-card">
          <div className="nf-stat-val" style={{ color: "var(--amber)" }}>
            {pendingCount + missedCount}
          </div>
          <div className="nf-stat-lbl">Medicines due today</div>
        </div>
        <div className="nf-stat-card">
          <div className="nf-stat-val" style={{ color: "var(--blue)" }}>
            {upcomingAppts.length}
          </div>
          <div className="nf-stat-lbl">Upcoming appointments</div>
        </div>
      </div>

      <div className="nf-grid">

        {/* LEFT */}
        <div className="nf-left">

          {/* Today's medicine schedule */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">Today's medicine schedule</span>
              {pendingCount > 0 && (
                <span className="mv-badge mv-badge-amber">{pendingCount} pending</span>
              )}
              {pendingCount === 0 && missedCount === 0 && medList.length > 0 && (
                <span className="mv-badge mv-badge-teal">All done ✓</span>
              )}
            </div>

            {todaySchedule.length === 0 ? (
              <div className="mv-empty">
                <div className="mv-empty-icon">💊</div>
                <div className="mv-empty-text">
                  {medList.length === 0
                    ? "No medications added yet"
                    : "All medicines taken for today ✓"}
                </div>
              </div>
            ) : (
              todaySchedule.map((item, idx) => (
                <div key={`${item.medId}-${idx}`} className={`nf-sched-item nf-sched-${item.state}`}>
                  <div className="nf-sched-time">{formatTime12(item.time)}</div>
                  <div className="nf-sched-body">
                    <div className="nf-sched-name">{item.name} {item.dose}</div>
                    <div className="nf-sched-status">
                      {item.state === "missed"   && "Missed — take as soon as possible"}
                      {item.state === "pending"  && "Due soon · notification will pop up"}
                      {item.state === "upcoming" && "Upcoming"}
                    </div>
                  </div>
                  {(item.state === "pending" || item.state === "missed") && (
                    <button className="nf-mark-btn" onClick={() => handleMarkTaken(item.medId)}>
                      Mark taken
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="mv-card">
            <div className="mv-card-hd">
              <span className="mv-card-title">Upcoming appointments</span>
              <span className="mv-badge mv-badge-blue">Next 7 days</span>
            </div>

            {upcomingAppts.length === 0 ? (
              <div className="mv-empty">
                <div className="mv-empty-icon">📅</div>
                <div className="mv-empty-text">No appointments in the next 7 days</div>
              </div>
            ) : (
              upcomingAppts.map((appt, idx) => {
                const col = APPT_COLORS[idx % APPT_COLORS.length];
                const dl  = daysFromNow(appt.date);
                const dlColor = dl === "Today" || dl === "Tomorrow"
                  ? "var(--amber)" : "var(--blue)";
                return (
                  <div key={appt._id} className="nf-appt-item">
                    <div className="nf-appt-date-box"
                      style={{ background: col.bg, borderColor: col.border }}>
                      <div className="nf-appt-day" style={{ color: col.day }}>
                        {formatDay(appt.date)}
                      </div>
                      <div className="nf-appt-mon" style={{ color: col.mon }}>
                        {formatMon(appt.date)}
                      </div>
                    </div>
                    <div className="nf-appt-body">
                      <div className="nf-appt-doctor">{appt.doctor}</div>
                      <div className="nf-appt-meta">
                        {appt.specialization} · {appt.hospital}
                      </div>
                    </div>
                    <div className="nf-days-left" style={{ color: dlColor }}>{dl}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Preferences */}
        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">Notification preferences</span>
          </div>

          {/* In-app info banner */}
          <div className="nf-inapp-banner">
            <div className="nf-inapp-icon">🔔</div>
            <div>
              <div className="nf-inapp-title">In-app notifications active</div>
              <div className="nf-inapp-sub">
                Notifications appear as popups while you use the app
              </div>
            </div>
          </div>

          {/* Test notification button */}
          <button
            className="nf-test-btn"
            onClick={() => showToast(
              "💊 Test Notification",
              "This is how your medicine reminders will look!",
              "medicine", "💊"
            )}
          >
            Send test notification
          </button>

          <div className="nf-prefs">

            {/* Master */}
            <div className="nf-pref-item nf-pref-master">
              <div>
                <div className="nf-pref-label">All notifications</div>
                <div className="nf-pref-sub">Master switch — turns all alerts on or off</div>
              </div>
              <button
                className={`nf-toggle ${prefs.master ? "on" : "off"}`}
                onClick={masterToggle}
              />
            </div>

            {/* Medicine reminders */}
            <div className={`nf-pref-item ${!prefs.master ? "nf-pref-disabled" : ""}`}>
              <div>
                <div className="nf-pref-label">💊 Medicine reminders</div>
                <div className="nf-pref-sub">Pop-up alert at medicine time</div>
              </div>
              <button
                className={`nf-toggle ${prefs.medicine && prefs.master ? "on" : "off"}`}
                onClick={() => prefs.master && togglePref("medicine")}
              />
            </div>

            {/* Missed dose */}
            <div className={`nf-pref-item ${!prefs.master ? "nf-pref-disabled" : ""}`}>
              <div>
                <div className="nf-pref-label">⚠ Missed dose alert</div>
                <div className="nf-pref-sub">Alert if dose not marked within 1 hour</div>
              </div>
              <button
                className={`nf-toggle ${prefs.missedDose && prefs.master ? "on" : "off"}`}
                onClick={() => prefs.master && togglePref("missedDose")}
              />
            </div>

            {/* Appointment reminders */}
            <div className={`nf-pref-item ${!prefs.master ? "nf-pref-disabled" : ""}`}>
              <div>
                <div className="nf-pref-label">📅 Appointment reminders</div>
                <div className="nf-pref-sub">1 day before and 1 hour before</div>
              </div>
              <button
                className={`nf-toggle ${prefs.appointment && prefs.master ? "on" : "off"}`}
                onClick={() => prefs.master && togglePref("appointment")}
              />
            </div>

            {/* Advance time */}
            <div className={`nf-pref-item nf-pref-col ${!prefs.master ? "nf-pref-disabled" : ""}`}>
              <div>
                <div className="nf-pref-label">⏰ Remind me before</div>
                <div className="nf-pref-sub">How early to show medicine reminder</div>
              </div>
              <select
                className="nf-adv-select"
                value={prefs.advanceTime}
                disabled={!prefs.master}
                onChange={(e) =>
                  setPrefs((prev) => ({ ...prev, advanceTime: Number(e.target.value) }))
                }
              >
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
