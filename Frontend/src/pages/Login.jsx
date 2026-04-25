import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../App.css'
import logo from "../assets/logo.png";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("patient");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "patient"
        ? `${API_BASE}/auth/patient/login`
        : `${API_BASE}/auth/hospital/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      if (mode === "patient") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("patient", JSON.stringify(data.patient));
        navigate("/dashboard");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("hospital", JSON.stringify(data.hospital));
        navigate("/hospital/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Server not reachable. Please wait 30 seconds and try again — server may be waking up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        {/* LEFT PANEL */}
        <div className="left">
          <div className="brand">
            <div className="logo">
              <img src={logo} alt="Mediverse Logo" />
            </div>
            <h1>MEDIVERSE</h1>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">
            Your trusted healthcare companion. Access your medical records,
            appointments, and health insights all in one place.
          </p>

          <ul className="features">
            <li>Secure & Private<br /><span>Your health data is encrypted and protected</span></li>
            <li>24/7 Access<br /><span>Manage your health anytime, anywhere</span></li>
            <li>Expert Care<br /><span>Connected to leading healthcare professionals</span></li>
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="right">
          <div className="toggle">
            <button
              type="button"
              className={mode === "patient" ? "active" : ""}
              onClick={() => setMode("patient")}
            >
              Patient Login
            </button>
            <button
              type="button"
              className={mode === "hospital" ? "active" : ""}
              onClick={() => setMode("hospital")}
            >
              Hospital Login
            </button>
          </div>

          <h2>{mode === "patient" ? "Patient Portal" : "Hospital Portal"}</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Connecting... (first load may take some time)" : "Sign In"}
          </button>

          {/* Pass current mode to register page so toggle auto-selects */}
          <p className="bottom" onClick={() => navigate(`/register?mode=${mode}`)}>
            Don't have an account? <span>Sign up now</span>
          </p>
        </div>
      </div>
    </div>
  );
}
