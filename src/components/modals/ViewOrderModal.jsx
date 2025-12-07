import React from "react";

export default function ViewOrderModal({ show, onClose, order, onGenerateInvoice }) {
  if (!show) return null;
  const o = order || {};
  const shipping = o.shippingAddress || o.shipping || {};
  const billing = o.billingAddress || o.billing || {};
  const items = Array.isArray(o.items) ? o.items : [];
  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Order Details</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <h6 className="mb-2">Shipping Address</h6>
                  <div>{shipping.name}</div>
                  <div>{shipping.addressLine1}</div>
                  <div>{shipping.addressLine2}</div>
                  <div>{shipping.city} {shipping.state} {shipping.zip}</div>
                  <div>{shipping.country}</div>
                  <div>{shipping.phone}</div>
                </div>
                <div className="col-md-6">
                  <h6 className="mb-2">Billing Address</h6>
                  <div>{billing.name}</div>
                  <div>{billing.addressLine1}</div>
                  <div>{billing.addressLine2}</div>
                  <div>{billing.city} {billing.state} {billing.zip}</div>
                  <div>{billing.country}</div>
                  <div>{billing.phone}</div>
                </div>

                <div className="col-12">
                  <h6 className="mb-2">Items</h6>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          {/*<th>Image</th>*/}
                          <th>Name</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const rawImg = it.image || it.thumbnail || "";
                          const base = ("https://g2.brandinsa.com").replace(/\/$/, "");
                          const s = String(rawImg || "");
                          const imgUrl = s
                            ? (s.startsWith("http") || s.startsWith("data:")
                                ? s
                                : `${base}${s.startsWith("/") ? s : `/${s}`}`)
                            : "/assets/images/no-image.png";
                          return (
                            <tr key={idx}>
                              {/*<td>*/}
                              {/*  <img*/}
                              {/*    src={imgUrl}*/}
                              {/*    alt="item"*/}
                              {/*    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }}*/}
                              {/*    onError={(e) => (e.currentTarget.src = "/assets/images/no-image.png")}*/}
                              {/*  />*/}
                              {/*</td>*/}
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

                <div className="col-12">
                  <h6 className="mb-2">Payment & Delivery</h6>
                  <div>Payment Method: {o.paymentMethod || o.payment?.method || "—"}</div>
                  <div>Payment Status: {o.payment?.status || o.status || "—"}</div>
                  <div>Delivery Status: {o.deliveryStatus || o.fulfillmentStatus || "—"}</div>
                </div>

                {o.notes && (
                  <div className="col-12">
                    <h6 className="mb-2">Order Notes</h6>
                    <div className="text-muted">{o.notes}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onGenerateInvoice}>
                <i className="pi pi-file-pdf me-2" /> Generate Invoice
              </button>
              <button className="btn btn-outline-dark" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
