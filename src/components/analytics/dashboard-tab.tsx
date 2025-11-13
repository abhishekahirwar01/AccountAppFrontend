"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  IndianRupee,
  Building,
  Mail,
  Phone,
  User,
  Loader2,
   Calendar, 
} from "lucide-react";
import type { Client, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CompanyCard } from "../companies/company-card";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

interface DashboardTabProps {
  selectedClient: Client;
  selectedCompanyId: string | null;
}

type Stats = {
  totalSales: number;
  totalPurchases: number;
  totalUsers: number;        // <-- add
};


export function DashboardTab({
  selectedClient,
  selectedCompanyId,
}: DashboardTabProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [stats, setStats] = React.useState({
    totalSales: 0,
    totalPurchases: 0,
    totalUsers: 0, 
  });
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
   const [validity, setValidity] = React.useState<any>(null);
  const { toast } = useToast();
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportCompanyId, setExportCompanyId] = React.useState<string | "ALL">(
    "ALL"
  );
  const [exportTypes, setExportTypes] = React.useState<Record<string, boolean>>(
    {
      sales: true,
      purchases: true,
      receipts: true,
      payments: true,
      journals: true,
    }
  );
  const allTypes = [
    "sales",
    "purchases",
    "receipts",
    "payments",
    "journals",
  ] as const;

   // ADD THIS FUNCTION
  const fetchValidity = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `${baseURL}/api/account/${selectedClient._id}/validity`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 404) {
        setValidity(null);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch validity");
      
      const data = await res.json();
      setValidity(data.validity);
    } catch (error) {
      setValidity(null);
    }
  }, [baseURL, selectedClient._id]);


  React.useEffect(() => {
    // Preselect currently viewed company when opening dialog
    if (selectedCompanyId) setExportCompanyId(selectedCompanyId);
    else setExportCompanyId("ALL");
  }, [selectedCompanyId]);

  React.useEffect(() => {
    async function fetchStatsAndCompanies() {
      if (!selectedClient._id) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        const auth = { headers: { Authorization: `Bearer ${token}` } };

        const toArray = (x: any) => {
          if (Array.isArray(x)) return x;
          if (Array.isArray(x?.entries)) return x.entries;
          if (Array.isArray(x?.data)) return x.data;
          if (Array.isArray(x?.docs)) return x.docs;
          if (Array.isArray(x?.items)) return x.items;
          return [];
        };

        const mustOk = async (res: Response, label: string) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `${label} API ${res.status} ${res.statusText} – ${txt}`
            );
          }
        };

        const idOf = (v: any) =>
          typeof v === "string" ? v : v?._id || v?.id || v?.$oid || "";

        const filterByCompany = (arr: any[], companyId?: string | null) =>
          !companyId
            ? arr
            : arr.filter(
                (r) => idOf(r.company?._id ?? r.company) === companyId
              );

        const extractAmount = (row: any): number => {
          const candidates = [
            row.amount,
            row.total,
            row.totalAmount,
            row.grandTotal,
            row.finalAmount,
            row.netAmount,
            row?.amount?.total,
            row?.totals?.total,
            row?.summary?.grandTotal,
          ];
          for (const c of candidates) {
            const n = Number(c);
            if (Number.isFinite(n)) return n;
          }
          if (Array.isArray(row.items)) {
            return row.items.reduce((s: number, it: any) => {
              const price = Number(
                it.total ?? it.amount ?? it.rate ?? it.price ?? 0
              );
              const qty = Number(it.qty ?? it.quantity ?? 1);
              const guess = Number.isFinite(price * qty) ? price * qty : 0;
              return s + guess;
            }, 0);
          }
          return 0;
        };

        const sumAmount = (arr: any[]) =>
          arr.reduce((a, e) => a + extractAmount(e), 0);

        const base = process.env.NEXT_PUBLIC_BASE_URL || "";
        const byCompany = !!selectedCompanyId;

        const salesUrl = byCompany
          ? `${base}/api/sales/by-client/${selectedClient._id}?companyId=${selectedCompanyId}`
          : `${base}/api/sales/by-client/${selectedClient._id}`;
        const purchasesUrl = `${base}/api/purchase/by-client/${selectedClient._id}`;
        const companiesUrl = `${base}/api/companies/by-client/${selectedClient._id}`;
        const usersUrl = byCompany
          ? `${base}/api/users/by-client/${selectedClient._id}?companyId=${selectedCompanyId}`
          : `${base}/api/users/by-client/${selectedClient._id}`;

        const [salesRes, purchasesRes, companiesRes, usersRes] =
          await Promise.all([
            fetch(salesUrl, auth),
            fetch(purchasesUrl, auth),
            fetch(companiesUrl, auth),
            fetch(usersUrl, auth),
          ]);

        await Promise.all([
          mustOk(salesRes, "Sales"),
          mustOk(purchasesRes, "Purchases"),
          mustOk(companiesRes, "Companies"),
          mustOk(usersRes, "Users"),
        ]);

        const [salesData, purchasesData, companiesData, usersData] =
          await Promise.all([
            salesRes.json(),
            purchasesRes.json(),
            companiesRes.json(),
            usersRes.json(),
          ]);

        const salesArr = toArray(salesData);
        const purchasesArr = toArray(purchasesData);
        const companiesArr = toArray(companiesData);
        const usersArr = toArray(usersData);

        // extra client-side filter safeguard
        const salesFiltered = filterByCompany(salesArr, selectedCompanyId);
        const purchasesFiltered = filterByCompany(
          purchasesArr,
          selectedCompanyId
        );
        const usersFiltered = !selectedCompanyId
          ? usersArr
          : usersArr.filter(
              (u: any) =>
                Array.isArray(u.companies) &&
                u.companies.some((c: any) => idOf(c) === selectedCompanyId)
            );

        setStats({
          totalSales: sumAmount(salesFiltered),
          totalPurchases: sumAmount(purchasesFiltered),
          // add totalUsers to the shape
          // @ts-ignore add this field to your stats state type
          totalUsers: usersFiltered.length,
        });
        setCompanies(companiesArr);
        await fetchValidity();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description:
            error instanceof Error
              ? error.message
              : "Could not fetch client's financial summary.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatsAndCompanies();
  }, [selectedClient._id, selectedCompanyId, toast, fetchValidity]);

  const kpiData = [
    {
      title: "Total Sales",
      value: formatCurrency(stats.totalSales || 0),
      icon: IndianRupee,
    },
    {
      title: "Total Purchases",
      value: formatCurrency(stats.totalPurchases || 0),
      icon: IndianRupee,
    },
    {
    title: "Total Users",
    value: String(stats.totalUsers || 0),   // <-- use stats, not selectedClient
    icon: Users,
  },
    {
      title: "Companies",
      value: (companies.length || 0).toString(),
      icon: Building,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-6 w-6 bg-muted rounded-md animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

   
  return (
    <div className="space-y-6">
     <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
  {kpiData.map((kpi) => (
    <Card key={kpi.title} className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">
          {kpi.title}
        </CardTitle>
        <kpi.icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        <div className="text-lg md:text-2xl font-bold truncate">
          {kpi.value}
        </div>
      </CardContent>
    </Card>
  ))}
</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>Primary contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <span>{selectedClient.contactName}</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <a
                href={`mailto:${selectedClient.email}`}
                className="hover:underline"
              >
                {selectedClient.email}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span>{selectedClient.phone}</span>
            </div>

            <div className="flex items-center gap-4">
    <Calendar className="h-5 w-5 text-muted-foreground" />
    <div className="flex flex-col items-start">
      <span className="text-sm">
        Expires: {validity?.expiresAt ? new Date(validity.expiresAt).toLocaleDateString() : "Not set"}
         {validity?.status && (
        <span className={`text-xs px-2 py-1 rounded-full mt-1 w-fit ms-2 ${
          validity.status === 'active' ? 'bg-green-100 text-green-800' :
          validity.status === 'expired' ? 'bg-red-100 text-red-800' :
          validity.status === 'disabled' ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {validity.status.charAt(0).toUpperCase() + validity.status.slice(1)}
        </span>
      )}
      </span>
     
    </div>
  </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          {companies.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent>
                {companies.map((company) => (
                  <CarouselItem
                    key={company._id}
                    className="md:basis-1/1 lg:basis-1/1"
                  >
                    <div className="p-1">
                      <CompanyCard company={company} onDelete={() => {}} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="sm:ml-4 ml-[40px]" />
              <CarouselNext className="sm:mr-4 mr-[40px]" />
            </Carousel>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Companies Found</CardTitle>
                <CardDescription>
                  This client does not have any companies assigned yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-12">
                <Building className="h-16 w-16 text-muted-foreground" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
