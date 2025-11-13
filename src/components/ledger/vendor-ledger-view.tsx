 "use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  TrendingUp,
  CreditCard,
  Calendar,
  Package,
  Server,
  IndianRupee,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  vendorName: string;
  invoiceNo?: string;
  paymentMethod?: string;
  amount: number;
  company: string;
  referenceNumber?: string;
}

interface Vendor {
  _id: string;
  vendorName: string;
  email?: string;
  contactNumber?: string;
  balance?: number;
}

interface VendorLedgerViewProps {
  loading: boolean;
  ledgerData: {
    debit: LedgerEntry[];
    credit: LedgerEntry[];
    totals: {
      debit: number;
      credit: number;
      balance: number;
    };
  } | null;
  selectedVendorData: Vendor | undefined;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  getPaymentMethodDisplay: (method?: string) => string;
  getPaymentMethodBadge: (method?: string) => "default" | "secondary" | "outline";
  calculateTotals: () => { debit: number; credit: number; balance: number };
  dateRange?: {
    from: string;
    to: string;
  };
  productsList?: any[];
}

interface Item {
  itemType: "product" | "service";
  name: string;
  quantity: string;
  unitType: string;
  pricePerUnit: string;
  description: string;
  amount: number;
  hsnCode?: string;
  sacCode?: string;
  gstPercentage?: number;
  gstRate?: number;
  lineTax?: number;
}

export function VendorLedgerView({
  loading,
  ledgerData,
  selectedVendorData,
  formatDate,
  formatCurrency,
  getPaymentMethodDisplay,
  getPaymentMethodBadge,
  calculateTotals,
  dateRange,
  productsList = []
}: VendorLedgerViewProps) {
  const totals = calculateTotals();
  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [itemsToView, setItemsToView] = React.useState<Item[]>([]);

  // Function to handle viewing items for a transaction
  const handleViewItems = async (entry: LedgerEntry) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
      // For ledger entries, we need to find the transaction by its ID
      // The entry.id should correspond to the transaction _id
      // Try purchase endpoint first, then payments if needed
      let endpoint = `${baseURL}/api/purchase/${entry.id}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // If purchase endpoint fails, try payments endpoint
        const paymentsEndpoint = `${baseURL}/api/payments/${entry.id}`;
        const paymentsResponse = await fetch(paymentsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!paymentsResponse.ok) {
          throw new Error("Failed to fetch transaction details");
        }

        const transaction = await paymentsResponse.json();
        console.log("Fetched transaction data:", transaction);
        console.log("Transaction products:", transaction.payment?.products);
        console.log("Transaction services:", transaction.payment?.services);
        processTransactionData(transaction.payment);
        return;
      }

      const transaction = await response.json();
      console.log("Fetched transaction data:", transaction);
      console.log("Transaction products:", transaction.entry?.products);
      console.log("Transaction services:", transaction.entry?.services);
      processTransactionData(transaction.entry);
    } catch (error) {
      console.error("Error fetching transaction items:", error);
      // Show dialog with empty items and error message
      setItemsToView([]);
      setIsItemsDialogOpen(true);
    }
  };

  const processTransactionData = (transaction: any) => {
    // Process products and services similar to transactions page
    const prods = (transaction.products || []).map((p: any) => {
      // Get HSN code from product
      const productId =
        typeof p.product === "object" ? p.product._id : p.product;
      const productObj = productsList.find((prod) => prod._id === productId);
      const hsnCode = productObj?.hsn || p.hsn || p.product?.hsn || p.hsnCode || "";

      const product = {
        itemType: "product" as const,
        name: p.product?.name || p.product || "(product)",
        quantity: p.quantity ?? "",
        unitType: p.unitType ?? "",
        pricePerUnit: p.pricePerUnit ?? "",
        description: "",
        amount: Number(p.amount) || 0,
        hsnCode,
        gstPercentage: p.gstPercentage,
        gstRate: p.gstPercentage,
        lineTax: p.lineTax,
      };
      return product;
    });

    const svcArr = Array.isArray(transaction.services)
      ? transaction.services
      : Array.isArray(transaction.service)
      ? transaction.service
      : transaction.services
      ? [transaction.services]
      : [];
    const svcs = svcArr.map((s: any) => ({
      itemType: "service" as const,
      name: s.service?.serviceName || s.service || "(service)",
      quantity: "",
      unitType: "",
      pricePerUnit: "",
      description: s.description || "",
      amount: Number(s.amount) || 0,
      sacCode: s.service?.sac || "",
      gstPercentage: s.gstPercentage,
      gstRate: s.gstPercentage,
      lineTax: s.lineTax,
    }));

    const allItems = [...prods, ...svcs];
    setItemsToView(allItems);
    setIsItemsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-20 sm:h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-80 sm:h-96 w-full" />
          <Skeleton className="h-80 sm:h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!ledgerData) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="text-center py-12 sm:py-16 px-4">
          <div className="space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">
              No Ledger Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No transaction history found for the selected vendor. 
              Transactions will appear here once recorded.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Vendor Summary Card */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-4 sm:p-2 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                    {selectedVendorData?.vendorName}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    Vendor Ledger Summary • {dateRange?.from && dateRange?.to
                      ? `${new Date(dateRange.from).toLocaleDateString("en-IN")} - ${new Date(dateRange.to).toLocaleDateString("en-IN")}`
                      : new Date().toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-2">
              <div
                className={`text-xl sm:text-2xl font-semibold ${
                  totals.balance > 0
                    ? "text-red-600 dark:text-red-400"
                    : totals.balance < 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {formatCurrency(Math.abs(totals.balance))}
              </div>
              <Badge
                variant="outline"
                className={
                  totals.balance > 0
                    ? "border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-900/20"
                    : totals.balance < 0
                    ? "border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-900/20"
                    : "border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-800"
                }
              >
                {totals.balance > 0
                  ? "Amount Payable"
                  : totals.balance < 0
                  ? "Advance Paid"
                  : "Settled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total Purchases
                </p>
              </div>
              <p className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400 break-words">
                {formatCurrency(totals.debit)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total Payments
                </p>
              </div>
              <p className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400 break-words">
                {formatCurrency(totals.credit)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Net Balance
                </p>
              </div>
              <p
                className={`text-base sm:text-xl font-bold break-words ${
                  totals.balance > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : totals.balance < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {formatCurrency(Math.abs(totals.balance))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    totals.balance > 0
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : totals.balance < 0
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-blue-100 dark:bg-blue-900/30"
                  }`}
                >
                  <FileText
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      totals.balance > 0
                        ? "text-orange-600 dark:text-orange-400"
                        : totals.balance < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Status
                </p>
              </div>
              <Badge
                variant={
                  totals.balance > 0
                    ? "destructive"
                    : totals.balance < 0
                    ? "default"
                    : "secondary"
                }
                className={`text-xs w-fit ${
                  totals.balance > 0
                    ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50"
                    : totals.balance < 0
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50"
                    : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50"
                }`}
              >
                {totals.balance > 0
                  ? "Payable"
                  : totals.balance < 0
                  ? "Advance"
                  : "Settled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debit and Credit Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-1">
        {/* Debit Side */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg scroll">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200 dark:border-red-800/50 p-3 sm:p-6">
            <CardTitle className="text-red-700 dark:text-red-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-base sm:text-lg">Debit</span>
              </div>
              <span className="text-xs sm:text-sm font-normal bg-white dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-full border border-red-200 dark:border-red-800/50">
                Total: {formatCurrency(totals.debit)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(!ledgerData.debit || ledgerData.debit.length === 0) ? (
              <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400 px-4">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No purchase entries found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3 p-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {[...ledgerData.debit].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800/50 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                              Purchase
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.date)}
                            </div>
                            <button
                              onClick={() => handleViewItems(item)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                      
                      {item.invoiceNo && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Invoice:</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.invoiceNo}</span>
                        </div>
                      )}
                      
                      {item.description && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded p-2">
                          {item.description}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-800/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Payment Method</span>
                        <Badge
                          variant={getPaymentMethodBadge(item.paymentMethod)}
                          className="text-xs"
                        >
                          {item.paymentMethod || 'Not Specified'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-red-100 dark:bg-[#312934] z-10">
                      <tr className="border-b border-red-200 dark:border-red-800/50 text-left">
                        <th className="p-2 sm:p-4 text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider w-12">
                          #
                        </th>
                        <th className="p-2 sm:p-4 text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="p-2 sm:p-4 text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider">
                          Particulars
                        </th>
                        <th className="p-2 sm:p-4 text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="p-2 sm:p-4 text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...ledgerData.debit].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 dark:border-slate-700 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {index + 1}
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-slate-400 hidden sm:inline" />
                              <span className="whitespace-nowrap">{formatDate(item.date)}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm">
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">
                                Purchase
                              </div>
                              {item.invoiceNo && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Invoice: <span className="font-mono">{item.invoiceNo}</span>
                                </div>
                              )}
                              {item.description && (
                                <div className="text-xs text-slate-500 dark:text-slate-200 mt-1 line-clamp-1">
                                  {item.description}
                                </div>
                              )}
                              <button
                                onClick={() => handleViewItems(item)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm">
                            <Badge
                              variant={getPaymentMethodBadge(item.paymentMethod)}
                              className="text-xs"
                            >
                              {item.paymentMethod || 'Not Specified'}
                            </Badge>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 text-right whitespace-nowrap">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credit Side */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800/50 p-3 sm:p-6">
            <CardTitle className="text-green-700 dark:text-green-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-base sm:text-lg">Credit</span>
              </div>
              <span className="text-xs sm:text-sm font-normal bg-white dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-full border border-green-200 dark:border-green-800/50">
                Total: {formatCurrency(totals.credit)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              const creditPurchaseEntries = (ledgerData.debit || []).filter(
                (entry) => entry.paymentMethod !== "Credit"
              );
              const creditPaymentEntries = ledgerData.credit || [];
              const allCreditEntries = [...creditPurchaseEntries, ...creditPaymentEntries];

              if (allCreditEntries.length === 0) {
                return (
                  <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400 px-4">
                    <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No payment entries found</p>
                    <p className="text-xs mt-2">Cash purchases and payment entries will appear here</p>
                  </div>
                );
              }

              return (
                <>
                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-3 p-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {[...allCreditEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => {
                      const isPurchase = !item.type || item.type === 'debit';
                      return (
                        <div
                          key={`${isPurchase ? 'purchase' : 'payment'}-${item.id}`}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/50 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                  {isPurchase ? 'Purchase' : getPaymentMethodDisplay(item.paymentMethod)}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.date)}
                                </div>
                                <button
                                  onClick={() => handleViewItems(item)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(item.amount)}
                              </div>
                            </div>
                          </div>
                          
                          {item.invoiceNo && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 dark:text-slate-400">Invoice:</span>
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.invoiceNo}</span>
                            </div>
                          )}
                          
                          {item.referenceNumber && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 dark:text-slate-400">Ref:</span>
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.referenceNumber}</span>
                            </div>
                          )}
                          
                          {item.description && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded p-2">
                              {item.description}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800/50">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Payment Method</span>
                            <Badge
                              variant={getPaymentMethodBadge(item.paymentMethod)}
                              className="text-xs"
                            >
                              {item.paymentMethod || 'Not Specified'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block max-h-96 overflow-y-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-green-100 dark:bg-[#1B3138] z-10">
                        <tr className="border-b border-green-200 dark:border-green-800/50 text-left">
                          <th className="p-2 sm:p-4 text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider w-12">
                            #
                          </th>
                          <th className="p-2 sm:p-4 text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="p-2 sm:p-4 text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider">
                            Particulars
                          </th>
                          <th className="p-2 sm:p-4 text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th className="p-2 sm:p-4 text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...allCreditEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => {
                          const isPurchase = !item.type || item.type === 'debit';
                          return (
                            <tr
                              key={`${isPurchase ? 'purchase' : 'payment'}-${item.id}`}
                              className="border-b border-slate-100 dark:border-slate-700 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
                            >
                              <td className="p-2 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {index + 1}
                              </td>
                              <td className="p-2 sm:p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-slate-400 hidden sm:inline" />
                                  <span className="whitespace-nowrap">{formatDate(item.date)}</span>
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 text-xs sm:text-sm">
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {isPurchase ? 'Purchase' : getPaymentMethodDisplay(item.paymentMethod)}
                                  </div>
                                  {item.invoiceNo && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      Invoice: <span className="font-mono">{item.invoiceNo}</span>
                                    </div>
                                  )}
                                  {item.referenceNumber && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      Ref: <span className="font-mono">{item.referenceNumber}</span>
                                    </div>
                                  )}
                                  {item.description && (
                                    <div className="text-xs text-slate-500 dark:text-slate-200 mt-1 line-clamp-1">
                                      {item.description}
                                    </div>
                                  )}
                                  {isPurchase && (
                                    <button
                                      onClick={() => handleViewItems(item)}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                    >
                                      View Details
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 text-xs sm:text-sm">
                                <Badge
                                  variant={getPaymentMethodBadge(item.paymentMethod)}
                                  className="text-xs"
                                >
                                  {item.paymentMethod || 'Not Specified'}
                                </Badge>
                              </td>
                              <td className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 text-right whitespace-nowrap">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Item Details Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl rounded-lg sm:rounded-xl">
          <DialogHeader className="px-1 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">
              Item Details
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              A detailed list of all items in this transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
            {/* Summary Section */}
            {itemsToView.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(itemsToView.reduce((sum, item) => sum + Number(item.amount || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tax Total</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(itemsToView.reduce((sum, item) => {
                        const lineTax = (item as any).lineTax;
                        if (lineTax !== undefined && lineTax !== null) {
                          return sum + Number(lineTax);
                        }
                        const gstRate = (item as any).gstPercentage || (item as any).gstRate || (item as any).gst || 0;
                        const taxableValue = item.amount || 0;
                        const taxAmount = (taxableValue * gstRate) / 100;
                        return sum + taxAmount;
                      }, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Total</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(
                        itemsToView.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
                        itemsToView.reduce((sum, item) => {
                          const lineTax = (item as any).lineTax;
                          if (lineTax !== undefined && lineTax !== null) {
                            return sum + Number(lineTax);
                          }
                          const gstRate = (item as any).gstPercentage || (item as any).gstRate || (item as any).gst || 0;
                          const taxableValue = item.amount || 0;
                          const taxAmount = (taxableValue * gstRate) / 100;
                          return sum + taxAmount;
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Desktop Table (hidden on mobile) */}
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-center">HSN/SAC</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsToView.map((item, idx) => {
                  const isService = item.itemType === "service";
                  const qty =
                    !isService &&
                    item.quantity !== undefined &&
                    item.quantity !== null &&
                    !isNaN(Number(item.quantity))
                      ? `${item.quantity} ${item.unitType || "Piece"}`
                      : "—";
                  const rate = !isService
                    ? formatCurrency(Number(item?.pricePerUnit ?? 0))
                    : "—";
                  const total = formatCurrency(Number(item?.amount ?? 0));

                  const hsnSacCode = isService
                    ? item.sacCode
                    : item.hsnCode;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isService ? (
                            <Server className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <span>{item?.name ?? "—"}</span>
                            {isService && item?.description ? (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="capitalize">
                        {item.itemType ?? "—"}
                      </TableCell>

                      <TableCell className="text-center">{qty}</TableCell>

                      <TableCell className="text-center">
                        {item.hsnCode || item.sacCode || "—"}
                      </TableCell>

                      <TableCell className="text-right">{rate}</TableCell>

                      <TableCell className="text-right font-semibold">
                        {total}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Mobile Cards (visible on mobile) */}
            <div className="sm:hidden space-y-3 p-1">
              {itemsToView.map((item, idx) => {
                const isService = item.itemType === "service";
                const qty =
                  !isService &&
                  item.quantity !== undefined &&
                  item.quantity !== null &&
                  !isNaN(Number(item.quantity))
                    ? `${item.quantity} ${item.unitType || "Piece"}`
                    : "—";
                const rate = !isService
                  ? formatCurrency(Number(item?.pricePerUnit ?? 0))
                  : "—";
                const total = formatCurrency(Number(item?.amount ?? 0));
                const hsnSacCode = isService ? item.sacCode : item.hsnCode;

                return (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 mt-1">
                        {isService ? (
                          <Server className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {item?.name ?? "—"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {item.itemType ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            HSN/SAC: {hsnSacCode || item.hsnCode || item.sacCode || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isService && item?.description && (
                      <div className="mb-3 px-1">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Quantity
                        </div>
                        <div className="font-medium">{qty}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Price/Unit
                        </div>
                        <div className="font-medium">{rate}</div>
                      </div>

                      <div className="col-span-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">
                            Total Amount
                          </div>
                          <div className="text-base font-bold text-green-600 dark:text-green-400">
                            {total}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}