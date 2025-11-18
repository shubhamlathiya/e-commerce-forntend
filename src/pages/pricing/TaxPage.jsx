import React, {useEffect, useMemo, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {ToastContainer, toast} from "react-toastify";
import Swal from "sweetalert2";
import taxApi from "../../api/taxApi";

const TaxPage = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        id: undefined,
        name: "",
        type: "percentage", // percentage | fixed
        value: "",
        status: true,
        country: "",
        state: "",
    });

    const resetForm = () => setForm({
        id: undefined,
        name: "",
        type: "percentage",
        value: "",
        status: true,
        country: "",
        state: "",
    });

    const loadRules = async () => {
        try {
            setLoading(true);
            const data = await taxApi.listTaxRules();
            setRules(Array.isArray(data) ? data : data?.items || []);
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load tax rules");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, []);

    const jsonPreview = useMemo(() => ({
        name: form.name,
        type: form.type,
        value: Number(form.value || 0),
        status: !!form.status,
        country: form.country,
        state: form.state,
    }), [form]);

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            if (form.id) {
                await taxApi.updateTaxRule(form.id, jsonPreview);
                toast.success("Tax rule updated");
            } else {
                await taxApi.createTaxRule(jsonPreview);
                toast.success("Tax rule created");
            }
            setShowModal(false);
            resetForm();
            loadRules();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to save tax rule");
        }
    };

    const confirmAndDelete = async (row) => {
        const res = await Swal.fire({
            title: "Delete tax rule?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!res.isConfirmed) return;
        try {
            await taxApi.deleteTaxRule(row.id);
            toast.success("Deleted tax rule");
            loadRules();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to delete tax rule");
        }
    };

    const onEditRow = (row) => {
        setForm({
            id: row.id,
            name: row.name,
            type: row.type,
            value: row.value,
            status: row.status === "Active",
            country: row.country,
            state: row.state,
        });
        setShowModal(true);
    };

    const headers = ["#", "Name", "Type", "Value", "Country", "State", "Status"];
    const rows = (rules || []).map((r, i) => ({
        "#": i + 1,
        id: r.id || r._id,
        name: r.name,
        type: r.type,
        value: r.value,
        country: r.country,
        state: r.state,
        status: r.status ? "Active" : "Inactive",
    }));

    return (
        <MasterLayout>
            <div className="container-fluid">
                <Breadcrumb title="Tax Management"/>

                <div className="card mb-24">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h6 className="mb-0">Tax Rules</h6>
                        <button className="btn btn-primary-600" onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}>
                            Add New Tax Rule
                        </button>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <TableDataLayer
                                headers={headers}
                                data={rows}
                                onView={(row) => Swal.fire({
                                    title: row.name,
                                    html: `<pre style='text-align:left'>${JSON.stringify(row, null, 2)}</pre>`
                                })}
                                onEdit={(row) => onEditRow(row)}
                                onDelete={(row) => confirmAndDelete(row)}
                            />
                        )}
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <>
                        <div
                            className="modal-backdrop fade show"

                        ></div>
                        <div
                            className="modal fade show d-block"
                            tabIndex="-1"
                            role="dialog"
                            style={{
                                zIndex: 1050,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h6 className="modal-title">{form.id ? "Edit" : "Add"} Tax Rule</h6>
                                        <button type="button" className="btn-close"
                                                onClick={() => setShowModal(false)}></button>
                                    </div>
                                    <form onSubmit={onSubmit}>
                                        <div className="modal-body">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.name}
                                                        onChange={(e) => setForm({...form, name: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Type</label>
                                                    <select
                                                        className="form-select"
                                                        value={form.type}
                                                        onChange={(e) => setForm({...form, type: e.target.value})}
                                                    >
                                                        <option value="percentage">Percentage</option>
                                                        <option value="fixed">Fixed</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Value *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control"
                                                        value={form.value}
                                                        onChange={(e) => setForm({...form, value: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Country</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.country}
                                                        onChange={(e) => setForm({...form, country: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">State</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.state}
                                                        onChange={(e) => setForm({...form, state: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-md-12 d-flex align-items-center">
                                                    <div className="form-check mt-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="taxStatus"
                                                            checked={form.status}
                                                            onChange={(e) => setForm({
                                                                ...form,
                                                                status: e.target.checked
                                                            })}
                                                        />
                                                        <label className="form-check-label"
                                                               htmlFor="taxStatus">Active</label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-12">
                                                <label className="form-label">JSON Preview</label>
                                                <pre className="bg-neutral-50 p-12 radius-8" style={{
                                                    maxHeight: 220,
                                                    overflow: "auto"
                                                }}>{JSON.stringify(jsonPreview, null, 2)}</pre>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-neutral-400"
                                                    onClick={() => setShowModal(false)}>Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary-600">Save</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <ToastContainer position="top-right" autoClose={2000}/>
            </div>
        </MasterLayout>
    );
};

export default TaxPage;

