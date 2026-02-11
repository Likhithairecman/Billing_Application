import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import "../App.css";
import "./CategoryManagementPage.css";

/* ================= CATEGORY TYPES ================= */

export interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface CategoryCreate {
  name: string;
  code: string;
  description: string;
}

export type CategoryUpdate = Category;

/* ================= AUDIT TYPES ================= */

interface UserAudit {
  id: number;
  role: "admin" | "staff";
}

/* ================= PAGE TYPES ================= */

type Mode = "list" | "add" | "view" | "edit" | "history";

interface CategoryWithDates extends Category {
  created_at?: string;
  updated_at?: string;
  created_by?: UserAudit;
  updated_by?: UserAudit;
}

/* ================= HELPERS ================= */

function generateNextCode(categories: { code: string }[]) {
  const numbers = categories
    .map(c => parseInt(c.code.replace("C", ""), 10))
    .filter(n => !isNaN(n));

  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `C${String(next).padStart(3, "0")}`;
}

/* ================= MAIN ================= */

export default function CategoryManagementPage() {
  const loggedInUser: UserAudit = {
    id: 1,
    role: "admin",
  };

  const [categories, setCategories] = useState<CategoryWithDates[]>([
    {
      id: 1,
      name: "Cement",
      code: "C001",
      description: "Construction Material",
      created_at: "2026-01-10",
      updated_at: "2026-01-12",
      created_by: { id: 1, role: "admin" },
      updated_by: { id: 2, role: "staff" },
    },
    {
      id: 2,
      name: "Steel",
      code: "C002",
      description: "Raw Material",
      created_at: "2026-01-09",
      updated_at: "2026-01-11",
      created_by: { id: 2, role: "staff" },
      updated_by: { id: 2, role: "staff" },
    },
  ]);

  const [deletedCategories, setDeletedCategories] = useState<CategoryWithDates[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [selected, setSelected] = useState<CategoryWithDates | null>(null);
  const [search, setSearch] = useState("");

  /* ====== ✅ ADDED: persist categories for Product page ====== */
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);
  /* ========================================================== */

  const handleSave = (data: CategoryWithDates) => {
    const today = new Date().toISOString().slice(0, 10);

    if (mode === "add") {
      setCategories(prev => [
        ...prev,
        {
          ...data,
          created_at: today,
          updated_at: today,
          created_by: loggedInUser,
          updated_by: loggedInUser,
        },
      ]);
    } else {
      setCategories(prev =>
        prev.map(c =>
          c.id === data.id
            ? {
                ...c,
                ...data,
                updated_at: today,
                updated_by: loggedInUser,
              }
            : c
        )
      );
    }

    setMode("list");
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    setCategories(prev => {
      const deleted = prev.find(c => c.id === id);

      if (deleted) {
  setDeletedCategories(d =>
    d.some(dc => dc.id === deleted.id)
      ? d
      : [
          {
            ...deleted,
            updated_at: new Date().toISOString(), // ✅ delete time
          },
          ...d, // ✅ put on top
        ]
  );
}


      return prev.filter(c => c.id !== id);
    });
  };

  const filtered = [...categories]
  .filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) =>
    new Date(b.updated_at ?? "").getTime() -
    new Date(a.updated_at ?? "").getTime()
  );


  /* ================= UI ================= */

  return (
    <div className="category-container">
      {/* ================= LIST ================= */}
      {mode === "list" && (
        <>
          <div className="category-header">
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <FiSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "#6b7280",
                  fontSize: "14px",
                  pointerEvents: "none",
                }}
              />
              <input
                className="category-search"
                placeholder="Search by Category Code"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: "36px", width: "260px" }}
              />
            </div>

            {/* ✅ Button order fixed */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="primary"
                onClick={() => {
                  setSelected({
                    id: Date.now(),
                    name: "",
                    code: generateNextCode(categories),
                    description: "",
                  });
                  setMode("add");
                }}
              >
                + Add Category
              </button>

              <button className="secondary" onClick={() => setMode("history")}>
                View History
              </button>
            </div>
          </div>

          <div className="category-card">
            <table className="category-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th align="right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.code}</td>
                    <td>{c.description}</td>
                    <td>{c.created_at}</td>
                    <td>{c.updated_at}</td>
                    <td align="right">
                      <div className="action-group">
                        <button
                          className="btn-view"
                          onClick={() => {
                            setSelected(c);
                            setMode("view");
                          }}
                        >
                          View
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setSelected(c);
                            setMode("edit");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= VIEW HISTORY ================= */}
      {mode === "history" && (
        <div className="category-card">
          <button className="secondary" onClick={() => setMode("list")}>
            ← Back
          </button>

          <table className="category-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Deleted At</th>
                <th align="right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {deletedCategories.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                    No deleted categories
                  </td>
                </tr>
              )}

              {[...deletedCategories]
  .sort(
    (a, b) =>
      new Date(b.updated_at ?? "").getTime() -
      new Date(a.updated_at ?? "").getTime()
  )
  .map((c, i) => (

                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.code}</td>
                  <td>{c.description}</td>
                  <td>{c.updated_at ?? "-"}</td>
                  <td align="right">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setCategories(prev => [...prev, c]);
                        setDeletedCategories(prev =>
                          prev.filter(d => d.id !== c.id)
                        );
                      }}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= FORM ================= */}
      {(mode === "add" || mode === "edit" || mode === "view") && (
        <CategoryForm
          mode={mode}
          data={selected}
          onCancel={() => setMode("list")}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ================= FORM ================= */

function CategoryForm({
  mode,
  data,
  onCancel,
  onSave,
}: {
  mode: Mode;
  data: CategoryWithDates | null;
  onCancel: () => void;
  onSave: (c: CategoryWithDates) => void;
}) {
  const [form, setForm] = useState<CategoryWithDates>(
    data ?? { id: Number(new Date()), name: "", code: "", description: "" }
  );

  const readOnly = mode === "view";
  const isValid =
  form.name.trim() !== "" &&
  form.code.trim() !== "";

const [showError, setShowError] = useState(false);


  return (
    <div className="form-wrapper">
      <div className="form-card">
        <h2>
          {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"} Category
        </h2>

        <label>Category Name *</label>
        <input
          disabled={readOnly}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <label>Category Code *</label>
        <input disabled value={form.code} />

        <label>Description</label>
        <textarea
          disabled={readOnly}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={3}
        />

        {mode === "view" && (
          <>
            <label>Created By</label>
            <input disabled value={form.created_by?.role ?? "-"} />

            <label>Created At</label>
            <input disabled value={form.created_at ?? "-"} />

            <label>Last Updated By</label>
            <input disabled value={form.updated_by?.role ?? "-"} />

            <label>Last Updated At</label>
            <input disabled value={form.updated_at ?? "-"} />
          </>
        )}
        
        {mode === "add" && showError && (
  <div className="pm-popup-overlay">
    <div className="pm-popup">
      <h3>⚠️ Missing Required Fields</h3>
      <p>Please fill all * marked fields before saving.</p>
      <button
        className="primary"
        onClick={() => setShowError(false)}
      >
        OK
      </button>
    </div>
  </div>
)}

        <div className="form-actions">
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
