
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, Hash, FileText, MoreHorizontal, Edit, Trash2, Mail, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Company, Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminCompanyForm } from '../companies/admin-company-form';

interface CompaniesTabProps {
    selectedClientId: string;
    selectedClient: Client;
}

export function CompaniesTab({ selectedClientId, selectedClient }: CompaniesTabProps) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [isCompaniesLoading, setIsCompaniesLoading] = React.useState(false);
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(null);

    const fetchCompaniesAndClients = React.useCallback(async (clientId: string) => {
        if (!clientId) return;
        setIsCompaniesLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const [companiesRes, clientsRes] = await Promise.all([
                fetch(`${baseURL}/api/companies/by-client/${clientId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch(`${baseURL}/api/clients`, {
                    headers: { "Authorization": `Bearer ${token}` },
                }),
            ]);

            if (!companiesRes.ok || !clientsRes.ok) throw new Error("Failed to fetch data.");

            const companiesData = await companiesRes.json();
            const clientsData = await clientsRes.json();

            setCompanies(companiesData);
            setClients(clientsData);

        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load data", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsCompaniesLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchCompaniesAndClients(selectedClientId);
    }, [selectedClientId, fetchCompaniesAndClients]);

    const handleAddNew = () => {
        setSelectedCompany(null);
        setIsFormOpen(true);
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setIsFormOpen(true);
    };

    const handleDelete = (company: Company) => {
        setCompanyToDelete(company);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!companyToDelete) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/companies/${companyToDelete._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete company.");
            }
            toast({
                title: "Company Deleted",
                description: `${companyToDelete.businessName} has been successfully deleted.`,
            });
            fetchCompaniesAndClients(selectedClientId);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error instanceof Error ? error.message : "Something went wrong.",
            });
        } finally {
            setIsAlertOpen(false);
            setCompanyToDelete(null);
        }
    };

    const onFormSubmit = () => {
        setIsFormOpen(false);
        fetchCompaniesAndClients(selectedClientId);
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle>Companies</CardTitle>
                            <CardDescription>Companies managed by {selectedClient.contactName}.</CardDescription>
                        </div>
                        {/* Create button for desktop */}
                        <Button onClick={handleAddNew} className="sm:flex hidden">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Company
                        </Button>

                        {/* Create button for mobile */}
                        <Button onClick={handleAddNew} className="sm:hidden">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isCompaniesLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : companies.length > 0 ? (
                        <div className='hidden sm:block'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Identifiers</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map(company => (
                                        <TableRow key={company._id}>
                                            <TableCell>
                                                <div className="font-semibold">{company.businessName}</div>
                                                <div className="text-xs text-muted-foreground">{company.businessType}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Phone className="h-4 w-4 text-muted-foreground"/>
                                                    <span className="text-sm">{company.mobileNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground"/>
                                                    <span className="text-sm">{company.emailId || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Hash className="h-4 w-4 text-muted-foreground"/>
                                                    <span className="text-sm font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                                        {company.registrationNumber}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground"/>
                                                    <span className="text-sm font-mono bg-green-500/10 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                                        {company.gstin || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => handleEdit(company)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(company)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No companies found for this client.</p>
                    )}

                   <div className='sm:hidden space-y-4'>
  {companies.map(company => (
    <div key={company._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-4">
      
      {/* Header Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
            {company.businessName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {company.businessType}
          </p>
        </div>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleEdit(company)}>
              <Edit className="mr-2 h-4 w-4" /> 
              Edit Company
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(company)} 
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> 
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-[80px]">
            <Phone className="h-4 w-4" />
            <span>Phone:</span>
          </div>
          <span className="text-gray-900 dark:text-white font-medium">
            {company.mobileNumber}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-[80px]">
            <Mail className="h-4 w-4" />
            <span>Email:</span>
          </div>
          <span className="text-gray-900 dark:text-white truncate">
            {company.emailId || 'N/A'}
          </span>
        </div>
      </div>

      {/* Identifiers */}
      <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-[80px]">
            <Hash className="h-4 w-4" />
            <span>Reg No:</span>
          </div>
          <span className="font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs">
            {company.registrationNumber}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground min-w-[80px]">
            <FileText className="h-4 w-4" />
            <span>GSTIN:</span>
          </div>
          <span className="font-mono bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-md text-xs">
            {company.gstin || 'N/A'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-9 text-xs"
          onClick={() => handleEdit(company)}
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 h-9 text-xs dark:bg-gray-700 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          onClick={() => handleDelete(company)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  ))}
</div>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
               <DialogContent className="sm:max-w-4xl p-0 overflow-y-hidden">
                    <DialogHeader className="p-6 ">
                        <DialogTitle>
                            {selectedCompany ? "Edit Company" : "Create New Company"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCompany
                                ? `Update the details for ${selectedCompany.businessName}.`
                                : `Fill in the form to create a new company for ${selectedClient.contactName}.`}
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
                            company and all associated data for {companyToDelete?.businessName}
                            .
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
        </>
    )
}
