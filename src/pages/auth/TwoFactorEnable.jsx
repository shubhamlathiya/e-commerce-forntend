import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import { enable2FA, get2FAStatus } from "../../api/twoFAApi";
import OtpVerifyModal from "../../components/modals/OtpVerifyModal";
import PasswordPromptModal from "../../components/modals/PasswordPromptModal";
import { disable2FA } from "../../api/twoFAApi";

export default function TwoFactorEnable() {
  const [method, setMethod] = useState("email");
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await get2FAStatus();
        const status = res?.data;
        if (status) {
          setIsEnabled(!!status.enabled);
          if (status.method) setMethod(status.method);
        }
      } catch (err) {
        // Non-blocking: if status fetch fails, keep defaults
        console.warn("Failed to fetch 2FA status", err?.message || err);
      }
    };
    fetchStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method) return toast.error("Please select a 2FA method.");
    setLoading(true);
    try {
      const res = await enable2FA(method);
      const msg = res?.message || "2FA setup initiated.";
      toast.success(msg);
      localStorage.setItem("twofa_method", method);
      if (method === "app" && res?.secret) {
        setSecret(res.secret);
      } else {
        setSecret("");
      }
      // Open OTP verification modal immediately after enable
      setShowVerify(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to enable 2FA";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (password) => {
    try {
      setDisableLoading(true);
      const res = await disable2FA( password );
      const msg = res?.message || "Two-factor authentication disabled.";
      toast.success(msg);
      setIsEnabled(false);
      setShowDisablePrompt(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to disable 2FA";
      toast.error(msg);
    } finally {
      setDisableLoading(false);
    }
  };

  return (
    <MasterLayout>
      <div className="container-fluid">
        <Breadcrumb title="Account / Two-Factor Authentication" />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

        <div className="card mb-24">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h6 className="mb-0">{isEnabled ? "Two-Factor Authentication is ON" : "Enable Two-Factor Authentication"}</h6>
          </div>
         <div className="card-body">
            {!isEnabled && (
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Select 2FA Method *</label>
                <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)} required>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="app">App (Authenticator)</option>
                </select>
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-primary-600" disabled={loading}>
                  {loading ? "Please wait…" : "Enable"}
                </button>
              </div>
            </form>
            )}

            {method === "app" && secret && (
              <div className="alert alert-info mt-16">
                <div className="fw-semibold mb-8">Authenticator App Secret</div>
                <div className="d-flex align-items-center gap-12">
                  <code className="p-8 bg-neutral-100 radius-8">{secret}</code>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => { navigator.clipboard?.writeText(secret); toast.success("Secret copied"); }}
                  >
                    Copy
                  </button>
                </div>
                <div className="form-text mt-8">
                  Add this secret in your authenticator app (Google Authenticator, Authy, etc.), then proceed to Verify.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <OtpVerifyModal
        show={showVerify}
        method={method}
        onClose={() => setShowVerify(false)}
        onSuccess={() => {
          setShowVerify(false);
          toast.success("Two-factor authentication has been enabled.");
          setIsEnabled(true);
        }}
      />

      {isEnabled && (
        <div className="mt-4">
          <button className="btn btn-danger" onClick={() => setShowDisablePrompt(true)}>
            Disable Two-Factor Authentication
          </button>
        </div>
      )}

      <PasswordPromptModal
        show={showDisablePrompt}
        onClose={() => setShowDisablePrompt(false)}
        onConfirm={handleDisable}
        loading={disableLoading}
        title="Disable Two-Factor Authentication"
        description="Enter your password to disable 2FA for your account."
        confirmLabel="Disable"
      />
    </MasterLayout>
  );
}
