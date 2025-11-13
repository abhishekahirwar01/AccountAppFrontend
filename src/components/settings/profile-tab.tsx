
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Save } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export function ProfileTab() {
    const currentUser = getCurrentUser();
    const isCustomer = currentUser?.role === 'customer';

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
                        <Input id="fullName" defaultValue={isCustomer ? currentUser?.name : "Master Admin"} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={isCustomer ? currentUser?.email : "vinimay@sharda.co.in"} disabled/>
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
