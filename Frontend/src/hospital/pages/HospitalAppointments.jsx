import { useState, useEffect } from "react";
import { useHospital } from "../context/HospitalContext";
import "./HospitalAppointments.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function formatTime(time) {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
function getInitials(name) {
  return (name || "P")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AV_COLORS = [
  { bg: "var(--teal-light)",   color: "var(--teal-dark)",  border: "var(--teal)"   },
  { bg: "var(--blue-light)",   color: "var(--blue)",       border: "var(--blue)"   },
  { bg: "var(--amber-light)",  color: "var(--amber)",      border: "var(--amber)"  },
  { bg: "var(--purple-light)", color: "var(--purple)",     border: "var(--purple)" },
  { bg: "var(--green-light)",  color: "var(--green)",      border: "var(--green)"  },
  { bg: "var(--coral-light)",  color: "var(--coral)",      border: "var(--coral)"  },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
function AppointmentModal({ appt, onClose, onConfirm, onCancel, confirming, cancelling }) {
  if (!appt) return null;

  return (
    <div className="ha-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ha-modal">
        <div className="ha-modal-hd">
          <div className="ha-modal-title">Appointment details</div>
          <button className="ha-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ha-modal-sec">
          <div className="ha-modal-sec-title">Patient information</div>
          <div className="ha-modal-row">
            <div className="ha-modal-lbl">Patient name</div>
            <div className="ha-modal-val">{appt.patientName || "—"}</div>
          </div>
          <div className="ha-modal-row">
            <div className="ha-modal-lbl">Age</div>
            <div className="ha-modal-val">{appt.age ? `${appt.age} years` : "—"}</div>
          </div>
        </div>

        <div className="ha-modal-sec">
          <div className="ha-modal-sec-title">Appointment information</div>
          <div className="ha-modal-row">
            <div className="ha-modal-lbl">Date &amp; Time</div>
            <div className="ha-modal-val">{formatDate(appt.date)} · {formatTime(appt.time)}</div>
          </div>
          <div className="ha-modal-row">
            <div className="ha-modal-lbl">Reason</div>
            <div className="ha-modal-val">{appt.reason || "—"}</div>
          </div>
          <div className="ha-modal-row">
            <div className="ha-modal-lbl">Status</div>
            <div className="ha-modal-val">
              <span className={`ha-badge ha-badge-${appt.status}`}>
                {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="ha-modal-actions">
          {appt.status === "pending" && (
            <>
              <button
                className="ha-btn-confirm"
                onClick={() => onConfirm(appt._id)}
                disabled={confirming}
              >
                {confirming ? "Confirming…" : "Confirm"}
              </button>
              <button
                className="ha-btn-cancel"
                onClick={() => onCancel(appt._id)}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel"}
              </button>
            </>
          )}
          {appt.status === "confirmed" && (
            <button
              className="ha-btn-cancel"
              style={{ width: "100%" }}
              onClick={() => onCancel(appt._id)}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Cancel appointment"}
            </button>
          )}
          {appt.status === "cancelled" && (
            <button
              className="ha-btn-confirm"
              style={{ width: "100%", opacity: 0.45, cursor: "not-allowed" }}
              disabled
            >
              Appointment cancelled
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HospitalAppointments() {
  const { appointments, confirmAppointment, cancelAppointment, refetch } = useHospital();

  const [filter, setFilter]       = useState("all");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const apptList = Array.isArray(appointments) ? appointments : [];

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = filter === "all"
    ? apptList
    : apptList.filter((a) => a.status === filter);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCount     = apptList.length;
  const pendingCount   = apptList.filter((a) => a.status === "pending").length;
  const confirmedCount = apptList.filter((a) => a.status === "confirmed").length;
  const cancelledCount = apptList.filter((a) => a.status === "cancelled").length;

  // ── Confirm ────────────────────────────────────────────────────────────────
  async function handleConfirm(id) {
    setConfirming(true);
    try {
      await confirmAppointment(id);
      // update selected appt in modal
      setSelectedAppt((prev) => prev ? { ...prev, status: "confirmed" } : null);
      showSuccess("Appointment confirmed! Patient has been notified.");
      refetch();
    } catch (err) {
      alert("Failed to confirm: " + err.message);
    } finally {
      setConfirming(false);
    }
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  async function handleCancel(id) {
    if (!window.confirm("Cancel this appointment? The patient's status will be updated.")) return;
    setCancelling(true);
    try {
      await cancelAppointment(id);
      // update selected appt in modal
      setSelectedAppt((prev) => prev ? { ...prev, status: "cancelled" } : null);
      showSuccess("Appointment cancelled. Patient status updated.");
      refetch();
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    } finally {
      setCancelling(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!apptList && apptList.length === undefined) {
    return (
      <div className="ha-loading">
        <div className="ha-spinner" />
        <span>Loading appointments…</span>
      </div>
    );
  }

  return (
    <div className="ha-root">
      <div className="mv-section-label">Appointments</div>

      {successMsg && (
        <div className="ha-success-banner">✅ {successMsg}</div>
      )}

      {/* Stats */}
      <div className="ha-stat-row">
        <div className="ha-stat-card">
          <div className="ha-stat-val" style={{ color: "var(--teal)" }}>{totalCount}</div>
          <div className="ha-stat-lbl">Total appointments</div>
        </div>
        <div className="ha-stat-card">
          <div className="ha-stat-val" style={{ color: "var(--amber)" }}>{pendingCount}</div>
          <div className="ha-stat-lbl">Pending</div>
        </div>
        <div className="ha-stat-card">
          <div className="ha-stat-val" style={{ color: "var(--green)" }}>{confirmedCount}</div>
          <div className="ha-stat-lbl">Confirmed</div>
        </div>
        <div className="ha-stat-card">
          <div className="ha-stat-val" style={{ color: "var(--coral)" }}>{cancelledCount}</div>
          <div className="ha-stat-lbl">Cancelled</div>
        </div>
      </div>

      {/* Table */}
      <div className="mv-card">
        <div className="mv-card-hd">
          <span className="mv-card-title">Patient appointments</span>
        </div>

        {/* Filter tabs */}
        <div className="ha-tab-row">
          {["all","pending","confirmed","cancelled"].map((tab) => (
            <button
              key={tab}
              className={`ha-tab ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== "all" && (
                <span className="ha-tab-count">
                  {tab === "pending"   ? pendingCount   :
                   tab === "confirmed" ? confirmedCount :
                   cancelledCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mv-empty">
            <div className="mv-empty-icon">📅</div>
            <div className="mv-empty-text">
              {apptList.length === 0
                ? "No appointments yet"
                : `No ${filter} appointments`}
            </div>
            <div className="mv-empty-sub">
              {apptList.length === 0
                ? "Appointments booked by patients will appear here"
                : "Try switching to a different filter"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="ha-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date &amp; Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, idx) => {
                  const av = AV_COLORS[idx % AV_COLORS.length];
                  return (
                    <tr key={appt._id}>
                      <td>
                        <div className="ha-pt-info">
                          <div
                            className="ha-pt-av"
                            style={{ background: av.bg, color: av.color, borderColor: av.border }}
                          >
                            {getInitials(appt.patientName)}
                          </div>
                          <div>
                            <div className="ha-pt-name">{appt.patientName || "Patient"}</div>
                            <div className="ha-pt-age">Age {appt.age || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ha-date-main">{formatDate(appt.date)}</div>
                        <div className="ha-date-time">{formatTime(appt.time)}</div>
                      </td>
                      <td>
                        <div className="ha-reason">{appt.reason || "—"}</div>
                      </td>
                      <td>
                        <span className={`ha-badge ha-badge-${appt.status}`}>
                          {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="ha-action-btns">
                          {appt.status === "pending" && (
                            <button
                              className="ha-confirm-btn"
                              onClick={() => handleConfirm(appt._id)}
                            >
                              Confirm
                            </button>
                          )}
                          {appt.status !== "cancelled" && (
                            <button
                              className="ha-cancel-btn"
                              onClick={() => handleCancel(appt._id)}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            className="ha-view-btn"
                            onClick={() => setSelectedAppt(appt)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedAppt && (
        <AppointmentModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirming={confirming}
          cancelling={cancelling}
        />
      )}
    </div>
  );
}
