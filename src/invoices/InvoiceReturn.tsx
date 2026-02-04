import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./InvoiceReturn.module.css";
import { markInvoiceAsReturned } from "../PaymentReceipts/invoiceStorage";

/* ================= TYPES ================= */

interface InvoiceItem {
  invoice_item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

/* ================= COMPONENT ================= */

const InvoiceReturn = () => {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [returnQty, setReturnQty] = useState<number | "">("");
  const [returnReason, setReturnReason] = useState("");
  const [returnedAt, setReturnedAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  /* ================= FETCH INVOICE ITEMS ================= */
  // Later replace with real API:
  // GET /invoices/:invoiceId/items

  useEffect(() => {
    // MOCK BASED ON YOUR INVOICE DETAILS PAGE
    setItems([
      {
        invoice_item_id: "itm-1",
        description: "cement",
        quantity: 1,
        unit_price: 5000,
      },
    ]);
  }, [invoiceId]);

  const selectedItem = items.find(
    i => i.invoice_item_id === selectedItemId
  );

  const maxQty = selectedItem?.quantity ?? 0;
  const unitPrice = selectedItem?.unit_price ?? 0;

  const returnAmount =
    selectedItem && returnQty
      ? Number(returnQty) * unitPrice
      : 0;

  /* ================= SUBMIT ================= */

  const submitReturn = () => {
    if (!selectedItemId) {
      alert("Please select an item");
      return;
    }

    if (!returnQty || Number(returnQty) <= 0) {
      alert("Enter valid return quantity");
      return;
    }

    if (Number(returnQty) > maxQty) {
      alert(`Return quantity cannot exceed ${maxQty}`);
      return;
    }

    const payload = {
      invoice_id: invoiceId,
      invoice_item_id: selectedItemId,
      return_quantity: Number(returnQty),
      return_reason: returnReason,
      returned_at: returnedAt,
    };

    console.log("RETURN PAYLOAD", payload);

    if (invoiceId) {
      markInvoiceAsReturned(invoiceId);
    }

    alert("Return recorded successfully!");
    navigate(`/invoices/${invoiceId}`);
  };

  /* ================= UI ================= */

  return (
    <div className={styles.page}>
      <h2 className={styles.header}>Invoice Return / Credit Note</h2>

      <div className={styles.card}>
        {/* INVOICE ID */}
        <div className={styles.field}>
          <label>Invoice ID</label>
          <input value={invoiceId} disabled />
        </div>

        {/* SELECT ITEM */}
        <div className={styles.field}>
          <label>Select Item *</label>
          <select
            value={selectedItemId}
            onChange={e => {
              setSelectedItemId(e.target.value);
              setReturnQty("");
            }}
          >
            <option value="">Select item</option>
            {items.map(item => (
              <option key={item.invoice_item_id} value={item.invoice_item_id}>
                {item.description} (Available: {item.quantity})
              </option>
            ))}
          </select>
        </div>

        {/* RETURN QUANTITY */}
        <div className={styles.field}>
          <label>Return Quantity *</label>
          <input
            type="number"
            min={1}
            disabled={!selectedItem}
            value={returnQty}
            onChange={e => setReturnQty(Number(e.target.value))}
          />
          {selectedItem && <small>Max allowed: {maxQty}</small>}
        </div>

        {/* RETURN DATE */}
        <div className={styles.field}>
          <label>Returned At *</label>
          <input
            type="date"
            value={returnedAt}
            onChange={e => setReturnedAt(e.target.value)}
          />
        </div>

        {/* RETURN REASON */}
        <div className={styles.field}>
          <label>Return Reason</label>
          <textarea
            placeholder="Optional reason"
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
          />
        </div>

        {/* SUMMARY */}
        <div className={styles.summary}>
          <div>
            <span>Unit Price</span>
            <span>₹ {unitPrice}</span>
          </div>
          <div>
            <span>Return Amount</span>
            <span>₹ {returnAmount}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button
            className={styles.secondaryBtn}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className={styles.primaryBtn}
            onClick={submitReturn}
          >
            Create Credit Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReturn;
