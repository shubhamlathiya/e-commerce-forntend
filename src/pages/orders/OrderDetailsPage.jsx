import React, {useEffect, useState} from "react";
import {useParams, Link} from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import {getOrderById} from "../../api/ordersAPI";
import MasterLayout from "../../masterLayout/MasterLayout";

export default function OrderDetailsPage() {
    const {id} = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getOrderById(id);
                if (mounted) setOrder(data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Failed to load order");
            } finally {
                setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [id]);

    const o = order || {};
    const items = Array.isArray(o.items) ? o.items : [];
    const shipping = o.shippingAddress || o.shipping || {};
    const billing = o.billingAddress || o.billing || {};

    return (
        <MasterLayout>

            <Breadcrumb title={`Orders / Order ${id}`} />
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h4>Order Details</h4>
                <Link to="/orders" className="btn btn-outline-secondary">Back to Orders</Link>
            </div>

            {loading && <div className="alert alert-info">Loading...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
                <div className="row g-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <div><strong>Order ID:</strong> {o._id || id}</div>
                                        <div><strong>Date:</strong> {new Date(o.createdAt || o.date).toLocaleString()}
                                        </div>
                                        <div><strong>Payment
                                            Method:</strong> {o.paymentMethod || o.payment?.method || "—"}</div>
                                    </div>
                                    <div>
                                        <OrderStatusBadge status={o.status || o.payment?.status || "pending"}/>
                                        <div className="mt-2">
                                            <strong>Total:</strong> ₹{Number(o.total || o.amount || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">Shipping Address</div>
                            <div className="card-body">
                                <div>{shipping.name}</div>
                                <div>{shipping.addressLine1}</div>
                                <div>{shipping.addressLine2}</div>
                                <div>{shipping.city} {shipping.state} {shipping.zip}</div>
                                <div>{shipping.country}</div>
                                <div>{shipping.phone}</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-header">Billing Address</div>
                            <div className="card-body">
                                <div>{billing.name}</div>
                                <div>{billing.addressLine1}</div>
                                <div>{billing.addressLine2}</div>
                                <div>{billing.city} {billing.state} {billing.zip}</div>
                                <div>{billing.country}</div>
                                <div>{billing.phone}</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">Items</div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {items.map((it, idx) => {
                                            const rawImg = it.image || it.thumbnail || "";
                                            const base = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
                                            const s = String(rawImg || "");
                                            const imgUrl = s
                                                ? (s.startsWith("http") || s.startsWith("data:")
                                                    ? s
                                                    : `${base}${s.startsWith("/") ? s : `/${s}`}`)
                                                : "/assets/images/no-image.png";
                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        <img
                                                            src={imgUrl}
                                                            alt="item"
                                                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }}
                                                            onError={(e) => (e.currentTarget.src = "/assets/images/no-image.png")}
                                                        />
                                                    </td>
                                                    <td>{it.name || it.title}</td>
                                                    <td>{it.quantity || it.qty}</td>
                                                    <td>₹{Number(it.price || 0).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 d-flex justify-content-end">
                        <button className="btn btn-secondary" disabled>
                            <i className="pi pi-file-pdf me-2"/> Generate Invoice
                        </button>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
}
