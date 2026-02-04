// Utility functions for managing receipts in localStorage

export type Receipt = {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  // Audit fields
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
};

const STORAGE_KEY = 'billing_app_receipts';

export const getReceipts = (): Receipt[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let receipts: Receipt[] = JSON.parse(stored);

      // Migration: Clear old format data if detected
      if (receipts.length > 0 && receipts[0].receiptNumber.includes('-202')) {
        localStorage.removeItem(STORAGE_KEY);
        return getReceipts();
      }

      // De-duplication logic: Remove any receipts with duplicate numbers or identical content
      const seenReceiptNumbers = new Set();
      const seenContent = new Set();

      const uniqueReceipts = receipts.filter(r => {
        const numNormalized = r.receiptNumber.trim().toUpperCase();
        // Content signature: invoice + customer + amount + date + method
        const contentSignature = `${r.invoiceNumber}|${r.customer}|${r.amount}|${r.date}|${r.paymentMethod}`.toUpperCase();

        if (!numNormalized || seenReceiptNumbers.has(numNormalized) || seenContent.has(contentSignature)) {
          return false;
        }

        seenReceiptNumbers.add(numNormalized);
        seenContent.add(contentSignature);
        return true;
      });

      if (uniqueReceipts.length !== receipts.length) {
        console.log(`Cleaned up ${receipts.length - uniqueReceipts.length} duplicate receipts.`);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueReceipts));
        return uniqueReceipts;
      }

      return receipts;
    }
  } catch (error) {
    console.error('Error reading receipts from storage:', error);
  }
  // Return default receipts
  return [
    {
      id: '1',
      receiptNumber: 'RCP-001',
      invoiceNumber: 'INV-001',
      customer: 'ABC Company',
      amount: 5000,
      date: '2024-01-15',
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'REF-123456',
      created_by: 'System',
      created_at: '2024-01-15',
    },
    {
      id: '2',
      receiptNumber: 'RCP-002',
      invoiceNumber: 'INV-002',
      customer: 'XYZ Corporation',
      amount: 7500,
      date: '2024-01-16',
      paymentMethod: 'Cash',
      created_by: 'System',
      created_at: '2024-01-16',
    },
    {
      id: '3',
      receiptNumber: 'RCP-003',
      invoiceNumber: 'INV-003',
      customer: 'ABC Company',
      amount: 3000,
      date: '2024-01-17',
      paymentMethod: 'Cheque',
      created_by: 'System',
      created_at: '2024-01-17',
    },
  ];
};

export const saveReceipt = (receipt: Receipt): void => {
  try {
    const receipts = getReceipts();
    receipts.unshift(receipt); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    // Dispatch storage event for same-tab updates
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error saving receipt to storage:', error);
  }
};

export const generateReceiptNumber = (): string => {
  const receipts = getReceipts();

  if (receipts.length === 0) {
    return 'RCP-001';
  }

  const numbers = receipts
    .map(r => {
      const parts = r.receiptNumber.split('-');
      return parts.length > 1 ? parseInt(parts[1]) : 0;
    })
    .filter(n => !isNaN(n));

  const maxNumber = Math.max(...numbers, 0);
  return `RCP-${String(maxNumber + 1).padStart(3, '0')}`;
};
