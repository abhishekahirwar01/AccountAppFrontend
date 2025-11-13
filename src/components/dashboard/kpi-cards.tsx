import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, CreditCard, Users, Building } from "lucide-react";

interface KpiCardsProps {
  data: {
    totalSales: number;
    totalPurchases: number;
    users: number;
    companies: number;
  };
  selectedCompanyId?: string | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export function KpiCards({ data, selectedCompanyId }: KpiCardsProps) {
  const kpiData = [
    {
      title: "Total Sales",
      value: formatCurrency(data?.totalSales || 0),
      icon: IndianRupee,
      description: selectedCompanyId ? "For selected company" : "Across all companies",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(data?.totalPurchases || 0),
      icon: CreditCard,
    },
    {
      title: "Active Users",
      value: (data?.users || 0).toString(),
      icon: Users,
    },
    {
      title: "Companies",
      value: (data?.companies || 0).toString(),
      icon: Building,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-4 grid-cols-2">
      {kpiData.map((kpi) => (
        <Card key={kpi.title} className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-grow">
            <div className="text-[16px] sm:text-2xl font-bold">
              {kpi.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}