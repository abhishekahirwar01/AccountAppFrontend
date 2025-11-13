"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import ResetPasswordDialog from "./reset-password-dialog"; // remove if unused

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  MapPin,
  Phone,
  User2,
  Building,
  Mail,
  ShieldCheck,
  UserCog,
  Shield,
} from "lucide-react";
import type { User } from "@/lib/types";
import { Badge } from "../ui/badge";
import ManageUserPermissionsDialog from "./user-permissions";
// add these
import ResetPasswordDialog from "./reset-password-dialog";
import { KeyRound } from "lucide-react";

/* ----------------------------- Helpers & Types ---------------------------- */

const isObjectId = (s: unknown): s is string =>
  typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);

type RolePopulated = { _id: string; name?: string; label?: string };
type RoleLike = string | RolePopulated | null | undefined;
type CompanyRef = string | { _id: string };

const isRoleObject = (r: unknown): r is RolePopulated =>
  !!r && typeof r === "object" && "_id" in (r as any);

const companyIdOf = (c: CompanyRef): string =>
  typeof c === "string" ? c : c?._id;

const getRoleLabel = (role: RoleLike, map: Map<string, string>): string => {
  if (!role) return "—";
  if (typeof role === "string") {
    return isObjectId(role) ? map.get(role) ?? role : role;
  }
  return map.get(role._id) ?? role.label ?? role.name ?? "—";
};

const RoleIcon = ({ label }: { label: string }) => {
  const r = label.toLowerCase();
  if (r === "admin") return <ShieldCheck className="h-4 w-4" />;
  if (r === "user") return <UserCog className="h-4 w-4" />;
  return <User2 className="h-4 w-4" />;
};

/* add near the other helpers */
const getSafeUserId = (u: User | null): string | null => {
  if (!u) return null;
  const id =
    (typeof (u as any)._id === "string" && (u as any)._id) ||
    (typeof u.userId === "string" && u.userId) ||
    null;
  return id;
};

/* --------------------------------- Props ---------------------------------- */

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  companyMap: Map<string, string>;
  roleMap?: Map<string, string>;
}

/* -------------------------------- Component -------------------------------- */

type TabValue = "all" | "admin";

export function UserTable({
  users,
  onEdit,
  onDelete,
  companyMap,
  roleMap,
}: UserTableProps) {
  const rMap = roleMap ?? new Map<string, string>();

  const [permUser, setPermUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabValue>("all");
  // near your other state
  const [resetUser, setResetUser] = useState<User | null>(null);

  // ✅ resolve a definite string id for reset dialog (or null)
  const resetId = getSafeUserId(resetUser);

  const adminCount = useMemo(
    () =>
      users.filter(
        (u) => getRoleLabel(u.role as RoleLike, rMap).toLowerCase() === "admin"
      ).length,
    [users, rMap]
  );

  const filtered = useMemo(() => {
    if (tab === "admin") {
      return users.filter(
        (u) => getRoleLabel(u.role as RoleLike, rMap).toLowerCase() === "admin"
      );
    }
    return users;
  }, [users, tab, rMap]);

  return (
    <>
    <div className="mb-4 flex items-center justify-between">
  <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
    <TabsList className="bg-muted/50 p-1">
      <TabsTrigger 
        value="all" 
        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
      >
        All Users ({users.length})
      </TabsTrigger>
      <TabsTrigger 
        value="admin" 
        className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
      >
        Admins ({adminCount})
      </TabsTrigger>
    </TabsList>
  </Tabs>
</div>

<Table>
  <TableHeader>
    <TableRow className="border-b-0 hover:bg-transparent">
      <TableHead className="h-12 rounded-l-lg bg-muted/30">User</TableHead>
      <TableHead className="h-12 bg-muted/30">Role</TableHead>
      <TableHead className="h-12 bg-muted/30">Contact</TableHead>
      <TableHead className="h-12 bg-muted/30">Address</TableHead>
      <TableHead className="h-12 bg-muted/30">Companies</TableHead>
      <TableHead className="h-12 rounded-r-lg bg-muted/30 text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {filtered.map((user) => {
      const roleLabel = getRoleLabel(user.role as RoleLike, rMap);

      return (
        <TableRow key={user._id} className="border-b-0 even:bg-muted/20 even:hover:bg-muted/40">
          <TableCell className="rounded-l-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                  <User2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{user.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    ID: {user.userId}
                  </span>
                </div>
              </div>
            </div>
          </TableCell>

          <TableCell>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                  <RoleIcon label={roleLabel} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{roleLabel}</span>
                </div>
              </div>
            </div>
          </TableCell>

          <TableCell>
            <div className="space-y-2">
              {user.contactNumber && (
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                    <Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm">{user.contactNumber}</span>
                </div>
              )}

              {user.email && (
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30">
                    <Mail className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
          </TableCell>

          <TableCell>
            <div className="space-y-2">
              {user.address && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-full bg-gray-100 p-1.5 dark:bg-gray-800">
                    <MapPin className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="max-w-[150px] text-xs text-muted-foreground line-clamp-2">
                    {user.address}
                  </span>
                </div>
              )}
            </div>
          </TableCell>

          <TableCell className="w-[200px]">
            <div className="flex flex-wrap gap-1">
              {user.companies && user.companies.length > 0 ? (
                user.companies.map((c) => {
                  const id = companyIdOf(c as CompanyRef);
                  const companyName = companyMap.get(id);
                  return companyName ? (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      <Building className="h-3 w-3" />
                      {companyName}
                    </Badge>
                  ) : null;
                })
              ) : (
                <span className="text-xs text-muted-foreground">
                  No companies assigned
                </span>
              )}
            </div>
          </TableCell>

          <TableCell className="rounded-r-lg text-right">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                className="h-8 w-8 p-0 rounded-full bg-background hover:bg-slate-500"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPermUser(user)}
                className="h-8 px-2 rounded-md bg-background hover:bg-slate-500"
              >
                <Shield className="h-3.5 w-3.5 mr-1" />
                Perms
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetUser(user)}
                title="Reset password"
                disabled={!getSafeUserId(user)}
                className="h-8 w-8 p-0 rounded-full bg-background hover:bg-slate-500"
              >
                <KeyRound className="h-4 w-4" />
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(user)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    })}
  </TableBody>
</Table>

      {permUser && (
        <ManageUserPermissionsDialog
          open={!!permUser}
          onClose={() => setPermUser(null)}
          user={permUser}
        />
      )}

      {resetUser && resetId != null ? ( // ✅ narrow to non-null first
        <ResetPasswordDialog
          open={true}
          onClose={() => setResetUser(null)}
          userId={resetId}
          userName={resetUser.userName}
        />
      ) : null}
    </>
  );
}
