import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { nanoid } from "nanoid/non-secure";
import type { Loan } from "../types/loan";

export type CustomerType = "Individual" | "Business";

export type Invoice = {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  paid: number;
  status: "paid" | "pending" | "partial";
};

export type Customer = {
  id: string;
  customerId: string; // Auto-generated customer ID
  name: string;
  phone: string;
  customerType: CustomerType;
  email: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstTaxId?: string; // Only for Business type
  panNumber?: string;
  creditLimit: number; // Admin only
  creditUsed: number;
  isBlocked: boolean; // Admin only
  purchaseHistory: Invoice[];
  creditRewards: number;
  loans: Loan[];

  // Point of Contact
  pocName?: string;
  pocDesignation?: string;
  pocContact?: string;
  alternatePhone?: string;

  // Audit fields
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
};

export type UserRole = "Admin" | "Staff";

export type Product = {
  id: string;
  name: string;
  revenue: number;
  price: number;
  gst: string;
  hsn: string;
};

type DashboardContextValue = {
  customers: Customer[];
  deletedCustomers: Customer[];
  totalRevenue: number;
  totalRecovered: number;
  products: Product[];

  userRole: UserRole;
  userProfile: any; // Using any for simplicity as per current snippet usage, ideally strict typed
  setUserProfile: (profile: any) => void;
  setUserRole: (role: UserRole) => void;
  addCustomer: (customer: Omit<Customer, "id" | "customerId">) => string;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  restoreCustomer: (id: string) => void;
  addRevenue: (amount: number) => void;
  addRecovery: (loanId: string, amount: number) => void;
  updateProductRevenue: (id: string, revenue: number) => void;
  addInvoice: (customerId: string, invoice: Omit<Invoice, "id">) => void;
  addLoan: (customerId: string, loan: Omit<Loan, "id">) => string;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>("Admin");


  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalRecovered, setTotalRecovered] = useState<number>(0);


  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("products");
    return saved
      ? JSON.parse(saved).map((p: any) => ({
        id: p.id,
        name: p.name,
        revenue: parseFloat(p.taxableAmount) || 0,
        price: p.price || 0,
        gst: p.gst || "0",
        hsn: p.hsn || ""
      }))
      : [
        { id: "P001", name: "Product name", revenue: 470000, price: 100, gst: "18", hsn: "1234" },
        { id: "P002", name: "Product name", revenue: 310000, price: 200, gst: "12", hsn: "5678" },
        { id: "P003", name: "Product name", revenue: 140000, price: 50, gst: "5", hsn: "9012" },
      ];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("billing_app_customers");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: nanoid(),
        customerId: "CUST001",
        name: "Kruthika",
        phone: "+91 8973500889",
        alternatePhone: "",
        customerType: "Individual",
        email: "ksk123@gmail.com",
        address: "123 Main Street",
        city: "CityName",
        state: "StateName",
        pincode: "123456",
        creditLimit: 50000,
        creditUsed: 0,
        isBlocked: false,
        purchaseHistory: [],
        creditRewards: 0,
        loans: [],
      },
      {
        id: nanoid(),
        customerId: "CUST002",
        name: "ABC Business Ltd",
        phone: "+91 9876543211",
        customerType: "Business",
        email: "contact@abcconstruction.com",
        address: "456 Business Park",
        city: "CityName",
        state: "StateName",
        pincode: "654321",
        gstTaxId: "GST123456789",
        panNumber: "ABCDE1234F",
        creditLimit: 200000,
        creditUsed: 50000,
        isBlocked: false,
        purchaseHistory: [],
        creditRewards: 500,
        loans: [],
        pocName: "John Doe",
        pocDesignation: "Manager",
        pocContact: "+91 9988776655",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("billing_app_customers", JSON.stringify(customers));
  }, [customers]);

  // Sync Revenue and Recovery with Billing Storage
  useEffect(() => {
    const syncWithStorage = () => {
      const storedInvoices = localStorage.getItem('billing_app_invoices');
      const storedReceipts = localStorage.getItem('billing_app_receipts');

      if (storedInvoices) {
        const invs = JSON.parse(storedInvoices);
        const total = invs.reduce((sum: number, inv: any) => sum + (parseFloat(inv.totalAmount) || 0), 0);
        setTotalRevenue(total);
      }

      if (storedReceipts) {
        const recs = JSON.parse(storedReceipts);
        const total = recs.reduce((sum: number, rec: any) => sum + (parseFloat(rec.amount) || 0), 0);
        setTotalRecovered(total);
      }
    };

    syncWithStorage();
    window.addEventListener('storage', syncWithStorage);
    const interval = setInterval(syncWithStorage, 2000);

    return () => {
      window.removeEventListener('storage', syncWithStorage);
      clearInterval(interval);
    };
  }, []);
  // Listen for product updates from Product Management
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("products");
      if (saved) {
        const parsedProducts = JSON.parse(saved).map((p: any) => ({
          id: p.id,
          name: p.name,
          revenue: parseFloat(p.taxableAmount) || 0,
          price: p.price || 0,
          gst: p.gst || "0",
          hsn: p.hsn || ""
        }));
        setProducts(parsedProducts);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for updates every 2 seconds to catch same-tab changes
    const interval = setInterval(() => {
      handleStorageChange();
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const [userProfile, setUserProfile] = useState({
    name: "Admin User",
    email: "admin@billingapp.com",
    mobileNumber: "+91 9876543210",
    alternateMobileNumber: "",
    address: "123 Business Street",
    city: "City",
    state: "State",
    pincode: "123456",
  });

  const [deletedCustomers, setDeletedCustomers] = useState<Customer[]>([]);

  const generateCustomerId = () => {
    if (customers.length === 0) return "CUST001";
    const maxId = customers.reduce((max, customer) => {
      const idPart = parseInt(customer.customerId.replace("CUST", ""), 10);
      return isNaN(idPart) ? max : Math.max(max, idPart);
    }, 0);
    return `CUST${String(maxId + 1).padStart(3, "0")}`;
  };

  const addCustomer = (customer: Omit<Customer, "id" | "customerId">) => {
    const id = nanoid();
    const newCustomer: Customer = {
      ...customer,
      id,
      customerId: generateCustomerId(),
      creditLimit: customer.creditLimit || 0,
      creditUsed: customer.creditUsed || 0,
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      isBlocked: customer.isBlocked || false,
      purchaseHistory: customer.purchaseHistory || [],
      creditRewards: customer.creditRewards || 0,
      loans: customer.loans || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userProfile?.name || "Admin",
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return id;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
  };

  const removeCustomer = (id: string) => {
    const customerToDelete = customers.find((c) => c.id === id);
    if (customerToDelete) {
      setDeletedCustomers((prev) => [customerToDelete, ...prev]);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const restoreCustomer = (id: string) => {
    const customerToRestore = deletedCustomers.find((c) => c.id === id);
    if (customerToRestore) {
      setCustomers((prev) => [customerToRestore, ...prev]);
      setDeletedCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const addRevenue = (amount: number) => {
    setTotalRevenue((prev) => prev + amount);
  };

  const addRecovery = (loanId: string, amount: number) => {
    setTotalRecovered((prev) => prev + amount);

    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) => {
        const hasLoan = customer.loans.some((l) => l.id === loanId);
        if (hasLoan) {
          return {
            ...customer,
            loans: customer.loans.map((loan) => {
              if (loan.id === loanId) {
                const newRecovered = (loan.recoveredAmount || 0) + amount;
                const isFullyPaid = newRecovered >= loan.amount;
                return {
                  ...loan,
                  recoveredAmount: newRecovered,
                  status: isFullyPaid ? "paid" : "active",
                };
              }
              return loan;
            }),
          };
        }
        return customer;
      })
    );
  };

  const updateProductRevenue = (id: string, revenue: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, revenue } : p))
    );
  };

  const addInvoice = (customerId: string, invoice: Omit<Invoice, "id">) => {
    const invoiceWithId: Invoice = { ...invoice, id: nanoid() };
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
            ...c,
            purchaseHistory: [...c.purchaseHistory, invoiceWithId],
            creditUsed:
              invoice.status === "pending" || invoice.status === "partial"
                ? c.creditUsed + (invoice.amount - invoice.paid)
                : c.creditUsed,
          }
          : c
      )
    );
  };

  const addLoan = (customerId: string, loan: Omit<Loan, "id">) => {
    const loanWithId: Loan = { ...loan, id: nanoid() };

    console.log('addLoan called with customerId:', customerId);
    console.log('Loan to add:', loanWithId);

    // Add loan amount to total recovered - REMOVED as per requirements
    // setTotalRecovered((prev) => prev + loan.amount);

    // Add loan to customer
    setCustomers((prev) => {
      const updated = prev.map((c) =>
        c.id === customerId
          ? {
            ...c,
            loans: [...c.loans, loanWithId],
          }
          : c
      );
      console.log('Updated customers after adding loan:', updated);
      return updated;
    });

    console.log('addLoan completed');
    return loanWithId.id;
  };

  const value = useMemo(
    () => ({
      customers,
      deletedCustomers,
      totalRevenue,
      totalRecovered,
      products,
      userRole,
      userProfile,
      setUserProfile,
      setUserRole,
      addCustomer,
      updateCustomer,
      removeCustomer,
      restoreCustomer,
      addRevenue,
      addRecovery,
      updateProductRevenue,
      addInvoice,
      addLoan,
    }),
    [customers, deletedCustomers, totalRevenue, totalRecovered, products, userRole, userProfile]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
