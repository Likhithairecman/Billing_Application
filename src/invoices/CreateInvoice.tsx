import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateInvoice.module.css";
import { saveInvoice, generateInvoiceNumber, type Invoice, type InvoiceItem } from "../PaymentReceipts/invoiceStorage";
import { useDashboard } from "../DashboardPage/DashboardContext";
import { FiChevronDown } from "react-icons/fi";

/* ================= COMPONENT ================= */

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { customers, products } = useDashboard();
  const [step, setStep] = useState(1);

  // Searchable Dropdown State
  const [customerSearch, setCustomerSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------- HEADER STATE (Merged from User Request) ---------- */
  const [header, setHeader] = useState({
    id: crypto.randomUUID(),
    invoiceNumber: "", // Will be set on mount
    invoiceType: "Invoice",

    customer: "",
    customerId: "",
    createdBy: "Admin",

    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",

    registrationNumber: "",
    taxType: "",
    guarantorMobile: "",

    subtotal: "",
    taxAmount: "",
    discountAmount: "",
    totalAmount: "",

    status: "Pending",
    originalInvoiceId: "",

    constructionAddress: "",
    notes: "",
    terms: "",

    countryCode: "+91", // Kept for logic compatibility
    defaultTaxRate: "",
    defaultDiscountRate: "",

    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
  });

  /* ---------- ITEMS STATE ---------- */
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      hsnCode: "",
    },
  ]);

  /* ---------- SEARCH LOGIC ---------- */
  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.customerId && c.customerId.toLowerCase().includes(customerSearch.toLowerCase()))
    );
  }, [customers, customerSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Sequential Invoice Number
  useEffect(() => {
    setHeader(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
  }, []);

  /* ================= CALCULATIONS (Auto-Calculate Totals) ================= */

  /* ================= CALCULATIONS (Auto-Calculate Totals) ================= */

  const lineTotal = (i: InvoiceItem) => {
    const base = i.quantity * i.unitPrice;
    return base - (base * i.discount) / 100;
  };

  const taxAmt = (i: InvoiceItem) =>
    (lineTotal(i) * i.tax) / 100;

  // Header Calculations (Gross Flow)
  // Subtotal = Sum of (Qty * Price) [GROSS]
  // Discount = Sum of Discount Amounts
  // Tax = Sum of Tax Amounts
  // Total = Subtotal - Discount + Tax

  const subtotalCalc = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

  const totalDiscountCalc = items.reduce(
    (s, i) => s + (i.quantity * i.unitPrice * i.discount) / 100,
    0
  );

  const totalTaxCalc = items.reduce((s, i) => s + taxAmt(i), 0);

  const grandTotalCalc = subtotalCalc - totalDiscountCalc + totalTaxCalc;

  // Sync calculations from Items to Header
  useEffect(() => {
    if (items.some(i => i.unitPrice > 0)) {
      update("subtotal", subtotalCalc.toFixed(2));
      update("taxAmount", totalTaxCalc.toFixed(2));
      update("discountAmount", totalDiscountCalc.toFixed(2));
      // Total Amount will be calculated by the next effect based on these values
    }
  }, [items, subtotalCalc, totalTaxCalc, totalDiscountCalc, grandTotalCalc]);

  // Auto-calculate Total Amount when Subtotal/Tax/Discount changes (Manual or Auto)
  useEffect(() => {
    const sub = parseFloat(header.subtotal) || 0;
    const tax = parseFloat(header.taxAmount) || 0;
    const disc = parseFloat(header.discountAmount) || 0;
    const total = sub - disc + tax;

    // Only update if actually different to avoid loop (though values strictly computed shouldn't loop)
    // We use a small epsilon for float comparison or string check
    if (total.toFixed(2) !== header.totalAmount) {
      update("totalAmount", total.toFixed(2));
    }
  }, [header.subtotal, header.taxAmount, header.discountAmount]);


  /* ================= HANDLERS ================= */

  const update = (key: string, value: string) => {
    setHeader(prev => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toLocaleString(),
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: number | string
  ) => {
    const updated = [...items];
    updated[index][field] = value as never;
    setItems(updated);
  };

  const handleProductSelect = (index: number, productName: string) => {
    // Basic lookup
    const product = products.find(p => p.name === productName);
    if (product) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        description: product.name,
        unitPrice: product.price,
        tax: parseFloat(product.gst) || 0,
        hsnCode: product.hsn,
        // Keep existing quantity/discount or default them
      };
      setItems(updated);
    } else {
      // Just update name if no match
      handleItemChange(index, "description", productName);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: parseFloat(header.defaultDiscountRate) || 0,
        tax: parseFloat(header.defaultTaxRate) || 0,
        hsnCode: "",
      },
    ]);
  };

  /* ================= VALIDATION ================= */

  const validateHeader = () => {
    if (!header.customer || !header.issueDate || !header.dueDate) {
      alert("Customer, Issue Date and Due Date are required");
      return false;
    }

    if (header.guarantorMobile && header.guarantorMobile.length !== 10) {
      alert("Guarantor mobile must be exactly 10 digits");
      return false;
    }

    return true;
  };

  /* ================= ACTIONS ================= */

  const saveDraft = () => {
    console.log("DRAFT", {
      header,
      items,
      status: "DRAFT",
    });
    alert("Invoice saved as draft (frontend only)");
  };

  const generateInvoice = () => {
    // Validate required fields
    if (!header.customer) {
      alert("Please select a customer");
      return;
    }

    if (!header.issueDate || !header.dueDate) {
      alert("Please enter issue date and due date");
      return;
    }

    const currentUser = localStorage.getItem('billing_app_username') || header.createdBy || 'Admin';
    const now_date = new Date().toISOString().slice(0, 10);

    const newInvoice: Invoice = {
      id: header.id, // User generated ID
      invoiceNumber: header.invoiceNumber, // User key
      invoiceType: header.invoiceType,
      customerName: header.customer,
      customerId: header.customerId,
      date: header.issueDate,
      dueDate: header.dueDate,

      // Totals
      totalAmount: grandTotalCalc, // Use calculated
      subtotal: subtotalCalc,
      taxAmount: totalTaxCalc,
      discountAmount: totalDiscountCalc,

      paidAmount: 0,
      balanceAmount: grandTotalCalc,
      status: 'pending',

      notes: header.notes,
      terms: header.terms,
      constructionAddress: header.constructionAddress,
      guarantorMobile: header.guarantorMobile,
      taxType: header.taxType,
      registrationNumber: header.registrationNumber,
      originalInvoiceId: header.originalInvoiceId,

      created_by: currentUser,
      created_at: now_date,
      items: items.map(item => {
        const base = item.quantity * item.unitPrice;
        const discountAmt = (base * item.discount) / 100;
        const preTaxTotal = base - discountAmt;
        const taxAmtVal = (preTaxTotal * item.tax) / 100;
        const total = preTaxTotal + taxAmtVal;

        return {
          ...item,
          totalPrice: preTaxTotal,
          taxAmount: taxAmtVal,
          totalAfterTax: total
        };
      })
    };

    saveInvoice(newInvoice);

    alert(`Invoice ${header.invoiceNumber} generated successfully!`);

    // Redirect to receive payment page with pre-filled details
    navigate("/payments", {
      state: {
        invoiceNo: header.invoiceNumber,
        customer: header.customer,
        balance: grandTotalCalc
      }
    });
  };

  /* ================= UI ================= */

  return (
    <div className={styles.page}>
      <h2 className={styles.header}>Create Invoice</h2>

      {/* ================= STEP 1 (Merged User Code) ================= */}
      {step === 1 && (
        <div className={styles.card}>
          <h3>Invoice Header</h3>

          <div className={styles.grid}>

            {/* ROW 1 */}
            <div>
              <label>Invoice ID</label>
              <input value={header.id} disabled />
            </div>

            <div>
              <label>Invoice Number *</label>
              <input
                value={header.invoiceNumber}
                onChange={e => update("invoiceNumber", e.target.value)}
              />
            </div>

            <div>
              <label>Invoice Type</label>
              <input
                value={header.invoiceType}
                onChange={e => update("invoiceType", e.target.value)}
              />
            </div>

            {/* ROW 2 */}
            <div ref={dropdownRef} className={styles.dropdownContainer}>
              <label>Customer *</label>
              <div
                className={styles.dropdownTrigger} // Ensure CSS exists for this or map to styles.dropdownWrapper
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {header.customer || "Select Customer"} <FiChevronDown />
              </div>

              {isDropdownOpen && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownSearch}>
                    <input
                      placeholder="Search customer"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className={styles.dropdownOptions}>
                    {filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        className={styles.dropdownOption}
                        onClick={() => {
                          setHeader(prev => ({
                            ...prev,
                            customer: c.name,
                            customerId: c.customerId
                          }));
                          setIsDropdownOpen(false);
                          setCustomerSearch("");
                        }}
                      >
                        {c.name} {c.customerId ? `(${c.customerId})` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label>Customer ID</label>
              <input value={header.customerId || "Auto-filled"} disabled />
            </div>

            <div>
              <label>Created By</label>
              <select
                value={header.createdBy}
                onChange={e => update("createdBy", e.target.value)}
              >
                <option>Admin</option>
                <option>Staff</option>
              </select>
            </div>

            {/* ROW 3 */}
            <div>
              <label>Issue Date *</label>
              <input
                type="date"
                value={header.issueDate}
                onChange={e => {
                  const newIssueDate = e.target.value;
                  setHeader(prev => {
                    const issue = new Date(newIssueDate);
                    const due = new Date(prev.dueDate);
                    const maxDue = new Date(issue);
                    maxDue.setDate(issue.getDate() + 10);

                    let newDueDate = prev.dueDate;
                    if (prev.dueDate && due > maxDue) {
                      newDueDate = maxDue.toISOString().split("T")[0];
                    }

                    return {
                      ...prev,
                      issueDate: newIssueDate,
                      dueDate: newDueDate,
                    };
                  });
                }}
              />
            </div>

            <div>
              <label>Due Date *</label>
              <input
                type="date"
                value={header.dueDate}
                min={header.issueDate}
                max={(() => {
                  const d = new Date(header.issueDate);
                  d.setDate(d.getDate() + 10);
                  return d.toISOString().split("T")[0];
                })()}
                onChange={e => update("dueDate", e.target.value)}
              />
            </div>

            <div>
              <label>Registration Number</label>
              <input
                value={header.registrationNumber}
                onChange={e => update("registrationNumber", e.target.value)}
              />
            </div>

            {/* ROW 4 */}
            <div>
              <label>Tax Type *</label>
              <select
                value={header.taxType}
                onChange={e => update("taxType", e.target.value)}
              >
                <option value="">Select Tax Type</option>
                <option value="GST">GST</option>
                <option value="IGST">IGST</option>
                <option value="CGST">CGST</option>
                <option value="SGST">SGST</option>
                <option value="VAT">VAT</option>
                <option value="Service Tax">Service Tax</option>
                <option value="TDS">TDS</option>
              </select>
            </div>

            <div>
              <label>Guarantor Mobile</label>
              <div className={styles.mobileRow}>
                <span className={styles.countryCodeStatic}>+91</span>
                <input
                  maxLength={10}
                  placeholder="10 digit number"
                  value={header.guarantorMobile}
                  onChange={e =>
                    update("guarantorMobile", e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
            </div>

            <div></div> {/* spacer */}

            {/* ROW 5 (Totals) */}

            {/* ROW 6 (Totals) */}
            <div>
              <label>Subtotal *</label>
              <input
                type="number"
                placeholder="0.00"
                value={header.subtotal}
                onChange={e => update("subtotal", e.target.value)}
              />
            </div>

            <div>
              <label>Tax Amount *</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={header.taxAmount}
                  onChange={e => {
                    const val = e.target.value;
                    update("taxAmount", val);
                    const sub = parseFloat(header.subtotal) || 0;
                    const amt = parseFloat(val) || 0;
                    if (sub > 0) {
                      update("defaultTaxRate", ((amt / sub) * 100).toFixed(2));
                    }
                  }}
                />
                <input
                  value={header.defaultTaxRate ? `${parseFloat(header.defaultTaxRate).toFixed(2)}%` : ''}
                  disabled
                  placeholder="Rate %"
                  style={{ backgroundColor: '#f5f5f5', width: '80px', textAlign: 'center' }}
                />
              </div>
            </div>

            <div>
              <label>Discount Amount *</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={header.discountAmount}
                  onChange={e => {
                    const val = e.target.value;
                    update("discountAmount", val);
                    const sub = parseFloat(header.subtotal) || 0;
                    const amt = parseFloat(val) || 0;
                    if (sub > 0) {
                      update("defaultDiscountRate", ((amt / sub) * 100).toFixed(2));
                    }
                  }}
                />
                <input
                  value={header.defaultDiscountRate ? `${parseFloat(header.defaultDiscountRate).toFixed(2)}%` : ''}
                  disabled
                  placeholder="Rate %"
                  style={{ backgroundColor: '#f5f5f5', width: '80px', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* ROW 6 */}
            <div>
              <label>Total Amount *</label>
              <input
                type="number"
                placeholder="0.00"
                value={header.totalAmount}
                readOnly
              />
            </div>

            <div>
              <label>Status</label>
              <select
                value={header.status}
                onChange={e => update("status", e.target.value)}
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Partially Paid</option>
              </select>
            </div>

            {/* ROW 7 */}
            <div>
              <label>Original Invoice ID</label>
              <input
                value={header.originalInvoiceId}
                onChange={e => update("originalInvoiceId", e.target.value)}
              />
            </div>

            <div>
              <label>Created At</label>
              <input value={header.createdAt} disabled />
            </div>

            <div>
              <label>Updated At</label>
              <input value={header.updatedAt} disabled />
            </div>
          </div>

          {/* FULL WIDTH */}
          <label className={styles.label}>Construction Address</label>
          <textarea
            className={styles.fullWidth}
            value={header.constructionAddress}
            onChange={e => update("constructionAddress", e.target.value)}
          />

          <label className={styles.label}>Notes</label>
          <textarea
            className={styles.fullWidth}
            value={header.notes}
            onChange={e => update("notes", e.target.value)}
          />

          <label className={styles.label}>Terms & Conditions</label>
          <textarea
            className={styles.fullWidth}
            value={header.terms}
            onChange={e => update("terms", e.target.value)}
          />

          <button
            className={styles.primaryBtn}
            onClick={() => {
              if (validateHeader()) {
                // Apply defaults to items if they are 0
                setItems(prev => prev.map(i => ({
                  ...i,
                  tax: i.tax || parseFloat(header.defaultTaxRate) || 0,
                  discount: i.discount || parseFloat(header.defaultDiscountRate) || 0
                })));
                setStep(2);
              }
            }}
          >
            Invoice Items
          </button>
        </div>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <div className={styles.card}>
          <h3>Invoice Items</h3>

          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Product Name</th>
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
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      list={`product-list-${i}`}
                      value={item.description}
                      onChange={e => handleProductSelect(i, e.target.value)}
                      placeholder="Search Product"
                    />
                    <datalist id={`product-list-${i}`}>
                      {products.map(p => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </td>
                  <td><input type="number" min={1} value={item.quantity} onChange={e => handleItemChange(i, "quantity", +e.target.value)} /></td>
                  <td><input type="number" min={0} value={item.unitPrice} onChange={e => handleItemChange(i, "unitPrice", +e.target.value)} /></td>
                  <td><input type="number" min={0} max={100} value={item.discount} onChange={e => handleItemChange(i, "discount", +e.target.value)} /></td>
                  <td><input type="number" min={0} max={100} value={item.tax} onChange={e => handleItemChange(i, "tax", +e.target.value)} /></td>
                  <td>₹ {taxAmt(item).toFixed(2)}</td>
                  <td>₹ {lineTotal(item).toFixed(2)}</td>
                  <td>₹ {(lineTotal(item) + taxAmt(item)).toFixed(2)}</td>
                  <td><input value={item.hsnCode} onChange={e => handleItemChange(i, "hsnCode", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.itemActions}>
            <button onClick={addItem}>+ Add Item</button>
          </div>

          <div className={styles.actions}>
            <button onClick={() => setStep(1)}>Back</button>
            <button className={styles.primaryBtn} onClick={() => setStep(3)}>
              Invoice Summary
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3 ================= */}
      {step === 3 && (
        <div className={styles.card}>
          <h3>Invoice Summary</h3>

          <div className={styles.summary}>
            <div><span>Subtotal</span><span>₹ {subtotalCalc.toFixed(2)}</span></div>
            <div><span>Total Discount</span><span>₹ {totalDiscountCalc.toFixed(2)}</span></div>
            <div><span>Total Tax</span><span>₹ {totalTaxCalc.toFixed(2)}</span></div>
            <div className={styles.grand}><span>Grand Total</span><span>₹ {grandTotalCalc.toFixed(2)}</span></div>
          </div>

          <div className={styles.actions}>
            <button className={styles.secondaryBtn} onClick={saveDraft}>
              Save as Draft
            </button>
            <button className={styles.primaryBtn} onClick={generateInvoice}>
              Generate Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;
