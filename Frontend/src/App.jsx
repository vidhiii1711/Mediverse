import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Overview from "./pages/Overview"
import DashboardLayout from "./components/DashboardLayout"
import { DashboardProvider, useDashboard } from "./context/DashboardContext"
import Appointments from "./pages/Appointments"
import Medications from "./pages/Medications"
import Documents from "./pages/Documents"
import AIAssistant from "./pages/AIAssistant"
import Notifications from "./pages/Notifications"
import HospitalApp from "./hospital/HospitalApp"

function DashboardRoutes() {
  const { user } = useDashboard()
  return (
    <DashboardLayout user={user}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="medications" element={<Medications />} />
        <Route path="documents" element={<Documents />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="notifications" element={<Notifications />} />
      </Routes>
    </DashboardLayout>
  )
}

function DashboardWrapper() {
  return (
    <DashboardProvider>
      <DashboardRoutes />
    </DashboardProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Patient public pages */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient dashboard */}
        <Route path="/dashboard/*" element={<DashboardWrapper />} />

        {/* Hospital section — must be at root level, NOT inside DashboardRoutes */}
        <Route path="/hospital/*" element={<HospitalApp />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App