
import React from 'react';
import {Icon} from "@iconify/react";

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

const formatAddress = (addr = {}) => {
    const parts = [
        addr.addressLine1 || addr.street,
        addr.city,
        addr.state,
        addr.zip,
        addr.country,
    ].filter(Boolean);
    return parts.join(', ');
};

const formatAddressLines = (addr = {}, maxLen = 42) => {
    const s = formatAddress(addr);
    if (!s) return [];
    if (s.length <= maxLen) return [s];
    const mid = Math.floor(s.length / 2);
    let split = -1;
    const commaLeft = s.lastIndexOf(',', mid);
    const commaRight = s.indexOf(',', mid);
    if (commaLeft !== -1) split = commaLeft + 1;
    else if (commaRight !== -1) split = commaRight + 1;
    if (split === -1) {
        const spaceLeft = s.lastIndexOf(' ', mid);
        const spaceRight = s.indexOf(' ', mid);
        if (spaceLeft !== -1) split = spaceLeft + 1;
        else if (spaceRight !== -1) split = spaceRight + 1;
        else split = mid;
    }
    const l1 = s.slice(0, split).trim();
    const l2 = s.slice(split).trim();
    return [l1, l2];
};

const InvoicePreviewLayer = ({ order, onSend }) => {
    const o = order || {};
    const items = Array.isArray(o.items) ? o.items : [];
    const shipping = o.shippingAddress || {};
    const totals = o.totals || { subtotal: items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0), discount: 0, shipping: 0, tax: 0, grandTotal: 0 };
    const number = o.orderNumber || o.number || (o._id || o.id);
    const placedAt = o.placedAt || o.createdAt || o.updatedAt;
    const placedStr = placedAt ? new Date(placedAt).toLocaleDateString() : '';
    const customerName = o.user?.name || shipping.name || '—';
    const customerEmail = o.user?.email || '—';
    const customerPhone = shipping.phone || o.user?.phone || '—';
    const paymentMethod = o.paymentMethod || o.payment?.method || '—';
    const paymentStatus = o.paymentStatus || o.payment?.status || o.status || '—';
    const addressLines = formatAddressLines(shipping);
    return (
        <div className="card">
            <div className="card-header">
                <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
                    <button type="button" className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1" onClick={onSend}>
                        <Icon icon="pepicons-pencil:paper-plane" className="text-xl" />
                        Send Invoice
                    </button>
                </div>
            </div>
            <div className="card-body py-40 invoice-card" >
                <div className="row justify-content-center" id="invoice">
                    <div className="col-lg-8">
                        <div className="radius-8" id="invoice-card" >
                            <div className="p-20 d-flex flex-wrap justify-content-between gap-3 border-bottom">
                                <div>
                                    <h3 className="text-xl">Invoice #{String(number || '').slice(-6)}</h3>
                                    <p className="mb-1 text-sm">Date Issued: {placedStr}</p>
                                    <p className="mb-0 text-sm">Date Due: {placedStr}</p>
                                </div>
                                <div>
                                    <img src="assets/images/logo.png" alt="image_icon" className="mb-8" />
                                    <p className="mb-1 text-sm">
                                        4517 Washington Ave. Manchester, Kentucky 39495
                                    </p>
                                    <p className="mb-0 text-sm">random@gmail.com, +1 543 2198</p>
                                </div>
                            </div>
                            <div className="py-28 px-20">
                                <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                                    <div>
                                        <h6 className="text-md">Issued For:</h6>
                                        <table className="text-sm text-secondary-light">
                                            <tbody>
                                                <tr>
                                                    <td>Name</td>
                                                    <td className="ps-8">:{customerName}</td>
                                                </tr>
                                                <tr>
                                                    <td>Address</td>
                                                    <td className="ps-8">:
                                                        {addressLines.length <= 1 ? (
                                                            addressLines[0] || '—'
                                                        ) : (
                                                            <>
                                                                <span>{addressLines[0]}</span>
                                                                <br />
                                                                <span>{addressLines[1]}</span>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Phone number</td>
                                                    <td className="ps-8">:{customerPhone}</td>
                                                </tr>
                                                <tr>
                                                    <td>Email</td>
                                                    <td className="ps-8">:{customerEmail}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <table className="text-sm text-secondary-light">
                                            <tbody>
                                                <tr>
                                                    <td>Issus Date</td>
                                                    <td className="ps-8">:{placedStr}</td>
                                                </tr>
                                                <tr>
                                                    <td>Order Number</td>
                                                    <td className="ps-8">:{String(o.orderNumber || o.number || o._id || o.id || '—')}</td>
                                                </tr>
                                                <tr>
                                                    <td>Shipment ID</td>
                                                    <td className="ps-8">:—</td>
                                                </tr>
                                                <tr>
                                                    <td>Payment</td>
                                                    <td className="ps-8">:{paymentMethod}</td>
                                                </tr>
                                                <tr>
                                                    <td>Status</td>
                                                    <td className="ps-8">:{String(paymentStatus).toUpperCase()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-24">
                                    <div className="table-responsive scroll-sm">
                                        <table className="table bordered-table text-sm">
                                            <thead>
                                                <tr>
                                                    <th scope="col" className="text-sm">
                                                        SL.
                                                    </th>
                                                    <th scope="col" className="text-sm">
                                                        Items
                                                    </th>
                                                    <th scope="col" className="text-sm">
                                                        Qty
                                                    </th>
                                                    <th scope="col" className="text-sm">
                                                        Units
                                                    </th>
                                                    <th scope="col" className="text-sm">
                                                        Unit Price
                                                    </th>
                                                    <th scope="col" className="text-end text-sm">
                                                        Price
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((it, idx) => (
                                                    <tr key={idx}>
                                                        <td>{String(idx + 1).padStart(2, '0')}</td>
                                                        <td>{it.name || it.title || it.sku || '—'}</td>
                                                        <td>{it.quantity || it.qty || 1}</td>
                                                        <td>PC</td>
                                                        <td>{currency(it.price || 0)}</td>
                                                        <td className="text-end">{currency((it.price || 0) * (it.quantity || 1))}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex flex-wrap justify-content-between gap-3">
                                        <div>
                                            <p className="text-sm mb-0">
                                                <span className="text-primary-light fw-semibold">
                                                    Sales By:
                                                </span>{" "}
                                                Admin
                                            </p>
                                            <p className="text-sm mb-0">Thanks for your business</p>
                                        </div>
                                        <div>
                                            <table className="text-sm">
                                                <tbody>
                                                    <tr>
                                                        <td className="pe-64">Subtotal:</td>
                                                        <td className="pe-16">
                                                            <span className="text-primary-light fw-semibold">
                                                                {currency(totals.subtotal || 0)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="pe-64">Discount:</td>
                                                        <td className="pe-16">
                                                            <span className="text-primary-light fw-semibold">
                                                                {currency(totals.discount || 0)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="pe-64 border-bottom pb-4">Tax:</td>
                                                        <td className="pe-16 border-bottom pb-4">
                                                            <span className="text-primary-light fw-semibold">
                                                                {currency(totals.tax || 0)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="pe-64 pt-4">
                                                            <span className="text-primary-light fw-semibold">
                                                                Total:
                                                            </span>
                                                        </td>
                                                        <td className="pe-16 pt-4">
                                                            <span className="text-primary-light fw-semibold">
                                                                {currency(totals.grandTotal || totals.total || 0)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-64">
                                    <p className="text-center text-secondary-light text-sm fw-semibold">
                                        Thank you for your purchase!
                                    </p>
                                </div>
                                <div className="d-flex flex-wrap justify-content-between align-items-end mt-64">
                                    <div className="text-sm border-top d-inline-block px-12">
                                        Signature of Customer
                                    </div>
                                    <div className="text-sm border-top d-inline-block px-12">
                                        Signature of Authorized
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default InvoicePreviewLayer;
