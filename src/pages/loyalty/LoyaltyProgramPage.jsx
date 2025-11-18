import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {toast} from "react-hot-toast";
import {listUsers, listOrders} from "../../api/loyaltyApi";
import {
    fetchAccount,
    fetchHistory,
    setSelectedUserId,
    upsertPoints,
    addHistoryTransaction
} from "../../features/loyalty/loyaltySlice";
import MasterLayout from "../../masterLayout/MasterLayout";

const LoyaltyProgramPage = () => {
    const dispatch = useDispatch();
    const {selectedUserId, account, history, loading} = useSelector((s) => s.loyalty || {});

    // User selection
    const [userSearch, setUserSearch] = useState("");
    const [users, setUsers] = useState([]);
    const userOptions = useMemo(() => (Array.isArray(users) ? users : []).map((u) => ({
        value: u._id || u.id,
        label: `${u.name || u.fullName || u.email || u.phone || "User"} (${maskId(u._id || u.id)})`,
    })), [users]);

    const maskId = (id) => {
        const s = String(id || "");
        if (s.length <= 6) return s;
        return `…${s.slice(-6)}`;
    };

    const loadUsers = async () => {
        try {
            const list = await listUsers(userSearch);
            if (Array.isArray(list)) {
                setUsers(list);
            } else if (list && typeof list === 'object') {
                setUsers([list]);
            } else {
                setUsers([]);
            }
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            dispatch(fetchAccount(selectedUserId));
            dispatch(fetchHistory(selectedUserId));
        }
    }, [selectedUserId, dispatch]);

    // Summary inline edit
    const [pointsInput, setPointsInput] = useState("");
    useEffect(() => {
        setPointsInput(account?.points ?? "");
    }, [account]);

    const handleInlineSave = () => {
        if (!selectedUserId) return toast.error("Select a user first");
        const points = Number(pointsInput);
        if (!Number.isInteger(points) || points < 0) return toast.error("Points must be an integer >= 0");
        dispatch(upsertPoints({userId: selectedUserId, points}));
    };

    // Update Points modal
    const [showPointsModal, setShowPointsModal] = useState(false);
    const [modalPoints, setModalPoints] = useState("");
    const openPointsModal = () => {
        setModalPoints(account?.points ?? "");
        setShowPointsModal(true);
    };
    const savePointsModal = (e) => {
        e.preventDefault();
        const points = Number(modalPoints);
        if (!selectedUserId) return toast.error("Select a user first");
        if (!Number.isInteger(points) || points < 0) return toast.error("Points must be an integer >= 0");
        dispatch(upsertPoints({userId: selectedUserId, points})).then((res) => {
            if (res.error) return;
            setShowPointsModal(false);
        });
    };

    // Add Transaction modal
    const [showTxnModal, setShowTxnModal] = useState(false);
    const [orders, setOrders] = useState([]);
    const [txnForm, setTxnForm] = useState({type: "earn", points: "", orderId: "", date: ""});
    const openTxnModal = async () => {
        if (!selectedUserId) return toast.error("Select a user first");
        setTxnForm({type: "earn", points: "", orderId: "", date: ""});
        try {
            const list = await listOrders({userId: selectedUserId, limit: 50});
            setOrders(list);
        } catch (e) { /* ignore */
        }
        setShowTxnModal(true);
    };
    const saveTxn = (e) => {
        e.preventDefault();
        if (!selectedUserId) return toast.error("Select a user first");
        const type = txnForm.type;
        const points = Number(txnForm.points);
        const orderId = txnForm.orderId?.trim();
        const date = txnForm.date?.trim();
        if (!["earn", "redeem"].includes(type)) return toast.error("Type must be earn or redeem");
        if (!Number.isInteger(points) || points < 1) return toast.error("Points must be integer ≥ 1");
        if (orderId && !isValidMongoId(orderId)) return toast.error("Order ID must be a valid ID");
        if (date && Number.isNaN(Date.parse(date))) return toast.error("Date must be a valid ISO date");
        const payload = {
            type,
            points,
            orderId: orderId || undefined,
            date: date ? new Date(date).toISOString() : undefined
        };
        dispatch(addHistoryTransaction({userId: selectedUserId, payload})).then((res) => {
            if (res.error) return;
            setShowTxnModal(false);
            // Refresh account summary (balance) after transaction
            dispatch(fetchAccount(selectedUserId));
        });
    };

    const isValidMongoId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id));

    // Users search debounce-lite
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        setUserSearch(searchInput);
    }, [searchInput]);

    const tableHeaders = ["#", "Type", "Points", "Order", "Date"];
    const tableData = (Array.isArray(history) ? history : []).map((h, idx) => ({
        "#": idx + 1,
        type: h.type === "redeem" ? "<span class='badge rounded-pill bg-danger'>Redeem</span>" : "<span class='badge rounded-pill bg-success'>Earn</span>",
        points: h.points ?? "",
        order: h.order?.number ? `#${h.order.number}` : h.orderId ? maskId(h.orderId) : "-",
        date: h.date ? new Date(h.date).toLocaleString() : h.createdAt ? new Date(h.createdAt).toLocaleString() : "",
        _id: h._id || h.id,
    }));

    return (
        <MasterLayout>
            <Breadcrumb title="Loyalty Program"/>

            <div className="card mb-16">
                <div className="card-body d-flex flex-wrap align-items-end gap-8">
                    <div>
                        <label className="form-label">Search users</label>
                        <div className="d-flex gap-8">
                            <input className="form-control" placeholder="Name, email…" value={searchInput}
                                   onChange={(e) => setSearchInput(e.target.value)} style={{maxWidth: 280}}/>
                            <button className="btn btn-light" onClick={loadUsers}><i className="ri-search-line"/> Search
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Select user *</label>
                        <select className="form-select" value={selectedUserId}
                                onChange={(e) => dispatch(setSelectedUserId(e.target.value))} style={{minWidth: 280}}>
                            <option value="">Select a user…</option>
                            {(Array.isArray(userOptions) ? userOptions : []).map((u) => (
                                <option key={u.value} value={u.value}>{u.label}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-md-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <h6 className="mb-12">User Loyalty Summary</h6>
                            {loading && !account ? (
                                <div>Loading…</div>
                            ) : !selectedUserId ? (
                                <div>Select a user to view summary</div>
                            ) : (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-8">
                                        <span className="text-secondary">Tier</span>
                                        <span
                                            className="badge rounded-pill bg-primary-600">{account?.tier || "Bronze"}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-8">
                                        <span className="text-secondary">Last Updated</span>
                                        <span>{account?.updatedAt ? new Date(account.updatedAt).toLocaleString() : "-"}</span>
                                    </div>
                                    <hr/>
                                    <div className="d-flex align-items-center gap-8 mb-8">
                                        <div className="flex-grow-1">
                                            <label className="form-label">Current Points</label>
                                            <input type="number" className="form-control" min={0} step={1}
                                                   value={pointsInput}
                                                   onChange={(e) => setPointsInput(e.target.value)}/>
                                        </div>
                                        <button className="btn btn-primary-600" onClick={handleInlineSave}>Save</button>
                                    </div>
                                    <button className="btn btn-light" onClick={openPointsModal}><i
                                        className="ri-edit-2-line me-1"/> Update Points
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-12">
                                <h6 className="mb-0">Transaction History</h6>
                                <button className="btn btn-primary-600" onClick={openTxnModal}><i
                                    className="ri-add-line me-1"/> Add Transaction
                                </button>
                            </div>
                            {loading && !history?.length ? (
                                <div>Loading…</div>
                            ) : !selectedUserId ? (
                                <div>Select a user to view transactions</div>
                            ) : history?.length ? (
                                <TableDataLayer title="Transactions" headers={tableHeaders} data={tableData}/>
                            ) : (
                                <div>No transactions found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showPointsModal && (
                <div className="modal fade show" style={{display: "block"}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Update Points</h5>
                                <button className="btn-close" onClick={() => setShowPointsModal(false)}/>
                            </div>
                            <form onSubmit={savePointsModal}>
                                <div className="modal-body">
                                    <label className="form-label">Points *</label>
                                    <input type="number" className="form-control" min={0} step={1} value={modalPoints}
                                           onChange={(e) => setModalPoints(e.target.value)} required/>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowPointsModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showTxnModal && (
                <div className="modal fade show" style={{display: "block"}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Transaction</h5>
                                <button className="btn-close" onClick={() => setShowTxnModal(false)}/>
                            </div>
                            <form onSubmit={saveTxn}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Type *</label>
                                            <select className="form-select" value={txnForm.type}
                                                    onChange={(e) => setTxnForm({...txnForm, type: e.target.value})}
                                                    required>
                                                <option value="earn">earn</option>
                                                <option value="redeem">redeem</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Points *</label>
                                            <input type="number" className="form-control" min={1} step={1}
                                                   value={txnForm.points}
                                                   onChange={(e) => setTxnForm({...txnForm, points: e.target.value})}
                                                   required/>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Order</label>
                                            <select className="form-select" value={txnForm.orderId}
                                                    onChange={(e) => setTxnForm({...txnForm, orderId: e.target.value})}>
                                                <option value="">Select order (optional)</option>
                                                {(orders || []).map((o) => (
                                                    <option key={o.id}
                                                            value={o.id}>{o.number ? `#${o.number}` : maskId(o.id)} — {new Date(o.date).toLocaleDateString()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Date</label>
                                            <input type="datetime-local" className="form-control" value={txnForm.date}
                                                   onChange={(e) => setTxnForm({...txnForm, date: e.target.value})}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowTxnModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MasterLayout>
    );
};

export default LoyaltyProgramPage;
