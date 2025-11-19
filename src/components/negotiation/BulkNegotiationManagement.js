import React, {useEffect, useState} from 'react';
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {ToastContainer, toast} from "react-toastify";
import Select from 'react-select';
import apiClient from "../../api/client";

const TabButton = ({active, onClick, children}) => (
    <button
        className={`btn btn-sm ${active ? "btn-primary-600 text-white" : "btn-neutral-400"}`}
        onClick={onClick}
        type="button"
    >
        {children}
    </button>
);

const BulkNegotiationManagement = () => {
    const [activeTab, setActiveTab] = useState("pending"); // pending | approved | rejected | counter_offer | all
    const [negotiations, setNegotiations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});
    const [selectedNegotiation, setSelectedNegotiation] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [action, setAction] = useState('');
    const [counterOffer, setCounterOffer] = useState('');
    const [notes, setNotes] = useState('');
    const [businessUsers, setBusinessUsers] = useState([]);
    const [loadingBusinessUsers, setLoadingBusinessUsers] = useState(false);

    // Load negotiations based on active tab
    const loadNegotiations = async () => {
        try {
            setLoading(true);

            let url = '/api/negotiation/admin/all';
            if (activeTab !== 'all') {
                url += `?status=${activeTab}`;
            }

            const response = await apiClient.get(url);
            const data = response.data;

            if (data.success) {
                setNegotiations(data.data || []);
            } else {
                toast.error(data.message || "Failed to load negotiations");
                setNegotiations([]);
            }
        } catch (error) {
            console.error('Error loading negotiations:', error);
            toast.error("Failed to load negotiations");
            setNegotiations([]);
        } finally {
            setLoading(false);
        }
    };

    // Load statistics
    const loadStats = async () => {
        try {
            const response = await apiClient.get('/api/negotiation/admin/all');
            const data = response.data;
            console.log(data.data)

            setStats(data.data || {});

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Load business users for filter
    const loadBusinessUsers = async () => {
        try {
            setLoadingBusinessUsers(true);
            // This would be your API call to get business users
            const response = await apiClient.get('/api/negotiation/admin/all');
            const data = response.data;

            if (data.success) {
                const options = (data.data || []).map(user => ({
                    value: user._id,
                    label: user.companyName || user.name,
                    email: user.email
                }));
                setBusinessUsers(options);
            }
        } catch (error) {
            console.error('Error loading business users:', error);
        } finally {
            setLoadingBusinessUsers(false);
        }
    };

    useEffect(() => {
        loadNegotiations();
        loadStats();
        loadBusinessUsers();
    }, [activeTab]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {class: "bg-warning-focus text-warning-main", text: "Pending"},
            approved: {class: "bg-success-focus text-success-main", text: "Approved"},
            rejected: {class: "bg-danger-focus text-danger-main", text: "Rejected"},
            counter_offer: {class: "bg-info-focus text-info-main", text: "Counter Offer"},
            accepted: {class: "bg-success-focus text-success-main", text: "Accepted"}
        };

        const config = statusConfig[status] || {class: "bg-neutral-400 text-white", text: status};
        return `<span class="px-16 py-4 rounded-pill fw-medium text-sm ${config.class}">${config.text}</span>`;
    };

    // Handle response actions
    const handleResponse = (negotiation, actionType) => {
        setSelectedNegotiation(negotiation);
        setAction(actionType);
        setCounterOffer('');
        setNotes('');
        setShowResponseModal(true);
    };

    const submitResponse = async () => {
        try {
            if (!selectedNegotiation) return;

            const payload = {
                status: action,
                notes: notes || ''
            };

            // Add counter offer amount if it's a counter offer
            if (action === 'counter_offer' && counterOffer) {
                payload.counterOfferAmount = parseFloat(counterOffer);
            }

            const response = await apiClient.put(
                `/api/negotiation/admin/update-status/${selectedNegotiation._id}`,
                payload
            );

            if (response.data.success) {
                toast.success(`Negotiation ${action} successfully`);
                setShowResponseModal(false);
                loadNegotiations();
                loadStats();
            } else {
                toast.error(response.data.message || 'Failed to submit response');
            }
        } catch (error) {
            console.error('Error submitting response:', error);
            toast.error(error.response?.data?.message || 'Failed to submit response');
        }
    };

    // View details
    const viewDetails = (negotiation) => {
        setSelectedNegotiation(negotiation);
        setShowDetailsModal(true);
    };

    // Calculate savings percentage
    const calculateSavings = (currentPrice, proposedPrice) => {
        if (!currentPrice || !proposedPrice) return 0;
        return ((currentPrice - proposedPrice) / currentPrice * 100).toFixed(1);
    };

    // Table configuration
    const headers = ["#", "Business User", "Products", "Current Total", "Proposed Total", "Savings", "Status", "Created Date", "Actions"];

    const rows = negotiations.map((negotiation, idx) => {
        const currentTotal = negotiation.products?.reduce((sum, product) =>
            sum + (product.currentPrice * product.quantity), 0) || 0;
        const proposedTotal = negotiation.totalProposedAmount || 0;
        const savings = currentTotal - proposedTotal;
        const savingsPercent = ((savings / currentTotal) * 100).toFixed(1);

        return {
            "#": idx + 1,
            id: negotiation._id,
            businessuser: negotiation.businessUserId?.companyName || negotiation.businessUserId?.name || 'N/A',
            products: `${negotiation.products?.length || 0} product(s)`,
            currenttotal: formatCurrency(currentTotal),
            proposedtotal: formatCurrency(proposedTotal),
            savings: savings > 0 ?
                `<span class="text-success-main fw-semibold">${savingsPercent}% (${formatCurrency(savings)})</span>` :
                '<span class="text-danger-main">No savings</span>',
            status: getStatusBadge(negotiation.status),
            createddate: formatDate(negotiation.createdAt),
            _raw: negotiation
        };
    });

    // Statistics cards data
    const statCards = [
        {
            title: "Total Negotiations",
            value: stats.total || 0,
            icon: "mdi:handshake-outline",
            color: "primary"
        },
        {
            title: "Pending Review",
            value: stats.pending || 0,
            icon: "mdi:clock-outline",
            color: "warning"
        },
        {
            title: "Approved",
            value: stats.approved || 0,
            icon: "mdi:check-circle-outline",
            color: "success"
        },
        {
            title: "Counter Offers",
            value: stats.counter_offer || 0,
            icon: "mdi:swap-horizontal",
            color: "info"
        }
    ];

    return (
        <div className="container-fluid">
            <Breadcrumb title="Bulk Negotiation Management"/>

            {/* Statistics Cards */}
            <div className="row g-3 mb-24">
                {statCards.map((card, index) => (
                    <div key={index} className="col-xl-3 col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="text-secondary-light mb-8">{card.title}</h6>
                                        <h4 className={`text-${card.color}-main mb-0`}>{card.value}</h4>
                                    </div>
                                    <div
                                        className={`bg-${card.color}-subtle w-48-px h-48-px rounded-circle d-flex align-items-center justify-content-center`}>
                                        <iconify-icon icon={card.icon}
                                                      className={`text-${card.color}-main text-xl`}></iconify-icon>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Bulk Negotiations</h6>
                    <div className="d-flex align-items-center gap-12">
                        {/* Tabs */}
                        <div className="d-flex align-items-center gap-8">
                            <TabButton
                                active={activeTab === "all"}
                                onClick={() => setActiveTab("all")}
                            >
                                All
                            </TabButton>
                            <TabButton
                                active={activeTab === "pending"}
                                onClick={() => setActiveTab("pending")}
                            >
                                Pending
                                {stats.pending > 0 && (
                                    <span className="ms-1 badge bg-danger rounded-pill">
                                        {stats.pending}
                                    </span>
                                )}
                            </TabButton>
                            <TabButton
                                active={activeTab === "approved"}
                                onClick={() => setActiveTab("approved")}
                            >
                                Approved
                            </TabButton>
                            <TabButton
                                active={activeTab === "counter_offer"}
                                onClick={() => setActiveTab("counter_offer")}
                            >
                                Counter Offers
                            </TabButton>
                            <TabButton
                                active={activeTab === "rejected"}
                                onClick={() => setActiveTab("rejected")}
                            >
                                Rejected
                            </TabButton>
                        </div>

                        {/* Refresh Button */}
                        <button
                            className="btn btn-sm btn-primary-600"
                            onClick={loadNegotiations}
                            disabled={loading}
                        >
                            <iconify-icon icon="mdi:refresh" className="text-sm"></iconify-icon>
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-24">
                            <div className="spinner-border text-primary-600" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-12 text-secondary-light">Loading negotiations...</p>
                        </div>
                    ) : negotiations.length === 0 ? (
                        <div className="text-center py-24">
                            <iconify-icon icon="mdi:file-document-outline"
                                          className="text-4xl text-secondary-light mb-12"></iconify-icon>
                            <h6 className="text-secondary-light mb-8">No negotiations found</h6>
                            <p className="text-sm text-secondary-light mb-0">
                                {activeTab === "pending"
                                    ? "No pending negotiation requests at the moment."
                                    : `No ${activeTab} negotiations found.`
                                }
                            </p>
                        </div>
                    ) : (
                        <TableDataLayer
                            headers={headers}
                            data={rows}
                            onView={(row) => viewDetails(row._raw)}
                            onEdit={(row) => {
                                if (row._raw.status === 'pending') {
                                    handleResponse(row._raw, 'approved');
                                }
                            }}
                            onDelete={(row) => {
                                if (row._raw.status === 'pending') {
                                    handleResponse(row._raw, 'rejected');
                                }
                            }}
                            customActions={(row) => {
                                const negotiation = row._raw;
                                return (
                                    <div className="d-flex gap-8">
                                        <button
                                            className="btn btn-sm btn-primary-600"
                                            onClick={() => viewDetails(negotiation)}
                                        >
                                            <iconify-icon icon="mdi:eye-outline" className="text-sm"></iconify-icon>
                                            Details
                                        </button>

                                        {negotiation.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleResponse(negotiation, 'approved')}
                                                >
                                                    <iconify-icon icon="mdi:check" className="text-sm"></iconify-icon>
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-info text-white"
                                                    onClick={() => handleResponse(negotiation, 'counter_offer')}
                                                >
                                                    <iconify-icon icon="mdi:swap-horizontal"
                                                                  className="text-sm"></iconify-icon>
                                                    Counter
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleResponse(negotiation, 'rejected')}
                                                >
                                                    <iconify-icon icon="mdi:close" className="text-sm"></iconify-icon>
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {negotiation.status === 'counter_offer' && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleResponse(negotiation, 'approved')}
                                            >
                                                <iconify-icon icon="mdi:check" className="text-sm"></iconify-icon>
                                                Accept
                                            </button>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedNegotiation && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center"}}
                    >
                        <div className="modal-dialog modal-xl">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h6 className="modal-title">Negotiation Details</h6>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowDetailsModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3 mb-24">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Business User</label>
                                            <p className="mb-0">
                                                {selectedNegotiation.businessUserId?.companyName || selectedNegotiation.businessUserId?.name || 'N/A'}
                                            </p>
                                            <small className="text-secondary-light">
                                                {selectedNegotiation.businessUserId?.email}
                                            </small>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-semibold">Current Total</label>
                                            <h6 className="text-secondary-light mb-0">
                                                {formatCurrency(selectedNegotiation.products?.reduce((sum, product) =>
                                                    sum + (product.currentPrice * product.quantity), 0) || 0)}
                                            </h6>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-semibold">Proposed Total</label>
                                            <h5 className="text-primary-600 mb-0">
                                                {formatCurrency(selectedNegotiation.totalProposedAmount)}
                                            </h5>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Status</label>
                                            <div dangerouslySetInnerHTML={{
                                                __html: getStatusBadge(selectedNegotiation.status)
                                            }}/>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Created Date</label>
                                            <p className="mb-0">{formatDate(selectedNegotiation.createdAt)}</p>
                                        </div>
                                    </div>

                                    <h6 className="mb-16">Products Details</h6>
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Variant</th>
                                                <th>Quantity</th>
                                                <th>Current Price</th>
                                                <th>Proposed Price</th>
                                                <th>Savings</th>
                                                <th>Total Amount</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedNegotiation.products?.map((product, index) => {
                                                const savings = product.currentPrice - product.proposedPrice;
                                                const savingsPercent = calculateSavings(product.currentPrice, product.proposedPrice);

                                                return (
                                                    <tr key={index}>
                                                        <td>{product.productName}</td>
                                                        <td>{product.variantName || 'Standard'}</td>
                                                        <td>{product.quantity}</td>
                                                        <td>{formatCurrency(product.currentPrice)}</td>
                                                        <td className="fw-semibold text-primary-600">
                                                            {formatCurrency(product.proposedPrice)}
                                                        </td>
                                                        <td className={savings > 0 ? "text-success-main fw-semibold" : "text-danger-main"}>
                                                            {savings > 0 ? `${savingsPercent}%` : 'No savings'}
                                                        </td>
                                                        <td className="fw-semibold">
                                                            {formatCurrency(product.totalAmount)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {selectedNegotiation.adminResponse && (
                                        <div className="mt-24">
                                            <h6 className="mb-12">Admin Response</h6>
                                            <div className="alert alert-info">
                                                <div className="d-flex align-items-center gap-8 mb-8">
                                                    <iconify-icon icon="mdi:information-outline"
                                                                  className="text-lg"></iconify-icon>
                                                    <strong>Action: </strong>
                                                    <span
                                                        className="text-capitalize">{selectedNegotiation.status}</span>
                                                </div>
                                                {selectedNegotiation.adminResponse.counterOfferAmount && (
                                                    <div className="mb-8">
                                                        <strong>Counter Offer: </strong>
                                                        {formatCurrency(selectedNegotiation.adminResponse.counterOfferAmount)}
                                                    </div>
                                                )}
                                                {selectedNegotiation.adminResponse.notes && (
                                                    <div>
                                                        <strong>Notes: </strong>
                                                        {selectedNegotiation.adminResponse.notes}
                                                    </div>
                                                )}
                                                <div className="mt-8 text-sm text-secondary-light">
                                                    <strong>Responded on: </strong>
                                                    {formatDate(selectedNegotiation.adminResponse.responseDate)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-neutral-400"
                                        onClick={() => setShowDetailsModal(false)}
                                    >
                                        Close
                                    </button>
                                    {selectedNegotiation.status === 'pending' && (
                                        <div className="d-flex gap-8">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    handleResponse(selectedNegotiation, 'approved');
                                                }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-info text-white"
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    handleResponse(selectedNegotiation, 'counter_offer');
                                                }}
                                            >
                                                Make Counter Offer
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => {
                                                    setShowDetailsModal(false);
                                                    handleResponse(selectedNegotiation, 'rejected');
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {selectedNegotiation.status === 'counter_offer' && (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => {
                                                setShowDetailsModal(false);
                                                handleResponse(selectedNegotiation, 'approved');
                                            }}
                                        >
                                            Accept Counter Offer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Response Modal */}
            {showResponseModal && selectedNegotiation && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center"}}
                    >
                        <div className="modal-dialog modal-md">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h6 className="modal-title">
                                        {action === 'approved' && 'Approve Negotiation'}
                                        {action === 'rejected' && 'Reject Negotiation'}
                                        {action === 'counter_offer' && 'Make Counter Offer'}
                                    </h6>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowResponseModal(false)}
                                    ></button>
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    submitResponse();
                                }}>
                                    <div className="modal-body">
                                        <div className="alert alert-info mb-16">
                                            <strong>Business User: </strong>
                                            {selectedNegotiation.businessUserId?.companyName || selectedNegotiation.businessUserId?.name}<br/>
                                            <strong>Proposed Amount: </strong>
                                            {formatCurrency(selectedNegotiation.totalProposedAmount)}
                                        </div>

                                        {action === 'counter_offer' && (
                                            <div className="mb-16">
                                                <label className="form-label fw-semibold">Counter Offer Amount *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="form-control"
                                                    value={counterOffer}
                                                    onChange={(e) => setCounterOffer(e.target.value)}
                                                    required
                                                    placeholder="Enter counter offer amount"
                                                />
                                                <small className="text-secondary-light">
                                                    Suggested: {formatCurrency(selectedNegotiation.totalProposedAmount * 0.9)} (10%
                                                    less)
                                                </small>
                                            </div>
                                        )}

                                        <div>
                                            <label className="form-label fw-semibold">
                                                {action === 'counter_offer' ? 'Message to Business User' : 'Notes (Optional)'}
                                            </label>
                                            <textarea
                                                className="form-control"
                                                rows="4"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder={
                                                    action === 'counter_offer'
                                                        ? "Explain your counter offer to the business user..."
                                                        : "Add any notes or comments for the business user..."
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-neutral-400"
                                            onClick={() => setShowResponseModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={`btn ${
                                                action === 'approved' ? 'btn-success' :
                                                    action === 'rejected' ? 'btn-danger' :
                                                        'btn-info text-white'
                                            }`}
                                        >
                                            {action === 'approved' && 'Approve Negotiation'}
                                            {action === 'rejected' && 'Reject Negotiation'}
                                            {action === 'counter_offer' && 'Submit Counter Offer'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <ToastContainer position="top-right" autoClose={3000}/>
        </div>
    );
};

export default BulkNegotiationManagement;