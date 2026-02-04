import {
  FiUsers,
  FiBox,
  FiFileText,
  FiCreditCard,
  FiBarChart2,
} from "react-icons/fi";
import { useState, useEffect } from "react";

import StatCard from "./StatCard";
import QuickAction from "./QuickAction";
import RevenueChart from "./RevenueChart";
import TopProducts from "./TopProducts";
import { useDashboard } from "./DashboardContext";
import { getInvoices } from "../PaymentReceipts/invoiceStorage";
import { getReceipts } from "../PaymentReceipts/receiptStorage";
import "./DashboardPage.css";

export default function Dashboard() {
  const { customers, totalRecovered, products } = useDashboard();
  const [invoices, setInvoices] = useState(getInvoices());
  const [receipts, setReceipts] = useState(getReceipts());

  // Listen for invoice and receipt updates
  useEffect(() => {
    const handleUpdate = () => {
      setInvoices(getInvoices());
      setReceipts(getReceipts());
    };

    window.addEventListener('storage', handleUpdate);

    // Poll for updates every 2 seconds
    const interval = setInterval(handleUpdate, 2000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const totalInvoiceCount = invoices.length || customers.reduce((acc, c) => acc + c.purchaseHistory.length, 0);
  // const totalPayments = receipts.reduce((sum, r) => sum + r.amount, 0);

  const stats = [
    { title: "Total Customers", value: customers.length.toString(), icon: <FiUsers /> },
    { title: "Total Products", value: products.length.toString(), icon: <FiBox /> },
    { title: "Total Invoices", value: totalInvoiceCount.toLocaleString(), icon: <FiFileText /> },
    { title: "Total Recovered", value: `₹${totalRecovered.toLocaleString()}`, icon: <FiCreditCard /> },
  ];

  const quickActions = [
    { title: "Customer Management", description: "Add or edit customers", icon: <FiUsers style={{ color: "#7c4dff" }} />, to: "/customers" },
    { title: "Category Management", description: "Organize catalog", icon: <FiBox style={{ color: "#ffab40" }} />, to: "/categories" },
    { title: "Product Management", description: "Update pricing & stock", icon: <FiFileText style={{ color: "#90a4ae" }} />, to: "/products" },
    { title: "Payment & Receipts", description: "Record payments", icon: <FiCreditCard style={{ color: "#40c4ff" }} />, to: "/payments" },
    { title: "Invoice Management", description: "Create & track invoices", icon: <FiFileText style={{ color: "#e0e0e0" }} />, to: "/invoices" },
    { title: "Reports", description: "Download exports", icon: <FiBarChart2 style={{ color: "#ffeb3b" }} />, to: "/reports" },
  ];

  return (
    <>
      <section className="stat-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Quick Actions</h3>
          <div className="panel-actions">

          </div>
        </div>
        <div className="quick-actions">
          {quickActions.map((action) => (
            <QuickAction key={action.title} {...action} />
          ))}
        </div>
      </section>

      <div className="grid-two">
        <RevenueChart />
        <TopProducts />
      </div>
    </>
  );
}