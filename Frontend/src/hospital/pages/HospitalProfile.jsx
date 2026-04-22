import { useState } from "react";
import { useHospital } from "../context/HospitalContext";
import "./HospitalProfile.css";

const COMMON_SPECS = [
  "Cardiology","Orthopedics","Dermatology","Neurology","Pediatrics",
  "Gynecology","Ophthalmology","ENT","Oncology","Psychiatry",
  "Urology","General Surgery","Radiology","Endocrinology","Nephrology",
];

export default function HospitalProfile() {
  const { hospital, updateProfile, changePassword } = useHospital();

  const [activeTab, setActiveTab]   = useState("profile");
  const [editMode, setEditMode]     = useState(false);
  const [draft, setDraft]           = useState(null);
  const [specInput, setSpecInput]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState(null); // { type: "success"|"error", text }

  // Password state
  const [pwForm, setPwForm]         = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwMsg, setPwMsg]           = useState(null);

  function startEdit() {
    setDraft({
      name:            hospital?.name            || "",
      area:            hospital?.area            || "",
      phone:           hospital?.phone           || "",
      address:         hospital?.address         || "",
      about:           hospital?.about           || "",
      website:         hospital?.website         || "",
      specializations: [...(hospital?.specializations || [])],
    });
    setEditMode(true);
    setSaveMsg(null);
  }

  function cancelEdit() {
    setDraft(null);
    setEditMode(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateProfile(draft);
      setEditMode(false);
      setDraft(null);
      setSaveMsg({ type: "success", text: "Profile saved successfully! Patients will see updated info." });
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function toggleSpec(spec) {
    setDraft((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  }

  function addCustomSpec() {
    const s = specInput.trim();
    if (s && !draft.specializations.includes(s)) {
      setDraft((prev) => ({ ...prev, specializations: [...prev.specializations, s] }));
    }
    setSpecInput("");
  }

  function removeSpec(spec) {
    setDraft((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== spec),
    }));
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setTimeout(() => setPwMsg(null), 4000);
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwSaving(false);
    }
  }

  const data = editMode ? draft : hospital;
  const specs = data?.specializations || [];

  if (!hospital) {
    return (
      <div className="hp-loading">
        <div className="hp-spinner" />
        <span>Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="hp-root">

      {/* ── Page Header ── */}
      <div className="hp-header">
        <div>
          <div className="hp-title">Hospital Profile</div>
          <div className="hp-subtitle">Manage your hospital's information visible to patients</div>
        </div>
        <div className="hp-header-actions">
          {saveMsg && (
            <div className={`hp-banner hp-banner-${saveMsg.type}`}>
              {saveMsg.type === "success" ? "✅" : "⚠️"} {saveMsg.text}
            </div>
          )}
          {!editMode ? (
            <button className="hp-btn-primary" onClick={startEdit}>✏️ Edit Profile</button>
          ) : (
            <>
              <button className="hp-btn-ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button className="hp-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="hp-tabs">
        {[
          { id: "profile",         label: "Basic Info" },
          { id: "specializations", label: "Specializations" },
          { id: "security",        label: "Account" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`hp-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: Basic Info ══ */}
      {activeTab === "profile" && (
        <div className="hp-grid">

          {/* Profile card */}
          <div className="hp-profile-card mv-card">
            <div className="hp-avatar">🏥</div>
            <div className="hp-profile-info">
              <div className="hp-hospital-name">{hospital.name}</div>
              <div className="hp-hospital-area">{hospital.area || "Area not set"}</div>
              <div className="hp-spec-chips">
                {(hospital.specializations || []).slice(0, 4).map((s) => (
                  <span key={s} className="hp-chip">{s}</span>
                ))}
                {(hospital.specializations || []).length > 4 && (
                  <span className="hp-chip hp-chip-amber">
                    +{(hospital.specializations || []).length - 4} more
                  </span>
                )}
                {(hospital.specializations || []).length === 0 && (
                  <span className="hp-chip hp-chip-muted">No specializations added</span>
                )}
              </div>
            </div>
            <div className="hp-spec-count">
              <div className="hp-spec-num">{(hospital.specializations || []).length}</div>
              <div className="hp-spec-lbl">Specializations</div>
            </div>
          </div>

          {/* Fields */}
          {[
            { label: "Hospital Name",  key: "name",    placeholder: "e.g. Apollo Hospitals",   full: false },
            { label: "Email Address",  key: "email",   placeholder: "hospital@example.com",    full: false, readonly: true },
            { label: "Phone Number",   key: "phone",   placeholder: "+91 XXXXX XXXXX",         full: false },
            { label: "Area / City",    key: "area",    placeholder: "e.g. Indore, MP",         full: false },
            { label: "Full Address",   key: "address", placeholder: "Street, Area, City",      full: true  },
            { label: "Website",        key: "website", placeholder: "www.yourhospital.com",    full: false },
          ].map((field) => (
            <div key={field.key} className={`hp-field-card mv-card ${field.full ? "hp-full" : ""}`}>
              <label className="hp-field-label">{field.label}</label>
              {editMode && !field.readonly ? (
                <input
                  className="hp-input"
                  value={draft[field.key] || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              ) : (
                <div className="hp-field-value">
                  {(editMode ? draft[field.key] : hospital[field.key]) ||
                    <span className="hp-field-empty">Not set</span>}
                </div>
              )}
            </div>
          ))}

          {/* About */}
          <div className="hp-field-card mv-card hp-full">
            <label className="hp-field-label">About Hospital</label>
            {editMode ? (
              <textarea
                className="hp-input hp-textarea"
                value={draft.about}
                onChange={(e) => setDraft((p) => ({ ...p, about: e.target.value }))}
                placeholder="Brief description about your hospital, facilities, and services..."
                rows={3}
              />
            ) : (
              <div className="hp-field-value" style={{ lineHeight: 1.6 }}>
                {hospital.about || <span className="hp-field-empty">No description added</span>}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══ TAB: Specializations ══ */}
      {activeTab === "specializations" && (
        <div className="hp-specs-wrap">

          <div className="hp-info-banner">
            ℹ️ Specializations you add here appear automatically in every patient's hospital search.
            Patients can select your hospital when booking appointments for these departments.
          </div>

          {/* Current chips */}
          <div className="mv-card">
            <div className="hp-section-title">
              Your Specializations
              <span className="hp-count-badge">{specs.length}</span>
            </div>
            {specs.length === 0 ? (
              <div className="hp-empty-specs">No specializations added yet. Add them below.</div>
            ) : (
              <div className="hp-chips-row">
                {specs.map((s) => (
                  <div key={s} className="hp-chip hp-chip-active">
                    {s}
                    {editMode && (
                      <span className="hp-chip-remove" onClick={() => removeSpec(s)}>×</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {editMode && (
            <>
              {/* Quick add */}
              <div className="mv-card">
                <div className="hp-section-title">Quick Add</div>
                <div className="hp-section-sub">Click to toggle — teal = selected</div>
                <div className="hp-chips-row" style={{ marginTop: 12 }}>
                  {COMMON_SPECS.map((s) => {
                    const selected = draft.specializations.includes(s);
                    return (
                      <div
                        key={s}
                        className={`hp-chip hp-chip-toggle ${selected ? "hp-chip-selected" : ""}`}
                        onClick={() => toggleSpec(s)}
                      >
                        {selected ? "✓ " : ""}{s}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom input */}
              <div className="mv-card">
                <div className="hp-section-title">Add Custom Specialization</div>
                <div className="hp-custom-row">
                  <input
                    className="hp-input"
                    placeholder="e.g. Sports Medicine, Pain Management…"
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomSpec()}
                  />
                  <button className="hp-btn-primary" onClick={addCustomSpec}>Add</button>
                </div>
              </div>
            </>
          )}

          {!editMode && (
            <button className="hp-btn-primary" style={{ alignSelf: "flex-start" }} onClick={startEdit}>
              ✏️ Edit Specializations
            </button>
          )}
        </div>
      )}

      {/* ══ TAB: Account / Security ══ */}
      {activeTab === "security" && (
        <div className="hp-security-wrap">

          {/* Account info */}
          <div className="mv-card">
            <div className="hp-section-title">Account Information</div>
            <div className="hp-account-row">
              <div>
                <div className="hp-field-label">Registered Email</div>
                <div className="hp-field-value" style={{ marginTop: 4 }}>{hospital.email}</div>
              </div>
              <div>
                <div className="hp-field-label">Account Type</div>
                <span className="hp-chip" style={{ marginTop: 4, display: "inline-block" }}>Hospital</span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="mv-card">
            <div className="hp-section-title">Change Password</div>
            <div className="hp-section-sub" style={{ marginBottom: 16 }}>Update your hospital account password</div>
            {pwMsg && (
              <div className={`hp-banner hp-banner-${pwMsg.type}`} style={{ marginBottom: 14 }}>
                {pwMsg.type === "success" ? "✅" : "⚠️"} {pwMsg.text}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="hp-pw-form">
              {[
                { label: "Current Password", key: "current" },
                { label: "New Password",     key: "next"    },
                { label: "Confirm Password", key: "confirm" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="hp-field-label">{f.label}</label>
                  <input
                    type="password"
                    className="hp-input"
                    placeholder="••••••••"
                    value={pwForm[f.key]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <button type="submit" className="hp-btn-primary" disabled={pwSaving}>
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
