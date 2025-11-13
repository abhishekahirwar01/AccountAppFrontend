
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Users, Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const permissionsMatrix = [
    { 
        feature: 'Dashboard Access', 
        description: 'View main dashboard',
        admin: true, 
        manager: true, 
        accountant: true, 
        viewer: true 
    },
    { 
        feature: 'Transaction Management',
        description: 'Create, edit, delete transactions',
        admin: true, 
        manager: true, 
        accountant: true, 
        viewer: false 
    },
    { 
        feature: 'Financial Reports',
        description: 'Generate and view reports',
        admin: true, 
        manager: true, 
        accountant: true, 
        viewer: true 
    },
    { 
        feature: 'User Management',
        description: 'Manage user accounts',
        admin: true, 
        manager: true, 
        accountant: false, 
        viewer: false 
    },
    { 
        feature: 'System Settings',
        description: 'Modify system configuration',
        admin: true, 
        manager: false, 
        accountant: false, 
        viewer: false 
    },
    { 
        feature: 'Data Export',
        description: 'Export data and reports',
        admin: true, 
        manager: true, 
        accountant: false, 
        viewer: false
    },
];

const users = [
  {
    name: 'John Smith',
    email: 'john@techcorp.com',
    company: 'TechCorp Solutions',
    initials: 'JS',
    role: 'Administrator',
    status: 'Active',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@greenenergy.com',
    company: 'Green Energy Ltd',
    initials: 'SJ',
    role: 'Manager',
    status: 'Active',
  },
  {
    name: 'Mike Wilson',
    email: 'mike@techcorp.com',
    company: 'TechCorp Solutions',
    initials: 'MW',
    role: 'Accountant',
    status: 'Active',
  },
  {
    name: 'Lisa Brown',
    email: 'lisa@fashionforward.com',
    company: 'Fashion Forward Inc',
    initials: 'LB',
    role: 'Viewer',
    status: 'Inactive',
  },
];

const roleBadgeColors: { [key: string]: string } = {
  Administrator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Accountant: 'bg-green-500/20 text-green-400 border-green-500/30',
  Viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};


export default function PermissionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Permissions Management</h2>
        <p className="text-muted-foreground">
          Manage user roles and access permissions.
        </p>
      </div>

       <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <CardTitle className="text-xl">User Permissions</CardTitle>
          </div>
          <CardDescription>Manage individual user access and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-9 bg-background" />
            </div>
            <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            {users.map((user) => (
                <div key={user.email} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.company}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(roleBadgeColors[user.role])}>{user.role}</Badge>
                        <Badge 
                            variant={user.status === 'Active' ? 'default' : 'secondary'}
                            className={cn(user.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30')}
                        >
                            {user.status}
                        </Badge>
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
          </div>

        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <CardTitle className="text-xl">Permissions Matrix</CardTitle>
          </div>
          <CardDescription>Overview of role permissions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[350px] text-foreground font-semibold">Permission</TableHead>
                            <TableHead className="text-center text-foreground font-semibold">Administrator</TableHead>
                            <TableHead className="text-center text-foreground font-semibold">Manager</TableHead>
                            <TableHead className="text-center text-foreground font-semibold">Accountant</TableHead>
                            <TableHead className="text-center text-foreground font-semibold">Viewer</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {permissionsMatrix.map((perm) => (
                            <TableRow key={perm.feature}>
                                <TableCell>
                                    <div className="font-medium">{perm.feature}</div>
                                    <div className="text-sm text-muted-foreground">{perm.description}</div>
                                </TableCell>
                                <TableCell className="text-center"><Checkbox checked={perm.admin} aria-label={`${perm.feature} for Administrator`} /></TableCell>
                                <TableCell className="text-center"><Checkbox checked={perm.manager} aria-label={`${perm.feature} for Manager`} /></TableCell>
                                <TableCell className="text-center"><Checkbox checked={perm.accountant} aria-label={`${perm.feature} for Accountant`} /></TableCell>
                                <TableCell className="text-center"><Checkbox checked={perm.viewer} aria-label={`${perm.feature} for Viewer`} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
