import React, { useState } from "react";
import { toast } from "react-toastify";
import { verify2FA } from "../../api/twoFAApi";

export default function OtpVerifyModal({ show, method, onClose, onSuccess }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleVerify = async (e) => {
    e?.preventDefault?.();
    if (!token.trim()) {
      toast.error("Enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const res = await verify2FA({ method, token: token.trim() });
      toast.success(res?.message || "2FA successfully enabled");
      onSuccess?.(res);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Verification failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const hint = method === "app"
    ? "Open your authenticator app and enter the 6-digit code."
    : method === "email"
      ? "Check your email for the OTP and enter it here."
      : method === "phone"
        ? "Check your SMS for the OTP and enter it here."
        : "Enter the verification code.";

  return (
    <div className="modal-backdrop d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">Verify {method?.toUpperCase()} OTP</h6>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <form onSubmit={handleVerify}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Verification Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter code"
                    required
                  />
                  <div className="form-text">{hint}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary-600" disabled={loading}>
                  {loading ? "Verifying…" : "Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

