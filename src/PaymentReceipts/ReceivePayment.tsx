import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { saveReceipt, generateReceiptNumber } from './receiptStorage';
import { getInvoices, updateInvoicePayment } from './invoiceStorage';
import './PaymentReceipts.css';

const ReceivePayment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Searchable Dropdown State
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    invoice: '',
    customer: '',
    paymentAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    // Load all invoices for the searchable dropdown
    const invoices = getInvoices();
    setAllInvoices(invoices);

    // If data passed via state (from Invoice Detail)
    if (location.state) {
      setFormData(prev => ({
        ...prev,
        invoice: location.state.invoiceNo,
        customer: location.state.customer,
        paymentAmount: location.state.balance ? location.state.balance.toString() : ''
      }));
      setInvoiceSearch(location.state.invoiceNo);
      return;
    }

    // If ID passed via URL params
    if (id) {
      const invoices = getInvoices();
      const selectedInvoice = invoices.find(inv => inv.id === id || inv.invoiceNumber === id);

      if (selectedInvoice) {
        setFormData(prev => ({
          ...prev,
          invoice: selectedInvoice.invoiceNumber,
          customer: selectedInvoice.customerName,
          paymentAmount: selectedInvoice.balanceAmount.toString()
        }));
        setInvoiceSearch(selectedInvoice.invoiceNumber);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------- SEARCH LOGIC ---------- */
  const filteredInvoices = useMemo(() => {
    // Only show invoices that have a balance
    return allInvoices.filter(inv =>
      inv.balanceAmount > 0 &&
      (inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase()))
    );
  }, [allInvoices, invoiceSearch]);

  const selectInvoice = (inv: any) => {
    setFormData(prev => ({
      ...prev,
      invoice: inv.invoiceNumber,
      customer: inv.customerName,
      paymentAmount: inv.balanceAmount.toString()
    }));
    setInvoiceSearch(inv.invoiceNumber);
    setShowDropdown(false);
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoice) {
      newErrors.invoice = 'Invoice Number is required';
    }

    if (!formData.customer) {
      newErrors.customer = 'Customer Name is required';
    }

    if (!formData.paymentAmount) {
      newErrors.paymentAmount = 'Payment Amount is required';
    } else {
      const amount = parseFloat(formData.paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.paymentAmount = 'Payment Amount must be greater than 0';
      }
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment Date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment Method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      const amount = parseFloat(formData.paymentAmount);

      // Generate receipt number and save receipt
      const receiptNumber = generateReceiptNumber();
      const newReceipt = {
        id: Date.now().toString(),
        receiptNumber: receiptNumber,
        invoiceNumber: formData.invoice,
        customer: formData.customer,
        amount: amount,
        date: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        created_by: localStorage.getItem('billing_app_username') || 'Admin',
        created_at: new Date().toISOString().slice(0, 10),
      };

      saveReceipt(newReceipt);

      // Update invoice payment status
      updateInvoicePayment(formData.invoice, amount);

      alert('Payment received successfully!');
      navigate(`/payments/receipts/${newReceipt.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '0 0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div></div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate('/payments/receipts')}
            style={{ padding: '8px 16px', fontSize: '0.85rem', width: 'auto' }}
          >
            View All Receipts
          </button>
        </div>

        <div className="form-group">
          <label className="form-label"><span>Invoice Number <span className="required">*</span></span></label>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <input
              type="text"
              placeholder="Search by Invoice # or Customer..."
              value={invoiceSearch}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setShowDropdown(true);
                // Clear the selection if user types something else
                if (formData.invoice !== e.target.value) {
                  setFormData(prev => ({ ...prev, invoice: '', customer: '', paymentAmount: '' }));
                }
              }}
              className={`form-input ${errors.invoice ? 'error' : ''}`}
            />

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#ffffff',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                marginTop: '4px'
              }}>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                      className="dropdown-item-custom"
                      onClick={() => selectInvoice(inv)}
                      onMouseEnter={(e) => {
                        (e.target as HTMLDivElement).style.backgroundColor = '#F3F4F6';
                        (e.target as HTMLDivElement).style.color = '#2E7D32';
                        (e.target as HTMLDivElement).style.fontWeight = '600';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLDivElement).style.backgroundColor = 'transparent';
                        (e.target as HTMLDivElement).style.color = 'inherit';
                        (e.target as HTMLDivElement).style.fontWeight = 'normal';
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{inv.customerName} - Balance: ₹{inv.balanceAmount}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: '14px', fontStyle: 'italic' }}>
                    No pending invoices found
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.invoice && (
            <div className="error-message">{errors.invoice}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label"><span>Customer Name <span className="required">*</span></span></label>
          <input
            type="text"
            name="customer"
            value={formData.customer}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            placeholder="Customer name"
          />
        </div>

        <div className="form-group">
          <label className="form-label"><span>Payment Amount <span className="required">*</span></span></label>
          <input
            type="number"
            name="paymentAmount"
            value={formData.paymentAmount}
            onChange={handleChange}
            className={`form-input ${errors.paymentAmount ? 'error' : ''}`}
            placeholder="0.00"
          />
          {errors.paymentAmount && (
            <div className="error-message">{errors.paymentAmount}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label"><span>Payment Date <span className="required">*</span></span></label>
          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            className={`form-input ${errors.paymentDate ? 'error' : ''}`}
            min={new Date().toISOString().split('T')[0]}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.paymentDate && (
            <div className="error-message">{errors.paymentDate}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label"><span> Payment Method <span className="required">*</span></span></label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}
          >
            <option value="">Select method</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Online Payment">Online Payment</option>
          </select>
          {errors.paymentMethod && (
            <div className="error-message">{errors.paymentMethod}</div>
          )}
        </div>

        {formData.paymentMethod !== 'Cash' && (
          <div className="form-group">
            <label className="form-label">Reference Number</label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter reference number (optional)"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter any additional notes (optional)"
            rows={4}
          />
        </div>

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate('/payments/receipts')}
          >
            Cancel
          </button>
          <button type="submit" className="primary-btn">
            Save Payment
          </button>
        </div>
      </div>
    </form>
  );
};

export default ReceivePayment;
