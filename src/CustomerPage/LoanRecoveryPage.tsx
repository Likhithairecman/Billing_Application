import { useState } from "react";
import type { FormEvent } from "react";

import {
  FiArrowLeft,
  FiSave,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiCreditCard,
  FiHash,
  FiUser,
  FiClock,
} from "react-icons/fi";

import "./LoanRecovery.css";

import { useNavigate, useLocation } from "react-router-dom";
import { useDashboard } from "../DashboardPage/DashboardContext";



export default function LoanRecovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, addRecovery, customers } = useDashboard();

  const [formData, setFormData] = useState({
    loanId: location.state?.loanId || "",
    amount: "",
    recoveredAt: new Date().toLocaleDateString('en-CA'),
    disbursementDate: "", // Added disbursementDate to state
    remarks: "",
    paymentMethod: "",
    txnId: "",

    // system / audit fields
    createdBy: "Admin", // later map from auth user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Find the loan to get disbursement date
  const loanDetails = customers
    ?.flatMap(c => c.loans || [])
    ?.find(l => l.id === formData.loanId);

  // Sync disbursementDate from loan details once loaded
  if (loanDetails && !formData.disbursementDate) {
    const disStr = loanDetails?.items?.[0]?.disbursed_at;
    if (disStr) {
      const dbDate = disStr.split("T")[0]; // Use string split to avoid UTC shift
      setFormData(prev => ({
        ...prev,
        disbursementDate: dbDate,
        recoveredAt: prev.recoveredAt < dbDate ? dbDate : prev.recoveredAt
      }));
    }
  }

  const minAllowedDate = formData.disbursementDate || undefined;
  const maxAllowedDate = formData.disbursementDate ? (() => {
    const d = new Date(formData.disbursementDate);
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  })() : undefined;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.loanId || !formData.amount) {
      alert("Loan ID and Amount are required");
      return;
    }

    // Validate date restriction
    if (minAllowedDate && maxAllowedDate) {
      const selectedDate = formData.recoveredAt;
      if (selectedDate < minAllowedDate || selectedDate > maxAllowedDate) {
        alert(`Recovery date must be between ${minAllowedDate} and ${maxAllowedDate} (10-day window from disbursement).`);
        return;
      }
    }

    const payload = {
      loan_id: formData.loanId,
      amount: Number(formData.amount),
      recovered_at: formData.recoveredAt || new Date().toISOString().split("T")[0],
      remarks: formData.remarks || null,
      payment_method: formData.paymentMethod || null,
      txn_id: formData.txnId || null,
      created_by: formData.createdBy,
      created_at: formData.createdAt,
      updated_at: new Date().toISOString(),
    };

    console.log("Loan Recovery Payload:", payload);
    addRecovery(formData.loanId, Number(formData.amount)); // Update global state

    alert("Loan recovery recorded successfully!");
    navigate(-1);
  };

  return (
    <>
      <section className="panel">


        <div className="panel-header">
          <h3>Record Loan Recovery</h3>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-section-title">
            <FiDollarSign /> Recovery Details
          </div>

          {/* LOAN ID */}
          <div className="form-group">
            <label>
              <span>
                <FiHash /> Loan ID <span className="required">*</span>
              </span>
              <input
                type="text"
                value={formData.loanId}
                onChange={(e) =>
                  setFormData({ ...formData, loanId: e.target.value })
                }
                placeholder="Enter loan ID"
                required
              />
            </label>
          </div>

          {/* AMOUNT + RECOVERY DATE */}
          <div className="form-group">
            <label>
              <span>
                <FiDollarSign /> Amount Recovered <span className="required">*</span>
              </span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                min={0}
                placeholder="Enter recovered amount"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              <span>
                <FiCalendar /> Recovered At
              </span>
              <input
                type="date"
                value={formData.recoveredAt}
                onChange={(e) => {
                  setFormData({ ...formData, recoveredAt: e.target.value });
                }}
                min={minAllowedDate}
                max={maxAllowedDate}
              />
              {formData.disbursementDate && (
                <div style={{ marginTop: '8px', padding: '8px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b20' }}>
                  <span style={{ fontSize: '12px', color: '#92400e', display: 'block', fontWeight: 500 }}>
                    <FiCalendar style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    10-Day Recovery Window: {minAllowedDate} to {maxAllowedDate}
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* PAYMENT + TRANSACTION */}
          <div className="form-group">
            <label>
              <span>
                <FiCreditCard /> Payment Method
              </span>
              <select
                value={formData.paymentMethod}
                onChange={(e) => {
                  const newMethod = e.target.value;
                  setFormData({
                    ...formData,
                    paymentMethod: newMethod,
                    txnId: newMethod === "Cash" ? "" : formData.txnId,
                  });
                }}
              >
                <option value="">Select payment method</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Card</option>
              </select>
            </label>
          </div>

          {formData.paymentMethod && formData.paymentMethod !== "Cash" && (
            <div className="form-group">
              <label>
                <span>
                  <FiHash /> Transaction ID
                </span>
                <input
                  type="text"
                  value={formData.txnId}
                  onChange={(e) =>
                    setFormData({ ...formData, txnId: e.target.value })
                  }
                  placeholder="Optional transaction reference"
                />
              </label>
            </div>
          )}

          {/* REMARKS */}
          <div className="form-group full-width">
            <label>
              <span>
                <FiFileText /> Remarks
              </span>
              <textarea
                rows={3}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Additional notes (optional)"
              />
            </label>
          </div>

          {/* AUDIT INFORMATION */}
          <div className="audit-section">
            <div className="form-section-title">
              <FiClock /> Audit Information
            </div>

            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>
                  <span>
                    <FiUser /> Created By
                  </span>
                  <input type="text" value={formData.createdBy} disabled />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span>
                    <FiClock /> Created At
                  </span>
                  <input
                    type="text"
                    value={new Date(formData.createdAt).toLocaleString()}
                    disabled
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span>
                    <FiClock /> Updated At
                  </span>
                  <input
                    type="text"
                    value={new Date(formData.updatedAt).toLocaleString()}
                    disabled
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft />
              Back
            </button>

            {(userRole === "Admin" || userRole === "Staff") && (
              <button type="submit" className="primary-btn">
                <FiSave />
                Save Recovery
              </button>
            )}
          </div>
        </form>
      </section>
    </>
  );
}
