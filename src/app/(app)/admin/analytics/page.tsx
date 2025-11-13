"use client";

import * as React from "react";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building,
  UserPlus,
  Settings,
  List,
  FileBarChart2,
  FileText,
  LayoutGrid,
  ArrowRightLeft,
  ChevronDown,
  BarChart,
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import type { Client, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { DashboardTab } from "@/components/analytics/dashboard-tab";
import { TransactionsTab } from "@/components/analytics/transactions-tab";
import { CompaniesTab } from "@/components/analytics/companies-tab";
import { UsersTab } from "@/components/analytics/users-tab";
import ProfitAndLossTab from "@/components/analytics/profit-and-loss";
import BalanceSheetTab from "@/components/analytics/balance-sheet";
import { useSearchParams, useRouter } from "next/navigation";

function AnalyticsDashboardPageContent() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [clients, setClients] = React.useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [isClientsLoading, setIsClientsLoading] = React.useState(true);
  const [tabValue, setTabValue] = React.useState("dashboard");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");
  const [isCompaniesLoading, setIsCompaniesLoading] = React.useState(false);

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedClient = React.useMemo(() => {
    return clients.find((c) => c._id === selectedClientId);
  }, [clients, selectedClientId]);

  React.useEffect(() => {
    const clientIdFromUrl = searchParams.get("clientId");
    if (clientIdFromUrl) {
      setSelectedClientId(clientIdFromUrl);
    }
    const companyIdFromUrl = searchParams.get("companyId");
    // We use `null` to signify the "All Companies" state.
    // An empty string in the URL means "All Companies".
    setSelectedCompanyId(companyIdFromUrl || "");
  }, [searchParams]);

  React.useEffect(() => {
    async function fetchClients() {
      setIsClientsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch(`${baseURL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        setClients(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load clients",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsClientsLoading(false);
      }
    }
    fetchClients();
  }, [toast]);

  React.useEffect(() => {
    async function fetchCompanies() {
      if (!selectedClientId) {
        setCompanies([]);
        setSelectedCompanyId("");
        return;
      }
      setIsCompaniesLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch(
          `${baseURL}/api/companies/by-client/${selectedClientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok)
          throw new Error("Failed to fetch companies for the selected client.");
        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load companies",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsCompaniesLoading(false);
      }
    }
    fetchCompanies();
  }, [selectedClientId, toast]);

  const clientOptions = clients.map((client) => ({
    value: client._id,
    label: client.contactName,
  }));

  const companyOptions = [
    { value: "", label: "All Companies" },
    ...companies.map((company) => ({
      value: company._id,
      label: company.businessName,
    })),
  ];

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedCompanyId(""); // Reset company to "All" when client changes
    const newParams = new URLSearchParams();
    newParams.set("clientId", clientId);
    router.push(`/admin/analytics?${newParams.toString()}`, { scroll: false });
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const newParams = new URLSearchParams(searchParams.toString());
    if (companyId) {
      newParams.set("companyId", companyId);
    } else {
      newParams.delete("companyId");
    }
    router.push(`/admin/analytics?${newParams.toString()}`, { scroll: false });
  };

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((company) => {
      map.set(company._id, company.businessName);
    });
    return map;
  }, [companies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Client Analytics
          </h2>
          <p className="text-muted-foreground">
            Select a client and company to view their detailed dashboard.
          </p>
        </div>
        <div className="flex md:flex-row flex-col items-center text-start gap-4">
          {isClientsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading clients...</span>
            </div>
          ) : (
            <Combobox
              options={clientOptions}
              value={selectedClientId}
              onChange={handleClientChange}
              placeholder="Select a client..."
              searchPlaceholder="Search clients..."
              noResultsText="No clients found."
              className="w-[40vh] md:w-auto"
            />
          )}
          {selectedClientId &&
            (isCompaniesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading companies...</span>
              </div>
            ) : (
              companies.length > 0 && (
                <Combobox
                  options={companyOptions}
                  value={selectedCompanyId}
                  onChange={handleCompanyChange}
                  placeholder="Select a company..."
                  searchPlaceholder="Search companies..."
                  noResultsText="No companies found."
                  className="w-[40vh] md:w-auto"
                />
              )
            ))}
        </div>
      </div>

      {!selectedClient && !isClientsLoading && (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Client Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a client from the dropdown to view their data.
          </p>
        </Card>
      )}

      {selectedClient && (
        <Tabs value={tabValue} onValueChange={setTabValue}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
            {/* Tabs - scrollable on mobile */}
            <div className="overflow-x-auto pb-2 sm:block">
              <TabsList className="hidden sm:flex w-max space-x-1 flex-wrap sm:flex-nowrap">
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center px-3 py-1.5 text-sm"
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  <span className="xs:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="flex items-center px-3 py-1.5 text-sm"
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  <span className="xs:inline">Transactions</span>
                </TabsTrigger>
                <TabsTrigger
                  value="companies"
                  className="flex items-center px-3 py-1.5 text-sm"
                >
                  <Building className="mr-2 h-4 w-4" />
                  <span className="xs:inline">Companies</span>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="flex items-center px-3 py-1.5 text-sm"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="xs:inline">Users</span>
                </TabsTrigger>

                {/* Reports dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-normal text-muted-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                    >
                      <FileBarChart2 className="h-4 w-4" />
                      <span className="xs:inline">Reports</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <TabsTrigger
                        value="profitandloss"
                        className="flex items-center px-3 py-1.5 text-sm"
                      >
                        <span className="xs:inline">Profit & Loss</span>
                      </TabsTrigger>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <TabsTrigger
                        value="balancesheet"
                        className="flex items-center px-3 py-1.5 text-sm"
                      >
                        <span className="xs:inline">Balance Sheet</span>
                      </TabsTrigger>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TabsList>
              {/* Mobile Tabs Dropdown */}
              <div className="flex sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 w-full justify-between"
                    >
                      <List className="mr-2 h-4 w-4" />
                      <span>
                        {tabValue === "dashboard" && "Dashboard"}
                        {tabValue === "transactions" && "Transactions"}
                        {tabValue === "companies" && "Companies"}
                        {tabValue === "users" && "Users"}
                        {tabValue === "profitandloss" && "Profit & Loss"}
                        {tabValue === "balancesheet" && "Balance Sheet"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => setTabValue("dashboard")}>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTabValue("transactions")}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTabValue("companies")}>
                      <Building className="mr-2 h-4 w-4" />
                      Companies
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTabValue("users")}>
                      <Users className="mr-2 h-4 w-4" />
                      Users
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTabValue("profitandloss")}
                    >
                      <BarChart className="mr-2 h-4 w-4" />
                      Profit & Loss
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTabValue("balancesheet")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Balance Sheet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Action buttons - stacked on mobile */}
            {/* <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Add User</span>
                <span className="xs:hidden">Add</span>
              </Button>
              <Button size="sm" className="w-full sm:w-auto">
                <Settings className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Client Settings</span>
                <span className="xs:hidden">Settings</span>
              </Button>
            </div> */}
          </div>

          {/* Tab contents */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <DashboardTab
              selectedClient={selectedClient}
              selectedCompanyId={selectedCompanyId}
            />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionsTab
              selectedClient={selectedClient}
              selectedCompanyId={selectedCompanyId}
              companyMap={companyMap}
            />
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <CompaniesTab
              selectedClientId={selectedClientId}
              selectedClient={selectedClient}
            />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab
              selectedClient={selectedClient}
              selectedCompanyId={selectedCompanyId}
              companyMap={companyMap}
            />
          </TabsContent>

          <TabsContent value="profitandloss" className="mt-6">
            <ProfitAndLossTab />
          </TabsContent>

          <TabsContent value="balancesheet" className="mt-6">
            <BalanceSheetTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyticsDashboardPageContent />
    </Suspense>
  );
}
