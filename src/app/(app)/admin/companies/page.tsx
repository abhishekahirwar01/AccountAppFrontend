"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Building,
  Edit,
  Trash2,
  List,
  LayoutGrid,
  Loader2,
  User,
  Phone,
  Hash,
  FileText as FileTextIcon,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCompanyForm } from "@/components/companies/admin-company-form";
import type { Company, Client } from "@/lib/types";
import { CompanyCard } from "@/components/companies/company-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { capitalizeWords } from "@/lib/utils";


export default function AdminCompaniesPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL as string;
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(
    null
  );
  const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<"card" | "list">("list");
  const { toast } = useToast();
  const [token, setToken] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
  }, []);

  // Check if user is master admin
  // if (role !== "masterAdmin") {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
  //       <div className="text-center">
  //         <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
  //         <p className="text-muted-foreground">
  //           You don't have permission to access this page. Only master admins can manage all companies.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }



  const fetchAllData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // if (!token) throw new Error("Authentication token not found.");

    const [companiesRes, clientsRes] = await Promise.all([
      fetch(`${baseURL}/api/companies/all`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${baseURL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

      if (!companiesRes.ok || !clientsRes.ok) {
        const errorData = !companiesRes.ok
          ? await companiesRes.json()
          : await clientsRes.json();
        throw new Error(errorData.message || "Failed to fetch data.");
      }

      const companiesData = await companiesRes.json();
      const clientsData = await clientsRes.json();

      setCompanies(companiesData.reverse());
      setClients(clientsData);
    } catch (error) {
      // toast({
      //   variant: "destructive",
      //   title: "Failed to load data",
      //   description:
      //     error instanceof Error ? error.message : "Something went wrong.",
      // });
    } finally {
      setIsLoading(false);
    }
  }, [toast, baseURL, token]);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddNew = () => {
    setSelectedCompany(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `${baseURL}/api/companies/${companyToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete company.");
      }
      toast({
        title: "Company Deleted",
        description: `${companyToDelete.businessName} has been successfully deleted.`,
      });
      fetchAllData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setCompanyToDelete(null);
    }
  };

  const onFormSubmit = () => {
    setIsDialogOpen(false);
    fetchAllData();
  };

  const getClientInfo = (clientIdentifier: string | Client | undefined) => {
    if (!clientIdentifier) return { name: "N/A", email: "N/A" };

    let clientId: string;
    if (
      typeof clientIdentifier === "object" &&
      clientIdentifier !== null &&
      "contactName" in clientIdentifier
    ) {
      return {
        name: clientIdentifier.contactName,
        email: clientIdentifier.email || "N/A",
      };
    } else if (
      typeof clientIdentifier === "object" &&
      clientIdentifier !== null &&
      typeof (clientIdentifier as Client)._id === "string"
    ) {
      clientId = (clientIdentifier as Client)._id;
    } else {
      clientId = String(clientIdentifier);
    }

    const client = clients.find((c) => String(c._id) === clientId);
    return {
      name: client?.contactName || "N/A",
      email: client?.email || "N/A",
    };
  };
  const renderCardGrid = (gridClass = "grid grid-cols-1 gap-4") => (
    <div className={gridClass}>
      {companies.map((company) => (
        <CompanyCard
          key={company._id}
          company={company}
          clientName={
            getClientInfo(company.selectedClient || company.client).name
          }
          onEdit={() => handleEdit(company)}
          onDelete={() => handleDelete(company)}
        />
      ))}
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Company Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage all companies across all clients.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* View mode toggle - hidden on small screens if not needed */}
          {/* <div className="hidden sm:flex items-center gap-1 rounded-md bg-secondary p-1">

      <Button
        variant={viewMode === "card" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setViewMode("card")}
        className="h-8 w-8"
        aria-label="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setViewMode("list")}
        className="h-8 w-8"
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div> */}

          <Button onClick={handleAddNew} size="sm" className="sm:w-auto">
            <PlusCircle className="mr-0 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Create Company</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="md:max-w-4xl max-w-sm  grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
          <DialogHeader className="p-6">
            <DialogTitle>
              {selectedCompany ? "Edit Company" : "Create New Company"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? `Update the details for ${selectedCompany.businessName}.`
                : "Fill in the form to create a new company for a client."}
            </DialogDescription>
          </DialogHeader>
          <AdminCompanyForm
            company={selectedCompany || undefined}
            clients={clients}
            onFormSubmit={onFormSubmit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company and all associated data for{" "}
              {companyToDelete?.businessName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length > 0 ? (
          <>
            {/* 💻 Desktop View */}
            <div className="hidden sm:block">
              {viewMode === "card" ? (
                renderCardGrid("grid gap-6 md:grid-cols-1 lg:grid-cols-2")
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-300 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-700">
                          <TableHead className="text-black dark:text-white">
                            Company
                          </TableHead>
                          <TableHead className="text-black dark:text-white">
                            Assigned Client
                          </TableHead>
                          <TableHead className="text-black dark:text-white">
                            Owner & Contact
                          </TableHead>
                          <TableHead className="text-black dark:text-white">
                            Identifiers
                          </TableHead>
                          <TableHead className="text-right dark:text-white">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((company) => {
                          const clientInfo = getClientInfo(
                            company.selectedClient || company.client
                          );
                          return (
                            <TableRow
                              key={company._id}
                              className="transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-800"
                            >
                              <TableCell>
                                <div className="font-semibold dark:text-white">
                                  {capitalizeWords(company.businessName)}
                                </div>
                                <div className="text-xs text-muted-foreground dark:text-gray-400">
                                  {company.businessType}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium dark:text-white">
                                  {capitalizeWords(clientInfo.name)}
                                </div>
                                <div className="text-xs text-muted-foreground dark:text-gray-400">
                                  {clientInfo.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-green-900 dark:text-green-400" />
                                  <span className="text-sm text-green-800 dark:text-green-300">
                                    {company.mobileNumber}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 mb-1">
                                  <Hash className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                  <span className="text-sm font-mono bg-secondary px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-200">
                                    {company.registrationNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileTextIcon className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                  <span className="text-sm font-mono bg-secondary px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-200">
                                    {company.gstin || "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(company)}
                                  className="bg-blue-500 hover:bg-blue-700 text-white transition-colors dark:bg-blue-600 dark:hover:bg-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleDelete(company)}
                                  className="bg-red-400 hover:bg-red-700 text-white transition-colors dark:bg-red-600 dark:hover:bg-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 📱 Mobile view */}
            <div className="sm:hidden space-y-4 pt-4">
              {companies.map((company) => {
                const clientInfo = getClientInfo(
                  company.selectedClient || company.client
                );

                return (
                  <Card key={company._id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 border-b">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate text-gray-900 dark:text-white">
                              {capitalizeWords(company.businessName)}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {company.businessType}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="flex-shrink-0 ml-2"
                          >
                            Client
                          </Badge>
                        </div>
                      </div>

                      {/* Company Details */}
                      <div className="p-4 space-y-3">
                        {/* Assigned Client */}
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0 mt-0.5">
                            <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Assigned Client
                            </p>
                            <p className="text-sm font-medium truncate dark:text-white">
                              {clientInfo.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {clientInfo.email}
                            </p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 flex-shrink-0">
                            <Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Contact
                            </p>
                            <p className="text-sm font-medium dark:text-white">
                              {company.mobileNumber}
                            </p>
                          </div>
                        </div>

                        {/* Identifiers - Horizontal Layout */}
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 flex-shrink-0">
                                <Hash className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                Registration
                              </p>
                            </div>
                            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate w-full">
                              {company.registrationNumber}
                            </p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50 flex-shrink-0">
                                <FileTextIcon className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                GSTIN
                              </p>
                            </div>
                            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate w-full">
                              {company.gstin || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="border-t bg-gray-50 dark:bg-gray-800/50 p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(company)}
                            className=" flex items-center justify-center gap-1 text-xs py-2"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleDelete(company)}
                            className="flex items-center justify-center gap-1 text-xs py-2 bg-red-700 hover:bg-red-800 text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 border-dashed">
            <Building className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Companies Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating the first company.
            </p>
            <Button className="mt-6" onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Company
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
