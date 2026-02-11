import { useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiCalendar,
  FiTrendingUp,
  FiClock,
  FiUsers
} from 'react-icons/fi';
import './Reports.css';

const ReportsDashboard = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 'total-sales',
      title: 'Total Sales Report',
      description: 'View comprehensive sales report with all transactions',
      icon: <FiBarChart2 />,
      color: '#7c4dff'
    },
    {
      id: 'daily-sales',
      title: 'Daily Sales Report',
      description: 'View sales report for a specific day',
      icon: <FiCalendar />,
      color: '#ffab40'
    },
    {
      id: 'monthly-sales',
      title: 'Monthly Sales Report',
      description: 'View sales report for a specific month',
      icon: <FiTrendingUp />,
      color: '#2e7d32'
    },
    {
      id: 'outstanding-invoices',
      title: 'Outstanding Invoices',
      description: 'View all pending invoices and their details',
      icon: <FiClock />,
      color: '#ef5350'
    },
    {
      id: 'customer-sales',
      title: 'Customer-wise Sales',
      description: 'View sales breakdown by customer',
      icon: <FiUsers />,
      color: '#1565c0'
    },
   
  ];

  const handleReportClick = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  return (
    <div className="reports-container">
      <div className="report-grid">
        {reports.map((report) => (
          <div
            key={report.id}
            className="report-card panel"
            onClick={() => handleReportClick(report.id)}
          >
            <div className="report-icon-wrapper" style={{ color: report.color }}>
              {report.icon}
            </div>
            <h3 className="report-card-title">{report.title}</h3>
            <p className="report-card-description">{report.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsDashboard;
