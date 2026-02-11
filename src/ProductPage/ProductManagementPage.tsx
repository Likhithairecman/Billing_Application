import { useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import "../App.css";
import "./ProductManagementPage.css";

/* ================= LOGGED IN USER (FROM BACKEND) ================= */
const loggedInUser = {
  role: "Admin", // or "Staff"
};

/* ================= TYPES ================= */

type Mode =
  | "list"
  | "add"
  | "edit"
  | "view"
  | "priceHistory"
  | "changeLog"
  | "deleted";   // ← ADD THIS


interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;

  price: number;
  stockQty: number;
  gst: string;
  taxableAmount: string;

  sku: string;
  batchNo: string;
  hsn: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  packSize: string;
  uom: string;

  createdAt: string;
  createdBy: string;

  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;

}

interface PriceHistory {
  productId: string;
  price: number;
  start: string;
  end: string | null;
}

interface ChangeLog {
  productId: string;
  field: string;
  oldVal: string;
  newVal: string;
  at: string;
  by: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
}

function dedupeProducts(products: Product[]) {
  return Array.from(
    new Map(products.map(p => [p.id, p])).values()
  );
}

/* ================= MAIN ================= */

export default function ProductManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  const saved = localStorage.getItem("categories");
  if (saved) {
    setCategories(JSON.parse(saved));
  }
}, []);



  const [products, setProducts] = useState<Product[]>(() => {
  const saved = localStorage.getItem("products");
  return saved
    ? dedupeProducts(JSON.parse(saved))
    : [
        {
          id: "P001",
          name: "Cement OPC",
          description: "Construction cement",
          categoryId: "C001",
          price: 350,
          stockQty: 120,
          gst: "18",
          taxableAmount: "42000",
          sku: "CEM-01",
          batchNo: "B001",
          hsn: "2523",
          manufacturer: "UltraTech",
          mfgDate: "2025-12-01",
          expDate: "2026-12-01",
          packSize: "50kg",
          uom: "Bag",
          createdAt: "2026-01-10",
          createdBy: "Admin",
          updatedAt: "2026-01-12",
          updatedBy: "Admin",
        },
      ];
});

    

const idCounter = useRef(1);

useEffect(() => {
  if (products.length === 0) return;

  const maxId = Math.max(
    ...products.map(p => Number(p.id.replace("P", "")))
  );

  idCounter.current = maxId + 1;
}, [products]);

  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>(() => {
    const saved = localStorage.getItem("priceHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>(() => {
    const saved = localStorage.getItem("changeLogs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
  const clean = dedupeProducts(products);
  localStorage.setItem("products", JSON.stringify(clean));
}, [products]);


  useEffect(() => {
    localStorage.setItem("priceHistory", JSON.stringify(priceHistory));
  }, [priceHistory]);

  useEffect(() => {
    localStorage.setItem("changeLogs", JSON.stringify(changeLogs));
  }, [changeLogs]);

  const [mode, setMode] = useState<Mode>("list");
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [logSearchId, setLogSearchId] = useState("");

  const activeProducts = products.filter(p => !p.deletedAt);
  const deletedProducts = [...products]
  .filter(p => p.deletedAt)
  .sort((a, b) => {
    // 1️⃣ Latest delete first
    const d1 = new Date(b.deletedAt!).getTime();
    const d2 = new Date(a.deletedAt!).getTime();
    if (d1 !== d2) return d1 - d2;

    // 2️⃣ Same deletedAt → fallback to updatedAt
    return (
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
    );
  });



  const filteredProducts = [...activeProducts]
  .filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );




  const filteredPriceHistory = [...priceHistory]
  .filter(p =>
    logSearchId ? p.productId.includes(logSearchId) : true
  )
  .sort((a, b) => {
    // 1️⃣ Current prices first
    if (a.end === null && b.end !== null) return -1;
    if (a.end !== null && b.end === null) return 1;

    // 2️⃣ Both current OR both old → latest start first
    return new Date(b.start).getTime() - new Date(a.start).getTime();
  });




  const filteredChangeLogs = [...changeLogs]
  .filter(c =>
    logSearchId ? c.productId.includes(logSearchId) : true
  )
  .sort(
    (a, b) =>
      new Date(b.at).getTime() - new Date(a.at).getTime()
  );


  const handleSave = (data: Product) => {
    const now = new Date().toISOString();

    if (mode === "add") {
      const newId = `P${String(idCounter.current).padStart(3, "0")}`;
      idCounter.current++;

      const newProduct = {
        ...data,
        id: newId,
        createdAt: now,
        createdBy: loggedInUser.role,
        updatedAt: now,
        updatedBy: loggedInUser.role,
      };

      setProducts(prev => [...prev, newProduct]);

      setPriceHistory(prev => [
        ...prev,
        { productId: newId, price: newProduct.price, start: now, end: null },
      ]);
    }

    if (mode === "edit" && selected) {
      Object.keys(data).forEach(key => {
        const k = key as keyof Product;
        if (data[k] !== selected[k]) {
          setChangeLogs(prev => [
            ...prev,
            {
              productId: data.id,
              field: k,
              oldVal: String(selected[k]),
              newVal: String(data[k]),
              at: now,
              by: loggedInUser.role,
            },
          ]);
        }
      });

      if (data.price !== selected.price) {
        setPriceHistory(prev =>
          prev.map(p =>
            p.productId === data.id && p.end === null
              ? { ...p, end: now }
              : p
          )
        );

        setPriceHistory(prev => [
          ...prev,
          { productId: data.id, price: data.price, start: now, end: null },
        ]);
      }

      setProducts(prev =>
        prev.map(p =>
          p.id === data.id
            ? { ...data, updatedAt: now, updatedBy: loggedInUser.role }
            : p
        )
      );
    }

    setMode("list");
  };

  const handleDelete = (id: string) => {
  const product = products.find(p => p.id === id);
  if (product?.deletedAt) return;

  if (window.confirm("Delete this product?")) {
    const now = new Date().toISOString();
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, deletedAt: now, updatedAt: now }
          : p
      )
    );
  }
};


const handleRestore = (id: string) => {
  setProducts(prev =>
    prev.map(p =>
      p.id === id ? { ...p, deletedAt: undefined } : p
    )
  );
};




  return (
    <div className="pm-container">
      {mode === "list" && (
        <>
          <div className="pm-header">
            <div style={{ position: "relative", display: "inline-flex" }}>
              <FiSearch style={{ position: "absolute", left: 12, top: 10 }} />
              <input
                className="pm-search"
                placeholder="Search by Product Name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            <div className="pm-btn-group">
              <button className="primary" onClick={() => setMode("add")}>
                + Add Product
              </button>
              <button className="secondary" onClick={() => setMode("deleted")}>
  View History
</button>

              <button className="secondary" onClick={() => setMode("priceHistory")}>
                View Price History
              </button>
              <button className="secondary" onClick={() => setMode("changeLog")}>
                View Change Log
              </button>
            </div>
          </div>

          <div className="pm-card">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category ID</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>GST %</th>
                  <th>Taxable Amount</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th align="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.id}</td>
                    <td><b>{p.name}</b></td>
                    <td>{p.categoryId}</td>
                    <td>₹{p.price}</td>
                    <td>{p.stockQty}</td>
                    <td>{p.gst}%</td>
                    <td>₹{p.taxableAmount}</td>
                    <td>{p.createdAt}</td>
                    <td>{p.updatedAt}</td>
                    <td className="right">
                      <div className="pm-actions">
                        <button className="btn-view" onClick={() => { setSelected(p); setMode("view"); }}>View</button>
                        <button className="btn-edit" onClick={() => { setSelected(p); setMode("edit"); }}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(mode === "add" || mode === "edit" || mode === "view") && (
        <ProductForm
  mode={mode}
  data={selected}
  onCancel={() => setMode("list")}
  onSave={handleSave}
  categories={categories}
/>

      )}

      {mode === "priceHistory" && (
        <HistoryTable
          title="Price History"
          search={logSearchId}
          setSearch={setLogSearchId}
          headers={["Product ID", "Price", "Start", "End"]}
          rows={filteredPriceHistory.map(p => [
            p.productId,
            `₹${p.price}`,
            p.start,
            p.end ?? "Current",
          ])}
          onBack={() => setMode("list")}
        />
      )}

      {mode === "changeLog" && (
        <HistoryTable
          title="Change Log"
          search={logSearchId}
          setSearch={setLogSearchId}
          headers={["Product ID", "Field", "Old", "New", "Date", "By"]}
          rows={filteredChangeLogs.map(c => [
            c.productId,
            c.field,
            c.oldVal,
            c.newVal,
            c.at,
            c.by,
          ])}
          onBack={() => setMode("list")}
        />
      )}
      {mode === "deleted" && (
  <div className="pm-card">
    <h3>Deleted Products</h3>

    <table className="pm-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Product ID</th>
          <th>Product Name</th>
          <th>Category ID</th>
          <th>Price</th>
          <th>Stock</th>
          <th>GST %</th>
          <th>Taxable Amount</th>
          <th>Created</th>
          <th>Updated</th>
          <th>Deleted At</th>
          <th align="right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {deletedProducts.map((p, i) => (
          <tr key={p.id}>
            <td>{i + 1}</td>
            <td>{p.id}</td>
            <td><b>{p.name}</b></td>
            <td>{p.categoryId}</td>
            <td>₹{p.price}</td>
            <td>{p.stockQty}</td>
            <td>{p.gst}%</td>
            <td>₹{p.taxableAmount}</td>
            <td>{p.createdAt}</td>
            <td>{p.updatedAt}</td>
            <td>{p.deletedAt}</td>

            <td align="right">
              <button
                className="btn-restore"
                onClick={() => handleRestore(p.id)}
              >
                Restore
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="pm-footer">
      <button className="secondary" onClick={() => setMode("list")}>
        Back
      </button>
    </div>
  </div>
)}

    </div>
  );
}


/* ================= HISTORY TABLE ================= */

function HistoryTable({ title, headers, rows, onBack, search, setSearch }: any) {
  return (
    <div className="pm-card">
      <h3>{title}</h3>

      <input
        placeholder="Search by Product ID (ex: P001)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: "15px", width: "260px" }}
      />

      <table className="pm-table">
        <thead>
          <tr>
            {headers.map((h: string) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any[], i: number) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pm-footer">
        <button className="secondary" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

/* ================= FORM ================= */


function ProductForm({ mode, data, onCancel, onSave, categories }: any) {
  const [form, setForm] = useState<Product>(
    data ?? {
      id: "",
      name: "",
      description: "",
      categoryId: "",
      price: 0,
      stockQty: 0,
      gst: "",
      taxableAmount: "0",
      sku: "",
      batchNo: "",
      hsn: "",
      manufacturer: "",
      mfgDate: "",
      expDate: "",
      packSize: "",
      uom: "",
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: loggedInUser.role,
      updatedAt: new Date().toISOString().slice(0, 10),
      updatedBy: loggedInUser.role,
    }
  );

  const readOnly = mode === "view";
  const [showError, setShowError] = useState(false);


  useEffect(() => {
    setForm(prev => ({
      ...prev,
      taxableAmount: String(prev.price * prev.stockQty),
    }));
  }, [form.price, form.stockQty]);
  
  const isValid =
  form.name.trim() &&
  form.categoryId &&
  form.stockQty > 0 &&
  form.price > 0 &&
  form.gst &&
  form.mfgDate &&
  form.expDate &&
  new Date(form.expDate) > new Date(form.mfgDate);


  return (
    <div className="pm-form-wrapper">
      <div className="pm-form-card">
        <h2>{mode.toUpperCase()} PRODUCT</h2>

        <div className="pm-form-grid">
  {/* Row 1 */}
  {mode !== "add" && (
  <div>
    <label>Product ID</label>
    <input disabled value={form.id} />
  </div>
)}


  <div>
    <label>Product Name *</label>
    <input
      disabled={readOnly}
      value={form.name}
      onChange={e => setForm({ ...form, name: e.target.value })}
    />
  </div>

  {/* Row 2 */}
  <div>
   <label>Category *</label>
<select
  disabled={readOnly}
  value={form.categoryId}
  onChange={e => setForm({ ...form, categoryId: e.target.value })}
>
  <option value="">Select Category</option>
  {categories.map(c => (
    <option key={c.code} value={c.code}>
      {c.name} ({c.code})
    </option>
  ))}
</select>

  </div>

  <div>
    <label>SKU</label>
    <input
      disabled={readOnly}
      value={form.sku}
      onChange={e => setForm({ ...form, sku: e.target.value })}
    />
  </div>

  {/* Row 3 */}
  <div>
    <label>Batch No</label>
    <input
      disabled={readOnly}
      value={form.batchNo}
      onChange={e => setForm({ ...form, batchNo: e.target.value })}
    />
  </div>

  <div>
    <label>HSN</label>
    <input
      disabled={readOnly}
      value={form.hsn}
      onChange={e => setForm({ ...form, hsn: e.target.value })}
    />
  </div>

  {/* Row 4 */}
  <div>
    <label>Manufacturer</label>
    <input
      disabled={readOnly}
      value={form.manufacturer}
      onChange={e => setForm({ ...form, manufacturer: e.target.value })}
    />
  </div>

  <div>
    <label>Pack Size</label>
    <input
      disabled={readOnly}
      value={form.packSize}
      onChange={e => setForm({ ...form, packSize: e.target.value })}
    />
  </div>

  {/* Row 5 */}
  <div>
    <label>Unit of Measure</label>
    <input
      disabled={readOnly}
      value={form.uom}
      onChange={e => setForm({ ...form, uom: e.target.value })}
    />
  </div>

  <div>
    <label>Tax % *</label>
    <input
      disabled={readOnly}
      value={form.gst}
      onChange={e => setForm({ ...form, gst: e.target.value })}
    />
  </div>

  {/* Row 6 */}
  <div>
    <label>Price *</label>
    <input
      type="number"
      disabled={readOnly}
      value={form.price}
      onChange={e => setForm({ ...form, price: Number(e.target.value) })}
    />
  </div>

  <div>
    <label>Stock Qty *</label>
    <input
      type="number"
      disabled={readOnly}
      value={form.stockQty}
      onChange={e => setForm({ ...form, stockQty: Number(e.target.value) })}
    />
  </div>

  {/* Row 7 */}
  <div>
    <label>Manufacture Date *</label>
    <input
      type="date"
      disabled={readOnly}
      value={form.mfgDate}
      onChange={e => setForm({ ...form, mfgDate: e.target.value })}
    />
  </div>

  <div>
    <label>Expiry Date *</label>
    <input
  type="date"
  disabled={readOnly}
  value={form.expDate}
  min={form.mfgDate}
  onChange={e => setForm({ ...form, expDate: e.target.value })}
/>

  </div>

  {/* Full width */}
  <div className="pm-form-full">
    <label>Description</label>
    <textarea
      disabled={readOnly}
      value={form.description}
      onChange={e => setForm({ ...form, description: e.target.value })}
      rows={3}
    />
  </div>

  <div className="pm-form-full">
    <label>Taxable Amount (Auto) *</label>
    <input disabled value={form.taxableAmount} />
  </div>
</div>


        {mode === "view" && (
          <div className="pm-form-grid" style={{ marginTop: 24 }}>
            <div>
              <label>Created By</label>
              <input disabled value={form.createdBy} />
            </div>
            <div>
              <label>Created At</label>
              <input disabled value={form.createdAt} />
            </div>
            <div>
              <label>Updated By</label>
              <input disabled value={form.updatedBy} />
            </div>
            <div>
              <label>Updated At</label>
              <input disabled value={form.updatedAt} />
            </div>
          </div>
        )}

         {showError && (
  <div className="pm-popup-overlay">
    <div className="pm-popup">
      <h3>⚠️ Missing Required Fields</h3>
      <p>Please fill all * marked fields correctly before saving.</p>
      <button
        className="primary"
        onClick={() => setShowError(false)}
      >
        OK
      </button>
    </div>
  </div>
)}

                <div className="pm-footer">
          <button className="secondary" onClick={onCancel}>
            Back
          </button>

          {mode !== "view" && (
            <button
  className="primary"
  onClick={() => {
    if (!isValid) {
      setShowError(true);
      return;
    }
    onSave(form);
  }}
>
  Save
</button>

          )}
        </div>
      </div>
    </div>
  );
}
