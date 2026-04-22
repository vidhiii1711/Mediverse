import { useState, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";
import "./Appointments.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

function formatDay(iso) { return new Date(iso).getDate(); }
function formatMon(iso) { return new Date(iso).toLocaleDateString("en-IN", { month: "short" }); }

export default function Appointments() {
  useEffect(() => {
    console.log("Appointments mounted");
  }, []);
  const { upcomingAppointments, addAppointment, cancelAppointment, refetch } = useDashboard();

  const [hospList, setHospList] = useState([]);
  const [hospLoading, setHospLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHosp, setSelectedHosp] = useState(null);
  const [form, setForm] = useState({ patientName: "", age: "", date: "", specialization: "", doctor: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { fetchHospitals(); }, []);

  async function fetchHospitals() {
    setHospLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHospList(Array.isArray(data.hospitals) ? data.hospitals : Array.isArray(data) ? data : MOCK_HOSPITALS);
    } catch {
      setHospList(MOCK_HOSPITALS);
    } finally {
      setHospLoading(false);
    }
  }

  const apptList = Array.isArray(upcomingAppointments) ? upcomingAppointments : [];

  const filteredHosp = hospList.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.name?.toLowerCase().includes(q) ||
      h.specializations?.some((s) => s.toLowerCase().includes(q)) ||
      h.area?.toLowerCase().includes(q)
    );
  });

  const availableSpecs = selectedHosp?.specializations || [];
  const availableDoctors = selectedHosp && form.specialization
    ? (selectedHosp.doctors || []).filter((d) => d.specialization === form.specialization)
    : [];

  function handleSelectHosp(hosp) {
    setSelectedHosp(hosp);
    setForm((f) => ({ ...f, specialization: "", doctor: "" }));
    setErrorMsg("");
  }

  function handleChange(field, value) {
    setForm((f) => {
      const u = { ...f, [field]: value };
      if (field === "specialization") u.doctor = "";
      return u;
    });
  }

  async function handleBook(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!selectedHosp) return setErrorMsg("Please select a hospital first.");
    if (!form.patientName.trim()) return setErrorMsg("Please enter patient name.");
    if (!form.age) return setErrorMsg("Please enter patient age.");
    if (!form.date) return setErrorMsg("Please select a date.");
    if (!form.specialization) return setErrorMsg("Please select a specialization.");
    if (!form.reason.trim()) return setErrorMsg("Please enter reason for appointment.");

    setSubmitting(true);
    try {
      await addAppointment({
        hospitalId: selectedHosp._id,
        hospital: selectedHosp.name,
        doctor: form.doctor || "To be assigned",
        specialization: form.specialization,
        date: form.date,
        patientName: form.patientName,
        age: Number(form.age),
        reason: form.reason,
        status: "pending",
      });
      setSuccessMsg("Appointment booked successfully!");
      setForm({ patientName: "", age: "", date: "", specialization: "", doctor: "", reason: "" });
      setSelectedHosp(null);
      refetch();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to book appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm("Cancel this appointment?")) return;
    try { await cancelAppointment(id); refetch(); }
    catch (err) { alert("Failed to cancel: " + err.message); }
  }

  const upcomingCount = apptList.filter((a) => a.status !== "cancelled").length;
  const pendingCount = apptList.filter((a) => a.status === "pending").length;

  function getInitials(name) {
    return (name || "H").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 3);
  }
  const LOGO_COLORS = [
    { bg: "var(--blue-l)", color: "var(--blue)" },
    { bg: "var(--coral-l)", color: "var(--coral)" },
    { bg: "var(--purple-l)", color: "var(--purple)" },
    { bg: "var(--amber-l)", color: "var(--amber)" },
    { bg: "var(--teal-l)", color: "var(--teal-d)" },
  ];

  return (
    <div className="ap-root">

      <div className="ap-section-label mv-section-label">Appointments</div>

      {/* Stats */}
      <div className="ap-stat-row">
        <div className="ap-stat-card">
          <div className="ap-stat-val" style={{ color: "var(--teal)" }}>{upcomingCount}</div>
          <div className="ap-stat-lbl">Upcoming</div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-val" style={{ color: "var(--amber)" }}>{pendingCount}</div>
          <div className="ap-stat-lbl">Pending confirmation</div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-val" style={{ color: "var(--muted)" }}>{apptList.length}</div>
          <div className="ap-stat-lbl">Total booked</div>
        </div>
      </div>

      {successMsg && <div className="ap-success-banner">✅ {successMsg}</div>}

      <div className="ap-grid">

        {/* LEFT: Hospital search */}
        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">Find a hospital or doctor</span>
          </div>

          <div className="ap-search-wrap">
            <svg className="ap-search-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="ap-search-input"
              placeholder="Search hospital, doctor, specialization…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {hospLoading ? (
            <div className="ap-hosp-loading">
              <div className="ap-spinner" /><span>Loading hospitals…</span>
            </div>
          ) : filteredHosp.length === 0 ? (
            <div className="mv-empty">
              <div className="mv-empty-icon">🏥</div>
              <div className="mv-empty-text">
                {searchQuery ? `No results for "${searchQuery}"` : "No hospitals registered yet"}
              </div>
            </div>
          ) : (
            <div className="ap-hosp-list">
              {filteredHosp.map((h, idx) => {
                const lc = LOGO_COLORS[idx % LOGO_COLORS.length];
                const isSel = selectedHosp?._id === h._id;
                return (
                  <div key={h._id} className={`ap-hosp-item ${isSel ? "sel" : ""}`}>
                    <div className="ap-hosp-logo" style={{ background: lc.bg, color: lc.color }}>
                      {getInitials(h.name)}
                    </div>
                    <div className="ap-hosp-info">
                      <div className="ap-hosp-name">{h.name}</div>
                      <div className="ap-hosp-sub">
                        {(h.specializations || []).slice(0, 3).join(" · ")}
                        {h.area ? ` · ${h.area}` : ""}
                      </div>
                      {h.rating && (
                        <div className="ap-stars">
                          {"★".repeat(Math.round(h.rating))}{"☆".repeat(5 - Math.round(h.rating))}
                          <span> {h.rating}</span>
                        </div>
                      )}
                    </div>
                    <button className={`ap-sel-btn ${isSel ? "active" : ""}`} onClick={() => handleSelectHosp(h)}>
                      {isSel ? "Selected ✓" : "Select →"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Booking form */}
        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">Book appointment</span>
          </div>

          {selectedHosp ? (
            <div className="ap-selected-banner">
              <div>
                <div className="ap-selected-name">{selectedHosp.name}</div>
                <div className="ap-selected-area">{selectedHosp.area || "Registered hospital"}</div>
              </div>
              <button className="ap-clear-btn" onClick={() => { setSelectedHosp(null); setForm((f) => ({ ...f, specialization: "", doctor: "" })); }}>
                ✕ Change
              </button>
            </div>
          ) : (
            <div className="ap-no-hosp-banner">
              ← Select a hospital from the list to continue
            </div>
          )}

          {errorMsg && <div className="ap-error-banner">⚠ {errorMsg}</div>}

          <form className="ap-form" onSubmit={handleBook}>
            <div className="ap-field">
              <label>Your name</label>
              <input placeholder="Enter patient name" value={form.patientName}
                onChange={(e) => handleChange("patientName", e.target.value)} />
            </div>

            <div className="ap-field-row">
              <div className="ap-field">
                <label>Patient age</label>
                <input type="number" placeholder="e.g. 28" min="1" max="120"
                  value={form.age} onChange={(e) => handleChange("age", e.target.value)} />
              </div>
              <div className="ap-field">
                <label>Date</label>
                <input type="date" min={new Date().toISOString().split("T")[0]}
                  value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              </div>
            </div>

            <div className="ap-field">
              <label>Specialization</label>
              {availableSpecs.length > 0 ? (
                <select
                  value={form.specialization}
                  onChange={(e) => handleChange("specialization", e.target.value)}
                  disabled={!selectedHosp}
                >
                  <option value="">{selectedHosp ? "Select specialization" : "Select a hospital first"}</option>
                  {availableSpecs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  placeholder={selectedHosp ? "e.g. Cardiology, Orthopedics…" : "Select a hospital first"}
                  value={form.specialization}
                  disabled={!selectedHosp}
                  onChange={(e) => handleChange("specialization", e.target.value)}
                />
              )}
            </div>
            <div className="ap-field">
              <label>Doctor name (optional)</label>
              <input
                placeholder={form.specialization ? "e.g. Dr. Sharma (optional)" : "Enter specialization first"}
                value={form.doctor}
                disabled={!form.specialization}
                onChange={(e) => handleChange("doctor", e.target.value)}
              />
            </div>

            <div className="ap-field">
              <label>Reason / symptoms</label>
              <textarea rows="2" placeholder="e.g. Chest pain, routine checkup…"
                value={form.reason} onChange={(e) => handleChange("reason", e.target.value)} />
            </div>

            <button className="ap-btn-primary" type="submit" disabled={submitting || !selectedHosp}>
              {submitting ? "Booking…" : "Confirm Appointment"}
            </button>
          </form>
        </div>
      </div>

      {/* Appointments list */}
      <div className="mv-card">
        <div className="mv-card-hd">
          <span className="mv-card-title">Your appointments</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {upcomingCount > 0 && <span className="mv-badge mv-badge-teal">{upcomingCount} upcoming</span>}
            {pendingCount > 0 && <span className="mv-badge mv-badge-amber">{pendingCount} pending</span>}
          </div>
        </div>

        {apptList.length === 0 ? (
          <div className="mv-empty">
            <div className="mv-empty-icon">📅</div>
            <div className="mv-empty-text">No appointments booked yet</div>
            <div className="mv-empty-text" style={{ fontSize: 11 }}>Select a hospital above and book your first appointment</div>
          </div>
        ) : (
          apptList.map((appt) => (
            <div key={appt._id} className="ap-appt-item">
              <div className="ap-date-col">
                <div className="ap-day">{formatDay(appt.date)}</div>
                <div className="ap-mon">{formatMon(appt.date)}</div>
              </div>
              <div className={`ap-vline ${appt.status === "confirmed" ? "ap-vline-confirmed" : appt.status === "cancelled" ? "ap-vline-cancelled" : "ap-vline-pending"}`} />
              <div className="ap-appt-body">
                <div className="ap-appt-hosp">
                  {appt.doctor && appt.doctor !== "To be assigned" ? `${appt.doctor} — ` : ""}{appt.hospital}
                </div>
                <div className="ap-appt-meta">
                  {appt.specialization} · {appt.patientName} · Age {appt.age}
                </div>
                {appt.reason && <div className="ap-appt-reason">Reason: {appt.reason}</div>}
              </div>
              <div className="ap-appt-actions">
                <span className={`mv-badge ${appt.status === "confirmed" ? "mv-badge-teal" :
                  appt.status === "cancelled" ? "mv-badge-coral" : "mv-badge-amber"
                  }`}>
                  {appt.status ? appt.status.charAt(0).toUpperCase() + appt.status.slice(1) : "Pending"}
                </span>
                {appt.status !== "cancelled" && (
                  <button className="ap-cancel-btn" onClick={() => handleCancel(appt._id)}>Cancel</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const MOCK_HOSPITALS = [
  {
    _id: "h1", name: "Apollo Hospitals", area: "Vijay Nagar, Indore", rating: 4.9,
    specializations: ["Cardiology", "Orthopedics", "General Medicine", "Dermatology"],
    doctors: [
      { name: "Dr. Priya Sharma", specialization: "Cardiology", experience: 12 },
      { name: "Dr. Anil Gupta", specialization: "Cardiology", experience: 8 },
      { name: "Dr. Rahul Mehta", specialization: "Orthopedics", experience: 15 },
      { name: "Dr. Nisha Patel", specialization: "Dermatology", experience: 10 },
      { name: "Dr. Suresh Joshi", specialization: "General Medicine", experience: 20 },
    ],
  },
  {
    _id: "h2", name: "Bombay Hospital", area: "South Tukoganj, Indore", rating: 4.6,
    specializations: ["Orthopedics", "General Medicine"],
    doctors: [{ name: "Dr. Kavita Singh", specialization: "General Medicine", experience: 6 }],
  },
  {
    _id: "h3", name: "Medanta Indore", area: "AB Road, Indore", rating: 4.8,
    specializations: ["Cardiology", "Neurology", "Dermatology"],
    doctors: [
      { name: "Dr. Arjun Das", specialization: "Neurology", experience: 18 },
      { name: "Dr. Meera Shah", specialization: "Cardiology", experience: 14 },
    ],
  },
  {
    _id: "h4", name: "CHL Hospital", area: "LIG Square, Indore", rating: 4.4,
    specializations: ["General Medicine", "Dermatology"],
    doctors: [{ name: "Dr. Ravi Verma", specialization: "Dermatology", experience: 9 }],
  },
];
