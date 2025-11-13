"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  PlusCircle,
  Package,
  Server,
  Hash,
  BarChart3,
  Copy,
  IndianRupee
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Company, Product, Service } from "@/lib/types";
import { ProductForm } from "@/components/products/product-form";
// ⬇️ import your real ServiceForm
import { ServiceForm } from "@/components/services/service-form";
import { usePermissions } from "@/contexts/permission-context";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExcelImportExport } from "@/components/ui/excel-import-export";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function InventoryPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { permissions: userCaps, isLoading } = useUserPermissions();
  // Lists
  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);

  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);

  // Dialog states: product
  const [isProductFormOpen, setIsProductFormOpen] = React.useState(false);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(
    null
  );
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(
    null
  );
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);

  // Dialog states: service
  const [isServiceFormOpen, setIsServiceFormOpen] = React.useState(false);
  const [serviceToEdit, setServiceToEdit] = React.useState<Service | null>(
    null
  );
  const [serviceToDelete, setServiceToDelete] = React.useState<Service | null>(
    null
  );
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);

  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const { toast } = useToast();
  const { permissions } = usePermissions();
  const [openNameDialog, setOpenNameDialog] = useState<string | null>(null);

  const role = localStorage.getItem("role");

  const fetchCompanies = React.useCallback(async () => {
    setIsLoadingCompanies(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/companies/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch companies.");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : data.companies || []);
    } catch (err) {
      // optional toast if you want
      console.error(err);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [baseURL]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Fetchers
  const fetchProducts = React.useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products.");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load products",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [toast, baseURL]);

  const fetchServices = React.useCallback(async () => {
    setIsLoadingServices(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch services.");
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data.services || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load services",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, [toast, baseURL]);

  React.useEffect(() => {
    fetchProducts();
    fetchServices();
  }, [fetchProducts, fetchServices]);

  // Open forms
  const openCreateProduct = () => {
    setProductToEdit(null);
    setIsProductFormOpen(true);
  };
  const openCreateService = () => {
    setServiceToEdit(null);
    setIsServiceFormOpen(true);
  };
  const openEditProduct = (p: Product) => {
    setProductToEdit(p);
    setIsProductFormOpen(true);
  };
  const openEditService = (s: Service) => {
    setServiceToEdit(s);
    setIsServiceFormOpen(true);
  };

  // Success callbacks
  const onProductSaved = (saved: Product) => {
    setIsProductFormOpen(false);
    setProductToEdit(null);
    setProducts((prev) =>
      prev.some((p) => p._id === saved._id)
        ? prev.map((p) => (p._id === saved._id ? saved : p))
        : [saved, ...prev]
    );
    toast({
      title: "Product saved",
      description: "Product has been saved successfully.",
    });
  };

  const onServiceSaved = (saved: Service) => {
    setIsServiceFormOpen(false);
    setServiceToEdit(null);
    setServices((prev) =>
      prev.some((s) => s._id === saved._id)
        ? prev.map((s) => (s._id === saved._id ? saved : s))
        : [saved, ...prev]
    );
    toast({
      title: "Service saved",
      description: "Service has been saved successfully.",
    });
  };

  // Delete handlers
  const confirmDeleteProduct = (p: Product) => {
    setProductToDelete(p);
    setServiceToDelete(null);
    setIsAlertOpen(true);
  };
  const confirmDeleteService = (s: Service) => {
    setServiceToDelete(s);
    setProductToDelete(null);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      if (productToDelete) {
        const res = await fetch(
          `${baseURL}/api/products/${productToDelete._id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to delete product.");
        setProducts((prev) =>
          prev.filter((p) => p._id !== productToDelete._id)
        );
        toast({ title: "Product deleted" });
      } else if (serviceToDelete) {
        const res = await fetch(
          `${baseURL}/api/services/${serviceToDelete._id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to delete service.");
        setServices((prev) =>
          prev.filter((s) => s._id !== serviceToDelete._id)
        );
        toast({ title: "Service deleted" });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setProductToDelete(null);
      setServiceToDelete(null);
    }
  };

   const formatCurrencyINR = (value?: number | string | null): string => {
  if (value === null || value === undefined || value === "") return "₹0.00";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0.00";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};
const handleSelectProduct = (productId: string, checked: boolean, index?: number, shiftKey?: boolean) => {
  if (shiftKey && lastSelectedIndex !== null && index !== undefined) {
    // Range selection with Shift+Click
    const startIndex = Math.min(lastSelectedIndex, index);
    const endIndex = Math.max(lastSelectedIndex, index);
    const rangeIds = products.slice(startIndex, endIndex + 1).map(p => p._id);

    if (checked) {
      setSelectedProducts(prev => [...new Set([...prev, ...rangeIds])]);
    } else {
      setSelectedProducts(prev => prev.filter(id => !rangeIds.includes(id)));
    }
    
    // Update last selected index to the current click
    setLastSelectedIndex(index);
  } else {
    // Single selection
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId]);
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
    // Update last selected index for future shift+click operations
    setLastSelectedIndex(index ?? null);
  }
};

const handleCheckboxChange = (productId: string, checked: boolean, index: number, event?: React.MouseEvent) => {
  const shiftKey = event?.shiftKey || false;
  handleSelectProduct(productId, checked, index, shiftKey);
};

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/products/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (!res.ok) throw new Error("Failed to delete products.");

      toast({
        title: "Products Deleted",
        description: `${selectedProducts.length} products have been successfully removed.`,
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Bulk Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  // Render helpers
  const renderProductsTable = () => {
    if (isLoadingProducts) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first product to get started.
          </p>
          {(permissions?.canCreateProducts || userCaps?.canCreateInventory) && (
            <Button className="mt-6" onClick={openCreateProduct}>
              <PlusCircle className="mr-2 h-4 w-4 " />
              Add Product
            </Button>
          )}
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {/* Table View for Larger Screens */}
        <div className="hidden sm:block">
          {/* Bulk Delete Button */}
          {selectedProducts.length > 0 && role !== "user" && (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={handleBulkDeleteProducts}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete ({selectedProducts.length})
              </Button>
            </div>
          )}
          {/* Table Component */}
         <Table>
  <TableHeader>
    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-gray-800 dark:to-gray-900/80 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 border-b-2 border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {role !== "user" && (
        <TableHead className="w-12 px-4 py-4">
          <Checkbox
            checked={selectedProducts.length === products.length && products.length > 0}
            onCheckedChange={handleSelectAllProducts}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 transition-colors duration-200"
          />
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide w-164">
                  Product Details
                </TableHead>
                <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-right">
                  Price
                </TableHead>
                <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-center">
                  Stock
                </TableHead>
                <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-center">
                  Unit
                </TableHead>
                <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-center">
                  HSN
                </TableHead>
                <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                  Created Date
                </TableHead>
                {role !== "user" && (
                  <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-right">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p, index) => (
                <TableRow
                  key={p._id}
                  className={cn(
                    "group border-b border-gray-100/50 dark:border-gray-700/50 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20",
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900/50"
                      : "bg-gray-50/30 dark:bg-gray-800/30"
                  )}
                >
                  {role !== "user" && (
                    <TableCell className="px-4 py-4">
                      <Checkbox
                        checked={selectedProducts.includes(p._id)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(p._id, checked as boolean, index)
                        }
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 transition-colors duration-200"
                      />
                    </TableCell>
                  )}

                  {/* Product Details */}
                 <TableCell className="px-4 py-4 max-w-[240px]">
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-800 dark:to-blue-900 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      <Package className="h-4 w-4 text-white" />
    </div>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpenNameDialog(p.name)}
            className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate text-left max-w-[260px] hover:underline"
            // title={p.name}
          >
            {p.name}
          </button>
        </TooltipTrigger>
        <TooltipContent
                 side="bottom"
                 className="max-w-[300px] whitespace-normal break-words"
               >
                 {p.name}
               </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

  {/* Full name modal */}
  <Dialog open={openNameDialog === p.name} onOpenChange={() => setOpenNameDialog(null)}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Product Name</DialogTitle>
      </DialogHeader>
      <p className="text-gray-800 dark:text-gray-200 break-words">{p.name}</p>
    </DialogContent>
  </Dialog>
</TableCell>

                <TableCell className="px-4 py-4 text-right">
  <div className="flex flex-col items-end">
    <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">
      {p.sellingPrice ? formatCurrencyINR(p.sellingPrice) : "-"}
    </span>
  </div>
</TableCell>

                  {/* Stock */}
                  <TableCell className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10",
                          (p.stocks ?? 0) > 10
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : (p.stocks ?? 0) > 0
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            (p.stocks ?? 0) > 10
                              ? "bg-green-500 dark:bg-green-400"
                              : (p.stocks ?? 0) > 0
                              ? "bg-yellow-500 dark:bg-yellow-400"
                              : "bg-red-500 dark:bg-red-400"
                          )}
                        />
                        {p.stocks ?? 0} in stock
                      </div>
                      {(p.stocks ?? 0) <= 10 && (p.stocks ?? 0) > 0 && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                          Low stock
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Unit */}
                  <TableCell className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-sm font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10">
                      {p.unit ?? "Piece"}
                    </span>
                  </TableCell>

                  {/* HSN */}
                  <TableCell className="px-4 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10",
                        p.hsn
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {p.hsn ? (
                        <>
                          <Hash className="h-3 w-3 mr-1" />
                          {p.hsn}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </TableCell>

                  {/* Created At */}
                  <TableCell className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {p.createdAt
                          ? new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(new Date(p.createdAt))
                          : "—"}
                      </span>
                      {p.createdAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Intl.DateTimeFormat("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(p.createdAt))}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  {role !== "user" && (
                    <TableCell className="px-4 py-4 text-right">
                      <div className="flex justify-end items-center space-x-1 opacity-70 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditProduct(p)}
                          className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteProduct(p)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - Cards  product */}
        <div className="sm:hidden space-y-3">
          {/* Mobile Select All */}
          {role !== "user" && products.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <Checkbox
                checked={
                  selectedProducts.length === products.length &&
                  products.length > 0
                }
                onCheckedChange={handleSelectAllProducts}
              />
              <span className="text-sm font-medium">
                Select All ({products.length} items)
              </span>
              {selectedProducts.length > 0 && (
                <Button
                  onClick={handleBulkDeleteProducts}
                  variant="destructive"
                  size="sm"
                  className="ml-auto gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete ({selectedProducts.length})
                </Button>
              )}
            </div>
          )}
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              {/* Header Section */}
              {role !== "user" && (
                <Checkbox
                  checked={selectedProducts.includes(p._id)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(p._id, checked as boolean, products.indexOf(p))
                  }
                />
              )}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white truncate max-w-[140px]">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Created:{" "}
                        {p.createdAt
                          ? new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(p.createdAt))
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stock and Selling Price */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Stock
                    </span>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`text-lg font-bold ${
                          (p.stocks ?? 0) > 10
                            ? "text-green-600 dark:text-green-400"
                            : (p.stocks ?? 0) > 0
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {p.stocks ?? 0}
                      </span>
                      <span className="font-bold text-sm">
                        {p.unit ?? "Piece"}
                      </span>
                    </div>
                    {(p.stocks ?? 0) <= 10 && (p.stocks ?? 0) > 0 && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                        Low stock
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Selling Price
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {p.sellingPrice ?? "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* hsn   */}

              <div className="flex gap-4 items-start align-middle text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  HSN
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {p.hsn ?? "N/A"}
                </span>
              </div>

              {/* Action Buttons */}
              {role !== "user" && (
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditProduct(p)}
                    className="h-8 px-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDeleteProduct(p)}
                    className="h-8 px-3 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1 text-red-400" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderServicesTable = () => {
    if (isLoadingServices) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    if (services.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
          <Server className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Services Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first service to get started.
          </p>
          {(permissions?.canCreateProducts || userCaps?.canCreateInventory) && (
            <Button className="mt-6" onClick={openCreateService}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          )}
        </div>
      );
    }
    // return (
    //   <div className="space-y-6">
    //     {/* //mobile view  */}
    //     <div className="sm:hidden space-y-3">
    //       {services.map((s) => (
    //         <div
    //           key={s._id}
    //           className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
    //         >
    //           {/* Header Section */}
    //           <div className="flex justify-between items-start mb-3">
    //             <div className="flex items-center gap-2">
    //               <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
    //                 <Server className="h-4 w-4 text-teal-600 dark:text-teal-400" />
    //               </div>
    //               <div>
    //                 <h3 className="font-semibold text-gray-800 dark:text-white truncate max-w-[140px]">
    //                   {s.serviceName}
    //                 </h3>
    //                 <div className="flex items-center gap-2 mt-1">
    //                   <span className="text-xs text-gray-500 dark:text-gray-400">
    //                     Created:{" "}
    //                     {s.createdAt
    //                       ? new Intl.DateTimeFormat("en-US", {
    //                           year: "numeric",
    //                           month: "short",
    //                           day: "numeric",
    //                         }).format(new Date(s.createdAt))
    //                       : "—"}
    //                   </span>
    //                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
    //                     Service
    //                   </span>
    //                 </div>
    //               </div>
    //             </div>
    //           </div>

    //           {/* sac   */}

    //           <div className="flex gap-4 items-start align-middle text-center">
    //             <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
    //               SAC
    //             </span>
    //             <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
    //               {s.sac ?? "N/A"}
    //             </span>
    //           </div>

    //           {/* Action Buttons */}
    //           <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
    //             <Button
    //               variant="ghost"
    //               size="sm"
    //               onClick={() => openEditService(s)}
    //               className="h-8 px-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
    //             >
    //               <Edit className="h-3.5 w-3.5 mr-1" />
    //               Edit
    //             </Button>
    //             <Button
    //               variant="ghost"
    //               size="sm"
    //               onClick={() => confirmDeleteService(s)}
    //               className="h-8 px-3 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    //             >
    //               <Trash2 className="h-3.5 w-3.5 mr-1 text-red-400" />
    //             </Button>
    //           </div>
    //         </div>
    //       ))}
    //     </div>

    //     <div className="hidden sm:block">
    //       <Table>
    //         <TableHeader>
    //           <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-gray-800 dark:to-gray-900/80 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 border-b-2 border-gray-200 dark:border-gray-700 transition-colors duration-200">
    //             <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
    //               Service
    //             </TableHead>
    //             <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
    //               SAC
    //             </TableHead>
    //             <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
    //               Created At
    //             </TableHead>
    //             <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-right">
    //               Actions
    //             </TableHead>
    //           </TableRow>
    //         </TableHeader>
    //         <TableBody>
    //           {services.map((s, index) => (
    //             <TableRow
    //               key={s._id}
    //               className={cn(
    //                 "group border-b border-gray-100/50 dark:border-gray-700/50 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20",
    //                 index % 2 === 0
    //                   ? "bg-white dark:bg-gray-900/50"
    //                   : "bg-gray-50/30 dark:bg-gray-800/30"
    //               )}
    //             >
    //               <TableCell className="px-4 py-4">
    //                 <div className="font-medium flex items-center gap-3">
    //                   <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-800 dark:to-purple-900 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-black/5 dark:ring-white/10">
    //                     <Server className="h-3 w-3 text-white" />
    //                   </div>
    //                   <div className="flex items-center gap-2">
    //                     <span className="text-gray-900 dark:text-gray-100">
    //                       {s.serviceName}
    //                     </span>
    //                     <Badge
    //                       variant="outline"
    //                       className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs font-medium px-2 py-0"
    //                     >
    //                       Service
    //                     </Badge>
    //                   </div>
    //                 </div>
    //               </TableCell>
    //               <TableCell className="px-4 py-4">
    //                 <div className="font-medium">
    //                   <span
    //                     className={cn(
    //                       "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10",
    //                       s.sac
    //                         ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    //                         : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
    //                     )}
    //                   >
    //                     {s.sac ? (
    //                       <>
    //                         <Hash className="h-3 w-3 mr-1" />
    //                         {s.sac}
    //                       </>
    //                     ) : (
    //                       "N/A"
    //                     )}
    //                   </span>
    //                 </div>
    //               </TableCell>
    //               <TableCell className="px-4 py-4">
    //                 <div className="flex flex-col">
    //                   <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
    //                     {s.createdAt
    //                       ? new Intl.DateTimeFormat("en-US", {
    //                           month: "short",
    //                           day: "numeric",
    //                           year: "numeric",
    //                         }).format(new Date(s.createdAt))
    //                       : "—"}
    //                   </span>
    //                   {s.createdAt && (
    //                     <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
    //                       {new Intl.DateTimeFormat("en-US", {
    //                         hour: "2-digit",
    //                         minute: "2-digit",
    //                       }).format(new Date(s.createdAt))}
    //                     </span>
    //                   )}
    //                 </div>
    //               </TableCell>
    //               <TableCell className="px-4 py-4 text-right">
    //                 <div className="flex justify-end items-center space-x-1 opacity-70 group-hover:opacity-100 transition-all duration-200">
    //                   <Button
    //                     variant="ghost"
    //                     size="icon"
    //                     onClick={() => openEditService(s)}
    //                     className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
    //                   >
    //                     <Edit className="h-4 w-4" />
    //                   </Button>
    //                   <Button
    //                     variant="ghost"
    //                     size="icon"
    //                     onClick={() => confirmDeleteService(s)}
    //                     className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
    //                   >
    //                     <Trash2 className="h-4 w-4" />
    //                   </Button>
    //                 </div>
    //               </TableCell>
    //             </TableRow>
    //           ))}
    //         </TableBody>
    //       </Table>
    //     </div>
    //   </div>
    // );
  
    return (
  <div className="space-y-6">
    {/* //mobile view  */}
    <div className="sm:hidden space-y-3">
      {services.map((s) => (
        <div
          key={s._id}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
          {/* Header Section */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Server className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white truncate max-w-[140px]">
                  {s.serviceName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Created:{" "}
                    {s.createdAt
                      ? new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(s.createdAt))
                      : "—"}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                    Service
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-2 mb-3">
            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Amount
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                {(s.amount || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            
            {/* SAC */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                SAC
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {s.sac ?? "N/A"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditService(s)}
              className="h-8 px-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => confirmDeleteService(s)}
              className="h-8 px-3 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1 text-red-400" />
            </Button>
          </div>
        </div>
      ))}
    </div>

    <div className="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-gray-800 dark:to-gray-900/80 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 border-b-2 border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
              Service
            </TableHead>
            <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-center">
              Amount
            </TableHead>
            <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
              SAC
            </TableHead>
            <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
              Created At
            </TableHead>
            <TableHead className="px-4 py-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s, index) => (
            <TableRow
              key={s._id}
              className={cn(
                "group border-b border-gray-100/50 dark:border-gray-700/50 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20",
                index % 2 === 0
                  ? "bg-white dark:bg-gray-900/50"
                  : "bg-gray-50/30 dark:bg-gray-800/30"
              )}
            >
              <TableCell className="px-4 py-4">
                <div className="font-medium flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-800 dark:to-purple-900 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    <Server className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-gray-100">
                      {s.serviceName}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs font-medium px-2 py-0"
                    >
                      Service
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 text-center font-medium tabular-nums">
                <div className="flex items-center justify-center gap-1">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  {(s.amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </TableCell>
              <TableCell className="px-4 py-4">
                <div className="font-medium">
                  <span
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10",
                      s.sac
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    )}
                  >
                    {s.sac ? (
                      <>
                        <Hash className="h-3 w-3 mr-1" />
                        {s.sac}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {s.createdAt
                      ? new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(s.createdAt))
                      : "—"}
                  </span>
                  {s.createdAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Intl.DateTimeFormat("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(s.createdAt))}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 text-right">
                <div className="flex justify-end items-center space-x-1 opacity-70 group-hover:opacity-100 transition-all duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditService(s)}
                    className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDeleteService(s)}
                    className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
  
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // console.log("userCaps?.canCreateInventory", userCaps?.canCreateInventory);
  // console.log("permissions?.canCreateProducts", permissions?.canCreateProducts);
  // console.log("userCaps?.canCreateSaleEntries", userCaps?.canCreateSaleEntries);

  return (
    <div className="space-y-6">
      {companies.length === 0 ? (
        <div className="h-[80vh] w-full flex align-middle items-center justify-center">
          <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Icon Section */}
                <div className="mb-5 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m0 0V9m0 12h2"
                    ></path>
                  </svg>
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Company Setup Required
                </h3>
                <p className="text-gray-600 mb-5">
                  Contact us to enable your company account and access all
                  features.
                </p>

                {/* Call-to-Action Button */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                    +91-8989773689
                  </a>
                  <a
                    href="mailto:support@company.com"
                    className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Email Us
                  </a>
                </div>

                {/* Support Hours */}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {/* Content Section */}
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl font-bold tracking-tight">
                Inventory Management
              </h2>
              <p className="text-muted-foreground">
                Track and manage your products and services.
              </p>
            </div>

            {/* Buttons Section */}
            <div className="flex  sm:flex-row gap-3 sm:gap-3 items-start sm:items-center">
              <ExcelImportExport
                templateData={[
                  { "Item Name": "", Stock: "", Unit: "", "Selling Price": "", HSN: "" },
                ]}
                templateFileName="product_template.xlsx"
                importEndpoint={`${baseURL}/api/products`}
                onImportSuccess={fetchProducts}
                expectedColumns={[
                  "Item Name",
                  "Stock",
                  "Unit",
                  "Selling Price",
                  "HSN",
                ]}
                transformImportData={(data) =>
                  data.map((item: any) => ({
                    name: item["Item Name"],
                    stocks: item["Stock"],
                    unit: item["Unit"],
                    sellingPrice: item["Selling Price"],
                    hsn: item["HSN"],
                  }))
                }
              />

              {/* Add Item Buttons */}
              {(permissions?.canCreateProducts ||
                userCaps?.canCreateInventory) && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={openCreateProduct}
                    className="w-full md:w-auto text-xs lg:text-sm"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                  <Button
                    onClick={openCreateService}
                    className="w-full md:w-auto text-xs lg:text-sm"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="products" className="w-full">
                <div className="px-4 pt-4 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="products">
                      Products ({products.length})
                    </TabsTrigger>
                    <TabsTrigger value="services">
                      Services ({services.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="products" className="p-4 pt-2">
                  {renderProductsTable()}
                </TabsContent>

                <TabsContent value="services" className="p-4 pt-2">
                  {renderServicesTable()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Product Form */}
          <Dialog
            open={isProductFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setProductToEdit(null);
              setIsProductFormOpen(isOpen);
            }}
          >
            <DialogContent className="w-full  max-h-[80vh] md:max-h-[100vh] overflow-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {productToEdit ? "Edit Product" : "Create New Product"}
                </DialogTitle>
                <DialogDescription>
                  {productToEdit
                    ? "Update the product details."
                    : "Fill in the form to add a new product."}
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                product={productToEdit || undefined}
                onSuccess={onProductSaved}
              />
            </DialogContent>
          </Dialog>

          {/* Service Form */}
          <Dialog
            open={isServiceFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setServiceToEdit(null);
              setIsServiceFormOpen(isOpen);
            }}
          >
            <DialogContent className="w-full  max-h-[80vh] md:max-h-[100vh] overflow-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {serviceToEdit ? "Edit Service" : "Create New Service"}
                </DialogTitle>
                <DialogDescription>
                  {serviceToEdit
                    ? "Update the service details."
                    : "Fill in the form to add a new service."}
                </DialogDescription>
              </DialogHeader>
              <ServiceForm
                service={serviceToEdit || undefined}
                onSuccess={onServiceSaved}
              />
            </DialogContent>
          </Dialog>

          {/* Shared delete confirm (knows which one is set) */}
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the{" "}
                  {productToDelete ? "product" : "service"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
