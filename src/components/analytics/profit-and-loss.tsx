
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCompany } from "@/contexts/company-context";
import { useReceipts } from "@/hooks/useReceipts";
import { usePayments } from "@/hooks/usePayments";

type Line = { name: string; amount: number };

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

// helpers to safely read company fields whether populated or not
const getCompanyId = (c: any) => (typeof c === "object" ? c?._id : c) || null;
const getCompanyName = (c: any) =>
  (typeof c === "object" && (c?.businessName || c?.name)) || "Unassigned Company";

export default function ProfitAndLossTab() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { selectedCompanyId } = useCompany();

  const [from, setFrom] = useState<string>("2024-07-01");
  const [to, setTo] = useState<string>("2024-07-31");

  // Fetch raw data (server *may* filter by companyId; we also enforce client-side)
  const { receipts, loading: loadingReceipts } = useReceipts(baseURL, {
    companyId: selectedCompanyId || undefined,
    from, to,
  });
  const { payments, loading: loadingPayments } = usePayments(baseURL, {
    companyId: selectedCompanyId || undefined,
    from, to,
  });

  const loading = loadingReceipts || loadingPayments;

  // --- Client-side company filter (defensive, in case API ignores companyId) ---
  const filteredReceipts = useMemo(() => {
    if (!selectedCompanyId) return receipts as any[];
    return (receipts as any[]).filter(r => getCompanyId(r.company) === selectedCompanyId);
  }, [receipts, selectedCompanyId]);

  const filteredPayments = useMemo(() => {
    if (!selectedCompanyId) return payments as any[];
    return (payments as any[]).filter(p => getCompanyId(p.company) === selectedCompanyId);
  }, [payments, selectedCompanyId]);

  // --- Revenue lines (group by company if "All", otherwise the single selected company) ---
  const revenueLines: Line[] = useMemo(() => {
    const src = selectedCompanyId ? filteredReceipts : (receipts as any[]);
    const map = new Map<string, number>();
    for (const r of src) {
      const key = selectedCompanyId ? (getCompanyName(r.company)) : getCompanyName(r.company);
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
      const key = selectedCompanyId ? (getCompanyName(p.company)) : getCompanyName(p.company);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profit &amp; Loss Statement</h2>
          <p className="text-muted-foreground">
            {from && to ? `For the period ${from} to ${to}` : "For the selected period"}
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Date controls */}
      <div className="flex gap-3">
        <input type="date" className="border rounded px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="border rounded px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
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
              {/* Revenue */}
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
                  <TableCell className="pl-8 text-muted-foreground">No receipts for the selection</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              ) : (
                revenueLines.map((item) => (
                  <TableRow key={`rev-${item.name}`}>
                    <TableCell className="pl-8">{item.name}</TableCell>
                    <TableCell className="text-right">{INR(item.amount)}</TableCell>
                  </TableRow>
                ))
              )}

              <TableRow className="font-medium">
                <TableCell className="pl-8">Total Revenue</TableCell>
                <TableCell className="text-right">{INR(totalRevenue)}</TableCell>
              </TableRow>

              {/* Expenses */}
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
                  <TableCell className="pl-8 text-muted-foreground">No payments for the selection</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              ) : (
                expenseLines.map((item) => (
                  <TableRow key={`exp-${item.name}`}>
                    <TableCell className="pl-8">{item.name}</TableCell>
                    <TableCell className="text-right">{INR(item.amount)}</TableCell>
                  </TableRow>
                ))
              )}

              <TableRow className="font-medium">
                <TableCell className="pl-8">Total Expenses</TableCell>
                <TableCell className="text-right">{INR(totalExpenses)}</TableCell>
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
  );
}
