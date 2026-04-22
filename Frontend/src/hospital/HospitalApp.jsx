import { Routes, Route, Navigate } from "react-router-dom";
import { HospitalProvider } from "./context/HospitalContext";
import HospitalLayout from "./components/HospitalLayout";
import HospitalLogin from "./pages/HospitalLogin";
import HospitalOverview from "./pages/HospitalOverview";
import HospitalAppointments from "./pages/HospitalAppointments";
import HospitalProfile from "./pages/HospitalProfile";

function RequireHospitalAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== "hospital") return <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HospitalDashboardContent() {
  return (
    <HospitalLayout>
      <Routes>
        <Route index                element={<HospitalOverview />} />
        <Route path="appointments"  element={<HospitalAppointments />} />
        <Route path="profile" element={<HospitalProfile />} />
        {/* patients and profile pages will be added here */}
        <Route path="*" element={<Navigate to="/hospital/dashboard" replace />} />
      </Routes>
    </HospitalLayout>
  );
}

function HospitalDashboardRoutes() {
  return (
    <HospitalProvider>
      <HospitalDashboardContent />
    </HospitalProvider>
  );
}

export default function HospitalApp() {
  return (
    <Routes>
      <Route path="login"    element={<HospitalLogin />} />
      <Route path="register" element={<HospitalLogin />} />
      <Route
        path="dashboard/*"
        element={
          <RequireHospitalAuth>
            <HospitalDashboardRoutes />
          </RequireHospitalAuth>
        }
      />
      <Route path="*" element={<Navigate to="/hospital/dashboard" replace />} />
    </Routes>
  );
}
