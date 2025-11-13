"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Building,
  Check,
  X,
  FileText,
  Hash,
  BadgeIndianRupee,
  Phone,
  Mail,
  IdCard,
  Building2,
  MapPin,
  Settings,
  Settings2,
  Edit2,
  Settings2Icon,
  Percent,
  Upload,
  Download,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@/hooks/use-toast";
import type { Company, Vendor } from "@/lib/types";
import { VendorForm } from "@/components/vendors/vendor-form";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { capitalizeWords } from "@/lib/utils";

export function VendorSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(
    null
  );
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const [vendorToDelete, setVendorToDelete] = React.useState<Vendor | null>(
    null
  );
  const { toast } = useToast();
  const [expandedVendorId, setExpandedVendorId] = React.useState<string | null>(
    null
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const role = localStorage.getItem("role");
  const isCustomer = role === "customer";

  // Permission checks
  const { permissions: userCaps } = useUserPermissions();
  const canShowVendors = !!userCaps?.canShowVendors || isCustomer;
  const canCreateVendors = !!userCaps?.canCreateVendors || isCustomer;

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

  // 1) add this useEffect
  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch vendors.");
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load vendors",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleOpenForm = (vendor: Vendor | null = null) => {
    setSelectedVendor(vendor);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsAlertOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchVendors();
    const action = selectedVendor ? "updated" : "created";
    toast({
      title: `Vendor ${action} successfully`,
      description: `The vendor details have been ${action}.`,
    });
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/vendors/${vendorToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete vendor.");
      toast({
        title: "Vendor Deleted",
        description: "The vendor has been successfully removed.",
      });
      fetchVendors();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setVendorToDelete(null);
    }
  };

  // Import Vendors functionality
  const handleImportClick = () => {
    setIsImportDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
        });
        return;
      }
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload an Excel file (.xlsx, .xls) or CSV file.",
      });
      return;
    }

    setIsImporting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${baseURL}/api/vendors/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import vendors");
      }

      const result = await response.json();

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.importedCount} vendors. ${
          result.errors?.length
            ? `${result.errors.length} errors occurred.`
            : ""
        }`,
      });

      // Refresh vendors list
      fetchVendors();
      setIsImportDialogOpen(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong during import.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${baseURL}/api/vendors/import/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vendor_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "Vendor import template downloaded successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download template.",
      });
    }
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {companies.length === 0 ? (
        <div className="w-full flex align-middle items-center justify-center">
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
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center text-center space-y-3 lg:flex-row lg:items-center lg:justify-between lg:text-left lg:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Manage Vendors
                  </CardTitle>
                  <CardDescription className="max-w-md">
                    A list of all your vendors and suppliers.
                  </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {canCreateVendors && (
                    <>
                      <Button
                        onClick={() => handleOpenForm()}
                        className="w-full sm:w-auto"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
                      </Button>
                      <Button
                        onClick={handleImportClick}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Import Vendors
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !canShowVendors && !canCreateVendors ? (
                // No permissions - don't show anything
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                  <Building className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Access Restricted
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You don't have permission to view or manage vendors.
                  </p>
                </div>
              ) : vendors.length > 0 && canShowVendors ? (
                <>
                  {/* ✅ Desktop / Laptop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor Details</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Tax Information</TableHead>
                          <TableHead>TDS</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendors.map((vendor) => (
                          <TableRow key={vendor._id}>
                            <TableCell>
                              <div className="font-medium">
                                {capitalizeWords(vendor.vendorName)}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {vendor.contactNumber || "N/A"}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {vendor.email || ""}
                              </div>
                            </TableCell>
                            <TableCell>
                              {vendor.address ? (
                                <div className="text-sm">{vendor.address}</div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Address not available
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {vendor.city &&
                                  vendor.state &&
                                  `${vendor.city}, ${vendor.state}`}
                                {vendor.city && !vendor.state && vendor.city}
                                {!vendor.city && vendor.state && vendor.state}
                                {!vendor.city &&
                                  !vendor.state &&
                                  vendor.address &&
                                  "Location not available"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-xs">
                                  GSTIN: {vendor.gstin || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-xs">
                                  PAN: {vendor.pan || "N/A"}
                                </span>
                              </div>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {vendor.gstRegistrationType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full",
                                    vendor.isTDSApplicable
                                      ? "bg-green-100 dark:bg-green-900/50"
                                      : "bg-red-100 dark:bg-red-900/50"
                                  )}
                                >
                                  {vendor.isTDSApplicable ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                {vendor.isTDSApplicable && (
                                  <div className="text-xs text-muted-foreground">
                                    {vendor.tdsSection}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenForm(vendor)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenDeleteDialog(vendor)
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* ✅ Mobile Card View */}
                  {/* ✅ Mobile / Tablet Card View */}
                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {vendors.map((vendor) => (
                      <div
                        key={vendor._id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
                      >
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                              {capitalizeWords(vendor.vendorName)}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {vendor.gstRegistrationType}
                              </Badge>
                              <div
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-full text-[12px]",
                                  vendor.isTDSApplicable
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                )}
                              >
                                {vendor.isTDSApplicable ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>
                                  TDS{" "}
                                  {vendor.isTDSApplicable
                                    ? "Applicable"
                                    : "Not Applicable"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleOpenForm(vendor)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteDialog(vendor)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-3 mb-4">
                          {(vendor.contactNumber || vendor.email) && (
                            <div className="flex flex-col items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              {vendor.contactNumber && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-blue-500" />
                                  <span className="text-[12px] text-gray-700 dark:text-gray-300">
                                    {vendor.contactNumber}
                                  </span>
                                </div>
                              )}
                              {vendor.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-purple-500" />
                                  <span className="text-[12px] text-gray-700 dark:text-gray-300 truncate">
                                    {vendor.email}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Address */}
                          {(vendor.address || vendor.city || vendor.state) && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {vendor.address}
                                </p>
                                {(vendor.city || vendor.state) && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {[vendor.city, vendor.state]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Tax Information */}
                        {/* Tax Information - Only show if GSTIN or PAN exists */}
                        {(vendor.gstin || vendor.pan) && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                            <h4 className="font-medium text-sm text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Tax Information
                            </h4>
                            <div className="space-y-2">
                              {vendor.gstin && (
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    GSTIN:
                                  </span>
                                  <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                                    {vendor.gstin}
                                  </span>
                                </div>
                              )}
                              {vendor.pan && (
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    PAN:
                                  </span>
                                  <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                                    {vendor.pan}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TDS Details */}
                        {vendor.isTDSApplicable && vendor.tdsSection && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                TDS Section:
                              </span>
                              <span className="text-sm text-green-700 dark:text-green-400">
                                {vendor.tdsSection}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : vendors.length > 0 && !canShowVendors && canCreateVendors ? (
                // Can create but not view - show blurred overlay
                <div className="relative">
                  {/* Blurred vendor content */}
                  <div className="filter blur-sm pointer-events-none opacity-60">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor Details</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Tax Information</TableHead>
                            <TableHead>TDS</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendors.slice(0, 3).map((vendor) => (
                            <TableRow key={vendor._id}>
                              <TableCell>
                                <div className="font-medium">
                                  {capitalizeWords(vendor.vendorName)}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {capitalizeWords(vendor.contactNumber || "N/A")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{vendor.address}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-xs">
                                  GSTIN: {vendor.gstin || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  {vendor.isTDSApplicable
                                    ? "Applicable"
                                    : "Not Applicable"}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" disabled>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                      {vendors.slice(0, 2).map((vendor) => (
                        <div
                          key={vendor._id}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {capitalizeWords(vendor.vendorName)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {vendor.contactNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Glass overlay with create button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg">
                    <div className="text-center">
                      <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Vendor Management
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md">
                        You can create vendors, but viewing existing vendor
                        details requires additional permissions.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                  <Building className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No Vendors Found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding your first vendor.
                  </p>
                  {canCreateVendors && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-6">
                      <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Vendor
                      </Button>
                      <Button onClick={handleImportClick} variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Vendors
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="md:max-w-2xl max-w-sm grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
              <DialogHeader className="p-6">
                <DialogTitle>
                  {selectedVendor ? "Edit Vendor" : "Create New Vendor"}
                </DialogTitle>
                <DialogDescription>
                  {selectedVendor
                    ? "Update the details for this vendor."
                    : "Fill in the form to add a new vendor."}
                </DialogDescription>
              </DialogHeader>
              <VendorForm
                vendor={selectedVendor || undefined}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>

          {/* Import Vendors Dialog */}
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogContent className="sm:max-w-md dark:text-gray-300">
              <DialogHeader>
                <DialogTitle>Import Vendors</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx, .xls) or CSV file containing
                  vendor data.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2 dark:text-gray-300">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    variant={isImporting ? "secondary" : "default"}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {isImporting ? "Uploading..." : "Select File"}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 dark:text-gray-300">
                    Download the template file to ensure proper formatting.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  vendor.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteVendor}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
