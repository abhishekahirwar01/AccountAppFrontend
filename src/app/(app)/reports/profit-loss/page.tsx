"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Calendar, Clock, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCompany } from "@/contexts/company-context";
import { useReceipts } from "@/hooks/useReceipts";
import { usePayments } from "@/hooks/usePayments";

type Line = { name: string; amount: number };

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);

// helpers to safely read company fields whether populated or not
const getCompanyId = (c: any) => (typeof c === "object" ? c?._id : c) || null;
const getCompanyName = (c: any) =>
  (typeof c === "object" && (c?.businessName || c?.name)) ||
  "Unassigned Company";

export default function ProfitLossPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { selectedCompanyId } = useCompany();

  const [from, setFrom] = useState<string>("2024-07-01");
  const [to, setTo] = useState<string>("2024-07-31");

  // Fetch raw data (server *may* filter by companyId; we also enforce client-side)
  const { receipts, loading: loadingReceipts } = useReceipts(baseURL, {
    companyId: selectedCompanyId || undefined,
    from,
    to,
  });
  const { payments, loading: loadingPayments } = usePayments(baseURL, {
    companyId: selectedCompanyId || undefined,
    from,
    to,
  });

  const loading = loadingReceipts || loadingPayments;

  // --- Client-side company filter (defensive, in case API ignores companyId) ---
  const filteredReceipts = useMemo(() => {
    if (!selectedCompanyId) return receipts as any[];
    return (receipts as any[]).filter(
      (r) => getCompanyId(r.company) === selectedCompanyId
    );
  }, [receipts, selectedCompanyId]);

  const filteredPayments = useMemo(() => {
    if (!selectedCompanyId) return payments as any[];
    return (payments as any[]).filter(
      (p) => getCompanyId(p.company) === selectedCompanyId
    );
  }, [payments, selectedCompanyId]);

  // --- Revenue lines (group by company if "All", otherwise the single selected company) ---
  const revenueLines: Line[] = useMemo(() => {
    const src = selectedCompanyId ? filteredReceipts : (receipts as any[]);
    const map = new Map<string, number>();
    for (const r of src) {
      const key = selectedCompanyId
        ? getCompanyName(r.company)
        : getCompanyName(r.company);
      map.set(key, (map.get(key) || 0) + (Number(r.amount) || 0));
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [receipts, filteredReceipts, selectedCompanyId]);

  const totalRevenue = useMemo(
    () => revenueLines.reduce((s, l) => s + l.amount, 0),
    [revenueLines]
  );

  // --- Expense lines (group by company if "All") ---
  const expenseLines: Line[] = useMemo(() => {
    const src = selectedCompanyId ? filteredPayments : (payments as any[]);
    const map = new Map<string, number>();
    for (const p of src) {
      const key = selectedCompanyId
        ? getCompanyName(p.company)
        : getCompanyName(p.company);
      map.set(key, (map.get(key) || 0) + (Number(p.amount) || 0)); // swap to net field if needed
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [payments, filteredPayments, selectedCompanyId]);

  const totalExpenses = useMemo(
    () => expenseLines.reduce((s, l) => s + l.amount, 0),
    [expenseLines]
  );

  const netIncome = totalRevenue - totalExpenses;

 function ComingSoonBanner() {
  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-border/50 dark:bg-gray-900 bg-white shadow-lg 
                    lg:ml-[15%] lg:mt-[-5%]"> 
      {/* Mirror/Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 opacity-20"></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center p-4 sm:p-6 lg:p-8">
        {/* Animated Icon */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl backdrop-blur-md border border-primary/20 shadow-lg">
          <div className="relative">
            <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" />
            {/* Pulsing effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
          </div>
        </div>
        
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xl sm:text-2xl lg:text-3xl font-medium border border-primary/20 backdrop-blur-sm mb-3 sm:mb-4">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          Coming Soon
        </div>

        {/* Title with gradient text */}
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3 sm:mb-4">
          Advanced Analytics Coming Soon
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-md mb-4 sm:mb-6 leading-relaxed px-2 sm:px-0">
          We're enhancing your Profit & Loss with interactive charts,
          historical comparisons, and detailed financial insights.
        </p>

        {/* Animated Badge */}
        
      </div>

      {/* Shine/Highlight Effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 bg-primary/5 rounded-full blur-xl"></div>
    </div>
  );
}
  return (
    <>
      {/* Coming Soon Banner - Centered with proper spacing */}
      <div className="flex justify-center items-center fixed w-full h-full z-10 bg-gray/30 backdrop-blur-sm rounded-lg p-0">
        <ComingSoonBanner />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Profit &amp; Loss Statement
            </h2>
            <p className="text-muted-foreground">
              {from && to
                ? `For the period ${from} to ${to}`
                : "For the selected period"}
            </p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Date Range Selectors */}
        <div className="flex gap-3">
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Income Statement</CardTitle>
            <CardDescription>Summary of financial performance.</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70%]">Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="font-semibold bg-secondary/50">
                  <TableCell>Revenue</TableCell>
                  <TableCell />
                </TableRow>

                {loading ? (
                  <TableRow>
                    <TableCell className="pl-8">Loading…</TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                ) : revenueLines.length === 0 ? (
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">
                      No receipts for the selection
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                ) : (
                  revenueLines.map((item) => (
                    <TableRow key={`rev-${item.name}`}>
                      <TableCell className="pl-8">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {INR(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}

                <TableRow className="font-medium">
                  <TableCell className="pl-8">Total Revenue</TableCell>
                  <TableCell className="text-right">
                    {INR(totalRevenue)}
                  </TableCell>
                </TableRow>

                <TableRow className="font-semibold bg-secondary/50">
                  <TableCell>Expenses</TableCell>
                  <TableCell />
                </TableRow>

                {loading ? (
                  <TableRow>
                    <TableCell className="pl-8">Loading…</TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                ) : expenseLines.length === 0 ? (
                  <TableRow>
                    <TableCell className="pl-8 text-muted-foreground">
                      No payments for the selection
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                ) : (
                  expenseLines.map((item) => (
                    <TableRow key={`exp-${item.name}`}>
                      <TableCell className="pl-8">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {INR(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}

                <TableRow className="font-medium">
                  <TableCell className="pl-8">Total Expenses</TableCell>
                  <TableCell className="text-right">
                    {INR(totalExpenses)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className="flex justify-end p-6">
            <div className="w-full max-w-sm space-y-2">
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Net Income</span>
                <span>{INR(netIncome)}</span>
              </div>
              <Separator />
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
