import React, { useState } from "react";

export default function PasswordPromptModal({
  show,
  title = "Disable Two-Factor Authentication",
  description = "Enter your account password to confirm disabling 2FA.",
  confirmLabel = "Disable",
  onClose,
  onConfirm,
  loading = false,
}) {
  const [password, setPassword] = useState("");

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="text-muted mb-3">{description}</p>
          <div className="form-group">
            <label htmlFor="disablePassword">Password</label>
            <input
              id="disablePassword"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onConfirm(password)}
            disabled={loading || !password}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

