import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  ChevronRight,
  Loader2,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Minus,
  CreditCard,
} from "lucide-react";
import { Button } from "../ui/button";

interface Vendor {
  _id: string;
  vendorName: string;
  balance?: number;
  balances?: { [key: string]: number };
}

interface Expense {
  _id: string;
  name: string;
}

interface VendorExpenseListProps {
  currentView: "vendor" | "expense";
  vendors: Vendor[];
  expenses: Expense[];
  expenseTotals: { [key: string]: number };
  onSelect: (id: string) => void;
  selectedCompanyId?: string;
}

interface Stats {
  totalVendors: number;
  totalExpenses: number;
  netBalance: number;
  totalExpenseAmount: number;
  settledVendors: number;
  totalCredit: number;
  totalDebit: number;
}

interface TransactionTotals {
  totalCredit: number;
  totalDebit: number;
}

export function VendorExpenseList({
  currentView,
  vendors,
  expenses,
  expenseTotals,
  onSelect,
  selectedCompanyId,
}: VendorExpenseListProps) {
  const [loadingBalances, setLoadingBalances] = useState<{
    [key: string]: boolean;
  }>({});
  const [vendorBalances, setVendorBalances] = useState<{
    [key: string]: number;
  }>({});
  const [transactionTotals, setTransactionTotals] = useState<TransactionTotals>(
    {
      totalCredit: 0,
      totalDebit: 0,
    }
  );
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [vendorLastTransactionDates, setVendorLastTransactionDates] = useState<{
    [key: string]: string;
  }>({});
  const [expenseLastTransactionDates, setExpenseLastTransactionDates] =
    useState<{ [key: string]: string }>({});
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  // Calculate statistics
  const stats: Stats = useMemo(() => {
    // For company-specific view, calculate settled vendors based on current balances
    const vendorBalancesArray = vendors.map((vendor) =>
      vendorBalances[vendor._id] !== undefined
        ? vendorBalances[vendor._id]
        : 0 // Use 0 as default for company-specific balances
    );

    // Calculate net balance from transaction totals (already company-filtered)
    const netBalance = transactionTotals.totalCredit - transactionTotals.totalDebit;

    // Count settled vendors (balance = 0) from current company-specific balances
    const settledVendors = vendorBalancesArray.filter((b) => b === 0).length;

    console.log("Company-wise stats calculation:", {
      selectedCompanyId: selectedCompanyId || "all",
      netBalance,
      totalCredit: transactionTotals.totalCredit,
      totalDebit: transactionTotals.totalDebit,
      settledVendors,
      totalVendors: vendors.length
    });

    return {
      totalVendors: vendors.length, // This stays the same (total vendors for client)
      totalExpenses: expenses.length,
      netBalance, // Company-specific
      totalExpenseAmount: Object.values(expenseTotals).reduce(
        (sum, amount) => sum + amount,
        0
      ),
      settledVendors, // Company-specific
      totalCredit: transactionTotals.totalCredit, // Company-specific
      totalDebit: transactionTotals.totalDebit, // Company-specific
    };
  }, [vendors, expenses, expenseTotals, vendorBalances, transactionTotals, selectedCompanyId]);

  const formatCurrency = (amount: number) => {
    return `\u20B9${amount?.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Fetch overall transaction totals by calculating across all vendors
  const fetchOverallTotals = async (
    vendorsList: Vendor[],
    expensesList: Expense[]
  ) => {
    try {
      setLoadingTotals(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      let totalCredit = 0;
      let totalDebit = 0;
      const vendorLastDates: { [key: string]: string } = {};
      const expenseLastDates: { [key: string]: string } = {};

      // Fetch ledger data for each vendor concurrently
      const vendorPromises = vendorsList.map(async (vendor) => {
        try {
          const params = new URLSearchParams();
          params.append("vendorId", vendor._id);
          if (selectedCompanyId) params.append("companyId", selectedCompanyId);
          const response = await fetch(
            `${baseURL}/api/ledger/vendor-payables?${params.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Calculate totals the same way as in payables page
            const debitTotal = (data.debit || []).reduce(
              (sum: number, entry: any) => sum + (entry.amount || 0),
              0
            );

            const creditPurchaseEntries = (data.debit || []).filter(
              (entry: any) => entry.paymentMethod !== "Credit"
            );
            const creditPaymentEntries = data.credit || [];

            const creditTotal = [
              ...creditPurchaseEntries,
              ...creditPaymentEntries,
            ].reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);

            // Find the most recent transaction date for this vendor
            const allEntries = [...(data.debit || []), ...(data.credit || [])];
            if (allEntries.length > 0) {
              const mostRecentDate = allEntries.reduce((latest, entry) => {
                return new Date(entry.date) > new Date(latest)
                  ? entry.date
                  : latest;
              }, allEntries[0].date);
              vendorLastDates[vendor._id] = mostRecentDate;
            }

            return {
              debit: debitTotal,
              credit: creditTotal,
              vendorName: vendor.vendorName,
            };
          } else {
            console.error(
              `Failed to fetch ledger data for vendor ${vendor._id}`
            );
            return { debit: 0, credit: 0, vendorName: vendor.vendorName };
          }
        } catch (error) {
          console.error(
            `Error fetching ledger data for vendor ${vendor._id}:`,
            error
          );
          return { debit: 0, credit: 0, vendorName: vendor.vendorName };
        }
      });

      // Fetch ledger data for each expense concurrently
      const expensePromises = expensesList.map(async (expense) => {
        try {
          const params = new URLSearchParams();
          params.append("expenseId", expense._id);
          if (selectedCompanyId) params.append("companyId", selectedCompanyId);
          const response = await fetch(
            `${baseURL}/api/ledger/expense-payables?${params.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Find the most recent transaction date for this expense
            const allEntries = [...(data.debit || []), ...(data.credit || [])];
            if (allEntries.length > 0) {
              const mostRecentDate = allEntries.reduce((latest, entry) => {
                return new Date(entry.date) > new Date(latest)
                  ? entry.date
                  : latest;
              }, allEntries[0].date);
              expenseLastDates[expense._id] = mostRecentDate;
            }

            return { success: true };
          } else {
            console.error(
              `Failed to fetch ledger data for expense ${expense._id}`
            );
            return { success: false };
          }
        } catch (error) {
          console.error(
            `Error fetching ledger data for expense ${expense._id}:`,
            error
          );
          return { success: false };
        }
      });

      const [vendorResults, expenseResults] = await Promise.all([
        Promise.all(vendorPromises),
        Promise.all(expensePromises),
      ]);

      // Sum up all vendor totals
      console.log("Vendor-wise breakdown:");
      vendorResults.forEach((result) => {
        totalDebit += result.debit;
        totalCredit += result.credit;
        console.log(`${result.vendorName}: Debit ₹${result.debit.toLocaleString("en-IN")}, Credit ₹${result.credit.toLocaleString("en-IN")}, Balance ₹${(result.credit - result.debit).toLocaleString("en-IN")}`);
      });

      console.log(`Total Debit: ₹${totalDebit.toLocaleString("en-IN")}, Total Credit: ₹${totalCredit.toLocaleString("en-IN")}, Net Balance: ₹${(totalCredit - totalDebit).toLocaleString("en-IN")}`);

      setTransactionTotals({
        totalCredit,
        totalDebit,
      });

      setVendorLastTransactionDates(vendorLastDates);
      setExpenseLastTransactionDates(expenseLastDates);
    } catch (error) {
      console.error("Error fetching overall totals:", error);
      setTransactionTotals({
        totalCredit: 0,
        totalDebit: 0,
      });
    } finally {
      setLoadingTotals(false);
    }
  };

  // Fetch balance for a vendor
  const fetchVendorBalance = async (vendorId: string) => {
    if (!vendorId || vendorBalances[vendorId] !== undefined) return;

    try {
      setLoadingBalances((prev) => ({ ...prev, [vendorId]: true }));

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const params = new URLSearchParams();
      if (selectedCompanyId) params.append("companyId", selectedCompanyId);
      const response = await fetch(
        `${baseURL}/api/vendors/${vendorId}/balance?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVendorBalances((prev) => ({
          ...prev,
          [vendorId]: data.balance || 0,
        }));
      } else {
        console.error(`Failed to fetch balance for vendor ${vendorId}`);
        setVendorBalances((prev) => ({
          ...prev,
          [vendorId]: 0,
        }));
      }
    } catch (error) {
      console.error(`Error fetching balance for vendor ${vendorId}:`, error);
      setVendorBalances((prev) => ({
        ...prev,
        [vendorId]: 0,
      }));
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [vendorId]: false }));
    }
  };

  // Fetch balances for all vendors and overall totals when component mounts
  useEffect(() => {
    if (currentView === "vendor") {
      vendors.forEach((vendor) => {
        fetchVendorBalance(vendor._id);
      });
      fetchOverallTotals(vendors, expenses);
    }
  }, [vendors, expenses, currentView, selectedCompanyId]);

  const getBalanceVariant = (amount: number) => {
    if (amount < 0) return "destructive";
    if (amount > 0) return "default";
    return "secondary";
  };

  const getBalanceIcon = (amount: number) => {
    if (amount < 0) return <ArrowUpRight className="w-3 h-3" />;
    if (amount > 0) return <ArrowDownLeft className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getBalanceText = (amount: number) => {
    if (amount < 0) return "You Owe";
    if (amount > 0) return "Advance";
    return "Settled";
  };

  const getBalanceColor = (amount: number) => {
    if (amount < 0) return "text-red-600 dark:text-red-400";
    if (amount > 0) return "text-green-600 dark:text-green-400";
    return "text-slate-600 dark:text-slate-400";
  };

  const getBalanceBadgeColor = (amount: number) => {
    if (amount < 0) {
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50";
    }
    if (amount > 0) {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  const getNetBalanceConfig = (netBalance: number) => {
    if (netBalance < 0) {
      return {
        title: "Net Payable",
        subtitle: "Total amount you owe",
        icon: TrendingUp,
        trend: "down" as const,
        className: "ring-1 ring-red-200 dark:ring-red-800",
        textColor: "text-red-600 dark:text-red-400"
      };
    } else if (netBalance > 0) {
      return {
        title: "Net Advance",
        subtitle: "Total advance with vendors",
        icon: TrendingDown,
        trend: "up" as const,
        className: "ring-1 ring-green-200 dark:ring-green-800",
        textColor: "text-green-600 dark:text-green-400"
      };
    } else {
      return {
        title: "Net Balance",
        subtitle: "All accounts settled",
        icon: Minus,
        trend: "neutral" as const,
        className: "",
        textColor: "text-slate-600 dark:text-slate-400"
      };
    }
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className = "",
    loading = false,
    valueColor = "",
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    className?: string;
    loading?: boolean;
    valueColor?: string;
  }) => (
    <Card
      className={`bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-md ${className}`}
    >
      <CardContent className="p-2 md:p-4">
        <div className="flex md:flex-row items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <p className={`text-sm sm:text-lg font-bold ${valueColor}`}>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              ) : (
                value
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
          <div
            className={`p-1 md:p-2 rounded-full text-right items-end ${
              trend === "up"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : trend === "down"
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            }`}
          >
            <Icon className="md:w-4 w-3 md:h-4 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const items =
    currentView === "vendor"
      ? [...vendors].sort((a, b) => {
          const aDate = vendorLastTransactionDates[a._id];
          const bDate = vendorLastTransactionDates[b._id];
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }).map(vendor => {
          // Calculate overall balance when no company is selected
          let overallBalance = 0;
          if (!selectedCompanyId && vendor.balances) {
            // Sum all company balances
            for (const [companyId, balance] of Object.entries(vendor.balances)) {
              overallBalance += Number(balance || 0);
            }
          } else if (selectedCompanyId && vendorBalances[vendor._id] !== undefined) {
            // Use company-specific balance
            overallBalance = vendorBalances[vendor._id];
          } else {
            // Fallback to stored balance
            overallBalance = vendor.balance || 0;
          }
          return {
            ...vendor,
            balance: overallBalance
          };
        })
      : [...expenses].sort((a, b) => {
          const aDate = expenseLastTransactionDates[a._id];
          const bDate = expenseLastTransactionDates[b._id];
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

  // Get net balance configuration
  const netBalanceConfig = getNetBalanceConfig(stats.netBalance);

  return (
    <div className="space-y-6">
      {/* Stats Cards - Conditionally rendered based on currentView */}
      {currentView === "vendor" ? (
        // Vendor View Stats - Updated with Net Balance instead of separate Payable/Advance
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Vendors"
            value={stats.totalVendors.toString()}
            subtitle={`${stats.settledVendors} settled`}
            icon={Users}
            trend="neutral"
          />
          <StatCard
            title={netBalanceConfig.title}
            value={formatCurrency(Math.abs(stats.netBalance))}
            subtitle={netBalanceConfig.subtitle}
            icon={netBalanceConfig.icon}
            trend={netBalanceConfig.trend}
            className={netBalanceConfig.className}
            valueColor={netBalanceConfig.textColor}
          />
          <StatCard
            title="Total Credit"
            value={formatCurrency(stats.totalCredit)}
            subtitle="Payments made to vendors"
            icon={CreditCard}
            trend="up"
            loading={loadingTotals}
            className={
              stats.totalCredit > 0
                ? "ring-1 ring-blue-200 dark:ring-blue-800"
                : ""
            }
          />
          <StatCard
            title="Total Debit"
            value={formatCurrency(stats.totalDebit)}
            subtitle="All-time purchases made"
            icon={IndianRupee}
            trend="down"
            loading={loadingTotals}
            className={
              stats.totalDebit > 0
                ? "ring-1 ring-orange-200 dark:ring-orange-800"
                : ""
            }
          />
         
        </div>
      ) : (
        // Expense View Stats
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <StatCard
            title="Expense Categories"
            value={stats.totalExpenses.toString()}
            subtitle="Total categories"
            icon={FileText}
            trend="neutral"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(stats.totalExpenseAmount)}
            subtitle="Total amount spent"
            icon={TrendingUp}
            trend="neutral"
          />
        </div>
      )}

      {/* Rest of your existing component remains the same */}
      <Card className="bg-white/80 p-0 dark:bg-slate-800/80  border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-4 p-1 md:p-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  currentView === "vendor"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-blue-100 dark:bg-blue-900/30"
                }`}
              >
                {currentView === "vendor" ? (
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentView === "vendor" ? "Vendors" : "Expense Categories"}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden xs:block">
                  {currentView === "vendor"
                    ? `Manage your vendor relationships and balances`
                    : `Track expenses across different categories`}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-xs font-medium w-fit xs:w-auto"
            >
              {items.length}{" "}
              {currentView === "vendor" ? "vendors" : "categories"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 p-1 md:p-4">
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
            {items.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  {currentView === "vendor" ? (
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                  ) : (
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  No{" "}
                  {currentView === "vendor" ? "vendors" : "expense categories"}{" "}
                  found
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 px-4">
                  {currentView === "vendor"
                    ? "Add vendors to start tracking balances"
                    : "Create expense categories to organize your spending"}
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isVendor = currentView === "vendor";
                const name = isVendor
                  ? (item as Vendor).vendorName
                  : (item as Expense).name;
                const total = isVendor
                  ? selectedCompanyId && vendorBalances[item._id] !== undefined
                    ? vendorBalances[item._id]
                    : (item as Vendor).balance || 0
                  : expenseTotals[(item as Expense)._id] || 0;
                const id = item._id;
                const isLoading = loadingBalances[id];

                return (
                  <React.Fragment key={id}>
                    {/* Desktop Version - hidden on mobile */}
                    <div
                      className="group hidden md:flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
                      onClick={() => onSelect(id)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors ${
                            isVendor
                              ? total < 0
                                ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                                : total > 0
                                ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                          }`}
                        >
                          {isVendor ? (
                            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">
                            {name}
                          </h3>
                          {isVendor && (
                            <p
                              className={`text-xs font-medium mt-1 ${getBalanceColor(
                                total
                              )}`}
                            >
                              {getBalanceText(total)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {isVendor && (
                          <div className="flex flex-col items-end gap-1">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <Badge
                                variant={getBalanceVariant(total)}
                                className={`text-xs font-medium px-2 py-1 border ${getBalanceBadgeColor(
                                  total
                                )}`}
                              >
                                <div className="flex items-center gap-1">
                                  {getBalanceIcon(total)}
                                  {formatCurrency(Math.abs(total))}
                                </div>
                              </Badge>
                            )}
                          </div>
                        )}

                        {!isVendor && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                          >
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              {formatCurrency(total)}
                            </div>
                          </Badge>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 border-slate-300 dark:border-slate-600  dark:hover:bg-slate-700 transition-all"
                          onClick={() => onSelect(id)}
                        >
                          View Ledger
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Version - hidden on desktop */}
                    <div
                      className="group flex md:hidden items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200"
                      onClick={() => onSelect(id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            isVendor
                              ? total < 0
                                ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                                : total > 0
                                ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                          }`}
                        >
                          {isVendor ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                            {name}
                          </h3>
                          {isVendor && (
                            <div className="flex items-center gap-2 mt-1">
                              <p
                                className={`text-xs font-medium ${getBalanceColor(
                                  total
                                )}`}
                              >
                                {getBalanceText(total)}
                              </p>
                              {!isLoading && (
                                <Badge
                                  variant={getBalanceVariant(total)}
                                  className={`text-xs font-medium px-2 py-0.5 border ${getBalanceBadgeColor(
                                    total
                                  )}`}
                                >
                                  <div className="flex items-center gap-1">
                                    {getBalanceIcon(total)}
                                    {formatCurrency(Math.abs(total))}
                                  </div>
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                        {!isVendor && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                          >
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              {formatCurrency(total)}
                            </div>
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 px-3 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                          onClick={() => onSelect(id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}