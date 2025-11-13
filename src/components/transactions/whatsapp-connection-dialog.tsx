// // components/whatsapp-connection-dialog.tsx
// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Loader2, X, QrCode, Smartphone, CheckCircle2, ExternalLink, RefreshCw, Monitor } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import { whatsappConnectionService } from '@/lib/whatsapp-connection';

// interface WhatsAppConnectionDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConnected: () => (phoneNumber: string) => void;
// }

// // Simple QR Code Component - Pure CSS, no dependencies
// const SimpleQRCode = () => (
//   <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-sm">
//     <div className="w-64 h-64 bg-white relative mx-auto border-2 border-gray-800 rounded">
//       {/* QR Code Pattern - Pure CSS */}
//       {/* Top-left corner marker */}
//       <div className="absolute top-3 left-3 w-10 h-10 border-2 border-gray-800">
//         <div className="absolute top-1 left-1 w-6 h-6 bg-gray-800"></div>
//         <div className="absolute top-1 right-1 w-2 h-2 bg-gray-800"></div>
//         <div className="absolute bottom-1 left-1 w-2 h-2 bg-gray-800"></div>
//       </div>

//       {/* Top-right corner marker */}
//       <div className="absolute top-3 right-3 w-10 h-10 border-2 border-gray-800">
//         <div className="absolute top-1 right-1 w-6 h-6 bg-gray-800"></div>
//         <div className="absolute top-1 left-1 w-2 h-2 bg-gray-800"></div>
//         <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-800"></div>
//       </div>

//       {/* Bottom-left corner marker */}
//       <div className="absolute bottom-3 left-3 w-10 h-10 border-2 border-gray-800">
//         <div className="absolute bottom-1 left-1 w-6 h-6 bg-gray-800"></div>
//         <div className="absolute top-1 left-1 w-2 h-2 bg-gray-800"></div>
//         <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-800"></div>
//       </div>

//       {/* Center alignment pattern */}
//       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//         <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
//           <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
//             <Smartphone className="h-4 w-4 text-green-600" />
//           </div>
//         </div>
//       </div>

//       {/* Random data patterns */}
//       <div className="absolute top-20 left-20 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-24 left-32 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-32 left-24 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-36 left-40 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-40 left-36 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-28 left-28 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-44 left-44 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-16 left-16 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-48 left-20 w-2 h-2 bg-gray-800"></div>
//       <div className="absolute top-20 left-48 w-2 h-2 bg-gray-800"></div>
//     </div>
//     <div className="text-center mt-4">
//       <p className="text-xs text-muted-foreground font-medium">
//         WhatsApp Web QR Code
//       </p>
//       <p className="text-xs text-muted-foreground mt-1">
//         Scan with your phone's WhatsApp
//       </p>
//     </div>
//   </div>
// );

// export function WhatsAppConnectionDialog({ isOpen, onClose, onConnected }: WhatsAppConnectionDialogProps) {
//   const [isLoading, setIsLoading] = useState(false);
//   const [step, setStep] = useState<'initial' | 'opening' | 'qr' | 'connected'>('initial');
//   const [whatsappWindow, setWhatsappWindow] = useState<Window | null>(null);
//   const [canManageConnections, setCanManageConnections] = useState(false);
//   const { toast } = useToast();

//   useEffect(() => {
//     if (isOpen) {
//       setStep('initial');
//       // Check if user can manage connections
//       setCanManageConnections(whatsappConnectionService.canManageConnections());
//     }

//     // Cleanup: close WhatsApp window when component unmounts
//     return () => {
//       if (whatsappWindow && !whatsappWindow.closed) {
//         whatsappWindow.close();
//       }
//     };
//   }, [isOpen, whatsappWindow]);

//   const handleConnectWhatsApp = async () => {
//     setIsLoading(true);
//     setStep('opening');

//     try {
//       // Auto-open WhatsApp Web in a new window
//       const newWindow = window.open('https://web.whatsapp.com', 'whatsapp-web', 'width=1200,height=800,left=200,top=100');
//       setWhatsappWindow(newWindow);

//       if (!newWindow) {
//         toast({
//           variant: 'destructive',
//           title: 'Popup Blocked',
//           description: 'Please allow popups for this site and try again.',
//         });
//         setStep('initial');
//         return;
//       }

//       toast({
//         title: 'WhatsApp Web Opened',
//         description: 'Please wait while WhatsApp Web loads...',
//       });

//       // Wait a moment for WhatsApp Web to load, then show QR code
//       setTimeout(() => {
//         setStep('qr');
//         toast({
//           title: 'Ready to Scan',
//           description: 'Scan the QR code in the WhatsApp Web window with your phone.',
//         });
//       }, 2000);

//     } catch (error) {
//       console.error('Error:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Connection Failed',
//         description: 'Failed to open WhatsApp Web. Please try again.',
//       });
//       setStep('initial');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleOpenWhatsAppManually = () => {
//     window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
//     setStep('qr');
//     toast({
//       title: 'WhatsApp Web Opened',
//       description: 'Now scan the QR code in the WhatsApp Web window with your phone.',
//     });
//   };

//   // const handleConfirmConnection = async () => {
//   //   try {
//   //     setIsLoading(true);

//   //     // Close the WhatsApp Web window if it's open
//   //     if (whatsappWindow && !whatsappWindow.closed) {
//   //       whatsappWindow.close();
//   //     }

//   //     // Use the appropriate connection method based on user permissions
//   //     const phoneNumber = 'connected-phone'; // You can get this from user input if needed
//   //     let success = false;

//   //     if (canManageConnections) {
//   //       // Customer/admin: Create client connection for the whole team
//   //       success = await whatsappConnectionService.setClientConnection(phoneNumber);
//   //     } else {
//   //       // Regular user: Create personal connection
//   //       whatsappConnectionService.setPersonalConnection(true, phoneNumber);
//   //       success = true;
//   //     }

//   //     if (success) {
//   //       setStep('connected');
//   //       toast({
//   //         title: 'WhatsApp Connected!',
//   //         description: canManageConnections
//   //           ? 'WhatsApp is now connected for your entire team.'
//   //           : 'Your personal WhatsApp connection is now active.',
//   //       });
//   //     } else {
//   //       throw new Error('Failed to save connection');
//   //     }
//   //   } catch (error) {
//   //     console.error('Error confirming connection:', error);
//   //     toast({
//   //       variant: 'destructive',
//   //       title: 'Connection Failed',
//   //       description: 'Failed to save connection. Please try again.',
//   //     });
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };

//   // Update your whatsapp-connection-dialog.tsx to add debugging
// // Simple debug without service changes
// // components/whatsapp-connection-dialog.tsx
// // components/whatsapp-connection-dialog.tsx
// const handleConfirmConnection = async () => {
//   try {
//     setIsLoading(true);

//     // Close the WhatsApp Web window if it's open
//     if (whatsappWindow && !whatsappWindow.closed) {
//       whatsappWindow.close();
//     }

//     const phoneNumber = 'connected-phone';

//     console.log('🔄 Creating WhatsApp connection...');
//     const success = await whatsappConnectionService.setClientConnection(phoneNumber, {
//       clientId: "68da2f33cb8bdf6e3f019a14", // This should come from your auth
//       source: 'connection-dialog'
//     });

//     if (success) {
//       console.log('✅ WhatsApp connection created successfully');
//       setStep('connected');
//       toast({
//         title: 'WhatsApp Connected Successfully!',
//         description: 'Your WhatsApp is now connected and ready to send messages.',
//       });
//     } else {
//       throw new Error('Failed to create WhatsApp connection');
//     }

//   } catch (error: unknown) {
//     console.error('❌ Error confirming connection:', error);
//     toast({
//       variant: 'destructive',
//       title: 'Connection Failed',
//       description: 'Failed to connect WhatsApp. Please try again.',
//     });
//   } finally {
//     setIsLoading(false);
//   }
// };

//   const handleComplete = () => {
//     onConnected();
//     onClose();
//   };

//   const handleRetry = () => {
//     if (whatsappWindow && !whatsappWindow.closed) {
//       whatsappWindow.close();
//     }
//     setWhatsappWindow(null);
//     setStep('initial');
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black/50 transition-opacity"
//         onClick={onClose}
//       />

//       {/* Dialog */}
//       <Card className="w-full max-w-md mx-4 z-50">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2">
//               <Smartphone className="h-5 w-5 text-green-600" />
//               Connect WhatsApp
//             </CardTitle>
//             <Button variant="ghost" size="icon" onClick={onClose}>
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//           <CardDescription>
//             {canManageConnections
//               ? 'Connect WhatsApp for your entire team'
//               : 'Connect your personal WhatsApp'}
//           </CardDescription>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {step === 'initial' && (
//             <div className="space-y-4">
//               <div className="text-center">
//                 <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
//                 <h3 className="font-semibold mb-2">
//                   {canManageConnections ? 'Connect WhatsApp for Team' : 'Connect Your WhatsApp'}
//                 </h3>
//                 <p className="text-sm text-muted-foreground mb-4">
//                   {canManageConnections
//                     ? 'Connect WhatsApp once and your entire team can use it to send messages.'
//                     : 'Connect your WhatsApp to send messages directly to customers.'
//                   }
//                 </p>
//               </div>

//               <div className="space-y-3">
//                 <Button
//                   onClick={handleConnectWhatsApp}
//                   className="w-full gap-2"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Monitor className="h-4 w-4" />
//                   )}
//                   {isLoading ? 'Opening...' : 'Auto-Connect WhatsApp Web'}
//                 </Button>

//                 <Button
//                   onClick={handleOpenWhatsAppManually}
//                   variant="outline"
//                   className="w-full gap-2"
//                 >
//                   <ExternalLink className="h-4 w-4" />
//                   Open WhatsApp Web Manually
//                 </Button>
//               </div>

//               {canManageConnections && (
//                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
//                   <p className="text-xs text-blue-700 font-medium">
//                     👑 Team Connection: All team members will be able to use this WhatsApp connection
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {step === 'opening' && (
//             <div className="text-center space-y-4">
//               <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
//               <div>
//                 <h3 className="font-semibold mb-2">Opening WhatsApp Web...</h3>
//                 <p className="text-sm text-muted-foreground">
//                   Please wait while we open WhatsApp Web in a new window.
//                 </p>
//               </div>
//               <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded-lg">
//                 💡 If a popup doesn't appear, check your browser's popup blocker
//               </div>
//             </div>
//           )}

//           {step === 'qr' && (
//             <div className="space-y-4">
//               <div className="text-center">
//                 <QrCode className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                 <h3 className="font-semibold mb-2">Scan QR Code</h3>
//                 <p className="text-sm text-muted-foreground mb-4">
//                   Scan the QR code in WhatsApp Web with your phone
//                 </p>
//               </div>

//               {/* Simple QR Code - No dependencies */}
//               <SimpleQRCode />

//               <div className="space-y-3 text-center">
//                 <div className="text-xs text-muted-foreground space-y-1">
//                   <p className="flex items-center justify-center gap-1">
//                     <span>📱</span>
//                     <strong>Open WhatsApp on your phone</strong>
//                   </p>
//                   <p className="flex items-center justify-center gap-1">
//                     <span>⚙️</span>
//                     <strong>Tap Menu → Linked Devices → Link a Device</strong>
//                   </p>
//                   <p className="flex items-center justify-center gap-1">
//                     <span>📸</span>
//                     <strong>Point your camera at the QR code in WhatsApp Web</strong>
//                   </p>
//                 </div>

//                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
//                   <p className="text-xs text-blue-700 font-medium">
//                     ✅ WhatsApp Web should be open in another window/tab
//                   </p>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={handleRetry}
//                   className="flex-1 gap-2"
//                 >
//                   <RefreshCw className="h-4 w-4" />
//                   Retry
//                 </Button>
//                 <Button
//                   onClick={handleConfirmConnection}
//                   className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <CheckCircle2 className="h-4 w-4" />
//                   )}
//                   {isLoading ? 'Connecting...' : 'I\'m Connected'}
//                 </Button>
//               </div>
//             </div>
//           )}

//           {step === 'connected' && (
//             <div className="text-center space-y-4">
//               <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
//               <div>
//                 <h3 className="font-semibold mb-2">Connected Successfully!</h3>
//                 <p className="text-sm text-muted-foreground">
//                   {canManageConnections
//                     ? 'WhatsApp is now connected for your entire team.'
//                     : 'Your WhatsApp is now connected and ready to send messages.'
//                   }
//                 </p>
//               </div>
//               <div className="bg-green-50 p-3 rounded-lg border border-green-200">
//                 <p className="text-xs text-green-700 font-medium">
//                   💬 Messages will open in WhatsApp Web with pre-filled content
//                 </p>
//               </div>
//               <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
//                 Start Sending Messages
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// components/whatsapp-connection-dialog.tsx
// components/whatsapp-connection-dialog.tsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";
import { whatsappConnectionService } from "@/lib/whatsapp-connection";
import { whatsappAPI } from "@/lib/whatsapp-api";

// FIXED: Use named import instead of default import
import { QRCodeSVG } from "qrcode.react";

interface WhatsAppConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

// QR Code Display Component
const QRCodeDisplay = ({ qrData }: { qrData: string }) => {
  const qrRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadQR = () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = "whatsapp-qr-code.png";
          downloadLink.href = pngFile;
          downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={qrRef}
        className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-sm flex justify-center"
      >
        <QRCodeSVG
          value={qrData}
          size={256}
          level="M" // Error correction level
          includeMargin={true}
        />
      </div>

      <Button
        onClick={handleDownloadQR}
        variant="outline"
        size="sm"
        className="w-full gap-2"
      >
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Scan this QR code with WhatsApp to authenticate your account
        </p>
      </div>
    </div>
  );
};

export function WhatsAppConnectionDialog({
  isOpen,
  onClose,
  onConnected,
}: WhatsAppConnectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "qr" | "connected">("initial");
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
   const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { connectWhatsApp, refreshConnection } = useWhatsAppConnection();

  // Debug authentication on mount
  useEffect(() => {
    if (isOpen) {
      console.log("🔐 Checking authentication status...");
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const user = localStorage.getItem("user");

      console.log("🔐 Auth Status:", {
        hasToken: !!token,
        token: token ? `${token.substring(0, 20)}...` : "none",
        hasUser: !!user,
        user: user ? JSON.parse(user) : null,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStep("initial");
      setQrCodeData(null);
      setIsPolling(false);
    }
  }, [isOpen]);

  // Poll for connection status when in QR step
   useEffect(() => {
    if (!isOpen || step !== 'qr' || !isPolling) return;

    let pollInterval: NodeJS.Timeout;
    setRetryCount(0); // Reset retry count when starting

    const pollStatus = async () => {
      try {
        console.log('🔄 Polling for connection status...');
        const isConnected = await refreshConnection();
        
        if (isConnected) {
          console.log('✅ Connected successfully!');
          setStep('connected');
          setIsPolling(false);
          setRetryCount(0);
          clearInterval(pollInterval);
          toast({
            title: 'Connected Successfully!',
            description: 'WhatsApp is now connected and ready to use.',
          });
        } else {
          setRetryCount(prev => prev + 1);
          console.log(`🔄 Connection not ready yet (attempt ${retryCount + 1})`);
          
          // If we've retried too many times, check if we need to regenerate QR
          if (retryCount > 20) { // ~60 seconds
            console.log('🔄 QR code might be expired, checking status...');
            const status = await whatsappAPI.checkStatus();
            if (status.status === 'authenticating') {
              console.log('✅ QR code still valid, continuing to poll...');
              setRetryCount(0); // Reset counter
            } else {
              console.log('❌ QR code expired or session lost');
              clearInterval(pollInterval);
              setIsPolling(false);
              setRetryCount(0);
              toast({
                variant: 'destructive',
                title: 'Session Expired',
                description: 'QR code expired. Please generate a new one.',
              });
              setStep('initial');
            }
          }
        }
      } catch (error: any) {
        console.error('Error polling status:', error);
        setRetryCount(prev => prev + 1);
        
        if (retryCount > 3) {
          console.error('❌ Too many polling errors, stopping');
          clearInterval(pollInterval);
          setIsPolling(false);
          setRetryCount(0);
          toast({
            variant: 'destructive',
            title: 'Connection Error',
            description: 'Unable to check connection status. Please try again.',
          });
        }
      }
    };

    pollInterval = setInterval(pollStatus, 3000);

    // Stop polling after 3 minutes (increased from 2)
    setTimeout(() => {
      if (step === 'qr' && isPolling) {
        console.log('⏰ Extended polling timeout reached');
        clearInterval(pollInterval);
        setIsPolling(false);
        setRetryCount(0);
        toast({
          variant: 'destructive',
          title: 'Connection Timeout',
          description: 'QR code expired. Please generate a new one and try scanning again.',
        });
      }
    }, 180000); // 3 minutes

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      setRetryCount(0);
    };
  }, [isOpen, step, isPolling, refreshConnection, toast, retryCount]);

  // Get QR code from backend using API service
  const fetchQRCode = async () => {
    try {
      console.log("📱 Checking for QR code...");

      // Use the API service instead of direct fetch
      const statusData = await whatsappAPI.checkStatus();

      console.log("🔍 Status data:", statusData);

      if (statusData.status === "authenticating" && statusData.qrCode) {
        console.log("✅ QR code received");
        setQrCodeData(statusData.qrCode);
        setIsPolling(true);
        toast({
          title: "QR Code Ready!",
          description: "Scan the QR code with your WhatsApp.",
        });
      } else if (statusData.status === "authenticated") {
        // Already connected
        setStep("connected");
        setIsPolling(false);
      } else {
        console.log("❌ No QR code available yet, retrying...");
        // Retry after 2 seconds if no QR code
        setTimeout(fetchQRCode, 2000);
      }
    } catch (error: any) {
      console.error("Error fetching QR code:", error);

      if (error.message.includes("Authentication failed")) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please login again to continue.",
        });
        setStep("initial");
        return;
      }

      // Retry on other errors
      setTimeout(fetchQRCode, 2000);
    }
  };

  const handleConnectWhatsApp = async () => {
    setIsLoading(true);
    setStep("qr");
    setQrCodeData(null);

    try {
      console.log("🚀 Initializing WhatsApp connection...");

      // Use the API service instead of direct fetch
      const result = await whatsappAPI.initialize();

      if (result.success) {
        console.log("✅ WhatsApp initialized:", result.message);
        toast({
          title: "Generating QR Code...",
          description: "Please wait while we generate the QR code.",
        });

        // Start fetching QR code
        fetchQRCode();
      } else {
        throw new Error(result.error || "Failed to initialize WhatsApp");
      }
    } catch (error: any) {
      console.error("❌ Error connecting WhatsApp:", error);

      if (error.message.includes("Authentication failed")) {
        toast({
          variant: "destructive",
          title: "Login Required",
          description: "Please login to connect WhatsApp.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: error.message || "Failed to initialize WhatsApp.",
        });
      }
      setStep("initial");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmConnection = async () => {
    try {
      setIsLoading(true);

      console.log("🔍 Manually checking connection...");
      const isConnected = await refreshConnection();

      if (isConnected) {
        setStep("connected");
        setIsPolling(false);
        toast({
          title: "Connected Successfully!",
          description: "WhatsApp is now connected and ready to use.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Not Connected Yet",
          description: "Please scan the QR code with your phone first.",
        });
      }
    } catch (error: any) {
      console.error("Error confirming connection:", error);

      if (error.message.includes("Authentication failed")) {
        toast({
          variant: "destructive",
          title: "Login Required",
          description: "Please login again to continue.",
        });
        setStep("initial");
      } else {
        toast({
          variant: "destructive",
          title: "Connection Check Failed",
          description: "Unable to verify connection status.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onConnected();
    onClose();
  };

  const handleRetry = () => {
    setStep('initial');
    setQrCodeData(null);
    setIsPolling(false);
    setRetryCount(0);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      
      <Card className="w-full max-w-md mx-4 z-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Connect WhatsApp
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Scan QR code to link your WhatsApp account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'initial' && (
            <div className="space-y-4">
              <div className="text-center">
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Connect WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan QR code to link your WhatsApp account for automated messaging
                </p>
              </div>
              
              <Button 
                onClick={handleConnectWhatsApp} 
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                {isLoading ? 'Initializing...' : 'Generate QR Code'}
              </Button>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 text-center">
                  📱 Open WhatsApp → Menu → Linked Devices → Link a Device
                </p>
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="space-y-4">
              <div className="text-center">
                <QrCode className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {qrCodeData ? 'Scan this QR code with WhatsApp' : 'Generating QR code...'}
                </p>
              </div>
              
              {/* QR Code Display */}
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                {qrCodeData ? (
                  <QRCodeDisplay qrData={qrCodeData} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p className="text-sm">Generating QR code...</p>
                    <p className="text-xs mt-2">Please wait</p>
                  </div>
                )}
              </div>
              
              {/* Troubleshooting Tips */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700 font-medium mb-2">
                  💡 Having trouble linking?
                </p>
                <ul className="text-xs text-yellow-600 space-y-1">
                  <li>• Make sure your phone has internet connection</li>
                  <li>• Try moving closer to your computer</li>
                  <li>• Ensure WhatsApp is updated to latest version</li>
                  <li>• Restart WhatsApp if scanning fails multiple times</li>
                </ul>
              </div>
              
              <div className="space-y-3 text-center">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>How to scan:</strong></p>
                  <p>1. Open WhatsApp on your phone</p>
                  <p>2. Tap Menu → Linked Devices</p>
                  <p>3. Tap "Link a Device"</p>
                  <p>4. Point your camera at the QR code</p>
                </div>
                
                {isPolling && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium flex items-center justify-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Waiting for you to scan... ({Math.floor(retryCount / 20)}s)
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  New QR Code
                </Button>
                <Button 
                  onClick={handleConfirmConnection}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isLoading ? 'Checking...' : 'I Scanned It'}
                </Button>
              </div>
            </div>
          )}

          {step === 'connected' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="font-semibold mb-2">Connected Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your WhatsApp is now connected and ready to send automated messages.
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-700">
                  💬 You can now send messages directly from the app
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
                Start Sending Messages
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
