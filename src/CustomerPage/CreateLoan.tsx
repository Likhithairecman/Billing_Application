import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { useDashboard } from '../DashboardPage/DashboardContext';
import './CreateLoan.css';

interface Tranche {
    id: string;
    number: number;
    amount: string;
    paymentMethod: string;
    disbursementDate: string;
    transactionId: string;
}

export default function CreateLoan() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addLoan } = useDashboard();

    // Customer details from passed state
    const customerData = location.state?.customer;

    const [customerName, setCustomerName] = useState(customerData?.name || '');
    const [phoneNumber, setPhoneNumber] = useState(customerData?.phone || '');
    const [alternatePhone, setAlternatePhone] = useState(customerData?.alternatePhone || '');
    const [email, setEmail] = useState(customerData?.email || '');
    const [billingAddress, setBillingAddress] = useState(customerData?.address || '');

    const [loanDescription, setLoanDescription] = useState('');
    const [tranches, setTranches] = useState<Tranche[]>([
        {
            id: '1',
            number: 1,
            amount: '',
            paymentMethod: '',
            disbursementDate: '',
            transactionId: ''
        }
    ]);

    const addTranche = () => {
        const newTranche: Tranche = {
            id: Date.now().toString(),
            number: tranches.length + 1,
            amount: '',
            paymentMethod: '',
            disbursementDate: '',
            transactionId: ''
        };
        setTranches([...tranches, newTranche]);
    };

    const updateTranche = (id: string, field: keyof Tranche, value: string) => {
        setTranches(tranches.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const removeTranche = (id: string) => {
        if (tranches.length > 1) {
            setTranches(tranches.filter(t => t.id !== id));
        }
    };

    const handleSaveLoan = () => {
        // Validate required fields
        if (!customerName || !phoneNumber || !email || !loanDescription) {
            alert('Please fill in all required customer and loan details');
            return;
        }

        // Validate at least one tranche with amount
        const validTranches = tranches.filter(t => t.amount && parseFloat(t.amount) > 0);
        if (validTranches.length === 0) {
            alert('Please add at least one tranche with an amount');
            return;
        }

        const loanData = {
            id: Date.now().toString(),
            amount: validTranches.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
            status: "active",
            startDate: new Date().toISOString(),
            description: loanDescription,
            items: validTranches.map(t => ({
                amount: t.amount,
                disbursed_at: t.disbursementDate || new Date().toISOString(),
                payment_method: t.paymentMethod,
                txn_id: t.transactionId
            })),
            tranches: validTranches, // Keeping original structure if needed for view
            createdAt: new Date().toISOString(),
            recoveredAmount: 0
        };

        // Save to global context
        if (customerData?.id) {
            addLoan(customerData.id, loanData);
        }

        // Also save to localStorage for persistence if context is reset on reload (optional, but context handles session usually)
        // ideally we rely on context. But for now let's keep the user's pattern but linked.
        const existingLoans = JSON.parse(localStorage.getItem('loans') || '[]');
        existingLoans.push({ ...loanData, customerId: customerData?.id });
        localStorage.setItem('loans', JSON.stringify(existingLoans));

        alert('Loan created successfully!');
        navigate('/customers');
    };

    return (
        <div className="create-loan-container">
            <div className="create-loan-header">
                <div>
                    <h1>CREATE LOAN</h1>
                    <p className="muted">Create and manage loans for your customers.</p>
                </div>
            </div>

            <div className="create-loan-content">
                {/* Customer Details Section */}
                <section className="panel loan-section">
                    <div className="section-header">
                        <h3>👤 Customer Details</h3>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label><span>Customer Name <span className="required">*</span></span></label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                                disabled={!!customerData}
                            />
                        </div>

                        <div className="form-group">
                            <label><span>Phone Number <span className="required">*</span></span></label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number"
                                disabled={!!customerData}
                            />
                        </div>

                        <div className="form-group">
                            <label>Alternate Phone</label>
                            <input
                                type="text"
                                value={alternatePhone}
                                onChange={(e) => setAlternatePhone(e.target.value)}
                                placeholder="Enter alternate phone"
                                disabled={!!customerData}
                            />
                        </div>

                        <div className="form-group">
                            <label><span>Email Address <span className="required">*</span></span></label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                disabled={!!customerData}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Billing Address</label>
                            <textarea
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                placeholder="Enter billing address"
                                rows={3}
                                disabled={!!customerData}
                            />
                        </div>
                    </div>
                </section>

                {/* Loan Details Section */}
                <section className="panel loan-section">
                    <div className="section-header">
                        <h3>📋 Loan Details</h3>
                    </div>

                    <div className="form-group full-width">
                        <label><span>Loan Description <span className="required">*</span></span></label>
                        <textarea
                            value={loanDescription}
                            onChange={(e) => setLoanDescription(e.target.value)}
                            placeholder="Enter detailed description about this loan..."
                            rows={4}
                        />
                    </div>

                    {/* Tranches */}
                    <div className="tranches-container">
                        {tranches.map((tranche) => (
                            <div key={tranche.id} className="tranche-card">
                                <div className="tranche-header">
                                    <h4>Tranche #{tranche.number}</h4>
                                    {tranches.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-delete-tranche"
                                            onClick={() => removeTranche(tranche.id)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="tranche-grid">
                                    <div className="form-group">
                                        <label><span>Amount (₹) <span className="required">*</span></span></label>
                                        <input
                                            type="number"
                                            value={tranche.amount}
                                            onChange={(e) => updateTranche(tranche.id, 'amount', e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Payment Method</label>
                                        <select
                                            value={tranche.paymentMethod}
                                            onChange={(e) => updateTranche(tranche.id, 'paymentMethod', e.target.value)}
                                        >
                                            <option value="">Select Method</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Online Payment">Online Payment</option>
                                            <option value="UPI">UPI</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Disbursement Date</label>
                                        <input
                                            type="date"
                                            value={tranche.disbursementDate}
                                            onChange={(e) => updateTranche(tranche.id, 'disbursementDate', e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Transaction ID / Ref #</label>
                                        <input
                                            type="text"
                                            value={tranche.transactionId}
                                            onChange={(e) => updateTranche(tranche.id, 'transactionId', e.target.value)}
                                            placeholder="Enter Transaction ID"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={addTranche}
                        style={{ marginTop: '16px' }}
                    >
                        <FiPlus /> Add Loan Item
                    </button>
                </section>

                {/* Action Buttons */}
                <div className="loan-actions">
                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleSaveLoan}
                    >
                        💾 Save Loan
                    </button>
                </div>
            </div>
        </div>
    );
}
