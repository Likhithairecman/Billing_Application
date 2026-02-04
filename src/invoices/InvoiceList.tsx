import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./InvoiceList.module.css";
import { FiPlus, FiSearch } from "react-icons/fi";
import { getInvoices, type Invoice } from "../PaymentReceipts/invoiceStorage";

const InvoiceList = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customerFilter, setCustomerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  useEffect(() => {
    // Load initial invoices
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvoices(getInvoices());

    // Listen for storage updates
    const handleStorageChange = () => {
      setInvoices(getInvoices());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const customerMatch =
      customerFilter === "All" || inv.customerName === customerFilter;

    const statusMatch =
      statusFilter === "All" || inv.status.toLowerCase() === statusFilter.toLowerCase();

    const fromMatch = fromDate ? inv.date >= fromDate : true;
    const toMatch = toDate ? inv.date <= toDate : true;

    const invoiceMatch = invoiceSearch
      ? inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())
      : true;

    return customerMatch && statusMatch && fromMatch && toMatch && invoiceMatch;
  });

  // Get unique customers for filter
  const customers = Array.from(new Set(invoices.map(inv => inv.customerName)));

  return (
    <div className={styles.page}>
      {/* FILTER CARD */}
      <section className="panel filter-panel" style={{ marginBottom: '24px' }}>
        <div className={styles.filters}>
          {/* SEARCH */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', color: '#6b7280', fontSize: '14px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search Invoice No"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)' }}
            />
          </div>

          {/* CUSTOMER FILTER */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="All">All Customers</option>
            {customers.map(customer => (
              <option key={customer} value={customer}>{customer}</option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
          </select>

          {/* DATE RANGE */}
          <div className={styles.dateGroup}>
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className={styles.dateGroup}>
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* TABLE CARD */}
      <section className="panel list-panel">
        <div className="panel-header">
          <div></div>
          <button
            className="primary-btn"
            onClick={() => navigate("/invoices/create")}
          >
            <FiPlus /> Create Invoice
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.invoiceNumber}</td>
                <td>{inv.customerName}</td>
                <td>{inv.date}</td>
                <td>
                  <span
                    className={
                      inv.status === "paid"
                        ? styles.statusPaid
                        : inv.status === "pending"
                          ? styles.statusPending
                          : styles.statusCancelled
                    }
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </td>
                <td>₹ {inv.totalAmount}</td>
                <td className={styles.balanceRed}>₹ {inv.balanceAmount}</td>
                <td className={styles.actions}>
                  <button onClick={() => navigate(`/invoices/${inv.id}`)}>
                    View
                  </button>
                  <button
                    disabled={inv.status === "paid"}
                    style={inv.status === "paid" ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    onClick={() =>
                      navigate(`/payments/receive/${inv.id}`)
                    }
                  >
                    Receive
                  </button>
                  <button
                    disabled={inv.status !== "paid" || inv.isReturned}
                    style={(inv.status !== "paid" || inv.isReturned) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    onClick={() =>
                      navigate(`/invoices/${inv.id}/return`)
                    }
                  >
                    Return
                  </button>
                </td>
              </tr>
            ))}

            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default InvoiceList;
