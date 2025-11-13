"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompany } from "@/contexts/company-context";
import {
  IndianRupee,
  CreditCard,
  Users,
  Building,
  PlusCircle,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import type { Transaction, Company } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { ProductStock } from "@/components/dashboard/product-stock";
import Link from "next/link";
import UpdateWalkthrough from "@/components/notifications/UpdateWalkthrough";
import { useUserPermissions } from "@/contexts/user-permissions-context";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

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

export default function UserDashboardPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { selectedCompanyId } = useCompany();
  const [companyData, setCompanyData] = React.useState<any>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [recentTransactions, setRecentTransactions] = React.useState<
    Transaction[]
  >([]);
  const [serviceNameById, setServiceNameById] = React.useState<
    Map<string, string>
  >(new Map());
  const [party, setParty] = React.useState<any>(null); // Set party data here
  const [company, setCompany] = React.useState<any>(null); // Set company data here
  const [transaction, setTransaction] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isTransactionFormOpen, setIsTransactionFormOpen] =
    React.useState(false);
  const { toast } = useToast();
  const { permissions: userCaps, isAllowed } = useUserPermissions();

  // read role once (LS is fine for client-only)
  const role = React.useMemo(() => {
    if (typeof window === "undefined") return "user";
    return localStorage.getItem("role") || "user";
  }, []);
  const isAdmin = role === "admin" || role === "master";

  const selectedCompany = React.useMemo(
    () =>
      selectedCompanyId
        ? companies.find((c) => c._id === selectedCompanyId) || null
        : null,
    [companies, selectedCompanyId]
  );

  const fetchCompanyDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const authHeaders = { Authorization: `Bearer ${token}` };

      const queryParam = selectedCompanyId
        ? `?companyId=${selectedCompanyId}`
        : "";

      // Helper: safe JSON fetch that never throws on 401/403, returns {} instead
      const safeGet = async (url: string) => {
        try {
          const r = await fetch(url, { headers: authHeaders });
          if (!r.ok) return {};
          return await r.json();
        } catch {
          return {};
        }
      };

      // Core fetches allowed for user
      const [
        rawSales,
        rawPurchases,
        rawReceipts,
        rawPayments,
        rawJournals,
        companiesData,
        servicesJson,
      ] = await Promise.all([
        safeGet(`${baseURL}/api/sales${queryParam}`),
        safeGet(`${baseURL}/api/purchase${queryParam}`),
        safeGet(`${baseURL}/api/receipts${queryParam}`),
        safeGet(`${baseURL}/api/payments${queryParam}`),
        safeGet(`${baseURL}/api/journals${queryParam}`),
        safeGet(`${baseURL}/api/companies/my`),
        safeGet(`${baseURL}/api/services`),
      ]);

      // Only admins can see the users count; for normal user we skip the call entirely
      let usersCount = 0;
      if (isAdmin) {
        const usersJson = await safeGet(`${baseURL}/api/users`);
        usersCount = Array.isArray(usersJson)
          ? usersJson.length
          : usersJson?.length || 0;
      }

      // Services map (optional)
      const servicesArr = Array.isArray(servicesJson)
        ? servicesJson
        : servicesJson?.services || [];
      const sMap = new Map<string, string>();
      for (const s of servicesArr) {
        if (s?._id)
          sMap.set(String(s._id), s.serviceName || s.name || "Service");
      }
      setServiceNameById(sMap);

      // Companies
      const comps = Array.isArray(companiesData)
        ? companiesData
        : companiesData?.data || [];
      setCompanies(comps);

      // Normalize arrays
      const salesArr = toArray(rawSales);
      const purchasesArr = toArray(rawPurchases);
      const receiptsArr = toArray(rawReceipts);
      const paymentsArr = toArray(rawPayments);
      const journalsArr = toArray(rawJournals);

      // Recent transactions combined
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

      setRecentTransactions(allTransactions.slice(0, 5));

      // KPIs
      const totalSales = salesArr.reduce(
        (acc: number, row: any) => acc + getAmount("sales", row),
        0
      );
      const totalPurchases = purchasesArr.reduce(
        (acc: number, row: any) => acc + getAmount("purchases", row),
        0
      );
      const companiesCount = selectedCompanyId
        ? 1
        : Array.isArray(comps)
        ? comps.length
        : 0;

      setCompanyData({
        totalSales,
        totalPurchases,
        users: usersCount, // 0 for non-admin
        companies: companiesCount,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load dashboard data",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
      setCompanyData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast, baseURL, isAdmin]);

  React.useEffect(() => {
    fetchCompanyDashboard();
  }, [selectedCompanyId, fetchCompanyDashboard]);

  const handleTransactionFormSubmit = () => {
    setIsTransactionFormOpen(false);
    fetchCompanyDashboard();
  };

  // Build KPI tiles dynamically based on role and permissions
  const kpis = [
    {
      key: "sales",
      title: "Total Sales",
      value: formatCurrency(companyData?.totalSales || 0),
      icon: IndianRupee,
      description: selectedCompanyId
        ? "For selected company"
        : "Across all companies",
      show: isAdmin || isAllowed("canCreateSaleEntries"),
    },
    {
      key: "purchases",
      title: "Total Purchases",
      value: formatCurrency(companyData?.totalPurchases || 0),
      icon: CreditCard,
      show: isAdmin || isAllowed("canCreatePurchaseEntries"),
    },
    {
      key: "users",
      title: "Active Users",
      value: (companyData?.users || 0).toString(),
      icon: Users,
      show: isAdmin, // only for admin/master
    },
    {
      key: "companies",
      title: "Companies",
      value: (companyData?.companies || 0).toString(),
      icon: Building,
      show: true,
    },
  ].filter((k) => k.show);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Dashboard</h2>
          <p className="text-muted-foreground">
            {selectedCompany
              ? `An overview of ${selectedCompany.businessName}.`
              : "An overview across your accessible companies."}
          </p>
        </div>

        {companies.length > 0 && (
          <div className="flex items-center gap-2">
            <UpdateWalkthrough />

            <Button variant="outline" asChild>
              <Link href="/profile">
                <Settings className="mr-2 h-4 w-4" /> Go to Settings
              </Link>
            </Button>

            {isAdmin && (
              <Dialog
                open={isTransactionFormOpen}
                onOpenChange={setIsTransactionFormOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
                  <DialogHeader className="p-6">
                    <DialogTitle>Create a New Transaction</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to record a new financial event.
                    </DialogDescription>
                  </DialogHeader>
                  <TransactionForm
                    onFormSubmit={handleTransactionFormSubmit}
                    serviceNameById={serviceNameById}
                    transaction={transaction}
                    party={party}
                    company={company}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <Building className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Company Available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You don’t have access to any company yet. Please contact your admin.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4  sm:grid-cols-4 grid-cols-2">
           {kpis.map((kpi) => (
              <Card key={kpi.title} className="flex flex-col h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <div className="text-xl sm:text-2xl font-bold">
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kpi.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            <ProductStock />
            <RecentTransactions
              transactions={recentTransactions}
              serviceNameById={serviceNameById}
            />
          </div>
        </>
      )}
    </div>
  );
}
