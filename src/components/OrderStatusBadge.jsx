import React from "react";

const STATUS_MAP = {
  pending: { label: "Pending", cls: "bg-neutral-600" },
  processing: { label: "Processing", cls: "bg-primary-600" },
  paid: { label: "Paid", cls: "bg-success-600" },
  failed: { label: "Failed", cls: "bg-danger-600" },
  shipped: { label: "Shipped", cls: "bg-info-600" },
  delivered: { label: "Delivered", cls: "bg-success-700" },
  cancelled: { label: "Cancelled", cls: "bg-danger-700" },
  returned: { label: "Returned", cls: "bg-warning-700" },
  replacement_requested: { label: "Replacement", cls: "bg-warning-600" },
};

export default function OrderStatusBadge({ status }) {
  const key = String(status || "pending").toLowerCase();
  const conf = STATUS_MAP[key] || { label: status || "Unknown", cls: "bg-neutral-600" };
  return <span className={`badge ${conf.cls}`}>{conf.label}</span>;
}

