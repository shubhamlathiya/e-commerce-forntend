import React from "react";

export default function OrderSummaryCard({ summary }) {
  if (!summary) return null;
  const { subtotal, tax, shipping, total, itemsCount } = summary;

  return (
    <div className="card mb-3">
      <div className="card-header">Order Summary</div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3"><div className="fw-semibold">Items</div><div>{itemsCount ?? "—"}</div></div>
          <div className="col-md-3"><div className="fw-semibold">Subtotal</div><div>₹{Number(subtotal || 0).toFixed(2)}</div></div>
          <div className="col-md-3"><div className="fw-semibold">Tax</div><div>₹{Number(tax || 0).toFixed(2)}</div></div>
          <div className="col-md-3"><div className="fw-semibold">Shipping</div><div>₹{Number(shipping || 0).toFixed(2)}</div></div>
          <div className="col-md-3"><div className="fw-semibold">Total</div><div className="text-success">₹{Number(total || 0).toFixed(2)}</div></div>
        </div>
      </div>
    </div>
  );
}

