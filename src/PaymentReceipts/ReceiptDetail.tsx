import { useParams, useNavigate } from 'react-router-dom';
import { getReceipts } from './receiptStorage';
import './PaymentReceipts.css';


const ReceiptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Get receipt from storage
  const receipts = getReceipts();
  const receiptData = receipts.find(r => r.id === id);

  // Use receipt data or show not found message
  if (!receiptData) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>Receipt Not Found</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {id ? `The receipt with ID "${id}" could not be found.` : 'No receipt ID provided.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/payments/receipts')}>
            Back to Receipts
          </button>
        </div>
      </div>
    );
  }

  // Use the found receipt data
  const receipt = receiptData;

  // Calculate invoice information
  const invoiceInfo = {
    invoiceNumber: receipt.invoiceNumber,
    invoiceDate: new Date(receipt.date).toISOString().split('T')[0], // Use receipt date as invoice date
    dueDate: new Date(new Date(receipt.date).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from receipt date
    totalAmount: receipt.amount, // Assume total equals receipt amount for now
    paidAmount: receipt.amount,
    outstandingBalance: 0, // If receipt exists, assume it's paid
  };

  // Default customer address (Mock data for now, will be fetched from Customer module later)
  const customerAddress = '123 Business District, Main Main Road, New Delhi, 110001';

  const generateReceiptHtml = () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt - ${receipt.receiptNumber}</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 800px;
                  margin: 20px auto;
                  padding: 20px;
                  background-color: #f4f4f4;
              }
              .receipt-container {
                  background-color: #fff;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 0 20px rgba(0,0,0,0.1);
              }
              .header {
                  display: flex;
                  justify-content: space-between;
                  border-bottom: 2px solid #2E7D32;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
              }
              .header h1 {
                  color: #2E7D32;
                  margin: 0;
              }
              .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 40px;
                  margin-bottom: 40px;
              }
              .info-section h3 {
                  border-bottom: 1px solid #eee;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                  color: #555;
              }
              .info-item {
                  margin-bottom: 10px;
              }
              .info-item strong {
                  width: 150px;
                  display: inline-block;
              }
              .amount-box {
                  background-color: #E8F5E9;
                  padding: 20px;
                  border-radius: 4px;
                  text-align: right;
                  margin-top: 20px;
              }
              .amount-box h2 {
                  margin: 0;
                  color: #2E7D32;
              }
              .footer {
                  margin-top: 50px;
                  text-align: center;
                  font-size: 0.9em;
                  color: #777;
                  border-top: 1px solid #eee;
                  padding-top: 20px;
              }
              @media print {
                  body { background-color: #fff; margin: 0; padding: 0; }
                  .receipt-container { box-shadow: none; width: 100%; border: none; }
                  .no-print { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <div>
                      <h1>PAYMENT RECEIPT</h1>
                      <p>Thank you for your payment!</p>
                  </div>
                  <div style="text-align: right;">
                      <p><strong>Receipt #:</strong> ${receipt.receiptNumber}</p>
                      <p><strong>Date:</strong> ${new Date(receipt.date).toLocaleDateString()}</p>
                  </div>
              </div>

              <div class="info-grid">
                  <div class="info-section">
                      <h3>Customer Details</h3>
                      <div class="info-item"><strong>Customer Name:</strong> ${receipt.customer}</div>
                      <div class="info-item"><strong>Address:</strong> ${customerAddress}</div>
                  </div>
                  <div class="info-section">
                      <h3>Payment Details</h3>
                      <div class="info-item"><strong>Method:</strong> ${receipt.paymentMethod}</div>
                      ${receipt.referenceNumber ? `<div class="info-item"><strong>Ref #:</strong> ${receipt.referenceNumber}</div>` : ''}
                      <div class="info-item"><strong>Invoice #:</strong> ${receipt.invoiceNumber}</div>
                  </div>
              </div>

              ${receipt.notes ? `
              <div class="info-section">
                  <h3>Notes</h3>
                  <p>${receipt.notes}</p>
              </div>
              ` : ''}

              <div class="amount-box">
                  <p>Total Amount Paid</p>
                  <h2>₹${receipt.amount.toLocaleString()}</h2>
              </div>

              <div class="footer">
                  <p>This is a computer-generated receipt.</p>
              </div>
          </div>
          <div style="text-align: center; margin-top: 20px;" class="no-print">
              <button onclick="window.print()" style="padding: 10px 20px; background-color: #2E7D32; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Receipt</button>
          </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const receiptHtml = generateReceiptHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print();
        // Optional: printWindow.close(); // Close after printing if desired
      };
    }
  };

  const handleViewHtml = () => {
    const receiptHtml = generateReceiptHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  };

  return (
    <div>
      <div className="card">
        <div className="panel-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h3>Receipt Details</h3>
            <p className="muted">Detailed information for receipt #{receipt.receiptNumber}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => navigate('/payments/receipts')}>
              Back
            </button>
            <button className="primary-btn" onClick={handleViewHtml}>
              View HTML
            </button>
            <button className="primary-btn" onClick={handlePrint}>
              Print Receipt
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Receipt Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>Receipt Number:</strong> {receipt.receiptNumber}
              </div>
              <div>
                <strong>Date:</strong> {new Date(receipt.date).toLocaleDateString()}
              </div>
              <div>
                <strong>Amount:</strong> ₹{receipt.amount.toLocaleString()}
              </div>
              <div>
                <strong>Method:</strong> {receipt.paymentMethod}
              </div>
              {receipt.referenceNumber && (
                <div>
                  <strong>Reference Number:</strong> {receipt.referenceNumber}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', color: '#333' }}>Customer Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>Customer Name:</strong> {receipt.customer}
              </div>
              <div>
                <strong>Address:</strong> {customerAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginBottom: '0.75rem', color: '#333', fontSize: '1rem' }}>Audit Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '14px' }}>
            <div>
              <strong>Created By:</strong> {receipt.created_by || 'Unknown'}
            </div>
            <div>
              <strong>Created At:</strong> {receipt.created_at || 'N/A'}
            </div>
            {receipt.updated_by && (
              <>
                <div>
                  <strong>Last Updated By:</strong> {receipt.updated_by}
                </div>
                <div>
                  <strong>Last Updated At:</strong> {receipt.updated_at || 'N/A'}
                </div>
              </>
            )}
          </div>
        </div>

        {receipt.notes && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.75rem', color: '#333' }}>Notes</h3>
            <p style={{ color: '#666' }}>{receipt.notes}</p>
          </div>
        )}

        <div>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>Linked Invoice</h3>
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <strong>Invoice Number:</strong> {invoiceInfo.invoiceNumber}
              </div>
              <div>
                <strong>Invoice Date:</strong> {new Date(invoiceInfo.invoiceDate).toLocaleDateString()}
              </div>
              <div>
                <strong>Due Date:</strong> {new Date(invoiceInfo.dueDate).toLocaleDateString()}
              </div>
              <div>
                <strong>Total Amount:</strong> ₹{invoiceInfo.totalAmount.toLocaleString()}
              </div>
              <div>
                <strong>Paid Amount:</strong> ₹{invoiceInfo.paidAmount.toLocaleString()}
              </div>
              <div>
                <strong>Outstanding Balance:</strong> ₹{invoiceInfo.outstandingBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetail;
