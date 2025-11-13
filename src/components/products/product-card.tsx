import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card className="flex flex-col">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-bold text-lg">
            {product.name ?? "Unnamed Product"}
          </h3>
          <Badge variant="outline">Product</Badge>
        </div>

        {/* Stocks */}
        <p className="text-sm">
          Stocks:{" "}
          <span className="font-medium">
            {product.stocks != null ? product.stocks : "N/A"}
          </span>
        </p>

        {/* HSN Code */}
        <p className="text-sm">
          HSN Code:{" "}
          <span className="font-medium">
            {product.hsn != null ? product.hsn : "N/A"}
          </span>
        </p>

        {/* Created Date */}
        <p className="text-xs text-muted-foreground mt-1">
          Created:{" "}
          {product.createdAt
            ? new Date(product.createdAt).toLocaleDateString("en-IN")
            : "—"}
        </p>
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="mt-auto border-t p-2 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name ?? "product"}`}
          title={`Edit ${product.name ?? "product"}`}
        >
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(product)}
          aria-label={`Delete ${product.name ?? "product"}`}
          title={`Delete ${product.name ?? "product"}`}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
