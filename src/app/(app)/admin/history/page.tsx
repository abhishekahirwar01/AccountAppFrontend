"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Loader2,
  Bell,
  Calendar,
  Building,
  Mail,
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
  Filter,
  Search,
  Eye,
  CalendarDays,
  UserCheck,
  Building2,
  BadgeCheck,
  CalendarClock,
  Ban,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

function StatusBadge({ validity }: { validity?: Validity }) {
  const enabled = validity?.enabled ?? false;
  const label = enabled ? "Active" : "Expired";
  const className = enabled
    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60"
    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60";

  return (
    <Badge className={className}>
      {label}
    </Badge>
  );
}

// Client Type based on your API response
interface Client {
  _id: string;
  clientUsername: string;
  contactName: string;
  phone: string;
  email: string;
  maxCompanies: number;
  userLimit: number;
  createdAt: string;
  updatedAt: string;
  businessName?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  action: string;
  entityId: string;
  entityType: string;
  recipient: any;
  triggeredBy: any;
  client: {
    _id: string;
    businessName?: string;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  clientUsername: string;
  contactName: string;
  phone: string;
  email: string;
  maxCompanies: number;
  userLimit: number;
  createdAt: string;
  updatedAt: string;
  businessName?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  action: string;
  entityId: string;
  entityType: string;
  recipient: any;
  triggeredBy: any;
  client: {
    _id: string;
    businessName?: string;
  };
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

const HistoryPage = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [clients, setClients] = useState<Client[]>([]);
  const [validityByClient, setValidityByClient] = useState<Record<string, Validity>>({});
  const [isValidityLoading, setIsValidityLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [copied, setCopied] = useState(false);
  const name = selectedClient?.contactName || "—";
  const phone = selectedClient?.phone || "—";

  const handleCopy = async () => {
    if (!selectedClient?.phone) return;
    try {
      await navigator.clipboard.writeText(selectedClient.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  // Fetch the list of clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const res = await fetch(`${baseURL}/api/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients", error);
        setError("Failed to load clients. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, [baseURL]);

  // Fetch validities for all clients
  useEffect(() => {
    const fetchValidities = async () => {
      if (clients.length === 0) return;
      setIsValidityLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const results = await Promise.allSettled(
          clients.map(async (client) => {
            const vr = await fetch(`${baseURL}/api/account/${client._id}/validity`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });

            // Treat 404 as "no validity yet" rather than throwing
            if (vr.status === 404) return { id: client._id, validity: null };

            if (!vr.ok) {
              const body = await vr.text().catch(() => "");
              throw new Error(
                `GET validity ${vr.status} for ${client.clientUsername}: ${body}`
              );
            }

            // Unwrap to inner doc
            const json = await vr.json(); // { ok, validity }
            return { id: client._id, validity: toValidity(json) };
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
        // Ensure all clients have an entry
        clients.forEach((client) => {
          if (!map[client._id]) {
            map[client._id] = {
              enabled: false,
              status: "unknown",
              expiresAt: null,
              startAt: null,
            };
          }
        });
        setValidityByClient(map);
      } catch (error) {
        console.error("Error fetching validities", error);
      } finally {
        setIsValidityLoading(false);
      }
    };
    fetchValidities();
  }, [clients, baseURL]);
  
  const token = localStorage.getItem("token");
  
  // Fetch notifications for a specific client
  const fetchNotifications = async (clientId: string) => {
    setNotificationsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${baseURL}/api/notifications/master/${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Transform the API response to match our Notification interface
      const apiNotifications = response.data.notifications.map(
        (notif: any) => ({
          _id: notif._id,
          title: notif.title || `${notif.action} - ${notif.entityType}`,
          message: notif.message,
          type: notif.type,
          action: notif.action,
          entityId: notif.entityId,
          entityType: notif.entityType,
          recipient: notif.recipient,
          triggeredBy: notif.triggeredBy,
          client: notif.client,
          read: notif.read,
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
        })
      );

      setNotifications(apiNotifications);
    } catch (error) {
      console.error("Error fetching notifications", error);
      // setError("No Notifications found for this client");
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!selectedClient) return;

    try {
      // Update local state first for immediate UI feedback
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      // Make API call to mark all as read
      await axios.patch(
        `${baseURL}/api/notifications/master/${selectedClient._id}/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error marking notifications as read", error);
      // Revert UI changes if API call fails
      fetchNotifications(selectedClient._id);
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setError(null);
    setNotifications([]);
    setNotificationsLoading(true);
    fetchNotifications(client._id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper functions for the new notification UI
  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";

    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-amber-600 dark:text-amber-400`} />;
      case "error":
        return <XCircle className={`${iconClass} text-red-600 dark:text-red-400`} />;
      case "info":
      default:
        return <Info className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
    }
  };

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 dark:bg-green-900/30";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "error":
        return "bg-red-100 dark:bg-red-900/30";
      case "info":
      default:
        return "bg-blue-100 dark:bg-blue-900/30";
    }
  };

  // Filter clients based on search query and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.clientUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.businessName && client.businessName.toLowerCase().includes(searchQuery.toLowerCase()));

    const validity = validityByClient[client._id];
    const isActive = validity?.enabled ?? false;

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                Client History
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              View client details and notification history
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 py-2 px-4 rounded-xl shadow-sm dark:shadow-md dark:border dark:border-gray-700">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-sm font-medium dark:text-gray-300 block">
                {clients.length} Clients
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total registered
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <Input
                placeholder="Search clients by name, email, or business..."
                className="pl-10 h-11 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-gray-700 rounded-lg">
                <Filter className="h-4 w-4 text-slate-600 dark:text-gray-300" />
              </div>
              <span className="text-sm text-slate-600 dark:text-gray-300 whitespace-nowrap">
                Filter by:
              </span>
              <select 
                className="h-11 px-3 rounded-xl border border-slate-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Clients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading clients...</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Please wait while we fetch your data</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 cursor-pointer relative"
                onClick={() => handleClientClick(client)}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 relative">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                        <span className="text-blue-700 dark:text-blue-400 font-bold text-lg">
                          {getInitials(
                            client.contactName || client.clientUsername
                          )}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 dark:bg-green-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-slate-800 dark:text-slate-200 truncate text-lg">
                        {client.businessName || client.clientUsername}
                      </h2>
                      <div className="flex items-center mt-2 text-slate-600 dark:text-slate-400 text-sm">
                        <UserCheck className="h-4 w-4 mr-1.5" />
                        <span className="truncate">{client.contactName}</span>
                      </div>
                       <div className="flex items-center mt-2 text-slate-500 dark:text-slate-500 text-sm">
                        <Phone className="h-4 w-4 mr-1.5" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                      <div className="flex items-center mt-2 text-slate-500 dark:text-slate-500 text-sm">
                        <Mail className="h-4 w-4 mr-1.5" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                      <CalendarDays className="h-4 w-4 mr-1.5" />
                      <span>Joined {formatDate(client.createdAt)}</span>
                    </div>
                    {isValidityLoading && !validityByClient[client._id] ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-sm">Loading…</span>
                      </div>
                    ) : (
                      <StatusBadge validity={validityByClient[client._id]} />
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-gray-700/60 px-6 py-3 border-t border-slate-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                      <Bell className="h-4 w-4 mr-1.5" />
                      <span>View notifications</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 dark:bg-gray-700 mb-4">
              <Building2 className="h-8 w-8 text-slate-400 dark:text-gray-500" />
            </div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 text-lg">
              No clients found
            </h4>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery ? "No clients match your search criteria. Try a different search term." : "You don't have any clients yet. Clients will appear here once they're registered."}
            </p>
          </div>
        )}

        <Sheet
          open={!!selectedClient}
          onOpenChange={() => setSelectedClient(null)}
        >
          <SheetContent className="w-full sm:max-w-lg lg:max-w-xl overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
            {selectedClient && (
              <>
                <SheetHeader className="pb-6 border-b border-slate-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                      <span className="text-blue-700 dark:text-blue-400 font-bold text-xl">
                        {getInitials(
                          selectedClient.contactName ||
                            selectedClient.clientUsername
                        )}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-2xl text-slate-800 dark:text-slate-200 truncate">
                        {selectedClient.businessName ||
                          selectedClient.clientUsername}
                      </SheetTitle>
                      <SheetDescription className="flex items-center mt-1 dark:text-gray-400 truncate">
                        <Mail className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        {selectedClient.email}
                      </SheetDescription>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4">
                    {/* Contact name */}
                    <div className="flex min-w-0 items-center bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      <User
                        className="mr-2 h-4 w-4 text-slate-500 dark:text-gray-400"
                        aria-hidden="true"
                      />
                      <span
                        className="truncate text-sm font-medium dark:text-gray-300"
                        title={name}
                      >
                        {name}
                      </span>
                    </div>

                    {/* Phone with tel link + copy */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      <Phone
                        className="h-4 w-4 text-slate-500 dark:text-gray-400"
                        aria-hidden="true"
                      />
                      {selectedClient?.phone ? (
                        <a
                          href={`tel:${phone.replace(/\s+/g, "")}`}
                          className="text-sm underline-offset-2 hover:underline dark:text-gray-300"
                        >
                          {phone}
                        </a>
                      ) : (
                        <span className="text-sm dark:text-gray-300">{phone}</span>
                      )}

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center rounded-lg border border-slate-200 dark:border-gray-600 px-2 py-1 text-xs text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 active:scale-[0.98] transition"
                        title={copied ? "Copied!" : "Copy phone"}
                        aria-label={
                          copied ? "Phone copied" : "Copy phone number"
                        }
                        disabled={!selectedClient?.phone}
                      >
                        {copied ? (
                          <Check className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <Copy className="mr-1 h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </SheetHeader>

                <div className="py-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg mr-2">
                        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Notification History
                    </h3>
                    {notifications.length > 0 && (
                      <button
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"
                        onClick={markAllAsRead}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notificationsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400 mx-auto" />
                        <p className="text-slate-600 dark:text-slate-400 mt-4">
                          Loading notifications...
                        </p>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-gray-800 rounded-xl">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-200 dark:bg-gray-700 mb-4">
                        <Bell className="h-8 w-8 text-slate-400 dark:text-gray-500" />
                      </div>
                      <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                        No notifications yet
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Notifications for this client will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`relative p-4 rounded-xl shadow-sm transition-all hover:shadow-md ${
                            notification.read 
                              ? "bg-white dark:bg-gray-800" 
                              : "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-400 dark:border-l-blue-500"
                          } border border-slate-200 dark:border-gray-700`}
                        >
                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 h-10 w-10 text-sm rounded-xl flex items-center justify-center ${getNotificationIconBg(
                                notification.type
                              )}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                  {formatDate(notification.createdAt)}
                                </span>
                                {notification.triggeredBy && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>
                                      By:{" "}
                                      {notification.triggeredBy.userName ||
                                        notification.triggeredBy.email}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default HistoryPage;