"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UserCircle, Bell, Save, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorSettings } from "@/components/settings/vendor-settings";
import { CustomerSettings } from "@/components/settings/customer-settings";
import { ProductSettings } from "@/components/settings/product-settings";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle2, Link2, Mail } from "lucide-react";
import { usePermissions } from "@/contexts/permission-context";

export default function SettingsPage() {
  const { permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const availableTabs = [
    { value: "profile", label: "Profile", component: <ProfileTab /> },
    permissions?.canCreateVendors && {
      value: "vendors",
      label: "Vendors",
      component: <VendorSettings />,
    },
    permissions?.canCreateCustomers && {
      value: "customers",
      label: "Customers",
      component: <CustomerSettings />,
    },
    permissions?.canCreateProducts && {
      value: "products",
      label: "Products",
      component: <ProductSettings />,
    },
    {
      value: "notifications",
      label: "Notifications",
      component: <NotificationsTab />,
    },
  ].filter(Boolean) as {
    value: string;
    label: string;
    component: React.ReactNode;
  }[];

  const gridColsClass = `grid-cols-${availableTabs.length}`;

  return (
  <div className="space-y-8 px-0 sm:px-0 md:px-6 lg:px-0">
    {/* Heading */}
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <p className="text-muted-foreground">
        Manage your account, preferences, and business entities.
      </p>
    </div>

    {/* Tabs */}
    <Tabs defaultValue="profile" className="w-full">
      <TabsList
        className={cn(
          "grid w-full gap-2",
          "grid-cols-2 sm:grid-cols-3", 
          "lg:flex lg:justify-start lg:gap-2"
        )}
      >
        {availableTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="w-full lg:w-auto"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {availableTabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-6"
        >
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  </div>
);

}

function ProfileTab() {
  return (
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
            <Input id="fullName" defaultValue="TechCorp Client" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              defaultValue="client@techcorp.com"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
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
  );
}

function NotificationsTab() {
  const { permissions } = usePermissions();

  // pretend we loaded this from your API:
  // GET /api/integrations/gmail/status -> { linked: boolean, email?: string }
  const [isLinked, setIsLinked] = React.useState(false);
  const [linkedEmail, setLinkedEmail] = React.useState<string | null>(null);

  // the switch on the right
  const [sendInvoicesEnabled, setSendInvoicesEnabled] = React.useState(true);

  // popup visibility
  const [open, setOpen] = React.useState(false);

  const canUseEmailInvoices = !!permissions?.canSendInvoiceEmail; // disable if admin didn’t grant
  const emailPerm = permissions?.canSendInvoiceEmail === true;

  // console.log("emailPerm" , emailPerm)
  const statusIcon = !emailPerm ? (
    <AlertCircle className="h-5 w-5 text-muted-foreground" />
  ) : isLinked ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  ) : (
    <AlertCircle className="h-5 w-5 text-amber-600" />
  );

  // (Optional) on mount, fetch actual status
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/integrations/gmail/status", {
          cache: "no-store",
        });
        if (!r.ok) return; // keep defaults
        const data = await r.json();
        setIsLinked(!!data?.linked);
        setLinkedEmail(data?.email ?? null);
      } catch {
        /* ignore; show warning icon */
      }
    })();
  }, []);

  // handlers (stub these to your backend)
  const connect = () => {
    // redirect to your OAuth start (or open in new tab)
    window.location.href =
      "/api/integrations/gmail/oauth/start?returnTo=/settings";
  };
  const disconnect = async () => {
    try {
      // call your API to unlink
      await fetch("/api/integrations/gmail/disconnect", { method: "POST" });
      setIsLinked(false);
      setLinkedEmail(null);
      setOpen(false);
    } catch {
      // swallow for now, or show a toast
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <CardTitle className="text-lg">Notification Settings</CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Send invoices via email (with warning/linked indicator) */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="send-invoice"
              className="font-medium flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send invoices via email
              {/* status indicator with tooltip */}
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => emailPerm && setOpen(true)}
                    className="inline-flex items-center"
                    aria-label="More info"
                  >
                    {statusIcon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px]">
                  {!emailPerm ? (
                    <span>
                      Permission not granted by your admin. You can’t email
                      invoices yet.
                    </span>
                  ) : isLinked ? (
                    <span>
                      Linked to <b>{linkedEmail}</b>. Click to manage Gmail
                      link.
                    </span>
                  ) : (
                    <span>
                      Master admin granted this permission. Click to connect
                      Gmail so invoices can be emailed to your customers.
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            </Label>

            <p className="text-sm text-muted-foreground">
              We’ll email invoices to your customers when transactions are
              created.
            </p>

            {/* linked status line */}
            {isLinked ? (
              <p className="text-xs text-emerald-700">
                Linked as <span className="font-medium">{linkedEmail}</span>.
                Invoices will be sent from this address.
              </p>
            ) : (
              <p className="text-xs text-amber-700">
                Gmail not linked. Invoices won’t be emailed until you connect.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="send-invoice"
              checked={sendInvoicesEnabled}
              onCheckedChange={setSendInvoicesEnabled}
              disabled={!canUseEmailInvoices}
            />
          </div>
        </div>

        <Separator />

        {/* You can keep your other notification toggles below */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-1">
            <Label htmlFor="invoice-emails" className="font-medium">
              Invoice Emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications for new invoices and payments.
            </p>
          </div>
          <Switch id="invoice-emails" defaultChecked />
        </div>

        <Separator />
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-1">
            <Label htmlFor="report-emails" className="font-medium">
              Monthly Reports
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive monthly financial summary reports via email.
            </p>
          </div>
          <Switch id="report-emails" />
        </div>

        <Separator />
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-1">
            <Label htmlFor="security-alerts" className="font-medium">
              Security Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications for security-related events.
            </p>
          </div>
          <Switch id="security-alerts" defaultChecked />
        </div>
      </CardContent>

      {/* Info / connect popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send invoices via Gmail</DialogTitle>
            <DialogDescription>
              {isLinked
                ? "Your Gmail account is linked. You can change or disconnect it below."
                : "Master admin has granted this permission. Link your Gmail to email invoices to your customers."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {isLinked ? (
              <>
                <div className="rounded-md bg-emerald-50 p-3 text-sm">
                  Currently linked as <b>{linkedEmail}</b>.
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={connect}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Change account
                  </Button>
                  <Button variant="destructive" onClick={disconnect}>
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-md bg-amber-50 p-3 text-sm">
                  Invoices won’t be emailed until you connect Gmail.
                </div>
                <Button onClick={connect}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Gmail
                </Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
