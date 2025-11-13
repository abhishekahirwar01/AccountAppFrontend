"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Package, Server } from "lucide-react";
import { Product } from "@/lib/types";
import { capitalizeWords } from "@/lib/utils";

// This is just your existing mobile card code moved to a separate file
const ProductMobileCard = React.memo(({ product, onEditClick }: {
  product: Product;
  onEditClick: (product: Product) => void;
}) => {
  const role = localStorage.getItem("role");

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm transition-all duration-200 border border-border hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
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

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">
            {capitalizeWords(product.name)}
          </h3>
          {product.type === "service" && (
            <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 px-2 py-0.5 text-[10px] h-5">
              Service
            </Badge>
          )}
        </div>

        {product.type !== "service" && (
          <div className="text-right flex-shrink-0">
            <div className={`text-lg font-bold leading-tight ${
              (product.stocks ?? 0) > 10
                ? "text-green-600 dark:text-green-400"
                : (product.stocks ?? 0) > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {product.stocks ?? 0}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {product.unit ?? "units"}
            </span>
          </div>
        )}
      </div>

      {/* Stock Status Badge */}
      {product.type !== "service" && (
        <div className="mb-3">
          {(product.stocks ?? 0) === 0 && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
              <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                Out of Stock
              </span>
            </div>
          )}
          {(product.stocks ?? 0) > 0 && (product.stocks ?? 0) <= 10 && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></div>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                Low Stock
              </span>
            </div>
          )}
          {(product.stocks ?? 0) > 10 && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                In Stock
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {role !== "user" && product.type !== "service" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs px-3 border-border text-foreground hover:bg-accent transition-colors duration-200"
            onClick={() => onEditClick(product)}
          >
            <Edit className="h-3 w-3 mr-1.5" />
            Edit Stock
          </Button>
        )}

        {product?.price && (
          <div className="ml-auto text-right">
            <div className="text-sm font-semibold text-foreground">
              ${product.price}
            </div>
            <span className="text-[10px] text-muted-foreground">
              per unit
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductMobileCard;