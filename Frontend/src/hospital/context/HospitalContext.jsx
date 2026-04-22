import { createContext, useContext, useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";
const HospitalContext = createContext(null);

export function HospitalProvider({ children }) {
  const [hospital, setHospital]       = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => { fetchAll(); }, []);

  // ── Safe JSON parser — won't crash on HTML error pages ──────────────────────
  async function safeJson(res) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return {}; }
  }

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch profile and appointments in parallel
      const [profileRes, apptRes] = await Promise.all([
        fetch(`${API_BASE}/hospital/profile`, { headers }),
        fetch(`${API_BASE}/hospital/appointments`, { headers }),
      ]);

      if (!profileRes.ok) throw new Error("Session expired. Please log in again.");

      const [profileData, apptData] = await Promise.all([
        safeJson(profileRes),
        safeJson(apptRes),
      ]);

      setHospital(profileData.hospital || null);
      setAppointments(
        Array.isArray(apptData.appointments) ? apptData.appointments : []
      );
    } catch (err) {
      console.error("Hospital dashboard fetch error:", err);
      setError(err.message);
      setHospital(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Update profile (name, area, phone, address, about, website, specializations)
  async function updateProfile(updates) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/hospital/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json.message || "Failed to update profile");
    setHospital(json.hospital);
    return json;
  }

  // ── Change password
  async function changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/hospital/profile/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json.message || "Password change failed");
    return json;
  }

  // ── Confirm appointment
  async function confirmAppointment(id) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/hospital/appointments/${id}/confirm`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json.message || "Failed to confirm");
    setAppointments((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: "confirmed" } : a))
    );
    return json;
  }

  // ── Cancel appointment
  async function cancelAppointment(id) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/hospital/appointments/${id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json.message || "Failed to cancel");
    setAppointments((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a))
    );
    return json;
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const apptList     = Array.isArray(appointments) ? appointments : [];
  const today        = new Date().toISOString().split("T")[0];
  const todaysAppts  = apptList.filter((a) => a.date?.slice(0, 10) === today);
  const pendingAppts = apptList.filter((a) => a.status === "pending");
  const confirmedAppts = apptList.filter((a) => a.status === "confirmed");
  const totalPatients  = new Set(apptList.map((a) => String(a.patient))).size;

  return (
    <HospitalContext.Provider value={{
      hospital,
      appointments: apptList,
      loading,
      error,
      // derived
      todaysAppts,
      pendingAppts,
      confirmedAppts,
      totalPatients,
      // actions
      updateProfile,
      changePassword,
      confirmAppointment,
      cancelAppointment,
      refetch: fetchAll,
    }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
}
