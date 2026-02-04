import { useMemo, useEffect, useState } from "react";
import { getReceipts } from "../PaymentReceipts/receiptStorage";

export default function RevenueChart() {
  const [receipts, setReceipts] = useState(getReceipts());

  // Listen for receipt updates
  useEffect(() => {
    const handleStorageChange = () => {
      setReceipts(getReceipts());
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 2 seconds to catch same-tab changes
    const interval = setInterval(() => {
      setReceipts(getReceipts());
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Aggregate payments by date (last 10 payments)
  const chartData = useMemo(() => {
    if (receipts.length === 0) {
      return [];
    }

    // Sort by date descending and take last 10
    const sortedReceipts = [...receipts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .reverse(); // Reverse to show oldest to newest

    // Find max value for scaling
    const maxAmount = Math.max(...sortedReceipts.map(r => r.amount), 1000);

    return sortedReceipts.map(receipt => ({
      label: new Date(receipt.date).getDate().toString() + '/' + (new Date(receipt.date).getMonth() + 1),
      value: receipt.amount,
      height: (receipt.amount / maxAmount) * 100,
      customer: receipt.customer
    }));
  }, [receipts]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h3>Recent payments</h3>
        <span className="pill">Recent Transactions</span>
      </div>
      <div className="chart-container" style={{
        height: '200px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '20px 0',
        gap: '10px'
      }}>
        {chartData.length === 0 ? (
          <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8' }}>
            No recent payment data to display
          </div>
        ) : (
          chartData.map((data, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              height: '100%'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}>
                <div
                  className="bar"
                  style={{
                    height: `${data.height}%`,
                    width: '60%',
                    backgroundColor: '#1B5E20', /* Matches Loan button color for consistency */
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: '4px'
                  }}
                  title={`₹${data.value}`}
                ></div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                {data.label}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
