"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Package,
  Search,
  Edit,
  PlusCircle,
  Server,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Service } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { ProductForm } from "../products/product-form";
import { usePermissions } from "@/contexts/permission-context";
import { useCompany } from "@/contexts/company-context";
import { Badge } from "../ui/badge";
import { ServiceForm } from "../services/service-form";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { capitalizeWords } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProductTableRow from "./product-table-row";
import ProductMobileCard from "./product-mobile-card";
import Link from "next/link";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

function StockEditForm({
  product,
  onSuccess,
  onCancel,
}: {
  product: Product;
  onSuccess: (updatedProduct: Product) => void;
  onCancel: () => void;
}) {
  const [newStock, setNewStock] = React.useState(product.stocks ?? 0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/products/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stocks: newStock }),
      });
      if (!res.ok) throw new Error("Failed to update stock.");
      const data = await res.json();
      toast({ title: "Stock updated successfully!" });
      onSuccess(data.product);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update stock",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock for {product.name}</Label>
          <Input
            id="stock"
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(Number(e.target.value))}
          />
        </div>
      </div>
      <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProductStock() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = React.useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = React.useState(false);

  const { toast } = useToast();
  const { permissions } = usePermissions();
  const { selectedCompanyId } = useCompany();

  const { permissions: userCaps } = useUserPermissions();

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = selectedCompanyId
        ? `${baseURL}/api/products?companyId=${selectedCompanyId}`
        : `${baseURL}/api/products?companyId=${selectedCompanyId}`;

      const res = await fetch(url, {
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
      setIsLoading(false);
    }
  }, [toast, selectedCompanyId]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSuccess = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
    );
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleAddProductSuccess = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    setIsAddProductOpen(false);
    toast({
      title: "Product Created!",
      description: `${capitalizeWords(newProduct.name)} added.`,
    });
    fetchProducts(); // Refetch to ensure instant visibility
  };
  const [openNameDialog, setOpenNameDialog] = useState<string | null>(null);

  const handleAddServiceSuccess = (newService: Service) => {
    const serviceAsProduct: Product = {
      _id: newService._id,
      name: newService.serviceName,
      type: "service",
      stocks: 0,
      createdByClient: newService.createdByClient,
      price: undefined,
    };

    setProducts((prev) => [...prev, serviceAsProduct]);
    setIsAddServiceOpen(false);
    toast({
      title: "Service Created!",
      description: `${capitalizeWords(newService.serviceName)} added.`,
    });
    fetchProducts(); // Refetch to ensure instant visibility
  };

  // const filteredProducts = products.filter((p) =>
  //   p.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  if (
    !permissions?.canCreateProducts &&
    !userCaps?.canCreateInventory &&
    (permissions?.maxInventories ?? 0) === 0
  ) {
    return null;
  }

  const role = localStorage.getItem("role");

  return (
    <>
      <Card className="rounded-2xl md:rounded-xl shadow-none md:shadow-lg border-0 md:border">
        <CardHeader className="px-4 py-5 sm:px-6 bg-muted/20 rounded-t-lg border-b ">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Product & Service Stock
              </CardTitle>
              <CardDescription className="mt-2 text-sm sm:text-base">
                Current inventory levels and management
              </CardDescription>
            </div>
            {(permissions?.canCreateProducts ||
              userCaps?.canCreateInventory) && (
              <div className="flex flex-row justify-center sm:justify-end items-center gap-3 w-full sm:w-auto">
                {/* Add Product */}
                <Dialog
                  open={isAddProductOpen}
                  onOpenChange={setIsAddProductOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 rounded-full px-5 shadow-sm sm:rounded-lg sm:px-4 bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
                      onClick={() => setIsAddProductOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      <span className="font-medium sm:inline">Product</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-h-[80vh] md:max-h-[100vh] overflow-auto sm:max-w-lg rounded-lg">
                    <DialogHeader className="space-y-2">
                      <DialogTitle className="text-xl font-bold">
                        Create New Product
                      </DialogTitle>
                      <DialogDescription>
                        Fill in the form to add a new product to your inventory.
                      </DialogDescription>
                    </DialogHeader>
                    <ProductForm onSuccess={handleAddProductSuccess} />
                  </DialogContent>
                </Dialog>

                {/* Add Service */}
                <Dialog
                  open={isAddServiceOpen}
                  onOpenChange={setIsAddServiceOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-full px-5 shadow-sm sm:rounded-lg sm:px-4 border border-border hover:bg-accent transition-all duration-200 hover:shadow-md"
                      onClick={() => setIsAddServiceOpen(true)}
                    >
                      <Server className="h-4 w-4 mr-2" />
                      <span className="font-medium sm:inline">Service</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-h-[80vh] md:max-h-[100vh] overflow-auto sm:max-w-lg rounded-lg">
                    <DialogHeader className="space-y-2">
                      <DialogTitle className="text-xl font-bold">
                        Create New Service
                      </DialogTitle>
                      <DialogDescription>
                        Fill in the form to add a new service to your offerings.
                      </DialogDescription>
                    </DialogHeader>
                    <ServiceForm onSuccess={handleAddServiceSuccess} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:px-6 sm:py-5">
          {/* Search Bar */}
          <div className="relative mb-6 w-full px-4 md:px-0 mt-3">
            <Search className="absolute left-8 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or services..."
              className="pl-9 py-6 sm:py-2 rounded-xl border border-border bg-background focus:bg-background transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Items List */}
          <div className="px-4 sm:px-0">
            <ScrollArea className="h-[calc(100vh-320px)] sm:h-80 rounded-none sm:rounded-lg border-0 sm:border border-border">
              {isLoading ? (
                <div className="flex flex-col justify-center items-center h-full space-y-3 py-12">
                  <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-primary" />
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Loading inventory...
                  </p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/50">
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="py-4 font-semibold text-foreground">
                            Item
                          </TableHead>
                          <TableHead className="py-4 font-semibold text-foreground">
                            Stock
                          </TableHead>
                          <TableHead className="py-4 font-semibold text-foreground">
                            Unit
                          </TableHead>
                          {role !== "user" && (
                            <TableHead className="py-4 text-right font-semibold text-foreground pr-8">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* {filteredProducts.map((product) => (
                          <TableRow
                            key={product._id}
                            className="group hover:bg-muted/20 transition-colors duration-150 border-b border-border"
                          >
                            <TableCell className="py-4 max-w-[240px]">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${
                                    product.type === "service"
                                      ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
                                      : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                                  }`}
                                >
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
                                        onClick={() =>
                                          setOpenNameDialog(product.name)
                                        }
                                        className="font-medium text-foreground truncate text-left max-w-[400px] hover:underline"
                                      >
                                        {capitalizeWords(product.name)}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="bottom"
                                      className="max-w-[300px] whitespace-normal break-words"
                                    >
                                      {product.name}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {product.type === "service" && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                                  >
                                    Service
                                  </Badge>
                                )}
                              </div>

                             
                              <Dialog
                                open={openNameDialog === product.name}
                                onOpenChange={() => setOpenNameDialog(null)}
                              >
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
                                <span className="text-muted-foreground text-sm">
                                  N/A
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-bold text-lg ${
                                      (product.stocks ?? 0) > 10
                                        ? "text-green-600 dark:text-green-400"
                                        : (product.stocks ?? 0) > 0
                                        ? "text-orange-600 dark:text-orange-400"
                                        : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {product.stocks ?? 0}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              {product.type === "service" ? (
                                <span className="text-muted-foreground text-sm">
                                  N/A
                                </span>
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
                                  onClick={() => handleEditClick(product)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span className="font-medium">
                                    Edit Stock
                                  </span>
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))} */}
                        {filteredProducts.slice(0,4).map((product) => (
  <ProductTableRow
    key={product._id}
    product={product}
    onEditClick={handleEditClick}
  />
))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 pb-4">

                    {/* {filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="rounded-xl bg-card p-4 shadow-sm transition-all duration-200 border border-border hover:shadow-md"
                      >
                        
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              product.type === "service"
                                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
                                : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                            }`}
                          >
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
                              <Badge
                                variant="secondary"
                                className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 px-2 py-0.5 text-[10px] h-5"
                              >
                                Service
                              </Badge>
                            )}
                          </div>

                          {product.type !== "service" && (
                            <div className="text-right flex-shrink-0">
                              <div
                                className={`text-lg font-bold leading-tight ${
                                  (product.stocks ?? 0) > 10
                                    ? "text-green-600 dark:text-green-400"
                                    : (product.stocks ?? 0) > 0
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {product.stocks ?? 0}
                              </div>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {product.unit ?? "units"}
                              </span>
                            </div>
                          )}
                        </div>

                       
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
                            {(product.stocks ?? 0) > 0 &&
                              (product.stocks ?? 0) <= 10 && (
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

                        
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          {role !== "user" && product.type !== "service" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-xs px-3 border-border text-foreground hover:bg-accent transition-colors duration-200"
                              onClick={() => handleEditClick(product)}
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
                    ))} */}
                    {filteredProducts.slice(0,4).map((product) => (
  <ProductMobileCard
    key={product._id}
    product={product}
    onEditClick={handleEditClick}
  />
))}

                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="rounded-full bg-muted/30 p-4 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    No Items Found
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-[280px]">
                    {searchTerm
                      ? `No items match "${searchTerm}". Try a different search term.`
                      : "Get started by adding your first product or service."}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
          {filteredProducts.length > 3 && (
            <div className="px-4 sm:px-0 mt-4 flex justify-end">
              <Link href="/inventory">
                <Button variant="outline" className="flex items-center gap-2">
                  View More
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Edit Stock
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update the stock quantity for the selected product.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <StockEditForm
              product={selectedProduct}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProductStock;
