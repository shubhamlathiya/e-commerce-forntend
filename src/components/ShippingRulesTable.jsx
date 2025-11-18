import React, { useMemo, useState } from "react";

export default function ShippingRulesTable({
  items = [],
  loading = false,
  onCreate,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [sortBy, setSortBy] = useState("title"); // title | shippingCost | createdAt
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredItems = useMemo(() => {
    let list = Array.isArray(items) ? items : [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((it) => String(it.title || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      const active = statusFilter === "active";
      list = list.filter((it) => !!it.status === active);
    }
    return list;
  }, [items, search, statusFilter]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = sortBy === "title" ? String(a.title || "").toLowerCase()
        : sortBy === "shippingCost" ? Number(a.shippingCost ?? 0)
        : new Date(a.createdAt || 0).getTime();
      const bv = sortBy === "title" ? String(b.title || "").toLowerCase()
        : sortBy === "shippingCost" ? Number(b.shippingCost ?? 0)
        : new Date(b.createdAt || 0).getTime();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [filteredItems, sortBy, sortDir]);

  const total = sortedItems.length;
  const totalPages = useMemo(() => (limit ? Math.ceil(total / limit) : 1), [total, limit]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return sortedItems.slice(start, start + limit);
  }, [sortedItems, page, limit]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const header = ["#", "Name", "Rate", "Status", "Created At"];
    const rows = sortedItems.map((it, i) => [
      i + 1,
      String(it.title || ""),
      String(it.shippingCost ?? 0),
      it.status ? "Active" : "Inactive",
      it.createdAt ? new Date(it.createdAt).toLocaleString() : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipping_rules_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
        <h6 className="text-lg mb-0">Shipping Rules</h6>
        <div className="d-flex align-items-center gap-8">
          <div className="text-sm text-neutral-600">Count: {total}</div>
          <button className="btn btn-soft-primary" onClick={exportCSV} title="Export CSV">
            <i className="ri-download-2-line me-1" /> Export CSV
          </button>
          {onCreate && (
            <button className="btn btn-primary-600" onClick={onCreate}>
              <i className="ri-add-line me-1" /> Add Rule
            </button>
          )}
        </div>
      </div>

      <div className="card-body p-24">
        <div className="row g-12 mb-16">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-40">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="text-center text-neutral-600 py-24">No data available</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>#</th>
                  <th role="button" onClick={() => toggleSort("title")}>Name {sortBy === "title" && (<i className={`ms-1 ri-arrow-${sortDir === 'asc' ? 'up' : 'down'}-s-line`} />)}</th>
                  <th role="button" onClick={() => toggleSort("shippingCost")}>Rate {sortBy === "shippingCost" && (<i className={`ms-1 ri-arrow-${sortDir === 'asc' ? 'up' : 'down'}-s-line`} />)}</th>
                  <th>Status</th>
                  <th role="button" onClick={() => toggleSort("createdAt")}>Created At {sortBy === "createdAt" && (<i className={`ms-1 ri-arrow-${sortDir === 'asc' ? 'up' : 'down'}-s-line`} />)}</th>
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((it, idx) => (
                  <tr key={String(it._id || it.id || idx)}>
                    <td>{(page - 1) * limit + idx + 1}</td>
                    <td className="fw-medium">{it.title || ""}</td>
                    <td>{Number(it.shippingCost ?? 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${it.status ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                        {it.status ? "Active" : "Inactive"}
                      </span>
                      {onToggleStatus && (
                        <div className="form-check form-switch d-inline-block ms-2 align-middle">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!it.status}
                            onChange={() => onToggleStatus(it)}
                          />
                        </div>
                      )}
                    </td>
                    <td>{it.createdAt ? new Date(it.createdAt).toLocaleString() : ""}</td>
                    <td>
                      <div className="d-flex gap-8">
                        {onEdit && (
                          <button className="btn btn-soft-primary btn-sm" title="Edit" onClick={() => onEdit(it)}>
                            <i className="ri-edit-line" />
                          </button>
                        )}
                        {onDelete && (
                          <button className="btn btn-soft-danger btn-sm" title="Delete" onClick={() => onDelete(it)}>
                            <i className="ri-delete-bin-line" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between mt-16">
          <div className="text-sm text-neutral-600">Page {page} of {Math.max(1, totalPages)}</div>
          <div className="btn-group">
            <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

