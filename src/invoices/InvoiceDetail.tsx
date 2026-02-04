import { useParams, useNavigate } from "react-router-dom";
import styles from "./InvoiceDetail.module.css";
import { getInvoices, type Invoice, type InvoiceItem } from "../PaymentReceipts/invoiceStorage";
import { useEffect, useState } from "react";

// Not using the previous InvoiceStatus type because invoiceStorage uses lowercase
// type InvoiceStatus = "Pending" | "Paid" | "Cancelled";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);

  useEffect(() => {
    const invoices = getInvoices();
    // Try to match by ID or Invoice Number
    const found = invoices.find(inv => inv.id === id || inv.invoiceNumber === id || inv.invoiceNumber === `INV-00${id}`);
    if (found) {
      setInvoiceData(found);
    }
  }, [id]);

  if (!invoiceData) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h3>Invoice not found</h3>
          <button onClick={() => navigate("/invoices")}>Back to List</button>
        </div>
      </div>
    );
  }

  // Use stored items or fallback to empty array if old data
  const items: InvoiceItem[] = invoiceData.items || [];

  /* ---------------- CALCULATIONS ---------------- */

  const lineTotal = (i: InvoiceItem) => {
    if (i.totalPrice !== undefined) return i.totalPrice;
    const base = i.quantity * i.unitPrice;
    return base - (base * i.discount) / 100;
  };

  const taxAmount = (i: InvoiceItem) => {
    if (i.taxAmount !== undefined) return i.taxAmount;
    return (lineTotal(i) * i.tax) / 100;
  };

  // Calculate totals from items
  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const totalTax = items.reduce((s, i) => s + taxAmount(i), 0);
  const totalDiscount = items.reduce(
    (s, i) => s + (i.quantity * i.unitPrice * i.discount) / 100,
    0
  );

  // Grand total should technically match invoiceData.totalAmount, but we calculate to be safe/live
  const grandTotal = subtotal + totalTax;

  /* ---------------- ACTIONS ---------------- */

  const receivePayment = () => {
    navigate(`/payments/receive/${invoiceData.id}`, {
      state: {
        invoiceNo: invoiceData.invoiceNumber,
        customer: invoiceData.customerName,
        balance: invoiceData.balanceAmount
      }
    });
  };
  const cancelInvoice = () => alert("Cancel Invoice (backend later)");

  return (
    <div className={styles.page}>
      <h2 className={styles.header}>Invoice Details</h2>

      {/* ================= HEADER ================= */}
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <h3>{invoiceData.invoiceNumber}</h3>
            <p className={styles.customer}>{invoiceData.customerName}</p>
          </div>

          <span
            className={`${styles.status} ${invoiceData.status === "paid"
              ? styles.paid
              : invoiceData.status === "pending"
                ? styles.pending
                : styles.cancelled
              }`}
          >
            {invoiceData.status.toUpperCase()}
          </span>
        </div>

        <div className={styles.meta}>
          <p><strong>Issue Date:</strong> {invoiceData.date}</p>
          <p><strong>Due Date:</strong> {invoiceData.dueDate}</p>
        </div>
      </div>

      {/* ================= ITEMS ================= */}
      <div className={styles.card}>
        <h3>Invoice Items</h3>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount %</th>
              <th>Tax %</th>
              <th>Tax Amt</th>
              <th>Total (Pre-Tax)</th>
              <th>Total (After-Tax)</th>
              <th>HSN</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>₹ {item.unitPrice}</td>
                  <td>{item.discount}%</td>
                  <td>{item.tax}%</td>
                  <td>₹ {taxAmount(item).toFixed(2)}</td>
                  <td>₹ {lineTotal(item).toFixed(2)}</td>
                  <td>₹ {(lineTotal(item) + taxAmount(item)).toFixed(2)}</td>
                  <td>{item.hsnCode}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: "center" }}>No items found for this invoice.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className={styles.card}>
        <h3>Summary</h3>

        <div className={styles.summary}>
          <div><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
          <div><span>Total Discount</span><span>₹ {totalDiscount.toFixed(2)}</span></div>
          <div><span>Total Tax</span><span>₹ {totalTax.toFixed(2)}</span></div>
          <div className={styles.grand}>
            <span>Grand Total</span>
            <span>₹ {grandTotal.toFixed(2)}</span>
          </div>
          <div className={styles.grand} style={{ marginTop: '10px', fontSize: '16px', color: '#EF4444' }}>
            <span>Balance Due</span>
            <span>₹ {invoiceData.balanceAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginBottom: '0.75rem', color: '#333', fontSize: '1rem' }}>Audit Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '14px' }}>
          <div>
            <strong>Created By:</strong> {invoiceData.created_by || 'Unknown'}
          </div>
          <div>
            <strong>Created At:</strong> {invoiceData.created_at || 'N/A'}
          </div>
          {invoiceData.updated_by && (
            <>
              <div>
                <strong>Last Updated By:</strong> {invoiceData.updated_by}
              </div>
              <div>
                <strong>Last Updated At:</strong> {invoiceData.updated_at || 'N/A'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className={styles.actions}>
        <button onClick={() => navigate("/invoices")}>Back</button>

        <div>
          {(invoiceData.status === "pending" || invoiceData.status === "partially_paid") && (
            <>
              <button onClick={receivePayment} className={styles.primary}>
                Receive Payment
              </button>
              <button
                onClick={() => navigate(`/invoices/${invoiceData.id}/return`)}
                className={styles.secondary}
              >
                Create Return
              </button>
              <button onClick={cancelInvoice} className={styles.danger}>
                Cancel Invoice
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
