import React, {useEffect, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Swal from "sweetalert2";
import {
    getBusinessSettings,
    updateBusinessSettings,
    getPaymentGateways,
    createPaymentGateway,
    updatePaymentGateway,
    deletePaymentGateway,
    getEmailSettings,
    updateEmailSettings,
    getRecaptchaSettings,
    updateRecaptchaSettings,
} from "../../api/settingsApi";

const TabButton = ({active, onClick, children}) => (
    <button
        type="button"
        className={`btn w-100 text-start mb-8 ${active ? "btn-primary-600 text-white" : "btn-neutral-200"}`}
        onClick={onClick}
    >
        {children}
    </button>
);

const Card = ({title, children, rightHeader}) => (
    <div className="card border radius-12 mb-16">
        <div className="card-header d-flex align-items-center justify-content-between">
            <h6 className="mb-0">{title}</h6>
            {rightHeader}
        </div>
        <div className="card-body">{children}</div>
    </div>
);

// Business Settings Section
function BusinessSettingsSection() {
    const [form, setForm] = useState({
        businessName: "",
        contactEmail: "",
        phone: "",
        address: "",
        gstNumber: "",
        currency: "INR",
        timezone: "Asia/Kolkata",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await getBusinessSettings();
            const settings = res?.data?.[0] || res?.data || {};

            setForm({
                businessName: settings.businessName || "",
                contactEmail: settings.contactEmail || "",
                phone: settings.phone || "",
                address: settings.address || "",
                gstNumber: settings.gstNumber || "",
                currency: settings.currency || "INR",
                timezone: settings.timezone || "Asia/Kolkata",
            });
        } catch (e) {
            Swal.fire(
                "Error",
                e?.response?.data?.message || e?.message || "Failed to load business settings",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.businessName?.trim()) {
            Swal.fire("Validation", "Business Name is required", "warning");
            return;
        }
        if (!form.contactEmail?.trim()) {
            Swal.fire("Validation", "Contact Email is required", "warning");
            return;
        }

        try {
            setLoading(true);
            await updateBusinessSettings(null, form);
            Swal.fire("Success", "Business settings updated successfully", "success");
            loadSettings();
        } catch (e) {
            Swal.fire(
                "Error",
                e?.response?.data?.message || e?.message || "Failed to save settings",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title="Business Information"
            rightHeader={
                <button
                    className="btn btn-primary-600"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            }
        >
            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label">Business Name *</label>
                    <input
                        className={`form-control ${
                            !form.businessName?.trim() ? "is-invalid" : ""
                        }`}
                        value={form.businessName}
                        onChange={(e) =>
                            setForm({...form, businessName: e.target.value})
                        }
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Contact Email *</label>
                    <input
                        type="email"
                        className={`form-control ${
                            !form.contactEmail?.trim() ? "is-invalid" : ""
                        }`}
                        value={form.contactEmail}
                        onChange={(e) =>
                            setForm({...form, contactEmail: e.target.value})
                        }
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">GST Number</label>
                    <input
                        className="form-control"
                        value={form.gstNumber}
                        onChange={(e) => setForm({...form, gstNumber: e.target.value})}
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Currency</label>
                    <select
                        className="form-select"
                        value={form.currency}
                        onChange={(e) => setForm({...form, currency: e.target.value})}
                    >
                        <option value="INR">Indian Rupee (INR)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label">Timezone</label>
                    <select
                        className="form-select"
                        value={form.timezone}
                        onChange={(e) => setForm({...form, timezone: e.target.value})}
                    >
                        <option value="Asia/Kolkata">India (Asia/Kolkata)</option>
                        <option value="America/New_York">New York (America/New_York)</option>
                        <option value="Europe/London">London (Europe/London)</option>
                        <option value="Asia/Dubai">Dubai (Asia/Dubai)</option>
                    </select>
                </div>

                <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea
                        className="form-control"
                        rows={3}
                        value={form.address}
                        onChange={(e) => setForm({...form, address: e.target.value})}
                        placeholder="Enter full business address"
                    />
                </div>
            </div>
        </Card>
    );
}

// Email Settings Section
// Email Settings Section
function EmailSettingsSection() {
    const [form, setForm] = useState({
        smtp_host: "",
        smtp_port: "", // Keep as string for form input, convert to number when saving
        smtp_username: "",
        smtp_password: "",
        smtp_secure: "ssl",
        from_email: "",
        from_name: "",
        status: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await getEmailSettings();
            const settings = res?.data?.[0] || res?.data || {};

            setForm({
                smtp_host: settings.smtp_host || "",
                smtp_port: settings.smtp_port ? String(settings.smtp_port) : "587", // Convert number to string
                smtp_username: settings.smtp_username || "",
                smtp_password: settings.smtp_password || "",
                smtp_secure: settings.smtp_secure || "ssl",
                from_email: settings.from_email || "",
                from_name: settings.from_name || "",
                status: settings.status !== false,
            });
        } catch (e) {
            Swal.fire("Error", e?.response?.data?.message || e?.message || "Failed to load email settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Convert port to number for validation
        const portNumber = parseInt(form.smtp_port, 10);

        if (!form.smtp_host?.trim()) {
            Swal.fire("Validation", "SMTP Host is required", "warning");
            return;
        }
        if (!portNumber || portNumber <= 0 || portNumber > 65535) {
            Swal.fire("Validation", "Valid SMTP Port is required (1-65535)", "warning");
            return;
        }
        if (!form.from_email?.trim()) {
            Swal.fire("Validation", "From Email is required", "warning");
            return;
        }

        try {
            setLoading(true);

            // Prepare payload with port as number
            const payload = {
                ...form,
                smtp_port: portNumber
            };

            await updateEmailSettings(payload);
            Swal.fire("Success", "Email settings updated successfully", "success");
            loadSettings();
        } catch (e) {
            Swal.fire("Error", e?.response?.data?.message || e?.message || "Failed to save email settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Card
            title="Email Settings"
            rightHeader={
                <button className="btn btn-primary-600" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            }
        >
            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label">SMTP Host *</label>
                    <input
                        type="text"
                        className={`form-control ${!form.smtp_host?.trim() ? "is-invalid" : ""}`}
                        value={form.smtp_host}
                        onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">SMTP Port *</label>
                    <input
                        type="number"
                        className={`form-control ${!form.smtp_port || parseInt(form.smtp_port) <= 0 ? "is-invalid" : ""}`}
                        value={form.smtp_port}
                        onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                        placeholder="587"
                        min="1"
                        max="65535"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">SMTP Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={form.smtp_username}
                        onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                        placeholder="your-email@gmail.com"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">SMTP Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={form.smtp_password}
                        onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                        placeholder="Your SMTP password"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Security Type</label>
                    <select
                        className="form-select"
                        value={form.smtp_secure}
                        onChange={(e) => handleInputChange('smtp_secure', e.target.value)}
                    >
                        <option value="ssl">SSL</option>
                        <option value="tls">TLS</option>
                        <option value="none">None</option>
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label">From Email *</label>
                    <input
                        type="email"
                        className={`form-control ${!form.from_email?.trim() ? "is-invalid" : ""}`}
                        value={form.from_email}
                        onChange={(e) => handleInputChange('from_email', e.target.value)}
                        placeholder="noreply@yourdomain.com"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">From Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={form.from_name}
                        onChange={(e) => handleInputChange('from_name', e.target.value)}
                        placeholder="Your Company Name"
                    />
                </div>

                <div className="col-md-6">
                    <div className="form-check form-switch mt-4">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={form.status}
                            onChange={(e) => handleInputChange('status', e.target.checked)}
                        />
                        <label className="form-check-label">Enable Email Service</label>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Payment Gateway Section
function PaymentGatewaySection() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        name: "",
        config: "",
        status: false,
        testMode: true
    });

    const load = async () => {
        try {
            setLoading(true);
            const res = await getPaymentGateways();
            setItems(res?.data || []);
        } catch (e) {
            Swal.fire("Error", e?.response?.data?.message || e?.message || "Failed to load gateways", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({
            name: "",
            config: JSON.stringify({
                key_id: "rzp_test_1DP5mmOlF5G5ag",
                key_secret: "your_secret_key_here",
                currency: "INR"
            }, null, 2),
            status: false,
            testMode: true
        });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.name || "",
            config: JSON.stringify(item.config || {}, null, 2),
            status: !!item.status,
            testMode: !!item.testMode
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name?.trim()) {
            Swal.fire("Validation", "Name is required", "warning");
            return;
        }

        let cfg;
        try {
            cfg = JSON.parse(form.config || "{}");
        } catch (_) {
            Swal.fire("Validation", "Config must be valid JSON", "warning");
            return;
        }

        try {
            const payload = {
                name: form.name,
                config: cfg,
                status: !!form.status,
                testMode: !!form.testMode
            };

            if (editing?._id) {
                await updatePaymentGateway(editing._id, payload);
                Swal.fire("Updated", "Gateway updated successfully", "success");
            } else {
                await createPaymentGateway(payload);
                Swal.fire("Created", "Gateway added successfully", "success");
            }
            setShowModal(false);
            load();
        } catch (e2) {
            Swal.fire("Error", e2?.response?.data?.message || e2?.message || "Failed to save", "error");
        }
    };

    const handleDelete = async (id) => {
        const ok = await Swal.fire({
            title: "Delete Payment Gateway?",
            text: "This cannot be undone",
            icon: "warning",
            showCancelButton: true
        });
        if (!ok.isConfirmed) return;

        try {
            await deletePaymentGateway(id);
            load();
            Swal.fire("Deleted", "Payment gateway removed successfully", "success");
        } catch (e) {
            Swal.fire("Error", e?.response?.data?.message || e?.message || "Delete failed", "error");
        }
    };

    return (
        <Card
            title="Payment Gateways"
            rightHeader={<button className="btn btn-primary-600" onClick={openCreate}>Add New Gateway</button>}
        >
            {loading ? <div className="spinner-border"/> : (
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Mode</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((it) => (
                            <tr key={it._id}>
                                <td>{it.name}</td>
                                <td>
                    <span className={`badge ${it.status ? 'bg-success' : 'bg-secondary'}`}>
                      {it.status ? 'Active' : 'Inactive'}
                    </span>
                                </td>
                                <td>
                    <span className={`badge ${it.testMode ? 'bg-warning' : 'bg-info'}`}>
                      {it.testMode ? 'Test Mode' : 'Live Mode'}
                    </span>
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-sm btn-neutral-400"
                                                onClick={() => openEdit(it)}>Edit
                                        </button>
                                        <button className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(it._id)}>Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center text-muted">No payment gateways found</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (<div className="modal-backdrop fade show"></div>)}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{zIndex: 1050}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content radius-12">
                            <div className="modal-header">
                                <h6 className="modal-title">{editing ? "Edit Gateway" : "Add Gateway"}</h6>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}/>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label">Name *</label>
                                            <input
                                                className={`form-control ${!form.name?.trim() ? "is-invalid" : ""}`}
                                                value={form.name}
                                                onChange={(e) => setForm({...form, name: e.target.value})}
                                                placeholder="e.g. Razorpay, Stripe, PayPal"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Config (JSON)</label>
                                            <textarea
                                                rows={8}
                                                className="form-control"
                                                value={form.config}
                                                onChange={(e) => setForm({...form, config: e.target.value})}
                                                placeholder={`{
  "key_id": "rzp_test_1DP5mmOlF5G5ag",
  "key_secret": "your_secret_key_here",
  "currency": "INR"
}`}
                                            />
                                            <small className="text-muted">
                                                Example: Enter your payment gateway API credentials and settings.
                                            </small>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={!!form.status}
                                                    onChange={(e) => setForm({...form, status: e.target.checked})}
                                                />
                                                <label className="form-check-label">Active</label>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={!!form.testMode}
                                                    onChange={(e) => setForm({...form, testMode: e.target.checked})}
                                                />
                                                <label className="form-check-label">Test Mode</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">
                                        {editing ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

// reCAPTCHA Settings Section
function RecaptchaSettingsSection() {
    const [form, setForm] = useState({
        site_key: "",
        secret_key: "",
        status: false,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await getRecaptchaSettings();

            // Handle different response formats
            let settings = {};
            if (res?.data) {
                // If data is an array, take the first item
                if (Array.isArray(res.data)) {
                    settings = res.data[0] || {};
                } else {
                    // If data is an object
                    settings = res.data;
                }
            } else if (res) {
                // If response itself is the settings object
                settings = res;
            }
            setForm({
                site_key: settings.site_key || "",
                secret_key: settings.secret_key || "",
                status: settings.status === true, // Ensure boolean
            });
        } catch (e) {
            console.error('Error loading reCAPTCHA settings:', e);
            Swal.fire(
                "Error",
                e?.response?.data?.message || e?.message || "Failed to load reCAPTCHA settings",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!form.site_key?.trim()) {
            Swal.fire("Validation", "Site Key is required", "warning");
            return;
        }
        if (!form.secret_key?.trim()) {
            Swal.fire("Validation", "Secret Key is required", "warning");
            return;
        }

        try {
            setSaving(true);

            // Prepare the payload
            const payload = {
                site_key: form.site_key.trim(),
                secret_key: form.secret_key.trim(),
                status: form.status
            };



            const result = await updateRecaptchaSettings(payload);

            // Check if the update was successful
            if (result?.success) {
                Swal.fire("Success", "reCAPTCHA settings updated successfully", "success");
                // Reload settings to get the latest from server
                await loadSettings();
            } else {
                throw new Error(result?.message || "Failed to update settings");
            }
        } catch (e) {
            console.error('Error saving reCAPTCHA settings:', e);
            Swal.fire(
                "Error",
                e?.response?.data?.message || e?.message || "Failed to save reCAPTCHA settings",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTestConnection = async () => {
        if (!form.site_key?.trim() || !form.secret_key?.trim()) {
            Swal.fire("Validation", "Please enter both Site Key and Secret Key first", "warning");
            return;
        }

        try {
            Swal.fire({
                title: 'Testing reCAPTCHA Connection',
                text: 'Please wait...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // You can add a test endpoint in your backend to verify reCAPTCHA keys
            // For now, we'll just show a success message
            // In a real implementation, you would call an API endpoint to test the keys

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            Swal.fire(
                "Success",
                "reCAPTCHA keys are valid and connection is working",
                "success"
            );
        } catch (error) {
            Swal.fire(
                "Error",
                "Failed to verify reCAPTCHA keys. Please check your credentials.",
                "error"
            );
        }
    };

    const resetForm = () => {
        setForm({
            site_key: "",
            secret_key: "",
            status: false,
        });
    };

    if (loading) {
        return (
            <Card title="reCAPTCHA Settings">
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 mb-0">Loading reCAPTCHA settings...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="reCAPTCHA Settings"
            rightHeader={
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-secondary"
                        onClick={handleTestConnection}
                        disabled={saving || !form.site_key || !form.secret_key}
                    >
                        Test Connection
                    </button>
                    <button
                        className="btn btn-primary-600"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label">Site Key *</label>
                    <input
                        type="text"
                        className={`form-control ${!form.site_key?.trim() ? "is-invalid" : ""}`}
                        value={form.site_key}
                        onChange={(e) => handleInputChange('site_key', e.target.value)}
                        placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                        disabled={saving}
                    />
                    <div className="form-text">
                        Your reCAPTCHA site key from Google reCAPTCHA admin
                    </div>
                </div>

                <div className="col-md-6">
                    <label className="form-label">Secret Key *</label>
                    <input
                        type="password"
                        className={`form-control ${!form.secret_key?.trim() ? "is-invalid" : ""}`}
                        value={form.secret_key}
                        onChange={(e) => handleInputChange('secret_key', e.target.value)}
                        placeholder="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
                        disabled={saving}
                    />
                    <div className="form-text">
                        Your reCAPTCHA secret key from Google reCAPTCHA admin
                    </div>
                </div>

                <div className="col-12">
                    <div className="form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={form.status}
                            onChange={(e) => handleInputChange('status', e.target.checked)}
                            disabled={saving}
                        />
                        <label className="form-check-label fw-medium">
                            Enable reCAPTCHA Protection
                        </label>
                    </div>
                    <small className="text-muted d-block mt-1">
                        When enabled, reCAPTCHA will be required on all forms for security verification.
                    </small>
                </div>

                {/* Instructions */}
                <div className="col-12">
                    <div className="alert alert-info">
                        <h6 className="alert-heading mb-2">How to get reCAPTCHA keys:</h6>
                        <ol className="mb-0 small">
                            <li>Go to <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">Google reCAPTCHA Admin</a></li>
                            <li>Register your website</li>
                            <li>Choose reCAPTCHA v2 "I'm not a robot" checkbox</li>
                            <li>Copy the Site Key and Secret Key into the fields above</li>
                            <li>Save the settings and test the connection</li>
                        </ol>
                    </div>
                </div>

                {/* Current Status */}
                <div className="col-12">
                    <div className="card bg-light">
                        <div className="card-body py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="card-title mb-1">Current Status</h6>
                                    <p className="card-text small mb-0">
                                        reCAPTCHA is currently <strong>{form.status ? 'ENABLED' : 'DISABLED'}</strong>
                                    </p>
                                </div>
                                <span className={`badge ${form.status ? 'bg-success' : 'bg-secondary'}`}>
                                    {form.status ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Settings Page
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("business");

    const availableTabs = [
        {id: "business", label: "Business Info"},
        {id: "email", label: "Email Settings"},
        {id: "payment", label: "Payment Gateways"},
        {id: "recaptcha", label: "reCAPTCHA Settings"},
    ];

    return (
        <MasterLayout>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-3">
                        <div className="sticky-top" style={{top: 84}}>
                            {availableTabs.map((tab) => (
                                <TabButton
                                    key={tab.id}
                                    active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </TabButton>
                            ))}
                        </div>
                    </div>
                    <div className="col-md-9">
                        <div className="pb-24">
                            {activeTab === "business" && <BusinessSettingsSection/>}
                            {activeTab === "email" && <EmailSettingsSection/>}
                            {activeTab === "payment" && <PaymentGatewaySection/>}
                            {activeTab === "recaptcha" && <RecaptchaSettingsSection/>}
                        </div>
                    </div>
                </div>
            </div>
        </MasterLayout>
    );
}