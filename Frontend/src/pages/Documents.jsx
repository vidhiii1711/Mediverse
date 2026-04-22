import { useState, useRef } from "react";
import { useDashboard } from "../context/DashboardContext";
import "./Documents.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

// ─── Helpers
function getFileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (ext === "pdf")                        return { icon: "📄", bg: "var(--blue-light)" };
  if (["jpg", "jpeg", "png"].includes(ext)) return { icon: "🖼️", bg: "var(--purple-light)" };
  return { icon: "📄", bg: "var(--bg)" };
}

function formatSize(bytes) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.round(kb) + " KB";
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Empty state
function EmptyState() {
  return (
    <div className="doc-empty">
      <div className="doc-empty-icon">📂</div>
      <div className="doc-empty-text">No documents uploaded yet</div>
      <div className="doc-empty-sub">Upload your first document using the form on the left</div>
    </div>
  );
}

// ─── Main component
export default function Documents() {
  const { documents, uploadDocument, deleteDocument, refetch } = useDashboard();

  const docList = Array.isArray(documents) ? documents : [];

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile]   = useState(null);
  const [title, setTitle]                 = useState("");
  const [uploading, setUploading]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState("");
  const [successMsg, setSuccessMsg]       = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef                      = useRef();

  // ── Handle file selection ──────────────────────────────────────────────────
  function handleFileSelect(file) {
    setErrorMsg("");
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Only PDF, JPG, and PNG files are allowed.");
      return;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMsg("File is too large. Maximum size is 10 MB.");
      return;
    }
    setSelectedFile(file);
  }

  function handleInputChange(e) {
    handleFileSelect(e.target.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave() { setDragOver(false); }
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }

  function clearFile() {
    setSelectedFile(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Handle upload ──────────────────────────────────────────────────────────
  async function handleUpload(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedFile) return setErrorMsg("Please select a file first.");
    if (!title.trim()) return setErrorMsg("Please enter a document title.");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file",  selectedFile);
      formData.append("title", title.trim());
      formData.append("name",  selectedFile.name);
      formData.append("size",  formatSize(selectedFile.size));

      await uploadDocument(formData);
      setSuccessMsg(`"${title}" uploaded successfully!`);
      setTitle("");
      clearFile();
      refetch();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Handle delete ──────────────────────────────────────────────────────────
  async function handleDelete(doc) {
    if (!window.confirm(`Remove "${doc.title || doc.name}"?`)) return;
    try {
      await deleteDocument(doc._id);
      refetch();
    } catch (err) {
      alert("Failed to remove: " + err.message);
    }
  }

  // ── Handle view ───────────────────────────────────────────────────────────
  function handleView(doc) {
    if (doc.url) {
      window.open(doc.url, "_blank");
    } else {
      alert("Document URL not available.");
    }
  }

  // ── File preview info ──────────────────────────────────────────────────────
  const fileInfo = selectedFile ? getFileIcon(selectedFile.name) : null;

  return (
    <div className="doc-root">
      <div className="mv-section-label">Documents</div>

      {/* Stat */}
      <div className="doc-stat-card">
        <div className="doc-stat-val" style={{ color: "var(--teal)" }}>{docList.length}</div>
        <div className="doc-stat-lbl">Total documents</div>
      </div>

      {/* Banners */}
      {successMsg && <div className="doc-success-banner">✅ {successMsg}</div>}

      <div className="doc-grid">

        {/* ── LEFT: Upload form ── */}
        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">Upload document</span>
          </div>

          {errorMsg && <div className="doc-error-banner">⚠ {errorMsg}</div>}

          {/* Drop zone */}
          <div
            className={`doc-upload-zone ${dragOver ? "drag-over" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="doc-upload-icon">
              <svg width="22" height="22" fill="none" stroke="var(--teal-dark)" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="16,16 12,12 8,16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <div className="doc-upload-title">Drop your file here</div>
            <div className="doc-upload-sub">PDF, JPG, PNG up to 10 MB</div>
            <button
              type="button"
              className="doc-browse-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleInputChange}
            />
          </div>

          {/* File preview */}
          {selectedFile && (
            <div className="doc-file-preview">
              <div className="doc-file-icon" style={{ background: fileInfo.bg }}>
                {fileInfo.icon}
              </div>
              <div className="doc-file-info">
                <div className="doc-file-name">{selectedFile.name}</div>
                <div className="doc-file-size">{formatSize(selectedFile.size)}</div>
              </div>
              <button className="doc-remove-file-btn" onClick={clearFile}>
                ✕ Remove
              </button>
            </div>
          )}

          {/* Form */}
          <form className="doc-form" onSubmit={handleUpload}>
            <div className="doc-field">
              <label>Document title</label>
              <input
                placeholder="e.g. Blood test report March 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <button
              className="doc-btn-primary"
              type="submit"
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload Document"}
            </button>
          </form>
        </div>

        {/* ── RIGHT: Document list ── */}
        <div className="mv-card">
          <div className="mv-card-hd">
            <span className="mv-card-title">My documents</span>
            <span className="mv-badge mv-badge-teal">
              {docList.length} {docList.length === 1 ? "file" : "files"}
            </span>
          </div>

          {docList.length === 0 ? (
            <EmptyState />
          ) : (
            docList.map((doc) => {
              const { icon, bg } = getFileIcon(doc.name || doc.title || "");
              return (
                <div key={doc._id} className="doc-item">
                  <div className="doc-icon" style={{ background: bg }}>{icon}</div>
                  <div className="doc-body">
                    <div className="doc-title">{doc.title || doc.name}</div>
                    <div className="doc-meta">
                      {doc.name?.split(".").pop()?.toUpperCase() || "FILE"}
                      {doc.size ? ` · ${doc.size}` : ""}
                      {doc.uploadedAt ? ` · ${formatDate(doc.uploadedAt)}` : ""}
                    </div>
                  </div>
                  <div className="doc-actions">
                    <button className="doc-view-btn" onClick={() => handleView(doc)}>
                      View
                    </button>
                    <button className="doc-remove-btn" onClick={() => handleDelete(doc)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
