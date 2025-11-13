// // hooks/useWhatsAppConnection.ts
// import { useState, useEffect, useCallback } from 'react';
// import { whatsappConnectionService } from '@/lib/whatsapp-connection';
// import { useToast } from '@/components/ui/use-toast';

// export interface UseWhatsAppConnectionReturn {
//   isConnected: boolean | null;
//   connectionInfo: any;
//   isLoading: boolean;
//   canManage: boolean;
//   checkConnection: (force?: boolean) => Promise<void>;
//   connectWhatsApp: (phoneNumber: string) => Promise<boolean>;
//   disconnectWhatsApp: () => Promise<boolean>;
//   refreshConnection: () => void;
// }

// export function useWhatsAppConnection(): UseWhatsAppConnectionReturn {
//   const [isConnected, setIsConnected] = useState<boolean | null>(null);
//   const [connectionInfo, setConnectionInfo] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();

//   const canManage = whatsappConnectionService.canManageConnections();

//   const checkConnection = useCallback(async (force = false) => {
//     setIsLoading(true);
//     try {
//       const connected = await whatsappConnectionService.checkWhatsAppWebConnection(force);
//       const info = await whatsappConnectionService.getConnectionInfo();
      
//       setIsConnected(connected);
//       setConnectionInfo(info);
//     } catch (error) {
//       console.error('Error checking WhatsApp connection:', error);
//       setIsConnected(false);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const connectWhatsApp = async (phoneNumber: string): Promise<boolean> => {
//     if (!canManage) {
//       toast({
//         variant: 'destructive',
//         title: 'Access Denied',
//         description: 'Only customer users can manage WhatsApp connections.',
//       });
//       return false;
//     }

//     setIsLoading(true);
//     try {
//       const success = await whatsappConnectionService.setClientConnection(phoneNumber);
      
//       if (success) {
//         toast({
//           title: 'WhatsApp Connected!',
//           description: 'WhatsApp connection has been saved for your team.',
//         });
//         await checkConnection(true);
//         return true;
//       } else {
//         toast({
//           variant: 'destructive',
//           title: 'Connection Failed',
//           description: 'Failed to save WhatsApp connection.',
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error('Error connecting WhatsApp:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Connection Error',
//         description: 'An error occurred while connecting WhatsApp.',
//       });
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const disconnectWhatsApp = async (): Promise<boolean> => {
//     if (!canManage) {
//       toast({
//         variant: 'destructive',
//         title: 'Access Denied',
//         description: 'Only customer users can disconnect WhatsApp.',
//       });
//       return false;
//     }

//     setIsLoading(true);
//     try {
//       const success = await whatsappConnectionService.clearClientConnection();
      
//       if (success) {
//         toast({
//           title: 'WhatsApp Disconnected',
//           description: 'WhatsApp connection has been removed.',
//         });
//         await checkConnection(true);
//         return true;
//       } else {
//         toast({
//           variant: 'destructive',
//           title: 'Disconnect Failed',
//           description: 'Failed to disconnect WhatsApp.',
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error('Error disconnecting WhatsApp:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Disconnect Error',
//         description: 'An error occurred while disconnecting WhatsApp.',
//       });
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const refreshConnection = () => {
//     checkConnection(true);
//   };

//   // Check connection on mount
//   useEffect(() => {
//     checkConnection();
//   }, [checkConnection]);

//   return {
//     isConnected,
//     connectionInfo,
//     isLoading,
//     canManage,
//     checkConnection,
//     connectWhatsApp,
//     disconnectWhatsApp,
//     refreshConnection,
//   };
// }














// // hooks/useWhatsAppConnection.ts
// import { useState, useEffect, useCallback } from 'react';
// import { whatsappConnectionService } from '@/lib/whatsapp-connection';
// import { whatsappAPI } from '@/lib/whatsapp-api';
// import { useToast } from '@/components/ui/use-toast';

// export interface ConnectionInfo {
//   isConnected: boolean;
//   phoneNumber?: string;
//   connectedBy?: string;
//   connectedByName?: string;
//   connectionType?: 'personal' | 'client' | 'none';
//   hasAccess?: boolean;
//   profileName?: string;
// }

// export function useWhatsAppConnection() {
//   const [isConnected, setIsConnected] = useState<boolean | null>(null);
//   const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [canManage, setCanManage] = useState(false);
//   const { toast } = useToast();

//   // Check connection status
//   const checkConnection = useCallback(async () => {
//     try {
//       setIsLoading(true);
      
//       // Check if user can manage connections
//       const canManageConnections = whatsappConnectionService.canManageConnections();
//       setCanManage(canManageConnections);

//       // Check backend connection status
//       const status = await whatsappAPI.checkStatus();
//       console.log('🔍 WhatsApp Status:', status);

//       const connected = status.status === 'authenticated';
//       setIsConnected(connected);

//       // Update connection info
//       if (connected) {
//         setConnectionInfo({
//           isConnected: true,
//           phoneNumber: status.phoneNumber,
//           connectionType: 'client',
//           hasAccess: true
//         });
//       } else {
//         setConnectionInfo({
//           isConnected: false,
//           connectionType: 'none',
//           hasAccess: false
//         });
//       }

//       return connected;
//     } catch (error) {
//       console.error('Error checking WhatsApp connection:', error);
//       setIsConnected(false);
//       setConnectionInfo({
//         isConnected: false,
//         connectionType: 'none',
//         hasAccess: false
//       });
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // Initialize/connect WhatsApp
//   const connectWhatsApp = useCallback(async (phoneNumber?: string) => {
//     try {
//       setIsLoading(true);
      
//       const result = await whatsappAPI.initialize();
      
//       if (result.success) {
//         toast({
//           title: 'WhatsApp Initialized',
//           description: 'Check the terminal/console for QR code to scan',
//         });
        
//         // Poll for connection status
//         const pollStatus = setInterval(async () => {
//           const status = await whatsappAPI.checkStatus();
//           if (status.status === 'authenticated') {
//             clearInterval(pollStatus);
//             await checkConnection();
//             toast({
//               title: 'WhatsApp Connected!',
//               description: 'WhatsApp is now connected and ready to use.',
//             });
//           }
//         }, 3000);

//         // Stop polling after 2 minutes
//         setTimeout(() => clearInterval(pollStatus), 120000);
        
//         return true;
//       } else {
//         toast({
//           variant: 'destructive',
//           title: 'Connection Failed',
//           description: result.error || 'Failed to initialize WhatsApp',
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error('Error connecting WhatsApp:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Connection Error',
//         description: 'An error occurred while connecting WhatsApp',
//       });
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [checkConnection, toast]);

//   // Disconnect WhatsApp
//   const disconnectWhatsApp = useCallback(async () => {
//     try {
//       setIsLoading(true);
      
//       const result = await whatsappAPI.logout();
      
//       if (result.success) {
//         setIsConnected(false);
//         setConnectionInfo({
//           isConnected: false,
//           connectionType: 'none',
//           hasAccess: false
//         });
        
//         toast({
//           title: 'WhatsApp Disconnected',
//           description: 'WhatsApp has been successfully disconnected',
//         });
//         return true;
//       } else {
//         toast({
//           variant: 'destructive',
//           title: 'Disconnect Failed',
//           description: result.error || 'Failed to disconnect WhatsApp',
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error('Error disconnecting WhatsApp:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Disconnect Error',
//         description: 'An error occurred while disconnecting WhatsApp',
//       });
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [toast]);

//   // Refresh connection
//   const refreshConnection = useCallback(async () => {
//     return await checkConnection();
//   }, [checkConnection]);

//   // Send message to vendor
//   const sendVendorMessage = useCallback(async (params: {
//     vendorId: string;
//     message: string;
//     invoiceData?: any;
//     manualSend?: boolean;
//   }) => {
//     try {
//       const result = await whatsappAPI.sendVendorMessage(params);
      
//       if (result.success) {
//         if (result.manual) {
//           // Manual mode - open WhatsApp Web
//           window.open(result.whatsappLink, '_blank', 'noopener,noreferrer');
//           toast({
//             title: 'WhatsApp Web Opening',
//             description: 'Opening WhatsApp Web with your message',
//           });
//         } else {
//           // Automated mode - message sent directly
//           toast({
//             title: 'Message Sent!',
//             description: 'Message has been sent via WhatsApp',
//           });
//         }
//         return result;
//       } else {
//         // Handle error from API response
//         toast({
//           variant: 'destructive',
//           title: 'Send Failed',
//           description: result.error || 'Failed to send WhatsApp message',
//         });
//         return result;
//       }
//     } catch (error) {
//       console.error('Error sending WhatsApp message:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Send Error',
//         description: 'An error occurred while sending the message',
//       });
//       throw error;
//     }
//   }, [toast]);

//   // Send bulk messages
//   const sendBulkMessages = useCallback(async (params: {
//     vendorIds: string[];
//     message: string;
//     templateId?: string;
//   }) => {
//     try {
//       const result = await whatsappAPI.sendBulkMessages(params);
      
//       if (result.successful > 0) {
//         toast({
//           title: 'Bulk Messages Sent',
//           description: `Successfully sent ${result.successful} out of ${result.total} messages`,
//         });
//       }
      
//       if (result.failed > 0) {
//         toast({
//           variant: result.successful === 0 ? 'destructive' : 'default',
//           title: result.successful === 0 ? 'All Messages Failed' : 'Some Messages Failed',
//           description: `${result.failed} messages failed to send`,
//         });
//       }
      
//       return result;
//     } catch (error) {
//       console.error('Error sending bulk WhatsApp messages:', error);
//       toast({
//         variant: 'destructive',
//         title: 'Bulk Send Error',
//         description: 'An error occurred while sending bulk messages',
//       });
//       throw error;
//     }
//   }, [toast]);

//   // Initial load
//   useEffect(() => {
//     checkConnection();
//   }, [checkConnection]);

//   return {
//     // State
//     isConnected,
//     connectionInfo,
//     isLoading,
//     canManage,
    
//     // Actions
//     connectWhatsApp,
//     disconnectWhatsApp,
//     refreshConnection,
//     sendVendorMessage,
//     sendBulkMessages,
//     checkConnection,
//   };
// }

















// hooks/useWhatsAppConnection.ts
// hooks/useWhatsAppConnection.ts
import { useState, useEffect, useCallback } from 'react';
import { whatsappConnectionService } from '@/lib/whatsapp-connection';
import { whatsappAPI, type SendMessageParams, type BulkMessageParams } from '@/lib/whatsapp-api';
import { useToast } from '@/components/ui/use-toast';

export interface ConnectionInfo {
  isConnected: boolean;
  phoneNumber?: string;
  connectedBy?: string;
  connectedByName?: string;
  connectionType?: 'personal' | 'client' | 'none';
  hasAccess?: boolean;
  profileName?: string;
}

export function useWhatsAppConnection() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const { toast } = useToast();

  // Check connection status
  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const canManageConnections = whatsappConnectionService.canManageConnections();
      setCanManage(canManageConnections);

      const status = await whatsappAPI.checkStatus();
      console.log('🔍 WhatsApp Status:', status);

      const connected = status.status === 'authenticated';
      setIsConnected(connected);

      if (connected) {
        setConnectionInfo({
          isConnected: true,
          phoneNumber: status.phoneNumber,
          profileName: status.profileName,
          connectionType: 'client',
          hasAccess: true
        });
      } else {
        setConnectionInfo({
          isConnected: false,
          connectionType: 'none',
          hasAccess: false
        });
      }

      return connected;
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      setIsConnected(false);
      setConnectionInfo({
        isConnected: false,
        connectionType: 'none',
        hasAccess: false
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize/connect WhatsApp
  const connectWhatsApp = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const result = await whatsappAPI.initialize();
      
      if (result.success) {
        toast({
          title: 'WhatsApp Initialized',
          description: 'Check the terminal/console for QR code to scan',
        });
        
        const pollStatus = setInterval(async () => {
          const status = await whatsappAPI.checkStatus();
          if (status.status === 'authenticated') {
            clearInterval(pollStatus);
            await checkConnection();
            toast({
              title: 'WhatsApp Connected!',
              description: 'WhatsApp is now connected and ready to use.',
            });
          }
        }, 3000);

        setTimeout(() => clearInterval(pollStatus), 120000);
        
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: result.error || 'Failed to initialize WhatsApp',
        });
        return false;
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'An error occurred while connecting WhatsApp',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkConnection, toast]);

  // Disconnect WhatsApp
  const disconnectWhatsApp = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const result = await whatsappAPI.logout();
      
      if (result.success) {
        setIsConnected(false);
        setConnectionInfo({
          isConnected: false,
          connectionType: 'none',
          hasAccess: false
        });
        
        toast({
          title: 'WhatsApp Disconnected',
          description: 'WhatsApp has been successfully disconnected',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Disconnect Failed',
          description: result.error || 'Failed to disconnect WhatsApp',
        });
        return false;
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast({
        variant: 'destructive',
        title: 'Disconnect Error',
        description: 'An error occurred while disconnecting WhatsApp',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Refresh connection
  const refreshConnection = useCallback(async () => {
    return await checkConnection();
  }, [checkConnection]);

  // ✅ UPDATED: Send message to party using the new method
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    try {
      const result = await whatsappAPI.sendMessage(params);
      
      if (result.success) {
        if (result.manual) {
          // Manual mode - open WhatsApp Web
          window.open(result.whatsappLink, '_blank', 'noopener,noreferrer');
          toast({
            title: 'WhatsApp Web Opening',
            description: 'Opening WhatsApp Web with your message',
          });
        } else {
          // Automated mode - message sent directly
          toast({
            title: 'Message Sent!',
            description: `Message sent to ${params.partyName || params.phoneNumber}`,
          });
        }
        return result;
      } else {
        toast({
          variant: 'destructive',
          title: 'Send Failed',
          description: result.error || 'Failed to send WhatsApp message',
        });
        return result;
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        variant: 'destructive',
        title: 'Send Error',
        description: 'An error occurred while sending the message',
      });
      throw error;
    }
  }, [toast]);

  // ✅ UPDATED: Send bulk messages using the new method
  const sendBulkMessages = useCallback(async (params: BulkMessageParams) => {
    try {
      const result = await whatsappAPI.sendBulkMessages(params);
      
      if (result.successful > 0) {
        toast({
          title: 'Bulk Messages Sent',
          description: `Successfully sent ${result.successful} out of ${result.total} messages`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          variant: result.successful === 0 ? 'destructive' : 'default',
          title: result.successful === 0 ? 'All Messages Failed' : 'Some Messages Failed',
          description: `${result.failed} messages failed to send`,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error sending bulk WhatsApp messages:', error);
      toast({
        variant: 'destructive',
        title: 'Bulk Send Error',
        description: 'An error occurred while sending bulk messages',
      });
      throw error;
    }
  }, [toast]);

  // Ensure connection before sending
  const ensureConnection = useCallback(async (): Promise<boolean> => {
    try {
      const isReady = await checkConnection();
      
      if (!isReady) {
        toast({
          variant: 'destructive',
          title: 'WhatsApp Not Connected',
          description: 'Please connect WhatsApp before sending messages',
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring connection:', error);
      return false;
    }
  }, [checkConnection, toast]);

  // Send message with connection check
  const sendMessageWithConnectionCheck = useCallback(async (params: SendMessageParams) => {
    const isReady = await ensureConnection();
    if (!isReady) {
      throw new Error('WhatsApp is not connected');
    }
    
    return await sendMessage(params);
  }, [ensureConnection, sendMessage]);

  // Initial load
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    // State
    isConnected,
    connectionInfo,
    isLoading,
    canManage,
    
    // Actions
    connectWhatsApp,
    disconnectWhatsApp,
    refreshConnection,
    sendMessage: sendMessageWithConnectionCheck,
    sendBulkMessages,
    checkConnection,
    ensureConnection,
  };
}