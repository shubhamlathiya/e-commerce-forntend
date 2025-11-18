import React from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderActionMenu from "./OrderActionMenu";

export default function OrderTable({ items = [], isAdmin, onView, onUpdateStatus, onProcess, loading }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6}>Loading...</td></tr>
          ) : items?.length ? (
            items.map((o) => (
              <tr key={o._id || o.id}>
                <td>{o._id || o.id}</td>
                <td>{new Date(o.createdAt || o.date).toLocaleString()}</td>
                <td>₹{Number(o.total || o.amount || 0).toFixed(2)}</td>
                <td>{o.paymentMethod || o.payment?.method || "—"}</td>
                <td><OrderStatusBadge status={o.status || o.payment?.status || "pending"} /></td>
                <td>
                  <OrderActionMenu
                    isAdmin={!!isAdmin}
                    onView={() => onView?.(o)}
                    onUpdateStatus={() => onUpdateStatus?.(o)}
                    onProcess={(type) => onProcess?.(type, o)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={6}>No orders found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

