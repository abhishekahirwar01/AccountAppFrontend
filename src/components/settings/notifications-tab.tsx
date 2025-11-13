
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

export function NotificationsTab() {
  return (
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
  )
}
