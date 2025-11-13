// components/vendor-expense-toggle.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VendorExpenseToggleProps {
  currentView: "vendor" | "expense";
  onViewChange: (view: "vendor" | "expense") => void;
}

export function VendorExpenseToggle({ currentView, onViewChange }: VendorExpenseToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-1">
      <Button
        variant={currentView === "vendor" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("vendor")}
        className={`px-3 py-1 h-8 text-xs font-medium transition-all ${currentView === "vendor"
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
      >
        <span className="hidden sm:inline">Vendor Account</span>
        <span className="inline sm:hidden">Vendor</span>
      </Button>
      <Button
        variant={currentView === "expense" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("expense")}
        className={`px-3 py-1 h-8 text-xs font-medium transition-all ${currentView === "expense"
            ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
      >
        Expense
      </Button>
    </div>
  );
}