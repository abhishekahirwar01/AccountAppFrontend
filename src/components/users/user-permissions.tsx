"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

// ---- Capability constants (mirror backend CAP_KEYS) ----
const ALL_CAPS = [
  "canCreateInventory",
  "canCreateCustomers",
  "canCreateVendors",
  "canCreateCompanies",
  "canUpdateCompanies",
  "canSendInvoiceEmail",
  "canSendInvoiceWhatsapp",
  "canCreateSaleEntries",
  "canCreatePurchaseEntries",
  "canCreateJournalEntries",
  "canCreateReceiptEntries",
  "canCreatePaymentEntries",
  "canShowCustomers",  // New permission for showing customers in sales
  "canShowVendors", 
] as const;


// 1) Keep these types near your caps
type CapKey = typeof ALL_CAPS[number];

const CAP_LABELS: Record<CapKey, string> = {
  canCreateInventory: "Create Inventory",
  canCreateCustomers: "Create Customers",
  canCreateVendors: "Create Vendors",
  canCreateCompanies: "Create Companies",
  canUpdateCompanies: "Update Companies",
  canSendInvoiceEmail: "Send Invoice via Email",
  canSendInvoiceWhatsapp: "Send Invoice via WhatsApp",
  canCreateSaleEntries: "Create Sales",
  canCreatePurchaseEntries: "Create Purchase",
  canCreateJournalEntries: "Create Journal",
  canCreateReceiptEntries: "Create Receipt",
  canCreatePaymentEntries: "Create Payment",
   canShowCustomers: "Show Customers",  // Label for show customers
  canShowVendors: "Show Vendors",
};

// Show only these 5 primaries
const PRIMARY_CAPS = [
  "canCreateSaleEntries",
  "canCreatePurchaseEntries",
  "canCreateReceiptEntries",
  "canCreatePaymentEntries",
  "canCreateJournalEntries",
] as const;

type PrimaryCap = typeof PRIMARY_CAPS[number];

// 2) Type your dependencies
const DEPENDENCIES: Partial<Record<PrimaryCap, CapKey[]>> = {
  // canCreateSaleEntries: ["canCreateInventory", "canCreateCustomers"],
  // canCreatePurchaseEntries: ["canCreateVendors", "canCreateInventory"],
   canCreateSaleEntries: ["canCreateInventory", "canCreateCustomers", "canShowCustomers"],  // Show customers in sales
  canCreatePurchaseEntries: ["canCreateVendors", "canCreateInventory", "canShowVendors"],  // Show vendors in purchases
};

// 3) Flatten, filter, and de-dupe to a proper CapKey[]
const DEP_VALUES: CapKey[] = Object.values(DEPENDENCIES)
  .flat()
  .filter((v): v is CapKey => Boolean(v));

const DEP_KEYS: CapKey[] = Array.from(new Set<CapKey>(DEP_VALUES));

// 4) Finally compose the visible keys
const VISIBLE_KEYS: CapKey[] = [...PRIMARY_CAPS, ...DEP_KEYS];

function ManageUserPermissionsDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [overrides, setOverrides] = useState<Partial<Record<CapKey, boolean>>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    Authorization: `Bearer ${
      typeof window !== "undefined" ? localStorage.getItem("token") : ""
    }`,
  };

  useEffect(() => {
    if (!open || !user?._id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseURL}/api/user-permissions/${user._id}`, {
          headers: authHeaders,
        });

        if (res.ok) {
          const data = await res.json();
          const init: Partial<Record<CapKey, boolean>> = {};
          for (const k of ALL_CAPS) init[k] = data[k] === true;
          setOverrides(init);
        } else if (res.status === 404) {
          const init: Partial<Record<CapKey, boolean>> = {};
          for (const k of ALL_CAPS) init[k] = false;
          setOverrides(init);
        } else {
          throw new Error("Failed to load permissions");
        }
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to load permissions",
          description: String(e),
        });
        const init: Partial<Record<CapKey, boolean>> = {};
        for (const k of ALL_CAPS) init[k] = false;
        setOverrides(init);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?._id, baseURL]);

  const togglePermission = (k: CapKey) => {
    setOverrides((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const togglePrimary = (k: (typeof PRIMARY_CAPS)[number]) => {
    setOverrides((prev) => {
      const next = { ...prev };
      const nextVal = !prev[k];
      next[k] = nextVal;

      const deps = DEPENDENCIES[k] || [];
      if (deps.length) {
        if (nextVal) {
          // turning ON → preselect deps (editable)
          for (const d of deps) next[d] = true;
        } else {
          // turning OFF → turn deps off
          for (const d of deps) next[d] = false;
        }
      }
      return next;
    });
  };

  // Affect only visible keys (not hidden email/whatsapp)
  const denyAll = () => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const k of VISIBLE_KEYS) next[k] = false;
      return next;
    });
  };

  const allowAll = () => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const k of VISIBLE_KEYS) next[k] = true;
      return next;
    });
  };

  const save = async () => {
    try {
      const body: Record<string, boolean> = {};
      for (const k of ALL_CAPS) body[k] = overrides[k] || false;

      // ensure email/whatsapp stay off (as requested)
      body.canSendInvoiceEmail = false;
      body.canSendInvoiceWhatsapp = false;

      const res = await fetch(`${baseURL}/api/user-permissions/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to save permissions");
      }

      toast({ title: "Permissions updated" });
      onClose();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: String(e),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions — {user.userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={denyAll}>
                Deny All
              </Button>
              <Button size="sm" variant="outline" onClick={allowAll}>
                Allow All
              </Button>
            </div>

            {/* 2 columns on >= sm screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRIMARY_CAPS.map((k) => {
                const isAllowed = overrides[k] === true;
                const badge = isAllowed ? "Allow" : "Deny";
                const badgeColor = isAllowed
                  ? "text-green-600"
                  : "text-destructive";
                const deps = (DEPENDENCIES[k] || []) as CapKey[];

                return (
                  <div
                    key={k}
                    className="rounded-xl border bg-card text-card-foreground shadow-sm"
                  >
                    {/* Primary row */}
                    <label
                      className={`flex items-center justify-between p-3 rounded-t-xl ${
                        isAllowed ? "border-b border-border/60" : ""
                      }`}
                    >
                      <div className="pr-3 flex-1">
                        <div className="text-sm font-medium">
                          {CAP_LABELS[k]}
                        </div>
                        <div className={`text-xs ${badgeColor} font-medium`}>
                          {badge}
                        </div>
                      </div>
                      <Checkbox
                        checked={isAllowed}
                        onCheckedChange={() => togglePrimary(k)}
                        className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </label>

                    {/* Dependency list (only when primary is ON) */}
                    {isAllowed && deps.length > 0 && (
                      <div className="p-3 pt-2">
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-2">
                          {deps.map((d) => {
                            const depAllowed = overrides[d] === true;
                            return (
                              <label
                                key={d}
                                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent/40"
                              >
                                <div className="text-sm">{CAP_LABELS[d]}</div>
                                <Checkbox
                                  checked={depAllowed}
                                  onCheckedChange={() => togglePermission(d)}
                                  className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ManageUserPermissionsDialog;
