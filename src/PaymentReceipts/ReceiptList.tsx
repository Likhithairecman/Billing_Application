import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { getReceipts } from './receiptStorage';
import type { Receipt } from './receiptStorage';
import './PaymentReceipts.css';

const ReceiptList = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load receipts from storage
    const loadReceipts = () => {
      setReceipts(getReceipts());
    };

    loadReceipts();

    // Listen for storage changes (when new receipt is added in another tab)
    const handleStorageChange = () => {
      loadReceipts();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check on focus (for same-tab updates)
    window.addEventListener('focus', loadReceipts);

    // Refresh when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadReceipts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll for updates when page is visible (for same-tab updates)
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadReceipts();
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadReceipts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Refresh when component becomes visible (when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setReceipts(getReceipts());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleViewReceipt = (receiptId: string) => {
    navigate(`/payments/receipts/${receiptId}`);
  };

  const handleNewPayment = () => {
    navigate('/payments');
  };

  return (
    <div>
      <div className="panel-header" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <FiSearch style={{ position: 'absolute', left: '12px', color: '#6b7280', fontSize: '14px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by Receipt No or Customer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 12px 10px 36px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              minWidth: '280px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

          <button className="primary-btn" onClick={handleNewPayment}>
            <FiPlus /> Receive Payment
          </button>
        </div>
      </div>

      <div className="card">
        {receipts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>No receipts found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Invoice Number</th>
                  <th>Customer Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts
                  .filter(receipt =>
                    searchQuery === '' ||
                    receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    receipt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    receipt.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((receipt, index) => {
                    const isDuplicateInvoice = receipts.some((r, i) => r.invoiceNumber === receipt.invoiceNumber && i !== index);
                    return (
                      <tr key={receipt.id}>
                        <td style={{ fontWeight: 600 }}>{receipt.receiptNumber}</td>
                        <td>
                          {receipt.invoiceNumber}
                          {isDuplicateInvoice && (
                            <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: '#666', fontStyle: 'italic' }}>
                              (Multiple Payments)
                            </span>
                          )}
                        </td>
                        <td>{receipt.customer}</td>
                        <td>₹{receipt.amount.toLocaleString()}</td>
                        <td>{new Date(receipt.date).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="action-btn action-btn-view"
                            onClick={() => handleViewReceipt(receipt.id)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptList;
