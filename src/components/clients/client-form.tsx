"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Eye,
  EyeOff,
  Building,
  Users,
  Package,
  Mail,
  MessageSquare,
  Contact,
  Store,
} from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ClientValidityCard } from "../admin/settings/ClientValidityCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

interface ClientFormProps {
  client?: Client;
  onFormSubmit?: () => void;
  onCancel?: () => void;
}

const baseSchema = z.object({
  contactName: z.string().min(2, "Contact name must be at least 2 characters."),
  clientUsername: z
    .string()
    .min(4, "Username must be at least 4 characters.")
    .max(24, "Username must be at most 24 characters.")
    .regex(
      /^[a-z0-9_.]+$/,
      "Use only lowercase letters, numbers, dot or underscore."
    ),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
  maxCompanies: z.coerce.number().min(0, "Must be a non-negative number."),
  maxUsers: z.coerce.number().min(0, "Must be a non-negative number."),
  canSendInvoiceEmail: z.boolean(),
  canSendInvoiceWhatsapp: z.boolean(),
});

const createClientSchema = baseSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters."),
  validityAmount: z.coerce
    .number()
    .int()
    .positive("Enter a positive number.")
    .max(1200, "That’s a bit long — try ≤ 1200."),
  validityUnit: z.enum(["days", "months", "years"]),
});

// For updates, we use the base schema which doesn't include the password.
const updateClientSchema = baseSchema;

type CreateClientForm = z.infer<typeof createClientSchema>;
type UpdateClientForm = z.infer<typeof updateClientSchema>;

type AllowedPermissions = {
  maxCompanies?: number;
  maxUsers?: number;
  maxInventories?: number;
  canSendInvoiceEmail?: boolean;
  canSendInvoiceWhatsapp?: boolean;
  canCreateUsers?: boolean;
  canCreateCustomers?: boolean;
  canCreateVendors?: boolean;
  canCreateProducts?: boolean;
  canCreateCompanies?: boolean;
  canUpdateCompanies?: boolean;
};

export function ClientForm({ client, onFormSubmit, onCancel }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [eyeOpen, setEyeOpen] = React.useState(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  // Permissions management state
  const [currentPermissions, setCurrentPermissions] = React.useState<
    Partial<AllowedPermissions>
  >({});
  const [isSavingPermissions, setIsSavingPermissions] = React.useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = React.useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [eyeOpenPassword, setEyeOpenPassword] = React.useState(false);

  React.useEffect(() => {
    setAuthToken(localStorage.getItem("token"));
  }, []);

  // --- helpers ---
  function slugifyUsername(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9_.]+/g, "")
      .slice(0, 24);
  }

  function localSuggestions(base: string, tried?: string) {
    const core = slugifyUsername(base) || "user";
    const y = new Date().getFullYear().toString();
    const seeds = [
      core,
      `${core}1`,
      `${core}123`,
      `${core}${y.slice(-2)}`,
      `${core}${y}`,
      `${core}_official`,
      `${core}_hq`,
      `real${core}`,
      `${core}_co`,
      `${core}_app`,
    ];
    const out = Array.from(new Set(seeds))
      .filter((s) => s && s !== tried)
      .slice(0, 6);
    return out;
  }

  // --- state for availability UX ---
  const [checkingUsername, setCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<
    boolean | null
  >(null);
  const [usernameSuggestions, setUsernameSuggestions] = React.useState<
    string[]
  >([]);

  const formSchema = client ? updateClientSchema : createClientSchema;

  const form = useForm<CreateClientForm | UpdateClientForm>({
    resolver: zodResolver(client ? updateClientSchema : createClientSchema),
    defaultValues: {
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      email: client?.email || "",
      phone: client?.phone || "",
      maxCompanies: client?.maxCompanies || 5,
      maxUsers: client?.maxUsers || 10,
      canSendInvoiceEmail: client?.canSendInvoiceEmail ?? false,
      canSendInvoiceWhatsapp: client?.canSendInvoiceWhatsapp ?? false,
      ...(!client && {
        password: "",
        validityAmount: 30,
        validityUnit: "days",
      }),
    },
  });

  React.useEffect(() => {
    form.reset({
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      email: client?.email || "",
      phone: client?.phone || "",
      maxCompanies: client?.maxCompanies || 5,
      maxUsers: client?.maxUsers || 10,
      canSendInvoiceEmail: client?.canSendInvoiceEmail || false,
      canSendInvoiceWhatsapp: client?.canSendInvoiceWhatsapp || false,
      ...(!client && {
        password: "",
        validityAmount: 30,
        validityUnit: "days",
      }),
    });
  }, [client, form]);

  // Preview (create mode only)
  const watchedAmt = form.watch("validityAmount" as any);
  const watchedUnit = form.watch("validityUnit" as any);

  React.useEffect(() => {
    if (!client) {
      setPermissionsConfigured(true);
      setValidityConfigured(!!watchedAmt && watchedAmt > 0 && !!watchedUnit);
    }
  }, [client, watchedAmt, watchedUnit]);

  const watchedUsername = form.watch("clientUsername");
  const watchedContact = form.watch("contactName");

  React.useEffect(() => {
    // If editing, username field is disabled; mark as valid and skip checks.
    if (client) {
      setUsernameAvailable(true);
      setUsernameSuggestions([]);
      form.clearErrors("clientUsername");
      return;
    }

    const raw = (watchedUsername || "").trim().toLowerCase();

    // No value -> reset
    if (!raw) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      form.clearErrors("clientUsername");
      return;
    }

    // If it fails local regex/length, show suggestions from contact & don’t call API
    if (!/^[a-z0-9_.]{4,24}$/.test(raw)) {
      setUsernameAvailable(false);
      setUsernameSuggestions(localSuggestions(watchedContact || raw, raw));
      form.setError("clientUsername", {
        type: "manual",
        message:
          "Use 4–24 chars: lowercase letters, numbers, dot or underscore.",
      });
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setCheckingUsername(true);
        setUsernameAvailable(null);

        const params = new URLSearchParams({
          username: raw,
          base: watchedContact || raw,
        });
        // If you made it protected, add Authorization header here.
        const res = await fetch(
          `${baseURL}/api/clients/check-username?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.ok) {
          // don’t block user on transient errors
          setUsernameAvailable(null);
          setUsernameSuggestions([]);
          form.clearErrors("clientUsername");
          return;
        }

        if (data.available) {
          setUsernameAvailable(true);
          setUsernameSuggestions([]);
          form.clearErrors("clientUsername");
        } else {
          setUsernameAvailable(false);
          setUsernameSuggestions(
            (data.suggestions?.length
              ? data.suggestions
              : localSuggestions(watchedContact || raw, raw)
            ).slice(0, 6)
          );
          form.setError("clientUsername", {
            type: "manual",
            message: "Username already taken. Try a suggestion below.",
          });
        }
      } catch {
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
        form.clearErrors("clientUsername");
      } finally {
        setCheckingUsername(false);
      }
    }, 400); // debounce 400ms

    return () => {
      controller.abort();
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedUsername, watchedContact, client?._id]);

  function applyServerErrorsToForm(message: string) {
    const lower = message.toLowerCase();

    // access current values for generating suggestions
    const vals = form.getValues() as any;
    const tried = vals?.clientUsername || "";
    const base = vals?.contactName || tried;

    if (lower.includes("username")) {
      form.setError(
        "clientUsername",
        {
          type: "server",
          message: "Username already exists",
        },
        { shouldFocus: true }
      );

      // 👉 show suggestions immediately (even if the live checker didn't run)
      setUsernameAvailable(false);
      setUsernameSuggestions(localSuggestions(base, tried));
      return true;
    }

    if (lower.includes("email")) {
      form.setError(
        "email",
        { type: "server", message: "Email already exists" },
        { shouldFocus: true }
      );
      return true;
    }

    if (lower.includes("phone")) {
      form.setError(
        "phone",
        { type: "server", message: "Phone already exists" },
        { shouldFocus: true }
      );
      return true;
    }

    return false;
  }

  // Load permissions function
  const loadPermissions = async () => {
    if (!client || permissionsLoaded) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/clients/${client._id}/permissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentPermissions({
          maxCompanies: data.maxCompanies,
          maxUsers: data.maxUsers,
          maxInventories: data.maxInventories,
          canSendInvoiceEmail: data.canSendInvoiceEmail,
          canSendInvoiceWhatsapp: data.canSendInvoiceWhatsapp,
          canCreateUsers: data.canCreateUsers,
          canCreateCustomers: data.canCreateCustomers,
          canCreateVendors: data.canCreateVendors,
          canCreateProducts: data.canCreateProducts,
          canCreateCompanies: data.canCreateCompanies,
          canUpdateCompanies: data.canUpdateCompanies,
        });
      } else {
        // Fallback to client data if permissions are not explicitly set
        setCurrentPermissions({
          maxCompanies: client.maxCompanies || 5,
          maxUsers: client.maxUsers || 10,
          maxInventories: client.maxInventories || 50,
          canSendInvoiceEmail: client.canSendInvoiceEmail || false,
          canSendInvoiceWhatsapp: client.canSendInvoiceWhatsapp || false,
          canCreateUsers: client.canCreateUsers || true,
          canCreateCustomers: client.canCreateCustomers || true,
          canCreateVendors: client.canCreateVendors || true,
          canCreateProducts: client.canCreateProducts || true,
          canCreateCompanies: client.canCreateCompanies || false,
          canUpdateCompanies: client.canUpdateCompanies || false,
        });
      }
    } catch (error) {
      // Fallback in case of network error etc.
      setCurrentPermissions({
        maxCompanies: client.maxCompanies || 5,
        maxUsers: client.maxUsers || 10,
        maxInventories: client.maxInventories || 50,
        canSendInvoiceEmail: client.canSendInvoiceEmail || false,
        canSendInvoiceWhatsapp: client.canSendInvoiceWhatsapp || false,
        canCreateUsers: client.canCreateUsers || true,
        canCreateCustomers: client.canCreateCustomers || true,
        canCreateVendors: client.canCreateVendors || true,
        canCreateProducts: client.canCreateProducts || true,
        canCreateCompanies: client.canCreateCompanies || false,
        canUpdateCompanies: client.canUpdateCompanies || false,
      });
    }
    setPermissionsLoaded(true);
  };

  const handlePermissionChange = (
    field: keyof AllowedPermissions,
    value: any
  ) => {
    setCurrentPermissions((prev) => ({ ...prev, [field]: value }));
  };

  const {
    maxCompanies,
    maxUsers,
    maxInventories,
    canSendInvoiceEmail,
    canSendInvoiceWhatsapp,
    canCreateUsers,
    canCreateCustomers,
    canCreateVendors,
    canCreateProducts,
    canCreateCompanies,
    canUpdateCompanies,
  } = currentPermissions as AllowedPermissions;

  const payload: AllowedPermissions = {
    maxCompanies,
    maxUsers,
    maxInventories,
    canSendInvoiceEmail,
    canSendInvoiceWhatsapp,
    canCreateUsers,
    canCreateCustomers,
    canCreateVendors,
    canCreateProducts,
    canCreateCompanies,
    canUpdateCompanies,
  };

  const handleSavePermissions = async () => {
    if (!client) return;
    setIsSavingPermissions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/clients/${client._id}/permissions`,

        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update permissions.");
      }

      toast({
        title: "Permissions Updated",
        description: `Permissions for ${client.contactName} have been saved.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Password reset function
  const handleResetPassword = async () => {
    if (!client || !newPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "New password cannot be empty.",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `${baseURL}/api/clients/reset-password/${client._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newpassword: newPassword }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password.");
      }

      toast({
        title: "Password Reset Successful",
        description: `Password for ${client.contactName} has been updated.`,
      });

      setNewPassword("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  function addToDate(
    d: Date,
    amount: number,
    unit: "days" | "months" | "years"
  ) {
    const copy = new Date(d);
    if (unit === "days") copy.setDate(copy.getDate() + amount);
    if (unit === "months") copy.setMonth(copy.getMonth() + amount);
    if (unit === "years") copy.setFullYear(copy.getFullYear() + amount);
    return copy;
  }

  const expiryPreview = React.useMemo(() => {
    if (client) return null;
    const amt = Number(watchedAmt);
    const unit = watchedUnit as "days" | "months" | "years" | undefined;
    if (!amt || !unit) return null;
    const dt = addToDate(new Date(), amt, unit);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(dt);
  }, [client, watchedAmt, watchedUnit]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to perform this action.",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if permissions and validity are configured for new clients
    if (!client) {
      if (!permissionsConfigured || !validityConfigured) {
        toast({
          variant: "destructive",
          title: "Configuration Required",
          description:
            "You have not set up permissions or validity. Please configure them before proceeding.",
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const valid = await form.trigger();
      if (!valid) {
        setIsSubmitting(false);
        return;
      }

      const url = client
        ? `${baseURL}/api/clients/${client._id}`
        : `${baseURL}/api/clients`;
      const method = client ? "PATCH" : "POST";

      // 🔑 shape the body
      let body: any = { ...values };
      if (!client) {
        body.validity = {
          amount: (values as any).validityAmount,
          unit: (values as any).validityUnit, // "days" | "months" | "years"
        };
        delete body.validityAmount;
        delete body.validityUnit;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = data?.message || "Failed to save";
        applyServerErrorsToForm(msg);
        toast({
          variant: "destructive",
          title: "Operation Failed",
          description: msg,
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: `Client ${client ? "Updated" : "Created"}!`,
        description: `${values.contactName}'s details have been successfully saved.`,
      });
      onFormSubmit?.();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Something went wrong.";
      applyServerErrorsToForm(msg);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const [selectedTab, setSelectedTab] = React.useState("general");
  const [permissionsConfigured, setPermissionsConfigured] =
    React.useState(false);
  const [validityConfigured, setValidityConfigured] = React.useState(false);

  React.useEffect(() => {
    if (client && selectedTab === "permissions" && !permissionsLoaded) {
      loadPermissions();
    }
  }, [client, selectedTab, permissionsLoaded]);

  if (client) {
    // Edit mode with tabs
    return (
      <div className="flex flex-col h-full">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="flex-1 flex flex-col p-2"
        >
          <TabsList className="flex flex-row flex-wrap gap-2 w-full px-4 md:px-6 mt-4 md:mt-6">
            <TabsTrigger
              value="general"
              className="flex-1 min-w-[120px] text-sm px-3 py-2 truncate"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="flex-1 min-w-[120px] text-sm px-3 py-2 truncate"
            >
              Permissions
            </TabsTrigger>
            <TabsTrigger
              value="validity"
              className="flex-1 min-w-[120px] text-sm px-3 py-2 truncate"
            >
              Validity
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="flex-1 min-w-[120px] text-sm px-3 py-2 truncate"
            >
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="flex-1 mt-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="contents"
                onKeyDown={(e) => {
                  // Prevent form selection on Tab key
                  if (e.key === "Tab") {
                    e.preventDefault();
                    // Find next focusable element
                    const focusableElements = document.querySelectorAll(
                      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
                    );
                    const currentIndex = Array.from(focusableElements).indexOf(
                      document.activeElement as Element
                    );
                    const nextIndex = e.shiftKey
                      ? currentIndex - 1
                      : currentIndex + 1;
                    if (
                      nextIndex >= 0 &&
                      nextIndex < focusableElements.length
                    ) {
                      (focusableElements[nextIndex] as HTMLElement).focus();
                    }
                  }
                }}
              >
                <ScrollArea className="flex-1">
                   <div className="space-y-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="clientUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g. johndoe"
                                  {...field}
                                  disabled={!!client}
                                  onChange={(e) => {
                                    // force lowercase and strip spaces as user types
                                    const val = e.target.value
                                      .toLowerCase()
                                      .replace(/\s+/g, "");
                                    field.onChange(val);
                                  }}
                                />
                                {!client && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    {checkingUsername && <span>checking…</span>}
                                    {usernameAvailable === true &&
                                      !checkingUsername && (
                                        <span className="text-green-600">
                                          available ✓
                                        </span>
                                      )}
                                    {usernameAvailable === false &&
                                      !checkingUsername && (
                                        <span className="text-red-600">
                                          taken ✗
                                        </span>
                                      )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />

                            {!client && usernameSuggestions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {usernameSuggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() =>
                                      form.setValue("clientUsername", s, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      })
                                    }
                                    className="text-xs rounded-full border px-3 py-1 hover:bg-muted"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!client &&
                              usernameAvailable === true &&
                              !checkingUsername && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Nice! This username is available.
                                </p>
                              )}
                          </FormItem>
                        )}
                      />
                    </div>

                    {!client && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={eyeOpen ? "text" : "password"}
                                  placeholder="••••••••"
                                  {...field}
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEyeOpen((prev) => !prev)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                                >
                                  {eyeOpen ? (
                                    <EyeOff size={18} />
                                  ) : (
                                    <Eye size={18} />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@company.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div>
                      {/* <h3 className="text-base font-medium mb-4">
                        Permissions & Limits
                      </h3> */}
                      <div className="space-y-4">
                        {!client && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-base font-medium mb-4">
                                Account Validity
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <FormField
                                  control={form.control}
                                  name={"validityAmount" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Duration</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          placeholder="e.g. 30"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={"validityUnit" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Unit</FormLabel>
                                      <FormControl>
                                        <select
                                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                          {...field}
                                        >
                                          <option value="days">Days</option>
                                          <option value="months">Months</option>
                                          <option value="years">Years</option>
                                        </select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="sm:col-span-3">
                                  {expiryPreview && (
                                    <p className="text-xs text-muted-foreground">
                                      This account will expire on{" "}
                                      <span className="font-medium">
                                        {expiryPreview}
                                      </span>
                                      .
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="maxCompanies"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Companies.........</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="maxUsers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Users</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div> */}
                        <FormField
                          control={form.control}
                          name="canSendInvoiceEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Send Invoice via Email</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Allow this client to send invoices to their
                                  customers via email.
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="canSendInvoiceWhatsapp"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Send Invoice via WhatsApp</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Allow this client to send invoices via
                                  WhatsApp integration.
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="flex justify-end gap-2 p-6 border-t bg-background">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      !authToken || // <-- block if no token yet
                      isSubmitting ||
                      checkingUsername ||
                      (!client && usernameAvailable === false)
                    }
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="permissions" className="flex-1 mt-0">
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-6">
                <div>
                  <h3 className="text-lg font-medium">Manage Permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Modify usage limits and feature access for this client.
                  </p>
                </div>

                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxCompanies"
                        className="flex items-center gap-3"
                      >
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Max Companies</span>
                      </Label>
                      <Input
                        id="maxCompanies"
                        type="number"
                        value={currentPermissions.maxCompanies || ""}
                        onChange={(e) =>
                          handlePermissionChange(
                            "maxCompanies",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxUsers"
                        className="flex items-center gap-3"
                      >
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Max Users</span>
                      </Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={currentPermissions.maxUsers || ""}
                        onChange={(e) =>
                          handlePermissionChange(
                            "maxUsers",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxInventories"
                        className="flex items-center gap-3"
                      >
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Max Inventories</span>
                      </Label>
                      <Input
                        id="maxInventories"
                        type="number"
                        value={currentPermissions.maxInventories || ""}
                        onChange={(e) =>
                          handlePermissionChange(
                            "maxInventories",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canSendInvoiceEmail"
                          className="font-medium"
                        >
                          Send Invoice via Email
                        </Label>
                      </div>
                      <Switch
                        id="canSendInvoiceEmail"
                        checked={currentPermissions.canSendInvoiceEmail}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canSendInvoiceEmail", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canSendInvoiceWhatsapp"
                          className="font-medium"
                        >
                          Send Invoice via WhatsApp
                        </Label>
                      </div>
                      <Switch
                        id="canSendInvoiceWhatsapp"
                        checked={currentPermissions.canSendInvoiceWhatsapp}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canSendInvoiceWhatsapp", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <Label htmlFor="canCreateUsers" className="font-medium">
                          Create Users
                        </Label>
                      </div>
                      <Switch
                        id="canCreateUsers"
                        checked={currentPermissions.canCreateUsers}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canCreateUsers", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Contact className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canCreateCustomers"
                          className="font-medium"
                        >
                          Create Customers
                        </Label>
                      </div>
                      <Switch
                        id="canCreateCustomers"
                        checked={currentPermissions.canCreateCustomers}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canCreateCustomers", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canCreateVendors"
                          className="font-medium"
                        >
                          Create Vendors
                        </Label>
                      </div>
                      <Switch
                        id="canCreateVendors"
                        checked={currentPermissions.canCreateVendors}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canCreateVendors", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canCreateProducts"
                          className="font-medium"
                        >
                          Create Products
                        </Label>
                      </div>
                      <Switch
                        id="canCreateProducts"
                        checked={currentPermissions.canCreateProducts}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canCreateProducts", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canCreateCompanies"
                          className="font-medium"
                        >
                          Create Companies
                        </Label>
                      </div>
                      <Switch
                        id="canCreateCompanies"
                        checked={currentPermissions.canCreateCompanies}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canCreateCompanies", val)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <Label
                          htmlFor="canUpdateCompanies"
                          className="font-medium"
                        >
                          Update Companies
                        </Label>
                      </div>
                      <Switch
                        id="canUpdateCompanies"
                        checked={currentPermissions.canUpdateCompanies}
                        onCheckedChange={(val) =>
                          handlePermissionChange("canUpdateCompanies", val)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    onClick={handleSavePermissions}
                    disabled={isSavingPermissions}
                  >
                    {isSavingPermissions && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="validity" className="flex-1 mt-0">
            <div className="h-full md:p-6 p-1 pt-4">
              <ClientValidityCard
                clientId={client._id}
                onChanged={() => {
                  // Optional: refresh data if needed
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="password" className="flex-1 mt-0">
            <div className="h-full p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Reset Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Set a new password for {client.contactName}. They will be
                    notified of this change.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={eyeOpenPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setEyeOpenPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                      >
                        {eyeOpenPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    disabled={isSubmittingPassword || !newPassword.trim()}
                    className="w-full"
                  >
                    {isSubmittingPassword && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Create mode - original form
  return (
    <div className="lg:max-h-[80vh] md:max-h-[70vh] max-h-[60vh] overflow-y-auto">
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="contents"
        onKeyDown={(e) => {
          // Prevent form selection on Tab key
          if (e.key === "Tab") {
            e.preventDefault();
            // Find next focusable element
            const focusableElements = document.querySelectorAll(
              'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
            );
            const currentIndex = Array.from(focusableElements).indexOf(
              document.activeElement as Element
            );
            const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            if (nextIndex >= 0 && nextIndex < focusableElements.length) {
              (focusableElements[nextIndex] as HTMLElement).focus();
            }
          }
        }}
      >
        <ScrollArea className="flex-1">
          <div className="space-y-6 px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g. johndoe"
                          {...field}
                          disabled={!!client}
                          onChange={(e) => {
                            // force lowercase and strip spaces as user types
                            const val = e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "");
                            field.onChange(val);
                          }}
                        />
                        {!client && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {checkingUsername && <span>checking…</span>}
                            {usernameAvailable === true &&
                              !checkingUsername && (
                                <span className="text-green-600">
                                  available ✓
                                </span>
                              )}
                            {usernameAvailable === false &&
                              !checkingUsername && (
                                <span className="text-red-600">taken ✗</span>
                              )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />

                    {!client && usernameSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {usernameSuggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              form.setValue("clientUsername", s, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            className="text-xs rounded-full border px-3 py-1 hover:bg-muted"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {!client &&
                      usernameAvailable === true &&
                      !checkingUsername && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Nice! This username is available.
                        </p>
                      )}
                  </FormItem>
                )}
              />
            </div>

            {!client && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={eyeOpen ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setEyeOpen((prev) => !prev)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                        >
                          {eyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} 
                        {...field}
          onChange={(e) => {
            const newPhone = e.target.value.replace(/[^0-9]/g, "");
            if (newPhone === e.target.value) {
              field.onChange(newPhone);
            } else {
              console.log("Only numeric characters are allowed");
            }
          }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-medium mb-4">
                Permissions & Limits
              </h3>
              <div className="space-y-4">
                {!client && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-base font-medium mb-4">
                        Account Validity
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={"validityAmount" as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="e.g. 30"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={"validityUnit" as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                  {...field}
                                >
                                  <option value="days">Days</option>
                                  <option value="months">Months</option>
                                  <option value="years">Years</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="sm:col-span-3">
                          {expiryPreview && (
                            <p className="text-xs text-muted-foreground">
                              This account will expire on{" "}
                              <span className="font-medium">
                                {expiryPreview}
                              </span>
                              .
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxCompanies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Companies</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Users</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="canSendInvoiceEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Send Invoice via Email</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow this client to send invoices to their customers
                          via email.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canSendInvoiceWhatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Send Invoice via WhatsApp</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Allow this client to send invoices via WhatsApp
                          integration.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 p-6 border-t bg-background">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              !authToken || // <-- block if no token yet
              isSubmitting ||
              checkingUsername ||
              (!client && usernameAvailable === false)
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {client ? "Save Changes" : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
}
