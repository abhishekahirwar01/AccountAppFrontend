"use client";

import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Users,
  Loader2,
  LayoutGrid,
  List,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import type { User, Company } from "@/lib/types";
import { UserTable } from "@/components/users/user-table";
import { UserForm } from "@/components/users/user-form";
import { UserCard } from "@/components/users/user-card";

const baseURL = (
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const userLoginUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/user-login`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userLoginUrl);
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

  const fetchUsersAndCompanies = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [usersRes, companiesRes] = await Promise.all([
        fetch(`${baseURL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/companies/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok || !companiesRes.ok) {
        throw new Error("Failed to fetch data");
      }
     const usersData = await usersRes.json();
const companiesData = await companiesRes.json();

// token decode karke current admin ka userId nikal lo
const payload = JSON.parse(atob(token.split(".")[1]));
const currentUserId = payload.userId || payload.id || payload._id;

// filter: apna khud ka record hata do (sirf agar role = admin hai)
let filteredUsers = usersData;
if (payload.role === "admin") {
  filteredUsers = usersData.filter((u: any) => u._id !== currentUserId);
}

setUsers(filteredUsers);
setCompanies(companiesData);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCompanies();
  }, []);

  const handleOpenForm = (user: User | null = null) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async (formData: Partial<User>) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const method = selectedUser ? "PUT" : "POST";
      const url = selectedUser
        ? `${baseURL}/api/users/${selectedUser._id}`
        : `${baseURL}/api/users`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message ||
            `Failed to ${selectedUser ? "update" : "create"} user.`
        );
      }

      toast({
        title: `User ${selectedUser ? "updated" : "created"} successfully`,
      });
      fetchUsersAndCompanies(); // Refresh data
      handleCloseForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
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
      fetchUsersAndCompanies(); // Refresh data
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

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((company) => {
      map.set(company._id, company.businessName);
    });
    return map;
  }, [companies]);

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-gray-900 border-blue-200 dark:border-gray-900">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                User Login URL
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-300 break-all bg-blue-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                {userLoginUrl}
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
        </CardContent>
      </Card>

      {isLoading ? (
        // Full-page loader while first fetch is in-flight
        <div className="h-[80vh] w-full flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      ) : companies.length === 0 ? (
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Users</h2>
              <p className="text-muted-foreground">Manage your users</p>
            </div>
            <div className="flex items-center gap-2">
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
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add User
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className={viewMode === "card" ? "p-0" : "p-6"}>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length > 0 ? (
                viewMode === "list" ? (
                  <UserTable
                    users={users}
                    onEdit={handleOpenForm}
                    onDelete={openDeleteDialog}
                    companyMap={companyMap}
                  />
                ) : (
                  <div className="">
                    {}
                    <UserCard
                      users={users}
                      onEdit={handleOpenForm}
                      onDelete={openDeleteDialog}
                      companyMap={companyMap}
                    />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Users Found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding your first user.
                  </p>
                  <Button className="mt-6" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-w-sm  overflow-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? "Edit User" : "Add New User"}
                </DialogTitle>
                <DialogDescription>Fill in the form below.</DialogDescription>
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
                  user account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
