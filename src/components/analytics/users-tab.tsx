"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Client, User, Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { UserForm } from "@/components/users/user-form";

interface UsersTabProps {
  selectedClient: Client;
  selectedCompanyId: string | null;
  companyMap: Map<string, string>;
}
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const roleBadgeColors: { [key: string]: string } = {
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Accountant: "bg-green-500/20 text-green-400 border-green-500/30",
  Viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  user: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30",
};

const getRoleName = (r: any): string =>
  typeof r === "string" ? r : r?.name || r?.label || r?.role || "user"; // fallbacks

export function UsersTab({
  selectedClient,
  selectedCompanyId,
  companyMap,
}: UsersTabProps) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const idOf = (v: any) =>
    typeof v === "string" ? v : v?._id || v?.id || v?.$oid || "";

  const filteredUsers = React.useMemo(() => {
    if (!selectedCompanyId) return users; // All companies
    return users.filter(
      (u) =>
        Array.isArray(u.companies) &&
        u.companies.some((c: any) => idOf(c) === selectedCompanyId)
    );
  }, [users, selectedCompanyId]);

  const fetchUsersAndCompanies = React.useCallback(async () => {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    if (!selectedClient._id) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const buildRequest = (url: string) =>
        fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      const [usersRes, companiesRes] = await Promise.all([
        buildRequest(`${baseURL}/api/users/by-client/${selectedClient._id}`),
        buildRequest(
          `${baseURL}/api/companies/by-client/${selectedClient._id}`
        ),
      ]);

      if (!usersRes.ok || !companiesRes.ok) {
        throw new Error("Failed to fetch client data.");
      }
      const usersData = await usersRes.json();
      const companiesData = await companiesRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedClient, toast]);

  React.useEffect(() => {
    fetchUsersAndCompanies();
  }, [fetchUsersAndCompanies]);

  const handleOpenForm = (user: User | null = null) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleSave = async (formData: Partial<User>) => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user.");

      toast({ title: "User updated successfully" });
      fetchUsersAndCompanies();
      handleCloseForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user.");
      }

      toast({ title: "User deleted successfully" });
      fetchUsersAndCompanies();
      setIsAlertOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            User accounts associated with {selectedClient.contactName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
             {/* Mobile: Card view */}
<div className="sm:hidden space-y-3">
  {filteredUsers.map((user) => {
    const roleName = getRoleName(user.role);
    const roleKey = roleName.toLowerCase();
    
    return (
      <div key={user._id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
        {/* User Info Section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-sm">
                {(user.userName || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {user.userName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.userId}
              </div>
            </div>
          </div>
          
          {/* Role Badge */}
          <Badge
            variant="outline"
            className={cn(
              roleBadgeColors[roleKey] ?? roleBadgeColors.user,
              "capitalize text-xs shrink-0 ml-2"
            )}
          >
            {roleName}
          </Badge>
        </div>

        {/* Assigned Companies Section */}
        <div className="mb-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Assigned Companies
          </div>
          <div className="flex flex-wrap gap-1">
            {user.companies && Array.isArray(user.companies) ? (
              user.companies.slice(0, 3).map((companyId: any) => {
                const id = typeof companyId === "object" ? companyId._id : companyId;
                const companyName = companyMap.get(id);
                return companyName ? (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {companyName}
                  </Badge>
                ) : null;
              })
            ) : (
              <span className="text-xs text-muted-foreground">No companies</span>
            )}
            {user.companies && user.companies.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{user.companies.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Actions Section */}
        {/* <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="text-xs text-muted-foreground">
            {user.companies?.length || 0} company{(user.companies?.length || 0) !== 1 ? 's' : ''}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                <Edit className="mr-2 h-4 w-4" /> 
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(user)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> 
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
      </div>
    );
  })}
</div>
              {/* Desktop: Table view (unchanged) */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Companies</TableHead>
                      {/* <TableHead className="text-right">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const roleName = getRoleName(user.role);
                      const roleKey = roleName.toLowerCase();
                      return (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>
                                  {(user.userName || "U")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.userName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.userId}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                roleBadgeColors[roleKey] ??
                                  roleBadgeColors.user,
                                "capitalize"
                              )}
                            >
                              {roleName}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.companies &&
                              Array.isArray(user.companies) ? (
                                user.companies.map((companyId: any) => {
                                  const id =
                                    typeof companyId === "object"
                                      ? companyId._id
                                      : companyId;
                                  const companyName = companyMap.get(id);
                                  return companyName ? (
                                    <Badge key={id} variant="secondary">
                                      {companyName}
                                    </Badge>
                                  ) : null;
                                })
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No companies
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenForm(user)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleOpenDeleteDialog(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell> */}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No users found for this client.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the details for {selectedUser?.userName}.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={selectedUser}
            allCompanies={companies}
            onSave={handleSave}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account for {userToDelete?.userName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
