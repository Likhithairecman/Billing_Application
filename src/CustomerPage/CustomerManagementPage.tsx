import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import {
  FiPlus,
  FiEye,
  FiEdit,
  FiPhone,
  FiMail,
  FiSearch,
} from "react-icons/fi";

import { useDashboard } from "../DashboardPage/DashboardContext";
import type { CustomerType } from "../DashboardPage/DashboardContext";
import "./CustomerManagement.css";



type ViewMode = "list" | "add" | "edit" | "view";


export default function CustomerManagement() {
  const {
    customers,
    userRole,
    addCustomer,
    updateCustomer,
    removeCustomer,

  } = useDashboard();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending" | "blocked" | "frequent"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | CustomerType>("all");
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    customerType: "Individual" as CustomerType,
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstTaxId: "",
    panNumber: "",
    creditLimit: 0,
    // POC
    pocName: "",
    pocDesignation: "",
    pocContact: "",
  });

  // Get selected customer data
  const customer = useMemo(
    () => customers.find((c) => c.id === selectedCustomer),
    [customers, selectedCustomer]
  );

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.customerId.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.customerType === typeFilter);
    }

    if (statusFilter === "pending") {
      filtered = filtered.filter((c) => {
        const pendingDues = c.purchaseHistory.reduce(
          (sum, inv) => sum + (inv.amount - inv.paid),
          0
        );
        return pendingDues > 0 || c.creditUsed > 0;
      });
    } else if (statusFilter === "frequent") {
      filtered = filtered.filter((c) => c.purchaseHistory.length >= 5);
    } else if (statusFilter === "blocked") {
      filtered = filtered.filter((c) => c.isBlocked);
    } else if (statusFilter === "active") {
      filtered = filtered.filter((c) => {
        const pendingDues = c.purchaseHistory.reduce(
          (sum, inv) => sum + (inv.amount - inv.paid),
          0
        );
        return !c.isBlocked && pendingDues <= 0;
      });
    }

    return filtered;
  }, [customers, searchQuery, statusFilter, typeFilter]);

  // Calculate pending dues for a customer
  const getPendingDues = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return 0;
    return cust.purchaseHistory.reduce(
      (sum, inv) => sum + (inv.amount - inv.paid),
      0
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      alternatePhone: "",
      customerType: "Individual",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstTaxId: "",
      panNumber: "",
      creditLimit: 0,
      pocName: "",
      pocDesignation: "",
      pocContact: "",
    });
  };

  // Handle form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const commonData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone.trim(),
      customerType: formData.customerType,
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      gstTaxId: formData.customerType === "Business" ? formData.gstTaxId.trim() : undefined,
      panNumber: formData.panNumber.trim(),
      pocName: formData.pocName.trim(),
      pocDesignation: formData.pocDesignation.trim(),
      pocContact: formData.pocContact.trim(),
    };

    if (viewMode === "add") {
      const newId = addCustomer({
        ...commonData,
        creditLimit: userRole === "Admin" ? formData.creditLimit : 0,
        creditUsed: 0,
        isBlocked: false,
        purchaseHistory: [],
        creditRewards: 0,
        loans: [],
      });
      // Remain on page, switch to edit mode to prevent duplicates
      setSelectedCustomer(newId);
      setViewMode("edit");
      alert("Customer saved successfully. You can now add a loan or go back.");
      // Do NOT resetForm() or setViewMode("list")
    } else if (viewMode === "edit" && selectedCustomer) {
      updateCustomer(selectedCustomer, {
        ...commonData,
        creditLimit: userRole === "Admin" ? formData.creditLimit : customer?.creditLimit || 0,
      });
      resetForm();
      setViewMode("list");
      setSelectedCustomer(null);
    }
  };

  // Handle edit click
  const handleEdit = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setSelectedCustomer(customerId);
      setFormData({
        name: cust.name,
        phone: cust.phone,
        alternatePhone: cust.alternatePhone || "",
        customerType: cust.customerType,
        email: cust.email,
        address: cust.address,
        city: cust.city || "",
        state: cust.state || "",
        pincode: cust.pincode || "",
        gstTaxId: cust.gstTaxId || "",
        panNumber: cust.panNumber || "",
        creditLimit: cust.creditLimit,
        pocName: cust.pocName || "",
        pocDesignation: cust.pocDesignation || "",
        pocContact: cust.pocContact || "",
      });
      setViewMode("edit");
    }
  };

  // Handle view click
  const handleView = (customerId: string) => {
    setSelectedCustomer(customerId);
    setViewMode("view");
  };

  // Handle delete
  const handleDelete = (customerId: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      removeCustomer(customerId);
    }
  };

  // Handle add new
  const handleAddNew = () => {
    resetForm();
    setSelectedCustomer(null);
    setViewMode("add");
  };

  // Handle back
  const handleBack = () => {
    resetForm();
    setSelectedCustomer(null);
    setViewMode("list");
  };


  // Render List View
  if (viewMode === "list") {
    return (
      <>
        <section className="page-hero panel" style={{ alignItems: 'center' }}>
          <div className="filter-group wide" style={{ flex: 1, marginBottom: 0 }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', color: '#6b7280', fontSize: '14px', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name, phone, or customer ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'white', width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>
          <div className="hero-actions">
            {(userRole === "Admin" || userRole === "Staff") && (
              <>
                <button className="primary-btn" onClick={handleAddNew}>
                  <FiPlus />
                  Add Customer
                </button>

                <button
                  className="primary-btn"
                  style={{ background: "white", color: "var(--primary)", border: "1px solid var(--primary)", boxShadow: "none" }}
                  onClick={() => navigate("/loan-recovery")}
                >
                  <FiPlus />
                  Loan Recovery
                </button>

                <button
                  className="primary-btn"
                  style={{ background: "white", color: "var(--primary)", border: "1px solid var(--primary)", boxShadow: "none" }}
                  onClick={() => navigate("/view-history")}
                >
                  <FiEye />
                  View History
                </button>
              </>
            )}
          </div>
        </section>

        <section className="panel filter-panel" style={{ marginTop: 0 }}>
          <div className="filter-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="filter-group">
              <label>Customer type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | CustomerType)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="all">All Customers</option>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "pending" | "frequent"
                  )
                }
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending dues</option>
                <option value="frequent">Frequent customers</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel list-panel">
          <div className="panel-header">
            <div>
              <h3>Customer List</h3>
              <p className="muted">Track balances and quick actions</p>
            </div>
            <div className="pill stat-pill">
              Total customers: {filteredCustomers.length.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="table-wrapper customer-table-wrapper">
            <table className="customer-table modern">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Loan Status</th>
                  <th>Pending Dues</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => {
                    const pendingDues = getPendingDues(customer.id);
                    const hasActiveLoan = customer.loans && customer.loans.some(l => l.status === "active");
                    const loanStatusLabel = hasActiveLoan ? "Loan Taken" : "Not Taken";
                    const loanStatusClass = hasActiveLoan ? "warning" : "success";

                    return (
                      <tr key={customer.id}>
                        <td>{index + 1}</td>
                        <td className="mono">{customer.customerId}</td>
                        <td className="customer-cell">
                          <div className="customer-name">{customer.name}</div>
                          <div className="customer-subtext">
                            {[customer.city, customer.state].filter(Boolean).join(", ") || customer.address || "No address"}
                          </div>
                        </td>
                        <td>
                          <span className="pill soft">{customer.customerType}</span>
                        </td>
                        <td className="contact-cell">
                          <span className="contact-row">
                            <FiPhone /> {customer.phone}
                          </span>
                          <span className="contact-row">
                            <FiMail /> {customer.email}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${loanStatusClass}`}>{loanStatusLabel}</span>
                        </td>
                        <td>
                          {pendingDues > 0 ? (
                            <span className="text-danger">₹{pendingDues.toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-success">₹0</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-view" onClick={() => handleView(customer.id)}>
                              View
                            </button>
                            {(userRole === "Admin" || userRole === "Staff") && (
                              <button className="btn-edit" onClick={() => handleEdit(customer.id)}>
                                Edit
                              </button>
                            )}
                            {userRole === "Admin" && (
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(customer.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  // Render Add/Edit Form
  if (viewMode === "add" || viewMode === "edit") {
    return (
      <>
        <section className="panel">
          <div className="panel-header">
            <h3>{viewMode === "add" ? "Add Customer" : "Edit Customer"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            {/* Basic Details */}
            <div className="form-section-title">Basic Details</div>

            <div className="form-row">
              <label>
                <span>Name <span className="required">*</span></span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter customer name"
                  required
                />
              </label>
              <label>
                <span>Email <span className="required">*</span></span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="customer@email.com"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Phone <span className="required">*</span></span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                  required
                />
              </label>
              <label>
                <span>Alternate Phone</span>
                <input
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) =>
                    setFormData({ ...formData, alternatePhone: e.target.value })
                  }
                  placeholder="Optional alternate number"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <span>Customer Type <span className="required">*</span></span>
                <select
                  value={formData.customerType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerType: e.target.value as CustomerType,
                      gstTaxId: e.target.value === "Individual" ? "" : formData.gstTaxId,
                    })
                  }
                  required
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                </select>
              </label>
              <label>
                <span>Credit Limit (₹)</span>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditLimit: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="50000"
                  min={0}
                  disabled={userRole !== "Admin"}
                />
              </label>
            </div>

            {/* Address Details */}
            <hr className="form-divider" />
            <div className="form-section-title">Address Information</div>

            <div className="form-row">
              <label className="full-width">
                <span>Street Address</span>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="#123, Street Name"
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                <span>City</span>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="City"
                />
              </label>
              <label>
                <span>State</span>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="State"
                />
              </label>
              <label>
                <span>Pincode</span>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  placeholder="123456"
                />
              </label>
            </div>

            {/* Tax Info */}
            <hr className="form-divider" />
            <div className="form-section-title">Tax Information</div>

            <div className="form-row">
              <label>
                <span>PAN Number</span>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </label>
              {formData.customerType === "Business" ? (
                <label>
                  <span>GST/Tax ID <span className="required">*</span></span>
                  <input
                    type="text"
                    value={formData.gstTaxId}
                    onChange={(e) =>
                      setFormData({ ...formData, gstTaxId: e.target.value })
                    }
                    placeholder="GST123456789"
                    required
                  />
                </label>
              ) : (
                <div /> /* Placeholder for 3rd column if business info not present */
              )}
            </div>

            {/* POC Info - New Section */}
            <hr className="form-divider" />
            <div className="form-section-title">Point of Contact (POC)</div>

            <div className="form-row">
              <label>
                <span>POC Name</span>
                <input
                  type="text"
                  value={formData.pocName}
                  onChange={(e) =>
                    setFormData({ ...formData, pocName: e.target.value })
                  }
                  placeholder="POC Name"
                />
              </label>
              <label>
                <span>POC Designation</span>
                <input
                  type="text"
                  value={formData.pocDesignation}
                  onChange={(e) =>
                    setFormData({ ...formData, pocDesignation: e.target.value })
                  }
                  placeholder="Manager, etc."
                />
              </label>
              <label>
                <span>POC Phone</span>
                <input
                  type="tel"
                  value={formData.pocContact}
                  onChange={(e) =>
                    setFormData({ ...formData, pocContact: e.target.value })
                  }
                  placeholder="POC Mobile"
                />
              </label>
            </div>

            <div className="form-actions display-flex-end">
              <button type="button" className="secondary-btn" onClick={handleBack}>
                Back
              </button>
              <button type="submit" className="primary-btn">
                {viewMode === "add" ? "Save Customer" : "Update Customer"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                style={{ marginLeft: 8 }}
                onClick={() =>
                  navigate("/create-loan", {
                    state: {
                      customer: {
                        id: selectedCustomer, // Pass the ID here
                        name: formData.name,
                        phone: formData.phone,
                        customerType: formData.customerType,
                        email: formData.email,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        gstTaxId: formData.gstTaxId,
                        panNumber: formData.panNumber,
                        creditLimit: formData.creditLimit,
                        loans: [],
                        customer_name: formData.name,
                        customer_phone: formData.phone,
                        customer_phone_alternate: formData.alternatePhone,
                        customer_email: formData.email,
                        customer_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
                      },
                    },
                  })
                }
              >
                Create Loan
              </button>
            </div>
          </form>
        </section>
      </>
    );
  }

  // Render View Mode
  if (viewMode === "view" && customer) {
    const pendingDues = getPendingDues(customer.id);
    const totalPurchases = customer.purchaseHistory.length;
    const totalSpent = customer.purchaseHistory.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    return (
      <>
        <section className="panel">
          <div className="panel-header">
            <h3>View Customer</h3>
          </div>

          <div className="customer-view">
            <div className="view-section">
              <h4>Basic & Address Information</h4>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-label">Customer ID:</span>
                  <span className="view-value">{customer.customerId}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Name:</span>
                  <span className="view-value">{customer.name}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Phone:</span>
                  <span className="view-value">{customer.phone}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Alt Phone:</span>
                  <span className="view-value">{customer.alternatePhone || "-"}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Email:</span>
                  <span className="view-value">{customer.email}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Type:</span>
                  <span className="view-value">
                    <span
                      className={`pill ${customer.customerType === "Business" ? "success" : ""
                        }`}
                    >
                      {customer.customerType}
                    </span>
                  </span>
                </div>
                <div className="view-item full-width">
                  <span className="view-label">Address:</span>
                  <span className="view-value">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                    {customer.pincode && ` - ${customer.pincode}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="view-section">
              <h4>Tax & POC Information</h4>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-label">PAN Number:</span>
                  <span className="view-value">{customer.panNumber || "-"}</span>
                </div>
                {customer.customerType === "Business" && (
                  <div className="view-item">
                    <span className="view-label">GST/Tax ID:</span>
                    <span className="view-value">{customer.gstTaxId || "-"}</span>
                  </div>
                )}
                <div className="view-item">
                  <span className="view-label">POC Name:</span>
                  <span className="view-value">{customer.pocName || "-"}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">POC Designation:</span>
                  <span className="view-value">{customer.pocDesignation || "-"}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">POC Contact:</span>
                  <span className="view-value">{customer.pocContact || "-"}</span>
                </div>
              </div>
            </div>

            {userRole === "Admin" && (
              <div className="view-section">
                <h4>Credit Information</h4>
                <div className="view-grid">
                  <div className="view-item">
                    <span className="view-label">Credit Limit:</span>
                    <span className="view-value">
                      ₹{customer.creditLimit.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="view-item">
                    <span className="view-label">Credit Used:</span>
                    <span className="view-value">
                      ₹{customer.creditUsed.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="view-item">
                    <span className="view-label">Available Credit:</span>
                    <span className="view-value">
                      ₹{(customer.creditLimit - customer.creditUsed).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="view-item">
                    <span className="view-label">Status:</span>
                    <span className="view-value">
                      {customer.isBlocked ? (
                        <span className="pill danger">Blocked</span>
                      ) : (
                        <span className="pill success">Active</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="view-section">
              <h4>Purchase History</h4>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-label">Total Purchases:</span>
                  <span className="view-value">{totalPurchases}</span>
                </div>
                <div className="view-item">
                  <span className="view-label">Total Spent:</span>
                  <span className="view-value">
                    ₹{totalSpent.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Pending Dues:</span>
                  <span className="view-value">
                    {pendingDues > 0 ? (
                      <span className="text-danger">
                        ₹{pendingDues.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-success">₹0</span>
                    )}
                  </span>
                </div>
                <div className="view-item">
                  <span className="view-label">Credit/Rewards:</span>
                  <span className="view-value">
                    ₹{customer.creditRewards.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {customer.purchaseHistory.length > 0 && (
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice ID</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.purchaseHistory.map((inv) => (
                        <tr key={inv.id}>
                          <td>{new Date(inv.date).toLocaleDateString()}</td>
                          <td>{inv.id}</td>
                          <td>₹{inv.amount.toLocaleString("en-IN")}</td>
                          <td>₹{inv.paid.toLocaleString("en-IN")}</td>
                          <td>
                            <span
                              className={`pill ${inv.status === "paid"
                                ? "success"
                                : inv.status === "pending"
                                  ? "danger"
                                  : ""
                                }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


            <div className="form-actions">
              <button className="secondary-btn" onClick={handleBack}>
                Back
              </button>

              {(userRole === "Admin" || userRole === "Staff") && (
                <>
                  <button
                    className="primary-btn"
                    onClick={() => handleEdit(customer.id)}
                  >
                    <FiEdit />
                    Edit

                  </button>

                  {/* ✅ LOAN BUTTON */}
                  <button
                    className="primary-btn"
                    onClick={() => navigate(`/customers/${customer.id}/loan`)}
                  >
                    LOAN
                  </button>
                </>
              )}
            </div>

          </div>

        </section>
      </>
    );
  }

  return null;
}
