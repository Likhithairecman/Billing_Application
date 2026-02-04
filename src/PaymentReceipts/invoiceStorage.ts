// Utility functions for managing invoices in localStorage



export type InvoiceItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number; // percentage
    tax: number; // percentage
    hsnCode: string;
    // Persisted calculated fields for consistency with Backend
    totalPrice?: number;    // Pre-tax subtotal (Qty * UnitPrice - Discount)
    taxAmount?: number;     // Calculated Tax Amount
    totalAfterTax?: number; // Grand total for this line
};

export type Invoice = {
    id: string;
    invoiceNumber: string;
    invoiceType?: string; // New field
    customerName: string;
    customerId?: string; // New field
    date: string;
    totalAmount: number;
    subtotal?: number; // New field
    taxAmount?: number; // New field (Invoice level)
    discountAmount?: number; // New field
    paidAmount: number;
    balanceAmount: number;
    status: 'paid' | 'pending' | 'partially_paid';
    dueDate: string;
    items?: InvoiceItem[]; // Optional for backward compatibility with old mocks
    originalInvoiceId?: string; // New field
    notes?: string; // New field
    terms?: string; // New field
    constructionAddress?: string; // New field
    guarantorMobile?: string; // New field
    taxType?: string; // New field
    registrationNumber?: string; // New field
    // Audit fields
    created_by: string;
    created_at: string;
    updated_by?: string;
    updated_at?: string;
    isReturned?: boolean; // New field to track return status
};

const STORAGE_KEY = 'billing_app_invoices';

// Generate some initial mock data
const generateMockInvoices = (): Invoice[] => {
    return [
        {
            id: '1',
            invoiceNumber: `INV-001`,
            customerName: 'ABC Company',
            date: '2024-01-15',
            totalAmount: 10000,
            paidAmount: 5000,
            balanceAmount: 5000,
            status: 'partially_paid',
            dueDate: '2024-01-30',
            created_by: 'System',
            created_at: '2024-01-15',
            updated_by: 'System',
            updated_at: '2024-01-20',
            items: [
                { description: 'Consulting Services', quantity: 2, unitPrice: 5000, discount: 0, tax: 0, hsnCode: '998311' }
            ]
        },
        {
            id: '2',
            invoiceNumber: `INV-002`,
            customerName: 'XYZ Corporation',
            date: '2024-01-16',
            totalAmount: 15000,
            paidAmount: 15000,
            balanceAmount: 0,
            status: 'paid',
            dueDate: '2024-01-31',
            created_by: 'System',
            created_at: '2024-01-16',
            updated_by: 'System',
            updated_at: '2024-01-25',
            items: [
                { description: 'Laptop', quantity: 1, unitPrice: 15000, discount: 0, tax: 0, hsnCode: '847130' }
            ]
        },
        {
            id: '3',
            invoiceNumber: `INV-003`,
            customerName: 'Tech Solutions Inc',
            date: '2024-02-05',
            totalAmount: 25000,
            paidAmount: 10000,
            balanceAmount: 15000,
            status: 'partially_paid',
            dueDate: '2024-02-20',
            created_by: 'System',
            created_at: '2024-02-05',
            updated_by: 'System',
            updated_at: '2024-02-10',
            items: [
                { description: 'Server Maintenance', quantity: 1, unitPrice: 20000, discount: 0, tax: 0, hsnCode: '998713' },
                { description: 'Software License', quantity: 1, unitPrice: 5000, discount: 0, tax: 0, hsnCode: '997331' }
            ]
        },
        {
            id: '4',
            invoiceNumber: `INV-004`,
            customerName: 'Global Industries',
            date: '2024-02-10',
            totalAmount: 30000,
            paidAmount: 0,
            balanceAmount: 30000,
            status: 'pending',
            dueDate: '2024-02-25',
            created_by: 'System',
            created_at: '2024-02-10',
            items: [
                { description: 'Bulk Order Widget A', quantity: 100, unitPrice: 300, discount: 0, tax: 0, hsnCode: '392690' }
            ]
        },
        {
            id: '5',
            invoiceNumber: `INV-005`,
            customerName: 'Retail Corp',
            date: '2024-03-01',
            totalAmount: 5000,
            paidAmount: 0,
            balanceAmount: 5000,
            status: 'pending',
            dueDate: '2024-03-16',
            created_by: 'System',
            created_at: '2024-03-01',
            items: [
                { description: 'Display Stand', quantity: 2, unitPrice: 2500, discount: 0, tax: 0, hsnCode: '940320' }
            ]
        },
        {
            id: '6',
            invoiceNumber: `INV-006`,
            customerName: 'Local Shop',
            date: '2024-03-15',
            totalAmount: 2500,
            paidAmount: 0,
            balanceAmount: 2500,
            status: 'pending',
            dueDate: '2024-03-30',
            created_by: 'System',
            created_at: '2024-03-15',
            items: [
                { description: 'Signage', quantity: 1, unitPrice: 2500, discount: 0, tax: 0, hsnCode: '831000' }
            ]
        },
    ];
};

export const getInvoices = (): Invoice[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            let invoices: Invoice[] = JSON.parse(stored);

            // Migration: Clear old format data if detected
            if (invoices.length > 0 && invoices[0].invoiceNumber.includes('-202')) {
                localStorage.removeItem(STORAGE_KEY);
                return getInvoices();
            }

            // De-duplication logic: Remove any invoices with duplicate numbers (case-insensitive)
            // We iterate from start to end, and since we use unshift, the first one seen is the latest.
            const seenNumbers = new Set();
            const uniqueInvoices = invoices.filter(inv => {
                const normalized = inv.invoiceNumber.trim().toUpperCase();
                if (!normalized || seenNumbers.has(normalized)) {
                    return false;
                }
                seenNumbers.add(normalized);
                return true;
            });

            if (uniqueInvoices.length !== invoices.length) {
                console.log(`Cleaned up ${invoices.length - uniqueInvoices.length} duplicate invoices.`);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueInvoices));
                return uniqueInvoices;
            }

            return invoices;
        }
    } catch (error) {
        console.error('Error reading invoices from storage:', error);
    }

    // If no stored data, initialize with mocks and save
    const mocks = generateMockInvoices();
    saveInvoices(mocks);
    return mocks;
};

export const saveInvoices = (invoices: Invoice[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
        // Dispatch storage event for cross-tab or same-tab updates if needed
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
        console.error('Error saving invoices to storage:', error);
    }
};

export const getInvoiceByNumber = (invoiceNumber: string): Invoice | undefined => {
    const invoices = getInvoices();
    return invoices.find(inv => inv.invoiceNumber === invoiceNumber);
};

export const updateInvoicePayment = (invoiceNumber: string, amountPaid: number): boolean => {
    const invoices = getInvoices();
    const index = invoices.findIndex(inv => inv.invoiceNumber === invoiceNumber);

    if (index !== -1) {
        const invoice = invoices[index];
        invoice.paidAmount += amountPaid;
        invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

        if (invoice.balanceAmount <= 0) {
            invoice.status = 'paid';
            invoice.balanceAmount = 0; // Ensure no negative balance
        } else {
            invoice.status = 'partially_paid';
        }

        // Track who updated the invoice
        invoice.updated_by = localStorage.getItem('billing_app_username') || 'Admin';
        invoice.updated_at = new Date().toISOString().slice(0, 10);

        invoices[index] = invoice;
        saveInvoices(invoices);
        return true;
    }
    return false;
};

export const generateInvoiceNumber = (): string => {
    const invoices = getInvoices();

    if (invoices.length === 0) {
        return 'INV-001';
    }

    const numbers = invoices
        .map(inv => {
            const parts = inv.invoiceNumber.split('-');
            return parts.length > 1 ? parseInt(parts[1]) : 0;
        })
        .filter(n => !isNaN(n));

    const maxNumber = Math.max(...numbers, 0);
    return `INV-${String(maxNumber + 1).padStart(3, '0')}`;
};

export const saveInvoice = (invoice: Invoice): void => {
    const invoices = getInvoices();
    invoices.unshift(invoice);
    saveInvoices(invoices);
};

export const markInvoiceAsReturned = (id: string): boolean => {
    const invoices = getInvoices();
    const index = invoices.findIndex(inv => inv.id === id);

    if (index !== -1) {
        invoices[index].isReturned = true;
        invoices[index].updated_at = new Date().toISOString().slice(0, 10);
        invoices[index].updated_by = localStorage.getItem('billing_app_username') || 'Admin';
        saveInvoices(invoices);
        return true;
    }
    return false;
};
