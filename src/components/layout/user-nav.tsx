'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";
import type { User } from '@/lib/types';

function normalizeRole(raw?: string | null) {
  const r = (raw ?? '').toLowerCase();
  // treat "client" as "customer" internally
  if (r === 'client') return 'customer';
  return r;
}

function roleToLabel(r: string) {
  switch (r) {
    case 'master':   return 'Master Admin';
    case 'admin':    return 'Admin';
    case 'manager':  return 'Manager';
    case 'customer': return 'Client';
    case 'user':     return 'User';
    default:         return 'User';
  }
}

function initialsFrom(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'U';
}

export function UserNav() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  if (!currentUser) return null;

  const normalizedRole = normalizeRole(currentUser.role);
  const roleLabel = roleToLabel(normalizedRole);

  const displayName =
    normalizedRole === 'master'
      ? 'Master Administrator'
      : currentUser.name || currentUser.email || 'User';

  const fallbackInitials = currentUser.initials || initialsFrom(currentUser.name || currentUser.email);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        {/* <AvatarImage
          src={currentUser.avatar || undefined}
          alt={displayName}
        /> */}
        <AvatarFallback>{fallbackInitials}</AvatarFallback>
      </Avatar>
      <div className="text-sm text-left sm:block hidden">
        <p className="font-semibold">{displayName}</p>
        <p className="text-muted-foreground">{roleLabel}</p>
      </div>
    </div>
  );
}
