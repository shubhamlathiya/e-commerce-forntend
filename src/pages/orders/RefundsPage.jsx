import React, {useEffect, useMemo, useState} from "react";
import Select from "react-select";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import {listRefunds, createRefund, updateRefund, deleteRefund, getRefund} from "../../api/refundsApi";
import { getAllAdminOrders } from "../../api/ordersAPI";

const statusBadge = (status) => <OrderStatusBadge status={status}/>;

const defaultForm = {
    id: undefined,
    amount: "",
    mode: "",
    reason: "",
    notes: "",
    userId: "",
    orderId: "",
    status: "initiated",
};

const RefundsPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const [limit, setLimit] = useState(10);



    const [status, setStatus] = useState("");
    const [mode, setMode] = useState("");

    const [orderId, setOrderId] = useState("");
    const [typeFilter, setTypeFilter] = useState("all"); // all | withReturn | withoutReturn

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    // Orders reference for searchable dropdown
    const [orders, setOrders] = useState([]);
    const orderOptions = useMemo(() => {
        const normalizeTotal = (o) => Number(o.total ?? o.grandTotal ?? o.amount ?? 0) || 0;
        const itemCount = (o) => Array.isArray(o.items) ? o.items.length : (Number(o.itemCount) || 0);
        const firstImage = (o) => {
            const it = Array.isArray(o.items) && o.items[0] ? o.items[0] : null;
            const img = it?.image || it?.thumbnail || it?.thumb || it?.images?.[0] || null;
            return img || null;
        };
        return (orders || []).map((o) => {
            const id = o._id || o.id || "";
            const total = normalizeTotal(o);
            const count = itemCount(o);
            const placedAt = o.placedAt || o.createdAt || o.updatedAt;
            const placedStr = placedAt ? new Date(placedAt).toLocaleDateString() : "";
            return {
                value: id,
                label: `#${String(id).slice(-6)} • ₹${total.toFixed(2)} • ${count} item${count === 1 ? "" : "s"}`,
                thumb: firstImage(o),
                meta: { status: o.status || o.payment?.status || "pending", placed: placedStr, userId: o.userId || o.user?._id || o.user?.id || "" },
            };
        });
    }, [orders]);

    const selectedOrderOption = useMemo(() => {
        if (!form.orderId) return null;
        return orderOptions.find((opt) => opt.value === form.orderId) || null;
    }, [form.orderId, orderOptions]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await listRefunds({ limit, status, mode, orderId});
            const items = Array.isArray(res?.data) ? res.data : [];
            setItems(items);

        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to load refunds");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, status, mode]);

    const hasReturnLinked = useMemo(() => items.some((i) => !!(i.returnId || i.return?.id)), [items]);
    const filteredItems = useMemo(() => {
        if (typeFilter === "withReturn") return items.filter((i) => !!(i.returnId || i.return?.id));
        if (typeFilter === "withoutReturn") return items.filter((i) => !(i.returnId || i.return?.id));
        return items;
    }, [items, typeFilter]);

    const openCreate = () => {
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = async (row) => {
        const id = row?._id || row?.id;
        try {
            const data = await getRefund(id);
            const r = data?.data || data || {};
            setForm({
                id,
                amount: String(r.amount ?? ""),
                mode: r.mode || "",
                reason: r.reason || "",
                notes: r.notes || "",
                userId: r.userId || r.user?._id || r.user?.id || "",
                orderId: r.orderId || r.order?._id || r.order?.id || "",
                status: r.status || "initiated",
            });
            setShowModal(true);
        } catch (err) {
            toast.error("Failed to load refund details");
        }
    };

    // Load orders when modal opens so dropdown has options
    useEffect(() => {
        const loadOrders = async () => {
            try {
                const res = await getAllAdminOrders({ page: 1, limit: 50 });
                const list = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
                setOrders(list);
            } catch (err) {
                // Do not block modal; show toast for feedback
                toast.error(err?.response?.data?.message || err?.message || "Failed to load orders");
            }
        };
        if (showModal) loadOrders();
    }, [showModal]);

    const handleDelete = async (row) => {
        const id = row?._id || row?.id;
        const result = await Swal.fire({
            title: "Delete refund?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (result.isConfirmed) {
            try {
                await deleteRefund(id);
                toast.success("Refund deleted successfully");
                load();
            } catch (err) {
                toast.error(err?.response?.data?.message || "Delete failed");
            }
        }
    };

    const validateForm = () => {
        const amountNum = Number(form.amount);
        if (!form.userId?.trim()) return "User ID is required";
        if (!form.orderId?.trim()) return "Order ID is required";
        if (!form.mode?.trim()) return "Mode is required";
        if (!form.reason?.trim() || form.reason.trim().length < 3) return "Reason must be at least 3 characters";
        if (Number.isNaN(amountNum) || amountNum <= 0) return "Amount must be a positive number";
        if (!form.status?.trim()) return "Status is required";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }
        setSaving(true);
        const payload = {
            amount: Number(form.amount),
            mode: form.mode,
            reason: form.reason,
            notes: form.notes,
            userId: form.userId,
            orderId: form.orderId,
            status: form.status,
        };
        try {
            if (form.id) {
                await updateRefund(form.id, payload);
                toast.success("Refund updated successfully");
            } else {
                await createRefund(payload);
                toast.success("Refund created successfully");
            }
            setShowModal(false);
            load();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const tableHeaders = ["#", "refund", "order", "user", "amount", "mode", "status", "created"];
    const tableData = filteredItems.map((r, idx) => ({
        "#": idx + 1,
        refund: r._id || r.id,
        order: r.orderId || (r.order && (r.order._id || r.order.id)) || "-",
        user: r.userId || (r.user && (r.user._id || r.user.id)) || "-",
        amount: `₹${Number(r.amount || 0).toFixed(2)}`,
        mode: r.mode || "-",
        status: statusBadge(r.status),
        created: r.createdAt ? new Date(r.createdAt).toLocaleString() : (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""),
        id: r._id || r.id,
        raw: r,
    }));


    const onView = (row) => {
        const r = items.find((it) => (it._id || it.id) === (row._id || row.id));
        const mode = r?.mode || "-";
        const status = r?.status || "-";
        const amt = `₹${Number(r?.amount || 0).toFixed(2)}`;
        const created = r?.createdAt ? new Date(r.createdAt).toLocaleString() : "";
        Swal.fire({
            title: `Refund ${r?._id || r?.id}`,
            html: `
        <div style="text-align:left">
          <p><strong>User:</strong> ${r?.userId || r?.user?.id || "-"}</p>
          <p><strong>Order:</strong> ${r?.orderId || r?.order?.id || "-"}</p>
          <p><strong>Amount:</strong> ${amt}</p>
          <p><strong>Mode:</strong> ${mode}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Reason:</strong> ${r?.reason || "-"}</p>
          ${r?.notes ? `<p><strong>Notes:</strong> ${r.notes}</p>` : ""}
          ${created ? `<p><strong>Created:</strong> ${created}</p>` : ""}
        </div>
      `,
            confirmButtonText: "Close",
        });
    };

    return (
        <MasterLayout>
            <Breadcrumb title="Orders / refunds" />
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h4>Refunds</h4>
                <div className="d-flex gap-2 align-items-center">

                    <select className="form-select" style={{width: 160}} value={status}
                            onChange={(e) => setStatus(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="initiated">Initiated</option>
                        <option value="processed">Processed</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select className="form-select" style={{width: 140}} value={mode}
                            onChange={(e) => setMode(e.target.value)}>
                        <option value="">All Modes</option>
                        <option value="wallet">Wallet</option>
                        <option value="bank">Bank</option>
                    </select>
                    <input type="text" className="form-control" style={{width: 200}} placeholder="Order ID"
                           value={orderId} onChange={(e) => setOrderId(e.target.value)}/>
                    <select className="form-select" style={{width: 120}} value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}>
                        {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
                    </select>
                    {hasReturnLinked && (
                        <select className="form-select" style={{width: 180}} value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="all">All Refunds</option>
                            <option value="withReturn">Refund Requests Only</option>
                            <option value="withoutReturn">Manual Refunds Only</option>
                        </select>
                    )}
                    <button className="btn btn-primary-600" onClick={openCreate} disabled={loading}>
                        <i className="ri-add-line me-1"/> New Refund
                    </button>
                </div>
            </div>

            {loading && <div className="alert alert-info">Loading refunds...</div>}

            <TableDataLayer
                title="Refunds List"
                headers={tableHeaders}
                data={tableData}
                onView={(row) => onView(row.raw || row)}
                onEdit={(row) => openEdit(row.raw || row)}
                onDelete={(row) => handleDelete(row.raw || row)}
            />

            {/* Create/Edit Modal */}
            {showModal && (<div className="modal-backdrop fade show"></div>)}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog">
                        <div className="modal-content radius-12">
                            <div className="modal-header">
                                <h6 className="modal-title">{form.id ? "Edit Refund" : "Create Refund"}</h6>
                                <button className="btn-close" onClick={() => setShowModal(false)}/>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body two-col">
                                    <div className="mb-3">
                                        <label className="form-label">Order *</label>
                                        <Select
                                            classNamePrefix="select"
                                            isSearchable
                                            isClearable
                                            options={orderOptions}
                                            value={selectedOrderOption}
                                            onChange={(opt) => {
                                                const orderId = opt?.value || "";
                                                const userId = opt?.meta?.userId || form.userId || "";
                                                setForm({ ...form, orderId, userId });
                                            }}
                                            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                            menuPosition="fixed"
                                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                                            formatOptionLabel={(opt) => (
                                                <div className="d-flex align-items-center gap-2">
                                                    {opt.thumb ? (
                                                        <img src={opt.thumb} alt="order" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }} onError={(e) => (e.currentTarget.src = "/assets/images/no-image.png")} />
                                                    ) : (
                                                        <span className="badge bg-neutral-200 text-neutral-700" style={{ width: 24, height: 24, borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                                            <i className="ri-shopping-bag-3-line"/>
                                                        </span>
                                                    )}
                                                    <div className="d-flex flex-column">
                                                        <span>{opt.label}</span>
                                                        <small className="text-muted">{opt.meta?.status} • {opt.meta?.placed}</small>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className={`form-control ${(Number(form.amount) <= 0) ? "is-invalid" : ""}`}
                                            value={form.amount}
                                            onChange={(e) => setForm({...form, amount: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Mode *</label>
                                        <select
                                            className={`form-select ${!form.mode?.trim() ? "is-invalid" : ""}`}
                                            value={form.mode}
                                            onChange={(e) => setForm({...form, mode: e.target.value})}
                                            required
                                        >
                                            <option value="">Select mode</option>
                                            <option value="wallet">Wallet</option>
                                            <option value="bank">Bank</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Status *</label>
                                        <select
                                            className={`form-select ${!form.status?.trim() ? "is-invalid" : ""}`}
                                            value={form.status}
                                            onChange={(e) => setForm({...form, status: e.target.value})}
                                            required
                                        >
                                            <option value="initiated">Initiated</option>
                                            <option value="processed">Processed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                    <div className="mb-3" style={{gridColumn: "1 / -1"}}>
                                        <label className="form-label">Reason *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${(!form.reason?.trim() || form.reason.trim().length < 3) ? "is-invalid" : ""}`}
                                            value={form.reason}
                                            onChange={(e) => setForm({...form, reason: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3" style={{gridColumn: "1 / -1"}}>
                                        <label className="form-label">Notes</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={form.notes}
                                            onChange={(e) => setForm({...form, notes: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-soft-secondary"
                                            onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600" disabled={saving}>
                                        {saving ? (<><span
                                            className="spinner-border spinner-border-sm me-2"/> Saving...</>) : (form.id ? "Save Changes" : "Create Refund")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right"/>
        </MasterLayout>
    );
};

export default RefundsPage;
