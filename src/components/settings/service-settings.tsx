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
  Server,
  Badge,
  Calendar,
  Eye,
  IndianRupee, // ADD THIS IMPORT
  Upload,
  Download,
  Code,
  Hash
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
import type { Company, Service } from "@/lib/types";
import { ServiceForm } from "@/components/services/service-form";

export function ServiceSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<Service | null>(
    null
  );
  const [serviceToDelete, setServiceToDelete] = React.useState<Service | null>(
    null
  );
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const role = localStorage.getItem("role");

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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

  const fetchServices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      // Assuming a /api/services endpoint exists
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
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenForm = (service: Service | null = null) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setIsAlertOpen(true);
  };

  const handleFormSuccess = (newService: Service) => {
    setIsFormOpen(false);
    const action = selectedService ? "updated" : "created";
    fetchServices();

    if (selectedService) {
      setServices((prev) =>
        prev.map((s) => (s._id === newService._id ? newService : s))
      );
    } else {
      setServices((prev) => [...prev, newService]);
    }

    toast({
      title: `Service ${action} successfully`,
      description: `The service details have been ${action}.`,
    });
    setSelectedService(null);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/services/${serviceToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete service.");
      toast({
        title: "Service Deleted",
        description: "The service has been successfully removed.",
      });
      setServices((prev) => prev.filter((s) => s._id !== serviceToDelete._id));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setServiceToDelete(null);
    }
  };

  // Import Services functionality
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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
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

      const response = await fetch(`${baseURL}/api/services/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import services");
      }

      const result = await response.json();

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.importedCount} services. ${result.errors?.length ? `${result.errors.length} errors occurred.` : ''}`,
      });

      // Refresh services list
      fetchServices();
      setIsImportDialogOpen(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Something went wrong during import.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${baseURL}/api/services/import/template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "services_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "Services import template downloaded successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download template.",
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
                    Manage Services
                  </CardTitle>
                  <CardDescription className="max-w-md">
                    A list of all your available services with their pricing.
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => handleOpenForm()}
                    className="w-full sm:w-auto"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                  </Button>
                  <Button
                    onClick={handleImportClick}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Import Services
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : services.length > 0 ? (
                <>
                  {/* ✅ Desktop / Laptop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service Name</TableHead>
                          <TableHead className="text-center">Amount</TableHead> {/* ADD THIS */}
                          <TableHead className="text-center">SAC Code</TableHead>
                          <TableHead>Created At</TableHead>
                          {role !== "user" ? (
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          ) : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((service) => (
                          <TableRow key={service._id}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                {service.serviceName}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium tabular-nums">
                              <div className="flex items-center justify-center gap-1">
                                <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                {formatCurrency(service.amount || 0)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium tabular-nums">
                              <div className="flex items-center justify-center gap-1">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                {service.sac || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Intl.DateTimeFormat("en-US").format(
                                new Date(service.createdAt!)
                              )}
                            </TableCell>
                            {role !== "user" ? (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenForm(service)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleOpenDeleteDialog(service)
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* ✅ Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {services.map((service) => (
                      <div
                        key={service._id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
                      >
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                <Server className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                {service.serviceName}
                              </h3>
                            </div>
                          </div>

                          {role !== "user" && (
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
                                  onClick={() => handleOpenForm(service)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleOpenDeleteDialog(service)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Details Section */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                          {/* Amount Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IndianRupee className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Amount
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                              {formatCurrency(service.amount || 0)}
                            </span>
                          </div>
                          
                          {/* Created Date Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Created
                              </span>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }).format(new Date(service.createdAt!))}
                            </span>
                          </div>


                           <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                               SAC Code 
                              </span>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {service.sac ? service.sac : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions for Users */}
                        {role === "user" && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => handleOpenForm(service)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                  <Server className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No Services Found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding your first service.
                  </p>
                  <Button className="mt-6" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={isFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedService(null);
              setIsFormOpen(isOpen);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedService ? "Edit Service" : "Create New Service"}
                </DialogTitle>
                <DialogDescription>
                  {selectedService
                    ? "Update the details for this service."
                    : "Fill in the form to add a new service."}
                </DialogDescription>
              </DialogHeader>
              <ServiceForm
                service={selectedService || undefined}
                onSuccess={handleFormSuccess}
                onServiceCreated={fetchServices}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  service.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteService}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Import Services Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="sm:max-w-md dark:text-gray-300">
              <DialogHeader>
                <DialogTitle>Import Services</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx, .xls) or CSV file containing services data.
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
        </>
      )}
    </>
  );
}














// "use client";

// import * as React from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Loader2,
//   MoreHorizontal,
//   Edit,
//   Trash2,
//   PlusCircle,
//   Server,
//   Badge,
//   Calendar,
//   Eye,
//    IndianRupee
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast";
// import type { Company, Service } from "@/lib/types";
// import { ServiceForm } from "@/components/services/service-form";

// export function ServiceSettings() {
//   const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
//   const [services, setServices] = React.useState<Service[]>([]);
//   const [isLoading, setIsLoading] = React.useState(true);
//   const [isFormOpen, setIsFormOpen] = React.useState(false);
//   const [isAlertOpen, setIsAlertOpen] = React.useState(false);
//   const [selectedService, setSelectedService] = React.useState<Service | null>(
//     null
//   );
//   const [serviceToDelete, setServiceToDelete] = React.useState<Service | null>(
//     null
//   );
//   const [companies, setCompanies] = React.useState<Company[]>([]);
//   const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
//   const { toast } = useToast();

//   const role = localStorage.getItem("role");
//   const formatCurrency = (amount: number) => {
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amount);
// };

//   const fetchCompanies = React.useCallback(async () => {
//     setIsLoadingCompanies(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const res = await fetch(`${baseURL}/api/companies/my`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error("Failed to fetch companies.");
//       const data = await res.json();
//       setCompanies(Array.isArray(data) ? data : data.companies || []);
//     } catch (err) {
//       // optional toast if you want
//       console.error(err);
//     } finally {
//       setIsLoadingCompanies(false);
//     }
//   }, [baseURL]);

//   React.useEffect(() => {
//     fetchCompanies();
//   }, [fetchCompanies]);

//   const fetchServices = React.useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");
//       // Assuming a /api/services endpoint exists
//       const res = await fetch(`${baseURL}/api/services`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error("Failed to fetch services.");
//       const data = await res.json();
//       setServices(Array.isArray(data) ? data : data.services || []);
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Failed to load services",
//         description:
//           error instanceof Error ? error.message : "Something went wrong.",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [toast]);

//   React.useEffect(() => {
//     fetchServices();
//   }, [fetchServices]);

//   const handleOpenForm = (service: Service | null = null) => {
//     setSelectedService(service);
//     setIsFormOpen(true);
//   };

//   const handleOpenDeleteDialog = (service: Service) => {
//     setServiceToDelete(service);
//     setIsAlertOpen(true);
//   };

//   const handleFormSuccess = (newService: Service) => {
//     setIsFormOpen(false);
//     const action = selectedService ? "updated" : "created";
// fetchServices();

//     if (selectedService) {
//       setServices((prev) =>
//         prev.map((s) => (s._id === newService._id ? newService : s))
//       );
//     } else {
//       setServices((prev) => [...prev, newService]);
//     }

//     toast({
//       title: `Service ${action} successfully`,
//       description: `The service details have been ${action}.`,
//     });
//     setSelectedService(null);
//   };

//   const handleDeleteService = async () => {
//     if (!serviceToDelete) return;
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");
//       const res = await fetch(
//         `${baseURL}/api/services/${serviceToDelete._id}`,
//         {
//           method: "DELETE",
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (!res.ok) throw new Error("Failed to delete service.");
//       toast({
//         title: "Service Deleted",
//         description: "The service has been successfully removed.",
//       });
//       setServices((prev) => prev.filter((s) => s._id !== serviceToDelete._id));
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Deletion Failed",
//         description:
//           error instanceof Error ? error.message : "Something went wrong.",
//       });
//     } finally {
//       setIsAlertOpen(false);
//       setServiceToDelete(null);
//     }
//   };

//   if (isLoadingCompanies) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="h-6 w-6 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <>
//       {companies.length === 0 ? (
//         <div className="w-full flex align-middle items-center justify-center">
//           <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg overflow-hidden">
//             <CardContent className="p-6">
//               <div className="flex flex-col items-center text-center">
//                 {/* Icon Section */}
//                 <div className="mb-5 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
//                   <svg
//                     className="w-8 h-8 text-blue-600"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m0 0V9m0 12h2"
//                     ></path>
//                   </svg>
//                 </div>

//                 {/* Text Content */}
//                 <h3 className="text-xl font-semibold text-gray-800 mb-2">
//                   Company Setup Required
//                 </h3>
//                 <p className="text-gray-600 mb-5">
//                   Contact us to enable your company account and access all
//                   features.
//                 </p>

//                 {/* Call-to-Action Button */}
//                 <div className="flex flex-col sm:flex-row gap-3 w-full">
//                   <a className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-2">
//                     <svg
//                       className="w-5 h-5"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
//                       ></path>
//                     </svg>
//                     +91-8989773689
//                   </a>
//                   <a
//                     href="mailto:support@company.com"
//                     className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
//                   >
//                     <svg
//                       className="w-5 h-5"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                       xmlns="http://www.w3.org/2000/svg"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth="2"
//                         d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                       ></path>
//                     </svg>
//                     Email Us
//                   </a>
//                 </div>

//                 {/* Support Hours */}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       ) : (
//         <>
//           <Card>
//             <CardHeader>
//               <div className="flex flex-col items-center text-center space-y-3 lg:flex-row lg:items-center lg:justify-between lg:text-left lg:space-y-0">
//                 <div>
//                   <CardTitle className="text-xl font-semibold">
//                     Manage Services
//                   </CardTitle>
//                   <CardDescription className="max-w-md">
//                     A list of all your available services.
//                   </CardDescription>
//                 </div>
//                 <Button
//                   onClick={() => handleOpenForm()}
//                   className="w-full sm:w-auto lg:w-auto"
//                 >
//                   <PlusCircle className="mr-2 h-4 w-4" /> Add Service
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {isLoading ? (
//                 <div className="flex justify-center items-center h-40">
//                   <Loader2 className="h-6 w-6 animate-spin" />
//                 </div>
//               ) : services.length > 0 ? (
//                 <>
//                   {/* ✅ Desktop / Laptop Table */}
//                   <div className="hidden md:block">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead>Service Name</TableHead>
//                           <TableHead>Created At</TableHead>
//                           {role !== "user" ? (
//                             <TableHead className="text-right">
//                               Actions
//                             </TableHead>
//                           ) : null}
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {services.map((service) => (
//                           <TableRow key={service._id}>
//                             <TableCell>
//                               <div className="font-medium flex items-center gap-2">
//                                 <Server className="h-4 w-4 text-muted-foreground" />
//                                 {service.serviceName}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               {new Intl.DateTimeFormat("en-US").format(
//                                 new Date(service.createdAt!)
//                               )}
//                             </TableCell>
//                             {role !== "user" ? (
//                               <TableCell className="text-right">
//                                 <DropdownMenu>
//                                   <DropdownMenuTrigger asChild>
//                                     <Button variant="ghost" size="icon">
//                                       <MoreHorizontal className="h-4 w-4" />
//                                     </Button>
//                                   </DropdownMenuTrigger>
//                                   <DropdownMenuContent>
//                                     <DropdownMenuItem
//                                       onClick={() => handleOpenForm(service)}
//                                     >
//                                       <Edit className="mr-2 h-4 w-4" /> Edit
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem
//                                       onClick={() =>
//                                         handleOpenDeleteDialog(service)
//                                       }
//                                       className="text-destructive"
//                                     >
//                                       <Trash2 className="mr-2 h-4 w-4" /> Delete
//                                     </DropdownMenuItem>
//                                   </DropdownMenuContent>
//                                 </DropdownMenu>
//                               </TableCell>
//                             ) : null}
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>

//                   {/* ✅ Mobile Card View */}
//                   <div className="md:hidden space-y-3">
//                     {services.map((service) => (
//                       <div
//                         key={service._id}
//                         className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
//                       >
//                         {/* Header Section */}
//                         <div className="flex justify-between items-start mb-3">
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-2 mb-2">
//                               <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
//                                 <Server className="h-4 w-4 text-teal-600 dark:text-teal-400" />
//                               </div>
//                               <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
//                                 {service.serviceName}
//                               </h3>
//                             </div>
//                           </div>

//                           {role !== "user" && (
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button
//                                   variant="ghost"
//                                   size="icon"
//                                   className="h-8 w-8"
//                                 >
//                                   <MoreHorizontal className="h-4 w-4" />
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end">
//                                 <DropdownMenuItem
//                                   onClick={() => handleOpenForm(service)}
//                                 >
//                                   <Edit className="mr-2 h-4 w-4" /> Edit
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem
//                                   onClick={() =>
//                                     handleOpenDeleteDialog(service)
//                                   }
//                                   className="text-destructive"
//                                 >
//                                   <Trash2 className="mr-2 h-4 w-4" /> Delete
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           )}
//                         </div>

//                         {/* Details Section */}
//                         <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                               <Calendar className="h-3 w-3 text-gray-400" />
//                               <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
//                                 Created
//                               </span>
//                             </div>
//                             <span className="text-sm text-gray-700 dark:text-gray-300">
//                               {new Intl.DateTimeFormat("en-US", {
//                                 year: "numeric",
//                                 month: "short",
//                                 day: "numeric",
//                               }).format(new Date(service.createdAt!))}
//                             </span>
//                           </div>
//                         </div>

//                         {/* Quick Actions for Users */}
//                         {role === "user" && (
//                           <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               className="flex-1 text-xs"
//                               onClick={() => handleOpenForm(service)}
//                             >
//                               <Eye className="h-3 w-3 mr-1" />
//                               View Details
//                             </Button>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               ) : (
//                 <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
//                   <Server className="h-12 w-12 text-muted-foreground" />
//                   <h3 className="mt-4 text-lg font-semibold">
//                     No Services Found
//                   </h3>
//                   <p className="mt-1 text-sm text-muted-foreground">
//                     Get started by adding your first service.
//                   </p>
//                   <Button className="mt-6" onClick={() => handleOpenForm()}>
//                     <PlusCircle className="mr-2 h-4 w-4" />
//                     Add Service
//                   </Button>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           <Dialog
//             open={isFormOpen}
//             onOpenChange={(isOpen) => {
//               if (!isOpen) setSelectedService(null);
//               setIsFormOpen(isOpen);
//             }}
//           >
//             <DialogContent className="sm:max-w-lg">
//               <DialogHeader>
//                 <DialogTitle>
//                   {selectedService ? "Edit Service" : "Create New Service"}
//                 </DialogTitle>
//                 <DialogDescription>
//                   {selectedService
//                     ? "Update the details for this service."
//                     : "Fill in the form to add a new service."}
//                 </DialogDescription>
//               </DialogHeader>
//               <ServiceForm
//                 service={selectedService || undefined}
//                 onSuccess={handleFormSuccess}
//                 onServiceCreated={fetchServices}
//               />
//             </DialogContent>
//           </Dialog>

//           <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
//             <AlertDialogContent>
//               <AlertDialogHeader>
//                 <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
//                 <AlertDialogDescription>
//                   This action cannot be undone. This will permanently delete the
//                   service.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>
//               <AlertDialogFooter>
//                 <AlertDialogCancel>Cancel</AlertDialogCancel>
//                 <AlertDialogAction onClick={handleDeleteService}>
//                   Continue
//                 </AlertDialogAction>
//               </AlertDialogFooter>
//             </AlertDialogContent>
//           </AlertDialog>
//         </>
//       )}
//     </>
//   );
// }
