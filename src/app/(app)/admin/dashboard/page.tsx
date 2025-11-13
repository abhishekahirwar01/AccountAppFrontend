
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ClientStatusChart } from '@/components/dashboard/client-status-chart';
import { Users, Building, Database, FileText, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import type { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import UpdateNotification from '@/components/notifications/UpdateNotification';
import UpdateNotificationBadge from '@/components/notifications/UpdateNotificationBadge';
import { cn } from '@/lib/utils';


const CACHE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

export default function AdminDashboardPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [clients, setClients] = React.useState<Client[]>([]);
  const [companies , setCompanies] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch(`${baseURL}/api/clients`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch clients.");
        }
        const data = await res.json();
        setClients(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load dashboard data",
          description: error instanceof Error ? error.message : "Something went wrong."
        });
      } finally {
        setIsLoading(false);
      }
    };

     const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch(`${baseURL}/api/companies/all`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch clients.");
        }
        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load dashboard data",
          description: error instanceof Error ? error.message : "Something went wrong."
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanies();
    fetchClients();
  }, [toast]);

  // console.log("companies ," , companies)

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'Active').length;

  // Mock data for new KPIs. Replace with API calls when endpoints are ready.
  const totalCompanies = companies.length;
  const totalTransactions = 1452;
  const pendingInvoices = 23;

  const kpiData = [
    { 
      title: 'Total Clients', 
      value: totalClients.toString(), 
      change: `+${Math.floor(Math.random()*5)} this month`, 
      icon: Users,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500'
    },
    { 
      title: 'Companies Managed', 
      value: totalCompanies.toString(), 
      change: '+5 this month', 
      icon: Building,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500'
    },
    { 
      title: 'Total Transactions', 
      value: totalTransactions.toLocaleString(), 
      change: '+120 this week', 
      icon: Database,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-500'
    },
    { 
      title: 'Pending Invoices', 
      value: pendingInvoices.toString(), 
      change: 'Across all clients', 
      icon: FileText,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-500'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:pt-16 ">

      <div className="flex md:flex-row flex-col gap-2 md:items-center items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Master Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your accounting software platform
          </p>
        </div>
        <UpdateNotificationBadge />
      </div>

  <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
  {kpiData.map((kpi) => (
    <Card key={kpi.title} className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className='space-y-1 sm:space-y-2 flex-1 min-w-0'>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {kpi.title}
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              {kpi.value}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className={cn(
                "inline-flex items-center gap-1 w-[45vh]",
                kpi.change.startsWith('+') ? "text-green-500" : "text-red-500"
              )}>
                {kpi.change.startsWith('+') ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {kpi.change}
              </span>
            </p>
          </div>
          <div className={cn(
            "p-2 rounded-md flex-shrink-0 ml-2",
            kpi.iconBg
          )}>
            <kpi.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${kpi.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>


      {/* Update Notifications */}
      <div data-notification-section>
        <UpdateNotification />
      </div>

      {/* <div className="sm:grid gap-6 sm:grid-cols-5 flex flex-col">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart totalRevenue={totalTransactions}/>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Client Status</CardTitle>
            <CardDescription>Active vs inactive clients</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientStatusChart active={activeClients} inactive={totalClients - activeClients} />
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
