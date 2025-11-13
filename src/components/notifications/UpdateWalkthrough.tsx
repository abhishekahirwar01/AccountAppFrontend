"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

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
  createdAt: string;
}

const UpdateWalkthrough = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch notifications for clients
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        console.log("No token or user data");
        return;
      }

      const user = JSON.parse(userData);
      console.log("User role:", user.role);

      // Only show for non-master users (clients)
      if (user.role === "master") {
        console.log("User is master, not showing notifications");
        return;
      }

      const userId = getUserIdFromToken();
      console.log("User ID:", userId);
      if (!userId) {
        console.log("No user ID found");
        return;
      }

      console.log("Fetching from:", `${baseURL}/api/update-notifications/user/${userId}`);

      // Fetch update notifications directly from backend
      const response = await axios.get(`${baseURL}/api/update-notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updateNotifications = response.data.notifications || [];
      console.log("Fetched update notifications:", updateNotifications.length);

      // Filter out notifications that are in grace period (completed but not yet auto-dismissed)
      const completedNotifications = JSON.parse(localStorage.getItem('completedNotifications') || '{}');
      const now = new Date();

      const filteredNotifications = updateNotifications.filter((n: any) => {
        // Check if it's in grace period
        const completedData = completedNotifications[n._id];
        if (completedData) {
          const autoDismissAt = new Date(completedData.autoDismissAt);
          return now >= autoDismissAt; // Grace period expired, hide it
        }

        return true; // Show if not in grace period
      });

      console.log("Filtered notifications:", filteredNotifications);
      if (filteredNotifications.length > 0) {
        console.log("Features in first notification:", filteredNotifications[0]?.features);
      }

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error("Error fetching update notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up auto-dismissal check every hour
    const autoDismissInterval = setInterval(() => {
      checkAndAutoDismissNotifications();
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(autoDismissInterval);
  }, []);

  // Function to check and auto-dismiss old notifications
  const checkAndAutoDismissNotifications = async () => {
    const completedNotifications = JSON.parse(localStorage.getItem('completedNotifications') || '{}');
    const now = new Date();

    for (const [notificationId, data] of Object.entries(completedNotifications)) {
      const autoDismissAt = new Date((data as any).autoDismissAt);

      if (now >= autoDismissAt) {
        try {
          const token = localStorage.getItem("token");
          const userId = getUserIdFromToken();

          if (userId) {
            // Dismiss the update notification
            await axios.patch(`${baseURL}/api/update-notifications/dismiss/${notificationId}`, {
              userId: userId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`Auto-dismissed update notification ${notificationId} after 36 hours`);
          }

          // Remove from localStorage
          delete completedNotifications[notificationId];
          localStorage.setItem('completedNotifications', JSON.stringify(completedNotifications));

          // Refresh notifications to hide the auto-dismissed one
          fetchNotifications();
        } catch (error) {
          console.error(`Error auto-dismissing notification ${notificationId}:`, error);
        }
      }
    }
  };

  // Mark notification as dismissed with delay (don't remove immediately)
  const markAsReadWithDelay = async (notificationId: string) => {
    try {
      // Instead of dismissing immediately, we'll hide it from UI
      // The backend will handle auto-dismissal after 36 hours
      console.log(`Notification ${notificationId} completed - will auto-dismiss in 36 hours`);

      // Store completion time in localStorage for UI purposes
      const completedNotifications = JSON.parse(localStorage.getItem('completedNotifications') || '{}');
      completedNotifications[notificationId] = {
        completedAt: new Date().toISOString(),
        autoDismissAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString() // 36 hours
      };
      localStorage.setItem('completedNotifications', JSON.stringify(completedNotifications));

      // Update local state to hide from UI
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error("Error marking notification as dismissed:", error);
    }
  };

  // Get all features from all notifications for the walkthrough
  const allFeatures = notifications.flatMap(notification =>
    notification.features.map(feature => ({
      ...feature,
      notificationTitle: notification.title,
      version: notification.version
    }))
  );

  const totalSteps = allFeatures.length;
  const currentFeature = allFeatures[currentStep];

  // Helper function to render markdown-style text
  const renderMarkdown = (text: string) => {
    // Split by newlines first
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // Handle bold text within each line
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const processedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={`${lineIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Return line with proper spacing
      return (
        <div key={lineIndex} className={line.trim() === '' ? 'h-2' : ''}>
          {processedLine}
        </div>
      );
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to get the correct URL based on user role and available pages
  const getRoleBasedUrl = (baseUrl: string) => {
    const userData = localStorage.getItem("user");
    if (!userData) return baseUrl;

    const user = JSON.parse(userData);

    // Define which pages exist for which roles
    const pageMappings = {
      '/dashboard': {
        master: '/admin/dashboard',
        client: '/dashboard'
      },
      '/companies': {
        master: '/admin/companies',
        client: '/companies'
      },
      '/settings': {
        master: '/admin/settings',
        client: '/settings'
      },
      '/client-management': {
        master: '/admin/client-management',
        client: null // Clients don't have access to client management
      },
      '/analytics': {
        master: '/admin/analytics',
        client: null // Clients don't have access to analytics
      },
      '/transactions': {
        master: null, // Master admins don't have direct transaction access
        client: '/transactions'
      }
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

  const handleTryItNow = () => {
    if (currentFeature) {
      const targetUrl = getRoleBasedUrl(currentFeature.sectionUrl);
      if (targetUrl) {
        router.push(targetUrl);
        // Don't close the modal, let user continue the walkthrough
      } else {
        // Page doesn't exist for this user role
        console.warn(`Page ${currentFeature.sectionUrl} is not available for client role`);
        // Could show a toast notification here
      }
    }
  };

  const handleComplete = async () => {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken();

    // Dismiss all notifications
    for (const notification of notifications) {
      try {
        if (!notification._id) {
          console.error("Notification _id is undefined or null:", notification);
          continue;
        }

        // Dismiss the update notification
        await axios.patch(`${baseURL}/api/update-notifications/dismiss/${notification._id}`, {
          userId: userId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Also mark any related regular notifications as read
        const response = await axios.get(`${baseURL}/api/notifications/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const allNotifications = response.data.notifications || response.data || [];
        const targetNotification = allNotifications.find((n: any) =>
          n.entityId === notification._id && n.type === 'system' && n.action === 'update'
        );

        if (targetNotification) {
          await axios.patch(`${baseURL}/api/notifications/mark-as-read/${targetNotification._id}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (error) {
        console.error(`Error dismissing notification ${notification._id}:`, error);
      }
    }

    setIsOpen(false);
    setCurrentStep(0);
    // Refresh notifications to hide dismissed ones
    fetchNotifications();
  };

  const handleSkip = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  // Don't show anything for master admins or if no notifications
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  if (notifications.length === 0 || user?.role === "master") {
    return null;
  }

  return (
    <>
      {/* New Badge */}
      <Badge
        variant="default"
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer animate-pulse"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="w-3 h-3 mr-1" />
        New Updates
      </Badge>

      {/* Walkthrough Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                🚀 What's New in {currentFeature?.version || 'Latest Update'}
              </DialogTitle>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button> */}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {currentFeature && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{currentFeature.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {currentFeature.notificationTitle}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-muted-foreground leading-relaxed">
                    {renderMarkdown(currentFeature.description)}
                  </div>

                  {/* {currentFeature.gifUrl && (
                    <div className="flex justify-center">
                      <img
                        src={currentFeature.gifUrl}
                        alt={`${currentFeature.name} feature demonstration`}
                        className="max-w-full max-h-64 rounded-lg border shadow-sm"
                      />
                    </div>
                  )} */}

                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        💡 <strong>Pro tip:</strong> Try this feature to see the improvements firsthand.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 <strong>Note:</strong> Click 'Remove Notification' when you've explored all features.
                      </p>
                    </div>
                    {/* <Button
                      onClick={handleTryItNow}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Try it now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>

              {currentStep === totalSteps - 1 ? (
                <Button  variant="outline" onClick={handleComplete} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors duration-200"
                      >
                        <X className="h-3 w-3 mr-1.5" />
                        Dismiss
                      </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateWalkthrough;