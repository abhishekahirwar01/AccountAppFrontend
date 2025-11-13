"use client";

import { useState, useEffect } from "react";
import { Bell, X, Play, CheckCircle, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  name: string;
  sectionUrl: string;
  gifUrl: string;
  description: string;
}

interface UpdateNotification {
  _id: string;
  title: string;
  description: string;
  version: string;
  features: Feature[];
  exploredSections: string[];
  dismissed: boolean;
  propagatedToClients: boolean;
  visibility?: string;
  createdAt: string;
}

const UpdateNotification = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<UpdateNotification | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isPropagatingAll, setIsPropagatingAll] = useState(false);
  const [isPropagatingAdmins, setIsPropagatingAdmins] = useState(false);
  const [dismissAlertOpen, setDismissAlertOpen] = useState(false);
  const [notificationToDismiss, setNotificationToDismiss] = useState<
    string | null
  >(null);
  const [changeMode, setChangeMode] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  const { toast } = useToast();

  // Helper function to get user ID from token or user data
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user._id || user.id) {
          return user._id || user.id;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload._id || payload.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const user = JSON.parse(userData);
    const userId = getUserIdFromToken();
    if (!userId) return;

    const newSocket = io(baseURL || "http://localhost:8745");
    setSocket(newSocket);

    // Join appropriate room based on user role
    if (user.role === "master") {
      newSocket.emit("joinRoom", {
        userId: userId,
        role: "master",
      });

      // Listen for new update notifications
      newSocket.on("newUpdateNotification", (data) => {
        fetchNotifications();
        toast({
          title: "New Update Available",
          description: data.message,
        });
      });

      // Listen for dismissed notifications
      newSocket.on("updateNotificationDismissed", (data) => {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== data.notificationId)
        );
      });
    } else {
      // For clients/users, join user room
      newSocket.emit("joinRoom", {
        userId: userId,
        role: user.role || "user",
      });

      // Listen for new notifications
      newSocket.on("newNotification", (data) => {
        fetchNotifications();
        toast({
          title: "New Update Available",
          description: data.message,
        });
      });
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for refresh events from the badge
  useEffect(() => {
    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener("refreshUpdateNotifications", handleRefresh);

    // Set up auto-dismissal check every hour
    const autoDismissInterval = setInterval(() => {
      checkAndAutoDismissNotifications();
    }, 60 * 60 * 1000); // Check every hour

    return () => {
      window.removeEventListener("refreshUpdateNotifications", handleRefresh);
      clearInterval(autoDismissInterval);
    };
  }, []);

  // Function to check and auto-dismiss old notifications
  const checkAndAutoDismissNotifications = async () => {
    const dismissedNotifications = JSON.parse(
      localStorage.getItem("dismissedNotifications") || "{}"
    );
    const now = new Date();

    for (const [notificationId, data] of Object.entries(
      dismissedNotifications
    )) {
      const autoDismissAt = new Date((data as any).autoDismissAt);

      if (now >= autoDismissAt) {
        try {
          const token = localStorage.getItem("token");

          // For master admins, actually dismiss the update notification
          await axios.patch(
            `${baseURL}/api/update-notifications/dismiss/${notificationId}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          console.log(
            `Auto-dismissed master admin notification ${notificationId} after 36 hours`
          );

          // Remove from localStorage
          delete dismissedNotifications[notificationId];
          localStorage.setItem(
            "dismissedNotifications",
            JSON.stringify(dismissedNotifications)
          );

          // Refresh the notifications list
          fetchNotifications();
        } catch (error) {
          console.error(
            `Error auto-dismissing notification ${notificationId}:`,
            error
          );
        }
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) return;

      const user = JSON.parse(userData);
      const userId = getUserIdFromToken();
      if (!userId) {
        console.error("User ID not found in token");
        return;
      }

      let notificationsData: UpdateNotification[] = [];

      if (user.role === "master") {
        // For master admins, fetch update notifications
        const response = await axios.get(
          `${baseURL}/api/update-notifications/master/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        let masterNotifications = response.data.notifications || [];

        // Filter out notifications that are in grace period (dismissed but not yet auto-dismissed)
        const dismissedNotifications = JSON.parse(
          localStorage.getItem("dismissedNotifications") || "{}"
        );
        const now = new Date();

        notificationsData = masterNotifications
          .filter((n: UpdateNotification) => {
            if (!n.dismissed) return true; // Not dismissed, show it

            // Check if it's in grace period
            const dismissedData = dismissedNotifications[n._id];
            if (dismissedData) {
              const autoDismissAt = new Date(dismissedData.autoDismissAt);
              return now >= autoDismissAt; // Grace period expired, hide it
            }

            return false; // Dismissed and no grace period data, hide it
          })
          .map((n: any) => ({
            ...n,
            visibility: n.visibility || "all", // Ensure visibility is set
          }));

        console.log("Fetched master notifications:", notificationsData);
      } else {
        // For clients/users, fetch regular notifications with update type
        try {
          const response = await axios.get(
            `${baseURL}/api/notifications/user/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const allNotifications =
            response.data.notifications || response.data || [];
          console.log("Fetched client notifications:", allNotifications);

          // Filter for update notifications that have been propagated
          const updateNotifications = allNotifications.filter(
            (n: any) =>
              n.type === "system" &&
              n.action === "update" &&
              n.entityType === "UpdateNotification"
          );

          // Convert regular notifications to UpdateNotification format
          notificationsData = updateNotifications.map((n: any) => ({
            _id: n.entityId, // Use the original update notification ID
            title: n.title,
            description: n.message,
            version: n.metadata?.updateVersion || "Unknown",
            features: [], // Regular notifications don't have features
            exploredSections: [], // Clients can't explore sections
            dismissed: n.read, // Use read status as dismissed
            propagatedToClients: true, // These are already propagated
            createdAt: n.createdAt,
          }));

          console.log("Converted update notifications:", notificationsData);
        } catch (clientError) {
          console.error("Error fetching client notifications:", clientError);
        }
      }

      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching update notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get the correct URL based on user role and available pages
  const getRoleBasedUrl = (baseUrl: string) => {
    const userData = localStorage.getItem("user");
    if (!userData) return baseUrl;

    const user = JSON.parse(userData);

    // Define which pages exist for which roles
    const pageMappings = {
      "/dashboard": {
        master: "/admin/dashboard",
        client: "/dashboard",
      },
      "/companies": {
        master: "/admin/companies",
        client: "/companies",
      },
      "/settings": {
        master: "/admin/settings",
        client: "/settings",
      },
      "/client-management": {
        master: "/admin/client-management",
        client: null, // Clients don't have access to client management
      },
      "/analytics": {
        master: "/admin/analytics",
        client: null, // Clients don't have access to analytics
      },
      "/transactions": {
        master: null, // Master admins don't have direct transaction access
        client: "/transactions",
      },
    };

    const mapping = pageMappings[baseUrl as keyof typeof pageMappings];
    if (mapping) {
      const roleUrl = mapping[user.role as keyof typeof mapping];
      if (roleUrl) {
        return roleUrl;
      }
      // If no URL for this role, return null to indicate page doesn't exist
      return null;
    }

    // If no mapping found, return the base URL as fallback
    return baseUrl;
  };

  const handleFeatureClick = async (
    notification: UpdateNotification,
    feature: Feature,
    showDemo: boolean = true
  ) => {
    // Only allow exploration for master admins
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const user = JSON.parse(userData);
    if (user.role !== "master") return;

    // Mark section as explored
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${baseURL}/api/update-notifications/explore-section`,
        {
          notificationId: notification._id,
          sectionUrl: feature.sectionUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id
            ? {
                ...n,
                exploredSections: [...n.exploredSections, feature.sectionUrl],
              }
            : n
        )
      );

      // Navigate to the section with role-based URL
      const targetUrl = getRoleBasedUrl(feature.sectionUrl);
      if (targetUrl) {
        router.push(targetUrl);
      } else {
        // Page doesn't exist for this user role
        console.warn(
          `Page ${feature.sectionUrl} is not available for ${user.role} role`
        );
        // Could show a toast notification here
      }

      // Show GIF in modal only if requested
      if (showDemo) {
        setSelectedFeature(feature);
      }
    } catch (error) {
      console.error("Error marking section as explored:", error);
    }
  };

  const handleViewDemoClick = async (
    notification: UpdateNotification,
    feature: Feature,
    event: React.MouseEvent
  ) => {
    // Prevent the parent div's onClick from firing
    event.stopPropagation();

    // Navigate to feature without showing modal
    await handleFeatureClick(notification, feature, false);
  };

  const handleDismiss = (notificationId: string) => {
    const notification = notifications.find((n) => n._id === notificationId);
    const userData = localStorage.getItem("user");

    if (!userData || !notification) return;

    const user = JSON.parse(userData);

    // For master admins, check if notification has been propagated to clients
    if (user.role === "master" && !notification.propagatedToClients) {
      setNotificationToDismiss(notificationId);
      setDismissAlertOpen(true);
      return;
    }

    // If already propagated or for clients, proceed with dismissal
    performDismiss(notificationId);
  };

  const performDismiss = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!userData) return;

      const user = JSON.parse(userData);
      const userId = getUserIdFromToken();

      if (user.role === "master") {
        // For master admins, dismiss immediately via API
        await axios.patch(
          `${baseURL}/api/update-notifications/dismiss/${notificationId}`,
          {
            userId: userId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`Master admin dismissed notification ${notificationId}`);
      } else {
        // For clients, dismiss via API and mark regular notification as read
        await axios.patch(
          `${baseURL}/api/update-notifications/dismiss/${notificationId}`,
          {
            userId: userId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Also mark the regular notification as read
        const response = await axios.get(
          `${baseURL}/api/notifications/user/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const allNotifications =
          response.data.notifications || response.data || [];
        const targetNotification = allNotifications.find(
          (n: any) =>
            n.entityId === notificationId &&
            n.type === "system" &&
            n.action === "update"
        );

        if (targetNotification) {
          await axios.patch(
            `${baseURL}/api/notifications/mark-as-read/${targetNotification._id}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(`Client dismissed notification ${notificationId}`);
        }
      }

      // Remove from local state immediately for better UX
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handleConfirmDismiss = () => {
    if (notificationToDismiss) {
      performDismiss(notificationToDismiss);
      setDismissAlertOpen(false);
      setNotificationToDismiss(null);
    }
  };

  const handlePropagateToAllUsers = async (notificationId: string) => {
    try {
      setIsPropagatingAll(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${baseURL}/api/update-notifications/propagate-all/${notificationId}`,
        { force: true }, // Allow re-propagation
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, propagatedToClients: true, visibility: "all" }
            : n
        )
      );

      toast({
        title: "Success",
        description:
          "Update notification sent to all users (clients, users, and admins)",
      });
    } catch (error) {
      console.error("Error propagating to all users:", error);
      toast({
        title: "Error",
        description: "Failed to send notifications to all users",
        variant: "destructive",
      });
    } finally {
      setIsPropagatingAll(false);
    }
  };

  const handlePropagateToAdminsOnly = async (notificationId: string) => {
    try {
      setIsPropagatingAdmins(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${baseURL}/api/update-notifications/propagate-admins/${notificationId}`,
        { force: true }, // Allow re-propagation
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, propagatedToClients: true, visibility: "admins" }
            : n
        )
      );

      toast({
        title: "Success",
        description:
          "Update notification sent to admins only (clients and admins)",
      });
    } catch (error) {
      console.error("Error propagating to admins only:", error);
      toast({
        title: "Error",
        description: "Failed to send notifications to admins",
        variant: "destructive",
      });
    } finally {
      setIsPropagatingAdmins(false);
    }
  };

  const getExploredCount = (notification: UpdateNotification) => {
    return notification.exploredSections.length;
  };

  const getTotalFeatures = (notification: UpdateNotification) => {
    return notification.features.length;
  };

  // Helper function to render markdown-style text
  const renderMarkdown = (text: string) => {
    // Split by newlines first
    const lines = text.split("\n");

    return lines.map((line, lineIndex) => {
      // Handle bold text within each line
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const processedLine = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={`${lineIndex}-${partIndex}`}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Return line with proper spacing
      return (
        <div key={lineIndex} className={line.trim() === "" ? "h-2" : ""}>
          {processedLine}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return null; // No notifications to show
  }

  return (
    <>
      <div className="space-y-4">
        {notifications.map((notification) => {
          const userData = localStorage.getItem("user");
          const user = userData ? JSON.parse(userData) : null;
          const isMaster = user?.role === "master";
          const hasFeatures =
            notification.features && notification.features.length > 0;

          return (
            <Card
              key={notification._id}
              className="border-l-4 border-l-blue-500"
            >
       
              {/* ✅ Desktop / Laptop Table */}
              <div className="hidden md:block">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {notification.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Version {notification.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMaster && hasFeatures && (
                        <Badge
                          variant="secondary"
                          className="bg-secondary/50 text-secondary-foreground"
                        >
                          {getExploredCount(notification)}/
                          {getTotalFeatures(notification)} explored
                        </Badge>
                      )}
                      {isMaster &&
                      hasFeatures &&
                      getExploredCount(notification) ===
                        getTotalFeatures(notification) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismiss(notification._id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700 transition-colors duration-200"
                        >
                          <X className="h-3 w-3 mr-1.5" />
                          Dismiss
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(notification._id)}
                          className="hover:bg-muted/50 dark:hover:bg-muted/80"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 text-foreground/90">
                    {notification.description}
                  </p>

                  {/* {isMaster && hasFeatures && (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-foreground">
                          New Features:
                        </h4>
                        {notification.features.map((feature, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all duration-200 ${
                              notification.exploredSections.includes(
                                feature.sectionUrl
                              )
                                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                : "bg-background border-border dark:bg-card dark:border-border/50"
                            } hover:bg-muted/50 dark:hover:bg-muted/80`}
                            onClick={() =>
                              handleFeatureClick(notification, feature)
                            }
                            role="button"
                            tabIndex={0}
                            aria-label={`Explore ${feature.name} feature`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleFeatureClick(notification, feature);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {notification.exploredSections.includes(
                                feature.sectionUrl
                              ) ? (
                                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                              ) : (
                                <Play className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              )}
                              <span className="text-sm font-medium text-foreground">
                                {feature.name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90 dark:hover:text-primary-foreground border-border dark:border-border/60"
                              onClick={(event) =>
                                handleViewDemoClick(
                                  notification,
                                  feature,
                                  event
                                )
                              }
                            >
                              View Demo
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4 bg-border/50 dark:bg-border/30" />
                    </>
                  )} */}

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">
                      {isMaster && hasFeatures
                        ? getExploredCount(notification) ===
                          getTotalFeatures(notification)
                          ? "All features explored - click 'Remove Notification' to dismiss"
                          : "Click on features to view demo or click 'View Demo' to go directly to the feature"
                        : "Update notification from your administrator - will auto-dismiss in 36 hours"}
                    </p>

                    {/* Notification buttons logic */}
                    {isMaster && !notification.propagatedToClients && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePropagateToAllUsers(notification._id)
                          }
                          disabled={isPropagatingAll}
                          className="border-border dark:border-border/60 dark:hover:bg-muted/80"
                        >
                          {isPropagatingAll ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Users className="h-4 w-4 mr-2" />
                          )}
                          Notify All Users
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePropagateToAdminsOnly(notification._id)
                          }
                          disabled={isPropagatingAdmins}
                          className="border-border dark:border-border/60 dark:hover:bg-muted/80"
                        >
                          {isPropagatingAdmins ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Users className="h-4 w-4 mr-2" />
                          )}
                          Notify Only Admins
                        </Button>
                      </div>
                    )}

                    {/* After notification is sent */}
                    {isMaster &&
                      notification.propagatedToClients &&
                      !changeMode[notification._id] && (
                        <div className="flex flex-col gap-2 items-end">
                          <div className="text-sm text-muted-foreground dark:text-muted-foreground/80 text-right">
                            {notification.visibility === "admins"
                              ? "You have notified clients and their admins only"
                              : "Notifications sent to all users"}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setChangeMode((prev) => ({
                                ...prev,
                                [notification._id]: true,
                              }))
                            }
                            className="border-border dark:border-border/60  dark:hover:bg-muted/80"
                          >
                            Change Notification
                          </Button>
                        </div>
                      )}

                    {/* Change mode - show buttons again */}
                    {isMaster && changeMode[notification._id] && (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                          Change notification audience:
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handlePropagateToAllUsers(notification._id)
                            }
                            disabled={isPropagatingAll}
                            className="border-border dark:border-border/60 dark:hover:bg-muted/80"
                          >
                            {isPropagatingAll ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Users className="h-4 w-4 mr-2" />
                            )}
                            Notify All Users
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handlePropagateToAdminsOnly(notification._id)
                            }
                            disabled={isPropagatingAdmins}
                            className="border-border dark:border-border/60 dark:hover:bg-muted/80"
                          >
                            {isPropagatingAdmins ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Users className="h-4 w-4 mr-2" />
                            )}
                            Notify Only Admins
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setChangeMode((prev) => ({
                                ...prev,
                                [notification._id]: false,
                              }))
                            }
                            className="hover:bg-muted/50 dark:hover:bg-muted/80"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isMaster && notification.propagatedToClients && (
                      <Badge
                        variant="secondary"
                        className="bg-secondary/50 text-secondary-foreground dark:bg-secondary/30"
                      >
                        <CheckCircle className="h-3 w-3 mr-1 dark:text-green-400" />
                        Update Available
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </div>

             {/* 📱 Mobile UI */}
<div className="block md:hidden">
  <CardHeader className="pb-3 px-4">
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base line-clamp-2 text-foreground">
            {notification.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-1">
            Version {notification.version}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isMaster && hasFeatures && (
            <Badge
              variant="secondary"
              className="text-xs whitespace-nowrap bg-secondary/50 text-secondary-foreground dark:bg-secondary/30"
            >
              {getExploredCount(notification)}/
              {getTotalFeatures(notification)}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(notification._id)}
            className="h-8 w-8 p-0 hover:bg-muted/50 dark:hover:bg-muted/80"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Dismiss button for completed features - Mobile */}
      {isMaster &&
        hasFeatures &&
        getExploredCount(notification) ===
          getTotalFeatures(notification) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDismiss(notification._id)}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 dark:hover:border-red-700 transition-colors duration-200 text-xs py-1.5"
          >
            <X className="h-3 w-3 mr-1.5" />
            Dismiss Notification
          </Button>
        )}
    </div>
  </CardHeader>

  <CardContent className="px-4">
    <p className="text-sm mb-4 leading-relaxed text-foreground/90 dark:text-foreground/80">
      {notification.description}
    </p>

    {isMaster && hasFeatures && (
      <>
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-foreground">New Features:</h4>
          {notification.features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col p-3 rounded border cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/80 gap-2 transition-all duration-200 ${
                notification.exploredSections.includes(
                  feature.sectionUrl
                )
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-background border-border dark:bg-card dark:border-border/50"
              }`}
              onClick={() =>
                handleFeatureClick(notification, feature)
              }
              role="button"
              tabIndex={0}
              aria-label={`Explore ${feature.name} feature`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleFeatureClick(notification, feature);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {notification.exploredSections.includes(
                    feature.sectionUrl
                  ) ? (
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <Play className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate text-foreground">
                    {feature.name}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs w-full justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary/90 dark:hover:text-primary-foreground py-1.5 border-border dark:border-border/60"
                onClick={(event) =>
                  handleViewDemoClick(
                    notification,
                    feature,
                    event
                  )
                }
              >
                View Demo
              </Badge>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-border/50 dark:bg-border/30" />
      </>
    )}

    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 leading-relaxed">
        {isMaster && hasFeatures
          ? getExploredCount(notification) ===
            getTotalFeatures(notification)
            ? "All features explored - dismiss when ready"
            : "Tap features to view demo or 'View Demo' to go directly"
          : "Update notification from your administrator - will auto-dismiss in 36 hours"}
      </p>

      {/* Notification buttons logic - Mobile */}
      {isMaster && !notification.propagatedToClients && (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePropagateToAllUsers(notification._id)
            }
            disabled={isPropagatingAll}
            className="w-full text-xs py-1.5 border-border dark:border-border/60 dark:hover:bg-muted/80"
          >
            {isPropagatingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <Users className="h-3.5 w-3.5 mr-2" />
            )}
            Notify All Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePropagateToAdminsOnly(notification._id)
            }
            disabled={isPropagatingAdmins}
            className="w-full text-xs py-1.5 border-border dark:border-border/60 dark:hover:bg-muted/80"
          >
            {isPropagatingAdmins ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <Users className="h-3.5 w-3.5 mr-2" />
            )}
            Notify Only Admins
          </Button>
        </div>
      )}

      {/* After notification is sent - Mobile */}
      {isMaster &&
        notification.propagatedToClients &&
        !changeMode[notification._id] && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground dark:text-muted-foreground/80 text-center">
              {notification.visibility === "admins"
                ? "Notified clients and admins only"
                : "Notifications sent to all users"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setChangeMode((prev) => ({
                  ...prev,
                  [notification._id]: true,
                }))
              }
              className="w-full text-xs py-1.5 border-border dark:border-border/60 hover:bg-muted/50 dark:hover:bg-muted/80"
            >
              Change Notification
            </Button>
          </div>
        )}

      {/* Change mode - show buttons again - Mobile */}
      {isMaster && changeMode[notification._id] && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground dark:text-muted-foreground/80 text-center">
            Change notification audience:
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePropagateToAllUsers(notification._id)
              }
              disabled={isPropagatingAll}
              className="w-full text-xs py-1.5 border-border dark:border-border/60 dark:hover:bg-muted/80"
            >
              {isPropagatingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Users className="h-3.5 w-3.5 mr-2" />
              )}
              Notify All Users
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePropagateToAdminsOnly(notification._id)
              }
              disabled={isPropagatingAdmins}
              className="w-full text-xs py-1.5 border-border dark:border-border/60 dark:hover:bg-muted/80"
            >
              {isPropagatingAdmins ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Users className="h-3.5 w-3.5 mr-2" />
              )}
              Notify Only Admins
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setChangeMode((prev) => ({
                  ...prev,
                  [notification._id]: false,
                }))
              }
              className="w-full text-xs py-1.5 hover:bg-muted/50 dark:hover:bg-muted/80"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!isMaster && notification.propagatedToClients && (
        <Badge
          variant="secondary"
          className="w-full justify-center py-1.5 bg-secondary/50 text-secondary-foreground dark:bg-secondary/30"
        >
          <CheckCircle className="h-3 w-3 mr-1 dark:text-green-400" />
          Update Available
        </Badge>
      )}
    </div>
  </CardContent>
</div>
            </Card>
          );
        })}
      </div>

      {/* Dismiss Warning Alert */}
      <AlertDialog open={dismissAlertOpen} onOpenChange={setDismissAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ⚠️ Dismiss Without Notifying Clients?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This update notification has not been propagated to clients yet.
              If you dismiss it now, clients will not receive this important
              update information.
              <br />
              <br />
              <strong>Recommended:</strong> Click "Notify Clients" first to
              ensure all users are informed about this update before dismissing
              it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNotificationToDismiss(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDismiss}
              className="bg-red-600 hover:bg-red-700"
            >
              Dismiss Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GIF Demo Modal */}
      <Dialog
        open={!!selectedFeature}
        onOpenChange={() => setSelectedFeature(null)}
      >
        <DialogContent
          className="max-w-2xl"
          aria-describedby="feature-description"
        >
          <DialogHeader>
            <DialogTitle>{selectedFeature?.name}</DialogTitle>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-4">
              <div
                id="feature-description"
                className="text-sm text-muted-foreground"
              >
                {renderMarkdown(selectedFeature.description)}
              </div>
              <div className="flex justify-center">
                <img
                  src={selectedFeature.gifUrl}
                  alt={`${selectedFeature.name} feature demonstration`}
                  className="max-w-full max-h-96 rounded-lg border"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setSelectedFeature(null)}
                  aria-label="Close feature demo"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateNotification;
