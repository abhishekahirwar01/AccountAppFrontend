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
  Package,
  Mail,
  MapPin,
  Phone,
  User,
  Upload,
  Download
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
import { BankDetailsForm } from "../bankdetails/bankdetail-form";
import { capitalizeWords } from "@/lib/utils";

interface BankDetail {
  _id: string;
  client: string;
  company: string; // This should be the company ID
  bankName: string;
  managerName: string;
  contactNumber: string;
  email: string;
  city: string;
  accountNo: string;
  ifscCode?: string;
  branchAddress?: string;
  upiDetails?: {
    upiId?: string;
    upiName?: string;
    upiMobile?: string;
  };
}

export function BankSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [bankDetails, setBankDetails] = React.useState<BankDetail[]>([]);
  const [filteredBankDetails, setFilteredBankDetails] = React.useState<
    BankDetail[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedBankDetail, setSelectedBankDetail] =
    React.useState<BankDetail | null>(null);

  const [bankDetailToDelete, setBankDetailToDelete] =
    React.useState<BankDetail | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedBankDetailForDetails, setSelectedBankDetailForDetails] = React.useState<BankDetail | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Function to get user's company ID from token
  const getUserCompanyId = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.companyId || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // In your BankSettings component, update the fetchBankDetails function:
  // Fetch bank details
  const fetchBankDetails = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch bank details.");

      const data = await res.json();
      const allBankDetails = data.data || data || [];

      // Get user's company ID and filter bank details
      const userCompanyId = getUserCompanyId();

      if (userCompanyId) {
        // Filter bank details to show only those from the user's company
        const userBankDetails = allBankDetails.filter(
          (detail: BankDetail) => detail.company === userCompanyId
        );
        setBankDetails(userBankDetails);
        setFilteredBankDetails(userBankDetails);
      } else {
        // If no company ID found, show all (fallback)
        setBankDetails(allBankDetails);
        setFilteredBankDetails(allBankDetails);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load bank details",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [baseURL, toast]);

  React.useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  // Open form for creating or editing a bank detail
  const handleOpenForm = (bankDetail: BankDetail | null = null) => {
    setSelectedBankDetail(bankDetail);
    setIsFormOpen(true);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (bankDetail: BankDetail) => {
    setBankDetailToDelete(bankDetail);
    setIsAlertOpen(true);
  };

  // Open full details dialog
  const handleOpenDetailsDialog = (bankDetail: BankDetail) => {
    setSelectedBankDetailForDetails(bankDetail);
    setIsDetailsDialogOpen(true);
  };

  // Form submission success handler
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchBankDetails();
    const action = selectedBankDetail ? "updated" : "created";
    toast({
      title: `Bank Detail ${action} successfully`,
      description: `The bank detail has been ${action}.`,
    });
    setSelectedBankDetail(null);
  };

  // Delete bank detail
  const handleDeleteBankDetail = async () => {
    if (!bankDetailToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/bank-details/${bankDetailToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete bank detail.");
      toast({
        title: "Bank Detail Deleted",
        description: "The bank detail has been successfully removed.",
      });
      fetchBankDetails();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setBankDetailToDelete(null);
    }
  };



  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center text-center space-y-3 lg:flex-row lg:items-center lg:justify-between lg:text-left lg:space-y-0">
            <div>
              <CardTitle className="text-xl font-semibold">
                Manage Bank Details
              </CardTitle>
              <CardDescription className="max-w-md">
                A list of all your bank details.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleOpenForm()}
                className="w-full sm:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Details
              </Button>
            
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredBankDetails.length > 0 ? (
            <>
              {/* ✅ Desktop / Laptop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bank Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      {/* <TableHead>Manager Name</TableHead> */}
                      {/* <TableHead>Contact Number</TableHead>
                      <TableHead>Email</TableHead> */}
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankDetails.map((bankDetail) => (
                      <TableRow key={bankDetail._id}>
                        <TableCell>{capitalizeWords(bankDetail.bankName)}</TableCell>
                        <TableCell>{bankDetail.accountNo}</TableCell>
                        {/* <TableCell>{capitalizeWords(bankDetail.managerName)}</TableCell>
                        <TableCell>{bankDetail.contactNumber}</TableCell>
                        <TableCell>{bankDetail.email}</TableCell> */}
                        <TableCell>{bankDetail.branchAddress}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleOpenDetailsDialog(bankDetail)}
                              >
                                <Package className="mr-2 h-4 w-4" /> View Full Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenForm(bankDetail)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleOpenDeleteDialog(bankDetail)
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
<div className="md:hidden space-y-4">
  {bankDetails.map((bankDetail) => (
    <div
      key={bankDetail._id}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
            {capitalizeWords(bankDetail.bankName)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Account: {bankDetail.accountNo}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenDetailsDialog(bankDetail)}>
              <Package className="mr-2 h-4 w-4" /> View Full Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenForm(bankDetail)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(bankDetail)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-4 grid">
        {/* Manager Name */}
        {/* <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Manager</p>
            <p className="text-sm text-gray-900 dark:text-white">{capitalizeWords(bankDetail.managerName)}</p>
          </div>
        </div>

        {/* Contact Number */}
        {/* {bankDetail.contactNumber && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Contact</p>
              <p className="text-sm text-gray-900 dark:text-white">{bankDetail.contactNumber}</p>
            </div>
          </div>
        )} */}

        {/* Email */}
        {/* {bankDetail.email && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm text-gray-900 dark:text-white truncate">{bankDetail.email}</p>
            </div>
          </div>
          )} */}

        {/* Address */}
        {bankDetail.branchAddress && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Branch Address</p>
              <p className="text-sm text-gray-900 dark:text-white">{bankDetail.branchAddress}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  ))}
</div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
              <Package className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No Bank Details Found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first bank detail.
              </p>
              <Button className="mt-6" onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Bank Details
              </Button>
            </div>
          )}
        </CardContent>

      </Card>

      {/* Bank Detail Form Modal */}
      <div>
        <Dialog
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedBankDetail(null);
            setIsFormOpen(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-[60vw]">
            <DialogHeader>
              <DialogTitle>
                {selectedBankDetail
                  ? "Edit Bank Detail"
                  : "Create New Bank Detail"}
              </DialogTitle>
              <DialogDescription>
                {selectedBankDetail
                  ? "Update the details for this bank."
                  : "Fill in the form to add a new bank detail."}
              </DialogDescription>
            </DialogHeader>

            <BankDetailsForm
              bankDetail={selectedBankDetail || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

     

      {/* Full Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bank Details - {selectedBankDetailForDetails ? capitalizeWords(selectedBankDetailForDetails.bankName) : ''}</DialogTitle>
            <DialogDescription>
              Complete information for this bank account.
            </DialogDescription>
          </DialogHeader>

          {selectedBankDetailForDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="text-sm text-gray-900 dark:text-white">{capitalizeWords(selectedBankDetailForDetails.bankName)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Number</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.accountNo}</p>
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-gray-500">Manager Name</label>
                  <p className="text-sm text-gray-900 dark:text-white">{capitalizeWords(selectedBankDetailForDetails.managerName)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.contactNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.email || 'N/A'}</p>
                </div> */}
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.ifscCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Branch Address</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.branchAddress || 'N/A'}</p>
                </div>
              </div>

              {selectedBankDetailForDetails.upiDetails && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">UPI Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">UPI ID</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.upiDetails.upiId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">UPI Name</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.upiDetails.upiName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">UPI Mobile</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedBankDetailForDetails.upiDetails.upiMobile || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              bank detail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBankDetail}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
