// This handles both Patient & Hospital login and redirects correctly.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
const [loading, setLoading] = useState(false);
import '../App.css'
import logo from "../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("patient"); // patient | hospital
  const navigate = useNavigate();
  const isPatient = mode === "patient";
  const isHospital = mode === "hospital";

  const handleLogin = async () => {
     setLoading(true); 
    console.log("MODE BEFORE API CALL =", mode);

    const endpoint =
      mode === "patient"
        ? "/api/auth/patient/login"
        : "/api/auth/hospital/login";
    try {
      const res = await fetch(`https://mediverse-0gys.onrender.com${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ Redirect based on role
      console.log("Sign in clicked, mode =", mode);
      if (mode === "patient") {
        localStorage.setItem("token", data.token)
        localStorage.setItem("patient", JSON.stringify(data.patient))
        navigate("/dashboard")
      } else {
        localStorage.setItem("token", data.token)
        localStorage.setItem("hospital", JSON.stringify(data.hospital))
        navigate("/hospital/dashboard")
      }
    } catch (err) {
      console.error(err);
      alert("Backend not reachable");
    }finally {
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
          {mode !== "signup" && (
            <div className="toggle">
              <button
                className={isPatient ? "active" : ""}
                onClick={() => setMode("patient")}
              >
                Patient Login
              </button>
              <button
                className={isHospital ? "active" : ""}
                onClick={() => setMode("hospital")}
              >
                Hospital Login
              </button>
            </div>
          )}

          <h2>{mode === "patient" ? "Patient Portal" : "Hospital Portal"}</h2>

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="button" className="primary" onClick={handleLogin} disabled={loading}>
  {loading ? "Connecting... (first load may take 30s)" : "Sign In"}
          </button>

         <p className="bottom" onClick={() => navigate(`/register?mode=${mode}`)}>
            Don’t have an account? <span>Sign up now</span>
          </p>
        </div>
      </div>
    </div>
  );
}
