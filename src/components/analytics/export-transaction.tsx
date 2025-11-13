"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSXType from "xlsx-js-style";

type Props = {
  selectedClientId: string;
  companyMap: Map<string, string>;
  defaultCompanyId?: string | null;
  onExported?: (rowCount: number) => void;
};

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

type TxType = "sales" | "purchases" | "receipts" | "payments" | "journals";
const allTypes: TxType[] = ["sales", "purchases", "receipts", "payments", "journals"];

export function ExportTransactions({ selectedClientId, companyMap, defaultCompanyId, onExported }: Props) {
  const { toast } = useToast();
  const stringifyId = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      if (v.$oid) return String(v.$oid);
      if (v._id) return stringifyId(v._id);
      if (v.id) return stringifyId(v.id);
    }
    try { return String(v); } catch { return ""; }
  };

  const [open, setOpen] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | "ALL">("ALL");
  const [types, setTypes] = React.useState<Record<TxType, boolean>>({
    sales: true, purchases: true, receipts: true, payments: true, journals: true,
  });
  const [dateRange, setDateRange] = React.useState({
    from: "",
    to: ""
  });
  const [useDateRange, setUseDateRange] = React.useState(false);

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
  const [busy, setBusy] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setCompanyId(defaultCompanyId ?? "ALL");
  }, [defaultCompanyId]);

  const toggleAll = (checked: boolean) => {
    const next = { ...types };
    allTypes.forEach(t => (next[t] = checked));
    setTypes(next);
  };

  const fetchClients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const res = await fetch(`${baseURL}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      console.log("👉 raw /api/clients response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Response is not valid JSON.");
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch clients.");
      }

      setClients(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [baseURL, toast]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clientsById = React.useMemo(
    () => new Map(clients.map((c: any) => [
      stringifyId(c._id),
      c.name || c.clientUsername || c.contactName || c.slug || "(no name)"
    ])),
    [clients]
  );

  const handleExport = async () => {
    const idOf = (v: any) => (typeof v === "string" ? v : v?.$oid || v?._id || v?.id || "");

    // 💡 UPDATED HEADERS: Replaced "Invoice Type" with "Transaction Type"
    const HEADERS: string[] = [
      "Date",
      "Party",
      "Product",
      "Amount",
      "Client",
      "Company",
      "GSTIN",
      "Description",
      "Transaction Type", // <--- CHANGED HERE
    ];

    const first = (...vals: any[]) => vals.find(v => {
      if (v === null || v === undefined) return false;
      if (typeof v === "string") return v.trim().length > 0;
      return true;
    }) ?? "";

    const nameOf = (obj: any) => first(
      obj?.name, obj?.businessName, obj?.fullName, obj?.displayName, obj?.title, obj?.partyName, obj?.customerName, obj?.vendorName
    );

    const gstinOf = (obj: any) => first(
      obj?.gstin, obj?.GSTIN, obj?.gstNumber, obj?.gst_no, obj?.gstNo, obj?.gstinNumber, obj?.gst
    );

    const fmtDate = (d: any) => {
      if (!d) return "";
      const dt = typeof d === "string" ? new Date(d) : new Date(d.$date || d);
      return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
    };

    const itemsArrayOf = (t: any) =>
      (Array.isArray(t.items) && t.items) ||
      (Array.isArray(t.lineItems) && t.lineItems) ||
      (Array.isArray(t.products) && t.products) ||
      [];

    const productsListOf = (t: any) => {
      const items = itemsArrayOf(t);
      if (!items.length) {
        return first(
          nameOf(t.product),
          t.productName,
          idOf(t.product)
        );
      }
      return items.map((it: any) =>
        first(nameOf(it?.product), it?.productName, idOf(it?.product))
      ).filter(Boolean).join(", ");
    };

    const descriptionOf = (t: any) => first(
      t.description,
      t.notes,
      t.note,
      t.narration,
      t.remark,
      t.remarks,
      t.invoiceNote,
      t.memo,
      itemsArrayOf(t)?.[0]?.description
    );

    const invoiceTypeOf = (t: any, fallback: string) => first(
      t.invoiceType,
      t.voucherType,
      t.voucher,
      t.entryType,
      t.type,
      fallback
    );

    const amountOf = (t: any) => first(
      t.totalAmount, t.grandTotal, t.netAmount, t.amount, t.value, t.total
    );

    const normalizeByType = (t: any, txType: TxType) => {
      const companyName = first(
        t.company?.businessName,
        nameOf(t.company),
        companyMap.get(idOf(t.company)),
        idOf(t.company)
      );

      let partyName = "";

      if (txType === "purchases" || txType === "payments") {
        partyName = first(
          t.vendorName,
          t.supplierName,
          nameOf(t.vendor),
          idOf(t.vendor),
          " "
        );
      } else {
        partyName = first(
          nameOf(t.party),
          t.partyName,
          t.customerName,
          idOf(t.party),
          " "
        );
      }

      const gstin = first(
        gstinOf(t.party),
        t.partyGstin,
        t.gstin,
        gstinOf(t.company)
      );

      const clientName = first(
        t.clientName,
        t.client?.name,
        nameOf(t.client),
        clientsById.get(stringifyId(t.client)),
        clientsById.get(stringifyId(t.clientId)),
        clientsById.get(selectedClientId),
        stringifyId(t.client || t.clientId)
      );

      // Base object maps to internal keys, not the capitalized headers
      const base: any = {
        date: fmtDate(first(t.date, t.createdAt, t.invoiceDate, t.voucherDate)),
        party: partyName, 
        client: clientName,
        company: companyName,
        gstin: gstin,
        amount: "",
        product: "",
        description: "",
        transactionType: "", // <--- Internal key for Transaction Type
      };

      if (txType === "sales") {
        base.amount = amountOf(t);
        base.product = productsListOf(t);
        base.description = descriptionOf(t);
        base.transactionType = invoiceTypeOf(t, "Sales");
        return base;
      }

      if (txType === "purchases") {
        base.amount = amountOf(t);
        base.product = productsListOf(t);
        base.description = descriptionOf(t);
        base.transactionType = invoiceTypeOf(t, "Purchase");
        return base;
      }

      if (txType === "receipts") {
        base.amount = amountOf(t);
        base.description = descriptionOf(t);
        base.transactionType = invoiceTypeOf(t, "Receipt");
        return base;
      }

      if (txType === "payments") {
        base.amount = amountOf(t);
        base.description = descriptionOf(t);
        base.transactionType = invoiceTypeOf(t, "Payment");
        return base;
      }

      base.amount = amountOf(t);
      base.description = descriptionOf(t);
      base.transactionType = invoiceTypeOf(t, "Journal");
      return base;
    };

    try {
      setBusy(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const chosen = (["sales", "purchases", "receipts", "payments", "journals"] as TxType[])
        .filter(t => types[t]);
      if (!chosen.length) throw new Error("Choose at least one transaction type.");

      if (useDateRange) {
        if (!dateRange.from || !dateRange.to) {
          throw new Error("Please select both from and to dates.");
        }
        if (new Date(dateRange.from) > new Date(dateRange.to)) {
          throw new Error("From date cannot be after to date.");
        }
      }

      const byCompany = companyId !== "ALL";
      const baseQuery = byCompany ? `?companyId=${companyId}` : `?`;

      let dateQuery = "";
      if (useDateRange) {
        dateQuery = `&from=${dateRange.from}&to=${dateRange.to}`;
      }

      const clientPath = `/by-client/${selectedClientId}`;

      const urlFor = (t: TxType) => {
        if (byCompany) {
          if (t === "sales") return `${BASE_URL}/api/sales${baseQuery}${dateQuery}`;
          if (t === "purchases") return `${BASE_URL}/api/purchase${baseQuery}${dateQuery}`;
          if (t === "receipts") return `${BASE_URL}/api/receipts${baseQuery}${dateQuery}`;
          if (t === "payments") return `${BASE_URL}/api/payments${baseQuery}${dateQuery}`;
          return `${BASE_URL}/api/journals${baseQuery}${dateQuery}`;
        }
        if (t === "sales") return `${BASE_URL}/api/sales${clientPath}${dateQuery ? `?${dateQuery.slice(1)}` : ''}`;
        if (t === "purchases") return `${BASE_URL}/api/purchase${clientPath}${dateQuery ? `?${dateQuery.slice(1)}` : ''}`;
        if (t === "receipts") return `${BASE_URL}/api/receipts${clientPath}${dateQuery ? `?${dateQuery.slice(1)}` : ''}`;
        if (t === "payments") return `${BASE_URL}/api/payments${clientPath}${dateQuery ? `?${dateQuery.slice(1)}` : ''}`;
        return `${BASE_URL}/api/journals${clientPath}${dateQuery ? `?${dateQuery.slice(1)}` : ''}`;
      };

      const fetchAuth = (u: string) =>
        fetch(u, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

      const urls = chosen.map(t => ({ t, url: urlFor(t) }));
      const datasets = await Promise.all(urls.map(({ url }) => fetchAuth(url)));

      const byType: Record<TxType, any[]> = {
        sales: [], purchases: [], receipts: [], payments: [], journals: []
      };

      datasets.forEach((data, i) => {
        const txType = urls[i].t;

        const list = Array.isArray(data)
          ? data
          : (data?.entries ?? data?.data ?? []);

        const filtered = list.filter((it: any) => {
          // When specific company is selected, filter by company
          if (byCompany) {
            const cid = idOf(it.company?._id || it.company);
            if (!cid || cid !== companyId) return false;
          }
          // When "ALL" is selected, include all companies (no filter)

          // Date range filter
          if (useDateRange) {
            const transactionDate = first(it.date, it.createdAt, it.invoiceDate, it.voucherDate);
            if (transactionDate) {
              const txDate = new Date(transactionDate);
              const fromDate = new Date(dateRange.from);
              const toDate = new Date(dateRange.to);
              toDate.setHours(23, 59, 59, 999);

              if (txDate < fromDate || txDate > toDate) {
                return false;
              }
            }
          }

          return true;
        });

        filtered.forEach((it: any) => {
          byType[txType].push(normalizeByType(it, txType));
        });
      });

      for (const t of chosen) {
        byType[t] = await Promise.all(byType[t]);
      }

      const totalRows = chosen.reduce((n, t) => n + byType[t].length, 0);
      if (!totalRows) throw new Error("No data to export for selected filters.");

      const XLSX = await import("xlsx-js-style" as string);
      const wb = XLSX.utils.book_new();

      const sheetName = (t: TxType) =>
        t.charAt(0).toUpperCase() + t.slice(1);

      // 🎨 MODERN VIBRANT STYLING - Blue & Orange Theme
      const headerStyle = {
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" },
          size: 12,
          name: "Calibri"
        },
        fill: { fgColor: { rgb: "2563EB" } }, // Vibrant blue
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true 
        },
        border: {
          top: { style: "medium" as const, color: { rgb: "1E40AF" } },
          bottom: { style: "medium" as const, color: { rgb: "1E40AF" } },
          left: { style: "thin" as const, color: { rgb: "1E40AF" } },
          right: { style: "thin" as const, color: { rgb: "1E40AF" } }
        }
      };

      const evenRowStyle = {
        fill: { fgColor: { rgb: "EFF6FF" } }, // Light blue tint
        font: { 
          color: { rgb: "1E293B" },
          size: 11,
          name: "Calibri"
        },
        alignment: { 
          vertical: "center",
          wrapText: true 
        },
        border: {
          top: { style: "thin" as const, color: { rgb: "BFDBFE" } },
          bottom: { style: "thin" as const, color: { rgb: "BFDBFE" } },
          left: { style: "thin" as const, color: { rgb: "BFDBFE" } },
          right: { style: "thin" as const, color: { rgb: "BFDBFE" } }
        }
      };

      const oddRowStyle = {
        fill: { fgColor: { rgb: "FFFFFF" } }, // Pure white
        font: { 
          color: { rgb: "1E293B" },
          size: 11,
          name: "Calibri"
        },
        alignment: { 
          vertical: "center",
          wrapText: true 
        },
        border: {
          top: { style: "thin" as const, color: { rgb: "BFDBFE" } },
          bottom: { style: "thin" as const, color: { rgb: "BFDBFE" } },
          left: { style: "thin" as const, color: { rgb: "BFDBFE" } },
          right: { style: "thin" as const, color: { rgb: "BFDBFE" } }
        }
      };

      const currencyStyle = {
        numFmt: "₹ #,##0.00;[Red]₹ -#,##0.00",
        font: { 
          bold: true,
          color: { rgb: "EA580C" }, // Vibrant orange for amounts
          size: 11,
          name: "Calibri"
        },
        alignment: { 
          horizontal: "right",
          vertical: "center" 
        }
      };

      const dateStyle = {
        numFmt: "dd-mmm-yyyy",
        font: { 
          color: { rgb: "6366F1" }, // Indigo for dates
          size: 11,
          name: "Calibri"
        },
        alignment: { 
          horizontal: "center",
          vertical: "center" 
        }
      };
      
      // Column Widths for 9 headers
      const columnWidths = [
        { wch: 14 }, // Date
        { wch: 22 }, // Party/Vendor
        { wch: 30 }, // Product
        { wch: 16 }, // Amount
        { wch: 22 }, // Client
        { wch: 24 }, // Company
        { wch: 20 }, // GSTIN
        { wch: 40 }, // Description
        { wch: 16 }, // Transaction Type
      ];

      for (const t of chosen) {
        let rows = byType[t];
        if (!rows || rows.length === 0) continue;
        
        // Define the internal keys in the required order
        let partyKey = "party";
        let partyHeaderValue = "Party"; 
        
        if (t === "purchases" || t === "payments") {
          partyKey = "vendor"; // Use 'vendor' internally for correct mapping
          partyHeaderValue = "Vendor"; // Display "Vendor" as header
        }
        
        const internalRowKeys: string[] = [
            "date",
            partyKey, 
            "product",
            "amount",
            "client",
            "company",
            "gstin",
            "description",
            "transactionType", // <--- Internal key updated here
        ];
        
        // Create the final rows in the correct order, mapping internal data structure (r.party) to the internal key (partyKey/vendor)
        const finalRows = rows.map((r) => {
            const row: Record<string, any> = {};
            
            row.date = r.date;
            row[partyKey] = r.party; // Map the party name (or vendor name) to the partyKey
            row.product = r.product;
            row.amount = r.amount;
            row.client = r.client;
            row.company = r.company;
            row.gstin = r.gstin;
            row.description = r.description;
            row.transactionType = r.transactionType; // <--- Mapping to new internal key
            
            return row;
        });

        // Use internalRowKeys to enforce column order. The headers displayed will be derived from HEADERS.
        const ws = XLSX.utils.json_to_sheet(finalRows, { header: internalRowKeys });
        
        // Find the index of the party column
        const partyColIndex = internalRowKeys.indexOf(partyKey);

        // Explicitly set the header values for the first row using the desired capitalized HEADERS
        for (let C = 0; C < HEADERS.length; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
            
            // Adjust header value for Party/Vendor dynamically
            const headerValue = (C === partyColIndex) 
                                ? partyHeaderValue 
                                : HEADERS[C];
            
            if (!ws[cell_address]) {
                ws[cell_address] = { t: 's', v: headerValue };
            } else {
                ws[cell_address].v = headerValue;
            }
        }

        // Apply column widths
        ws['!cols'] = columnWidths;

        const headerRange = XLSX.utils.decode_range(ws['!ref'] || "A1:I1");
        const headerRow = headerRange.s.r;

        // Style headers
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: headerRow, c: C });
          if (ws[cell_address]) {
            ws[cell_address].s = headerStyle;
          }
        }

        // Style data rows with alternating colors
        const amountColIndex = internalRowKeys.indexOf("amount");
        const dateColIndex = internalRowKeys.indexOf("date");

        for (let R = headerRow + 1; R <= headerRange.e.r; ++R) {
          const isEvenRow = (R - headerRow) % 2 === 0;
          const baseStyle = isEvenRow ? evenRowStyle : oddRowStyle;

          for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
            
            if (ws[cell_address]) {
              // Apply base row style
              ws[cell_address].s = { ...baseStyle };
              
              // Special styling for amount column
              if (C === amountColIndex) {
                ws[cell_address].t = 'n';
                ws[cell_address].s = {
                  ...currencyStyle,
                  fill: baseStyle.fill,
                  border: baseStyle.border
                };
              }
              
              // Special styling for date column
              if (C === dateColIndex) {
                const cell = ws[cell_address];
                if (cell && cell.v) {
                    const dateVal = new Date(cell.v);
                    if (!isNaN(dateVal.getTime())) {
                        const dateMs = Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate());
                        const excelDate = (dateMs / 86400000) + 25569; 
                        
                        cell.t = 'n';
                        cell.v = excelDate;
                    }
                }
                
                ws[cell_address].s = {
                  ...dateStyle,
                  fill: baseStyle.fill,
                  border: baseStyle.border
                };
              }
            }
          }
        }

        // Freeze header row
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };

        // Auto filter
        ws['!autofilter'] = { ref: XLSX.utils.encode_range(headerRange) };

        // Set row height for header
        ws['!rows'] = [{ hpx: 30 }]; // Header row height

        XLSX.utils.book_append_sheet(wb, ws, sheetName(t));
      }

      const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob(
        [wbout],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );

      const a = document.createElement("a");
      const fnameCompany = byCompany ? (companyMap.get(companyId) || companyId) : "all-companies";
      const dateSuffix = useDateRange ? `_${dateRange.from}_to_${dateRange.to}` : "";
      const filename = `transactions_${fnameCompany}${dateSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      onExported?.(totalRows);
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Export Error",
        description: err?.message || "Export failed. Check console for details.",
        variant: "destructive",
      });
      console.error("Export failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm font-medium">Select company</div>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All companies</SelectItem>
                {Array.from(companyMap.entries()).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chk-date-range"
                checked={useDateRange}
                onCheckedChange={(c) => setUseDateRange(Boolean(c))}
              />
              <Label htmlFor="chk-date-range" className="text-sm font-medium">
                Filter by date range
              </Label>
            </div>

            {useDateRange && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-date" className="text-sm">From date</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-date" className="text-sm">To date</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <div className="text-sm font-medium">Transaction types</div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chk-all"
                checked={allTypes.every(t => types[t])}
                onCheckedChange={(c) => toggleAll(Boolean(c))}
              />
              <label htmlFor="chk-all" className="text-sm">Select all</label>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {allTypes.map(t => (
                <div key={t} className="flex items-center space-x-2">
                  <Checkbox
                    id={`chk-${t}`}
                    checked={types[t]}
                    onCheckedChange={(c) => setTypes(prev => ({ ...prev, [t]: Boolean(c) }))}
                  />
                  <label htmlFor={`chk-${t}`} className="text-sm capitalize">{t}</label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleExport} disabled={busy}>
              {busy ? "Exporting…" : "Export XLSX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}