"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";

export type UserPermissions = {
  canCreateInventory?: boolean;
  canCreateCustomers?: boolean;
  canCreateVendors?: boolean;
  canCreateCompanies?: boolean;
  canUpdateCompanies?: boolean;
  canSendInvoiceEmail?: boolean;
  canSendInvoiceWhatsapp?: boolean;
  canCreateSaleEntries?: boolean;
  canCreatePurchaseEntries?: boolean;
  canCreateJournalEntries?: boolean;
  canCreateReceiptEntries?: boolean;
  canCreatePaymentEntries?: boolean;
  canShowCustomers?: boolean;
  canShowVendors?: boolean;
};

type Ctx = {
  role: string | null;
  permissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  /** convenience helper for UI gating */
  isAllowed: (key: keyof UserPermissions) => boolean;
  refetch: () => void;
};

const UserPermissionsContext = React.createContext<Ctx | undefined>(undefined);

/** Decode role from JWT without any libs */
function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    // support multiple token shapes
    return (json.role || json.userRole || json.r || "").toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Everything allowed object (used for master/client bypass) */
const ALL_ALLOWED: UserPermissions = {
  canCreateInventory: true,
  canCreateCustomers: true,
  canCreateVendors: true,
  canCreateCompanies: true,
  canUpdateCompanies: true,
  canSendInvoiceEmail: true,
  canSendInvoiceWhatsapp: true,
  canCreateSaleEntries: true,
  canCreatePurchaseEntries: true,
  canCreateJournalEntries: true,
  canCreateReceiptEntries: true,
  canCreatePaymentEntries: true,
  canShowCustomers: true,
  canShowVendors: true,
  // limits can be omitted or set very high; UI typically doesn't gate on them
};

export function UserPermissionsProvider({ children }: { children: React.ReactNode }) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [role, setRole] = React.useState<string | null>(null);
  const [permissions, setPermissions] = React.useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPermissions = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const currentRole = getRoleFromToken(token);
    setRole(currentRole);

    try {
      if (!token) throw new Error("Authentication token not found.");
  console.log("Authetication Token :", token)
      // ✅ BYPASS: enforce caps only for 'user'
      if (currentRole && currentRole !== "user") {
        setPermissions(ALL_ALLOWED);
        return;
      }

      // Only role === 'user' comes here
      const res = await fetch(`${baseURL}/api/user-permissions/me/effective`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Failed to fetch permissions";
        throw new Error(msg);
      }

      const data = await res.json();
      // console.log("data of User Permissions : " , data)
      setPermissions({
        canCreateInventory: data.canCreateInventory,
        canCreateCustomers: data.canCreateCustomers,
        canCreateVendors: data.canCreateVendors,
        canCreateCompanies: data.canCreateCompanies,
        canUpdateCompanies: data.canUpdateCompanies,
        canSendInvoiceEmail: data.canSendInvoiceEmail,
        canSendInvoiceWhatsapp: data.canSendInvoiceWhatsapp,
        canCreateSaleEntries: data.canCreateSaleEntries,
        canCreatePurchaseEntries: data.canCreatePurchaseEntries,
        canCreateJournalEntries: data.canCreateJournalEntries,
        canCreateReceiptEntries: data.canCreateReceiptEntries,
        canCreatePaymentEntries: data.canCreatePaymentEntries,
        canShowCustomers: data.canShowCustomers,
        canShowVendors: data.canShowVendors,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setPermissions(null);
      // optionally toast here
    } finally {
      setIsLoading(false);
    }
  }, [baseURL]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isAllowed = React.useCallback(
    (key: keyof UserPermissions) => {
      // master/client (and any non-user role) are always allowed
      if (role && role !== "user" && role !== "admin" && role !== "manager") return true;
      return Boolean(permissions?.[key]);
    },
    [role, permissions]
  );

  const value: Ctx = React.useMemo(
    () => ({ role, permissions, isLoading, error, isAllowed, refetch: fetchPermissions }),
    [role, permissions, isLoading, error, isAllowed, fetchPermissions]
  );

  return (
    <UserPermissionsContext.Provider value={value}>
      {children}
    </UserPermissionsContext.Provider>
  );
}

export function useUserPermissions() {
  const ctx = React.useContext(UserPermissionsContext);
  if (!ctx) throw new Error("useUserPermissions must be used within a UserPermissionsProvider");
  return ctx;
}