"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Filter,
  Download,
  FileText,
  TrendingUp,
  CreditCard,
  Calendar,
  X,
  Users,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { VendorExpenseToggle } from "@/components/ledger/vendor-expense-toggle";
import { ExpenseLedger } from "@/components/ledger/expense-ledger";
import { VendorLedgerView } from "@/components/ledger/vendor-ledger-view";
import { VendorExpenseList } from "@/components/ledger/vendor-expense-list";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useCompany } from "@/contexts/company-context";

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  vendorName: string;
  invoiceNo?: string;
  paymentMethod?: string;
  amount: number;
  company: string;
  referenceNumber?: string;
}

interface Vendor {
  _id: string;
  vendorName: string;
  email?: string;
  contactNumber?: string;
  balance?: number;
}

interface Expense {
  _id: string;
  name: string;
  company: string;
  createdAt: string;
}

interface Company {
  _id: string;
  businessName: string;
}

interface LedgerData {
  debit: LedgerEntry[];
  credit: LedgerEntry[];
  totals: {
    debit: number;
    credit: number;
    balance: number;
  };
}

interface Stats {
  totalVendors: number;
  totalExpenses: number;
  totalPayable: number;
  totalAdvance: number;
  totalExpenseAmount: number;
  settledVendors: number;
  totalCredit: number;
  totalDebit: number;
}

export default function PayablesPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [selectedExpense, setSelectedExpense] = useState<string>("");
  const [individualExportLoading, setIndividualExportLoading] = useState(false);
  const [bulkExportLoading, setBulkExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [currentView, setCurrentView] = useState<"vendor" | "expense">(
    "vendor"
  );
  const [expenseTotals, setExpenseTotals] = useState<{ [key: string]: number }>(
    {}
  );
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("");
  const [selectedExpenseFilter, setSelectedExpenseFilter] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalVendors: 0,
    totalExpenses: 0,
    totalPayable: 0,
    totalAdvance: 0,
    totalExpenseAmount: 0,
    settledVendors: 0,
    totalCredit: 0,
    totalDebit: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();

  // Add productsList state
  const [productsList, setProductsList] = useState<any[]>([]);

  // Fetch products for HSN codes
  useEffect(() => {
    async function fetchProducts() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${baseURL}/api/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setProductsList(data.products || data || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
    fetchProducts();
  }, [baseURL]);

  const expenseOptions = expenses.map((expense) => ({
    value: expense._id,
    label: expense.name,
  }));

  const isDetailOpen =
    currentView === "vendor"
      ? Boolean(selectedVendor)
      : Boolean(selectedExpense);

  // Fetch vendors
  useEffect(() => {
    async function fetchVendors() {
      try {
        setVendorsLoading(true);
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (selectedCompanyId) params.append("companyId", selectedCompanyId);
        const res = await fetch(`${baseURL}/api/vendors?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch vendors");
        }

        const data = await res.json();
        let vendorsArray: Vendor[] = [];

        if (Array.isArray(data)) {
          vendorsArray = data;
        } else if (data && Array.isArray(data.vendors)) {
          vendorsArray = data.vendors;
        } else if (data && Array.isArray(data.data)) {
          vendorsArray = data.data;
        }

        setVendors(vendorsArray);
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setVendors([]);
      } finally {
        setVendorsLoading(false);
      }
    }
    fetchVendors();
  }, [baseURL, selectedCompanyId]);

  // Fetch expenses
  useEffect(() => {
    async function fetchExpenses() {
      try {
        setExpensesLoading(true);
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (selectedCompanyId) params.append("companyId", selectedCompanyId);
        const res = await fetch(`${baseURL}/api/payment-expenses?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch expenses");
        }

        const data = await res.json();
        console.log("Fetched expenses:", data);

        let expensesArray: Expense[] = [];

        if (Array.isArray(data)) {
          expensesArray = data;
        } else if (data && Array.isArray(data.expenses)) {
          expensesArray = data.expenses;
        } else if (data && Array.isArray(data.data)) {
          expensesArray = data.data;
        } else if (data && data.success && Array.isArray(data.data)) {
          expensesArray = data.data;
        }

        console.log("Processed expenses:", expensesArray);
        setExpenses(expensesArray);

        // Fetch totals for expenses
        const totals: { [key: string]: number } = {};
        for (const expense of expensesArray) {
          try {
            const params = new URLSearchParams();
            params.append("expenseId", expense._id);
            if (dateRange.from) params.append("fromDate", dateRange.from);
            if (dateRange.to) params.append("toDate", dateRange.to);
            if (selectedCompanyId) params.append("companyId", selectedCompanyId);

            const totalRes = await fetch(
              `${baseURL}/api/ledger/expense-payables?${params.toString()}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (totalRes.ok) {
              const totalData = await totalRes.json();
              const cashExpenses = (totalData.debit || [])
                .filter((e: any) => e.paymentMethod !== "Credit")
                .reduce(
                  (sum: number, e: any) => sum + Number(e.amount || 0),
                  0
                );

              const payments = (totalData.credit || []).reduce(
                (sum: number, e: any) => sum + Number(e.amount || 0),
                0
              );

              totals[expense._id] = cashExpenses + payments;
            }
          } catch (error) {
            console.error(
              `Error fetching total for expense ${expense._id}:`,
              error
            );
          }
        }
        setExpenseTotals(totals);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setExpenses([]);
      } finally {
        setExpensesLoading(false);
      }
    }
    fetchExpenses();
  }, [baseURL, selectedCompanyId]);

  // Fetch companies
  useEffect(() => {
    async function fetchCompanies() {
      try {
        setCompaniesLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${baseURL}/api/companies/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch companies");
        }

        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      } finally {
        setCompaniesLoading(false);
      }
    }
    fetchCompanies();
  }, [baseURL]);

  // Fetch ledger data based on current view
  useEffect(() => {
    async function fetchLedgerData() {
      if (currentView === "vendor" && !selectedVendor) {
        setLedgerData(null);
        setLoading(false);
        return;
      }

      if (currentView === "expense" && !selectedExpense) {
        setLedgerData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        let endpoint = "";
        let params = new URLSearchParams();

        if (currentView === "vendor") {
          endpoint = `${baseURL}/api/ledger/vendor-payables`;
          params.append("vendorId", selectedVendor);
        } else {
          endpoint = `${baseURL}/api/ledger/expense-payables`;
          params.append("expenseId", selectedExpense);
        }

        if (dateRange.from) params.append("fromDate", dateRange.from);
        if (dateRange.to) params.append("toDate", dateRange.to);

        // Add company filter if a specific company is selected
        if (selectedCompanyId) {
          params.append("companyId", selectedCompanyId);
        }

        const res = await fetch(`${endpoint}?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Ledger Entries Data:", data);
          console.log(
            "Sample entry company field:",
            data.debit?.[0]?.company,
            data.credit?.[0]?.company
          );
          setLedgerData(data);
        } else {
          console.error("Failed to fetch ledger data");
          setLedgerData(null);
        }
      } catch (error) {
        console.error("Error fetching ledger data:", error);
        setLedgerData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchLedgerData();
  }, [
    selectedVendor,
    selectedExpense,
    dateRange.from,
    dateRange.to,
    currentView,
    baseURL,
    selectedCompanyId
  ]);

  // Handle vendor selection from filter
  useEffect(() => {
    if (currentView === "vendor" && selectedVendorFilter) {
      setSelectedVendor(selectedVendorFilter);
      localStorage.setItem("selectedVendor_payables", selectedVendorFilter);
    }
  }, [selectedVendorFilter, currentView]);

  // Handle expense selection from filter
  useEffect(() => {
    if (currentView === "expense" && selectedExpenseFilter) {
      setSelectedExpense(selectedExpenseFilter);
    }
  }, [selectedExpenseFilter, currentView]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount?.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPaymentMethodDisplay = (method?: string) => {
    if (!method) return "Payment";
    const methodMap: { [key: string]: string } = {
      Cash: "Cash Payment",
      "Bank Transfer": "Bank Payment",
      UPI: "UPI Payment",
      Cheque: "Cheque Payment",
      Credit: "Credit Purchase",
    };
    return methodMap[method] || `${method} Payment`;
  };

  const getPaymentMethodBadge = (method?: string) => {
    const variantMap: { [key: string]: "default" | "secondary" | "outline" } = {
      Cash: "default",
      "Bank Transfer": "secondary",
      UPI: "outline",
      Cheque: "default",
      Credit: "outline",
    };
    return variantMap[method || ""] || "outline";
  };

  // Helper functions
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedVendorFilter) count++;
    if (selectedExpenseFilter) count++;
    if (dateRange.from) count++;
    if (dateRange.to) count++;
    return count;
  };

  const hasActiveFilters = () => {
    return getActiveFilterCount() > 0;
  };

  const resetFilters = () => {
    setSelectedVendorFilter("");
    setSelectedExpenseFilter("");
    setDateRange({ from: "", to: "" });
  };

  const applyFilters = () => {
    console.log("Applying filters:", {
      view: currentView,
      vendor: selectedVendorFilter,
      expense: selectedExpenseFilter,
      dateRange,
    });
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c._id === companyId);
    console.log(
      "getCompanyName called with:",
      companyId,
      "found company:",
      company
    );
    return company?.businessName || "Unknown Company";
  };

  const calculateTotals = () => {
    if (!ledgerData) return { debit: 0, credit: 0, balance: 0 };

    const debitTotal = (ledgerData.debit || []).reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    const creditPurchaseEntries = (ledgerData.debit || []).filter(
      (entry) => entry.paymentMethod !== "Credit"
    );
    const creditPaymentEntries = ledgerData.credit || [];

    const creditTotal = [
      ...creditPurchaseEntries,
      ...creditPaymentEntries,
    ].reduce((sum, entry) => sum + entry.amount, 0);

    const balance = debitTotal - creditTotal;

    return {
      debit: debitTotal,
      credit: creditTotal,
      balance: balance,
    };
  };

  const handleBulkExport = async (): Promise<void> => {
    try {
      setBulkExportLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (dateRange.from) params.append("fromDate", dateRange.from);
      if (dateRange.to) params.append("toDate", dateRange.to);

      interface LedgerEntry {
        amount?: number;
        date?: string;
        entryType?: string;
        invoiceNumber?: string;
        paymentMethod?: string;
        referenceNumber?: string;
        description?: string;
      }

      interface VendorData {
        debit?: LedgerEntry[];
        credit?: LedgerEntry[];
      }

      const vendorDataMap = new Map<string, VendorData>();

      let totalVendors = 0;
      let grandTotalDebit = 0;
      let grandTotalCredit = 0;

      // Track vendor balances
      const vendorBalances: Record<string, number> = {};

      // === Fetch vendor data ===
      for (const vendor of vendors) {
        try {
          const vendorParams = new URLSearchParams(params);
          vendorParams.append("vendorId", vendor._id);

          const url = `${baseURL}/api/ledger/vendor-payables?${vendorParams.toString()}`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            console.warn("❌ Failed for vendor:", vendor.vendorName);
            continue;
          }

          const raw = await res.json();
          const data: VendorData = raw.data || raw;

          vendorDataMap.set(vendor._id, data);
          totalVendors++;

          // === Totals
          const debitTotal = (data.debit || []).reduce(
            (sum: number, e) => sum + Number(e.amount || 0),
            0
          );

          const creditPurchaseEntries = (data.debit || []).filter(
            (e) => e.paymentMethod !== "Credit"
          );
          const creditPaymentEntries = data.credit || [];

          const creditTotal = [
            ...creditPurchaseEntries,
            ...creditPaymentEntries,
          ].reduce((sum, e) => sum + Number(e.amount || 0), 0);

          const balance = debitTotal - creditTotal;

          grandTotalDebit += debitTotal;
          grandTotalCredit += creditTotal;
          vendorBalances[vendor._id] = balance;
        } catch (err) {
          console.error(`⚠️ Error fetching vendor ${vendor._id}:`, err);
        }
      }

      // ✅ Calculate Total Balance (Total Credit - Total Debit)
      const totalBalance = grandTotalCredit - grandTotalDebit;

      console.log("\n=== FINAL TOTALS ===");
      console.log("Total Vendors:", totalVendors);
      console.log("Total Debit:", grandTotalDebit);
      console.log("Total Credit:", grandTotalCredit);
      console.log("Total Balance:", totalBalance);
      console.log("✅ Status:", totalBalance > 0 ? "Net Balance (Positive)" : totalBalance < 0 ? "Total Payable (Negative)" : "Settled");

      // === Excel generation ===
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Vendor Ledger");

      // === Title ===
      sheet.mergeCells("A1:H1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = "Vendor Ledger Report";
      titleCell.font = { bold: true, size: 16, color: { argb: "2E75B6" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      // === Headers ===
      sheet.addRow([]);
      const headers = [
        "Vendor Name",
        "Invoice No",
        "Transaction Date",
        "Transaction Type",
        "Payment Method",
        "Amount",
        "Reference Number",
        "Description",
      ];
      sheet.addRow(headers);

      const headerRow = sheet.getRow(3);
      if (headerRow) {
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "305496" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "BFBFBF" } },
            bottom: { style: "thin", color: { argb: "BFBFBF" } },
            left: { style: "thin", color: { argb: "BFBFBF" } },
            right: { style: "thin", color: { argb: "BFBFBF" } },
          };
        });
      }

      // === Data Rows ===
      for (const vendor of vendors) {
        const data = vendorDataMap.get(vendor._id);
        if (!data) continue;

        const allEntries: LedgerEntry[] = [
          ...(data.debit || []).map((e) => ({ ...e, entryType: "Purchase" })),
          ...(data.credit || []).map((e) => ({ ...e, entryType: "Payment" })),
        ].sort(
          (a, b) =>
            new Date(a.date || "").getTime() - new Date(b.date || "").getTime()
        );

        for (const entry of allEntries) {
          const row = sheet.addRow([
            vendor.vendorName,
            entry.invoiceNumber || "-",
            formatDate(entry.date || ""),
            entry.entryType || "-",
            entry.paymentMethod || "-",
            Number(entry.amount || 0),
            entry.referenceNumber || "",
            entry.description || "-",
          ]);
          row.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "E8F1FA" },
          };
          row.getCell(1).font = { bold: true, color: { argb: "1F4E78" } };
          row.getCell(6).numFmt = "₹#,##0.00";
        }
      }

      sheet.addRow([]);

      const summaryRows = [
        ["Total Vendors", totalVendors],
        ["Total Credit (Cash Purchases + Payments)", grandTotalCredit],
        ["Total Debit (Purchases)", grandTotalDebit],
      ];

      for (const [label, value] of summaryRows) {
        const r = sheet.addRow([label, value]);
        const labelCell = r.getCell(1);
        const valueCell = r.getCell(2);

        labelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "DDEBF7" },
        };
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "E2EFDA" },
        };
        labelCell.font = { bold: true, color: { argb: "1F4E78" } };
        valueCell.font = { bold: true, color: { argb: "375623" } };
        valueCell.alignment = { horizontal: "right" };

        if (typeof value === "number") {
          if (label === "Total Vendors") {
            valueCell.numFmt = "0";
          } else {
            valueCell.numFmt = "₹#,##0.00";
          }
        }
      }

      sheet.addRow([]);
      sheet.addRow([]);

      // Add Net Balance section with Status
      // Determine status based on balance (Credit - Debit)
      const netBalance = grandTotalCredit - grandTotalDebit;
      const statusText = netBalance > 0 ? "Net Advance" : netBalance < 0 ? "Total Payable" : "Settled";
      const statusColor = netBalance > 0 ? "008000" : netBalance < 0 ? "C00000" : "808080"; // Green for positive, Red for payable, Gray for settled
      const amountColor = netBalance > 0 ? "008000" : netBalance < 0 ? "FF0000" : "000000"; // Green for positive, Red for payable, Black for settled

      // Row 1: Header - Balance Status and Status
      const balanceHeaderRow = sheet.addRow([statusText, "Status"]);

      // Balance header cell
      const netBalanceHeaderCell = balanceHeaderRow.getCell(1);
      netBalanceHeaderCell.font = { bold: true, size: 13, color: { argb: "2E75B6" } };
      netBalanceHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9E1F2" },
      };
      netBalanceHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
      netBalanceHeaderCell.border = {
        top: { style: "thin", color: { argb: "000000" } },
        bottom: { style: "thin", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "000000" } },
        right: { style: "thin", color: { argb: "000000" } },
      };

      // Status header cell (column B, right next to Balance)
      const statusHeaderCell = balanceHeaderRow.getCell(2);
      statusHeaderCell.font = { bold: true, size: 13, color: { argb: "FFFFFF" } };
      statusHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: statusColor },
      };
      statusHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
      statusHeaderCell.border = {
        top: { style: "thin", color: { argb: "000000" } },
        bottom: { style: "thin", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "000000" } },
        right: { style: "thin", color: { argb: "000000" } },
      };

      // Row 2: Data - Amount and Status Text
      const dataRow = sheet.addRow([Math.abs(netBalance), statusText]);

      // Amount cell in first column
      const amountCell = dataRow.getCell(1);
      amountCell.numFmt = "₹#,##0.00";
      amountCell.alignment = { horizontal: "center", vertical: "middle" };
      amountCell.font = { bold: true, color: { argb: amountColor } };
      amountCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E2EFDA" },
      };
      amountCell.border = {
        top: { style: "thin", color: { argb: "000000" } },
        bottom: { style: "thin", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "000000" } },
        right: { style: "thin", color: { argb: "000000" } },
      };

      // Status text cell (column B, right next to amount)
      const statusCell = dataRow.getCell(2);
      statusCell.font = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: statusColor },
      };
      statusCell.alignment = { horizontal: "center", vertical: "middle" };
      statusCell.border = {
        top: { style: "thin", color: { argb: "000000" } },
        bottom: { style: "thin", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "000000" } },
        right: { style: "thin", color: { argb: "000000" } },
      };

      const widths = [25, 16, 16, 16, 18, 14, 18, 30];
      widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Vendor_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Export Successful",
        description: `Downloaded ${vendors.length} vendor records`,
      });
    } catch (error) {
      console.error("Error during bulk export:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting the data",
      });
    } finally {
      setBulkExportLoading(false);
    }
  };

  const handleIndividualExport = async () => {
    try {
      setIndividualExportLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (dateRange.from) params.append("fromDate", dateRange.from);
      if (dateRange.to) params.append("toDate", dateRange.to);

      if (currentView === "vendor" && !selectedVendor) {
        toast({
          variant: "destructive",
          title: "Selection Required",
          description: "Please select a vendor to export individual vendor data.",
        });
        setIndividualExportLoading(false);
        return;
      }

      if (currentView === "expense" && !selectedExpense) {
        toast({
          variant: "destructive",
          title: "Selection Required",
          description: "Please select an expense category to export individual expense data.",
        });
        setIndividualExportLoading(false);
        return;
      }

      if (currentView === "vendor" && selectedVendor) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Vendor Ledger");

        const vendor = vendors.find((v) => v._id === selectedVendor);

        const vendorNameRow = sheet.addRow(["Vendor Name", vendor?.vendorName || "Unknown Vendor"]);
        vendorNameRow.getCell(1).font = { bold: true, color: { argb: "1F4E78" } };

        const dateInfoRow = sheet.addRow(["Report Date", new Date().toLocaleDateString("en-IN")]);
        dateInfoRow.getCell(1).font = { bold: true, color: { argb: "1F4E78" } };

        if (dateRange.from || dateRange.to) {
          const dateRangeText = `${dateRange.from ? formatDate(dateRange.from) : "Start"
            } to ${dateRange.to ? formatDate(dateRange.to) : "End"}`;
          const rangeRow = sheet.addRow(["Date Range", dateRangeText]);
          rangeRow.getCell(1).font = { bold: true, color: { argb: "1F4E78" } };
        }

        sheet.addRow([]);

        const transactionHeaders = [
          "S.No",
          "Date",
          "Type",
          "Description",
          "Invoice No",
          "Payment Method",
          "Amount",
          "Reference Number",
        ];
        sheet.addRow(transactionHeaders);

        const transactionHeaderRow = sheet.lastRow;
        if (transactionHeaderRow) {
          transactionHeaderRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFF" } };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "305496" },
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin", color: { argb: "BFBFBF" } },
              bottom: { style: "thin", color: { argb: "BFBFBF" } },
              left: { style: "thin", color: { argb: "BFBFBF" } },
              right: { style: "thin", color: { argb: "BFBFBF" } },
            };
          });
        }

        let serialNumber = 1;

        const vendorParams = new URLSearchParams();
        if (dateRange.from) vendorParams.append("fromDate", dateRange.from);
        if (dateRange.to) vendorParams.append("toDate", dateRange.to);
        vendorParams.append("vendorId", selectedVendor);

        const res = await fetch(
          `${baseURL}/api/ledger/vendor-payables?${vendorParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();

          const allEntries = [
            ...(data.debit || []).map((e: LedgerEntry) => ({ ...e, entryType: "Purchase" })),
            ...(data.credit || []).map((e: LedgerEntry) => ({ ...e, entryType: "Payment" })),
          ].sort(
            (a, b) =>
              new Date(a.date || "").getTime() - new Date(b.date || "").getTime()
          );

          allEntries.forEach((entry: any) => {
            const row = sheet.addRow([
              serialNumber++,
              formatDate(entry.date),
              entry.entryType,
              entry.description || "-",
              entry.invoiceNo || "-",
              entry.paymentMethod || "-",
              Number(entry.amount || 0),
              entry.referenceNumber || "-",
            ]);

            row.getCell(7).numFmt = "₹#,##0.00";

            row.eachCell((cell) => {
              cell.border = {
                top: { style: "thin", color: { argb: "D3D3D3" } },
                bottom: { style: "thin", color: { argb: "D3D3D3" } },
                left: { style: "thin", color: { argb: "D3D3D3" } },
                right: { style: "thin", color: { argb: "D3D3D3" } },
              };
            });
          });
        }

        sheet.addRow([]);

        const totals = calculateTotals();
        const summaryTitleRow = sheet.addRow(["SUMMARY"]);
        summaryTitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "2E75B6" } };

        const summaryData = [
          ["Total Purchases", totals.debit],
          ["Total Payments", totals.credit],
          ["Net Balance", Math.abs(totals.balance)],
          ["Status", totals.balance > 0 ? "Payable" : totals.balance < 0 ? "Advance" : "Settled"]
        ];

        summaryData.forEach(([label, value]) => {
          const row = sheet.addRow([label, value]);
          const labelCell = row.getCell(1);
          const valueCell = row.getCell(2);

          labelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "DDEBF7" },
          };
          valueCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "E2EFDA" },
          };
          labelCell.font = { bold: true, color: { argb: "1F4E78" } };
          valueCell.font = { bold: true, color: { argb: "375623" } };
          valueCell.alignment = { horizontal: "right" };

          if (typeof value === "number") {
            valueCell.numFmt = "₹#,##0.00";
          }
        });

        const widths = [10, 15, 15, 30, 15, 18, 15, 20];
        widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

        let filename = `vendor-ledger-${vendor?.vendorName?.replace(/[^a-zA-Z0-9]/g, "-") || "export"
          }`;
        if (dateRange.from || dateRange.to) {
          const fromStr = dateRange.from
            ? formatDate(dateRange.from).replace(/ /g, "-")
            : "start";
          const toStr = dateRange.to
            ? formatDate(dateRange.to).replace(/ /g, "-")
            : "end";
          filename += `-${fromStr}-to-${toStr}`;
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer]),
          `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
        );

        toast({
          title: "Export Successful",
          description: "Vendor ledger downloaded successfully",
        });
      } else if (currentView === "expense" && selectedExpense) {
        const exportData: any[] = [];

        exportData.push(["Expense Ledger Report", "", "", "", "", "", "", ""]);

        const expense = expenses.find((e) => e._id === selectedExpense);
        if (!expense) return;
        exportData.push(["Expense Category", expense.name]);
        exportData.push([
          "Report Date",
          new Date().toLocaleDateString("en-IN"),
        ]);

        if (dateRange.from || dateRange.to) {
          const dateRangeText = `${dateRange.from ? formatDate(dateRange.from) : "Start"
            } to ${dateRange.to ? formatDate(dateRange.to) : "End"}`;
          exportData.push(["Date Range", dateRangeText]);
        }

        exportData.push([]);

        const totals = calculateTotals();
        exportData.push(["SUMMARY"]);
        exportData.push([
          "Total Expenses",
          `${totals.credit.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        ]);

        exportData.push([]);
        exportData.push([]);

        exportData.push([
          "S.No",
          "Date",
          "Type",
          "Description",
          "Payment Method",
          "Amount ()",
          "Company",
          "Reference Number",
        ]);

        let serialNumber = 1;

        const expenseParams = new URLSearchParams(params);
        expenseParams.append("expenseId", selectedExpense);

        const res = await fetch(
          `${baseURL}/api/ledger/expense-payables?${expenseParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();

          (data.debit || []).forEach((entry: LedgerEntry) => {
            exportData.push([
              serialNumber++,
              formatDate(entry.date),
              "Expense",
              entry.description || "",
              entry.paymentMethod || "",
              entry.amount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              getCompanyName(expense.company) || "",
              entry.referenceNumber || "",
            ]);
          });

          (data.credit || []).forEach((entry: LedgerEntry) => {
            exportData.push([
              serialNumber++,
              formatDate(entry.date),
              "Payment",
              entry.description || "",
              entry.paymentMethod || "",
              entry.amount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              getCompanyName(expense.company) || "",
              entry.referenceNumber || "",
            ]);
          });
        }

        let filename = `expense-ledger-${expense.name.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}`;
        if (dateRange.from || dateRange.to) {
          const fromStr = dateRange.from
            ? formatDate(dateRange.from).replace(/ /g, "-")
            : "start";
          const toStr = dateRange.to
            ? formatDate(dateRange.to).replace(/ /g, "-")
            : "end";
          filename += `-${fromStr}-to-${toStr}`;
        }

        const csvContent = exportData
          .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
          .join("\n");

        const BOM = "\uFEFF";
        const csvWithBOM = BOM + csvContent;

        const blob = new Blob([csvWithBOM], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error during individual export:", error);
    } finally {
      setIndividualExportLoading(false);
    }
  };

  if (vendorsLoading || expensesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
              <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
            </div>
            <Skeleton className="h-10 w-full sm:w-64" />
          </div>
          <Skeleton className="h-24 sm:h-32 w-full" />
        </div>
      </div>
    );
  }

  const selectedVendorData = vendors.find((v) => v._id === selectedVendor);
  const selectedExpenseData = expenses.find((e) => e._id === selectedExpense);

  const vendorOptions = vendors.map((vendor) => ({
    value: vendor._id,
    label: vendor.vendorName,
  }));

  const filteredVendors = selectedVendorFilter
    ? vendors.filter((vendor) => vendor._id === selectedVendorFilter)
    : vendors;

  const filteredExpenses = selectedExpenseFilter
    ? expenses.filter((expense) => expense._id === selectedExpenseFilter)
    : expenses;

  const FiltersSection = () => (
    // 👈 1. FiltersSection के इस main div को z-50 दिया
    <div className="space-y-4 relative **z-50**">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isDetailOpen
              ? "Filter Transactions"
              : `Filter ${currentView === "vendor" ? "Vendors" : "Expenses"}`}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {getActiveFilterCount()} active
        </Badge>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {currentView === "vendor" && (
            // 👈 2. Vendor Combobox Container को z-50 दिया
            <div className="flex-2 relative **z-50**">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                {isDetailOpen ? "Switch Vendor" : "Filter by Vendor"}
              </label>
              <Combobox
                options={vendorOptions}
                value={selectedVendorFilter}
                onChange={setSelectedVendorFilter}
                placeholder={
                  isDetailOpen
                    ? "Select different vendor..."
                    : "Select vendor..."
                }
                searchPlaceholder="Search vendors..."
                noResultsText="No vendors found"
                className="md:w-[40vh] w-full"
              />
            </div>
          )}

          {currentView === "expense" && (
            // 👈 3. Expense Combobox Container को z-40 दिया
            <div className="flex-2 relative **z-40**">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                {isDetailOpen
                  ? "Switch Category"
                  : "Filter by Expense Category"}
              </label>
              <Combobox
                options={expenseOptions}
                value={selectedExpenseFilter}
                onChange={setSelectedExpenseFilter}
                placeholder={
                  isDetailOpen
                    ? "Select different category..."
                    : "Select category..."
                }
                searchPlaceholder="Search categories..."
                noResultsText="No categories found"
                className="md:w-[40vh] w-full"
              />
            </div>
          )}

          <div className="flex-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange((prev) => ({
                      ...prev,
                      from: e.target.value,
                    }));
                  }}
                  placeholder="From date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange((prev) => ({
                      ...prev,
                      to: e.target.value,
                    }));
                  }}
                  placeholder="To date"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-1 sm:space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col items-start gap-4">
              {isDetailOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedVendor("");
                    setSelectedExpense("");
                    setSelectedVendorFilter("");
                    setSelectedExpenseFilter("");
                    localStorage.removeItem("selectedVendor_payables");
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </Button>
              )}

              {/* Responsive heading + toggle (mobile only side-by-side) */}
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between sm:block">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    {currentView === "vendor"
                      ? "Vendor Account"
                      : "Expense Account"}
                  </h1>

                  {/* Toggle only visible on mobile */}
                  <div className="block sm:hidden">
                    <VendorExpenseToggle
                      currentView={currentView}
                      onViewChange={setCurrentView}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={handleIndividualExport}
                disabled={individualExportLoading || !isDetailOpen}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                {individualExportLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="hidden sm:inline">Export {currentView === "vendor" ? "Vendor" : "Category"}</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                onClick={handleBulkExport}
                disabled={bulkExportLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                {bulkExportLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="hidden sm:inline">Bulk Export</span>
                <span className="sm:hidden">Bulk</span>
              </Button>
              <div className="hidden md:block">
                <VendorExpenseToggle
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
              </div>
            </div>
          </div>

          <FiltersSection />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {currentView === "vendor" ? (
            selectedVendor ? (
              <VendorLedgerView
                loading={loading}
                ledgerData={ledgerData}
                selectedVendorData={selectedVendorData}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getPaymentMethodDisplay={getPaymentMethodDisplay}
                getPaymentMethodBadge={getPaymentMethodBadge}
                calculateTotals={calculateTotals}
                dateRange={dateRange}
                productsList={productsList}
              />
            ) : (
              <VendorExpenseList
                currentView={currentView}
                vendors={filteredVendors}
                expenses={expenses}
                expenseTotals={expenseTotals}
                onSelect={(id) => {
                  setSelectedVendor(id);
                  setSelectedVendorFilter(id);
                  localStorage.setItem("selectedVendor_payables", id);
                }}
                selectedCompanyId={selectedCompanyId || undefined}
              />
            )
          ) : selectedExpense ? (
            <ExpenseLedger
              ledgerData={ledgerData}
              loading={loading}
              selectedExpense={selectedExpense}
              expenses={expenses}
              dateRange={dateRange}
            />
          ) : (
            <VendorExpenseList
              currentView={currentView}
              vendors={vendors}
              expenses={filteredExpenses}
              expenseTotals={expenseTotals}
              onSelect={(id) => {
                setSelectedExpense(id);
                setSelectedExpenseFilter(id);
              }}
              selectedCompanyId={selectedCompanyId || undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}