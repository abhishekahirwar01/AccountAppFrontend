
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UserCircle, Bell, Save, Users, X } from "lucide-react";
import { ClientsValidityManager } from "@/components/admin/settings/ClientsValidityManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import { useState } from "react";
// import { Client } from "@/lib/types";

export default function SettingsPage() {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    setIsClientDialogOpen(true);
  };

  const handleClientFormSubmit = () => {
    setIsClientDialogOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and system preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <div className="flex flex-col">
              <CardTitle className="text-lg">Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue="Master Administrator" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="admin@accountech.com" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc-5">
                        <SelectTrigger id="timezone">
                            <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                            <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                            <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                            <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6 justify-end">
            <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
            </Button>
        </CardFooter>
      </Card>

      {/* Add the Client Validity Manager Card here */}
      <ClientsValidityManager onClientClick={handleClientClick} />

       <Card>
        <CardHeader>
           <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <div>
                    <CardTitle className="text-lg">Notification Settings</CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                    <Label htmlFor="invoice-emails" className="font-medium">Invoice Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new invoices and payments.</p>
                </div>
                <Switch id="invoice-emails" defaultChecked />
            </div>
            <Separator />
             <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                    <Label htmlFor="report-emails" className="font-medium">Monthly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive monthly financial summary reports via email.</p>
                </div>
                <Switch id="report-emails" />
            </div>
             <Separator />
             <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                    <Label htmlFor="security-alerts" className="font-medium">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for security-related events.</p>
                </div>
                <Switch id="security-alerts" defaultChecked />
            </div>
        </CardContent>
      </Card>

      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent
                 className="
             max-w-4xl ,
             max-h-[90vh] overflow-y-auto overflow-x-hidden     
              min-h-[90vh] 
             grid-rows-[auto,1fr,auto]
             p-0 rounded-xl
           "
               >
          <DialogHeader className="p-4 sm:p-6 sticky top-0 z-10 bg-background border-b flex flex-row items-center justify-between">
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
            onFormSubmit={handleClientFormSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
    


  );
}
