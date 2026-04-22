import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

export default function HospitalLogin() {
  const navigate  = useNavigate();
  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);

    try {
      const endpoint = mode === "login"
        ? `${API_BASE}/auth/hospital/login`
        : `${API_BASE}/auth/hospital/register`;

      const body = mode === "login"
        ? { email, password }
        : { name, email, password };

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      if (mode === "register") {
        // After register → switch to login
        setSuccess("Hospital registered successfully! Please login.");
        setMode("login");
        setName(""); setEmail(""); setPassword("");
      } else {
        // After login → go to dashboard
        localStorage.setItem("token", data.token);
        navigate("/hospital/dashboard");
      }
    } catch {
      setError("Server not reachable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    padding:"10px 14px", border:"0.5px solid rgba(0,0,0,0.12)",
    borderRadius:8, fontSize:14, fontFamily:"inherit",
    outline:"none", color:"#085041", width:"100%"
  };
  const labelStyle = { fontSize:12, color:"#0F6E56", fontWeight:500 };

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"#F7F8FA",
      fontFamily:"'DM Sans', sans-serif"
    }}>
      <div style={{
        background:"#fff", borderRadius:16, padding:"40px 32px",
        width:400, boxShadow:"0 4px 24px rgba(0,0,0,0.08)"
      }}>

        {/* Logo */}
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, marginBottom:4, color:"#1a1a1a" }}>
          Medi<span style={{ color:"#1D9E75", fontStyle:"italic" }}>verse</span>
        </div>
        <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>Hospital Portal</div>

        {/* Toggle */}
        <div style={{
          display:"flex", background:"#F7F8FA", borderRadius:8,
          padding:3, marginBottom:24, gap:3
        }}>
          {["login","register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              style={{
                flex:1, padding:"8px", borderRadius:6, border:"none",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#085041" : "#6b7280",
                fontWeight: mode === m ? 500 : 400,
                fontSize:13, cursor:"pointer", fontFamily:"inherit",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition:"all 0.15s"
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ fontSize:17, fontWeight:500, color:"#085041", marginBottom:20 }}>
          {mode === "login" ? "Sign in to your account" : "Register your hospital"}
        </div>

        {/* Banners */}
        {error && (
          <div style={{ background:"#FAECE7", border:"0.5px solid #D85A30", color:"#D85A30", borderRadius:8, padding:"9px 12px", fontSize:12, marginBottom:14 }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ background:"#EAF3DE", border:"0.5px solid #3B6D11", color:"#3B6D11", borderRadius:8, padding:"9px 12px", fontSize:12, marginBottom:14 }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Name — only on register */}
          {mode === "register" && (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={labelStyle}>Hospital name</label>
              <input
                placeholder="e.g. Apollo Hospitals"
                value={name} onChange={(e) => setName(e.target.value)}
                required style={inputStyle}
              />
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" placeholder="hospital@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required style={inputStyle}
            />
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" placeholder="Enter password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required style={inputStyle}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              background:"#0F6E56", color:"#fff", border:"none",
              borderRadius:8, padding:"11px", fontSize:14,
              fontWeight:500, cursor:"pointer", fontFamily:"inherit",
              marginTop:4, opacity: loading ? 0.6 : 1,
              transition:"background 0.15s"
            }}
          >
            {loading
              ? (mode === "login" ? "Signing in…" : "Registering…")
              : (mode === "login" ? "Sign In" : "Register Hospital")
            }
          </button>
        </form>

        {/* Switch link */}
        <div style={{ marginTop:16, fontSize:13, color:"#6b7280", textAlign:"center" }}>
          {mode === "login" ? (
            <>New hospital?{" "}
              <span style={{ color:"#1D9E75", fontWeight:500, cursor:"pointer" }}
                onClick={() => setMode("register")}>
                Register here
              </span>
            </>
          ) : (
            <>Already registered?{" "}
              <span style={{ color:"#1D9E75", fontWeight:500, cursor:"pointer" }}
                onClick={() => setMode("login")}>
                Sign in
              </span>
            </>
          )}
        </div>

      </div>
    </div>
  );
}