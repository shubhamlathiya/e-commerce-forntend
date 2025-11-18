import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { listUsers } from "../../api/adminAPI";
import { listAddresses, normalizeList, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "../../api/addressApi";
import AddressModal from "../../components/modals/AddressModal";

export default function UserAddressesPage() {
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [count, setCount] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState({ key: "updatedAt", dir: "desc" });
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [users, setUsers] = useState([]);
  const userOptions = useMemo(() => (Array.isArray(users) ? users : []).map((u) => ({
    value: u._id || u.id,
    label: `${u.name || u.fullName || u.email || u.phone || "User"}`,
  })), [users]);

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Address");
  const [modalInitial, setModalInitial] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  const sortLabel = useMemo(() => `${sort.key}:${sort.dir}`, [sort]);

  const fetchUsers = async () => {
    try {
      const res = await listUsers({ page: 1, limit: 50 });
      const data = Array.isArray(res?.users) ? res.users : Array.isArray(res) ? res : [];
      setUsers(data);
    } catch (e) {
      // Fallback silently; page can still operate without users
      console.error("Failed to load users", e);
    }
  };

  const fetchAddresses = async () => {
    setLoadingList(true);
    setErrorMsg("");
    try {
      const res = await listAddresses({ userId: selectedUserId || undefined, city, country, search, page, limit, sort: sortLabel });
      const { items, count } = normalizeList(res);
      setAddresses(items);
      setCount(count);
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e.message || "Failed to load addresses");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchAddresses(); }, [selectedUserId, city, country, search, page, limit, sortLabel]);

  const onAddNew = () => {
    setModalTitle("Add Address");
    setModalInitial({ userId: selectedUserId || "" });
    setShowModal(true);
  };

  const onEdit = (it) => {
    setModalTitle("Edit Address");
    setModalInitial({
      id: it._id || it.id,
      userId: it.userId || "",
      name: it.name || "",
      phone: it.phone || "",
      address1: (it.address || "").split(", ")[0] || it.address || "",
      address2: (it.address || "").split(", ").slice(1).join(", ") || "",
      city: it.city || "",
      state: it.state || "",
      country: it.country || "",
      pincode: it.pincode || it.postalCode || "",
      isDefault: !!it.isDefault,
    });
    setShowModal(true);
  };

  const onDelete = async (it) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress(it._id || it.id);
      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to delete address");
    }
  };

  const onSetDefault = async (it) => {
    try {
      await setDefaultAddress(it._id || it.id);
      toast.success("Default address updated");
      fetchAddresses();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to set default address");
    }
  };

  const submitModal = async (payload) => {
    setModalLoading(true);
    try {
      if (modalTitle.toLowerCase().includes("edit") && modalInitial?.id) {
        await updateAddress(modalInitial.id, payload);
        toast.success("Address updated successfully");
      } else {
        await createAddress(payload);
        toast.success("Address added successfully");
      }
      setShowModal(false);
      fetchAddresses();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to save address");
    } finally {
      setModalLoading(false);
    }
  };

  const toggleSort = (key) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  };

  const headers = [
    { key: "user", label: "User Name" },
    { key: "address", label: "Address Line" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "pincode", label: "Pincode" },
    { key: "phone", label: "Phone Number" },
    { key: "default", label: "Default" },
    { key: "actions", label: "Actions" },
  ];

  const tableData = (Array.isArray(addresses) ? addresses : []).map((it) => ({
    id: it._id || it.id,
    user: it.userName || it.user?.name || it.userId || "",
    address: it.address || [it.address1, it.address2].filter(Boolean).join(", "),
    city: it.city || "",
    state: it.state || "",
    country: it.country || "",
    pincode: it.pincode || it.postalCode || "",
    phone: it.phone || "",
    default: it.isDefault ? "Yes" : "No",
    raw: it,
  }));

  const pages = Math.max(1, Math.ceil((count || 0) / (limit || 10)));

  return (
    <MasterLayout>
      <Breadcrumb title="User Addresses" />

      <div className="px-16">
        <p className="text-muted mb-12">Manage user shipping addresses</p>

        <div className="d-flex flex-wrap align-items-center justify-content-between mb-16 gap-8">
          <div className="d-flex align-items-center gap-8 flex-wrap">
            <div style={{ minWidth: 280 }}>
              <label className="form-label mb-4">Filter by user</label>
              <Select
                classNamePrefix="react-select"
                isClearable
                isSearchable
                options={userOptions}
                value={(userOptions || []).find((o) => String(o.value) === String(selectedUserId)) || null}
                onChange={(opt) => setSelectedUserId(opt?.value || "")}
              />
            </div>
            <div>
              <label className="form-label mb-4">City</label>
              <input className="form-control" placeholder="Search city" value={city} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 200 }} />
            </div>
            <div>
              <label className="form-label mb-4">Country</label>
              <input className="form-control" placeholder="Search country" value={country} onChange={(e) => setCountry(e.target.value)} style={{ maxWidth: 200 }} />
            </div>
            <div>
              <label className="form-label mb-4">Search</label>
              <input className="form-control" placeholder="Search city, country, or user" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
            </div>
          </div>

          <div>
            <button className="btn btn-primary" onClick={onAddNew}><i className="ri-add-line" /> Add New Address</button>
          </div>
        </div>

        <div className="table-responsive border rounded-3">
          <table className="table mb-0">
            <thead className="table-light">
              <tr>
                {headers.map((h) => (
                  <th key={h.key} role={h.key !== "actions" ? "button" : undefined} onClick={h.key !== "actions" ? () => toggleSort(h.key) : undefined}>
                    {h.label} {sort.key === h.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={headers.length} className="text-center py-16">Loading…</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan={headers.length} className="text-danger py-16">{errorMsg}</td></tr>
              ) : (tableData.length === 0 ? (
                <tr><td colSpan={headers.length} className="text-center py-16">No addresses found</td></tr>
              ) : tableData.map((row) => (
                <tr key={row.id}>
                  <td>{row.user}</td>
                  <td>{row.address}</td>
                  <td>{row.city}</td>
                  <td>{row.state}</td>
                  <td>{row.country}</td>
                  <td>{row.pincode}</td>
                  <td>{row.phone}</td>
                  <td>{row.default}</td>
                  <td>
                    <div className="d-flex gap-8">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(row.raw)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row.raw)}>Delete</button>
                      {!row.raw?.isDefault && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => onSetDefault(row.raw)}>Set Default</button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-12">
          <div className="d-flex align-items-center gap-8">
            <span className="text-muted">Total: {count}</span>
            <select className="form-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ width: 100 }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="d-flex align-items-center gap-8">
            <button className="btn btn-light" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {page} / {pages}</span>
            <button className="btn btn-light" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      <AddressModal
        show={showModal}
        title={modalTitle}
        initial={modalInitial}
        userOptions={userOptions}
        loading={modalLoading}
        onSubmit={submitModal}
        onClose={() => setShowModal(false)}
      />

      <ToastContainer position="top-right" />
    </MasterLayout>
  );
}

