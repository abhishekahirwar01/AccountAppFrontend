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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  List,
  LayoutGrid,
  Edit,
  Loader2,
  Trash2,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Check,
  X,
  Building,
  Users,
  Filter,
  Save,
  Package,
  MessageSquare,
  Send,
  Contact,
  Store,
  Copy,
  ExternalLink,
  User,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { ClientCard } from "@/components/clients/client-card";
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import type { Client } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { IoIosKey } from "react-icons/io";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { capitalizeWords, cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const getAppOrigin = () =>
  process.env.NEXT_PUBLIC_APP_ORIGIN ||
  (typeof window !== "undefined" ? window.location.origin : "");

const getAppLoginUrl = (slug?: string) =>
  slug ? `${getAppOrigin()}/client-login/${slug}` : "";

// NOTE: Your backend login route is /api/clients/:slug/login (include "clients")
const getApiLoginUrl = (slug?: string, base = "") =>
  slug ? `${base}/api/clients/${slug}/login` : "";

export default function ClientManagementPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [viewMode, setViewMode] = React.useState<"card" | "list">("card");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(
    null
  );
  const [clients, setClients] = React.useState<Client[]>([]);
  const [clientToResetPassword, setClientToResetPassword] =
    React.useState<Client | null>(null);

  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] =
    React.useState(false);

  const [clientForPermissions, setClientForPermissions] =
    React.useState<Client | null>(null);
  const [currentPermissions, setCurrentPermissions] = React.useState<
    Partial<AllowedPermissions>
  >({});
  const [isSavingPermissions, setIsSavingPermissions] = React.useState(false);

  const [newPassword, setNewPassword] = React.useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [eyeOpen, setEyeOpen] = React.useState(false);

  const [contactNameFilter, setContactNameFilter] = React.useState("");
  const [usernameFilter, setUsernameFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const fetchClients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const res = await fetch(`${baseURL}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch clients.");
      }
      const data = await res.json();
      // Sort clients by creation date (newest first)
      const sortedClients = data.sort((a: Client, b: Client) => {
        // Use createdAt field if available, otherwise fallback to _id or other timestamp
        const dateA = new Date(a.createdAt || a._id || 0).getTime();
        const dateB = new Date(b.createdAt || b._id || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setClients(sortedClients);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load clients",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/clients/${clientToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete client.");
      }

      toast({
        title: "Client Deleted",
        description: `${clientToDelete.contactName} has been successfully deleted.`,
      });

      setClients(clients.filter((c) => c._id !== clientToDelete._id));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setClientToDelete(null);
    }
  };

  const handleResetPassword = (client: Client) => {
    setClientToResetPassword(client);
    setIsResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!clientToResetPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "New password cannot be empty.",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `${baseURL}/api/clients/reset-password/${clientToResetPassword._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newpassword: newPassword }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password.");
      }

      toast({
        title: "Password Reset Successful",
        description: `Password for ${clientToResetPassword.contactName} has been updated.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmittingPassword(false);
      setNewPassword("");
      setIsResetPasswordDialogOpen(false);
      setClientToResetPassword(null);
    }
  };

  const handleManagePermissions = async (client: Client) => {
    setClientForPermissions(client);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/clients/${client._id}/permissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // console.log("Fetch PErmissions :", data);
        setCurrentPermissions({
          maxCompanies: data.maxCompanies,
          maxUsers: data.maxUsers,
          maxInventories: data.maxInventories,
          canSendInvoiceEmail: data.canSendInvoiceEmail,
          canSendInvoiceWhatsapp: data.canSendInvoiceWhatsapp,
          canCreateUsers: data.canCreateUsers,
          canCreateCustomers: data.canCreateCustomers,
          canCreateVendors: data.canCreateVendors,
          canCreateProducts: data.canCreateProducts,
          canCreateCompanies: data.canCreateCompanies,
          canUpdateCompanies: data.canUpdateCompanies,
        });
      } else {
        // Fallback to client data if permissions are not explicitly set
        setCurrentPermissions({
          maxCompanies: client.maxCompanies || 5,
          maxUsers: client.maxUsers || 10,
          maxInventories: client.maxInventories || 50,
          canSendInvoiceEmail: client.canSendInvoiceEmail || false,
          canSendInvoiceWhatsapp: client.canSendInvoiceWhatsapp || false,
          canCreateUsers: client.canCreateUsers || true,
          canCreateCustomers: client.canCreateCustomers || true,
          canCreateVendors: client.canCreateVendors || true,
          canCreateProducts: client.canCreateProducts || true,
          canCreateCompanies: client.canCreateCompanies || false,
          canUpdateCompanies: client.canUpdateCompanies || false,
        });
      }
    } catch (error) {
      // Fallback in case of network error etc.
      setCurrentPermissions({
        maxCompanies: client.maxCompanies || 5,
        maxUsers: client.maxUsers || 10,
        maxInventories: client.maxInventories || 50,
        canSendInvoiceEmail: client.canSendInvoiceEmail || false,
        canSendInvoiceWhatsapp: client.canSendInvoiceWhatsapp || false,
        canCreateUsers: client.canCreateUsers || true,
        canCreateCustomers: client.canCreateCustomers || true,
        canCreateVendors: client.canCreateVendors || true,
        canCreateProducts: client.canCreateProducts || true,
        canCreateCompanies: client.canCreateCompanies || false,
        canUpdateCompanies: client.canUpdateCompanies || false,
      });
    }
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionChange = (
    field: keyof AllowedPermissions,
    value: any
  ) => {
    setCurrentPermissions((prev) => ({ ...prev, [field]: value }));
  };

  type AllowedPermissions = {
    maxCompanies?: number;
    maxUsers?: number;
    maxInventories?: number;
    canSendInvoiceEmail?: boolean;
    canSendInvoiceWhatsapp?: boolean;
    canCreateUsers?: boolean;
    canCreateCustomers?: boolean;
    canCreateVendors?: boolean;
    canCreateProducts?: boolean;
    // ⬇️ add these
    canCreateCompanies?: boolean;
    canUpdateCompanies?: boolean;
  };

  const {
    maxCompanies,
    maxUsers,
    maxInventories,
    canSendInvoiceEmail,
    canSendInvoiceWhatsapp,
    canCreateUsers,
    canCreateCustomers,
    canCreateVendors,
    canCreateProducts,
    // ⬇️ add these
    canCreateCompanies,
    canUpdateCompanies,
  } = currentPermissions as AllowedPermissions;

  const payload: AllowedPermissions = {
    maxCompanies,
    maxUsers,
    maxInventories,
    canSendInvoiceEmail,
    canSendInvoiceWhatsapp,
    canCreateUsers,
    canCreateCustomers,
    canCreateVendors,
    canCreateProducts,
    // ⬇️ add these
    canCreateCompanies,
    canUpdateCompanies,
  };

  const handleSavePermissions = async () => {
    if (!clientForPermissions) return;
    setIsSavingPermissions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/clients/${clientForPermissions._id}/permissions`,

        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update permissions.");
      }

      await fetchClients(); // Refresh client list
      toast({
        title: "Permissions Updated",
        description: `Permissions for ${clientForPermissions.contactName} have been saved.`,
      });
      setIsPermissionsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  };

  const onFormSubmit = () => {
    setIsDialogOpen(false);
    fetchClients();
  };

  const filteredClients = React.useMemo(() => {
    let filtered = clients;
    if (contactNameFilter) {
      filtered = filtered.filter(
        (client) => client.contactName === contactNameFilter
      );
    }
    if (usernameFilter) {
      filtered = filtered.filter(
        (client) => client.clientUsername === usernameFilter
      );
    }
    return filtered;
  }, [clients, contactNameFilter, usernameFilter]);

  const contactNameOptions = React.useMemo(() => {
    return clients.map((client) => ({
      value: client.contactName,
      label: client.contactName,
    }));
  }, [clients]);

  const usernameOptions = React.useMemo(() => {
    return clients.map((client) => ({
      value: client.clientUsername,
      label: client.clientUsername,
    }));
  }, [clients]);

  const handleClearFilters = () => {
    setContactNameFilter("");
    setUsernameFilter("");
  };

  const clientLoginUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/client-login`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(clientLoginUrl);
      setCopied(true);
      toast({
        title: "URL copied to clipboard!",
        description: "Share this link with your users for login.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy URL",
        description: "Please copy the URL manually.",
      });
    }
  };

  return (
    <div className="space-y-6  ">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Client Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your clients and their accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-md bg-secondary p-1">
            <Button
              variant={viewMode === "card" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 dark:bg-gray-900 border-blue-200 dark:border-gray-900 p-4 rounded-xl">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            Client Login URL
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-300 break-all bg-blue-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            {clientLoginUrl}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="bg-white dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-600 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-gray-600"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4 mr-1" />
          ) : (
            <Copy className="h-4 w-4 mr-1" />
          )}
          {copied ? "Copied!" : "Copy URL"}
        </Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="
      md:max-w-4xl ,
      max-w-sm    
      grid-rows-[auto,1fr,auto]
      p-0 rounded-xl
    "
        >
          <DialogHeader className="p-4 sm:p-6 sticky top-0 z-10 bg-background border-b flex flex-row items-center justify-between text-start">
            <div>
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl">
                {selectedClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {selectedClient
                  ? `Update the details for ${selectedClient.contactName}.`
                  : "Fill in the form below to add a new client."}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <ClientForm
            client={selectedClient || undefined}
            onFormSubmit={onFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent
          className="
      w-[95vw] sm:w-[80vw] lg:w-[500px]   /* 📱full width, 📟medium, 💻fixed */
      max-h-[90vh] overflow-y-auto
      rounded-xl p-4 sm:p-6
    "
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base text-gray-600">
              This action cannot be undone. This will permanently delete the
              client account and all associated data for{" "}
              <span className="font-semibold">
                {clientToDelete?.contactName}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <DialogContent
          className="
      w-[95vw] sm:w-[80vw] lg:w-[500px]    /* 📱 Mobile full, 📟 Tablet wide, 💻 Desktop compact */
      max-h-[90vh] overflow-y-auto
      rounded-xl p-4 sm:p-6
    "
        >
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Enter a new password for{" "}
              <span className="font-semibold">
                {clientToResetPassword?.contactName}
              </span>
              . They will be notified of this change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={eyeOpen ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setEyeOpen((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
                >
                  {eyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResetPassword}
              disabled={isSubmittingPassword}
              className="w-full sm:w-auto"
            >
              {isSubmittingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* permissions dialogue */}
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogOverlay className="fixed inset-0 bg-black/50 flex items-center justify-center p-2"></DialogOverlay>
        <DialogContent
          className="
    w-[calc(100vw-2rem)]          
    sm:w-[calc(100vw-4rem)]       
    md:w-auto                     
    max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl
    max-h-[85svh] md:max-h-[90vh] 
    overflow-y-auto              
  "
        >
          <DialogHeader className="space-y-2 text-center sm:text-left">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold break-words">
              Manage Permissions for {clientForPermissions?.contactName}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Modify usage limits and feature access for this client.
            </DialogDescription>
          </DialogHeader>
          {clientForPermissions && (
            <div className="grid gap-6 py-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-secondary/50">
                  <CardTitle className="text-base">
                    Feature Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className="
                     p-4 
                     grid grid-cols-1 gap-3       
                     sm:grid-cols-2 sm:gap-4      
                     lg:grid-cols-3 lg:gap-5      
                     "
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="canCreateUsers" className="font-medium">
                        Create Users
                      </Label>
                    </div>
                    <Switch
                      id="canCreateUsers"
                      checked={currentPermissions.canCreateUsers}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canCreateUsers", val)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Contact className="h-5 w-5 text-muted-foreground" />
                      <Label
                        htmlFor="canCreateCustomers"
                        className="font-medium"
                      >
                        Create Customers
                      </Label>
                    </div>
                    <Switch
                      id="canCreateCustomers"
                      checked={currentPermissions.canCreateCustomers}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canCreateCustomers", val)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="canCreateVendors" className="font-medium">
                        Create Vendors
                      </Label>
                    </div>
                    <Switch
                      id="canCreateVendors"
                      checked={currentPermissions.canCreateVendors}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canCreateVendors", val)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <Label
                        htmlFor="canCreateProducts"
                        className="font-medium"
                      >
                        Create Products
                      </Label>
                    </div>
                    <Switch
                      id="canCreateProducts"
                      checked={currentPermissions.canCreateProducts}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canCreateProducts", val)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-muted-foreground" />
                      <Label
                        htmlFor="canSendInvoiceEmail"
                        className="font-medium"
                      >
                        Send Invoice via Email
                      </Label>
                    </div>
                    <Switch
                      id="canSendInvoiceEmail"
                      checked={currentPermissions.canSendInvoiceEmail}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canSendInvoiceEmail", val)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <Label
                        htmlFor="canSendInvoiceWhatsapp"
                        className="font-medium"
                      >
                        Send Invoice via WhatsApp
                      </Label>
                    </div>
                    <Switch
                      id="canSendInvoiceWhatsapp"
                      checked={currentPermissions.canSendInvoiceWhatsapp}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canSendInvoiceWhatsapp", val)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <Label
                        htmlFor="canCreateCompanies"
                        className="font-medium"
                      >
                        Create Companies
                      </Label>
                    </div>
                    <Switch
                      id="canCreateCompanies"
                      checked={currentPermissions.canCreateCompanies}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canCreateCompanies", val)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <Label
                        htmlFor="canUpdateCompanies"
                        className="font-medium"
                      >
                        Update Companies
                      </Label>
                    </div>
                    <Switch
                      id="canUpdateCompanies"
                      checked={currentPermissions.canUpdateCompanies}
                      onCheckedChange={(val) =>
                        handlePermissionChange("canUpdateCompanies", val)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-secondary/50">
                  <CardTitle className="text-base">Usage Limits</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxCompanies"
                      className="flex items-center gap-3"
                    >
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Max Companies</span>
                    </Label>
                    <Input
                      id="maxCompanies"
                      type="number"
                      value={currentPermissions.maxCompanies || ""}
                      onChange={(e) =>
                        handlePermissionChange(
                          "maxCompanies",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxUsers"
                      className="flex items-center gap-3"
                    >
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Max Users</span>
                    </Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={currentPermissions.maxUsers || ""}
                      onChange={(e) =>
                        handlePermissionChange(
                          "maxUsers",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxInventories"
                      className="flex items-center gap-3"
                    >
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Max Inventories</span>
                    </Label>
                    <Input
                      id="maxInventories"
                      type="number"
                      value={currentPermissions.maxInventories || ""}
                      onChange={(e) =>
                        handlePermissionChange(
                          "maxInventories",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isSavingPermissions}
            >
              {isSavingPermissions && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full ">
        <CardHeader className="sticky top-0 z-10 bg-background border-b">
          <div className="flex  sm:flex-row sm:items-center justify-between gap-4">
            {/* 📱 Mobile filter button */}
            <div className="sm:hidden w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center text-sm py-2"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-1rem)] p-4 space-y-4">
                  <Combobox
                    options={contactNameOptions}
                    value={contactNameFilter}
                    onChange={setContactNameFilter}
                    placeholder="Filter by name..."
                    searchPlaceholder="Search by name..."
                    noResultsText="No clients found."
                  />
                  <Combobox
                    options={usernameOptions}
                    value={usernameFilter}
                    onChange={setUsernameFilter}
                    placeholder="Filter by username..."
                    searchPlaceholder="Search by username..."
                    noResultsText="No clients found."
                  />
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={!contactNameFilter && !usernameFilter}
                    className="w-full text-sm py-2"
                  >
                    Clear Filters
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 💻 Tablet & Desktop filters */}
            <div className="hidden sm:flex flex-row flex-nowrap items-center gap-3 flex-1">
              <Combobox
                options={contactNameOptions}
                value={contactNameFilter}
                onChange={setContactNameFilter}
                placeholder="Filter by name..."
                searchPlaceholder="Search by name..."
                noResultsText="No clients found."
                className="min-w-[160px]"
              />
              <Combobox
                options={usernameOptions}
                value={usernameFilter}
                onChange={setUsernameFilter}
                placeholder="Filter by username..."
                searchPlaceholder="Search by username..."
                noResultsText="No clients found."
                className="min-w-[160px]"
              />
            </div>

            {/* 🧹 Clear Filters Button */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!contactNameFilter && !usernameFilter}
              className="
      w-full sm:w-auto        /* Mobile full width, tablet/desktop auto */
      text-sm sm:text-base    /* Font size responsive */
      px-3 sm:px-4            /* Padding responsive */
      py-2 sm:py-2.5
      flex items-center justify-center
    "
            >
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className={viewMode === "list" ? "p-0" : ""}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "list" ? (
            <div className="overflow-x-auto p-4">
              <div className="overflow-x-auto">
                <Table className="border-separate border-spacing-y-2 p-4 min-w-[800px] lg:min-w-full">
                  <TableHeader className="[&_tr]:border-b-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[220px]">Contact</TableHead>
                      <TableHead className="w-[120px]">Username</TableHead>
                      <TableHead className="w-[180px]">Email</TableHead>
                      <TableHead className="w-[140px]">Phone</TableHead>
                      <TableHead className="w-[200px]">Login</TableHead>
                      <TableHead className="text-right w-[80px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_tr:last-child]:border-0">
                    {filteredClients.map((client) => {
                      const appUrl = getAppLoginUrl(client.slug);
                      const apiUrl = getApiLoginUrl(client.slug, baseURL);

                      return (
                        <TableRow
                          key={client._id}
                          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <TableCell className="rounded-l-lg text-sm py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="border border-gray-200 dark:border-gray-700 h-8 w-8">
                                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-xs">
                                  {client.contactName
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                  {capitalizeWords(client.contactName)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {client.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md inline-flex items-center max-w-full">
                              <User className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="truncate">
                                {client.clientUsername}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-md max-w-full">
                              <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300 truncate">
                                {client.email}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-md max-w-full">
                              <Phone className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="text-xs text-green-700 dark:text-green-300 truncate">
                                {client.phone || "Not set"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/client-login/${client.slug}`}
                                className="text-xs font-medium text-primary hover:underline truncate max-w-[120px]"
                                title={appUrl}
                              >
                                /client-login/{client.slug}
                              </Link>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  navigator.clipboard
                                    .writeText(appUrl)
                                    .then(() => {
                                      toast({
                                        title: "Copied",
                                        description: "App login URL copied.",
                                      });
                                    })
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    title="More login links"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={appUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center text-xs"
                                    >
                                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                      Open App Login
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigator.clipboard
                                        .writeText(apiUrl)
                                        .then(() =>
                                          toast({
                                            title: "Copied",
                                            description:
                                              "API login URL copied.",
                                          })
                                        )
                                    }
                                    className="text-xs"
                                  >
                                    <Copy className="mr-2 h-3.5 w-3.5" />
                                    Copy API URL
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>

                          <TableCell className="rounded-r-lg text-right py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild className="text-xs">
                                  <Link
                                    href={`/admin/analytics?clientId=${client._id}`}
                                    className="flex items-center"
                                  >
                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                    View Analytics
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(client)}
                                  className="text-xs"
                                >
                                  <Edit className="mr-2 h-3.5 w-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(client)}
                                  className="text-destructive focus:text-destructive text-xs"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3 pt-4 ">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client._id}
                  client={client}
                  onEdit={() => handleEdit(client)}
                  onDelete={() => handleDelete(client)}
                  onResetPassword={() => handleResetPassword(client)}
                  onManagePermissions={() => handleManagePermissions(client)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
