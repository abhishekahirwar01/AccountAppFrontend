"use client";

import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Package, Server } from "lucide-react";
import { Product } from "@/lib/types";
import { capitalizeWords } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// This is just your existing table row code moved to a separate file
const ProductTableRow = React.memo(({ product, onEditClick }: { 
  product: Product; 
  onEditClick: (product: Product) => void 
}) => {
  const [openNameDialog, setOpenNameDialog] = useState<string | null>(null);
  const role = localStorage.getItem("role");

  return (
    <TableRow className="group hover:bg-muted/20 transition-colors duration-150 border-b border-border">
      <TableCell className="py-4 max-w-[240px]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            product.type === "service"
              ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
              : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
          }`}>
            {product.type === "service" ? (
              <Server className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOpenNameDialog(product.name)}
                  className="font-medium text-foreground truncate text-left max-w-[400px] hover:underline"
                >
                  {capitalizeWords(product.name)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px] whitespace-normal break-words">
                {product.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {product.type === "service" && (
            <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
              Service
            </Badge>
          )}
        </div>

        <Dialog open={openNameDialog === product.name} onOpenChange={() => setOpenNameDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Product Name</DialogTitle>
            </DialogHeader>
            <p className="text-gray-800 dark:text-gray-200 break-words">
              {capitalizeWords(product.name)}
            </p>
          </DialogContent>
        </Dialog>
      </TableCell>

      <TableCell className="py-4">
        {product.type === "service" ? (
          <span className="text-muted-foreground text-sm">N/A</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${
              (product.stocks ?? 0) > 10
                ? "text-green-600 dark:text-green-400"
                : (product.stocks ?? 0) > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {product.stocks ?? 0}
            </span>
          </div>
        )}
      </TableCell>

      <TableCell className="py-4">
        {product.type === "service" ? (
          <span className="text-muted-foreground text-sm">N/A</span>
        ) : (
          <span className="font-medium text-foreground">
            {product.unit ?? "NA"}
          </span>
        )}
      </TableCell>

      {role !== "user" && (
        <TableCell className="py-4 text-right">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-md hover:bg-accent hover:text-foreground transition-colors duration-200"
            onClick={() => onEditClick(product)}
          >
            <Edit className="h-4 w-4 mr-2" />
            <span className="font-medium">Edit Stock</span>
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
});

export default ProductTableRow;