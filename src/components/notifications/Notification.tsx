"use client";

import { useState, useEffect } from "react";
import { Bell, FileText, DollarSign, Clock, AlertCircle, CheckCircle, User, ShoppingCart, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { Socket } from "socket.io-client";
import SocketListener from "./SocketListener";

interface NotificationData {
  _id: string;
  title: string;
  message: string;
  type: string;
  action: string;
  entityId: string;
  entityType: string;
  recipient: string;
  triggeredBy: string;
  client: string;
  read: boolean;
  metadata: {
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  createdAt:string;
}

const Notification = ({ socket }: { socket: Socket | null }) => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);


const fetchNotifications = async () => {
  try {
    setIsLoading(true);
    console.log("🔍 Starting fetchNotifications...", new Date().toISOString());
    
    const token = localStorage.getItem("token");
    console.log("🔑 Token exists:", !!token);
    
    if (!token) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }

    // Get current user info
    const userData = localStorage.getItem("user");
    console.log("👤 User data from localStorage:", userData);
    
    if (!userData) {
      setError("User data not found");
      setIsLoading(false);
      return;
    }
    
    const user = JSON.parse(userData);
    console.log("📋 Parsed user object:", user);
    
    // Try common ID property names with proper fallbacks
    const userId = user.id || user._id || user.userId || user.userID;
    
    console.log("🆔 Extracted userId:", userId);
    console.log("🎭 User role:", user.role);
    
    // Validate that we have a proper ID
    if (!userId) {
      console.error("❌ User ID not found in user data");
      setError("User ID not found in user data. Please check console for details.");
      setIsLoading(false);
      return;
    }
    
    let notificationsData: NotificationData[] = [];
    let apiUrl = "";
    
    // Determine the correct API endpoint based on user role
    if (user.role === "admin" || user.role === "master") {
      // For admin users, use the USER endpoint since notifications are stored by recipient (user ID)
      apiUrl = `${baseURL}/api/notifications/user/${userId}`;
      console.log("🔗 Using USER API URL for admin:", apiUrl);
    } else {
      // For regular users/clients, use the CLIENT endpoint
      // First try to find client ID
      let clientId = user.clientId || user.clientID || user.client;
      
      // If no direct client ID, check if they have companies
      if (!clientId && user.companies && user.companies.length > 0) {
        clientId = user.companies[0]._id;
        console.log("🏢 Using first company as client ID:", clientId);
      }
      
      // If still no client ID, use user ID as fallback (some clients might not have separate client ID)
      if (!clientId) {
        clientId = userId;
        console.log("⚠️ No client ID found, using user ID as fallback:", clientId);
      }
      
      apiUrl = `${baseURL}/api/notifications/client/${clientId}`;
      console.log("🔗 Using CLIENT API URL:", apiUrl);
    }

    try {
      console.log("🌐 Making API request to:", apiUrl);
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("✅ API response received:", response.data);
      
      // FIX: Handle different response formats
      if (Array.isArray(response.data)) {
        // Client endpoint returns array directly
        notificationsData = response.data;
        console.log("📦 Response format: Direct array (client endpoint)");
      } else if (response.data.notifications && Array.isArray(response.data.notifications)) {
        // User/admin endpoint returns {notifications: array}
        notificationsData = response.data.notifications;
        console.log("📦 Response format: Object with notifications array (user endpoint)");
      } else if (Array.isArray(response.data.data)) {
        // Alternative format: {data: array}
        notificationsData = response.data.data;
        console.log("📦 Response format: Object with data array");
      } else {
        // Fallback for other formats
        notificationsData = response.data || [];
        console.log("📦 Response format: Fallback (unknown format)");
      }
      
    } catch (apiError: any) {
      console.error("❌ Error with primary API endpoint:", apiError.message);
      
      // Fallback: try the other endpoint if the primary one fails
      let fallbackUrl = "";
      if (apiUrl.includes('/user/')) {
        // If user endpoint failed, try client endpoint
        let clientId = user.clientId || user.clientID || user.client || userId;
        fallbackUrl = `${baseURL}/api/notifications/client/${clientId}`;
      } else {
        // If client endpoint failed, try user endpoint
        fallbackUrl = `${baseURL}/api/notifications/user/${userId}`;
      }
      
      console.log("🔄 Trying fallback endpoint:", fallbackUrl);
      try {
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("✅ Fallback response received:", fallbackResponse.data);
        
        // FIX: Apply the same response format handling for fallback
        if (Array.isArray(fallbackResponse.data)) {
          notificationsData = fallbackResponse.data;
        } else if (fallbackResponse.data.notifications && Array.isArray(fallbackResponse.data.notifications)) {
          notificationsData = fallbackResponse.data.notifications;
        } else if (Array.isArray(fallbackResponse.data.data)) {
          notificationsData = fallbackResponse.data.data;
        } else {
          notificationsData = fallbackResponse.data || [];
        }
        
      } catch (fallbackError) {
        console.error("❌ Both primary and fallback endpoints failed:", fallbackError);
        throw new Error("Could not fetch notifications from any endpoint");
      }
    }
    
    // Remove duplicates and sort by date (newest first)
    const uniqueNotifications = notificationsData.filter((notification, index, self) =>
      index === self.findIndex(n => n._id === notification._id)
    );
    
    uniqueNotifications.sort((a, b) => 
      new Date(b.metadata?.createdAt || b.createdAt || 0).getTime() - 
      new Date(a.metadata?.createdAt || a.createdAt || 0).getTime()
    );
    
    console.log("📊 Final notifications count:", uniqueNotifications.length);
    setNotifications(uniqueNotifications);
    const unreadCount = uniqueNotifications.filter(n => !n.read).length;
    setBadgeCount(unreadCount);
    setIsLoading(false);
    
  } catch (err: any) {
    console.error("❌ Error fetching notifications:", err);
    console.error("📊 Error details:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      url: err.config?.url
    });
    
    if (err.response?.status === 404) {
      setError("Notifications endpoint not found. Please check your API URL.");
    } else if (err.response?.status === 401) {
      setError("Authentication failed. Please log in again.");
    } else {
      setError(err.response?.data?.message || "Failed to load notifications");
    }
    
    setIsLoading(false);
  }
};
  // Fetch notifications when the component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch notifications when the sheet opens (refresh data)
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleNewNotification = () => {
    console.log("🔔 New notification received, incrementing badge count");
    setBadgeCount(prev => prev + 1);
  };


 

  const markAsRead = async (notificationId: string) => {
    try {
      console.log("📝 Marking notification as read:", notificationId);
      const token = localStorage.getItem("token");
      await axios.patch(`${baseURL}/api/notifications/mark-as-read/${notificationId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      console.log("✅ Notification marked as read:", notificationId);
    } catch (err) {
      console.error("❌ Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log("📝 Marking all notifications as read");
      const token = localStorage.getItem("token");
      
      // Mark each notification individually since we might have multiple sources
      for (const notification of notifications.filter(n => !n.read)) {
        try {
          await axios.patch(`${baseURL}/api/notifications/mark-as-read/${notification._id}`, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (err) {
          console.error(`❌ Error marking notification ${notification._id} as read:`, err);
        }
      }
      
      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      console.log("✅ All notifications marked as read");
    } catch (err) {
      console.error("❌ Error marking all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type: string, action: string) => {
    switch (type) {
      case "sales":
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case "invoice":
        return <FileText className="h-5 w-5 text-primary" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "reminder":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "user":
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return action === "create" 
          ? <CheckCircle className="h-5 w-5 text-green-500" /> 
          : <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getIconContainerClass = (type: string) => {
    switch (type) {
      case "sales":
        return "bg-blue-500/10 p-2 rounded-full";
      case "invoice":
        return "bg-primary/10 p-2 rounded-full";
      case "payment":
        return "bg-green-500/10 p-2 rounded-full";
      case "reminder":
        return "bg-orange-500/10 p-2 rounded-full";
      case "user":
        return "bg-purple-500/10 p-2 rounded-full";
      default:
        return "bg-muted p-2 rounded-full";
    }
  };

const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown date";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Unknown date";
  }
};
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <SocketListener socket={socket} onNotification={fetchNotifications} />
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : "You have no unread notifications"}
          </SheetDescription>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 px-2">
              Mark all as read
            </Button>
          )}
        </SheetHeader>
        
        <Separator />
        
        <div className="py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="ml-2 text-sm">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchNotifications} className="mt-4">
                Try Again
              </Button>
              <p className="text-xs mt-2 text-muted-foreground">
                Check browser console for details
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2" />
              <p>No notifications yet</p>
              <p className="text-xs mt-1">Notifications will appear here when available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-3 rounded-lg border ${notification.read ? 'bg-muted/30' : 'bg-background'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={getIconContainerClass(notification.type)}>
                      {getNotificationIcon(notification.type, notification.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                            className="h-6 px-2 text-xs"
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
  {formatDate(notification.metadata?.createdAt || notification.createdAt)}
</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  </>
);
};

export default Notification;