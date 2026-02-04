import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { useDashboard } from "../DashboardPage/DashboardContext";
import "./Header.css";

const PAGE_TITLES: Record<string, string> = {
  "/customers": "CUSTOMER MANAGEMENT",
  "/categories": "CATEGORY MANAGEMENT",
  "/products": "PRODUCT MANAGEMENT",
  "/invoices": "INVOICE MANAGEMENT",
  "/payments": "PAYMENT AND RECEIPT MANAGEMENT",
  "/payments/receipts": "PAYMENT AND RECEIPT MANAGEMENT",
  "/payments/receive": "PAYMENT AND RECEIPT MANAGEMENT",
  "/reports": "REPORTS",
  "/profile": "PROFILE",
  "/settings": "SETTINGS",
  "/loan-recovery": "LOAN RECOVERY",
  "/create-loan": "CREATE LOAN",
  "/view-history": "VIEW HISTORY",
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/customers": "Keep customer records, pending dues, and credit information aligned with your invoices.",
  "/categories": "Organize products into logical groups for better inventory tracking.",
  "/products": "Manage product catalog, pricing, and stock.",
  "/invoices": "Create, send, and track invoices.",
  "/payments": "Tip: amounts recorded here update the Total Revenue stat instantly.",
  "/payments/receipts": "Track and manage your customer payment receipts",
  "/reports": "Generate and export performance reports.",
  "/profile": "View and update your basic information.",
  "/settings": "Manage your application preferences and configurations.",
  "/loan-recovery": "Record recovered loan payments with audit tracking.",
  "/create-loan": "Create and manage loans for your customers.",
  "/view-history": "View and restore previously deleted customer records.",
};

export default function Header() {
  const { userProfile } = useDashboard();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const isDashboard = location.pathname === "/dashboard";

  // Find the closest matching title
  const getPageTitle = (path: string) => {
    // Exact match first
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];

    // Check if it's a sub-path (e.g. /payments/receipts/1 -> /payments/receipts)
    const segments = path.split('/');
    for (let i = segments.length - 1; i > 0; i--) {
      const subPath = segments.slice(0, i).join('/');
      if (PAGE_TITLES[subPath]) return PAGE_TITLES[subPath];
    }

    return "Dashboard";
  };

  // Find the closest matching description
  const getPageDescription = (path: string) => {
    // Exact match first
    if (PAGE_DESCRIPTIONS[path]) return PAGE_DESCRIPTIONS[path];

    // Check if it's a sub-path
    const segments = path.split('/');
    for (let i = segments.length - 1; i > 0; i--) {
      const subPath = segments.slice(0, i).join('/');
      if (PAGE_DESCRIPTIONS[subPath]) return PAGE_DESCRIPTIONS[subPath];
    }

    return null;
  };

  const pageTitle = getPageTitle(location.pathname);
  const pageDescription = getPageDescription(location.pathname);

  /* Update time ONLY on dashboard */
  useEffect(() => {
    if (isDashboard) {
      const id = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(id);
    }
  }, [isDashboard]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="header">
      {/* LEFT SECTION */}
      <div className="header-left">
        {isDashboard ? (
          <>
            <p className="eyebrow">Welcome back!!!</p>
            <h2 className="heading">Billing overview</h2>
            <p className="muted">
              {formattedDate} • {formattedTime}
            </p>
          </>
        ) : (
          <>
            <h2 className="heading">{pageTitle ?? "Dashboard"}</h2>
            {pageDescription && (
              <p className="muted">{pageDescription}</p>
            )}
          </>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="header-actions">
        <div className="profile-wrapper" ref={menuRef}>
          <button
            className="profile"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="avatar">
              {userProfile?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span className="profile-name">{userProfile?.name || "Admin"}</span>
            <FiChevronDown />
          </button>

          {open && (
            <div className="profile-menu">
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => {
                  navigate("/profile");
                  setOpen(false);
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => {
                  // logout logic here
                  setOpen(false);
                  navigate("/");
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
