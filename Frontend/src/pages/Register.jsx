import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import '../App.css'
import logo from "../assets/logo.png";

export default function Register() {
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(searchParams.get("mode") || "patient");
  const [mode, setMode] = useState();


  useEffect(() => {
    console.log("Mode CHANGED:", mode);
  }, [mode]);


  const handleRegister = async () => {
     setLoading(true);
    try {
      const endpoint =
        mode === "patient"
          ? "/api/auth/patient/register"
          : "/api/auth/hospital/register";
      const res = await fetch(`https://mediverse-0gys.onrender.com${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }
      // ✅ Registration successful — go to login
      alert("Account created! Please log in.")
      navigate("/")
    }
    catch (err) {
      console.error(err);
      alert("Server error");
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
           <div className="toggle" key={mode}>
          <div className="toggle">
            <button
              className={mode === "patient" ? "active" : ""}
              onClick={() => setMode("patient")}
               type="button"
            >
              Patient Login
            </button>
            <button
              className={mode === "hospital" ? "active" : ""}
              onClick={() => setMode("hospital")}
               type="button"
            >
              Hospital Login
            </button>
          </div>
           </div>

          <input type="text" name="name" placeholder="Name" value={name}
            onChange={(e) => setName(e.target.value)} />
          <input type="email" name="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <input type="password" name="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} />

          <button className="primary" onClick={handleRegister} disabled={loading}>
  {loading ? "Please wait... (server waking up)" : "Sign Up"}</button>

          <p className="bottom" onClick={() => navigate("/")}>
            Already have an account? <span>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
