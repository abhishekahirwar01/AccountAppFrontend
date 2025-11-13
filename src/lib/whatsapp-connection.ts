
// lib/whatsapp-connection.ts
import { whatsappAPI, type WhatsAppConnection as APIWhatsAppConnection, type APIResponse } from './whatsapp-api';

export interface WhatsAppConnection {
  isConnected: boolean;
  lastConnected?: Date;
  phoneNumber?: string;
  connectedBy?: string;
  connectedByName?: string;
  clientId?: string;
  isClientConnection?: boolean;
  connectionId?: string;
  isSharedConnection?: boolean;
  isPersonalConnection?: boolean;
  hasAccess?: boolean;
}

class WhatsAppConnectionService {
  private readonly STORAGE_KEY = 'whatsapp-connection';
  private readonly SESSION_KEY = 'whatsapp-session';
  private connectionCache: WhatsAppConnection | null = null;
  private lastChecked: number = 0;
  private readonly CACHE_DURATION = 60000;

  // Get storage key based on client ID for better persistence
  private getStorageKey(): string {
    const clientId = this.getClientId();
    return clientId ? `${this.STORAGE_KEY}-${clientId}` : this.STORAGE_KEY;
  }

  // Get client ID specifically for storage
  private getClientId(): string | null {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : {};
      
      return user?.client_id || 
             user?.clientId || 
             user?.company_id ||
             user?.tenantId ||
             localStorage.getItem('client_id') ||
             localStorage.getItem('clientId');
    } catch (error) {
      console.error('Error getting client ID:', error);
      return null;
    }
  }

  // Get current user info
  private getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : {};
      
      const combinedUser = {
        ...user,
        id: user.id || localStorage.getItem('id'),
        _id: user._id || localStorage.getItem('id'),
        role: user.role || localStorage.getItem('role'),
        name: user.name || localStorage.getItem('name'),
        email: user.email || localStorage.getItem('email'),
        client_id: user.client_id || localStorage.getItem('client_id'),
        clientId: user.clientId || localStorage.getItem('clientId'),
        company_id: user.company_id || localStorage.getItem('company_id'),
        tenantId: user.tenantId || localStorage.getItem('tenantId'),
      };

      return combinedUser;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Check if user is customer (boss/admin)
  isCustomerUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'customer';
  }

  // Check personal connection using dual storage
  private hasPersonalConnection(): boolean {
    const storageKey = this.getStorageKey();
    
    // First check sessionStorage (survives page refresh)
    const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionStored) {
      const sessionConnection: WhatsAppConnection = JSON.parse(sessionStored);
      if (sessionConnection.isConnected) {
        return true;
      }
    }
    
    // Then check localStorage (more persistent)
    const localStored = localStorage.getItem(storageKey);
    if (!localStored) return false;
    
    const localConnection: WhatsAppConnection = JSON.parse(localStored);
    
    // Check if connection is still valid (within 30 days)
    if (localConnection.lastConnected) {
      const connectionTime = new Date(localConnection.lastConnected).getTime();
      const currentTime = new Date().getTime();
      const daysDiff = (currentTime - connectionTime) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        this.clearPersonalConnection();
        return false;
      }
    }
    
    return localConnection.isConnected === true;
  }

  // Get personal connection using dual storage
  private getPersonalConnection(): WhatsAppConnection {
    const storageKey = this.getStorageKey();
    
    // Prefer session storage first
    const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionStored) {
      return JSON.parse(sessionStored);
    }
    
    // Fall back to local storage
    const localStored = localStorage.getItem(storageKey);
    return localStored ? JSON.parse(localStored) : { isConnected: false };
  }

  // Save personal connection using dual storage
  setPersonalConnection(connected: boolean, phoneNumber?: string): void {
    const storageKey = this.getStorageKey();
    const connection: WhatsAppConnection = {
      isConnected: connected,
      lastConnected: connected ? new Date() : undefined,
      phoneNumber: connected ? phoneNumber : undefined,
    };
    
    console.log('💾 Saving WhatsApp connection:', {
      storageKey,
      connected,
      clientId: this.getClientId()
    });

    // Store in sessionStorage (survives page refresh)
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(connection));
    
    // Also store in localStorage for longer persistence (survives logout)
    if (connected) {
      localStorage.setItem(storageKey, JSON.stringify(connection));
    } else {
      localStorage.removeItem(storageKey);
    }
    
    this.connectionCache = connection;
    this.lastChecked = Date.now();
  }

  // Clear personal connection
  clearPersonalConnection(): void {
    const storageKey = this.getStorageKey();
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(this.SESSION_KEY);
    this.connectionCache = null;
    
    console.log('🗑️ Cleared WhatsApp connection for:', storageKey);
  }

  // Clear all storage (use only for explicit WhatsApp logout)
  clearAllStorage(): void {
    // Clear current client connection
    this.clearPersonalConnection();
    
    // Clear any other client connections (optional cleanup)
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Removed old connection:', key);
      });
      
      sessionStorage.removeItem(this.SESSION_KEY);
    }
  }

  // Check WhatsApp connection with proper shared user access
  async checkWhatsAppWebConnection(forceRefresh = false): Promise<boolean> {
    if (!forceRefresh && this.connectionCache && 
        Date.now() - this.lastChecked < this.CACHE_DURATION) {
      return this.connectionCache.isConnected;
    }

    try {
      // Check backend connection first
      const backendResponse = await whatsappAPI.checkStatus();
      console.log('🔍 Backend Status Response:', backendResponse);

      // Staff users should have access if connection exists AND they have access
      const backendConnected = backendResponse.hasActiveConnection === true && 
                              backendResponse.hasAccess === true;

      // Only check personal connection if no shared connection exists
      let personalConnected = false;
      if (!backendConnected) {
        personalConnected = this.hasPersonalConnection();
      }
      
      const isConnected = backendConnected || personalConnected;
      
      // Update cache
      this.connectionCache = { 
        isConnected,
        isSharedConnection: backendConnected,
        isPersonalConnection: personalConnected
      };
      this.lastChecked = Date.now();

      console.log('🔍 Connection Check Result:', {
        backendConnected,
        personalConnected,
        finalConnected: isConnected,
        backendResponse
      });
      
      return isConnected;
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      return false;
    }
  }

  // Get connection info with proper access checking and type handling
  async getConnectionInfo(): Promise<WhatsAppConnection & { connectionType: 'personal' | 'client' | 'none'; hasAccess?: boolean }> {
    try {
      // Check backend connection first
      const backendResponse = await whatsappAPI.getConnection();
      
      console.log('🔍 Backend Connection Response:', backendResponse);

      if (backendResponse.success && backendResponse.connection && backendResponse.hasAccess !== false) {
        const apiConnection = backendResponse.connection;
        const user = this.getCurrentUser();
        const userId = user?.id || user?._id;
        
        // Extract connected_by ID properly - handle both string and object types
        let connectedById: string | undefined;
        if (typeof apiConnection.connected_by === 'string') {
          connectedById = apiConnection.connected_by;
        } else if (apiConnection.connected_by && typeof apiConnection.connected_by === 'object') {
          connectedById = apiConnection.connected_by._id;
        }

        // Extract connected_by name properly
        let connectedByName: string | undefined;
        if (typeof apiConnection.connected_by === 'string') {
          connectedByName = apiConnection.connected_by_name;
        } else if (apiConnection.connected_by && typeof apiConnection.connected_by === 'object') {
          connectedByName = apiConnection.connected_by.name || apiConnection.connected_by_name;
        }

        // Check if user is owner or has shared access
        const isOwner = connectedById === userId;
        const isShared = apiConnection.shared_with_users?.some((sharedUser: any) => {
          const sharedUserId = typeof sharedUser === 'string' ? sharedUser : sharedUser._id;
          return sharedUserId === userId;
        });

        const hasAccess = isOwner || isShared || backendResponse.hasAccess === true;

        console.log('🔍 Access Check for Connection:', {
          userId,
          connectedById,
          connectedByName,
          sharedWithUsers: apiConnection.shared_with_users,
          isOwner,
          isShared,
          hasAccess
        });

        if (hasAccess) {
          return {
            isConnected: true,
            phoneNumber: apiConnection.phone_number,
            connectedBy: connectedById,
            connectedByName: connectedByName,
            clientId: apiConnection.client_id,
            connectionId: apiConnection._id,
            lastConnected: new Date(apiConnection.last_connected),
            isClientConnection: true,
            connectionType: 'client',
            hasAccess: true
          };
        }
      }

      // Only check personal connection if no shared connection exists or no access
      const personalConnection = this.getPersonalConnection();
      if (personalConnection.isConnected) {
        return { 
          ...personalConnection, 
          connectionType: 'personal',
          hasAccess: true 
        };
      }

      return { 
        isConnected: false, 
        connectionType: 'none',
        hasAccess: false 
      };
    } catch (error) {
      console.error('Error getting connection info:', error);
      return { 
        isConnected: false, 
        connectionType: 'none',
        hasAccess: false 
      };
    }
  }

  // Save client connection (customer only)
  async setClientConnection(phoneNumber: string, connectionData?: any): Promise<boolean> {
    try {
      const response = await whatsappAPI.createConnection(phoneNumber, connectionData);
      
      if (response.success) {
        this.setPersonalConnection(true, phoneNumber);
        this.connectionCache = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting client connection:', error);
      return false;
    }
  }

  // Clear client connection (customer only)
  async clearClientConnection(): Promise<boolean> {
    try {
      const response = await whatsappAPI.deleteConnection();
      
      if (response.success) {
        this.clearPersonalConnection();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error clearing client connection:', error);
      return false;
    }
  }

  // Check if user can manage connections
  canManageConnections(): boolean {
    return this.isCustomerUser();
  }

  // Get connection history (customer only)
  async getConnectionHistory() {
    if (!this.canManageConnections()) {
      throw new Error('Insufficient permissions');
    }
    
    return await whatsappAPI.getConnectionHistory();
  }

  // Refresh connection cache
  refreshConnection(): void {
    this.connectionCache = null;
    this.lastChecked = 0;
  }

  // NEW: Simple sync method for quick checks
  isWhatsAppConnected(): boolean {
    return this.hasPersonalConnection();
  }

  // NEW: Set connection status (compatible with reference code)
  setConnectionStatus(connected: boolean, phoneNumber?: string, connectionId?: string): void {
    this.setPersonalConnection(connected, phoneNumber);
  }

  // NEW: Method to restore connection when user logs in
  restoreConnectionOnLogin(): boolean {
    const wasConnected = this.hasPersonalConnection();
    
    if (wasConnected) {
      console.log('🔄 Restoring WhatsApp connection after login');
      
      // Update session storage with current connection info
      const connectionInfo = this.getPersonalConnection();
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(connectionInfo));
      
      return true;
    }
    
    return false;
  }

  // NEW: Debug method to see connection state
  debugConnections() {
    if (typeof window === 'undefined') return {};
    
    const storageKey = this.getStorageKey();
    const allConnections: any = {};
    
    // Check session storage
    const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionStored) {
      allConnections.sessionStorage = JSON.parse(sessionStored);
    }
    
    // Check local storage
    const localStored = localStorage.getItem(storageKey);
    if (localStored) {
      allConnections.localStorage = JSON.parse(localStored);
    }
    
    return {
      currentClientId: this.getClientId(),
      currentStorageKey: storageKey,
      sessionStorage: allConnections.sessionStorage,
      localStorage: allConnections.localStorage,
      isConnected: this.hasPersonalConnection(),
      connectionCache: this.connectionCache
    };
  }

  // Enhanced debug method to check staff access
  public debugStaffAccess() {
    const user = this.getCurrentUser();
    return {
      user: {
        id: user?.id,
        _id: user?._id,
        role: user?.role,
        name: user?.name
      },
      canManage: this.canManageConnections(),
      hasPersonalConnection: this.hasPersonalConnection(),
      currentCache: this.connectionCache
    };
  }
}

export const whatsappConnectionService = new WhatsAppConnectionService();



















/////////////////////////////////////////////////////////////////////////////////


// lib/whatsapp-connection.ts
// import { whatsappAPI, type WhatsAppStatusResponse, type APIResponse } from './whatsapp-api';

// export interface WhatsAppConnection {
//   isConnected: boolean;
//   lastConnected?: Date;
//   phoneNumber?: string;
//   connectedBy?: string;
//   connectedByName?: string;
//   clientId?: string;
//   isClientConnection?: boolean;
//   connectionId?: string;
//   isSharedConnection?: boolean;
//   isPersonalConnection?: boolean;
//   hasAccess?: boolean;
//   profileName?: string;
//    qrCode?: string;
// }

// class WhatsAppConnectionService {
//   private readonly STORAGE_KEY = 'whatsapp-connection';
//   private readonly SESSION_KEY = 'whatsapp-session';
//   private connectionCache: WhatsAppConnection | null = null;
//   private lastChecked: number = 0;
//   private readonly CACHE_DURATION = 60000;

//   // Get storage key based on client ID for better persistence
//   private getStorageKey(): string {
//     const clientId = this.getClientId();
//     return clientId ? `${this.STORAGE_KEY}-${clientId}` : this.STORAGE_KEY;
//   }

//   // Get client ID specifically for storage
//   private getClientId(): string | null {
//     try {
//       const userData = localStorage.getItem('user');
//       const user = userData ? JSON.parse(userData) : {};
      
//       return user?.client_id || 
//              user?.clientId || 
//              user?.company_id ||
//              user?.tenantId ||
//              localStorage.getItem('client_id') ||
//              localStorage.getItem('clientId');
//     } catch (error) {
//       console.error('Error getting client ID:', error);
//       return null;
//     }
//   }

//   // Get current user info
//   private getCurrentUser() {
//     if (typeof window === 'undefined') return null;
    
//     try {
//       const userData = localStorage.getItem('user');
//       const user = userData ? JSON.parse(userData) : {};
      
//       const combinedUser = {
//         ...user,
//         id: user.id || localStorage.getItem('id'),
//         _id: user._id || localStorage.getItem('id'),
//         role: user.role || localStorage.getItem('role'),
//         name: user.name || localStorage.getItem('name'),
//         email: user.email || localStorage.getItem('email'),
//         client_id: user.client_id || localStorage.getItem('client_id'),
//         clientId: user.clientId || localStorage.getItem('clientId'),
//         company_id: user.company_id || localStorage.getItem('company_id'),
//         tenantId: user.tenantId || localStorage.getItem('tenantId'),
//       };

//       return combinedUser;
//     } catch (error) {
//       console.error('Error parsing user data:', error);
//       return null;
//     }
//   }

//   // Check if user is customer (boss/admin)
//   isCustomerUser(): boolean {
//     const user = this.getCurrentUser();
//     return user?.role === 'customer';
//   }

//   // Check personal connection using dual storage
//   private hasPersonalConnection(): boolean {
//     const storageKey = this.getStorageKey();
    
//     // First check sessionStorage (survives page refresh)
//     const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
//     if (sessionStored) {
//       const sessionConnection: WhatsAppConnection = JSON.parse(sessionStored);
//       if (sessionConnection.isConnected) {
//         return true;
//       }
//     }
    
//     // Then check localStorage (more persistent)
//     const localStored = localStorage.getItem(storageKey);
//     if (!localStored) return false;
    
//     const localConnection: WhatsAppConnection = JSON.parse(localStored);
    
//     // Check if connection is still valid (within 30 days)
//     if (localConnection.lastConnected) {
//       const connectionTime = new Date(localConnection.lastConnected).getTime();
//       const currentTime = new Date().getTime();
//       const daysDiff = (currentTime - connectionTime) / (1000 * 60 * 60 * 24);
      
//       if (daysDiff > 30) {
//         this.clearPersonalConnection();
//         return false;
//       }
//     }
    
//     return localConnection.isConnected === true;
//   }

//   // Get personal connection using dual storage
//   private getPersonalConnection(): WhatsAppConnection {
//     const storageKey = this.getStorageKey();
    
//     // Prefer session storage first
//     const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
//     if (sessionStored) {
//       return JSON.parse(sessionStored);
//     }
    
//     // Fall back to local storage
//     const localStored = localStorage.getItem(storageKey);
//     return localStored ? JSON.parse(localStored) : { isConnected: false };
//   }

//   // Save personal connection using dual storage
//   setPersonalConnection(connected: boolean, phoneNumber?: string): void {
//     const storageKey = this.getStorageKey();
//     const connection: WhatsAppConnection = {
//       isConnected: connected,
//       lastConnected: connected ? new Date() : undefined,
//       phoneNumber: connected ? phoneNumber : undefined,
//     };
    
//     console.log('💾 Saving WhatsApp connection:', {
//       storageKey,
//       connected,
//       clientId: this.getClientId()
//     });

//     // Store in sessionStorage (survives page refresh)
//     sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(connection));
    
//     // Also store in localStorage for longer persistence (survives logout)
//     if (connected) {
//       localStorage.setItem(storageKey, JSON.stringify(connection));
//     } else {
//       localStorage.removeItem(storageKey);
//     }
    
//     this.connectionCache = connection;
//     this.lastChecked = Date.now();
//   }

//   // Clear personal connection
//   clearPersonalConnection(): void {
//     const storageKey = this.getStorageKey();
//     localStorage.removeItem(storageKey);
//     sessionStorage.removeItem(this.SESSION_KEY);
//     this.connectionCache = null;
    
//     console.log('🗑️ Cleared WhatsApp connection for:', storageKey);
//   }

//   // Clear all storage (use only for explicit WhatsApp logout)
//   clearAllStorage(): void {
//     // Clear current client connection
//     this.clearPersonalConnection();
    
//     // Clear any other client connections (optional cleanup)
//     if (typeof window !== 'undefined') {
//       const keysToRemove: string[] = [];
//       for (let i = 0; i < localStorage.length; i++) {
//         const key = localStorage.key(i);
//         if (key && key.startsWith(this.STORAGE_KEY)) {
//           keysToRemove.push(key);
//         }
//       }
      
//       keysToRemove.forEach(key => {
//         localStorage.removeItem(key);
//         console.log('🗑️ Removed old connection:', key);
//       });
      
//       sessionStorage.removeItem(this.SESSION_KEY);
//     }
//   }

//   // Check WhatsApp connection with proper shared user access
//   async checkWhatsAppWebConnection(forceRefresh = false): Promise<boolean> {
//     if (!forceRefresh && this.connectionCache && 
//         Date.now() - this.lastChecked < this.CACHE_DURATION) {
//       return this.connectionCache.isConnected;
//     }

//     try {
//       // Check backend connection first using the new API
//       const backendStatus = await whatsappAPI.checkStatus();
//       console.log('🔍 Backend Status Response:', backendStatus);

//       // Check if backend WhatsApp is connected
//       const backendConnected = backendStatus.status === 'authenticated';
      
//       // Only check personal connection if no shared connection exists
//       let personalConnected = false;
//       if (!backendConnected) {
//         personalConnected = this.hasPersonalConnection();
//       }
      
//       const isConnected = backendConnected || personalConnected;
      
//       // Update cache
//       this.connectionCache = { 
//         isConnected,
//         isSharedConnection: backendConnected,
//         isPersonalConnection: personalConnected
//       };
//       this.lastChecked = Date.now();

//       console.log('🔍 Connection Check Result:', {
//         backendConnected,
//         personalConnected,
//         finalConnected: isConnected,
//         backendStatus
//       });
      
//       return isConnected;
//     } catch (error) {
//       console.error('Error checking WhatsApp connection:', error);
//       return false;
//     }
//   }

//   // Get connection info with proper access checking and type handling
//   async getConnectionInfo(): Promise<WhatsAppConnection & { connectionType: 'personal' | 'client' | 'none'; hasAccess?: boolean }> {
//     try {
//       // Check backend connection first using the new API
//       const backendStatus = await whatsappAPI.checkStatus();
      
//       console.log('🔍 Backend Connection Status:', backendStatus);

//       // Check if backend WhatsApp is connected and authenticated
//       if (backendStatus.status === 'authenticated') {
//         const user = this.getCurrentUser();
//         const userId = user?.id || user?._id;
        
//         // For the new API, we assume access if authenticated
//         // You can add more sophisticated access control here if needed
//         const hasAccess = true;

//         console.log('🔍 Access Check for Connection:', {
//           userId,
//           phoneNumber: backendStatus.phoneNumber,
//           hasAccess
//         });

//         if (hasAccess) {
//           return {
//             isConnected: true,
//             phoneNumber: backendStatus.phoneNumber,
//             profileName: backendStatus.profileName,
//             connectedBy: userId,
//             connectedByName: user?.name,
//             lastConnected: backendStatus.lastActivity ? new Date(backendStatus.lastActivity) : new Date(),
//             isClientConnection: true,
//             connectionType: 'client',
//             hasAccess: true
//           };
//         }
//       }

//       // Only check personal connection if no shared connection exists or no access
//       const personalConnection = this.getPersonalConnection();
//       if (personalConnection.isConnected) {
//         return { 
//           ...personalConnection, 
//           connectionType: 'personal',
//           hasAccess: true 
//         };
//       }

//       return { 
//         isConnected: false, 
//         connectionType: 'none',
//         hasAccess: false 
//       };
//     } catch (error) {
//       console.error('Error getting connection info:', error);
//       return { 
//         isConnected: false, 
//         connectionType: 'none',
//         hasAccess: false 
//       };
//     }
//   }

//   // Save client connection (customer only)
//   async setClientConnection(phoneNumber: string, connectionData?: any): Promise<boolean> {
//     try {
//       const response = await whatsappAPI.createConnection(phoneNumber);
      
//       if (response.success) {
//         this.setPersonalConnection(true, phoneNumber);
//         this.connectionCache = null;
//         return true;
//       }
      
//       return false;
//     } catch (error) {
//       console.error('Error setting client connection:', error);
//       return false;
//     }
//   }

//   // Clear client connection (customer only)
//   async clearClientConnection(): Promise<boolean> {
//     try {
//       const response = await whatsappAPI.deleteConnection();
      
//       if (response.success) {
//         this.clearPersonalConnection();
//         return true;
//       }
      
//       return false;
//     } catch (error) {
//       console.error('Error clearing client connection:', error);
//       return false;
//     }
//   }

//   // Check if user can manage connections
//   canManageConnections(): boolean {
//     return this.isCustomerUser();
//   }

//   // Get connection history (customer only)
//   async getConnectionHistory() {
//     if (!this.canManageConnections()) {
//       throw new Error('Insufficient permissions');
//     }
    
//     return await whatsappAPI.getConnectionHistory();
//   }

//   // Refresh connection cache
//   refreshConnection(): void {
//     this.connectionCache = null;
//     this.lastChecked = 0;
//   }

//   // Simple sync method for quick checks
//   isWhatsAppConnected(): boolean {
//     return this.hasPersonalConnection();
//   }

//   // Set connection status (compatible with reference code)
//   setConnectionStatus(connected: boolean, phoneNumber?: string, connectionId?: string): void {
//     this.setPersonalConnection(connected, phoneNumber);
//   }

//   // Method to restore connection when user logs in
//   restoreConnectionOnLogin(): boolean {
//     const wasConnected = this.hasPersonalConnection();
    
//     if (wasConnected) {
//       console.log('🔄 Restoring WhatsApp connection after login');
      
//       // Update session storage with current connection info
//       const connectionInfo = this.getPersonalConnection();
//       sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(connectionInfo));
      
//       return true;
//     }
    
//     return false;
//   }

//   // Debug method to see connection state
//   debugConnections() {
//     if (typeof window === 'undefined') return {};
    
//     const storageKey = this.getStorageKey();
//     const allConnections: any = {};
    
//     // Check session storage
//     const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
//     if (sessionStored) {
//       allConnections.sessionStorage = JSON.parse(sessionStored);
//     }
    
//     // Check local storage
//     const localStored = localStorage.getItem(storageKey);
//     if (localStored) {
//       allConnections.localStorage = JSON.parse(localStored);
//     }
    
//     return {
//       currentClientId: this.getClientId(),
//       currentStorageKey: storageKey,
//       sessionStorage: allConnections.sessionStorage,
//       localStorage: allConnections.localStorage,
//       isConnected: this.hasPersonalConnection(),
//       connectionCache: this.connectionCache
//     };
//   }

//   // Enhanced debug method to check staff access
//   public debugStaffAccess() {
//     const user = this.getCurrentUser();
//     return {
//       user: {
//         id: user?.id,
//         _id: user?._id,
//         role: user?.role,
//         name: user?.name
//       },
//       canManage: this.canManageConnections(),
//       hasPersonalConnection: this.hasPersonalConnection(),
//       currentCache: this.connectionCache
//     };
//   }

//   // NEW: Check if QR code is available (for connection dialog)
//   async isQRCodeAvailable(): Promise<boolean> {
//     try {
//       const status = await whatsappAPI.checkStatus();
//       return status.status === 'authenticating' && !!status.qrCode;
//     } catch (error) {
//       console.error('Error checking QR code:', error);
//       return false;
//     }
//   }

//   // NEW: Get QR code data for display
//   async getQRCodeData(): Promise<string | null> {
//     try {
//       const status = await whatsappAPI.checkStatus();
//       return status.qrCode || null;
//     } catch (error) {
//       console.error('Error getting QR code:', error);
//       return null;
//     }
//   }

//   // NEW: Wait for connection to be established
//   async waitForConnection(timeoutMs: number = 120000): Promise<boolean> {
//     const startTime = Date.now();
    
//     return new Promise((resolve) => {
//       const checkInterval = setInterval(async () => {
//         try {
//           const status = await whatsappAPI.checkStatus();
          
//           if (status.status === 'authenticated') {
//             clearInterval(checkInterval);
//             resolve(true);
//           } else if (Date.now() - startTime > timeoutMs) {
//             clearInterval(checkInterval);
//             resolve(false);
//           }
//         } catch (error) {
//           console.error('Error waiting for connection:', error);
//           clearInterval(checkInterval);
//           resolve(false);
//         }
//       }, 3000); // Check every 3 seconds
//     });
//   }

//   async getQRCode(): Promise<string | null> {
//     try {
//       const status = await whatsappAPI.checkStatus();
//       console.log('🔍 QR Code Status:', status);
      
//       if (status.status === 'authenticating' && status.qrCode) {
//         return status.qrCode;
//       }
//       return null;
//     } catch (error) {
//       console.error('Error getting QR code:', error);
//       return null;
//     }
//   }

//   // NEW: Wait for QR code to be available
//   async waitForQRCode(timeoutMs: number = 30000): Promise<string | null> {
//     const startTime = Date.now();
    
//     return new Promise((resolve) => {
//       const checkQR = async () => {
//         try {
//           const qrCode = await this.getQRCode();
          
//           if (qrCode) {
//             resolve(qrCode);
//           } else if (Date.now() - startTime > timeoutMs) {
//             resolve(null);
//           } else {
//             setTimeout(checkQR, 2000); // Check every 2 seconds
//           }
//         } catch (error) {
//           console.error('Error waiting for QR code:', error);
//           resolve(null);
//         }
//       };
      
//       checkQR();
//     });
//   }
// }

// export const whatsappConnectionService = new WhatsAppConnectionService();