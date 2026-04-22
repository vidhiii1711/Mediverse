import { createContext, useContext, useState, useEffect } from "react";

// API base
const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //Fetch all dashboard data on mount 
  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [userRes, apptRes, medRes, docRes] = await Promise.all([
        fetch(`${API_BASE}/auth/me`, { headers }),
        fetch(`${API_BASE}/appointments`, { headers }),
        fetch(`${API_BASE}/medications`, { headers }),
        fetch(`${API_BASE}/documents`, { headers }),
      ]);

      if (!userRes.ok) throw new Error("Session expired. Please log in again.");

      const [userData, apptData, medData, docData] = await Promise.all([
        userRes.json(),
        apptRes.json(),
        medRes.json(),
        docRes.json(),
      ]);

      setUser(userData.user || userData);
      setAppointments(Array.isArray(apptData.appointments) ? apptData.appointments : Array.isArray(apptData) ? apptData : []);
      setMedications(Array.isArray(medData.medications) ? medData.medications : Array.isArray(medData) ? medData : []);
      setDocuments(Array.isArray(docData.documents) ? docData.documents : Array.isArray(docData) ? docData : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
      // Fallback to mock data for UI development
      setUser({ name: "Aryan Kapoor", email: "aryan@example.com" });
      setAppointments(MOCK_APPOINTMENTS);
      setMedications(MOCK_MEDICATIONS);
      setDocuments(MOCK_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  }

  //Appointments
  async function addAppointment(data) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to book appointment");
    setAppointments((prev) => [...prev, json.appointment || json]);
    return json;
  }

  async function cancelAppointment(id) {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/appointments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAppointments((prev) => prev.filter((a) => a._id !== id));
  }

  //Medications
  async function addMedication(data) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/medications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to add medication");
    setMedications((prev) => [...prev, json.medication || json]);
    return json;
  }

  // toggleMedication — toggles notificationEnabled field
  async function toggleMedication(id, notificationEnabled) {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/medications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notificationEnabled }),
    });
    setMedications((prev) =>
      prev.map((m) => (m._id === id ? { ...m, notificationEnabled } : m))
    );
  }

  async function markMedicationTaken(id) {
    const token = localStorage.getItem("token");
    const today = new Date().toISOString().split("T")[0];
    await fetch(`${API_BASE}/medications/${id}/taken`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date: today }),
    });
    // update both takenToday and takenDates locally so schedule updates instantly
    setMedications((prev) =>
      prev.map((m) =>
        m._id === id
          ? {
            ...m,
            takenToday: true,
            takenDates: Array.isArray(m.takenDates)
              ? [...new Set([...m.takenDates, today])]
              : [today],
          }
          : m
      )
    );
  }

  async function deleteMedication(id) {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/medications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMedications((prev) => prev.filter((m) => m._id !== id));
  }

  //Documents
  async function uploadDocument(formData) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Upload failed");
    const newDoc = json.document || json;
    setDocuments((prev) => [newDoc, ...prev]);
    return json;
  }

  async function deleteDocument(id) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || "Delete failed");
    }
    setDocuments((prev) => prev.filter((d) => d._id !== id));
  }

  //Derived stats
  const apptArray = Array.isArray(appointments) ? appointments : [];
  const medArray = Array.isArray(medications) ? medications : [];

  const upcomingAppointments = apptArray
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const todaysMedications = medArray.filter((m) => m.enabled !== false);

  const pendingMeds = todaysMedications.filter((m) => !m.takenToday);

  const adherencePercent =
    medArray.length === 0
      ? 0
      : Math.round(
        (medArray.filter((m) => m.takenToday).length / medArray.length) * 100
      );

  return (
    <DashboardContext.Provider
      value={{
        user,
        appointments,
        medications,
        documents,
        loading,
        error,
        // derived
        upcomingAppointments,
        todaysMedications,
        pendingMeds,
        adherencePercent,
        // actions
        addAppointment,
        cancelAppointment,
        addMedication,
        toggleMedication,
        markMedicationTaken,
        deleteMedication,
        uploadDocument,
        deleteDocument,
        refetch: fetchAll,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}

// ─── Mock data for local UI dev
const MOCK_APPOINTMENTS = [
  {
    _id: "a1",
    doctor: "Dr. Priya Sharma",
    specialization: "Cardiologist",
    hospital: "Apollo Hospital, Indore",
    date: new Date(Date.now() + 2 * 86400000).toISOString(),
    time: "10:30",
    status: "confirmed",
  },
  {
    _id: "a2",
    doctor: "Dr. Rahul Mehta",
    specialization: "Orthopedic Surgeon",
    hospital: "Bombay Hospital, Indore",
    date: new Date(Date.now() + 5 * 86400000).toISOString(),
    time: "14:00",
    status: "pending",
  },
  {
    _id: "a3",
    doctor: "Dr. Nisha Patel",
    specialization: "Dermatologist",
    hospital: "Medanta, Indore",
    date: new Date(Date.now() + 9 * 86400000).toISOString(),
    time: "09:00",
    status: "confirmed",
  },
];

const MOCK_MEDICATIONS = [
  { _id: "m1", name: "Metoprolol", dose: "50mg", frequency: "Twice daily", time: "8 AM & 8 PM", instructions: "with food", enabled: true, takenToday: true, color: "coral" },
  { _id: "m2", name: "Atorvastatin", dose: "40mg", frequency: "Once daily", time: "8 PM", instructions: "after dinner", enabled: true, takenToday: false, color: "blue" },
  { _id: "m3", name: "Vitamin D3", dose: "1000 IU", frequency: "Once daily", time: "2 PM", instructions: "after lunch", enabled: true, takenToday: false, color: "teal" },
  { _id: "m4", name: "Metformin", dose: "500mg", frequency: "Twice daily", time: "7 AM & 7 PM", instructions: "before meals", enabled: true, takenToday: true, color: "purple" },
];

const MOCK_DOCUMENTS = [
  { _id: "d1", name: "Blood_Report_Mar.pdf", size: "248 KB", type: "report", uploadedAt: "2025-03-10", url: "#" },
  { _id: "d2", name: "ECG_Result.pdf", size: "1.2 MB", type: "scan", uploadedAt: "2025-03-05", url: "#" },
  { _id: "d3", name: "Prescription_Sharma.pdf", size: "92 KB", type: "prescription", uploadedAt: "2025-02-28", url: "#" },
  { _id: "d4", name: "MRI_Scan_Feb.pdf", size: "4.8 MB", type: "scan", uploadedAt: "2025-02-20", url: "#" },
];
