import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import '../App.css'
import logo from "../assets/logo.png";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read mode from URL — ?mode=hospital sets hospital, default is patient
  const [mode, setMode] = useState(searchParams.get("mode") === "hospital" ? "hospital" : "patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "patient"
        ? `${API_BASE}/auth/patient/register`
        : `${API_BASE}/auth/hospital/register`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      // Registration successful — go to login
      alert("Account created! Please log in.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Server not reachable. Please try again.");
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

          <h2>Welcome!!</h2>
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
          <h2>Create Account</h2>
          <p className="hint">Join Mediverse for better healthcare access.</p>

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

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="primary"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Please wait... (server waking up)" : "Sign Up"}
          </button>

          <p className="bottom" onClick={() => navigate("/")}>
            Already have an account? <span>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
