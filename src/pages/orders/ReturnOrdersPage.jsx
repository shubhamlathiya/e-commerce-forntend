import React, { useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { listRefunds, getRefund, updateRefund, deleteRefund } from "../../api/refundsApi";

const ReturnOrdersPage = () => {

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode] = useState("");
  const [items, setItems] = useState([]);
  const [ setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [showModal, setShowModal] = useState(false);


  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRefunds({ search, status, mode });
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setItems(data);

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load return orders");
    } finally {
      setLoading(false);
    }
  };


  const statusBadge = (s) => {
    const map = {
      requested: "bg-warning-600",
      approved: "bg-primary-600",
      rejected: "bg-danger-600",
      refunded: "bg-success-600",
      initiated: "bg-warning-600",
      processed: "bg-primary-600",
      failed: "bg-danger-600",
    };
    const cls = map[s] || "bg-neutral-400";
    return `<span class='badge ${cls} rounded-pill'>${String(s || "-")}</span>`;
  };

  const headers = ["#", "return", "order", "user", "amount", "mode", "status", "created"];
  const data = items.map((r, idx) => ({
    "#":  idx + 1,
    return: r.returnId || "-",
    order: r.orderId || "-",
    user: r.userId || "-",
    amount: `₹${Number(r.amount || 0).toFixed(2)}`,
    mode: r.mode || "-",
    status: statusBadge(r.status),
    created: r.createdAt ? new Date(r.createdAt).toLocaleString() : (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ""),
    id: r._id || r.id,
  }));

  const onView = async (row) => {
    try {
      const res = await getRefund(row.id);
      const item = res?.data || res;
      setCurrent(item);
      setShowModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load details");
    }
  };

  const onEdit = async (row) => {
    const nextStatus = window.prompt("Enter status (initiated, processed, failed):", "processed");
    if (!nextStatus) return;
    try {
      await updateRefund(row.id, { status: nextStatus });
      toast.success("Status updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update");
    }
  };

  const onDelete = async (row) => {
    const confirm = await Swal.fire({
      title: "Delete Record",
      text: "Are you sure you want to delete this refund record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
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
      await deleteRefund(row.id);
      toast.info("Record deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete");
    }
  };

  return (
    <MasterLayout>
      <Breadcrumb title="Orders / returns" />
      <div className="card h-100 p-0 radius-12">
        <div className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
          <h6 className="text-lg mb-0">Return Orders</h6>
          <div className="d-flex gap-2">
            <input className="form-control" style={{ width: 240 }} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="form-select" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="refunded">Refunded</option>
              <option value="initiated">Initiated</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
            </select>

          </div>
        </div>

        <div className="card-body p-24">
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          <TableDataLayer headers={headers} data={data} onView={onView} onEdit={onEdit} onDelete={onDelete} />

        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="modal-dialog">
              <div className="modal-content radius-12">
                <div className="modal-header">
                  <h6 className="modal-title">Refund Details</h6>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  {current ? (
                    <div className="d-flex flex-column gap-2">
                      <div><strong>ID:</strong> {current._id || current.id}</div>
                      <div><strong>Order:</strong> {current.orderId || "-"}</div>
                      <div><strong>User:</strong> {current.userId || "-"}</div>
                      <div><strong>Return:</strong> {current.returnId || "-"}</div>
                      <div><strong>Mode:</strong> {current.mode || "-"}</div>
                      <div><strong>Amount:</strong> ₹{Number(current.amount || 0).toFixed(2)}</div>
                      <div><strong>Status:</strong> {current.status || "-"}</div>
                      <div><strong>Created:</strong> {current.createdAt ? new Date(current.createdAt).toLocaleString() : ""}</div>
                    </div>
                  ) : (
                    <div className="text-muted">No data</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-neutral-400" onClick={() => setShowModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover draggable />
    </MasterLayout>
  );
};

export default ReturnOrdersPage;

