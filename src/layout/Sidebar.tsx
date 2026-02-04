import { FiSettings } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
  { label: "Dashboard", icon: "📊", path: "/dashboard" },
  { label: "Customer Management", icon: "👥", path: "/customers" },
  { label: "Category Management", icon: "📁", path: "/categories" },
  { label: "Product Management", icon: "📦", path: "/products" },
  { label: "Invoice Management", icon: "🧾", path: "/invoices" },
  { label: "Payment & Receipts", icon: "💳", path: "/payments/receipts" },
  { label: "Reports", icon: "📈", path: "/reports" },
];
export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon"></span>
        <div>
          <div className="brand-name">Billing App</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="settings-row"
          onClick={() => navigate("/settings")}
        >
          <span className="nav-icon">
            <FiSettings />
          </span>
          <div>
            <div className="footer-title">Settings</div>
            <div className="footer-subtitle">Manage app preferences</div>
          </div>
        </button>
      </div>
    </aside>
  );
}