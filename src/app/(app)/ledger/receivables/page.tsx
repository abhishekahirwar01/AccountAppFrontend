"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Download,
  Filter,
  Check,
  ChevronsUpDown,
  Smartphone,
  Monitor,
  Server,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { Combobox } from "@/components/ui/combobox";
import { setLineWidth } from "pdf-lib";
import { capitalizeWords } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCompany } from "@/contexts/company-context";
import { Company } from "@/lib/types";

interface Party {
  _id: string;
  name: string;
  contactNumber?: string;
  balance: number;
  company?: string;
  balances?: { [key: string]: number }; // Add this line for company-wise balances
}
interface LedgerEntry {
  id?: string;
  date: string;
  type: "debit" | "credit";
  transactionType: string;
  paymentMethod?: string;
  amount: number;
  referenceNumber?: string;
  description?: string;
}

const ReceivablesLedger: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const [customerBalances, setCustomerBalances] = useState<{
    [key: string]: number;
  }>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [overallTotals, setOverallTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    overallBalance: 0,
  });
  const [loadingOverall, setLoadingOverall] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [itemsToView, setItemsToView] = React.useState<any[]>([]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  const [lastTransactionDates, setLastTransactionDates] = useState<{ [key: string]: Date | null }>({});

  // Get company context
  const { selectedCompanyId } = useCompany();

  // Use selectedCompanyId for balance calculations
  const companyIdForBalances = selectedCompanyId || undefined;

  // Indian Number System Formatter
  const formatIndianNumber = (number: number | string): string => {
    const num = typeof number === "string" ? parseFloat(number) : number;
    if (isNaN(num)) return "0";
    const [integerPart, decimalPart] = num.toFixed(2).split(".");
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== "") {
      const formattedInteger =
        otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
      return decimalPart
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
    }

    return decimalPart ? `${lastThree}.${decimalPart}` : lastThree;
  };

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  // Auto-detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth < 768 ? "mobile" : "desktop");
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Auto-fetch when date range changes
  useEffect(() => {
    if (selectedParty) {
      const timer = setTimeout(() => {
        fetchLedgerData();
      }, 300);

      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (parties.length > 0) {
          calculateAllCustomerBalances(parties, companyIdForBalances);
          calculateOverallTotals();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [dateRange.startDate, dateRange.endDate, companyIdForBalances]);



  // Refresh data when company changes
useEffect(() => {
  if (parties.length > 0) {
    calculateAllCustomerBalances(parties, companyIdForBalances);
    calculateOverallTotals();
  }
}, [companyIdForBalances]);

// Refresh data when date range changes
useEffect(() => {
  if (selectedParty) {
    const timer = setTimeout(() => {
      fetchLedgerData();
    }, 300);

    return () => clearTimeout(timer);
  } else {
    const timer = setTimeout(() => {
      if (parties.length > 0) {
        calculateAllCustomerBalances(parties, companyIdForBalances);
        calculateOverallTotals();
      }
    }, 300);

    return () => clearTimeout(timer);
  }
}, [dateRange.startDate, dateRange.endDate, companyIdForBalances]);

  const partyOptions = parties.map((party) => ({
    value: party._id,
    label: `${party.name}${
      party.contactNumber ? ` (${party.contactNumber})` : ""
    }`,
  }));

  // Function to handle viewing items for a transaction
  const handleViewItems = async (entry: LedgerEntry) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
      // For ledger entries, we need to find the transaction by its ID
      // The entry.id should correspond to the transaction _id
      // Try sales endpoint first, then receipts if needed
      let endpoint = `${baseURL}/api/sales/${entry.id}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // If sales endpoint fails, try receipts endpoint
        const receiptsEndpoint = `${baseURL}/api/receipts/${entry.id}`;
        const receiptsResponse = await fetch(receiptsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!receiptsResponse.ok) {
          throw new Error("Failed to fetch transaction details");
        }

        const transaction = await receiptsResponse.json();
        // console.log("Fetched transaction data:", transaction);
        // console.log("Transaction products:", transaction.receipt?.products);
        // console.log("Transaction services:", transaction.receipt?.services);
        processTransactionData(transaction.receipt);
        return;
      }

      const transaction = await response.json();
      // console.log("Fetched transaction data:", transaction);
      // console.log("Transaction products:", transaction.entry?.products);
      // console.log("Transaction services:", transaction.entry?.services);
      processTransactionData(transaction.entry);
    } catch (error) {
      console.error("Error fetching transaction items:", error);
      // Show dialog with empty items and error message
      setItemsToView([]);
      setIsItemsDialogOpen(true);
    }
  };

  const processTransactionData = (transaction: any) => {
    // console.log("Processing transaction data:", transaction);
    // Process products and services similar to transactions page
    const prods = (transaction.products || []).map((p: any) => {
      // console.log("Processing product:", p);
      return {
        itemType: "product" as const,
        name: p.product?.name || p.product || "(product)",
        quantity: p.quantity ?? "",
        unitType: p.unitType ?? "",
        pricePerUnit: p.pricePerUnit ?? "",
        description: "",
        amount: Number(p.amount) || 0,
        hsnCode: p.hsn || p.product?.hsn || "",
        gstPercentage: p.gstPercentage,
        gstRate: p.gstPercentage,
        lineTax: p.lineTax,
      };
    });

    const svcArr = Array.isArray(transaction.services)
      ? transaction.services
      : Array.isArray(transaction.service)
      ? transaction.service
      : transaction.services
      ? [transaction.services]
      : [];
    const svcs = svcArr.map((s: any) => {
      // console.log("Processing service:", s);
      return {
        itemType: "service" as const,
        name: s.service?.serviceName || s.service || "(service)",
        quantity: "",
        unitType: "",
        pricePerUnit: "",
        description: s.description || "",
        amount: Number(s.amount) || 0,
        sacCode: s.sac || s.service?.sac || "",
        gstPercentage: s.gstPercentage,
        gstRate: s.gstPercentage,
        lineTax: s.lineTax,
      };
    });

    const allItems = [...prods, ...svcs];
    // console.log("All items to view:", allItems);
    setItemsToView(allItems);
    setIsItemsDialogOpen(true);
  };


  // Fallback function to calculate balances manually
const calculateBalancesManually = async (partiesList: Party[], companyId?: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const [salesResponse, receiptResponse] = await Promise.all([
      fetch(`${baseURL}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${baseURL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const salesData = await salesResponse.json();
    const receiptData = await receiptResponse.json();

    const allSales = salesData.data || salesData.sales || salesData.entries || [];
    const allReceipts = receiptData.data || receiptData.receipts || receiptData.entries || [];

    const balances: { [key: string]: number } = {};

    for (const party of partiesList) {
      let totalCredit = 0;
      let totalDebit = 0;

      const partySales = allSales.filter((sale: any) => {
        const salePartyId = sale.party?._id || sale.party;
        const matchesParty = String(salePartyId) === String(party._id);
        // Filter by company if selected - company can be object or string
        const saleCompanyId = typeof sale.company === 'object' ? sale.company?._id || sale.company?.id : sale.company;
        const matchesCompany = !companyId || saleCompanyId === companyId;
        return matchesParty && matchesCompany;
      });

      const partyReceipts = allReceipts.filter((receipt: any) => {
        const receiptPartyId = receipt.party?._id || receipt.party;
        const matchesParty = String(receiptPartyId) === String(party._id);
        // Filter by company if selected - company can be object or string
        const receiptCompanyId = typeof receipt.company === 'object' ? receipt.company?._id || receipt.company?.id : receipt.company;
        const matchesCompany = !companyId || receiptCompanyId === companyId;
        return matchesParty && matchesCompany;
      });

      // Process sales transactions (CREDITS)
      partySales.forEach((sale: any) => {
        const saleDate = new Date(sale.date);
        const startDate = dateRange.startDate
          ? new Date(dateRange.startDate + "T00:00:00")
          : null;
        const endDate = dateRange.endDate
          ? new Date(dateRange.endDate + "T23:59:59")
          : null;

        const isInDateRange =
          (!startDate || saleDate >= startDate) &&
          (!endDate || saleDate <= endDate);

        if (isInDateRange) {
          const amount = sale.totalAmount || sale.amount || sale.invoiceTotal || 0;
          const isCreditTransaction = sale.paymentMethod === "Credit";

          // ALL sales are credits (customers owe you)
          totalCredit += amount;

          // Only non-credit sales are also debits (immediate payments)
          if (!isCreditTransaction) {
            totalDebit += amount;
          }
        }
      });

      // Process receipt transactions (DEBITS)
      partyReceipts.forEach((receipt: any) => {
        const receiptDate = new Date(receipt.date);
        const startDate = dateRange.startDate
          ? new Date(dateRange.startDate + "T00:00:00")
          : null;
        const endDate = dateRange.endDate
          ? new Date(dateRange.endDate + "T23:59:59")
          : null;

        const isInDateRange =
          (!startDate || receiptDate >= startDate) &&
          (!endDate || receiptDate <= endDate);

        if (isInDateRange) {
          totalDebit += receipt.amount || 0;
        }
      });

      balances[party._id] = totalCredit - totalDebit;
    }

    setCustomerBalances(balances);
  } catch (error) {
    console.error("Error calculating balances manually:", error);
  }
};
 
// Calculate balances for all customers using stored balances from DB
const calculateAllCustomerBalances = async (partiesList: Party[], companyId?: string) => {
  setLoadingBalances(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    let url = `${baseURL}/api/parties/balances`;
    const params = new URLSearchParams();
    if (companyId) {
      params.append('companyId', companyId);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch balances");
    }

    const data = await response.json();
    const storedBalances = data.balances || {};

    const balances: { [key: string]: number } = {};
    for (const party of partiesList) {
      balances[party._id] = storedBalances[party._id] || 0;
    }

    setCustomerBalances(balances);
    console.log("Fetched customer balances:", {
      companyId: companyId || "all",
      balances
    });

    // Calculate last transaction dates
    await calculateLastTransactionDates(partiesList, companyId);
  } catch (error) {
    console.error("Error fetching customer balances:", error);
    // Fallback to manual calculation if API fails
    calculateBalancesManually(partiesList, companyId);
  } finally {
    setLoadingBalances(false);
  }
};

// Calculate last transaction dates for all parties
const calculateLastTransactionDates = async (partiesList: Party[], companyId?: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const [salesResponse, receiptResponse] = await Promise.all([
      fetch(`${baseURL}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${baseURL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const salesData = await salesResponse.json();
    const receiptData = await receiptResponse.json();

    const allSales = salesData.data || salesData.sales || salesData.entries || [];
    const allReceipts = receiptData.data || receiptData.receipts || receiptData.entries || [];

    const lastDates: { [key: string]: Date | null } = {};

    for (const party of partiesList) {
      let latestDate: Date | null = null;

      // Check sales transactions
      const partySales = allSales.filter((sale: any) => {
        const salePartyId = sale.party?._id || sale.party;
        const matchesParty = String(salePartyId) === String(party._id);
        const saleCompanyId = typeof sale.company === 'object' ? sale.company?._id || sale.company?.id : sale.company;
        const matchesCompany = !companyId || saleCompanyId === companyId;
        return matchesParty && matchesCompany;
      });

      partySales.forEach((sale: any) => {
        const saleDate = new Date(sale.date);
        if (!latestDate || saleDate > latestDate) {
          latestDate = saleDate;
        }
      });

      // Check receipt transactions
      const partyReceipts = allReceipts.filter((receipt: any) => {
        const receiptPartyId = receipt.party?._id || receipt.party;
        const matchesParty = String(receiptPartyId) === String(party._id);
        const receiptCompanyId = typeof receipt.company === 'object' ? receipt.company?._id || receipt.company?.id : receipt.company;
        const matchesCompany = !companyId || receiptCompanyId === companyId;
        return matchesParty && matchesCompany;
      });

      partyReceipts.forEach((receipt: any) => {
        const receiptDate = new Date(receipt.date);
        if (!latestDate || receiptDate > latestDate) {
          latestDate = receiptDate;
        }
      });

      lastDates[party._id] = latestDate;
    }

    setLastTransactionDates(lastDates);
  } catch (error) {
    console.error("Error calculating last transaction dates:", error);
  }
};


// Calculate overall totals
const calculateOverallTotals = async () => {
  setLoadingOverall(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Build query parameters for company filtering
    const salesParams = new URLSearchParams();
    const receiptsParams = new URLSearchParams();

    if (companyIdForBalances) {
      salesParams.append('company', companyIdForBalances);
      receiptsParams.append('company', companyIdForBalances);
    }

    const [salesResponse, receiptResponse] = await Promise.all([
      fetch(`${baseURL}/api/sales?${salesParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${baseURL}/api/receipts?${receiptsParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!salesResponse.ok || !receiptResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const salesData = await salesResponse.json();
    const receiptData = await receiptResponse.json();

    const allSales = salesData.data || salesData.sales || salesData.entries || [];
    const allReceipts = receiptData.data || receiptData.receipts || receiptData.entries || [];

    let totalCredit = 0;
    let totalDebit = 0;

    // Process all sales (CREDIT side - amounts customers owe you)
    allSales.forEach((sale: any) => {
      // Filter by company if selected - company can be object or string
      const saleCompanyId = typeof sale.company === 'object' ? sale.company?._id || sale.company?.id : sale.company;
      const matchesCompany = !companyIdForBalances || saleCompanyId === companyIdForBalances;

      if (!matchesCompany) return;

      const saleDate = new Date(sale.date);
      const startDate = dateRange.startDate
        ? new Date(dateRange.startDate + "T00:00:00")
        : null;
      const endDate = dateRange.endDate
        ? new Date(dateRange.endDate + "T23:59:59")
        : null;

      const isInDateRange =
        (!startDate || saleDate >= startDate) &&
        (!endDate || saleDate <= endDate);

      if (isInDateRange) {
        const amount = sale.totalAmount || sale.amount || sale.invoiceTotal || 0;

        // ALL sales are CREDITS (customers owe you this amount)
        totalCredit += amount;

        // For receivables, immediate payments (non-credit sales) are also DEBITS
        const isCreditTransaction = sale.paymentMethod === "Credit";
        if (!isCreditTransaction) {
          totalDebit += amount;
        }

        console.log(`Sale: ${amount}, Credit: ${totalCredit}, Debit: ${totalDebit}, IsCreditTransaction: ${isCreditTransaction}`);
      }
    });

    // Process all receipts (DEBIT side - payments received from customers)
    allReceipts.forEach((receipt: any) => {
      // Filter by company if selected - company can be object or string
      const receiptCompanyId = typeof receipt.company === 'object' ? receipt.company?._id || receipt.company?.id : receipt.company;
      const matchesCompany = !companyIdForBalances || receiptCompanyId === companyIdForBalances;

      if (!matchesCompany) return;

      const receiptDate = new Date(receipt.date);
      const startDate = dateRange.startDate
        ? new Date(dateRange.startDate + "T00:00:00")
        : null;
      const endDate = dateRange.endDate
        ? new Date(dateRange.endDate + "T23:59:59")
        : null;

      const isInDateRange =
        (!startDate || receiptDate >= startDate) &&
        (!endDate || receiptDate <= endDate);

      if (isInDateRange) {
        const amount = receipt.amount || 0;
        totalDebit += amount;
        console.log(`Receipt: ${amount}, Total Debit: ${totalDebit}`);
      }
    });

    const overallBalance = totalCredit - totalDebit;

    setOverallTotals({
      totalDebit,
      totalCredit,
      overallBalance,
    });
  } catch (error) {
    console.error("Error calculating overall totals:", error);
    // Fallback to manual calculation without API filtering
    calculateOverallTotalsFallback();
  } finally {
    setLoadingOverall(false);
  }
};

// Fallback function if the main calculation fails
const calculateOverallTotalsFallback = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const [salesResponse, receiptResponse] = await Promise.all([
      fetch(`${baseURL}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${baseURL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const salesData = await salesResponse.json();
    const receiptData = await receiptResponse.json();

    const allSales = salesData.data || salesData.sales || salesData.entries || [];
    const allReceipts = receiptData.data || receiptData.receipts || receiptData.entries || [];

    let totalCredit = 0;
    let totalDebit = 0;

    // Process all sales with company filtering
    allSales.forEach((sale: any) => {
      const saleDate = new Date(sale.date);
      const startDate = dateRange.startDate
        ? new Date(dateRange.startDate + "T00:00:00")
        : null;
      const endDate = dateRange.endDate
        ? new Date(dateRange.endDate + "T23:59:59")
        : null;

      const isInDateRange =
        (!startDate || saleDate >= startDate) &&
        (!endDate || saleDate <= endDate);

      // Filter by company if selected - company can be object or string
      const saleCompanyId = typeof sale.company === 'object' ? sale.company?._id || sale.company?.id : sale.company;
      const matchesCompany = !companyIdForBalances || saleCompanyId === companyIdForBalances;

      if (isInDateRange && matchesCompany) {
        const amount = sale.totalAmount || sale.amount || sale.invoiceTotal || 0;
        totalCredit += amount;
        
        const isCreditTransaction = sale.paymentMethod === "Credit";
        if (!isCreditTransaction) {
          totalDebit += amount;
        }
      }
    });

    // Process all receipts with company filtering
    allReceipts.forEach((receipt: any) => {
      const receiptDate = new Date(receipt.date);
      const startDate = dateRange.startDate
        ? new Date(dateRange.startDate + "T00:00:00")
        : null;
      const endDate = dateRange.endDate
        ? new Date(dateRange.endDate + "T23:59:59")
        : null;

      const isInDateRange =
        (!startDate || receiptDate >= startDate) &&
        (!endDate || receiptDate <= endDate);

      // Filter by company if selected - company can be object or string
      const receiptCompanyId = typeof receipt.company === 'object' ? receipt.company?._id || receipt.company?.id : receipt.company;
      const matchesCompany = !companyIdForBalances || receiptCompanyId === companyIdForBalances;

      if (isInDateRange && matchesCompany) {
        totalDebit += receipt.amount || 0;
      }
    });

    const overallBalance = totalCredit - totalDebit;

    setOverallTotals({
      totalDebit,
      totalCredit,
      overallBalance,
    });
    
    console.log("Fallback overall totals:", { 
      totalDebit, 
      totalCredit, 
      overallBalance,
      companyId: companyIdForBalances || "all"
    });
  } catch (error) {
    console.error("Error in fallback calculation:", error);
  }
};

  // Fetch parties
  const fetchParties = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch(`${baseURL}/api/parties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const partiesList = Array.isArray(data) ? data : data.parties || [];
        setParties(partiesList);

        calculateAllCustomerBalances(partiesList, companyIdForBalances);
        calculateOverallTotals();
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

const fetchLedgerData = async () => {
  if (!selectedParty) {
    setLedgerData([]);
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication token not found");

    const [salesResponse, receiptResponse] = await Promise.all([
      fetch(`${baseURL}/api/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${baseURL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const salesData = await salesResponse.json();
    const receiptData = await receiptResponse.json();

    const allSales = salesData.data || salesData.sales || salesData.entries || [];
    const allReceipts = receiptData.data || receiptData.receipts || receiptData.entries || [];

    const filteredSales = allSales.filter((sale: any) => {
      const salePartyId = sale.party?._id || sale.party;
      const matchesParty = String(salePartyId) === String(selectedParty);
      // Filter by company if selected - company can be object or string
      const saleCompanyId = typeof sale.company === 'object' ? sale.company?._id || sale.company?.id : sale.company;
      const matchesCompany = !companyIdForBalances || saleCompanyId === companyIdForBalances;
      return matchesParty && matchesCompany;
    });

    const filteredReceipts = allReceipts.filter((receipt: any) => {
      const receiptPartyId = receipt.party?._id || receipt.party;
      const matchesParty = String(receiptPartyId) === String(selectedParty);
      // Filter by company if selected - company can be object or string
      const receiptCompanyId = typeof receipt.company === 'object' ? receipt.company?._id || receipt.company?.id : receipt.company;
      const matchesCompany = !companyIdForBalances || receiptCompanyId === companyIdForBalances;
      return matchesParty && matchesCompany;
    });

    const ledgerEntries: LedgerEntry[] = [];

    // Process SALES transactions (Credit side + Debit side for non-credit payments)
    filteredSales.forEach((sale: any) => {
      const saleDate = new Date(sale.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate + "T00:00:00") : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate + "T23:59:59") : null;

      const isInDateRange = (!startDate || saleDate >= startDate) && (!endDate || saleDate <= endDate);

      if (isInDateRange) {
        ledgerEntries.push({
          id: sale._id,
          date: sale.date,
          type: "credit",
          transactionType: "Sales",
          paymentMethod: sale.paymentMethod || "Not Specified",
          amount: sale.totalAmount || sale.amount || sale.invoiceTotal || 0,
          referenceNumber: sale.invoiceNumber || sale.referenceNumber,
          description: sale.description,
        });

        const isCreditTransaction = sale.paymentMethod === "Credit";
        if (!isCreditTransaction) {
          ledgerEntries.push({
            id: sale._id,
            date: sale.date,
            type: "debit",
            transactionType: "Sales Payment",
            paymentMethod: sale.paymentMethod || "Not Specified",
            amount: sale.totalAmount || sale.amount || sale.invoiceTotal || 0,
            referenceNumber: sale.invoiceNumber || sale.referenceNumber,
            description: sale.description,
          });
        }
      }
    });

    // Process RECEIPTS transactions
    filteredReceipts.forEach((receipt: any) => {
      const receiptDate = new Date(receipt.date);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate + "T00:00:00") : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate + "T23:59:59") : null;

      const isInDateRange = (!startDate || receiptDate >= startDate) && (!endDate || receiptDate <= endDate);

      if (isInDateRange) {
        ledgerEntries.push({
          id: receipt._id,
          date: receipt.date,
          type: "debit",
          transactionType: "Receipt",
          paymentMethod: receipt.paymentMethod || "Not Specified",
          amount: receipt.amount || 0,
          referenceNumber: receipt.referenceNumber,
          description: receipt.description,
        });
      }
    });

    ledgerEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setLedgerData(ledgerEntries);
  } catch (error) {
    console.error("Error fetching ledger data:", error);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchLedgerData();
    }
  }, [selectedParty]);

  // Calculate totals
  const totals = ledgerData.reduce(
    (acc, entry) => {
      if (entry.type === "debit") {
        acc.totalDebit += entry.amount;
      } else {
        acc.totalCredit += entry.amount;
      }
      return acc;
    },
    { totalDebit: 0, totalCredit: 0 }
  );

  const balance = totals.totalCredit - totals.totalDebit;

  // Filter ledger data
  const filteredLedgerData = ledgerData.filter(
    (entry) =>
      entry.transactionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const debitEntries = filteredLedgerData.filter(
    (entry) => entry.type === "debit"
  );
  const creditEntries = filteredLedgerData.filter(
    (entry) => entry.type === "credit"
  );

  const maxRows = Math.max(debitEntries.length, creditEntries.length);

  const selectedPartyData = parties.find((p) => p._id === selectedParty);

  // Professional Bulk Export Function - Excel with Colors using ExcelJS
  const exportBulkCSV = async () => {
    if (parties.length === 0) return;

    setLoadingBalances(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      // Dynamically load ExcelJS from CDN
      if (!(window as any).ExcelJS) {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js";
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const ExcelJS = (window as any).ExcelJS;

      const [salesResponse, receiptResponse] = await Promise.all([
        fetch(`${baseURL}/api/sales`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/receipts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const salesData = await salesResponse.json();
      const receiptData = await receiptResponse.json();

      const allSales =
        salesData.data || salesData.sales || salesData.entries || [];
      const allReceipts =
        receiptData.data || receiptData.receipts || receiptData.entries || [];


          // Debit from immediate payments
          // if (sale.paymentMethod && sale.paymentMethod !== "Credit") {
          //   totalDebit += amount;
          //   overallTotalDebit += amount;
          //   transactionCount++;
          // }
          // Debit from immediate payments (non-credit transactions)
//  const isCreditTransaction = sale.paymentMethod === "Credit";
// if (!isCreditTransaction) {
//   totalDebit += amount;
//   overallTotalDebit += amount;
//   transactionCount++;

// }
//         } 

      let overallTotalCredit = 0;
      let overallTotalDebit = 0;

      const customersData = [];

      for (const party of parties) {
        let totalCredit = 0;
        let totalDebit = 0;
        let transactionCount = 0;
        let firstTransactionDate: Date | null = null;
        let lastTransactionDate: Date | null = null;

        const partySales = allSales.filter((sale: any) => {
          const salePartyId = sale.party?._id || sale.party;
          return String(salePartyId) === String(party._id);
        });

        const partyReceipts = allReceipts.filter((receipt: any) => {
          const receiptPartyId = receipt.party?._id || receipt.party;
          return String(receiptPartyId) === String(party._id);
        });

        partySales.forEach((sale: any) => {
          const saleDate = new Date(sale.date);
          const startDate = dateRange.startDate
            ? new Date(dateRange.startDate + "T00:00:00")
            : null;
          const endDate = dateRange.endDate
            ? new Date(dateRange.endDate + "T23:59:59")
            : null;

          const isInDateRange =
            (!startDate || saleDate >= startDate) &&
            (!endDate || saleDate <= endDate);

          if (isInDateRange) {
            const amount =
              sale.totalAmount || sale.amount || sale.invoiceTotal || 0;
                 const isCreditTransaction = sale.paymentMethod === "Credit";

            totalCredit += amount;
            overallTotalCredit += amount;
            transactionCount++;

            if (!firstTransactionDate || saleDate < firstTransactionDate)
              firstTransactionDate = saleDate;
            if (!lastTransactionDate || saleDate > lastTransactionDate)
              lastTransactionDate = saleDate;

            // if (sale.paymentMethod && sale.paymentMethod !== "Credit") {
            //   totalDebit += amount;
            //   overallTotalDebit += amount;
            //   transactionCount++;
            // }
            if (!isCreditTransaction) {
      totalDebit += amount;
      overallTotalDebit += amount;
      transactionCount++;
    }
          }
        });

        partyReceipts.forEach((receipt: any) => {
          const receiptDate = new Date(receipt.date);
          const startDate = dateRange.startDate
            ? new Date(dateRange.startDate + "T00:00:00")
            : null;
          const endDate = dateRange.endDate
            ? new Date(dateRange.endDate + "T23:59:59")
            : null;

          const isInDateRange =
            (!startDate || receiptDate >= startDate) &&
            (!endDate || receiptDate <= endDate);

          if (isInDateRange) {
            const amount = receipt.amount || 0;
            totalDebit += amount;
            overallTotalDebit += amount;
            transactionCount++;

            if (!firstTransactionDate || receiptDate < firstTransactionDate)
              firstTransactionDate = receiptDate;
            if (!lastTransactionDate || receiptDate > lastTransactionDate)
              lastTransactionDate = receiptDate;
          }
        });

        const balance = totalCredit - totalDebit;

        customersData.push({
          name: party.name,
          contact: party.contactNumber || "N/A",
          credit: totalCredit,
          debit: totalDebit,
          balance: Math.abs(balance),
          status: balance >= 0 ? "Customer Owes" : "You Owe",
          count: transactionCount,
          firstDate: firstTransactionDate
            ? format(firstTransactionDate, "dd/MM/yyyy")
            : "No transactions",
          lastDate: lastTransactionDate
            ? format(lastTransactionDate, "dd/MM/yyyy")
            : "No transactions",
        });
      }

      const overallBalance = overallTotalCredit - overallTotalDebit;

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Customer Ledger");

      // Set column widths
      worksheet.columns = [
        { width: 25 }, // Customer Name
        { width: 15 }, // Contact Number
        { width: 18 }, // Total Credit
        { width: 18 }, // Total Debit
        { width: 18 }, // Balance
        { width: 20 }, // Balance Status
        { width: 15 }, // Transactions
        { width: 18 }, // First Transaction
        { width: 18 }, // Last Transaction
      ];

      // Title Row
      const titleRow = worksheet.addRow(["CUSTOMER LEDGER REPORT"]);
      worksheet.mergeCells("A1:I1");
      titleRow.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      titleRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E5090" },
      };
      titleRow.alignment = { horizontal: "center", vertical: "middle" };
      titleRow.height = 30;

      // Meta Info Rows
      const metaRow1 = worksheet.addRow([
        `Report Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      ]);
      worksheet.mergeCells(`A${metaRow1.number}:I${metaRow1.number}`);
      metaRow1.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      const metaRow2 = worksheet.addRow([
        `Period: ${dateRange.startDate || "All"} to ${dateRange.endDate}`,
      ]);
      worksheet.mergeCells(`A${metaRow2.number}:I${metaRow2.number}`);
      metaRow2.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      // Empty Row
      worksheet.addRow([]);

      // Header Row
      const headerRow = worksheet.addRow([
        "Customer Name",
        "Contact Number",
        "Total Credit (₹)",
        "Total Debit (₹)",
        "Balance (₹)",
        "Balance Status",
        "Transactions",
        "First Transaction",
        "Last Transaction",
      ]);

      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 25;

      headerRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

      });

      // Data Rows
      customersData.forEach((customer, index) => {
        const row = worksheet.addRow([
          customer.name,
          customer.contact,
          `₹${formatIndianNumber(customer.credit)}`,
          `₹${formatIndianNumber(customer.debit)}`,
          `₹${formatIndianNumber(customer.balance)}`,
          customer.status,
          customer.count,
          customer.firstDate,
          customer.lastDate,
        ]);

        // Alternating row colors
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: index % 2 === 0 ? "FFFFFFFF" : "FFF2F2F2" },
        };

        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD9D9D9" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        // Left align first column
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
      });

      // Empty Row
      worksheet.addRow([]);

      // Summary Header
      const summaryHeaderRow = worksheet.addRow(["SUMMARY REPORT"]);
      worksheet.mergeCells(
        `A${summaryHeaderRow.number}:I${summaryHeaderRow.number}`
      );
      summaryHeaderRow.font = { size: 14, bold: true };
      summaryHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" },
      };
      summaryHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
      summaryHeaderRow.height = 25;

      // Empty Row
      worksheet.addRow([]);

      // Summary Rows
      // Summary Rows
      const summaryData = [
        ["Total Customers", parties.length, "", "", "", "", "", "", ""],
        [
          "Total Credit (All Customers)",
          `₹${formatIndianNumber(overallTotalCredit)}`,
        ],
        [
          "Total Debit (All Customers)",
          `₹${formatIndianNumber(overallTotalDebit)}`,
        ],
        [
          "Net Balance",
          `₹${formatIndianNumber(Math.abs(overallBalance))} (${
            overallBalance >= 0 ? "Customers Owe" : "You Owe"
          })`,
        ],
      ];

      summaryData.forEach((data, index) => {
        const row = worksheet.addRow(data);
        row.font = { bold: true };
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF2CC" },
        };

        row.eachCell((cell: any, colNumber: number) => {
          // For Total Customers row, remove right border from column B onwards and align left
          if (index === 0 && colNumber > 1) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              left: colNumber === 2 ? { style: "thin" } : undefined,
              bottom: { style: "thin" },
              right: colNumber === 9 ? { style: "thin" } : undefined,
            };
          } else {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });

        // For rows other than Total Customers, merge columns B to I
        if (index !== 0) {
          worksheet.mergeCells(`B${row.number}:I${row.number}`);
        }
      });
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Customer_Ledger_Report_${format(
        new Date(),
        "yyyy-MM-dd_HHmm"
      )}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting bulk data:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setLoadingBalances(false);
    }
  };

  const exportToCSV = async () => {
    if (!selectedPartyData) return;

    setLoading(true);
    try {
      // Dynamically load ExcelJS from CDN
      if (!(window as any).ExcelJS) {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js";
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const ExcelJS = (window as any).ExcelJS;

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Customer Ledger");

      // Set column widths
      worksheet.columns = [
        { width: 15 }, // Date
        { width: 12 }, // Type
        { width: 20 }, // Transaction Type
        { width: 18 }, // Payment Method
        { width: 18 }, // Amount
        { width: 20 }, // Reference
        { width: 30 }, // Description
      ];

      // Title Row
      const titleRow = worksheet.addRow([
        `CUSTOMER LEDGER - ${selectedPartyData.name.toUpperCase()}`,
      ]);
      worksheet.mergeCells("A1:G1");
      titleRow.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E5090" },
      };
      titleRow.alignment = { horizontal: "center", vertical: "middle" };
      titleRow.height = 28;

      // Meta Info Rows
      const metaRow1 = worksheet.addRow([
        `Report Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      ]);
      worksheet.mergeCells(`A${metaRow1.number}:G${metaRow1.number}`);
      metaRow1.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      const metaRow2 = worksheet.addRow([
        `Period: ${dateRange.startDate || "All"} to ${dateRange.endDate}`,
      ]);
      worksheet.mergeCells(`A${metaRow2.number}:G${metaRow2.number}`);
      metaRow2.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      const metaRow3 = worksheet.addRow([
        `Contact: ${selectedPartyData.contactNumber || "N/A"}`,
      ]);
      worksheet.mergeCells(`A${metaRow3.number}:G${metaRow3.number}`);
      metaRow3.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      // Empty Row
      worksheet.addRow([]);

      // Header Row
      const headerRow = worksheet.addRow([
        "Date",
        "Type",
        "Transaction Type",
        "Payment Method",
        "Amount (₹)",
        "Reference",
        "Description",
      ]);

      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 22;

      headerRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data Rows
      ledgerData.forEach((entry, index) => {
        const row = worksheet.addRow([
          format(new Date(entry.date), "dd/MM/yyyy"),
          entry.type.toUpperCase(),
          entry.transactionType,
          entry.paymentMethod || "",
          `₹${formatIndianNumber(entry.amount)}`,
          entry.referenceNumber || "",
          entry.description || "",
        ]);

        // Alternating row colors
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: index % 2 === 0 ? "FFFFFFFF" : "FFF2F2F2" },
        };

        row.eachCell((cell: any, colNumber: number) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD9D9D9" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };

          // Color code based on type
          if (colNumber === 2) {
            // Type column
            if (entry.type === "debit") {
              cell.font = { color: { argb: "FFDC3545" }, bold: true };
            } else {
              cell.font = { color: { argb: "FF28A745" }, bold: true };
            }
          }
        });

        // Left align description
        row.getCell(7).alignment = { horizontal: "left", vertical: "middle" };
      });

      // Empty Row
      worksheet.addRow([]);

      // Summary Header
      const summaryHeaderRow = worksheet.addRow(["SUMMARY"]);
      worksheet.mergeCells(
        `A${summaryHeaderRow.number}:G${summaryHeaderRow.number}`
      );
      summaryHeaderRow.font = { size: 13, bold: true };
      summaryHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" },
      };
      summaryHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
      summaryHeaderRow.height = 22;

      // Empty Row
      worksheet.addRow([]);

      // Summary Rows
      const summaryData = [
        ["Total Transactions", ledgerData.length, "", "", "", "", ""],
        ["Total Credit", `₹${formatIndianNumber(totals.totalCredit)}`],
        ["Total Debit", `₹${formatIndianNumber(totals.totalDebit)}`],
        [
          "Net Balance",
          `₹${formatIndianNumber(Math.abs(balance))} (${
            balance >= 0 ? "Customer Owes" : "You Owe"
          })`,
        ],
      ];

      summaryData.forEach((data, index) => {
        const row = worksheet.addRow(data);
        row.font = { bold: true };
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF2CC" },
        };

        row.eachCell((cell: any, colNumber: number) => {
          // For Total Transactions row, remove right border from column B onwards and align left
          if (index === 0 && colNumber > 1) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              left: colNumber === 2 ? { style: "thin" } : undefined,
              bottom: { style: "thin" },
              right: colNumber === 7 ? { style: "thin" } : undefined,
            };
          } else {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });

        // For rows other than Total Transactions, merge columns B to G
        if (index !== 0) {
          worksheet.mergeCells(`B${row.number}:G${row.number}`);
        }
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ledger_${selectedPartyData.name}_${format(
        new Date(),
        "yyyy-MM-dd_HHmm"
      )}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting ledger:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateRange({
      startDate: "",
      endDate: format(new Date(), "yyyy-MM-dd"),
    });
    setSearchTerm("");
  };

  // Mobile Card Component
  const MobileLedgerCard = ({
    entry,
    type,
  }: {
    entry: LedgerEntry;
    type: "debit" | "credit";
  }) => (
    <Card
      className={`mb-3 border-l-4 ${
        type === "debit" ? "border-l-red-500" : "border-l-green-500"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Badge
              variant="outline"
              className={`${
                type === "debit"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {entry.transactionType}
            </Badge>
          </div>
          <div
            className={`text-lg font-semibold ${
              type === "debit" ? "text-red-600" : "text-green-600"
            }`}
          >
            ₹{entry.amount.toFixed(2)}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{format(new Date(entry.date), "dd/MM/yyyy")}</span>
          </div>

          {entry.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {entry.paymentMethod}
              </Badge>
            </div>
          )}

          {entry.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-mono text-xs">{entry.referenceNumber}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Customer List Card Component
  const CustomerListCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">All Customers</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingBalances ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading customer balances...</span>
          </div>
        ) : parties.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No customers found
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Summary Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Overall Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overall Total Credit */}
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                        <svg
                          className="w-5 h-5 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Credit (All Customers)
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{formatIndianNumber(overallTotals.totalCredit)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Total Debit */}
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                        <svg
                          className="w-5 h-5 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Debit (All Customers)
                        </p>
                        <p className="text-xl font-bold text-red-600">
                          ₹{formatIndianNumber(overallTotals.totalDebit)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Balance */}
                <Card
                  className={`border-l-4 ${
                    overallTotals.overallBalance >= 0
                      ? "border-l-green-500"
                      : "border-l-red-500"
                  } shadow-sm`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          overallTotals.overallBalance >= 0
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        <svg
                          className={`w-5 h-5 ${
                            overallTotals.overallBalance >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Net Balance (All Customers)
                        </p>
                        <p
                          className={`text-xl font-bold ${
                            overallTotals.overallBalance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ₹
                          {formatIndianNumber(
                            Math.abs(overallTotals.overallBalance)
                          )}
                          <span className="text-sm font-normal ml-2 text-muted-foreground">
                            {overallTotals.overallBalance >= 0
                              ? "(Customers Owe)"
                              : "(You Owe)"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t">
              {/* Total Customers Box */}
              <div className="bg-card border rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Customers
                </p>
                <p className="text-lg font-bold">{parties.length}</p>
              </div>

              {/* Positive Balance Box */}
              <div className="bg-card border rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Positive Balance
                </p>
                <p className="text-lg font-bold text-green-600">
                  {
                    parties.filter((p) => (customerBalances[p._id] || 0) > 0)
                      .length
                  }
                </p>
              </div>

              {/* Negative Balance Box */}
              <div className="bg-card border rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Negative Balance
                </p>
                <p className="text-lg font-bold text-red-600">
                  {
                    parties.filter((p) => (customerBalances[p._id] || 0) < 0)
                      .length
                  }
                </p>
              </div>

              {/* Zero Balance Box */}
              <div className="bg-card border rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Zero Balance
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {
                    parties.filter((p) => (customerBalances[p._id] || 0) === 0)
                      .length
                  }
                </p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties
                    .filter((party) => lastTransactionDates[party._id]) // Only show parties with transactions
                    .sort((a, b) => {
                      const dateA = lastTransactionDates[a._id];
                      const dateB = lastTransactionDates[b._id];
                      if (!dateA && !dateB) return 0;
                      if (!dateA) return 1;
                      if (!dateB) return -1;
                      return dateB.getTime() - dateA.getTime(); // Most recent first
                    })
                    .map((party) => (
                    <TableRow
                      key={party._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedParty(party._id)}
                    >
                      <TableCell className="font-medium">
                        {capitalizeWords(party.name)}
                      </TableCell>
                      <TableCell>{party.contactNumber || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            (customerBalances[party._id] || 0) >= 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          ₹
                          {formatIndianNumber(
                            Math.abs(customerBalances[party._id] || 0)
                          )}
                          {(customerBalances[party._id] || 0) >= 0
                            ? " (Owes)"
                            : " (You Owe)"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParty(party._id);
                          }}
                        >
                          View Ledger
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {parties
                .filter((party) => lastTransactionDates[party._id]) // Only show parties with transactions
                .sort((a, b) => {
                  const dateA = lastTransactionDates[a._id];
                  const dateB = lastTransactionDates[b._id];
                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;
                  return dateB.getTime() - dateA.getTime(); // Most recent first
                })
                .map((party) => (
                <Card
                  key={party._id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedParty(party._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          {capitalizeWords(party.name)}
                        </h3>
                        {party.contactNumber && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {party.contactNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={
                            (customerBalances[party._id] || 0) >= 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          ₹
                          {Math.abs(customerBalances[party._id] || 0).toFixed(
                            2
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(customerBalances[party._id] || 0) >= 0
                            ? "Customer Owes"
                            : "You Owe"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedParty(party._id);
                      }}
                    >
                      View Ledger
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Customer Ledger</h1>

        <div className="flex items-center gap-2">
          {/* View Toggle - Hidden on desktop */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 md:hidden">
            <Button
              variant={viewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
              className="h-8 w-8 p-0"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
              className="h-8 w-8 p-0"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={exportBulkCSV}
            disabled={parties.length === 0 || loadingBalances}
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
          >
            {loadingBalances ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Bulk Export</span>
            <span className="sm:hidden">Bulk</span>
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={!selectedParty || ledgerData.length === 0}
            size="sm"
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Back to List Button */}
      {selectedParty && (
        <div className="flex items-center gap-2 pb-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedParty("")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Customer List
          </Button>
          <span className="text-muted-foreground text-sm">
            Currently viewing: <strong>{selectedPartyData?.name}</strong>
          </span>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="party">Select Customer</Label>
              <Combobox
                options={partyOptions}
                value={selectedParty}
                onChange={setSelectedParty}
                placeholder="Select a customer..."
                searchPlaceholder="Search customers..."
                noResultsText="No customers found."
                creatable={false}
              />
            </div>

            <div>
              <Label htmlFor="startDate">From Date</Label>
              <Input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="endDate">To Date</Label>
              <Input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedParty ? (
        <CustomerListCard />
      ) : (
        <>
          {selectedPartyData && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {/* Block 1: Customer */}
              <Card className="flex flex-col items-start p-3 sm:p-4 border shadow-sm">
                <CardContent className="p-0 flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-full bg-red-100/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-red-500 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Customer
                    </p>
                  </div>
                  <p className="text-base sm:text-xl font-semibold">
                    {selectedPartyData.name}
                  </p>
                </CardContent>
              </Card>

              {/* Block 2: Total Credit */}
              <Card className="flex flex-col items-start p-3 sm:p-4 border shadow-sm">
                <CardContent className="p-0 flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-full bg-green-100/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-green-500 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 10h18M7 15h1m4 0h1m-9 5h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Credit
                    </p>
                  </div>
                  <p className="text-base sm:text-xl font-semibold text-green-600">
                    ₹{formatIndianNumber(totals.totalCredit)}
                  </p>
                </CardContent>
              </Card>

              {/* Block 3: Total Debit */}
              <Card className="flex flex-col items-start p-3 sm:p-4 border shadow-sm">
                <CardContent className="p-0 flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-full bg-blue-100/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Debit
                    </p>
                  </div>
                  <p className="text-base sm:text-xl font-semibold text-red-600">
                    ₹{formatIndianNumber(totals.totalDebit)}
                  </p>
                </CardContent>
              </Card>

              {/* Block 4: Balance */}
              <Card className="flex flex-col items-start p-3 sm:p-4 border shadow-sm">
                <CardContent className="p-0 flex flex-col items-start w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-full bg-orange-100/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-orange-500 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Balance
                    </p>
                  </div>

                  <p
                    className={`flex flex-col md:flex-row gap-1 items-center text-base sm:text-xl font-semibold ${
                      balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{formatIndianNumber(Math.abs(balance))}
                    <span className="text-sm">
                      {balance >= 0 ? "(Customer Owes)" : "(You Owe)"}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ledger Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ledger Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading ledger data...</span>
                </div>
              ) : !selectedParty ? (
                <div className="text-center text-muted-foreground py-8">
                  Please select a customer to view ledger
                </div>
              ) : filteredLedgerData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No transactions found for the selected filters
                </div>
              ) : viewMode === "mobile" ? (
                // Mobile View
                <div className="space-y-4">
                  {/* Debit Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-3 pb-2 border-b border-red-200 dark:border-red-800">
                      Debit Side (Receipts)
                    </h3>
                    <div className="space-y-3">
                      {debitEntries.map((entry, index) => (
                        <MobileLedgerCard
                          key={`debit-${index}`}
                          entry={entry}
                          type="debit"
                        />
                      ))}
                      {debitEntries.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No debit transactions
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credit Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-3 pb-2 border-b border-green-200 dark:border-green-800">
                      Credit Side (Sales)
                    </h3>
                    <div className="space-y-3">
                      {creditEntries.map((entry, index) => (
                        <MobileLedgerCard
                          key={`credit-${index}`}
                          entry={entry}
                          type="credit"
                        />
                      ))}
                      {creditEntries.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No credit transactions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Desktop View - Table Layout
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          colSpan={4}
                          className="text-center bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 font-bold"
                        >
                          DEBIT SIDE (Receipts)
                        </TableHead>
                        <TableHead
                          colSpan={4}
                          className="text-center bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 font-bold"
                        >
                          CREDIT SIDE (Sales)
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        {/* Debit Headers */}
                        <TableHead className="bg-red-50 dark:bg-red-900/30">
                          Date
                        </TableHead>
                        <TableHead className="bg-red-50 dark:bg-red-900/30">
                          Transaction Type
                        </TableHead>
                        <TableHead className="bg-red-50 dark:bg-red-900/30">
                          Payment Method
                        </TableHead>
                        <TableHead className="bg-red-50 dark:bg-red-900/30 text-right">
                          Amount (₹)
                        </TableHead>

                        {/* Credit Headers */}
                        <TableHead className="bg-green-50 dark:bg-green-900/30">
                          Date
                        </TableHead>
                        <TableHead className="bg-green-50 dark:bg-green-900/30">
                          Transaction Type
                        </TableHead>
                        <TableHead className="bg-green-50 dark:bg-green-900/30">
                          Payment Method
                        </TableHead>
                        <TableHead className="bg-green-50 dark:bg-green-900/30 text-right">
                          Amount (₹)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: maxRows }).map((_, index) => (
                        <TableRow key={index}>
                          {/* Debit Side */}
                          <TableCell className="bg-red-50 dark:bg-red-900/20">
                            {debitEntries[index]
                              ? format(
                                  new Date(debitEntries[index].date),
                                  "dd/MM/yyyy"
                                )
                              : ""}
                          </TableCell>
                          <TableCell className="bg-red-50 dark:bg-red-900/20">
                            {debitEntries[index]?.transactionType && (
                              <Badge
                                variant="outline"
                                className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                              >
                                {debitEntries[index].transactionType}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="bg-red-50 dark:bg-red-900/20">
                            {debitEntries[index]?.paymentMethod && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                              >
                                {debitEntries[index].paymentMethod}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="bg-red-50 dark:bg-red-900/20 text-right font-medium text-red-600 dark:text-red-400">
                            {debitEntries[index]
                              ? `₹${formatIndianNumber(
                                  debitEntries[index].amount
                                )}`
                              : ""}
                          </TableCell>

                          {/* Credit Side */}
                          <TableCell className="bg-green-50 dark:bg-green-900/20">
                            {creditEntries[index]
                              ? format(
                                  new Date(creditEntries[index].date),
                                  "dd/MM/yyyy"
                                )
                              : ""}
                          </TableCell>
                          <TableCell className="bg-green-50 dark:bg-green-900/20">
                            {creditEntries[index]?.transactionType && (
                              <div>
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                >
                                  {creditEntries[index].transactionType}
                                </Badge>
                                <button
                                  onClick={() => handleViewItems(creditEntries[index])}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 ml-2"
                                >
                                  View Details
                                </button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="bg-green-50 dark:bg-green-900/20">
                            {creditEntries[index]?.paymentMethod && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                              >
                                {creditEntries[index].paymentMethod}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="bg-green-50 dark:bg-green-900/20 text-right font-medium text-green-600 dark:text-green-400">
                            {creditEntries[index]
                              ? `₹${formatIndianNumber(
                                  creditEntries[index].amount
                                )}`
                              : ""}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totals Row */}
                      <TableRow className="font-bold bg-muted/50 dark:bg-muted">
                        <TableCell
                          colSpan={3}
                          className="text-right bg-red-50 dark:bg-red-900/30"
                        >
                          Total Debit:
                        </TableCell>
                        <TableCell className="text-right bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          ₹{formatIndianNumber(totals.totalDebit)}
                        </TableCell>

                        <TableCell
                          colSpan={3}
                          className="text-right bg-green-50 dark:bg-green-900/30"
                        >
                          Total Credit:
                        </TableCell>
                        <TableCell className="text-right bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                          ₹{formatIndianNumber(totals.totalCredit)}
                        </TableCell>
                      </TableRow>

                      {/* Balance Row */}
                      <TableRow className="font-bold bg-muted dark:bg-muted/80">
                        <TableCell
                          colSpan={3}
                          className="text-right bg-blue-50 dark:bg-blue-900/30"
                        >
                          Balance:
                        </TableCell>
                        <TableCell
                          colSpan={5}
                          className="text-center bg-blue-50 dark:bg-blue-900/30"
                        >
                          <span
                            className={
                              balance >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            ₹{formatIndianNumber(Math.abs(balance))}{" "}
                            {balance >= 0 ? "(Customer Owes)" : "(You Owe)"}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Item Details Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl rounded-lg sm:rounded-xl">
          <DialogHeader className="px-1 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">
              Item Details
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              A detailed list of all items in this transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
            {/* Summary Section */}
            {itemsToView.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₹{formatIndianNumber(itemsToView.reduce((sum, item) => sum + Number(item.amount || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tax Total</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₹{formatIndianNumber(itemsToView.reduce((sum, item) => {
                        const lineTax = (item as any).lineTax;
                        if (lineTax !== undefined && lineTax !== null) {
                          return sum + Number(lineTax);
                        }
                        const gstRate = (item as any).gstPercentage || (item as any).gstRate || (item as any).gst || 0;
                        const taxableValue = item.amount || 0;
                        const taxAmount = (taxableValue * gstRate) / 100;
                        return sum + taxAmount;
                      }, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Total</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ₹{formatIndianNumber(
                        itemsToView.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
                        itemsToView.reduce((sum, item) => {
                          const lineTax = (item as any).lineTax;
                          if (lineTax !== undefined && lineTax !== null) {
                            return sum + Number(lineTax);
                          }
                          const gstRate = (item as any).gstPercentage || (item as any).gstRate || (item as any).gst || 0;
                          const taxableValue = item.amount || 0;
                          const taxAmount = (taxableValue * gstRate) / 100;
                          return sum + taxAmount;
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Desktop Table (hidden on mobile) */}
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">HSN/SAC</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsToView.map((item, idx) => {
                  const isService = item.itemType === "service";
                  const qty =
                    !isService &&
                    item.quantity !== undefined &&
                    item.quantity !== null &&
                    !isNaN(Number(item.quantity))
                      ? `${item.quantity} ${item.unitType || "Piece"}`
                      : "—";
                  const rate = !isService
                    ? formatIndianNumber(Number(item?.pricePerUnit ?? 0))
                    : "—";
                  const total = formatIndianNumber(Number(item?.amount ?? 0));

                  const hsnSacCode = isService
                    ? item.sacCode
                    : item.hsnCode;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isService ? (
                            <Server className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <span>{item?.name ?? "—"}</span>
                            {isService && item?.description ? (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="capitalize">
                        {item.itemType ?? "—"}
                      </TableCell>

                      <TableCell className="text-center">{qty}</TableCell>

                      <TableCell className="text-center">
                        {hsnSacCode || item.hsnCode || item.sacCode || "—"}
                      </TableCell>

                      <TableCell className="text-right">₹{rate}</TableCell>

                      <TableCell className="text-right font-semibold">
                        ₹{total}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Mobile Cards (visible on mobile) */}
            <div className="sm:hidden space-y-3 p-1">
              {itemsToView.map((item, idx) => {
                const isService = item.itemType === "service";
                const qty =
                  !isService &&
                  item.quantity !== undefined &&
                  item.quantity !== null &&
                  !isNaN(Number(item.quantity))
                    ? `${item.quantity} ${item.unitType || "Piece"}`
                    : "—";
                const rate = !isService
                  ? formatIndianNumber(Number(item?.pricePerUnit ?? 0))
                  : "—";
                const total = formatIndianNumber(Number(item?.amount ?? 0));
                const hsnSacCode = isService ? item.sacCode : item.hsnCode;

                return (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1">
                        {isService ? (
                          <Server className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {item?.name ?? "—"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {item.itemType ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            HSN/SAC: {hsnSacCode || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isService && item?.description && (
                      <div className="mb-3 px-1">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Quantity
                        </div>
                        <div className="font-medium">{qty}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Price/Unit
                        </div>
                        <div className="font-medium">₹{rate}</div>
                      </div>

                      <div className="col-span-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">
                            Total Amount
                          </div>
                          <div className="text-base font-bold text-green-600 dark:text-green-400">
                            ₹{total}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceivablesLedger;
