

"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { useCompany } from "@/contexts/company-context";
import { Loader2, PlusCircle, Settings, FileText, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/lib/types";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useSupport } from "@/contexts/support-context";

// Lazy imports with proper code splitting
import { Suspense, lazy } from 'react';
const RecentTransactions = lazy(() => import('@/components/dashboard/recent-transactions'));
const ProductStock = lazy(() => import('@/components/dashboard/product-stock'));
const ProformaForm = lazy(() => import('@/components/transactions/proforma-form'));
const TransactionForm = lazy(() => import('@/components/transactions/transaction-form').then(module => ({ default: module.TransactionForm })));
const AccountValidityNotice = lazy(() => import('@/components/dashboard/account-validity-notice').then(module => ({ default: module.AccountValidityNotice })));
const UpdateWalkthrough = lazy(() => import('@/components/notifications/UpdateWalkthrough'));

// Import new components
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { KpiSkeleton, ProductStockSkeleton, RecentTransactionsSkeleton } from '@/components/dashboard/loading-skeletons';

const CACHE_KEY = "company_dashboard_data";

// Move utility functions outside component
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

const toArray = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.entries)) return data.entries;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getAmount = (
  type: "sales" | "purchases" | "receipt" | "payment" | "journal",
  row: any
) => {
  switch (type) {
    case "sales":
      return num(row?.amount ?? row?.totalAmount);
    case "purchases":
      return num(row?.totalAmount ?? row?.amount);
    case "receipt":
    case "payment":
      return num(row?.amount ?? row?.totalAmount);
    case "journal":
      return 0;
    default:
      return 0;
  }
};

interface DashboardData {
  totalSales: number;
  totalPurchases: number;
  users: number;
  companies: number;
  recentTransactions: any[];
  serviceNameById: Map<string, string>;
}

export default function DashboardPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toggleSupport } = useSupport();
  const { selectedCompanyId } = useCompany();
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const [isTransactionFormOpen, setIsTransactionFormOpen] = React.useState(false);
  const [isProformaFormOpen, setIsProformaFormOpen] = React.useState(false);

  const selectedCompany = React.useMemo(
    () => selectedCompanyId ? companies.find((c) => c._id === selectedCompanyId) || null : null,
    [companies, selectedCompanyId]
  );

  // Optimized data fetching with request batching
  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // Check cache first for immediate response
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setDashboardData(parsed);
      }

      const queryParam = selectedCompanyId ? `?companyId=${selectedCompanyId}` : "";

      // Batch critical API calls first
      const [salesRes, purchasesRes, companiesRes] = await Promise.all([
        fetch(`${baseURL}/api/sales${queryParam}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${baseURL}/api/purchase${queryParam}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${baseURL}/api/companies/my`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);

      const [rawSales, rawPurchases, companiesData] = await Promise.all([
        salesRes.json(),
        purchasesRes.json(),
        companiesRes.json(),
      ]);

      // Process critical data first
      const salesArr = toArray(rawSales);
      const purchasesArr = toArray(rawPurchases);
      
      const totalSales = salesArr.reduce((acc: number, row: any) => acc + getAmount("sales", row), 0);
      const totalPurchases = purchasesArr.reduce((acc: number, row: any) => acc + getAmount("purchases", row), 0);
      const companiesCount = companiesData?.length || 0;

      const initialData = {
        totalSales,
        totalPurchases,
        users: 0, // Will be updated in secondary load
        companies: companiesCount,
        recentTransactions: [],
        serviceNameById: new Map(),
      };

      setDashboardData(initialData);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setIsLoading(false);

      // Secondary non-critical data loading
      fetchSecondaryData(token, queryParam, initialData);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load dashboard data",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast, baseURL]);

  const fetchSecondaryData = async (token: string, queryParam: string, initialData: DashboardData) => {
    try {
      const [salesRes, purchasesRes, receiptsRes, paymentsRes, journalsRes, usersRes, servicesRes] = await Promise.all([
        fetch(`${baseURL}/api/sales${queryParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/api/purchase${queryParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/api/receipts${queryParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/api/payments${queryParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/api/journals${queryParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseURL}/api/services`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [rawSales, rawPurchases, rawReceipts, rawPayments, rawJournals, usersData, servicesJson] = await Promise.all([
        salesRes.json(),
        purchasesRes.json(),
        receiptsRes.json(),
        paymentsRes.json(),
        journalsRes.json(),
        usersRes.json(),
        servicesRes.json(),
      ]);

      // Process secondary data
      const salesArr = toArray(rawSales);
      const purchasesArr = toArray(rawPurchases);
      const receiptsArr = toArray(rawReceipts);
      const paymentsArr = toArray(rawPayments);
      const journalsArr = toArray(rawJournals);

      const allTransactions = [
        ...salesArr.map((s: any) => ({ ...s, type: "sales" })),
        ...purchasesArr.map((p: any) => ({ ...p, type: "purchases" })),
        ...receiptsArr.map((r: any) => ({ ...r, type: "receipt" })),
        ...paymentsArr.map((p: any) => ({ ...p, type: "payment" })),
        ...journalsArr.map((j: any) => ({
          ...j,
          description: j?.narration ?? j?.description ?? "",
          type: "journal",
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const servicesArr = Array.isArray(servicesJson) ? servicesJson : servicesJson.services || [];
      const sMap = new Map<string, string>();
      for (const s of servicesArr) {
        if (s?._id) sMap.set(String(s._id), s.serviceName || s.name || "Service");
      }

      const updatedData = {
        ...initialData,
        users: usersData?.length || 0,
        recentTransactions: allTransactions.slice(0, 4),
        serviceNameById: sMap,
      };

      setDashboardData(updatedData);
      
      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData));
      
    } catch (error) {
      console.error("Failed to load secondary data:", error);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTransactionFormSubmit = () => {
    setIsTransactionFormOpen(false);
    fetchDashboardData();
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col sm:flex-row items-center sm:justify-between">
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {selectedCompany
              ? `An overview of ${selectedCompany.businessName}.`
              : "An overview across all companies."}
          </p>
        </div>
        
        {companies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-center sm:justify-end" style={{width: '-webkit-fill-available'}}>
            <Suspense fallback={<Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>}>
              <UpdateWalkthrough />
            </Suspense>

            <Button variant="outline" asChild size="sm" className="flex-1 sm:flex-initial">
              <Link href="/profile">
                <Settings className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Go to Settings</span>
                <span className="sm:hidden">Settings</span>
              </Link>
            </Button>

            <div className="flex gap-2">
              <Dialog open={isProformaFormOpen} onOpenChange={setIsProformaFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsProformaFormOpen(true)} variant="outline" className="flex-1 sm:flex-initial">
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="inline text-xs md:text-sm">Proforma Invoice</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="grid-rows-[auto,1fr,auto] p-0 sm:max-w-6xl max-w-sm">
                  <DialogHeader className="p-4 sm:p-6">
                    <DialogTitle className="text-lg sm:text-xl">Create Proforma Invoice</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                      Fill in the details below to create a new proforma invoice.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto">
                    <Suspense fallback={<div className="p-8 text-center">Loading form...</div>}>
                      <ProformaForm
                        onFormSubmit={() => {
                          setIsProformaFormOpen(false);
                          fetchDashboardData();
                        }}
                        serviceNameById={dashboardData?.serviceNameById || new Map()}
                      />
                    </Suspense>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 sm:flex-initial">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="inline text-xs md:text-sm">New Transaction</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="grid-rows-[auto,1fr,auto] p-0 sm:max-w-6xl max-w-sm">
                  <DialogHeader className="p-4 sm:p-6">
                    <DialogTitle className="text-lg sm:text-xl">Create a New Transaction</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                      Fill in the details below to record a new financial event.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto">
                    <TransactionForm
                      onFormSubmit={handleTransactionFormSubmit}
                      serviceNameById={dashboardData?.serviceNameById || new Map()} transaction={undefined} party={undefined} company={undefined}                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>

      {/* Account Validity Notice */}
      <Suspense fallback={<div className="p-4 border rounded-lg bg-muted/50 animate-pulse h-20"></div>}>
        <AccountValidityNotice onContactSupport={toggleSupport} />
      </Suspense>

      {isLoading ? (
        <KpiSkeleton />
      ) : companies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Company Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a company from the header to view its dashboard.
          </p>
        </Card>
      ) : (
        <>
          <KpiCards data={dashboardData!} selectedCompanyId={selectedCompanyId} />
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            <Suspense fallback={<ProductStockSkeleton />}>
              <ProductStock />
            </Suspense>
            
            <Suspense fallback={<RecentTransactionsSkeleton />}>
              <RecentTransactions
                transactions={dashboardData?.recentTransactions || []}
                serviceNameById={dashboardData?.serviceNameById || new Map()}
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}








// "use client";

// import * as React from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { useCompany } from "@/contexts/company-context";
// import {
//   IndianRupee,
//   CreditCard,
//   Users,
//   Building,
//   Loader2,
//   PlusCircle,
//   Settings,
//   Package,
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import RecentTransactions from "@/components/dashboard/recent-transactions";
// import type { Transaction, Product, Company } from "@/lib/types";
// import { useUserPermissions } from "@/contexts/user-permissions-context";
// import { Button } from "@/components/ui/button";
// import { FileText } from "lucide-react";
// import ProformaForm from "@/components/transactions/proforma-form";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { TransactionForm } from "@/components/transactions/transaction-form";
// import ProductStock from "@/components/dashboard/product-stock";
// import { AccountValidityNotice } from "@/components/dashboard/account-validity-notice";
// import Link from "next/link";
// import UpdateWalkthrough from "@/components/notifications/UpdateWalkthrough";
// import { useSupport } from "@/contexts/support-context";


// // ADD THESE INSTEAD:
// // import { Suspense } from 'react';
// // import { 
// //   RecentTransactions, 
// //   ProductStock, 
// //   ProformaForm, 
// //   TransactionForm, 
// //   AccountValidityNotice, 
// //   UpdateWalkthrough 
// // } from '@/components/dashboard/lazy-components';

// const CACHE_KEY = "company_dashboard_data"; // Key to store the cache

// const formatCurrency = (amount: number) =>
//   new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
//     amount
//   );



// const toArray = (data: any) => {
//   if (Array.isArray(data)) return data;
//   if (Array.isArray(data?.entries)) return data.entries;
//   if (Array.isArray(data?.data)) return data.data;
//   return [];
// };

// const num = (v: any) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// };

// // type-aware amount extractor
// const getAmount = (
//   type: "sales" | "purchases" | "receipt" | "payment" | "journal",
//   row: any
// ) => {
//   switch (type) {
//     case "sales":
//       // your sales rows usually have amount or totalAmount
//       return num(row?.amount ?? row?.totalAmount);
//     case "purchases":
//       // purchases sample shows totalAmount
//       return num(row?.totalAmount ?? row?.amount);
//     case "receipt":
//     case "payment":
//       return num(row?.amount ?? row?.totalAmount);
//     case "journal":
//       // journals typically don't contribute to sales/purchases KPIs
//       return 0;
//     default:
//       return 0;
//   }
// };

// interface AccountValidity {
//   _id: string;
//   client: string;
//   startAt: string;
//   expiresAt: string;
//   status: "active" | "expired" | "suspended" | "unlimited" | "disabled";
//   notes?: string;
//   createdAt: string;
//   updatedAt: string;
// }


// export default function DashboardPage() {
//   const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
//    const { toggleSupport } = useSupport();
//   const { selectedCompanyId } = useCompany();
//   const [companyData, setCompanyData] = React.useState<any>(null);
//   const [companies, setCompanies] = React.useState<Company[]>([]);
//   const [party, setParty] = React.useState<any>(null); // Set party data here
//   const [company, setCompany] = React.useState<any>(null); // Set company data here
//   const [transaction, setTransaction] = React.useState<any>(null);
//   const [isProformaFormOpen, setIsProformaFormOpen] = React.useState(false);
//   const { permissions: userCaps } = useUserPermissions();
//   const selectedCompany = React.useMemo(
//     () =>
//       selectedCompanyId
//         ? companies.find((c) => c._id === selectedCompanyId) || null
//         : null,
//     [companies, selectedCompanyId]
//   );

//   const [recentTransactions, setRecentTransactions] = React.useState<
//     Transaction[]
//   >([]);
//   const [serviceNameById, setServiceNameById] = React.useState<
//     Map<string, string>
//   >(new Map());
//   const [isLoading, setIsLoading] = React.useState(true);
//   const { toast } = useToast();
//   const [isTransactionFormOpen, setIsTransactionFormOpen] =
//     React.useState(false);

//      // Add state for account validity
//   const [accountValidity, setAccountValidity] = React.useState<AccountValidity | null>(null);
//   const [daysRemaining, setDaysRemaining] = React.useState<number | null>(null);
  

//   // Function to calculate days remaining
//   const calculateDaysRemaining = (expiresAt: string): number => {
//     const expiryDate = new Date(expiresAt);
//     const today = new Date();
//     const diffTime = expiryDate.getTime() - today.getTime();
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   };

  

// // Function to get user data from localStorage
// const getUserFromStorage = () => {
//   try {
//     const userData = localStorage.getItem("user"); // Changed from "client" to "user"
//     if (userData) {
//       return JSON.parse(userData);
//     }
//     return null;
//   } catch (error) {
//     console.error("Error parsing user data from localStorage:", error);
//     return null;
//   }
// };

// // Updated fetchAccountValidity function with correct endpoint
// // Updated fetchAccountValidity function with client-friendly endpoint
// const fetchAccountValidity = async () => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       console.log("No token found");
//       return;
//     }

//     // Use the client-friendly endpoint
//     const endpoint = `${baseURL}/api/account/me/validity`;
//     console.log("Fetching validity from:", endpoint);

//     const response = await fetch(endpoint, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     console.log("Validity API response status:", response.status);

//     if (response.ok) {
//       const data = await response.json();
//       console.log("Validity API response data:", data);
      
//       if (data.ok && data.validity) {
//         setAccountValidity(data.validity);
//         const remaining = calculateDaysRemaining(data.validity.expiresAt);
//         setDaysRemaining(remaining);
//         console.log("SUCCESS: Validity loaded!");
//         console.log("Days remaining:", remaining);
//         console.log("Expires at:", data.validity.expiresAt);
//         console.log("Status:", data.validity.status);
//       } else {
//         console.log("No validity data in response");
//       }
//     } else {
//       console.log("Validity API error:", response.status, response.statusText);
//       try {
//         const errorData = await response.json();
//         console.log("Error details:", errorData);
        
//         // If 404, it means no validity record exists for this user
//         if (response.status === 404) {
//           console.log("No validity record found for this user");
//         }
//       } catch (e) {
//         console.log("No error details available");
//       }
//     }
//   } catch (error) {
//     console.error("Failed to fetch account validity:", error);
//   }
// };



//   const fetchCompanyDashboard = React.useCallback(async () => {
//     setIsLoading(true);

//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const buildRequest = (url: string) =>
//         fetch(url, { headers: { Authorization: `Bearer ${token}` } });

//       // when "All" is selected, omit companyId
//       const queryParam = selectedCompanyId
//         ? `?companyId=${selectedCompanyId}`
//         : "";

//       const [
//         salesRes,
//         purchasesRes,
//         receiptsRes,
//         paymentsRes,
//         journalsRes,
//         usersRes,
//         companiesRes,
//         servicesRes,
//       ] = await Promise.all([
//         buildRequest(`${baseURL}/api/sales${queryParam}`),
//         buildRequest(`${baseURL}/api/purchase${queryParam}`),
//         buildRequest(`${baseURL}/api/receipts${queryParam}`),
//         buildRequest(`${baseURL}/api/payments${queryParam}`),
//         buildRequest(`${baseURL}/api/journals${queryParam}`),
//         buildRequest(`${baseURL}/api/users`),
//         buildRequest(`${baseURL}/api/companies/my`),
//         buildRequest(`${baseURL}/api/services`),
//       ]);

//       const rawSales = await salesRes.json();
//       const rawPurchases = await purchasesRes.json();
//       const rawReceipts = await receiptsRes.json();
//       const rawPayments = await paymentsRes.json();
//       const rawJournals = await journalsRes.json();
//       const usersData = await usersRes.json();
//       const companiesData = await companiesRes.json();

//       const servicesJson = await servicesRes.json();

//       const servicesArr = Array.isArray(servicesJson)
//         ? servicesJson
//         : servicesJson.services || [];
//       const sMap = new Map<string, string>();
//       for (const s of servicesArr) {
//         if (s?._id)
//           sMap.set(String(s._id), s.serviceName || s.name || "Service");
//       }
//       setServiceNameById(sMap);

//       setCompanies(Array.isArray(companiesData) ? companiesData : []);

//       // normalize to arrays regardless of shape
//       const salesArr = toArray(rawSales);
//       const purchasesArr = toArray(rawPurchases);
//       const receiptsArr = toArray(rawReceipts);
//       const paymentsArr = toArray(rawPayments);
//       const journalsArr = toArray(rawJournals);

//       // recent transactions (combined)
//       const allTransactions = [
//         ...salesArr.map((s: any) => ({ ...s, type: "sales" })),
//         ...purchasesArr.map((p: any) => ({ ...p, type: "purchases" })),
//         ...receiptsArr.map((r: any) => ({ ...r, type: "receipt" })),
//         ...paymentsArr.map((p: any) => ({ ...p, type: "payment" })),
//         ...journalsArr.map((j: any) => ({
//           ...j,
//           description: j?.narration ?? j?.description ?? "",
//           type: "journal",
//         })),
//       ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

//       setRecentTransactions(allTransactions.slice(0, 5));

//       // KPI totals from normalized arrays
//       const totalSales = salesArr.reduce(
//         (acc: number, row: any) => acc + getAmount("sales", row),
//         0
//       );
//       const totalPurchases = purchasesArr.reduce(
//         (acc: number, row: any) => acc + getAmount("purchases", row),
//         0
//       );

//       // const companiesCount = selectedCompanyId ? 1 : companiesData?.length || 0;

//       const companiesCount = companiesData?.length || 0;

//       setCompanyData({
//         totalSales,
//         totalPurchases,
//         users: usersData?.length || 0,
//         companies: companiesCount,
//       });

//       // Store data in cache with timestamp
//       localStorage.setItem(
//         CACHE_KEY,
//         JSON.stringify({
//           totalSales,
//           totalPurchases,
//           users: usersData?.length || 0,
//           companies: companiesCount,
//         })
//       );
//        await fetchAccountValidity();
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Failed to load dashboard data",
//         description:
//           error instanceof Error ? error.message : "Something went wrong.",
//       });
//       setCompanyData(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [selectedCompanyId, toast, baseURL]);

// //  const fetchCompanyDashboard = React.useCallback(async () => {
// //   setIsLoading(true);

// //   try {
// //     const token = localStorage.getItem("token");
// //     if (!token) throw new Error("Authentication token not found.");

// //     const buildRequest = (url: string) =>
// //       fetch(url, { headers: { Authorization: `Bearer ${token}` } });

// //     // when "All" is selected, omit companyId
// //     const queryParam = selectedCompanyId
// //       ? `?companyId=${selectedCompanyId}`
// //       : "";

// //     const [
// //       salesRes,
// //       purchasesRes,
// //       receiptsRes,
// //       paymentsRes,
// //       journalsRes,
// //       usersRes,
// //       companiesRes,
// //       servicesRes,
// //     ] = await Promise.all([
// //       buildRequest(`${baseURL}/api/sales${queryParam}`),
// //       buildRequest(`${baseURL}/api/purchase${queryParam}`),
// //       buildRequest(`${baseURL}/api/receipts${queryParam}`),
// //       buildRequest(`${baseURL}/api/payments${queryParam}`),
// //       buildRequest(`${baseURL}/api/journals${queryParam}`),
// //       buildRequest(`${baseURL}/api/users`),
// //       buildRequest(`${baseURL}/api/companies/my`),
// //       buildRequest(`${baseURL}/api/services`),
// //     ]);

// //     const rawSales = await salesRes.json();
// //     const rawPurchases = await purchasesRes.json();
// //     const rawReceipts = await receiptsRes.json();
// //     const rawPayments = await paymentsRes.json();
// //     const rawJournals = await journalsRes.json();
// //     const usersData = await usersRes.json();
// //     const companiesData = await companiesRes.json();

// //     const servicesJson = await servicesRes.json();

// //     const servicesArr = Array.isArray(servicesJson)
// //       ? servicesJson
// //       : servicesJson.services || [];
// //     const sMap = new Map<string, string>();
// //     for (const s of servicesArr) {
// //       if (s?._id)
// //         sMap.set(String(s._id), s.serviceName || s.name || "Service");
// //     }
// //     setServiceNameById(sMap);

// //     setCompanies(Array.isArray(companiesData) ? companiesData : []);

// //     // normalize to arrays regardless of shape
// //     const salesArr = toArray(rawSales);
// //     const purchasesArr = toArray(rawPurchases);
// //     const receiptsArr = toArray(rawReceipts);
// //     const paymentsArr = toArray(rawPayments);
// //     const journalsArr = toArray(rawJournals);

// //     // recent transactions (combined)
// //     const allTransactions = [
// //       ...salesArr.map((s: any) => ({ ...s, type: "sales" })),
// //       ...purchasesArr.map((p: any) => ({ ...p, type: "purchases" })),
// //       ...receiptsArr.map((r: any) => ({ ...r, type: "receipt" })),
// //       ...paymentsArr.map((p: any) => ({ ...p, type: "payment" })),
// //       ...journalsArr.map((j: any) => ({
// //         ...j,
// //         description: j?.narration ?? j?.description ?? "",
// //         type: "journal",
// //       })),
// //     ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// //     setRecentTransactions(allTransactions.slice(0, 5));

// //     // KPI totals from normalized arrays
// //     const totalSales = salesArr.reduce(
// //       (acc: number, row: any) => acc + getAmount("sales", row),
// //       0
// //     );
// //     const totalPurchases = purchasesArr.reduce(
// //       (acc: number, row: any) => acc + getAmount("purchases", row),
// //       0
// //     );

// //     const companiesCount = companiesData?.length || 0;

// //     setCompanyData({
// //       totalSales,
// //       totalPurchases,
// //       users: usersData?.length || 0,
// //       companies: companiesCount,
// //     });

// //     // Store data in cache with timestamp
// //     localStorage.setItem(
// //       CACHE_KEY,
// //       JSON.stringify({
// //         totalSales,
// //         totalPurchases,
// //         users: usersData?.length || 0,
// //         companies: companiesCount,
// //       })
// //     );
    
// //   } catch (error) {
// //     toast({
// //       variant: "destructive",
// //       title: "Failed to load dashboard data",
// //       description:
// //         error instanceof Error ? error.message : "Something went wrong.",
// //     });
// //     setCompanyData(null);
// //   } finally {
// //     setIsLoading(false);
// //   }
// // }, [selectedCompanyId, toast, baseURL]);

//   React.useEffect(() => {
//     fetchCompanyDashboard();
//   }, [selectedCompanyId, fetchCompanyDashboard]);

//   // Fetch account validity when component mounts
// React.useEffect(() => {
//   const user = getUserFromStorage();
//   if (user?._id) {
//     console.log("User found, fetching validity for:", user.name);
//     fetchAccountValidity();
//   } else {
//     console.log("No user data found in localStorage");
//   }
// }, []);

//   React.useEffect(() => {
//   const storedCompany = localStorage.getItem("selectedCompanyId");
//   console.log("Stored company in localStorage:", storedCompany);
// }, []);



//   const handleTransactionFormSubmit = () => {
//     setIsTransactionFormOpen(false);
//     fetchCompanyDashboard();
//   };

//   // const kpiData = [
//   //   {
//   //     title: "Total Sales",
//   //     value: formatCurrency(companyData?.totalSales || 0),
//   //     icon: IndianRupee,
//   //     description: selectedCompanyId
//   //       ? "For selected company"
//   //       : "Across all companies",
//   //   },
//   //   {
//   //     title: "Total Purchases",
//   //     value: formatCurrency(companyData?.totalPurchases || 0),
//   //     icon: CreditCard,
//   //   },
//   //   {
//   //     title: "Active Users",
//   //     value: (companyData?.users || 0).toString(),
//   //     icon: Users,
//   //   },
//   //   {
//   //     title: "Companies",
//   //     value: (companyData?.companies || 0).toString(),
//   //     icon: Building,
//   //   },
//   // ];

//   // Replace the entire kpiData array with this memoized version
// const kpiData = React.useMemo(() => [
//   {
//     title: "Total Sales",
//     value: formatCurrency(companyData?.totalSales || 0),
//     icon: IndianRupee,
//     description: selectedCompanyId
//       ? "For selected company"
//       : "Across all companies",
//   },
//   {
//     title: "Total Purchases",
//     value: formatCurrency(companyData?.totalPurchases || 0),
//     icon: CreditCard,
//   },
//   {
//     title: "Active Users",
//     value: (companyData?.users || 0).toString(),
//     icon: Users,
//   },
//   {
//     title: "Companies",
//     value: (companyData?.companies || 0).toString(),
//     icon: Building,
//   },
// ], [companyData?.totalSales, companyData?.totalPurchases, companyData?.users, companyData?.companies, selectedCompanyId]);

//   return (
//     <div className="space-y-6 p-2">
//       <div className="flex flex-col sm:flex-row items-center sm:justify-between">
//         <div className="w-full sm:w-auto">
//           <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
//           <p className="text-muted-foreground text-sm sm:text-base">
//             {selectedCompany
//               ? `An overview of ${selectedCompany.businessName}.`
//               : "An overview across all companies."}
//           </p>
//         </div>
//         {companies.length > 0 && (
//           <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-center sm:justify-end w-max" style={{width: '-webkit-fill-available'}}>
//             {/* <Suspense fallback={null}> */}
//   <UpdateWalkthrough />


//          {/* <div className="md:flex gap-4"> */}
//              <Button
//               variant="outline"
//               asChild
//               size="sm"
//               className="flex-1 sm:flex-initial"
//             >
//               <Link href="/profile">
//                 <Settings className="mr-2 h-4 w-4" />
//                 <span className="hidden sm:inline">Go to Settings</span>
//                 <span className="sm:hidden">Settings</span>
//               </Link>
//             </Button>
//             {/* Proforma Invoice Button (LEFT of Settings) */}
//             <div className="flex gap-2">
//               <Dialog
//                 open={isProformaFormOpen}
//                 onOpenChange={setIsProformaFormOpen}
//               >
//                 <DialogTrigger asChild>
//                   <Button
//                     onClick={() => setIsProformaFormOpen(true)}
//                     variant="outline"
//                     className="flex-1 sm:flex-initial"
//                   >
//                     <FileText className="mr-2 h-4 w-4" />
//                     <span className="inline text-xs md:text-sm">Proforma Invoice</span>
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent className="grid-rows-[auto,1fr,auto] p-0 sm:max-w-6xl max-w-sm">
//                   <DialogHeader className="p-4 sm:p-6">
//                     <DialogTitle className="text-lg sm:text-xl">
//                       Create Proforma Invoice
//                     </DialogTitle>
//                     <DialogDescription className="text-sm sm:text-base">
//                       Fill in the details below to create a new proforma
//                       invoice.
//                     </DialogDescription>
//                   </DialogHeader>
//                   <div className="overflow-y-auto">
//                      {/* <Suspense fallback={<div className="p-8 text-center">Loading form...</div>}> */}
//                     <ProformaForm
//                       onFormSubmit={() => {
//                         setIsProformaFormOpen(false);
//                         fetchCompanyDashboard(); // refresh data after invoice
//                       }}
//                       serviceNameById={serviceNameById}
//                     />
//                     {/* </Suspense> */}
//                   </div>
//                 </DialogContent>
//               </Dialog>
//               <Dialog
//                 open={isTransactionFormOpen}
//                 onOpenChange={setIsTransactionFormOpen}
//               >
//                 <DialogTrigger asChild>
//                   <Button size="sm" className="flex-1 sm:flex-initial">
//                     <PlusCircle className="mr-2 h-4 w-4" />
//                     <span className="inline text-xs md:text-sm">New Transaction</span>
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent className="  grid-rows-[auto,1fr,auto]  p-0 sm:max-w-6xl max-w-sm">
//                   <DialogHeader className="p-4 sm:p-6">
//                     <DialogTitle className="text-lg sm:text-xl">
//                       Create a New Transaction
//                     </DialogTitle>
//                     <DialogDescription className="text-sm sm:text-base">
//                       Fill in the details below to record a new financial event.
//                     </DialogDescription>
//                   </DialogHeader>
//                   <div className=" overflow-y-auto">
//                     <TransactionForm
//                       onFormSubmit={handleTransactionFormSubmit}
//                       serviceNameById={serviceNameById}
//                       transaction={transaction}
//                       party={party}
//                       company={company}
//                     />
//                   </div>
//                 </DialogContent>
//               </Dialog>
//             </div>
//          </div>
//           // </div>
//         )}
//       </div>

//        {/* Account Validity Notice */}
//        {/* <Suspense fallback={<div className="p-4 border rounded-lg bg-muted/50 animate-pulse h-20"></div>}> */}
//       {accountValidity && daysRemaining !== null && (
//         <AccountValidityNotice
//           expiresAt={accountValidity.expiresAt}
//           status={accountValidity.status}
//           daysRemaining={daysRemaining}
//           onContactSupport={toggleSupport} 
//         />
//       )}
//       {/* </Suspense> */}
      


//       {isLoading ? (
//         <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
//           {Array.from({ length: 4 }).map((_, index) => (
//             <Card key={index}>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
//                 <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
//               </CardHeader>
//               <CardContent>
//                 <div className="h-8 bg-muted rounded w-1/2 mb-2 animate-pulse" />
//                 <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : companies.length === 0 ? (
//         <Card className="flex flex-col items-center justify-center p-12 border-dashed">
//           <Building className="h-12 w-12 text-muted-foreground" />
//           <h3 className="mt-4 text-lg font-semibold">No Company Selected</h3>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Please select a company from the header to view its dashboard.
//           </p>
//         </Card>
//       ) : (
//         <>
//           <div className="grid gap-4  xl:grid-cols-4 grid-cols-2">
//             {kpiData.map((kpi) => (
//               <Card key={kpi.title} className="flex flex-col h-full">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
//                   <CardTitle className="text-xs sm:text-sm font-medium">
//                     {kpi.title}
//                   </CardTitle>
//                   <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
//                 </CardHeader>
//                 <CardContent className="p-4 pt-0 flex-grow">
//                   <div className="text-[16px] sm:text-2xl font-bold">
//                     {kpi.value}
//                   </div>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     {kpi.description}
//                   </p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
//             {/* <Suspense fallback={<div className="p-6 border rounded-lg bg-muted/50 animate-pulse h-40"></div>}> */}
//             <ProductStock />
//             <RecentTransactions
//               transactions={recentTransactions}
//               serviceNameById={serviceNameById}
//             />
//             {/* </Suspense> */}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

