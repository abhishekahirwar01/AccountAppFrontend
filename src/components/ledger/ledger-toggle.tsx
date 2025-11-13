"use client";

import React, { useState } from "react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExpenseEntry {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  client: string;
  company: string;
}

interface LedgerToggleProps {
  paymentExpenses: ExpenseEntry[];
  onExpenseChange: (expenseId: string) => void;
  selectedExpense: string;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onExport?: () => void;
  exportLoading?: boolean;
}

export function LedgerToggle({
  paymentExpenses,
  onExpenseChange,
  selectedExpense,
  dateRange,
  onDateRangeChange,
  onExport,
  exportLoading = false,
}: LedgerToggleProps) {
  const [viewMode, setViewMode] = useState<"vendor" | "expense">("vendor");

  const toggleOptions = [
    { value: "vendor", label: "Vendor Account" },
    { value: "expense", label: "Expense" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {viewMode === "vendor" ? "Vendor Account" : "Expense Ledger"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {viewMode === "vendor"
                ? "Track and manage all vendor transactions, outstanding balances, and payment history in one place."
                : "Track and manage all expense transactions, payments, and financial records in one place."
              }
            </p>
          </div>

          {/* Toggle Switch */}
          <ToggleSwitch
            options={toggleOptions}
            value={viewMode}
            onChange={(value) => setViewMode(value as "vendor" | "expense")}
            className="w-fit"
          />
        </div>

        {viewMode === "expense" && (
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Expense Filter */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 px-2">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Select value={selectedExpense} onValueChange={onExpenseChange}>
                <SelectTrigger className="border-0 bg-transparent focus:ring-0 w-80 sm:w-56 flex-row">
                  <SelectValue placeholder="Select Expense" />
                </SelectTrigger>
                <SelectContent>
                  {paymentExpenses.map((expense) => (
                    <SelectItem key={expense._id} value={expense._id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {expense.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">From</span>
                <input
                  type="date"
                  className="bg-transparent border-0 text-sm focus:ring-0 w-32"
                  value={dateRange.from}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">To</span>
                <input
                  type="date"
                  className="bg-transparent border-0 text-sm focus:ring-0 w-32"
                  value={dateRange.to}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
              onClick={() => onDateRangeChange({ from: '', to: '' })}
            >
              Reset
            </Button>

            {onExport && (
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                onClick={onExport}
                disabled={exportLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportLoading ? "Exporting..." : "Export"}
              </Button>
            )}
          </div>
        )}
      </div>

      {viewMode === "expense" && !selectedExpense && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="text-center py-12 sm:py-16 px-4">
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">
                Select an Expense
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Choose an expense from the dropdown to view its detailed ledger with comprehensive transaction history.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}