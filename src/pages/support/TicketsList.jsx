import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  formatDateTime,
} from "../../api/supportAPI";

const statusBadge = (status) => {
  const key = String(status || "open").toLowerCase();
  const map = {
    open: { label: "Open", cls: "bg-primary-600" },
    in_progress: { label: "In Progress", cls: "bg-warning-600" },
    resolved: { label: "Resolved", cls: "bg-success-600" },
    closed: { label: "Closed", cls: "bg-neutral-600" },
  };
  const conf = map[key] || { label: status || "Unknown", cls: "bg-neutral-600" };
  return `<span class="badge ${conf.cls}">${conf.label}</span>`;
};

const priorityBadge = (priority) => {
  const key = String(priority || "low").toLowerCase();
  const map = {
    high: { label: "High", cls: "bg-danger-600" },
    medium: { label: "Medium", cls: "bg-warning-600" },
    low: { label: "Low", cls: "bg-success-600" },
  };
  const conf = map[key] || { label: priority || "Unknown", cls: "bg-neutral-600" };
  return `<span class="badge ${conf.cls}">${conf.label}</span>`;
};

export default function TicketsList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [scope, setScope] = useState("all"); // all | my
  const isAdmin = (localStorage.getItem("is_admin") || "false") === "true";

  // Form state
  const [form, setForm] = useState({ subject: "", description: "", priority: "low" });

  // Local modals state (UI-only: replace Swal for view/edit)
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editStatus, setEditStatus] = useState("open");
  const [editPriority, setEditPriority] = useState("low");
  const [savingEdit, setSavingEdit] = useState(false);

  const headers = ["#", "Subject", "Priority", "Status", "Created At", "Updated At"];

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTickets({ page, limit, search, status, priority, scope });
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, priority, scope]);

  const tableData = useMemo(() => {
    return items.map((it, idx) => ({
      "#": (page - 1) * limit + idx + 1,
      subject: it.subject || "",
      priority: priorityBadge(it.priority),
      status: statusBadge(it.status),
      createdat: formatDateTime(it.createdAt),
      updatedat: formatDateTime(it.updatedAt || it.updated_at),
      _id: it.id || it._id,
    }));
  }, [items, page, limit]);

  const onView = async (row) => {
    const id = row?._id;
    if (!id) return;
    try {
      const res = await getTicket(id);
      const it = res?.data || res;
      setViewItem(it);
      setShowViewModal(true);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed to fetch details", text: e?.response?.data?.message || e.message });
    }
  };

  const onEdit = async (row) => {
    const id = row?._id;
    if (!id) return;
    try {
      const res = await getTicket(id);
      const it = res?.data || res;
      setEditItem(it);
      setEditStatus(String(it?.status || "open"));
      setEditPriority(String(it?.priority || "low"));
      setShowEditModal(true);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed to open edit", text: e?.response?.data?.message || e.message });
    }
  };

  const submitEdit = async () => {
    if (!editItem?._id && !editItem?.id) return;
    setSavingEdit(true);
    try {
      await updateTicket(editItem._id || editItem.id, { status: editStatus, priority: editPriority });
      setShowEditModal(false);
      setEditItem(null);
      Swal.fire({ icon: "success", title: "Ticket updated" });
      fetchList();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: e?.response?.data?.message || e.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const onDelete = async (row) => {
    if (!isAdmin) {
      Swal.fire({ icon: "error", title: "Delete not allowed", text: "Only admins can delete tickets." });
      return;
    }
    const id = row?._id;
    if (!id) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete this ticket?",
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
      await deleteTicket(id);
      Swal.fire({ icon: "success", title: "Ticket deleted" });
      fetchList();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Delete failed", text: e?.response?.data?.message || e.message });
    }
  };

  const validateForm = () => {
    const { subject, description, priority } = form;
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      Swal.fire({ icon: "error", title: "Subject is required" });
      return false;
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      Swal.fire({ icon: "error", title: "Description is required" });
      return false;
    }
    if (!["low", "medium", "high"].includes(String(priority).toLowerCase())) {
      Swal.fire({ icon: "error", title: "Priority must be low, medium or high" });
      return false;
    }
    return true;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createTicket({ ...form });
      Swal.fire({ icon: "success", title: "Ticket created" });
      setForm({ subject: "", description: "", priority: "low" });
      fetchList();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Creation failed", text: err?.response?.data?.message || err.message });
    }
  };

  return (
    <MasterLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card mb-20">
              <div className="card-header">
                <h5 className="card-title mb-4">Support Tickets</h5>
                <p className="mb-0 text-secondary-light">Manage user and admin support tickets.</p>
              </div>
              <div className="card-body">
                {/* Filters */}
                <div className="row g-3 mb-16">
                  <div className="col-md-3">
                    <input
                      className="form-control"
                      placeholder="Search by subject"
                      value={search}
                      onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    />
                  </div>
                  <div className="col-md-3">
                    <select className="form-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
                      <option value="">All Status</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select" value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }}>
                      <option value="">All Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select" value={scope} onChange={(e) => { setPage(1); setScope(e.target.value); }}>
                      <option value="all">Admin: All Tickets</option>
                      <option value="my">User: My Tickets</option>
                    </select>
                  </div>
                  <div className="col-12 text-end">
                    {loading && <span className="text-secondary">Loading…</span>}
                    {error && <span className="text-danger ms-12">{error}</span>}
                  </div>
                </div>

                {/* Table */}
                <TableDataLayer
                  title="Tickets"
                  headers={headers}
                  data={tableData}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />

              </div>
            </div>

            {/* New Ticket Form */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Create Ticket</h6>
              </div>
              <div className="card-body">
                <form onSubmit={submitForm} className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Subject *</label>
                    <input className="form-control" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Priority *</label>
                    <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Description *</label>
                    <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-primary-600">Submit Ticket</button>
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
                  <h5 className="modal-title">Ticket Details</h5>
                  <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
                </div>
                <div className="modal-body two-col">
                  <div className="col-md-6">
                    <div className="form-text">Subject</div>
                    <div>{viewItem?.subject || "-"}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-text">Status</div>
                    <div dangerouslySetInnerHTML={{ __html: statusBadge(viewItem?.status) }}></div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-text">Priority</div>
                    <div dangerouslySetInnerHTML={{ __html: priorityBadge(viewItem?.priority) }}></div>
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
                    <div className="form-text">Description</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{viewItem?.description || "-"}</div>
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
                  <h5 className="modal-title">Edit Ticket</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body two-col">
                  <div className="col-md-12">
                    <div className="form-text">Status</div>
                    <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <div className="form-text">Priority</div>
                    <select className="form-select" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <div className="form-text">Subject</div>
                    <div>{editItem?.subject || '-'}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-text">Created At</div>
                    <div>{formatDateTime(editItem?.createdAt)}</div>
                  </div>
                  <div className="col-md-12">
                    <hr/>
                    <div className="form-text">Description</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{editItem?.description || '-'}</div>
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
