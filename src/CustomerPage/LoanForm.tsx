import { useState } from "react";
import type { Customer, LoanItem } from "../types/loan";
import { FiPlus, FiSave, FiUser, FiFileText } from "react-icons/fi";
import "./LoanForm.css";

type Props = {
    customer: Customer;
    onSave?: (loanData: { description: string, items: LoanItem[] }) => void;
};

export function LoanForm({ customer, onSave }: Props) {
    const [description, setDescription] = useState("");
    const [items, setItems] = useState<LoanItem[]>([
        {
            amount: "",
            disbursed_at: new Date().toISOString().slice(0, 16),
            payment_method: "Cash",
            txn_id: "",
        },
    ]);
    const [lockedDates, setLockedDates] = useState<boolean[]>([false]);

    const addItem = () => {
        setItems(prev => [
            ...prev,
            {
                amount: "",
                disbursed_at: new Date().toISOString().slice(0, 16),
                payment_method: "Cash",
                txn_id: "",
            },
        ]);
        setLockedDates(prev => [...prev, false]);
    };

    const updateItem = (
        index: number,
        field: keyof LoanItem,
        value: string
    ) => {
        setItems(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
        if (field === "disbursed_at") {
            setLockedDates(prev => prev.map((locked, i) => i === index ? true : locked));
        }
    };

    const handleSave = () => {
        if (onSave) {
            onSave({ description, items });
        }
    };

    return (
        <div className="loan-form-container">
            {/* Customer Section */}
            <h3 className="loan-section-title">
                <FiUser /> Customer Details
            </h3>

            <div className="customer-grid">
                <div className="input-group">
                    <label className="input-label">Customer Name</label>
                    <div className="readonly-input">{customer.customer_name}</div>
                </div>

                <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <div className="readonly-input">{customer.customer_phone || "-"}</div>
                </div>

                <div className="input-group">
                    <label className="input-label">Alternate Phone</label>
                    <div className="readonly-input">{customer.customer_phone_alternate || "-"}</div>
                </div>

                <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <div className="readonly-input">{customer.customer_email || "-"}</div>
                </div>

                <div className="input-group full-width">
                    <label className="input-label">Billing Address</label>
                    <div className="readonly-input">{customer.customer_address || "-"}</div>
                </div>
            </div>

            {/* Loan Details Section */}
            <h3 className="loan-section-title">
                <FiFileText /> Loan Details
            </h3>

            <div className="input-group" style={{ marginBottom: "24px" }}>
                <label className="input-label">Loan Description</label>
                <textarea
                    className="form-textarea"
                    placeholder="Enter detailed description about this loan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="loan-items-container">
                {items.map((item, index) => (
                    <div key={index} className="loan-item-card">
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', color: '#64748B' }}>
                            Tranche #{index + 1}
                        </h4>
                        <div className="loan-item-grid">
                            <div className="input-group">
                                <label className="input-label">Amount (₹)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={item.amount}
                                        onChange={e => updateItem(index, "amount", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Disbursement Date</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={item.disbursed_at}
                                    disabled={lockedDates[index]}
                                    onChange={e => updateItem(index, "disbursed_at", e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Payment Method</label>
                                <select
                                    className="form-input"
                                    value={item.payment_method}
                                    onChange={e => updateItem(index, "payment_method", e.target.value)}
                                >
                                    <option value="">Select Method</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            {item.payment_method !== "Cash" && (
                                <div className="input-group">
                                    <label className="input-label">Transaction ID / Ref #</label>
                                    <input
                                        className="form-input"
                                        placeholder="Enter Transaction ID"
                                        value={item.txn_id}
                                        onChange={e => updateItem(index, "txn_id", e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="action-buttons">
                <button
                    type="button"
                    onClick={addItem}
                    className="btn-add-item"
                >
                    <FiPlus /> Add Loan Item
                </button>

                {onSave && (
                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn-save-loan"
                    >
                        <FiSave /> Save Loan
                    </button>
                )}
            </div>
        </div>
    );
}