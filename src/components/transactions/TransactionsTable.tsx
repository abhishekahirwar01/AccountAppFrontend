"use client";

import * as React from "react";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "./columns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

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

interface TransactionsTableProps {
  data: Transaction[];
  onPreview: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onViewItems: (tx: Transaction) => void;
  onSendInvoice: (tx: Transaction) => void;
  companyMap: Map<string, string>;
  serviceNameById: Map<string, string>;
  hideActions?: boolean;
}

export function TransactionsTable({
  data,
  onPreview,
  onEdit,
  onDelete,
  onViewItems,
  onSendInvoice,
  companyMap,
  serviceNameById,
  hideActions = false,
}: TransactionsTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    // 📱 Mobile Card View
    return (
      <div className="space-y-4">
        {data.map((tx) => {
          const party =
            (tx.party as any)?.name || (tx.vendor as any)?.vendorName || "N/A";
          const companyId =
            typeof tx.company === "object" && tx.company !== null
              ? (tx.company as any)._id
              : tx.company ?? null;

          const companyName = companyId
            ? companyMap.get(companyId as string) ?? "N/A"
            : "N/A";

          const showViewItems = tx.type === "sales" || tx.type === "purchases";
          return (
            <Card key={tx._id} className="rounded-xl shadow">
              <CardContent className="p-4 space-y-3">
                {/* Party + Description */}
                <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">{party}</div>
                  <p className="text-sm text-muted-foreground">
                    {tx.description || tx.narration || ""}
                  </p>
                </div>

                 {/* View Items Button */}
                  {showViewItems && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewItems(tx)}
                  className="ml-2 p-2 h-8 w-8"
                  title="View items"
                >
                 <Package className="h-4 w-4" />
                </Button>
                 )}
                </div>
                 

                {/* Company */}
                <div className="text-sm">
                  <span className="font-medium">Company: </span>
                  {companyName || "N/A"}
                </div>

                {/* Amount + Date */}

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground">
                    Amount
                  </span>
                  <span className="font-bold text-green-600">
                    ₹
                    {new Intl.NumberFormat("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(
                      Number(tx.totalAmount ?? (tx as any).amount ?? 0)
                    )}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-muted-foreground">
                    Date
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(tx.date))}
                  </span>
                </div>

                {/* Type */}
                <Badge
                  className={cn(
                    tx.type === "sales" && "bg-green-100 text-green-800 border-green-200",
                    tx.type === "purchases" && "bg-blue-100 text-blue-800 border-blue-200",
                    tx.type === "receipt" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                    tx.type === "payment" && "bg-red-100 text-red-800 border-red-200",
                    tx.type === "journal" && "bg-purple-100 text-purple-800 border-purple-200"
                  )}
                >
                  {tx.type}
                </Badge>

                {/* Actions */}
                {!hideActions && (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPreview(tx)}
                          disabled={tx.type !== "sales"}
                        >
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(tx)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(tx)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // 🖥 Desktop Table View
  return (
    <DataTable
      data={data}
      columns={columns({
        onPreview,
        onEdit,
        onDelete,
        onViewItems,
        onSendInvoice,
        companyMap,
        serviceNameById,
        hideActions,
      })}
    />
  );
}
