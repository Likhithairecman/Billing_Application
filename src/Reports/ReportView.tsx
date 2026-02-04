import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Reports.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getReceipts } from '../PaymentReceipts/receiptStorage';
import { getInvoices } from '../PaymentReceipts/invoiceStorage';

// Try to import recharts components
let rechartsAvailable = false;
let ChartComponents: Record<string, any> | null = null;

interface ReportData {
  date: string;
  receiptNumber: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  balance: number;
  paymentMethod: string;
}

const ReportView = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  // Set default dates (last 36 months to include 2024 data)
  const getDefaultDates = () => {
    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setMonth(today.getMonth() - 36);
    return {
      fromDate: threeYearsAgo.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
    };
  };

  const defaultDates = getDefaultDates();

  const [filters, setFilters] = useState({
    fromDate: defaultDates.fromDate,
    toDate: defaultDates.toDate,
    customer: '',
    invoiceStatus: 'all',
    paymentMethod: '',
  });

  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Check if recharts is loaded
  useEffect(() => {
    const loadRecharts = async () => {
      try {
        const recharts = await import('recharts');
        ChartComponents = {
          LineChart: recharts.LineChart,
          Line: recharts.Line,
          BarChart: recharts.BarChart,
          Bar: recharts.Bar,
          PieChart: recharts.PieChart,
          Pie: recharts.Pie,
          Cell: recharts.Cell,
          XAxis: recharts.XAxis,
          YAxis: recharts.YAxis,
          CartesianGrid: recharts.CartesianGrid,
          Tooltip: recharts.Tooltip,
          Legend: recharts.Legend,
          ResponsiveContainer: recharts.ResponsiveContainer,
        };
        rechartsAvailable = true;
        setChartsLoaded(true);
      } catch {
        console.warn('Recharts not available. Install with: npm install recharts');
        rechartsAvailable = false;
        setChartsLoaded(true);
      }
    };

    loadRecharts();
  }, []);

  const reportTitles: Record<string, string> = {
    'total-sales': 'Total Sales Report',
    'daily-sales': 'Daily Sales Report',
    'monthly-sales': 'Monthly Sales Report',
    'customer-sales': 'Customer-wise Sales',
    'outstanding-invoices': 'Outstanding Invoices Report',
    'collection-report': 'Collections Report',
  };

  const generateReport = useCallback((isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const receipts = getReceipts();
      const invoices = getInvoices();

      let filteredData: ReportData[] = [];

      if (reportId === 'collection-report') {
        filteredData = receipts.map(r => {
          const invoice = invoices.find(inv => inv.invoiceNumber === r.invoiceNumber);
          return {
            date: r.date,
            receiptNumber: r.receiptNumber,
            invoiceNumber: r.invoiceNumber,
            customerName: r.customer,
            amount: r.amount,
            balance: invoice ? invoice.balanceAmount : 0,
            paymentMethod: r.paymentMethod
          };
        });
      } else if (reportId === 'outstanding-invoices') {
        filteredData = invoices
          .filter(inv => inv.balanceAmount > 0)
          .map(inv => ({
            date: inv.date,
            receiptNumber: '-',
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            amount: inv.totalAmount,
            balance: inv.balanceAmount,
            paymentMethod: 'N/A'
          }));
      } else {
        filteredData = invoices.map(inv => {
          const invoiceReceipts = receipts.filter(r => r.invoiceNumber === inv.invoiceNumber);
          const latestReceipt = invoiceReceipts.length > 0
            ? invoiceReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;

          return {
            date: inv.date,
            receiptNumber: latestReceipt ? latestReceipt.receiptNumber : '-',
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            amount: inv.totalAmount,
            balance: inv.balanceAmount,
            paymentMethod: latestReceipt ? latestReceipt.paymentMethod : (inv.status === 'pending' ? 'Unpaid' : 'N/A')
          };
        });
      }

      filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (reportId === 'customer-sales') {
        filteredData.sort((a, b) => a.customerName.localeCompare(b.customerName));
      }

      if (filters.customer) {
        filteredData = filteredData.filter(item =>
          item.customerName.toLowerCase().includes(filters.customer.toLowerCase())
        );
      }

      if (filters.paymentMethod && reportId !== 'outstanding-invoices') {
        filteredData = filteredData.filter(item =>
          item.paymentMethod.toLowerCase() === filters.paymentMethod.toLowerCase()
        );
      }

      if (filters.invoiceStatus && filters.invoiceStatus !== 'all') {
        const status = filters.invoiceStatus;
        filteredData = filteredData.filter(item => {
          const inv = invoices.find(i => i.invoiceNumber === item.invoiceNumber);
          if (!inv) return true;
          return status === 'paid' ? inv.status === 'paid' : inv.status !== 'paid';
        });
      }

      if (filters.fromDate && filters.toDate) {
        const from = new Date(filters.fromDate).getTime();
        const to = new Date(filters.toDate).getTime();
        filteredData = filteredData.filter(item => {
          const d = new Date(item.date).getTime();
          return d >= from && d <= to;
        });
      }

      setReportData(filteredData);
      if (!isSilent) setLoading(false);
    }, isSilent ? 0 : 100);
  }, [reportId, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset generation state when report type changes (user must click button for each report)
  useEffect(() => {
    setHasGenerated(false);
    setReportData([]);
  }, [reportId]);

  // Sync with storage changes
  useEffect(() => {
    const handleSync = () => {
      if (hasGenerated) generateReport(true);
    };

    window.addEventListener('storage', handleSync);

    // Also poll for updates every 2 seconds (same-tab insurance)
    const interval = setInterval(handleSync, 2000);

    return () => {
      window.removeEventListener('storage', handleSync);
      clearInterval(interval);
    };
  }, [hasGenerated, generateReport]);

  const handleGenerateReport = () => {
    if (!filters.fromDate || !filters.toDate) {
      alert('Please select From Date and To Date');
      return;
    }
    setHasGenerated(true);
    generateReport();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const input = document.getElementById('report-export-container');
    if (!input) {
      alert('Report content not found');
      return;
    }

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${reportId || 'report'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleExportExcel = () => {
    if (!reportData.length) return;

    const headers = [
      'Date', 'Receipt Number', 'Invoice Number', 'Customer Name', 'Amount', 'Balance', 'Payment Method',
    ];

    const rows = reportData.map((row) => [
      new Date(row.date).toLocaleDateString(),
      row.receiptNumber,
      row.invoiceNumber,
      row.customerName,
      row.amount.toString(),
      row.balance.toString(),
      row.paymentMethod,
    ]);

    const totals = calculateTotals();
    rows.push([
      'GRAND TOTALS', '', '', '', totals.totalAmount.toString(), totals.totalBalance.toString(), ''
    ]);

    const csvContent = [headers, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportId || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateTotals = () => {
    return {
      totalAmount: reportData.reduce((sum, item) => sum + item.amount, 0),
      totalBalance: reportData.reduce((sum, item) => sum + item.balance, 0),
    };
  };

  const totals = calculateTotals();

  const getMonthlySalesData = () => {
    const monthlyData: Record<string, { month: string; amount: number }> = {};
    reportData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, amount: 0 };
      }
      monthlyData[monthKey].amount += item.amount;
    });
    return Object.values(monthlyData);
  };

  const getCustomerSalesData = () => {
    const customerData: Record<string, number> = {};
    reportData.forEach(item => {
      if (!customerData[item.customerName]) {
        customerData[item.customerName] = 0;
      }
      customerData[item.customerName] += item.amount;
    });
    return Object.entries(customerData).map(([name, value]) => ({ name, value }));
  };

  const getPaymentMethodData = () => {
    const methodData: Record<string, number> = {};
    reportData.forEach(item => {
      if (!methodData[item.paymentMethod]) {
        methodData[item.paymentMethod] = 0;
      }
      methodData[item.paymentMethod] += item.amount;
    });
    return Object.entries(methodData).map(([name, value]) => ({ name, value }));
  };

  const getDailySalesData = () => {
    const dailyData: Record<string, { date: string; amount: number }> = {};
    reportData.forEach((item) => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, amount: 0 };
      }
      dailyData[dateKey].amount += item.amount;
    });
    return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const monthlySalesData = getMonthlySalesData();
  const customerSalesData = getCustomerSalesData();
  const paymentMethodData = getPaymentMethodData();
  const DAILY_SALES_DATA = getDailySalesData();

  const COLORS = ['#2E7D32', '#1565C0', '#F9A825', '#6A1B9A', '#C62828', '#00838F', '#EF6C00'];

  return (
    <div className="reports-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {reportTitles[reportId || ''] || 'Report'}
          </h2>
          <p className="muted">Generate and export your business insights</p>
        </div>
        <button className="secondary-btn" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
      </div>

      <div className="filter-section panel">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Report Filters</h3>
        <div className="filter-row">
          <div className="form-group">
            <label className="form-label"><span>From Date <span className="required">*</span></span></label>
            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label"><span>To Date <span className="required">*</span></span></label>
            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <input type="text" name="customer" value={filters.customer} onChange={handleFilterChange} className="form-input" placeholder="Filter by customer name" />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Status</label>
            <select name="invoiceStatus" value={filters.invoiceStatus} onChange={handleFilterChange} className="form-select">
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="form-select">
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Online Payment">Online Payment</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="primary-btn" onClick={handleGenerateReport}>Generate Report</button>
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading report data...</div>
        </div>
      ) : hasGenerated && reportData.length > 0 ? (
        <div id="report-export-container" style={{ padding: '20px', backgroundColor: '#f8fcf9' }}>
          {chartsLoaded && rechartsAvailable && ChartComponents && (() => {
            const C = ChartComponents;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {(reportId === 'total-sales' || !reportId) && (
                  <>
                    <div className="panel">
                      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Total Sales Trend</h3>
                      <C.ResponsiveContainer width="100%" height={300}>
                        <C.LineChart data={monthlySalesData}>
                          <C.CartesianGrid strokeDasharray="3 3" />
                          <C.XAxis dataKey="month" />
                          <C.YAxis />
                          <C.Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                          <C.Legend />
                          <C.Line type="monotone" dataKey="amount" stroke={COLORS[0]} strokeWidth={2} name="Sales Amount" />
                        </C.LineChart>
                      </C.ResponsiveContainer>
                    </div>
                    <div className="panel">
                      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Payment Method Distribution</h3>
                      <C.ResponsiveContainer width="100%" height={300}>
                        <C.PieChart>
                          <C.Pie data={paymentMethodData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                            {paymentMethodData.map((_: unknown, index: number) => (
                              <C.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </C.Pie>
                          <C.Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                          <C.Legend />
                        </C.PieChart>
                      </C.ResponsiveContainer>
                    </div>
                  </>
                )}
                {reportId === 'daily-sales' && (
                  <div className="panel">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Daily Sales</h3>
                    <C.ResponsiveContainer width="100%" height={300}>
                      <C.BarChart data={DAILY_SALES_DATA}>
                        <C.CartesianGrid strokeDasharray="3 3" />
                        <C.XAxis dataKey="date" />
                        <C.YAxis />
                        <C.Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        <C.Legend />
                        <C.Bar dataKey="amount" fill="#1B5E20" name="Total Sales" />
                      </C.BarChart>
                    </C.ResponsiveContainer>
                  </div>
                )}
                {reportId === 'monthly-sales' && (
                  <div className="panel">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Monthly Sales</h3>
                    <C.ResponsiveContainer width="100%" height={300}>
                      <C.BarChart data={monthlySalesData}>
                        <C.CartesianGrid strokeDasharray="3 3" />
                        <C.XAxis dataKey="month" />
                        <C.YAxis />
                        <C.Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        <C.Legend />
                        <C.Bar dataKey="amount" fill={COLORS[0]} name="Sales Amount" />
                      </C.BarChart>
                    </C.ResponsiveContainer>
                  </div>
                )}
                {reportId === 'customer-sales' && (
                  <div className="panel">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Customer-wise Sales</h3>
                    <C.ResponsiveContainer width="100%" height={300}>
                      <C.BarChart data={customerSalesData}>
                        <C.CartesianGrid strokeDasharray="3 3" />
                        <C.XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <C.YAxis />
                        <C.Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        <C.Bar dataKey="value" fill={COLORS[6]} name="Sales Amount" />
                      </C.BarChart>
                    </C.ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>Report Output</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }} data-html2canvas-ignore="true">
                <button className="primary-btn" onClick={handlePrint}>Print</button>
                <button className="primary-btn" onClick={handleExportPDF}>Export PDF</button>
                <button className="primary-btn" onClick={handleExportExcel}>Export Excel</button>
              </div>
            </div>

            <div className="print-header" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #ddd' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Billing App</h2>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#666', fontWeight: 'normal' }}>{reportTitles[reportId || ''] || 'Report'}</h3>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
                Date Range: {filters.fromDate && filters.toDate ? `${new Date(filters.fromDate).toLocaleDateString()} - ${new Date(filters.toDate).toLocaleDateString()}` : 'N/A'}
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Receipt Number</th>
                    <th>Invoice Number</th>
                    <th>Customer Name</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index}>
                      <td>{new Date(row.date).toLocaleDateString()}</td>
                      <td>{row.receiptNumber}</td>
                      <td>{row.invoiceNumber}</td>
                      <td>{row.customerName}</td>
                      <td>₹{row.amount.toLocaleString()}</td>
                      <td className="balance-red">₹{row.balance.toLocaleString()}</td>
                      <td>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: row.paymentMethod === 'Cash' ? '#2E7D32' :
                            row.paymentMethod === 'Bank Transfer' ? '#1565C0' :
                              row.paymentMethod === 'Cheque' ? '#EF6C00' :
                                row.paymentMethod === 'Credit Card' ? '#7B1FA2' :
                                  row.paymentMethod === 'Online Payment' ? '#00838F' : '#616161'
                        }}>
                          {row.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '2px solid #1B5E20' }}>
                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem' }}>Grand Totals:</td>
                    <td style={{ color: '#1B5E20' }}>₹{totals.totalAmount.toLocaleString()}</td>
                    <td>₹{totals.totalBalance.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>Generated on: {new Date().toLocaleString()}</div>
          </div>
        </div>
      ) : hasGenerated ? (
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>No data found for the selected filters</p>
          </div>
        </div>
      ) : (
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>Set your filters above and click <strong>Generate Report</strong> to view charts and billing details.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
