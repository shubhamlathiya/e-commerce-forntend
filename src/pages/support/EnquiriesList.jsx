import React, {useEffect, useMemo, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import {
    listEnquiries,
    getEnquiry,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
    formatDateTime,
} from "../../api/supportAPI";

const statusBadge = (status) => {
    const key = String(status || "new").toLowerCase();
    const map = {
        new: {label: "New", cls: "bg-primary-600"},
        resolved: {label: "Resolved", cls: "bg-success-600"},
    };
    const conf = map[key] || {label: status || "Unknown", cls: "bg-neutral-600"};
    return `<span class="badge ${conf.cls}">${conf.label}</span>`;
};

export default function EnquiriesList() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);

    const [limit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    // Form state
    const [form, setForm] = useState({name: "", email: "", phone: "", message: ""});

    // Local modals state (replace Swal for view/edit)
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editStatus, setEditStatus] = useState("new");
    const [savingEdit, setSavingEdit] = useState(false);

    const headers = ["#", "Name", "Email", "Phone", "Status", "Created At"];

    const fetchList = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await listEnquiries({page, limit, search, status});
            const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];


            setItems(data);
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "Failed to load enquiries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, status]);

    const tableData = useMemo(() => {
        return items.map((it, idx) => ({
            "#": (page - 1) * limit + idx + 1,
            name: it.name || "",
            email: it.email || "",
            phone: it.phone || "",
            status: statusBadge(it.status),
            createdat: formatDateTime(it.createdAt),
            _id: it.id || it._id,
        }));
    }, [items, page, limit]);

    const onView = async (row) => {
        const id = row?._id;
        if (!id) return;
        try {
            const res = await getEnquiry(id);
            const it = res?.data || res;
            setViewItem(it);
            setShowViewModal(true);
        } catch (e) {
            Swal.fire({icon: "error", title: "Failed to fetch details", text: e?.response?.data?.message || e.message});
        }
    };

    const onEdit = async (row) => {
        const id = row?._id;
        if (!id) return;
        try {
            const res = await getEnquiry(id);
            const it = res?.data || res;
            setEditItem(it);
            setEditStatus(String(it?.status || "new"));
            setShowEditModal(true);
        } catch (e) {
            Swal.fire({icon: "error", title: "Failed to open edit", text: e?.response?.data?.message || e.message});
        }
    };

    const submitEdit = async () => {
        if (!editItem?._id && !editItem?.id) return;
        setSavingEdit(true);
        try {
            await updateEnquiry(editItem._id || editItem.id, {status: editStatus});
            setShowEditModal(false);
            setEditItem(null);
            Swal.fire({icon: "success", title: "Enquiry updated"});
            fetchList();
        } catch (e) {
            Swal.fire({icon: "error", title: "Update failed", text: e?.response?.data?.message || e.message});
        } finally {
            setSavingEdit(false);
        }
    };

    const onDelete = async (row) => {
        const id = row?._id;
        if (!id) return;
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Delete this enquiry?",
            text: "This action cannot be undone.",
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#d33",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!confirm.isConfirmed) return;
        try {
            await deleteEnquiry(id);
            Swal.fire({icon: "success", title: "Enquiry deleted"});
            fetchList();
        } catch (e) {
            Swal.fire({icon: "error", title: "Delete failed", text: e?.response?.data?.message || e.message});
        }
    };

    const validateForm = () => {
        const {name, email, phone, message} = form;
        if (!name || typeof name !== "string" || !name.trim()) {
            Swal.fire({icon: "error", title: "Name is required"});
            return false;
        }
        if (!message || typeof message !== "string" || !message.trim()) {
            Swal.fire({icon: "error", title: "Message is required"});
            return false;
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            Swal.fire({icon: "error", title: "Invalid email format"});
            return false;
        }
        if (phone && typeof phone !== "string") {
            Swal.fire({icon: "error", title: "Phone must be a string"});
            return false;
        }
        return true;
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            await createEnquiry({...form});
            Swal.fire({icon: "success", title: "Enquiry created"});
            setForm({name: "", email: "", phone: "", message: ""});
            fetchList();
        } catch (err) {
            Swal.fire({icon: "error", title: "Creation failed", text: err?.response?.data?.message || err.message});
        }
    };

    return (
        <MasterLayout>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-4">Enquiries List</h5>
                                <p className="mb-0 text-secondary-light">Manage customer contact enquiries.</p>
                            </div>
                            <div className="card-body">
                                {/* Filters */}
                                <div className="row g-3 mb-16">
                                    <div className="col-md-4">
                                        <input
                                            className="form-control"
                                            placeholder="Search by name, email, phone"
                                            value={search}
                                            onChange={(e) => {
                                                setPage(1);
                                                setSearch(e.target.value);
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <select className="form-select" value={status} onChange={(e) => {
                                            setPage(1);
                                            setStatus(e.target.value);
                                        }}>
                                            <option value="">All Status</option>
                                            <option value="new">New</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="col-md-5 text-end">
                                        {loading && <span className="text-secondary">Loading…</span>}
                                        {error && <span className="text-danger ms-12">{error}</span>}
                                    </div>
                                </div>
                                <div style={{overflowX: "auto"}}>
                                    {/* Table */}
                                    <TableDataLayer
                                        title="Enquiries"
                                        headers={headers}
                                        data={tableData}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* New Enquiry Form */}
                        <div className="card">
                            <div className="card-header">
                                <h6 className="mb-0">Create Enquiry</h6>
                            </div>
                            <div className="card-body">
                                <form onSubmit={submitForm} className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Name *</label>
                                        <input className="form-control" value={form.name}
                                               onChange={(e) => setForm({...form, name: e.target.value})}/>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Email</label>
                                        <input className="form-control" value={form.email}
                                               onChange={(e) => setForm({...form, email: e.target.value})}/>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Phone</label>
                                        <input className="form-control" value={form.phone}
                                               onChange={(e) => setForm({...form, phone: e.target.value})}/>
                                    </div>
                                    <div className="col-md-12">
                                        <label className="form-label">Message *</label>
                                        <textarea className="form-control" rows={3} value={form.message}
                                                  onChange={(e) => setForm({...form, message: e.target.value})}/>
                                    </div>
                                    <div className="col-12 text-end">
                                        <button type="submit" className="btn btn-primary-600">Submit Enquiry</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* View Modal */}
            {showViewModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Enquiry Details</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
                                </div>
                                <div className="modal-body two-col">
                                    <div className="col-md-6">
                                        <div className="form-text">Name</div>
                                        <div>{viewItem?.name || "-"}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Email</div>
                                        <div>{viewItem?.email || "-"}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Phone</div>
                                        <div>{viewItem?.phone || "-"}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Status</div>
                                        <div dangerouslySetInnerHTML={{__html: statusBadge(viewItem?.status)}}></div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Created At</div>
                                        <div>{formatDateTime(viewItem?.createdAt)}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Updated At</div>
                                        <div>{formatDateTime(viewItem?.updatedAt || viewItem?.updated_at)}</div>
                                    </div>
                                    <div className="col-md-12">
                                        <hr/>
                                        <div className="form-text">Message</div>
                                        <div style={{whiteSpace: 'pre-wrap'}}>{viewItem?.message || "-"}</div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400" onClick={() => setShowViewModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Enquiry</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body two-col">
                                    <div className="col-md-12">
                                        <div className="form-text">Status</div>
                                        <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                                            <option value="new">New</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Name</div>
                                        <div>{editItem?.name || '-'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Email</div>
                                        <div>{editItem?.email || '-'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Phone</div>
                                        <div>{editItem?.phone || '-'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-text">Created At</div>
                                        <div>{formatDateTime(editItem?.createdAt)}</div>
                                    </div>
                                    <div className="col-md-12">
                                        <hr/>
                                        <div className="form-text">Message</div>
                                        <div style={{whiteSpace: 'pre-wrap'}}>{editItem?.message || '-'}</div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="button" className="btn btn-primary-600" disabled={savingEdit} onClick={submitEdit}>
                                        {savingEdit ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MasterLayout>
    );
}
