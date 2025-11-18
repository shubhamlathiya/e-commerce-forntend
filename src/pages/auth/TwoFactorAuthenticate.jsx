import React, {useMemo, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {authenticate2FA} from "../../api/twoFAApi";

const getUserIdFromStorage = () => {
    try {
        const raw = localStorage.getItem("auth_user");
        if (!raw) return "";
        const obj = JSON.parse(raw);
        return obj?.id || obj?._id || obj?.userId || "";
    } catch (_) {
        return "";
    }
};

export default function TwoFactorAuthenticate() {
    const navigate = useNavigate();
    const location = useLocation();
    const autoUserId = useMemo(() => getUserIdFromStorage(), []);
    const prefilledUserId = useMemo(() => ((location?.state && location.state.userId) || localStorage.getItem("pending_2fa_userId") || autoUserId || ""), [location?.state, autoUserId]);
    const prefilledMethod = useMemo(() => ((location?.state && location.state.method) || localStorage.getItem("pending_2fa_method") || "email"), [location?.state]);
    const [userId, setUserId] = useState(prefilledUserId);
    const [method, setMethod] = useState(prefilledMethod);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const uid = userId?.trim();
        if (!uid) return toast.error("User ID is required.");
        if (!method) return toast.error("Select a verification method.");
        const cleanToken = token.trim();
        if (!cleanToken) return toast.error("Enter the verification token.");
        if (!/^\d{6}$/.test(cleanToken)) return toast.error("Enter a valid 6-digit numeric OTP.");
        setLoading(true);
        try {
            const res = await authenticate2FA({userId: uid, method, token: cleanToken});
            const accessToken = res?.accessToken;
            const refreshToken = res?.refreshToken;
            const expiresAt = res?.expiresAt;
            if (accessToken) localStorage.setItem("auth_token", accessToken);
            if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
            if (expiresAt) localStorage.setItem("expires_at", expiresAt);
            if (res?.user) localStorage.setItem("auth_user", JSON.stringify(res.user));
            localStorage.removeItem("pending_2fa_userId");
            localStorage.removeItem("pending_2fa_method");
            toast.success(res?.message || "2FA authenticated");
            navigate("/tags", {replace: true});
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Invalid or expired token";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="container-fluid">

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar/>

            <div className="card mb-24">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Authenticate 2FA</h6>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="row g-3">
                        {/* OTP-only UI: userId and method are derived from prior login */}
                      
                        <div className="col-md-6">
                            <label className="form-label">Token *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                inputMode="number"
                                maxLength={6}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <button type="submit" className="btn btn-primary-600" disabled={loading}>
                                {loading ? "Authenticating…" : "Authenticate"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
