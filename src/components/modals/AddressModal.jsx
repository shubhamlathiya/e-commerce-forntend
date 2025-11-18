import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";

export default function AddressModal({
  show,
  title = "Add Address",
  initial = {},
  userOptions = [],
  loading = false,
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState({
    userId: initial.userId || "",
    name: initial.name || "",
    phone: initial.phone || "",
    address1: initial.address1 || initial.address || "",
    address2: initial.address2 || "",
    city: initial.city || "",
    state: initial.state || "",
    country: initial.country || "",
    pincode: initial.pincode || "",
    isDefault: !!initial.isDefault,
  });

  useEffect(() => {
    setForm((f) => ({
      ...f,
      userId: initial.userId || "",
      name: initial.name || "",
      phone: initial.phone || "",
      address1: initial.address1 || initial.address || "",
      address2: initial.address2 || "",
      city: initial.city || "",
      state: initial.state || "",
      country: initial.country || "",
      pincode: initial.pincode || "",
      isDefault: !!initial.isDefault,
    }));
  }, [initial]);

  const selectedUser = useMemo(() => (userOptions || []).find((u) => String(u.value) === String(form.userId)) || null, [userOptions, form.userId]);

  const submit = (e) => {
    e?.preventDefault?.();
    if (!onSubmit) return;
    const payload = {
      userId: form.userId,
      name: form.name,
      phone: form.phone,
      address: [form.address1, form.address2].filter(Boolean).join(", "),
      city: form.city,
      state: form.state,
      country: form.country,
      pincode: form.pincode,
      isDefault: !!form.isDefault,
    };
    onSubmit(payload);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content" style={{ maxHeight: "none", overflow: "visible" }}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">User</label>
                    <Select
                      classNamePrefix="react-select"
                      placeholder="Search user"
                      isClearable
                      isSearchable
                      options={userOptions}
                      value={selectedUser}
                      onChange={(opt) => setForm((f) => ({ ...f, userId: opt?.value || "" }))}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Address Line 1</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.address1}
                      onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Address Line 2</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.address2}
                      onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.pincode}
                      onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="col-md-12">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        id="setDefaultCheck"
                      />
                      <label className="form-check-label" htmlFor="setDefaultCheck">
                        Set as Default
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving…" : (title?.toLowerCase().includes("edit") ? "Save Changes" : "Add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

