"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  ShieldCheck,
  CalendarClock,
  Ban,
  Infinity as InfinityIcon,
  Search,
  Filter,
  Users,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientValidityCard } from "./ClientValidityCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientLite = {
  _id: string;
  clientUsername: string;
  contactName: string;
  email: string;
  phone?: string;
  slug: string;
};

type Validity = {
  enabled: boolean;
  status:
    | "active"
    | "expired"
    | "suspended"
    | "unlimited"
    | "unknown"
    | "disabled";
  expiresAt?: string | null;
  startAt?: string | null;
};

type ClientsValidityManagerProps = {
  onClientClick?: (client: ClientLite) => void;
};

export function ClientsValidityManager({
  onClientClick,
}: ClientsValidityManagerProps = {}) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [clients, setClients] = React.useState<ClientLite[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [validityByClient, setValidityByClient] = React.useState<
    Record<string, Validity>
  >({});
  const [isValidityLoading, setIsValidityLoading] = React.useState(false);

  const lower = (v: unknown) => (v ?? "").toString().toLowerCase();
  const hasText = (v: unknown, q: string) => lower(v).includes(q);

  function toValidity(raw: any): Validity {
    // Unwrap common API shapes
    const v = raw?.validity ?? raw?.data ?? raw ?? {};
    const allowed = new Set([
      "active",
      "expired",
      "suspended",
      "unlimited",
      "unknown",
      "disabled",
    ]);
    const status = allowed.has(v?.status) ? v.status : "unknown";
    return {
      enabled: status === "active" || status === "unlimited",
      status,
      expiresAt: v?.expiresAt ?? null,
      startAt: v?.startAt ?? null,
    };
  }

  // fetch all clients
  React.useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(`${baseURL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();

        const list: ClientLite[] = Array.isArray(data)
          ? data
          : data.clients || [];
        setClients(list);

        setIsValidityLoading(true);
        const results = await Promise.allSettled(
          list.map(async (c) => {
            const vr = await fetch(`${baseURL}/api/account/${c._id}/validity`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });

            // Treat 404 as "no validity yet" rather than throwing
            if (vr.status === 404) return { id: c._id, validity: null };

            if (!vr.ok) {
              const body = await vr.text().catch(() => "");
              throw new Error(
                `GET validity ${vr.status} for ${c.clientUsername}: ${body}`
              );
            }

            // Unwrap to inner doc
            const json = await vr.json(); // { ok, validity }
            return { id: c._id, validity: toValidity(json) };
          })
        );

        const map: Record<string, Validity> = {};
        for (const r of results) {
          if (r.status === "fulfilled") {
            map[r.value.id] = r.value.validity ?? {
              enabled: false,
              status: "unknown",
              expiresAt: null,
              startAt: null,
            };
          } else {
            console.warn("[validity] fetch failed:", r.reason);
          }
        }
        setValidityByClient(map);
        setIsValidityLoading(false);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to load clients",
          description: e instanceof Error ? e.message : "Something went wrong.",
        });
      } finally {
        setIsValidityLoading(false);
        setIsLoading(false);
      }
    })();
  }, [baseURL, toast]);

  const filtered = React.useMemo(() => {
    const q = lower(search.trim());
    const status = statusFilter;

    return clients.filter((c) => {
      // be defensive: any field may be missing/null
      const matchesSearch =
        q.length === 0 ||
        hasText(c?.clientUsername, q) ||
        hasText(c?.contactName, q) ||
        hasText(c?.email, q) ||
        hasText(c?.slug, q) ||
        hasText(c?.phone, q);

      const clientValidity = validityByClient[c?._id];
      const matchesFilter =
        status === "all" ||
        (status === "active" && clientValidity?.status === "active") ||
        (status === "expired" && clientValidity?.status === "expired") ||
        (status === "suspended" && clientValidity?.status === "suspended") ||
        (status === "unlimited" && clientValidity?.status === "unlimited") ||
        (status === "unknown" &&
          (!clientValidity || clientValidity.status === "unknown"));

      return matchesSearch && matchesFilter;
    });
  }, [clients, search, statusFilter, validityByClient]);

  function StatusBadge({ validity }: { validity?: Validity }) {
    const status = (validity?.status ?? "unknown") as Validity["status"];

    const badgeConfig = {
      active: {
        class:
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
        icon: (
          <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full mr-1.5" />
        ),
      },
      expired: {
        class:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        icon: <CalendarClock className="h-3.5 w-3.5 mr-1" />,
      },
      suspended: {
        class:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
        icon: <Ban className="h-3.5 w-3.5 mr-1" />,
      },
      unlimited: {
        class:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        icon: <InfinityIcon className="h-3.5 w-3.5 mr-1" />,
      },
      unknown: {
        class:
          "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        icon: (
          <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full mr-1.5" />
        ),
      },
      disabled: {
        class:
          "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        icon: <Ban className="h-3.5 w-3.5 mr-1" />,
      },
    } as const;

    const config = badgeConfig[status] ?? badgeConfig.unknown;
    const label =
      (status[0]?.toUpperCase() ?? "U") + (status.slice(1) ?? "nknown");

    return (
      <Badge
        variant="outline"
        className={`flex items-center py-1 px-2.5 ${config.class}`}
      >
        {config.icon}
        {label}
      </Badge>
    );
  }
  function fmt(d?: string | null) {
    if (!d) return "—";
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(t));
  }

  const handleManage = (c: ClientLite) => {
    onClientClick?.(c);
  };

  return (
    <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <CardHeader className="bg-muted/40 dark:bg-gray-800/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 dark:text-white">
              <Users className="h-5 w-5" />
              Client Validity Management
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Manage account validity for all clients
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <Filter className="h-4 w-4 mr-2 dark:text-gray-400" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem
                  value="all"
                  className="dark:focus:bg-gray-700 dark:text-white"
                >
                  All Statuses
                </SelectItem>
                <SelectItem
                  value="active"
                  className="dark:focus:bg-gray-700 dark:text-white"
                >
                  Active
                </SelectItem>
                <SelectItem
                  value="expired"
                  className="dark:focus:bg-gray-700 dark:text-white"
                >
                  Expired
                </SelectItem>
                <SelectItem
                  value="suspended"
                  className="dark:focus:bg-gray-700 dark:text-white"
                >
                  Suspended
                </SelectItem>
                <SelectItem
                  value="unlimited"
                  className="dark:focus:bg-gray-700 dark:text-white"
                >
                  Unlimited
                </SelectItem>
                <SelectItem
                  value="unknown"
                  className="dark:focus:bg-gray-700 dark:text-white"
                >
                  Unknown
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center border dark:border-blue-800/50">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {clients.length}
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-300">
                Total Clients
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 text-center border dark:border-emerald-800/50">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {
                  clients.filter(
                    (c) => validityByClient[c._id]?.status === "active"
                  ).length
                }
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                Active
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center border dark:border-red-800/50">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {
                  clients.filter(
                    (c) => validityByClient[c._id]?.status === "expired"
                  ).length
                }
              </div>
              <div className="text-xs text-red-800 dark:text-red-300">
                Expired
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 text-center border dark:border-amber-800/50">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {
                  clients.filter(
                    (c) => validityByClient[c._id]?.status === "suspended"
                  ).length
                }
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-300">
                Disabled
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center border dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {
                  clients.filter(
                    (c) =>
                      !validityByClient[c._id] ||
                      validityByClient[c._id]?.status === "unknown"
                  ).length
                }
              </div>
              <div className="text-xs text-gray-800 dark:text-gray-300">
                Unknown
              </div>
            </div>
          </div>
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <Input
                placeholder="Search clients by name, email, or contact..."
                className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Mobile View Cards */}
          <div className="space-y-4 md:hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-1">No clients found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filtered.map((c) => {
                const v = validityByClient[c._id];
                return (
                  <Card key={c._id} className="border p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-lg font-medium">
                        {c.clientUsername}
                      </div>
                      <StatusBadge validity={v} />
                    </div>
                    <div className="flex justify-between items-center ">
                      <div>
                        <div className="text-sm mb-2">{c.contactName}</div>
                        <div className="text-sm mb-2">{fmt(v?.expiresAt)}</div>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          onClick={() => handleManage(c)}
                          className=" mx-auto"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Clients Table */}
          <div className="rounded-lg border overflow-hidden dark:border-gray-700">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-gray-400 mb-4" />
                <p className="text-muted-foreground dark:text-gray-400">
                  Loading clients...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center dark:bg-gray-900">
                <Users className="h-12 w-12 text-muted-foreground dark:text-gray-600 mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-1 dark:text-white">
                  No clients found
                </h3>
                <p className="text-muted-foreground dark:text-gray-400 text-sm">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No clients available in the system"}
                </p>
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 dark:bg-gray-800">
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="font-semibold dark:text-white">
                        Client
                      </TableHead>
                      <TableHead className="font-semibold dark:text-white">
                        Contact
                      </TableHead>
                      <TableHead className="font-semibold dark:text-white">
                        Contact Info
                      </TableHead>
                      <TableHead className="font-semibold dark:text-white">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold dark:text-white">
                        Expires
                      </TableHead>
                      <TableHead className="font-semibold text-right dark:text-white">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const v = validityByClient[c._id];
                      return (
                        <TableRow
                          key={c._id}
                          className="hover:bg-muted/30 dark:hover:bg-gray-800/50 dark:border-gray-700"
                        >
                          <TableCell className="font-medium">
                            <div
                              className="flex flex-col cursor-pointer hover:text-primary dark:text-white dark:hover:text-blue-400"
                              onClick={() => onClientClick?.(c)}
                            >
                              <span>{c.clientUsername}</span>
                              <span className="text-xs text-muted-foreground dark:text-gray-400">
                                {c.slug}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <span
                              className="cursor-pointer hover:text-primary dark:hover:text-blue-400"
                              onClick={() => onClientClick?.(c)}
                            >
                              {c.contactName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                                <span className="truncate max-w-[160px] dark:text-gray-300">
                                  {c.email}
                                </span>
                              </div>
                              {c.phone && (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                                  <span className="dark:text-gray-300">
                                    {c.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isValidityLoading && !v ? (
                              <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-sm">Loading…</span>
                              </div>
                            ) : (
                              <StatusBadge validity={v} />
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap dark:text-gray-300">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                              <span>{fmt(v?.expiresAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleManage(c)}
                              className="gap-1.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Edit Client
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination would go here */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-gray-400">
              <div>
                Showing {filtered.length} of {clients.length} clients
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
