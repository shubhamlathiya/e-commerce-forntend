import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import TableDataLayer from "../../components/TableDataLayer";

import Swal from "sweetalert2";
import { listUsers, getUser, patchUserStatus, patchUserRoles, formatDateTime } from "../../api/adminAPI";

const statusBadge = (status) => {
  const key = String(status || "inactive").toLowerCase();
  const map = {
    active: { label: "Active", cls: "bg-green-100 text-green-700" },
    inactive: { label: "Inactive", cls: "bg-red-100 text-red-700" },
    suspended: { label: "Suspended", cls: "bg-gray-100 text-gray-700" },
  };
  const conf = map[key] || { label: status || "Unknown", cls: "bg-gray-100 text-gray-700" };
  return `<span class="badge bg-cyan ${conf.cls}">${conf.label}</span>`;
};

const roleBadge = (role) => {
  const key = String(role || "user").toLowerCase();
  const map = {
    admin: { label: "Admin", cls: "bg-blue-100 text-blue-700" },
    manager: { label: "Manager", cls: "bg-yellow-100 text-yellow-700" },
    user: { label: "User", cls: "bg-teal-100 text-teal-700" },
  };
  const conf = map[key] || { label: role || "Unknown", cls: "bg-gray-100 text-gray-700" };
  return `<span class="badge bg-primary ${conf.cls}">${conf.label}</span>`;
};

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);

  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const headers = ["#", "Name", "Email", "Phone", "Role", "Status", "Created At"];

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listUsers({ page, limit, search, role, status });
      const data = Array.isArray(res?.users) ? res.users : Array.isArray(res) ? res : [];


      setUsers(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, role, status]);

  const tableData = useMemo(() => {
    return users.map((u, idx) => ({
      "#": (page - 1) * limit + idx + 1,
      name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      email: u.email || "",
      phone: u.phone || "",
      role: roleBadge(Array.isArray(u.roles) ? (u.roles[0] || "user") : (u.role || "user")),
      status: statusBadge(u.status),
      createdat: formatDateTime(u.createdAt),
      _id: u.id || u._id,
    }));
  }, [users, page, limit]);

  const onView = async (row) => {
    const id = row?._id;
    if (!id) return;
    try {
      const res = await getUser(id);
      const it = res?.data || res;
      await Swal.fire({
        title: "User Details",
        html: `
          <div class="text-start">
            <p><strong>Name:</strong> ${it?.name || `${it?.firstName || ""} ${it?.lastName || ""}`.trim()}</p>
            <p><strong>Email:</strong> ${it?.email || ""}</p>
            <p><strong>Phone:</strong> ${it?.phone || ""}</p>
            <p><strong>Role:</strong> ${roleBadge(Array.isArray(it?.roles) ? (it.roles[0] || "user") : (it?.role || "user"))}</p>
            <p><strong>Status:</strong> ${statusBadge(it?.status)}</p>
            <p><strong>Created At:</strong> ${formatDateTime(it?.createdAt)}</p>
            <p><strong>Updated At:</strong> ${formatDateTime(it?.updatedAt || it?.updated_at)}</p>
          </div>
        `,
        width: 600,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed to fetch details", text: e?.response?.data?.message || e.message });
    }
  };

  const onEdit = async (row) => {
    const id = row?._id;
    if (!id) return;
    const { value: formValues } = await Swal.fire({
      title: "Update Status",
      html: `
        <div class="text-start">
          <label class="form-label">Status</label>
          <select id="sw-status" class="form-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      customClass: {
        title: "text-md fw-semibold",
        htmlContainer: "text-sm",
        popup: "p-3 rounded-3",
      },
      preConfirm: () => {
        const st = document.getElementById("sw-status").value;
        if (!["active", "inactive", "suspended"].includes(st)) {
          Swal.showValidationMessage("Status must be active, inactive or suspended");
        }
        return { status: st };
      },
      showCancelButton: true,
    });
    if (!formValues) return;
    try {
      await patchUserStatus(id, formValues.status);
      fetchList();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: e?.response?.data?.message || e.message });
    }
  };

  const onDelete = async (row) => {
    const id = row?._id;
    if (!id) return;
    const { value: formValues } = await Swal.fire({
      title: "Update Roles",
      html: `
        <div class="text-start">
          <label class="form-label">Roles</label>
          <select id="sw-roles" class="form-select" multiple>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
          <small class="text-secondary">Hold Ctrl/Command to select multiple</small>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const select = document.getElementById("sw-roles");
        const roles = Array.from(select.selectedOptions).map((o) => o.value);
        const valid = roles.every((r) => ["user", "admin", "manager"].includes(r));
        if (!valid || roles.length === 0) {
          Swal.showValidationMessage("Select one or more valid roles: user, admin, manager");
        }
        return { roles };
      },
      showCancelButton: true,
    });
    if (!formValues) return;
    try {
      await patchUserRoles(id, formValues.roles);
      Swal.fire({ icon: "success", title: "Roles updated" });
      fetchList();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: e?.response?.data?.message || e.message });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);
  };

  return (
    <MasterLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card mb-20">
              <div className="card-header">
                <h5 className="card-title mb-4">Users Management</h5>
                <p className="mb-0 text-secondary-light">Manage all registered users and control access permissions.</p>
              </div>
              <div className="card-body">
                {/* Filters */}
                <div className="row g-3 mb-16 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Search</label>
                    <input
                      className="form-control"
                      placeholder="Search by name or email"
                      value={search}
                      onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}>
                      <option value="">All Roles</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex gap-8">
                    <button className="btn btn-neutral-400" onClick={resetFilters}>Reset Filters</button>
                    <div className="ms-auto pt-8">
                      <span className="text-secondary">{loading ? "Loading…" : `Total: ${users.length}`}</span>
                      {error && <span className="text-danger ms-12">{error}</span>}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-auto">
                  <TableDataLayer
                    title="Users"
                    headers={headers}
                    data={tableData}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    actionLabels={{ view: "View Details", edit: "Update Status", delete: "Update Roles" }}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}

