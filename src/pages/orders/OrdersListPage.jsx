import React, {useEffect, useMemo, useState} from "react";
import Swal from "sweetalert2";
import {useSelector} from "react-redux";
import {useLocation} from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import TableDataLayer from "../../components/TableDataLayer";
import ViewOrderModal from "../../components/modals/ViewOrderModal";
import InvoicePreviewLayer from "../../components/InvoicePreviewLayer";
import { getUser as getAdminUser } from "../../api/adminAPI";
import {
    getUserOrders,
    getAllAdminOrders,
    updateOrderStatus,
    createAdminOrder,
    sendInvoice,
} from "../../api/ordersAPI";
import MasterLayout from "../../masterLayout/MasterLayout";
import InvoicePrintControls from "../../components/InvoicePrintControls";
import EnhancedAddOrderModal from "../../components/modals/AddOrderModal";

// Allowed status progression
const validStatuses = ["processing", "shipped", "delivered", "cancelled"];
const getNextStatuses = (current) => {
  const c = String(current || "").toLowerCase();
  if (c === "delivered" || c === "cancelled") return [];
  if (c === "shipped") return ["delivered", "cancelled"];
  if (c === "processing") return ["shipped", "cancelled"];
  // Any other/unknown states move into processing or allow cancel
  return ["processing", "cancelled"];
};

const isMongoId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id || ""));

// SweetAlert mixin for larger font size
const swalLarge = Swal.mixin({
    customClass: {
        title: "text-md fw-semibold",
        htmlContainer: "text-sm",
    },
});

export default function OrdersListPage() {
    const authUser = useSelector((s) => s?.auth?.user) || JSON.parse(localStorage.getItem("auth_user") || "null");
    const isAdmin = !!(authUser && (authUser.isAdmin || authUser.role === "admin" || authUser.roles?.includes("admin")));
    const location = useLocation();

    const [page] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [, setCreating] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [usersById, setUsersById] = useState({});

    const debouncedSearch = useMemo(() => {
        const s = search.trim();
        return s;
    }, [search]);

    const statusFilter = useMemo(() => {
        const p = location.pathname || "";
        if (p.includes("/orders/pending")) return "pending";
        if (p.includes("/orders/returns")) return "returned";
        return undefined;
    }, [location.pathname]);

    // Fetch user details when admin orders list contains userIds
    useEffect(() => {
        if (!isAdmin) return;
        const ids = Array.from(new Set((Array.isArray(orders) ? orders : [])
            .map((o) => o.userId)
            .filter((id) => isMongoId(id))));
        const missing = ids.filter((id) => !usersById[id]);
        if (!missing.length) return;
        let cancelled = false;
        (async () => {
            try {
                const results = await Promise.all(missing.map((id) => getAdminUser(id).catch(() => null)));
                const map = {};
                results.forEach((res, i) => {
                    const payload = res?.data || res;
                    const user = payload?.user || payload;
                    const key = missing[i];
                    if (user && key) map[key] = user;
                });
                if (!cancelled && Object.keys(map).length) {
                    setUsersById((prev) => ({ ...prev, ...map }));
                }
            } catch (e) { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [orders, isAdmin]);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const api = isAdmin ? getAllAdminOrders : getUserOrders;

                const data = await api({page, limit, search: debouncedSearch, status: statusFilter});
                const items = Array.isArray(data?.data)
                  ? data.data
                  : Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data)
                      ? data
                      : [];
                if (mounted) {

                    setOrders(items);
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Failed to load orders");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => {
            mounted = false;
        };
    }, [page, limit, debouncedSearch, statusFilter, isAdmin]);

    const onView = async (order) => {
        setSelected(order);
        setShowModal(true);
    };

    const onUpdateStatus = async (order) => {
        const current = String(order.status || "").toLowerCase();
        const options = getNextStatuses(current);
        if (!options.length) {
            await Swal.fire({
                icon: "info",
                title: "No further updates",
                text: "This order is already delivered or cancelled.",
                customClass: {
                    title: "text-md fw-semibold",
                    htmlContainer: "text-sm",
                    popup: "p-3 rounded-3",
                },
            });
            return;
        }
        const inputOptions = options.reduce((acc, s) => {
            acc[s] = s.charAt(0).toUpperCase() + s.slice(1);
            return acc;
        }, {});
        const result = await Swal.fire({
            title: "Update Order Status",
            text: `Current status: ${current || "unknown"}`,
            input: "select",
            inputOptions,
            inputPlaceholder: "Select next status",
            showCancelButton: true,
            confirmButtonText: "Update",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                popup: "p-3 rounded-3",
            },
            inputValidator: (value) => {
                if (!value) return "Please select a status";
                if (!validStatuses.includes(value)) return "Invalid status selection";
                // Enforce step-by-step transition only to allowed next statuses
                if (!options.includes(value)) return "Select the next allowed status";
                return undefined;
            },
        });
        if (!result.isConfirmed || !result.value) return;
        const next = result.value;
        try {
            setLoading(true);
            await updateOrderStatus(order._id || order.id, { status: next });
            setOrders((prev) => prev.map((o) => (String(o._id || o.id) === String(order._id || order.id) ? {
                ...o,
                status: next,
            } : o)));
            await swalLarge.fire({
              icon: "success",
              title: "Status Updated",
              html: `<div style="font-size:1.125rem">Order status set to <strong>${next}</strong>.</div>`,
            });
        } catch (err) {
            await swalLarge.fire({ icon: "error", title: "Update Failed", html: `<div style="font-size:1.0625rem">${err.response?.data?.message || err.message || "Failed to update status"}</div>` });
        } finally {
            setLoading(false);
        }
    };

    // removed unused onProcess

    // const onFetchSummary = async () => {
    //     const cartId = window.prompt("Enter Cart ID to fetch summary:");
    //     if (!isMongoId(cartId)) {
    //         return alert("Invalid cartId (must be a 24-char MongoID)");
    //     }
    //     try {
    //         await getOrderSummary({cartId});
    //         alert("Summary fetched");
    //     } catch (err) {
    //         alert(err.response?.data?.message || err.message || "Failed to fetch summary");
    //     }
    // };

    const onCancel = async (order) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Cancel this order?",
            text: "This will set the status to Cancelled.",
            showCancelButton: true,
            confirmButtonText: "Yes, cancel",
            cancelButtonText: "No",
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
            setLoading(true);
            await updateOrderStatus(order._id || order.id, { status: "cancelled" });
            setOrders((prev) => prev.map((o) => (String(o._id || o.id) === String(order._id || order.id) ? {
                ...o,
                status: "cancelled",
            } : o)));
            await swalLarge.fire({ icon: "success", title: "Order Cancelled", html: `<div style="font-size:1.125rem">The order has been <strong>cancelled</strong>.</div>` });
        } catch (err) {
            await swalLarge.fire({ icon: "error", title: "Cancel Failed", html: `<div style="font-size:1.0625rem">${err.response?.data?.message || err.message || "Failed to cancel order"}</div>` });
        } finally {
            setLoading(false);
        }
    };

    const tableHeaders = ["#", "order", "user", "items", "total", "payment", "status", "placed"];
    const tableData = orders.map((o, idx) => {
        const id = o._id || o.id;
        const placedAt = o.placedAt || o.createdAt || o.updatedAt;
        const placedStr = placedAt ? new Date(placedAt).toLocaleString() : "";
        const totalAmount = (o?.totals?.grandTotal ?? o.total ?? o.grandTotal ?? o.amount ?? 0);
        const itemCount = Array.isArray(o.items) ? o.items.length : 0;
        const paymentMethod = o.paymentMethod || o.payment?.method || "—";
        const userName = usersById[o.userId]?.name
            || o.user?.name
            || o.shippingAddress?.name
            || o.billingAddress?.name
            || "Guest";
        return {
            "#": (page - 1) * limit + idx + 1,
            order: o.orderNumber || id,
            user: userName,
            items: itemCount,
            total: `₹${Number(totalAmount || 0).toFixed(2)}`,
            payment: paymentMethod,
            status: <OrderStatusBadge status={o.status || o.payment?.status || "pending"} />,
            placed: placedStr,
            id,
            raw: o,
        };
    });

    return (
        <MasterLayout>
            <Breadcrumb title="Orders / orders" />

            <div className="d-flex align-items-center justify-content-between mb-3">
                <h5>{isAdmin ? "Admin Orders" : "My Orders"}</h5>
                <div className="d-flex gap-2">
                    <input className="form-control" style={{width: 240}} placeholder="Search orders" value={search}
                           onChange={(e) => setSearch(e.target.value)}/>
                    <select className="form-select" style={{width: 120}} value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}>
                        {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
                    </select>
                    {/*<button className="btn btn-outline-secondary" onClick={onFetchSummary}>Fetch Summary</button>*/}
                    {isAdmin && (
                        // <div className="mt-3">
                            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>Add Order</button>
                        // </div>
                    )}
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading && <div className="alert alert-info">Loading orders...</div>}

                <TableDataLayer
                    headers={tableHeaders}
                    data={tableData}
                    onView={(row) => {
                        const raw = row.raw || {};
                        const enriched = usersById[raw.userId] ? { ...raw, user: usersById[raw.userId] } : raw;
                        onView(enriched);
                    }}
                    onEdit={(row) => onUpdateStatus(row.raw)}
                    onDelete={(row) => onCancel(row.raw)}
                    onInvoice={(row) => {
                        const raw = row.raw || {};
                        const enriched = usersById[raw.userId] ? { ...raw, user: usersById[raw.userId] } : raw;
                        setInvoiceOrder(enriched);
                        setShowInvoice(true);
                    }}
                    actionLabels={{ view: "View", edit: "Edit", invoice: "Invoice", delete: "Delete" }}
                />

             <ViewOrderModal show={showModal} onClose={() => setShowModal(false)} order={selected}
                             onGenerateInvoice={() => {
                                const enriched = selected?.user || usersById[selected?.userId]
                                    ? { ...selected, user: selected?.user || usersById[selected?.userId] }
                                    : selected;
                                setInvoiceOrder(enriched);
                                setShowInvoice(true);
                            }}/>



            <EnhancedAddOrderModal
                show={showAdd}
                onClose={() => setShowAdd(false)}
                onSubmit={async (payload) => {
                    try {
                        setCreating(true);
                        await createAdminOrder(payload);
                        setShowAdd(false);
                        // refresh list
                        const api = isAdmin ? getAllAdminOrders : getUserOrders;
                        const data = await api({page, limit, search: debouncedSearch, status: statusFilter});
                        const items = Array.isArray(data?.data)
                          ? data.data
                          : Array.isArray(data?.items)
                            ? data.items
                            : Array.isArray(data)
                              ? data
                              : [];
                        setOrders(items);
                    } catch (err) {
                        alert(err.response?.data?.message || err.message || "Failed to create order");
                    } finally {
                        setCreating(false);
                    }
                }}
            />

            {showInvoice && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className="modal-dialog modal-xl" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Invoice Preview</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowInvoice(false)} />
                                </div>
                                <div className="modal-body">
                                    <div className="mt-3 d-flex justify-content-end">
                                        <InvoicePrintControls
                                            selector="#invoice"
                                            fileName={`invoice-${String(invoiceOrder?._id || invoiceOrder?.id || 'order')}.pdf`}
                                            paperSize="a4"
                                            orientation="portrait"
                                            scale={2}
                                        />
                                    </div>
                                    <InvoicePreviewLayer
                                        order={invoiceOrder}
                                        onSend={async () => {
                                            try {
                                                await sendInvoice(invoiceOrder._id || invoiceOrder.id);
                                                alert('Invoice queued to send');
                                            } catch (err) {
                                                alert(err.response?.data?.message || err.message || 'Failed to send invoice');
                                            }
                                        }}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-outline-dark" onClick={() => setShowInvoice(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </MasterLayout>
    );
}
