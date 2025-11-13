"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell, Sparkles } from "lucide-react";
import axios from "axios";

interface UpdateNotification {
  _id: string;
  title: string;
  description: string;
  version: string;
  features: any[];
  exploredSections: string[];
  dismissed: boolean;
  propagatedToClients: boolean;
  createdAt: string;
}

const UpdateNotificationBadge = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBadgeHighlighted, setIsBadgeHighlighted] = useState(false);

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
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload._id || payload.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Fetch notifications for master admins
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) return;

      const user = JSON.parse(userData);

      // Only show for master admins
      if (user.role !== "master") {
        return;
      }

      const userId = getUserIdFromToken();
      if (!userId) return;

      const response = await axios.get(`${baseURL}/api/update-notifications/master/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const notificationsData = response.data.notifications || [];

      // Filter out notifications that are in grace period (dismissed but not yet auto-dismissed)
      const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '{}');
      const now = new Date();

      const filteredNotifications = notificationsData.filter((n: UpdateNotification) => {
        if (!n.dismissed) return true; // Not dismissed, show it

        // Check if it's in grace period
        const dismissedData = dismissedNotifications[n._id];
        if (dismissedData) {
          const autoDismissAt = new Date(dismissedData.autoDismissAt);
          return now >= autoDismissAt; // Grace period expired, hide it
        }

        return false; // Dismissed and no grace period data, hide it
      });

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error("Error fetching update notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Scroll to update notifications section
  const scrollToNotifications = () => {
    const notificationSection = document.querySelector('[data-notification-section]');
    if (notificationSection) {
      notificationSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Trigger a refresh of the UpdateNotification component
      const event = new CustomEvent('refreshUpdateNotifications');
      window.dispatchEvent(event);
    }
  };

  // Don't show badge if no notifications or not master admin
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  // Count notifications that are not dismissed OR are in grace period
  const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedNotifications') || '{}');
  const now = new Date();

  const unreadCount = notifications.filter(n => {
    // If notification is not dismissed, count it
    if (!n.dismissed) return true;

    // If notification is dismissed but still in grace period, don't count it
    const dismissedData = dismissedNotifications[n._id];
    if (dismissedData) {
      const autoDismissAt = new Date(dismissedData.autoDismissAt);
      return now < autoDismissAt; // Still in grace period, so don't show in badge
    }

    return false;
  }).length;

  if (isLoading || unreadCount === 0 || user?.role !== "master") {
    return null;
  }

  return (
    <Badge
      variant="default"
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer animate-pulse"
      onClick={scrollToNotifications}
    >
      <Bell className="w-3 h-3 mr-1" />
      New Updates ({unreadCount})
    </Badge>
  );
};

export default UpdateNotificationBadge;
