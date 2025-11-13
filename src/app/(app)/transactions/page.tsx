"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "@/components/transactions/columns";
import {
  PlusCircle,
  Loader2,
  Download,
  FileText,
  Package,
  Server,
  Check,
  CreditCard,
  Receipt,
  ShoppingCart,
  TrendingUp,
  ListCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import ProformaForm from "@/components/transactions/proforma-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/contexts/company-context";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Company, Party, Vendor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import "@/app/invoice.css";
import "@/app/invoice-template-2.css";
import "@/app/invoice-template-3.css";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { Item } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { List } from "@react-pdf/renderer";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

type TabKey =
  | "all"
  | "sales"
  | "purchases"
  | "proforma"
  | "receipts"
  | "payments"
  | "journals";
type FormType = "sales" | "purchases" | "receipt" | "payment" | "journal";

export default function TransactionsPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isProformaFormOpen, setIsProformaFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    React.useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] =
    React.useState<Transaction | null>(null);
  const [transactionToPreview, setTransactionToPreview] =
    React.useState<Transaction | null>(null);
  const [itemsToView, setItemsToView] = React.useState<Item[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [sales, setSales] = React.useState<Transaction[]>([]);
  const [purchases, setPurchases] = React.useState<Transaction[]>([]);
  const [proforma, setProforma] = React.useState<Transaction[]>([]);
  const [receipts, setReceipts] = React.useState<Transaction[]>([]);
  const [payments, setPayments] = React.useState<Transaction[]>([]);
  const [journals, setJournals] = React.useState<Transaction[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("all");
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [prefillFromTransaction, setPrefillFromTransaction] =
    React.useState<Transaction | null>(null);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab); // Type-safe now
    setIsDropdownOpen(false); // Close the dropdown when a tab is selected
  };

  const [companies, setCompanies] = React.useState<Company[]>([]);
  // top of component state
  const [productsList, setProductsList] = React.useState<any[]>([]);
  const [servicesList, setServicesList] = React.useState<any[]>([]);

  const [parties, setParties] = React.useState<Party[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const { selectedCompanyId } = useCompany();
  const getCompanyId = (c: any) => (typeof c === "object" ? c?._id : c) || null;

  const [defaultTransactionType, setDefaultTransactionType] = React.useState<
    "sales" | "purchases" | "receipt" | "payment" | "journal" | null
  >(null);

  const { toast } = useToast();

  // ---- PERMISSION GATING ----
  const { permissions: userCaps, role } = useUserPermissions(); // ensure your hook exposes role; otherwise get it from your auth context
  const isSuper = role === "master" || role === "client";

  console.log("useUserPermissions :", userCaps);

  const canSales = isSuper || !!userCaps?.canCreateSaleEntries;
  const canPurchases = isSuper || !!userCaps?.canCreatePurchaseEntries;
  const canReceipt = isSuper || !!userCaps?.canCreateReceiptEntries;
  const canPayment = isSuper || !!userCaps?.canCreatePaymentEntries;
  const canJournal = isSuper || !!userCaps?.canCreateJournalEntries;

  console.log("cansales", canSales);

  const allowedTypes = React.useMemo(() => {
    const arr: Array<
      "sales" | "purchases" | "receipt" | "payment" | "journal"
    > = [];
    if (canSales) arr.push("sales");
    if (canPurchases) arr.push("purchases");
    if (canReceipt) arr.push("receipt");
    if (canPayment) arr.push("payment");
    if (canJournal) arr.push("journal");
    return arr;
  }, [canSales, canPurchases, canReceipt, canPayment, canJournal]);

  const tabToFormType = (t: TabKey): FormType | null => {
    switch (t) {
      case "sales":
        return "sales";
      case "purchases":
        return "purchases";
      case "receipts":
        return "receipt";
      case "payments":
        return "payment";
      case "journals":
        return "journal";
      default:
        return null; // "all"
    }
  };

  const canCreateAny = allowedTypes.length > 0;

  const lastFetchRef = React.useRef<{
    timestamp: number;
    companyId: string | null;
  }>({ timestamp: 0, companyId: null });

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const queryParam = selectedCompanyId
        ? `?companyId=${selectedCompanyId}`
        : "";

      lastFetchRef.current = {
        timestamp: Date.now(),
        companyId: selectedCompanyId,
      };

      const buildRequest = (url: string) =>
        fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      // console.log("Fetching sales with query:", queryParam);
      // console.log("Selected company ID:", selectedCompanyId);

      // Response parsing utilities
      const parseResponse = (data: any, possibleArrayKeys: string[] = []) => {
        // console.log("Parsing response:", data);

        if (Array.isArray(data)) return data;

        // Check for common success patterns
        if (data?.success && Array.isArray(data?.data)) return data.data;
        if (data?.success && Array.isArray(data?.entries)) return data.entries;

        // Check for specific keys
        for (const key of possibleArrayKeys) {
          if (Array.isArray(data?.[key])) return data[key];
        }

        // Fallback: check any array in the response
        for (const key in data) {
          if (Array.isArray(data[key])) {
            console.warn(`Found array in unexpected key: ${key}`);
            return data[key];
          }
        }

        console.warn("No array data found in response:", data);
        return [];
      };

      const parseSalesResponse = (data: any) => {
        return parseResponse(data, ["salesEntries", "sales", "entries"]);
      };

      const parsePurchasesResponse = (data: any) => {
        return parseResponse(data, ["purchaseEntries", "purchases", "entries"]);
      };

      const parseProformaResponse = (data: any) => {
        return parseResponse(data, ["proformaEntries", "proforma", "entries"]);
      };

      const parseReceiptsResponse = (data: any) => {
        return parseResponse(data, ["receiptEntries", "receipts", "entries"]);
      };

      const parsePaymentsResponse = (data: any) => {
        return parseResponse(data, ["paymentEntries", "payments", "entries"]);
      };

      const parseJournalsResponse = (data: any) => {
        return parseResponse(data, ["journalEntries", "journals", "entries"]);
      };

      const parseCompaniesResponse = (data: any) => {
        return parseResponse(data, ["companies", "data"]);
      };

      const parsePartiesResponse = (data: any) => {
        return parseResponse(data, ["parties", "customers", "data"]);
      };

      const parseVendorsResponse = (data: any) => {
        return parseResponse(data, ["vendors", "suppliers", "data"]);
      };

      const parseProductsResponse = (data: any) => {
        return parseResponse(data, ["products", "items", "data"]);
      };

      const parseServicesResponse = (data: any) => {
        return parseResponse(data, ["services", "data"]);
      };

      // Helper function to check response status and parse JSON
      const fetchAndParse = async (
        url: string,
        parser: Function,
        endpointName: string
      ) => {
        try {
          const response = await buildRequest(url);
          if (!response.ok) {
            throw new Error(
              `${endpointName} failed: ${response.status} ${response.statusText}`
            );
          }
          const data = await response.json();
          // console.log(`${endpointName} response:`, data);
          return parser(data);
        } catch (error) {
          console.error(`Error fetching ${endpointName}:`, error);
          throw error;
        }
      };

      // Fetch all data with proper error handling
      // tiny helper
      const maybeFetch = <T,>(
        cond: boolean,
        task: () => Promise<T>,
        fallback: T
      ) => (cond ? task() : Promise.resolve(fallback));

      // Fetch only allowed entry types; always fetch masters (companies/parties/products/services)
      const [
        salesArray,
        purchasesArray,
        proformaArray,
        receiptsArray,
        paymentsArray,
        journalsArray,
        companiesArray,
        partiesArray,
        vendorsArray,
        productsArray,
        servicesArray,
      ] = await Promise.all([
        maybeFetch(
          canSales,
          () =>
            fetchAndParse(
              `${baseURL}/api/sales${queryParam}`,
              parseSalesResponse,
              "sales"
            ),
          []
        ),
        maybeFetch(
          canPurchases,
          () =>
            fetchAndParse(
              `${baseURL}/api/purchase${queryParam}`,
              parsePurchasesResponse,
              "purchases"
            ),
          []
        ),
        maybeFetch(
          canSales,
          () =>
            fetchAndParse(
              `${baseURL}/api/proforma${queryParam}`,
              parseProformaResponse,
              "proforma"
            ),
          []
        ),
        maybeFetch(
          canReceipt,
          () =>
            fetchAndParse(
              `${baseURL}/api/receipts${queryParam}`,
              parseReceiptsResponse,
              "receipts"
            ),
          []
        ),
        maybeFetch(
          canPayment,
          () =>
            fetchAndParse(
              `${baseURL}/api/payments${queryParam}`,
              parsePaymentsResponse,
              "payments"
            ),
          []
        ),
        maybeFetch(
          canJournal,
          () =>
            fetchAndParse(
              `${baseURL}/api/journals${queryParam}`,
              parseJournalsResponse,
              "journals"
            ),
          []
        ),
        fetchAndParse(
          `${baseURL}/api/companies/my`,
          parseCompaniesResponse,
          "companies"
        ),
        fetchAndParse(
          `${baseURL}/api/parties`,
          parsePartiesResponse,
          "parties"
        ),
        fetchAndParse(
          `${baseURL}/api/vendors`,
          parseVendorsResponse,
          "vendors"
        ),
        fetchAndParse(
          `${baseURL}/api/products`,
          parseProductsResponse,
          "products"
        ),
        fetchAndParse(
          `${baseURL}/api/services`,
          parseServicesResponse,
          "services"
        ),
      ]);

      // console.log("Parsed sales:", salesArray);
      // console.log("Parsed purchases:", purchasesArray);

      // Update state with parsed data
      setSales(salesArray.map((p: any) => ({ ...p, type: "sales" })));
      setPurchases(
        purchasesArray.map((p: any) => ({ ...p, type: "purchases" }))
      );
      setProforma(proformaArray.map((p: any) => ({ ...p, type: "proforma" })));
      setReceipts(receiptsArray.map((r: any) => ({ ...r, type: "receipt" })));
      setPayments(paymentsArray.map((p: any) => ({ ...p, type: "payment" })));
      setJournals(
        journalsArray.map((j: any) => ({
          ...j,
          description: j.narration || j.description,
          type: "journal",
        }))
      );

      console.log("Raw Sales Data:", salesArray);
      console.log("Raw Receipt Data:", receiptsArray);

      setCompanies(companiesArray);
      setParties(partiesArray);
      setVendors(vendorsArray);
      setProductsList(productsArray);
      setServicesList(servicesArray);
    } catch (error) {
      console.error("Fetch transactions error:", error);
      toast({
        variant: "destructive",
        title: "Failed to load transactions",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedCompanyId,
    toast,
    baseURL,
    canSales,
    canPurchases,
    canReceipt,
    canPayment,
    canJournal,
  ]);

  const queryParam = selectedCompanyId ? `?companyId=${selectedCompanyId}` : "";

  console.log("Sales API URL:", `${baseURL}/api/sales${queryParam}`);

  const productNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productsList) {
      // Ensure we're using the correct ID and name fields
      m.set(String(p._id), p.name || "(unnamed product)");
    }
    return m;
  }, [productsList]);

  const serviceNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of servicesList) m.set(String(s._id), s.serviceName);
    return m;
  }, [servicesList]);

  // console.log("serviceNameById  :", serviceNameById);
  // console.log("servicesList  :", servicesList);

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      await fetchTransactions();
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchTransactions]);

  const handleOpenForm = (
    transaction: Transaction | null = null,
    type?: "sales" | "purchases" | "receipt" | "payment" | "journal"
  ) => {
    setTransactionToEdit(transaction);
    setDefaultTransactionType(type || null);
    setIsFormOpen(true);
  };
  const handleOpenDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsAlertOpen(true);
  };

  const handleOpenPreviewDialog = (transaction: Transaction) => {
    setTransactionToPreview(transaction);
    setIsPreviewOpen(true);
  };

  // console.log("productsList :", productsList);
  // console.log("servicesList :", servicesList);

  // change signature:
  const handleViewItems = (tx: any) => {
    console.log("Transaction data:", tx);
    console.log("Products:", tx.products);
    console.log("Services:", tx.services);

    const prods = (tx.products || []).map((p: any) => {
      // Debug: Log the product ID and name lookup
      const productName =
        productNameById.get(p.product) || p.product?.name || "(product)";
      // console.log("Product lookup:", {
      //   id: p.product,
      //   foundName: productNameById.get(p.product),
      //   productObj: p.product,
      // });

      // Get HSN code from product
      const productId =
        typeof p.product === "object" ? p.product._id : p.product;
      const productObj = productsList.find((prod) => prod._id === productId);
      const hsnCode = productObj?.hsn || "";

      console.log("Product item:", p);
      console.log("GST Percentage:", p.gstPercentage);
      console.log("Line Tax:", p.lineTax);

      return {
        itemType: "product" as const,
        name: productName,
        quantity: p.quantity ?? "",
        unitType: p.unitType ?? "",
        pricePerUnit: p.pricePerUnit ?? "",
        description: "",
        amount: Number(p.amount) || 0,
        hsnCode,
        gstPercentage: p.gstPercentage,
        gstRate: p.gstPercentage, // Add gstRate as well
        lineTax: p.lineTax,
      };
    });

    // inside handleViewItems
    const svcArr = Array.isArray(tx.services)
      ? tx.services
      : Array.isArray(tx.service)
      ? tx.service
      : tx.services
      ? [tx.services]
      : [];
    const svcs = svcArr.map((s: any) => {
      // id can be raw ObjectId or populated doc; also support legacy s.serviceName
      const id =
        typeof s.service === "object"
          ? s.service._id
          : s.service ??
            (typeof s.serviceName === "object"
              ? s.serviceName._id
              : s.serviceName);

      const name =
        (id && serviceNameById.get(String(id))) ||
        (typeof s.service === "object" && s.service.serviceName) ||
        (typeof s.serviceName === "object" && s.serviceName.serviceName) ||
        "(service)";

      // Get SAC code from service
      const serviceObj = servicesList.find((svc) => svc._id === id);
      const sacCode = serviceObj?.sac || "";

      console.log("Service item:", s);
      console.log("Service GST Percentage:", s.gstPercentage);
      console.log("Service Line Tax:", s.lineTax);

      return {
        itemType: "service" as const,
        name,
        quantity: "",
        unitType: "",
        pricePerUnit: "",
        description: s.description || "",
        amount: Number(s.amount) || 0,
        sacCode,
        gstPercentage: s.gstPercentage,
        gstRate: s.gstPercentage, // Add gstRate as well
        lineTax: s.lineTax,
      };
    });

    const allItems = [...prods, ...svcs];
    console.log("Final items to view:", allItems);
    setItemsToView(allItems);
    setIsItemsDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const endpointMap: Record<string, string> = {
        sales: `/api/sales/${transactionToDelete._id}`,
        purchases: `/api/purchase/${transactionToDelete._id}`,
        receipt: `/api/receipts/${transactionToDelete._id}`,
        payment: `/api/payments/${transactionToDelete._id}`,
        journal: `/api/journals/${transactionToDelete._id}`,
        proforma: `/api/proforma/${transactionToDelete._id}`,
      };

      const endpoint = endpointMap[transactionToDelete.type];
      if (!endpoint)
        throw new Error(
          `Invalid transaction type: ${transactionToDelete.type}`
        );

      const res = await fetch(`${baseURL}${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete transaction.");
      }

      toast({
        title: "Transaction Deleted",
        description: "The transaction has been successfully removed.",
      });

      fetchTransactions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setTransactionToDelete(null);
    }
  };


  async function handleSendInvoice(tx: Transaction) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${baseURL}/api/sales/${tx._id}/send-invoice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send invoice");

      toast({
        title: "Invoice sent",
        description:
          typeof tx.party === "object" && tx.party?.email
            ? `Sent to ${tx.party.email}`
            : "Sent to customer’s email.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  }

  // --- Client-side company filters (defensive) ---
  const userCompanyIds = React.useMemo(
    () => companies.map((c) => c._id),
    [companies]
  );

  const filteredSales = React.useMemo(() => {
    const base = selectedCompanyId
      ? sales.filter((s) => getCompanyId(s.company) === selectedCompanyId)
      : sales.filter((s) => userCompanyIds.includes(getCompanyId(s.company)));
    console.log("Filtered sales:", base);
    return base;
  }, [sales, selectedCompanyId, userCompanyIds]);

  const filteredPurchases = React.useMemo(() => {
    const base = selectedCompanyId
      ? purchases.filter((p) => getCompanyId(p.company) === selectedCompanyId)
      : purchases.filter((p) =>
          userCompanyIds.includes(getCompanyId(p.company))
        );
    return base;
  }, [purchases, selectedCompanyId, userCompanyIds]);

  const filteredProforma = React.useMemo(() => {
    const base = selectedCompanyId
      ? proforma.filter((p) => getCompanyId(p.company) === selectedCompanyId)
      : proforma.filter((p) =>
          userCompanyIds.includes(getCompanyId(p.company))
        );
    return base;
  }, [proforma, selectedCompanyId, userCompanyIds]);

  const filteredReceipts = React.useMemo(() => {
    const base = selectedCompanyId
      ? receipts.filter((r) => getCompanyId(r.company) === selectedCompanyId)
      : receipts.filter((r) =>
          userCompanyIds.includes(getCompanyId(r.company))
        );
    return base;
  }, [receipts, selectedCompanyId, userCompanyIds]);

  const filteredPayments = React.useMemo(() => {
    const base = selectedCompanyId
      ? payments.filter((p) => getCompanyId(p.company) === selectedCompanyId)
      : payments.filter((p) =>
          userCompanyIds.includes(getCompanyId(p.company))
        );
    return base;
  }, [payments, selectedCompanyId, userCompanyIds]);

  const filteredJournals = React.useMemo(() => {
    const base = selectedCompanyId
      ? journals.filter((j) => getCompanyId(j.company) === selectedCompanyId)
      : journals.filter((j) =>
          userCompanyIds.includes(getCompanyId(j.company))
        );
    return base;
  }, [journals, selectedCompanyId, userCompanyIds]);

  // Only show lists the user is allowed to see
  const visibleSales = canSales ? filteredSales : [];
  const visiblePurchases = canPurchases ? filteredPurchases : [];
  const visibleProforma = canSales ? filteredProforma : [];
  const visibleReceipts = canReceipt ? filteredReceipts : [];
  const visiblePayments = canPayment ? filteredPayments : [];
  const visibleJournals = canJournal ? filteredJournals : [];

  const allVisibleTransactions = React.useMemo(
    () =>
      [
        ...visibleSales,
        ...visiblePurchases,
        ...visibleProforma,
        ...visibleReceipts,
        ...visiblePayments,
        ...visibleJournals,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [
      visibleSales,
      visiblePurchases,
      visibleProforma,
      visibleReceipts,
      visiblePayments,
      visibleJournals,
    ]
  );

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((company) => {
      map.set(company._id, company.businessName);
    });
    return map;
  }, [companies]);

  const tableColumns = React.useMemo(() => {
    const baseCols = columns({
      onViewItems: (tx) => handleViewItems(tx),
      onPreview: handleOpenPreviewDialog,
      onEdit: (transaction) => {
        if (transaction.type === "proforma") {
          setIsProformaFormOpen(true);
          setTransactionToEdit(transaction);
        } else {
          handleOpenForm(transaction);
        }
      },
      // onDownloadInvoice: handleDownloadInvoice,
      onDelete: handleOpenDeleteDialog,
      companyMap,
      serviceNameById, // Add this line
      onSendInvoice: handleSendInvoice,
      userRole: role || undefined,
      onConvertToSales: (transaction) => {
        // Open the transaction form with prefillFrom set to the proforma transaction
        setTransactionToEdit(null); // Not editing, creating new
        setDefaultTransactionType("sales");
        setIsFormOpen(true);
        // We'll need to pass the prefillFrom to the form somehow
        // For now, we'll store it in state and pass it to the form
        setPrefillFromTransaction(transaction);
      },
    });

    if (companies.length <= 1) {
      return baseCols.filter((col) => col.id !== "company");
    }
    return baseCols;
  }, [companyMap, companies.length, serviceNameById, role]); // Add serviceNameById to dependencies

  const renderContent = (data: Transaction[]) => {
    if (isLoading) {
      // Show a loading state while data is being fetched
      return (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    // Show the table only when the data is fully loaded
    return (
      <DataTable key={refreshTrigger} columns={tableColumns} data={data} />
    );
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "sales":
        return <TrendingUp className="h-4 w-4" />;
      case "purchases":
        return <ShoppingCart className="h-4 w-4" />;
      case "proforma":
        return <FileText className="h-4 w-4" />;
      case "receipts":
        return <Receipt className="h-4 w-4" />;
      case "payments":
        return <CreditCard className="h-4 w-4" />;
      case "journals":
        return <FileText className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };


  // Add this utility function to your existing utils
const calculateGSTBreakdown = (amount: number, gstRate: number, isInterstate: boolean) => {
  if (gstRate === 0) {
    return {
      taxableValue: amount,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      total: amount
    };
  }

  if (isInterstate) {
    const igst = (amount * gstRate) / 100;
    return {
      taxableValue: amount,
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
      total: amount + igst
    };
  } else {
    const cgst = (amount * gstRate) / 200; // Half of GST rate
    const sgst = (amount * gstRate) / 200; // Half of GST rate
    return {
      taxableValue: amount,
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
      total: amount + cgst + sgst
    };
  }
};

  return (
    <div className="space-y-6">
      {isLoading ? (
        // Full-page loader while first fetch is in-flight
        <div className="h-[80vh] w-full flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      ) : companies.length === 0 ? (
        <div className="h-[80vh] w-full flex align-middle items-center justify-center">
          <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Icon Section */}
                <div className="mb-5 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m0 0V9m0 12h2"
                    ></path>
                  </svg>
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Company Setup Required
                </h3>
                <p className="text-gray-600 mb-5">
                  Contact us to enable your company account and access all
                  features.
                </p>

                {/* Call-to-Action Button */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                    +91-8989773689
                  </a>

                  <a
                    href="mailto:support@company.com"
                    className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Email Us
                  </a>
                </div>

                {/* Support Hours */}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Transactions
              </h2>
              <p className="text-muted-foreground">
                A list of all financial activities for the selected company.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canCreateAny && (
                <>
                  <Dialog open={isFormOpen} 
                  // onOpenChange={setIsFormOpen}
                   onOpenChange={(open) => {
    setIsFormOpen(open);
    if (!open) {
      // Reset form state when dialog closes
      setTransactionToEdit(null);
      setPrefillFromTransaction(null);
      setDefaultTransactionType(null);
    }
  }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => handleOpenForm(null)}
                        className="w-full md:w-auto text-xs lg:text-sm"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="  grid-rows-[auto,1fr,auto]  p-0 sm:max-w-6xl max-w-sm">
                      <DialogHeader className="p-6">
                        <DialogTitle>
                          {transactionToEdit
                            ? "Edit Transaction"
                            : "Create a New Transaction"}
                        </DialogTitle>
                        <DialogDescription>
                          {transactionToEdit
                            ? "Update the details of the financial event."
                            : "Fill in the details below to record a new financial event."}
                        </DialogDescription>
                      </DialogHeader>
                      <TransactionForm
                        transactionToEdit={transactionToEdit}
                        onFormSubmit={() => {
                          setIsFormOpen(false);
                          setTransactionToEdit(null);
                          setPrefillFromTransaction(null);
                          fetchTransactions();
                          setRefreshTrigger((prev) => prev + 1);
                        }}
                        defaultType={
                          defaultTransactionType ??
                          tabToFormType(activeTab) ??
                          allowedTypes[0] ??
                          "sales"
                        }
                        transaction={transactionToPreview}
                        company={
                          companies.find(
                            (c) => c._id === transactionToPreview?.company?._id
                          ) || null
                        }
                        party={
                          parties.find(
                            (p) =>
                              p._id ===
                                (transactionToPreview as any)?.party?._id ||
                              transactionToPreview?.party === p._id
                          ) || null
                        }
                        serviceNameById={serviceNameById} // ✅ pass it
                        prefillFrom={prefillFromTransaction}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog
                    open={isProformaFormOpen}
                    onOpenChange={setIsProformaFormOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setIsProformaFormOpen(true)}
                        variant="outline"
                        className="w-full md:w-auto text-xs lg:text-sm"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Proforma Invoice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="grid-rows-[auto,1fr,auto] p-0 sm:max-w-6xl max-w-sm">
                      <DialogHeader className="p-6">
                        <DialogTitle>
                          {transactionToEdit &&
                          transactionToEdit.type === "proforma"
                            ? "Edit Proforma Invoice"
                            : "Create Proforma Invoice"}
                        </DialogTitle>
                        <DialogDescription>
                          {transactionToEdit &&
                          transactionToEdit.type === "proforma"
                            ? "Update the details of the proforma invoice."
                            : "Fill in the details below to create a proforma invoice."}
                        </DialogDescription>
                      </DialogHeader>
                      <ProformaForm
                        transactionToEdit={transactionToEdit}
                        onFormSubmit={() => {
                          setIsProformaFormOpen(false);
                          setTransactionToEdit(null);
                          fetchTransactions();
                          setRefreshTrigger((prev) => prev + 1);
                        }}
                        serviceNameById={serviceNameById}
                      />
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  transaction.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTransaction}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog
            open={isPreviewOpen}
            onOpenChange={(open) => {
              setIsPreviewOpen(open);
              if (!open) setIsEditMode(false);
            }}
          >
            <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>Invoice Preview</DialogTitle>
                <DialogDescription>
                  This is a preview of the invoice. You can change the template
                  and download it as a PDF.
                </DialogDescription>
              </DialogHeader>
              {/* for mobile */}
              {transactionToPreview && (
                <InvoicePreview
                  transaction={transactionToPreview}
                  company={
                    companies.find(
                      (c) => c._id === transactionToPreview.company?._id
                    ) || null
                  }
                  party={
                    parties.find(
                      (p) =>
                        p._id === (transactionToPreview as any)?.party?._id ||
                        transactionToPreview?.party === p._id
                    ) || null
                  }
                  serviceNameById={serviceNameById}
                />
              )}
            </DialogContent>
          </Dialog>

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

              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {/* Summary Section */}
                {itemsToView.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(itemsToView.reduce((sum, item) => sum + Number(item.amount || 0), 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tax Total</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(itemsToView.reduce((sum, item) => {
                            // Use lineTax if available (from database), otherwise calculate
                            const lineTax = (item as any).lineTax;
                            if (lineTax !== undefined && lineTax !== null) {
                              return sum + Number(lineTax);
                            }
                            // Fallback: calculate tax for each item based on GST rate
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
                          {formatCurrency(
                            itemsToView.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
                            itemsToView.reduce((sum, item) => {
                              // Use lineTax if available, otherwise calculate
                              const lineTax = (item as any).lineTax;
                              if (lineTax !== undefined && lineTax !== null) {
                                return sum + Number(lineTax);
                              }
                              // Fallback: calculate tax
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
                        ? formatCurrency(Number(item?.pricePerUnit ?? 0))
                        : "—";
                      console.log("Item in table:", item);
                      console.log("Item GST Percentage:", (item as any).gstPercentage);
                      console.log("Item Line Tax:", (item as any).lineTax);

                      const total = formatCurrency(Number(item?.amount ?? 0));

                      // Get HSN/SAC code based on item type
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

                          {/* HSN/SAC Code Column */}
                          <TableCell className="text-center">
                            {hsnSacCode || "—"}
                          </TableCell>

                          <TableCell className="text-right">{rate}</TableCell>

                          <TableCell className="text-right font-semibold">
                            {total}
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
                      ? formatCurrency(Number(item?.pricePerUnit ?? 0))
                      : "—";
                    const total = formatCurrency(Number(item?.amount ?? 0));
                    const hsnSacCode = isService ? item.sacCode : item.hsnCode;

                    return (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                      >
                        {/* Header Section */}
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

                        {/* Service Description */}
                        {isService && item?.description && (
                          <div className="mb-3 px-1">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {/* Details Grid */}
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
                            <div className="font-medium">{rate}</div>
                          </div>

                          <div className="col-span-2 pt-2 border-t">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-semibold">
                                Total Amount
                              </div>
                              <div className="text-base font-bold text-green-600 dark:text-green-400">
                                {total}
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

          {allowedTypes.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">No transaction access</h3>
                <p className="text-sm text-muted-foreground">
                  You don’t have permission to view transaction entries. Please
                  contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabKey)}
              className="w-full"
            >
              {/* ✅ Desktop Tabs - Improved styling */}
              <div className="hidden sm:block overflow-x-auto pb-2">
                <TabsList className="bg-muted/50 p-1 rounded-lg border border-border">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                  >
                    All
                  </TabsTrigger>
                  {canSales && (
                    <TabsTrigger
                      value="sales"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Sales
                    </TabsTrigger>
                  )}
                  {canPurchases && (
                    <TabsTrigger
                      value="purchases"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Purchases
                    </TabsTrigger>
                  )}

                  {canReceipt && (
                    <TabsTrigger
                      value="receipts"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Receipts
                    </TabsTrigger>
                  )}
                  {canPayment && (
                    <TabsTrigger
                      value="payments"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Payments
                    </TabsTrigger>
                  )}
                  {canJournal && (
                    <TabsTrigger
                      value="journals"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Journals
                    </TabsTrigger>
                  )}
                  {canSales && (
                    <TabsTrigger
                      value="proforma"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Proforma
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* ✅ Mobile Dropdown - Enhanced with icons */}
              <div className="block sm:hidden relative mb-4">
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full px-4 py-3 border border-border rounded-xl bg-background shadow-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <div className="flex items-center">
                    {getTabIcon(activeTab)}
                    <span className="ml-2 text-sm font-medium">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute mt-2 w-full bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in-80 slide-in-from-top-2">
                    <ul className="py-2">
                      <li
                        onClick={() => handleTabChange("all")}
                        className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="flex items-center">
                          <ListCheck className="h-4 w-4 mr-3 opacity-70" />
                          <span className="flex-1">All Transactions</span>
                          {activeTab === "all" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </li>
                      {canSales && (
                        <li
                          onClick={() => handleTabChange("sales")}
                          className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-3 opacity-70" />
                            <span className="flex-1">Sales</span>
                            {activeTab === "sales" && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </li>
                      )}
                      {canPurchases && (
                        <li
                          onClick={() => handleTabChange("purchases")}
                          className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-3 opacity-70" />
                            <span className="flex-1">Purchases</span>
                            {activeTab === "purchases" && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </li>
                      )}
                      {canSales && (
                        <li
                          onClick={() => handleTabChange("proforma")}
                          className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-3 opacity-70" />
                            <span className="flex-1">Proforma</span>
                            {activeTab === "proforma" && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </li>
                      )}
                      {canReceipt && (
                        <li
                          onClick={() => handleTabChange("receipts")}
                          className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <Receipt className="h-4 w-4 mr-3 opacity-70" />
                            <span className="flex-1">Receipts</span>
                            {activeTab === "receipts" && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </li>
                      )}
                      {canPayment && (
                        <li
                          onClick={() => handleTabChange("payments")}
                          className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-3 opacity-70" />
                            <span className="flex-1">Payments</span>
                            {activeTab === "payments" && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </li>
                      )}
                      {canJournal && (
                        <li
                          onClick={() => handleTabChange("journals")}
                          className="cursor-pointer px-4 py-3 text-sm transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-3 opacity-70" />
                            <span className="flex-1">Journals</span>
                            {activeTab === "journals" && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tab Contents */}
              <div className="mt-4 px-2 sm:px-0">
                <TabsContent value="all" className="mt-0">
                  {renderContent(allVisibleTransactions)}
                </TabsContent>

                {canSales && (
                  <TabsContent value="sales" className="mt-0">
                    {renderContent(filteredSales)}
                  </TabsContent>
                )}

                {canPurchases && (
                  <TabsContent value="purchases" className="mt-0">
                    {renderContent(filteredPurchases)}
                  </TabsContent>
                )}

                {canSales && (
                  <TabsContent value="proforma" className="mt-0">
                    {renderContent(filteredProforma)}
                  </TabsContent>
                )}

                {canReceipt && (
                  <TabsContent value="receipts" className="mt-0">
                    {renderContent(filteredReceipts)}
                  </TabsContent>
                )}

                {canPayment && (
                  <TabsContent value="payments" className="mt-0">
                    {renderContent(filteredPayments)}
                  </TabsContent>
                )}

                {canJournal && (
                  <TabsContent value="journals" className="mt-0">
                    {renderContent(filteredJournals)}
                  </TabsContent>
                )}
              </div>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
