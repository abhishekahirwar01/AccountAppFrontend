"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  KeyRound,
} from "lucide-react";
import type { User } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import ManageUserPermissionsDialog from "./user-permissions";
import ResetPasswordDialog from "./reset-password-dialog";

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

const getSafeUserId = (u: User | null): string | null => {
  if (!u) return null;
  const id =
    (typeof (u as any)._id === "string" && (u as any)._id) ||
    (typeof u.userId === "string" && u.userId) ||
    null;
  return id;
};

/* --------------------------------- Props ---------------------------------- */

interface UserCardViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  companyMap: Map<string, string>;
  roleMap?: Map<string, string>;
}

/* -------------------------------- Component -------------------------------- */

type TabValue = "all" | "admin";

export function UserCard({
  users,
  onEdit,
  onDelete,
  companyMap,
  roleMap,
}: UserCardViewProps) {
  const rMap = roleMap ?? new Map<string, string>();
  const [permUser, setPermUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabValue>("all");
  const [resetUser, setResetUser] = useState<User | null>(null);
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

  const RoleIcon = ({ label }: { label: string }) => {
    const r = label.toLowerCase();
    if (r === "admin") return <ShieldCheck className="h-4 w-4" />;
    if (r === "user") return <UserCog className="h-4 w-4" />;
    return <User2 className="h-4 w-4" />;
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
            <TabsTrigger value="admin">Admins ({adminCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((user) => {
          const roleLabel = getRoleLabel(user.role as RoleLike, rMap);
          const initials = (user.userName || "NN")
            .substring(0, 2)
            .toUpperCase();

          return (
            <Card key={user._id} className="flex flex-col overflow-hidden">
              <CardContent className="p-6 flex-1">
                {/* User Avatar and Basic Info */}
                <div className="flex items-start mb-5 p-4 bg-gradient-to-r from-muted/20 to-muted/30 rounded-lg border">
                  <Avatar className="h-14 w-14  shadow-md">
                    <AvatarImage src={user.avatar} alt={user.userName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-lg text-foreground truncate">
                        {user.userName}
                      </h3>
                      <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                        <RoleIcon label={roleLabel} />
                        <span className="font-medium text-xs text-primary">
                          {roleLabel}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      ID: {user.userId}
                    </p>

                    {user.status && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            user.status === "Active"
                              ? "bg-green-500 dark:bg-green-400"
                              : "bg-amber-500 dark:bg-amber-400"
                          }`}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {user.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Contact Information */}
                <div className="space-y-3 mb-4">
                  <div className="flex gap-6 items-center align-middle">
                    {user.contactNumber && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-green-500/10 p-1">
                          <Phone className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-sm">{user.contactNumber}</span>
                      </div>
                    )}

                    {user.email && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-purple-500/10 p-1">
                          <Mail className="h-3 w-3 text-purple-500" />
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {user.address && (
                    <div className="flex items-center gap-2">
                      <div className="mt-0.5 rounded-md bg-gray-500/10 p-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2 flex-1">
                        {user.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Companies */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Companies</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.companies && user.companies.length > 0 ? (
                      user.companies.map((c) => {
                        const id = companyIdOf(c as CompanyRef);
                        const companyName = companyMap.get(id);
                        return companyName ? (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="flex items-center gap-1 text-xs"
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
                </div>
              </CardContent>

              <CardFooter className="bg-muted/50 p-4 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPermUser(user)}
                    title="Manage permissions"
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetUser(user)}
                    title="Reset password"
                    disabled={!getSafeUserId(user)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(user)}
                  title="Delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {permUser && (
        <ManageUserPermissionsDialog
          open={!!permUser}
          onClose={() => setPermUser(null)}
          user={permUser}
        />
      )}

      {resetUser && resetId != null && (
        <ResetPasswordDialog
          open={true}
          onClose={() => setResetUser(null)}
          userId={resetId}
          userName={resetUser.userName}
        />
      )}
    </>
  );
}
