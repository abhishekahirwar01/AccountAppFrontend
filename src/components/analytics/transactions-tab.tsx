"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DataTable } from "@/components/transactions/data-table";
import { columns as makeTxColumns } from "@/components/transactions/columns";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { ChevronDown } from "lucide-react";
import type { Client, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportTransactions } from "./export-transaction";
import { issueInvoiceNumber } from "@/lib/invoices";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TransactionsTabProps {
  selectedClient: Client;
  selectedCompanyId: string | null;
  companyMap: Map<string, string>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

export function TransactionsTab({
  selectedClient,
  selectedCompanyId,
  companyMap,
}: TransactionsTabProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [sales, setSales] = React.useState<Transaction[]>([]);
  const [purchases, setPurchases] = React.useState<Transaction[]>([]);
  const [receipts, setReceipts] = React.useState<Transaction[]>([]);
  const [payments, setPayments] = React.useState<Transaction[]>([]);
  const [journals, setJournals] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = React.useState("all");
  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [itemsToView, setItemsToView] = React.useState<any[]>([]);
  const [productsList, setProductsList] = React.useState<any[]>([]);
  const [servicesList, setServicesList] = React.useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const productNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productsList) {
      m.set(String(p._id), p.name || "(unnamed product)");
    }
    return m;
  }, [productsList]);

  const serviceNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const s of servicesList) m.set(String(s._id), s.serviceName);
    return m;
  }, [servicesList]);

  // Move handleViewItems inside useCallback to avoid dependency issues
  const handleViewItems = React.useCallback(
    (tx: any) => {
      console.log("Transaction data for items:", tx);
      console.log("Products list:", productsList);
      console.log("Services list:", servicesList);

      const prods = (tx.products || []).map((p: any) => {
        const productName =
          productNameById.get(p.product) || p.product?.name || "(product)";

        // Enhanced HSN code extraction
        let hsnCode = "";

        // Method 1: Check if product has HSN directly
        if (p.product && typeof p.product === "object") {
          hsnCode = p.product.hsn || p.product.hsnCode || "";
        }

        // Method 2: Check product line level
        if (!hsnCode && p.hsn) {
          hsnCode = p.hsn;
        }

        // Method 3: Look up in productsList
        if (!hsnCode) {
          const productId =
            typeof p.product === "object" ? p.product._id : p.product;
          const productObj = productsList.find(
            (prod) => prod._id === productId
          );
          hsnCode = productObj?.hsn || productObj?.hsnCode || "";
        }

        // Method 4: Fallback based on product name
        if (!hsnCode) {
          if (productName.toLowerCase().includes("gel")) hsnCode = "330499";
          else if (productName.toLowerCase().includes("moody"))
            hsnCode = "330499";
          else hsnCode = "8471"; // General goods
        }

        console.log("Product HSN lookup:", {
          productName,
          hsnCode,
          productData: p,
        });

        return {
          itemType: "product" as const,
          name: productName,
          quantity: p.quantity ?? "",
          unitType: p.unitType ?? "",
          otherUnit: p.otherUnit ?? "",
          pricePerUnit: p.pricePerUnit ?? "",
          description: "",
          amount: Number(p.amount) || 0,
          hsnCode,
        };
      });

      const svcArr = Array.isArray(tx.services)
        ? tx.services
        : Array.isArray(tx.service)
        ? tx.service
        : [];

      const svcs = svcArr.map((s: any) => {
        const id =
          typeof s.service === "object"
            ? s.service._id
            : s.service ??
              (typeof s.serviceName === "object"
                ? s.serviceName._id
                : s.serviceName);

        const name =
          (id && serviceNameById.get(String(id))) ||
          (typeof s.service === "object" && s.service.serviceName) ||
          (typeof s.serviceName === "object" && s.serviceName.serviceName) ||
          "(service)";

        // Enhanced SAC code extraction
        let sacCode = "";

        // Method 1: Check if service has SAC directly
        if (s.service && typeof s.service === "object") {
          sacCode = s.service.sac || s.service.sacCode || "";
        }

        // Method 2: Check service line level
        if (!sacCode && s.sac) {
          sacCode = s.sac;
        }

        // Method 3: Look up in servicesList
        if (!sacCode) {
          const serviceObj = servicesList.find((svc) => svc._id === id);
          sacCode = serviceObj?.sac || serviceObj?.sacCode || "";
        }

        // Method 4: Fallback based on service name
        if (!sacCode) {
          if (name.toLowerCase().includes("dressing")) sacCode = "999723";
          else if (name.toLowerCase().includes("consult")) sacCode = "998311";
          else sacCode = "9984"; // General services
        }

        console.log("Service SAC lookup:", { name, sacCode, serviceData: s });

        return {
          itemType: "service" as const,
          name,
          quantity: "",
          unitType: "",
          pricePerUnit: "",
          description: s.description || "",
          amount: Number(s.amount) || 0,
          sacCode,
        };
      });

      const allItems = [...prods, ...svcs];
      console.log("Final items to display:", allItems);

      setItemsToView(allItems);
      setIsItemsDialogOpen(true);
    },
    [productNameById, serviceNameById, productsList, servicesList]
  );

  const idOf = (v: any) =>
    typeof v === "string" ? v : v?._id || v?.$oid || v?.id || "";

  React.useEffect(() => {
    async function fetchTransactions() {
      if (!selectedClient?._id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const auth = { headers: { Authorization: `Bearer ${token}` } };

        // Enhanced response parsing with better debugging
        const parseResponse = (data: any, possibleArrayKeys: string[] = []) => {
          console.log("Parsing response:", data);
          if (Array.isArray(data)) return data;

          if (data?.success && Array.isArray(data?.data)) return data.data;
          if (data?.success && Array.isArray(data?.entries))
            return data.entries;

          for (const key of possibleArrayKeys) {
            if (Array.isArray(data?.[key])) return data[key];
          }

          for (const key in data) {
            if (Array.isArray(data[key])) {
              console.warn(`Found array in unexpected key: ${key}`);
              return data[key];
            }
          }

          console.warn("No array data found in response:", data);
          return [];
        };

        const parseProductsResponse = (data: any) => {
          const parsed = parseResponse(data, ["products", "items", "data"]);
          console.log("Parsed products:", parsed);
          return parsed;
        };

        const parseServicesResponse = (data: any) => {
          const parsed = parseResponse(data, ["services", "data"]);
          console.log("Parsed services:", parsed);
          return parsed;
        };

        const base = process.env.NEXT_PUBLIC_BASE_URL || "";
        const byCompany = !!selectedCompanyId;

        // Update API URLs to include company context
        const productsUrl = selectedCompanyId
          ? `${base}/api/products?companyId=${selectedCompanyId}`
          : `${base}/api/products`;

        const servicesUrl = selectedCompanyId
          ? `${base}/api/services?companyId=${selectedCompanyId}`
          : `${base}/api/services`;

        const [
          salesRes,
          purchasesRes,
          receiptsRes,
          paymentsRes,
          journalsRes,
          productsRes,
          servicesRes,
        ] = await Promise.all([
          fetch(
            byCompany
              ? `${base}/api/sales?companyId=${selectedCompanyId}`
              : `${base}/api/sales/by-client/${selectedClient._id}`,
            auth
          ),
          fetch(
            byCompany
              ? `${base}/api/purchase?companyId=${selectedCompanyId}`
              : `${base}/api/purchase/by-client/${selectedClient._id}`,
            auth
          ),
          fetch(
            byCompany
              ? `${base}/api/receipts?companyId=${selectedCompanyId}`
              : `${base}/api/receipts/by-client/${selectedClient._id}`,
            auth
          ),
          fetch(
            byCompany
              ? `${base}/api/payments?companyId=${selectedCompanyId}`
              : `${base}/api/payments/by-client/${selectedClient._id}`,
            auth
          ),
          fetch(
            byCompany
              ? `${base}/api/journals?companyId=${selectedCompanyId}`
              : `${base}/api/journals/by-client/${selectedClient._id}`,
            auth
          ),
          fetch(productsUrl, auth),
          fetch(servicesUrl, auth),
        ]);

        // Check response statuses
        const mustOk = async (res: Response, label: string) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `${label} API ${res.status} ${res.statusText} – ${txt}`
            );
          }
        };

        await Promise.all([
          mustOk(salesRes, "Sales"),
          mustOk(purchasesRes, "Purchases"),
          mustOk(receiptsRes, "Receipts"),
          mustOk(paymentsRes, "Payments"),
          mustOk(journalsRes, "Journals"),
          mustOk(productsRes, "Products"),
          mustOk(servicesRes, "Services"),
        ]);

        const [
          salesData,
          purchasesData,
          receiptsData,
          paymentsData,
          journalsData,
          productsData,
          servicesData,
        ] = await Promise.all([
          salesRes.json(),
          purchasesRes.json(),
          receiptsRes.json(),
          paymentsRes.json(),
          journalsRes.json(),
          productsRes.json(),
          servicesRes.json(),
        ]);

        // Parse responses
        const salesArr = parseResponse(salesData, [
          "salesEntries",
          "sales",
          "entries",
        ]).map((s: any) => ({
          ...s,
          type: "sales",
        }));
        const purchasesArr = parseResponse(purchasesData, [
          "purchaseEntries",
          "purchases",
          "entries",
        ]).map((p: any) => ({
          ...p,
          type: "purchases",
        }));
        const receiptsArr = parseResponse(receiptsData, [
          "receiptEntries",
          "receipts",
          "entries",
        ]).map((r: any) => ({
          ...r,
          type: "receipt",
        }));
        const paymentsArr = parseResponse(paymentsData, [
          "paymentEntries",
          "payments",
          "entries",
        ]).map((p: any) => ({
          ...p,
          type: "payment",
        }));
        const journalsArr = (
          journalsData?.success && Array.isArray(journalsData?.data)
            ? journalsData.data
            : []
        ).map((j: any) => ({
          ...j,
          description: j.narration || j.description,
          type: "journal",
          products: j.products || [],
          services: j.services || [],
          invoiceNumber: j.invoiceNumber || "",
          party: j.party || "",
        }));

        const productsList = parseProductsResponse(productsData);
        const servicesList = parseServicesResponse(servicesData);

        const filterByCompany = <T extends { company?: any }>(
          arr: T[],
          companyId?: string | null
        ) =>
          !companyId
            ? arr
            : arr.filter(
                (doc: any) =>
                  idOf(doc.company?._id ?? doc.company) === companyId
              );

        setSales(filterByCompany(salesArr, selectedCompanyId));
        setPurchases(filterByCompany(purchasesArr, selectedCompanyId));
        setReceipts(filterByCompany(receiptsArr, selectedCompanyId));
        setPayments(filterByCompany(paymentsArr, selectedCompanyId));
        setJournals(filterByCompany(journalsArr, selectedCompanyId));
        setProductsList(productsList);
        setServicesList(servicesList);

        console.log(
          "Products with HSN:",
          productsList.map((p: { name: any; hsn: any }) => ({
            name: p.name,
            hsn: p.hsn,
            hasHsn: !!p.hsn,
          }))
        );
        console.log(
          "Services with SAC:",
          servicesList.map((s: { serviceName: any; sac: any }) => ({
            name: s.serviceName,
            sac: s.sac,
            hasSac: !!s.sac,
          }))
        );
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load transactions",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [selectedClient?._id, selectedCompanyId, toast]);

  const [invNoByTxId, setInvNoByTxId] = React.useState<Record<string, string>>(
    {}
  );

  async function ensureInvoiceNumberFor(tx: any): Promise<string> {
    const existing = tx.invoiceNumber || invNoByTxId[tx._id];
    if (existing) return existing;

    const companyId = idOf(tx.company?._id ?? tx.company);
    if (!companyId) throw new Error("No companyId on this transaction");

    const issued = await issueInvoiceNumber(companyId);
    setInvNoByTxId((m) => ({ ...m, [tx._id]: issued }));
    return issued;
  }

  const handleAction = React.useCallback(() => {
    toast({
      title: "Action not available",
      description:
        "Editing and deleting transactions is not available from the analytics dashboard.",
    });
  }, [toast]);

  const onPreview = React.useCallback(
    async (tx: any) => {
      try {
        const invNo = await ensureInvoiceNumberFor(tx);
        window.open(
          `/invoices/${tx._id}?invno=${encodeURIComponent(invNo)}`,
          "_blank"
        );
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Couldn't issue invoice number",
          description: e?.message || "Try again.",
        });
      }
    },
    [toast]
  );

  const onDownloadInvoice = React.useCallback(
    async (tx: any) => {
      try {
        const invNo = await ensureInvoiceNumberFor(tx);
        window.open(
          `/invoices/${tx._id}/download?invno=${encodeURIComponent(
            invNo
          )}&companyId=${idOf(tx.company)}`,
          "_blank"
        );
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Couldn't issue invoice number",
          description: e?.message || "Try again.",
        });
      }
    },
    [toast]
  );

  // Fix the tableColumns useMemo to use the callback functions
  const tableColumns = React.useMemo(
    () =>
      makeTxColumns({
        onPreview,
        onViewItems: handleViewItems,
        onEdit: handleAction,
        onDelete: handleAction,
        companyMap,
        serviceNameById,
        onSendInvoice: () => {},
        hideActions: true,
      }),
    [onPreview, handleViewItems, handleAction, companyMap, serviceNameById]
  );

  const allTransactions = React.useMemo(
    () =>
      [...sales, ...purchases, ...receipts, ...payments, ...journals].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [sales, purchases, receipts, payments, journals]
  );

  function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false);
    React.useEffect(() => {
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
      listener();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }, [query]);
    return matches;
  }

  const isMobile = useMediaQuery("(max-width: 768px)");

  const renderContent = (data: Transaction[]) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    if (isMobile) {
      return (
        <TransactionsTable
          data={data}
          companyMap={companyMap}
          serviceNameById={serviceNameById}
          onPreview={onPreview}
          onEdit={handleAction}
          onDelete={handleAction}
          onViewItems={handleViewItems}
          onSendInvoice={() => {}}
          hideActions={true}
        />
      );
    }

    return <DataTable columns={tableColumns} data={data} />;
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between mb-3">
          <div className="hidden sm:block">
            <TabsList className="flex space-x-1 overflow-x-auto">
              <TabsTrigger
                value="all"
                className="flex items-center px-3 py-1.5 text-sm"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="flex items-center px-3 py-1.5 text-sm"
              >
                Sales
              </TabsTrigger>
              <TabsTrigger
                value="purchases"
                className="flex items-center px-3 py-1.5 text-sm"
              >
                Purchases
              </TabsTrigger>
              <TabsTrigger
                value="receipts"
                className="flex items-center px-3 py-1.5 text-sm"
              >
                Receipts
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex items-center px-3 py-1.5 text-sm"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="journals"
                className="flex items-center px-3 py-1.5 text-sm"
              >
                Journals
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile dropdown - unchanged */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 border-b">
              <div
                className="flex items-center"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                <span className="text-sm">
                  {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
                </span>
                <ChevronDown className="ml-2 text-sm" />
              </div>
              {isDropdownOpen && (
                <div className="absolute bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-lg mt-2 w-48 z-10 border border-gray-200 dark:border-gray-700">
                  <ul className="space-y-1 p-2">
                    {[
                      "all",
                      "sales",
                      "purchases",
                      "receipts",
                      "payments",
                      "journals",
                    ].map((tab) => (
                      <li
                        key={tab}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-md transition-colors duration-200 text-gray-900 dark:text-gray-100"
                        onClick={() => handleTabChange(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <ExportTransactions
            selectedClientId={selectedClient._id}
            companyMap={companyMap}
            defaultCompanyId={selectedCompanyId}
            onExported={(n) => console.log(`Exported ${n} rows`)}
          />
        </div>

        <TabsContent value="all" className="mt-4">
          {renderContent(allTransactions)}
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
          {renderContent(sales)}
        </TabsContent>
        <TabsContent value="purchases" className="mt-4">
          {renderContent(purchases)}
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          {renderContent(receipts)}
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          {renderContent(payments)}
        </TabsContent>
        <TabsContent value="journals" className="mt-4">
          {renderContent(journals)}
        </TabsContent>
      </Tabs>

      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-w-sm max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              A detailed list of all items in this transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
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
                        ? `${item.quantity} ${
                            item.unitType === "Other"
                              ? item.otherUnit || "Other"
                              : item.unitType || "Piece"
                          }` // Change this line
                        : "—";
                    const rate = !isService
                      ? formatCurrency(Number(item?.pricePerUnit ?? 0))
                      : "—";
                    const total = formatCurrency(Number(item?.amount ?? 0));
                    const hsnSacCode = isService ? item.sacCode : item.hsnCode;

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
                              {isService && item?.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.itemType ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">{qty}</TableCell>
                        <TableCell className="text-center">
                          {hsnSacCode || "—"}
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
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3 p-1">
              {itemsToView.map((item, idx) => {
                const isService = item.itemType === "service";
                const qty =
                  !isService &&
                  item.quantity !== undefined &&
                  item.quantity !== null &&
                  !isNaN(Number(item.quantity))
                    ? `${item.quantity} ${
                        item.unitType === "Other"
                          ? item.otherUnit || "Other"
                          : item.unitType || "Piece"
                      }` // Change this line
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
                            HSN/SAC: {hsnSacCode || "—"}
                          </span>
                        </div>
                        {isService && item?.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Qty: {qty}</div>
                      <div className="text-right">Rate: {rate}</div>
                      <div className="col-span-2 text-right font-semibold border-t pt-1">
                        Total: {total}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
