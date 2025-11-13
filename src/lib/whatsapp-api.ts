// // lib/api/whatsapp-api.ts
const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp`;

export interface WhatsAppConnection {
  _id?: string;
  client_id: string;
  phone_number: string;
  connected_by: {
    _id: string;
    name: string;
    email: string;
  };
  connected_by_name: string;
  connection_data: any;
  is_active: boolean;
  last_connected: string;
  createdAt: string;
  updatedAt: string;
  shared_with_users?: string[]; // Add this for sharing info
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  connection?: T;
  connections?: T[];
  hasActiveConnection?: boolean;
  hasAccess?: boolean; // Add this for access checking
  count?: number;
  error?: string;
}

// Extended interface for enhanced responses
export interface ExtendedAPIResponse<T = any> extends APIResponse<T> {
  hasAccess?: boolean;
  hasActiveConnection?: boolean;
}

// Error type guard
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

// Get error message safely
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

class WhatsAppAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Use the correct user ID - from user object or localStorage _id
    const userId = user?.id || user?._id || localStorage.getItem('_id');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-User-ID': userId || '', // Add user ID for backend access checking
      'X-User-Role': user?.role || '', // Add role for debugging
    };

    console.log('🔍 API Headers with User Info:', {
      userId,
      userRole: user?.role,
      tokenPresent: !!token
    });

    return headers;
  }

  // Get active connection for client
  async getConnection(): Promise<ExtendedAPIResponse<WhatsAppConnection>> {
    try {
      const response = await fetch(`${API_BASE}/connection`, {
        headers: this.getAuthHeaders(),
      });
      const result = await response.json();

      console.log('🔍 Get Connection API Response:', {
        url: `${API_BASE}/connection`,
        status: response.status,
        data: result
      });

      return result;
    } catch (error) {
      console.error('Error fetching WhatsApp connection:', error);
      return {
        success: false,
        message: 'Failed to fetch WhatsApp connection',
        error: getErrorMessage(error)
      };
    }
  }

  // Check connection status
  async checkStatus(): Promise<ExtendedAPIResponse> {
    try {
      const response = await fetch(`${API_BASE}/connection/status`, {
        headers: this.getAuthHeaders(),
      });
      const result = await response.json();

      console.log('🔍 Check Status API Response:', {
        url: `${API_BASE}/connection/status`,
        status: response.status,
        data: result
      });

      return result;
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      return {
        success: false,
        message: 'Failed to check WhatsApp status',
        error: getErrorMessage(error)
      };
    }
  }

  // Create connection (customer only)
  async createConnection(phoneNumber: string, connectionData?: any): Promise<ExtendedAPIResponse<WhatsAppConnection>> {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const requestBody = {
        phoneNumber,
        connectionData: {
          ...connectionData,
          // Include user context for better debugging
          userContext: {
            userId: user?.id || user?._id,
            userRole: user?.role,
            timestamp: new Date().toISOString()
          }
        }
      };

      console.log('🔍 Create Connection Request:', {
        url: `${API_BASE}/connection`,
        body: requestBody
      });

      const response = await fetch(`${API_BASE}/connection`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      console.log('🔍 Create Connection API Response:', {
        status: response.status,
        data: result
      });

      return result;
    } catch (error) {
      console.error('Error creating WhatsApp connection:', error);
      return {
        success: false,
        message: 'Failed to create WhatsApp connection',
        error: getErrorMessage(error)
      };
    }
  }

  // Delete connection (customer only)
  async deleteConnection(): Promise<ExtendedAPIResponse> {
    try {
      const response = await fetch(`${API_BASE}/connection`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      console.log('🔍 Delete Connection API Response:', {
        status: response.status,
        data: result
      });

      return result;
    } catch (error) {
      console.error('Error deleting WhatsApp connection:', error);
      return {
        success: false,
        message: 'Failed to delete WhatsApp connection',
        error: getErrorMessage(error)
      };
    }
  }

  // Get connection history (customer only)
  async getConnectionHistory(): Promise<ExtendedAPIResponse<WhatsAppConnection[]>> {
    try {
      const response = await fetch(`${API_BASE}/connection/history`, {
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      console.log('🔍 Connection History API Response:', {
        status: response.status,
        data: result
      });

      return result;
    } catch (error) {
      console.error('Error fetching connection history:', error);
      return {
        success: false,
        message: 'Failed to fetch connection history',
        error: getErrorMessage(error)
      };
    }
  }
}

export const whatsappAPI = new WhatsAppAPI();






// // lib/whatsapp-api.ts
// export interface WhatsAppStatusResponse {
//   status: 'not_initialized' | 'authenticating' | 'authenticated' | 'disconnected' | 'error';
//   phoneNumber?: string;
//   profileName?: string;
//   lastActivity?: string;
//   qrCode?: string;
// }

// export interface SendMessageResponse {
//   success: boolean;
//   messageId?: string;
//   timestamp?: number;
//   manual?: boolean;
//   whatsappLink?: string;
//   message?: string;
//   // Add error property for error cases
//   error?: string;
// }

// export interface BulkMessageResponse {
//   total: number;
//   successful: number;
//   failed: number;
//   results: Array<{
//     vendorId: string;
//     vendorName: string;
//     success: boolean;
//     messageId?: string;
//     error?: string;
//   }>;
//   errors: Array<{
//     vendorId: string;
//     vendorName: string;
//     error: string;
//   }>;
// }

// export interface APIResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
//   error?: string;
// }

// class WhatsAppAPI {
//   private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8745';
//   private getAuthToken(): string | null {
//     if (typeof window === 'undefined') return null;

//     try {
//       // Try multiple possible token storage locations
//       return localStorage.getItem('token') ||
//              localStorage.getItem('authToken') ||
//              sessionStorage.getItem('token') ||
//              sessionStorage.getItem('authToken');
//     } catch (error) {
//       console.error('Error getting auth token:', error);
//       return null;
//     }
//   }

//   // Helper to get user data for debugging
//   private debugAuth() {
//     if (typeof window === 'undefined') return {};

//     const token = this.getAuthToken();
//     const userData = localStorage.getItem('user');

//     console.log('🔐 Auth Debug:', {
//       hasToken: !!token,
//       tokenLength: token?.length,
//       tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
//       hasUserData: !!userData,
//       userData: userData ? JSON.parse(userData) : null
//     });

//     return { token, userData };
//   }

//    private async fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//     const url = `${this.baseURL}/api/whatsapp${endpoint}`;

//     // Debug authentication
//     this.debugAuth();

//     // Get auth token
//     const token = this.getAuthToken();

//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//       ...(token && { Authorization: `Bearer ${token}` }),
//     };

//     console.log('🔗 API Request:', {
//       url,
//       hasToken: !!token,
//       method: options.method || 'GET'
//     });

//     try {
//       const response = await fetch(url, {
//         ...options,
//         headers,
//       });

//       console.log('🔗 Response status:', response.status);

//       if (response.status === 401) {
//         // Clear invalid token
//         localStorage.removeItem('token');
//         localStorage.removeItem('authToken');
//         sessionStorage.removeItem('token');
//         sessionStorage.removeItem('authToken');

//         throw new Error('Authentication failed. Please login again.');
//       }

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('🔗 API Error Response:', errorText);
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log('🔗 API Success Response:', data);
//       return data;
//     } catch (error: any) {
//       console.error('🔗 WhatsApp API Error:', error);
//       throw error;
//     }
//   }

//   // Initialize WhatsApp session
//   async initialize(): Promise<APIResponse<{ sessionId: string; message: string }>> {
//     try {
//       return await this.fetchAPI('/initialize', { method: 'POST' });
//     } catch (error: any) {
//       return {
//         success: false,
//         error: error.message || 'Failed to initialize WhatsApp'
//       };
//     }
//   }

//   // Get session status
//   async checkStatus(): Promise<WhatsAppStatusResponse> {
//     try {
//       return await this.fetchAPI('/status', { method: 'GET' });
//     } catch (error: any) {
//       console.error('Error checking WhatsApp status:', error);
//       return { status: 'error' };
//     }
//   }

//   // Send message to vendor
//   async sendVendorMessage(params: {
//     vendorId: string;
//     message: string;
//     invoiceData?: any;
//     manualSend?: boolean;
//   }): Promise<SendMessageResponse> {
//     try {
//       return await this.fetchAPI('/send-message', {
//         method: 'POST',
//         body: JSON.stringify(params),
//       });
//     } catch (error: any) {
//       console.error('Error sending WhatsApp message:', error);
//       // Return a properly typed error response
//       const errorResponse: SendMessageResponse = {
//         success: false,
//         error: error.message || 'Failed to send message'
//       };
//       return errorResponse;
//     }
//   }

//   // Send bulk messages
//   async sendBulkMessages(params: {
//     vendorIds: string[];
//     message: string;
//     templateId?: string;
//   }): Promise<BulkMessageResponse> {
//     try {
//       return await this.fetchAPI('/send-bulk-messages', {
//         method: 'POST',
//         body: JSON.stringify(params),
//       });
//     } catch (error: any) {
//       console.error('Error sending bulk WhatsApp messages:', error);
//       // Return a properly typed error response
//       return {
//         total: 0,
//         successful: 0,
//         failed: 0,
//         results: [],
//         errors: [{
//           vendorId: '',
//           vendorName: '',
//           error: error.message || 'Failed to send bulk messages'
//         }]
//       };
//     }
//   }

//   // Logout from WhatsApp
//   async logout(): Promise<APIResponse> {
//     try {
//       return await this.fetchAPI('/logout', { method: 'POST' });
//     } catch (error: any) {
//       return {
//         success: false,
//         error: error.message || 'Failed to logout'
//       };
//     }
//   }

//   // Compatibility methods for your existing frontend
//   async getConnection(): Promise<{
//     success: boolean;
//     data?: {
//       connection?: any;
//       hasAccess?: boolean
//     };
//     error?: string;
//   }> {
//     try {
//       const status = await this.checkStatus();
//       return {
//         success: status.status === 'authenticated',
//         data: {
//           connection: status.status === 'authenticated' ? {
//             _id: 'temp-id',
//             client_id: 'current-client',
//             phone_number: status.phoneNumber || '',
//             connected_by: 'current-user',
//             last_connected: new Date().toISOString(),
//             status: 'authenticated'
//           } : undefined,
//           hasAccess: status.status === 'authenticated'
//         }
//       };
//     } catch (error: any) {
//       return {
//         success: false,
//         error: error.message
//       };
//     }
//   }

//   async createConnection(phoneNumber: string): Promise<APIResponse> {
//     return await this.initialize();
//   }

//   async deleteConnection(): Promise<APIResponse> {
//     return await this.logout();
//   }

//   async getConnectionHistory(): Promise<APIResponse<any[]>> {
//     return {
//       success: true,
//       data: []
//     };
//   }
// }

// export const whatsappAPI = new WhatsAppAPI();










// lib/whatsapp-api.ts
// export interface WhatsAppStatusResponse {
//   status:
//     | "not_initialized"
//     | "authenticating"
//     | "authenticated"
//     | "disconnected"
//     | "error";
//   phoneNumber?: string;
//   profileName?: string;
//   lastActivity?: string;
//   qrCode?: string;
// }

// export interface SendMessageResponse {
//   success: boolean;
//   messageId?: string;
//   timestamp?: number;
//   manual?: boolean;
//   whatsappLink?: string;
//   message?: string;
//   error?: string;
// }

// export interface SendMessageParams {
//   message: string;
//   phoneNumber: string;
//   partyName?: string;
//   invoiceData?: any;
//   manualSend?: boolean;
// }

// export interface BulkMessageResponse {
//   total: number;
//   successful: number;
//   failed: number;
//   results: Array<{
//     phoneNumber: string;
//     partyName?: string;
//     success: boolean;
//     messageId?: string;
//     error?: string;
//   }>;
//   errors: Array<{
//     phoneNumber: string;
//     partyName?: string;
//     error: string;
//   }>;
// }

// export interface BulkMessageParams {
//   phoneNumbers: string[];
//   message: string;
//   templateId?: string;
// }

// export interface APIResponse<T = any> {
//   success: boolean;
//   message?: string;
//   data?: T;
//   error?: string;
// }

// class WhatsAppAPI {
//   private baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8745";

//   private getAuthToken(): string | null {
//     if (typeof window === "undefined") return null;

//     try {
//       return (
//         localStorage.getItem("token") ||
//         localStorage.getItem("authToken") ||
//         sessionStorage.getItem("token") ||
//         sessionStorage.getItem("authToken")
//       );
//     } catch (error) {
//       console.error("Error getting auth token:", error);
//       return null;
//     }
//   }

//   private async fetchAPI<T>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<T> {
//     const url = `${this.baseURL}/api/whatsapp${endpoint}`;

//     const token = this.getAuthToken();

//     const headers: Record<string, string> = {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//     };

//     console.log("🔗 API Request:", {
//       url,
//       hasToken: !!token,
//       method: options.method || "GET",
//     });

//     try {
//       const response = await fetch(url, {
//         ...options,
//         headers,
//       });

//       console.log("🔗 Response status:", response.status);

//       if (response.status === 401) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("authToken");
//         sessionStorage.removeItem("token");
//         sessionStorage.removeItem("authToken");
//         throw new Error("Authentication failed. Please login again.");
//       }

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("🔗 API Error Response:", errorText);
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("🔗 API Success Response:", data);
//       return data;
//     } catch (error: any) {
//       console.error("🔗 WhatsApp API Error:", error);
//       throw error;
//     }
//   }

//   // Initialize WhatsApp session
//   async initialize(): Promise<
//     APIResponse<{ sessionId: string; message: string }>
//   > {
//     try {
//       return await this.fetchAPI("/initialize", { method: "POST" });
//     } catch (error: any) {
//       return {
//         success: false,
//         error: error.message || "Failed to initialize WhatsApp",
//       };
//     }
//   }

//   // Get session status
//   async checkStatus(): Promise<WhatsAppStatusResponse> {
//     try {
//       return await this.fetchAPI("/status", { method: "GET" });
//     } catch (error: any) {
//       console.error("Error checking WhatsApp status:", error);
//       return { status: "error" };
//     }
//   }

//   // ✅ NEW: Send message to party (using phone number directly)
//   async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
//     try {
//       return await this.fetchAPI("/send-message", {
//         method: "POST",
//         body: JSON.stringify(params),
//       });
//     } catch (error: any) {
//       console.error("Error sending WhatsApp message:", error);
//       return {
//         success: false,
//         error: error.message || "Failed to send message",
//       };
//     }
//   }

//   // ✅ KEEP: Legacy method for backward compatibility
//   async sendVendorMessage(params: {
//     vendorId: string;
//     message: string;
//     invoiceData?: any;
//     manualSend?: boolean;
//   }): Promise<SendMessageResponse> {
//     try {
//       return await this.fetchAPI("/send-message", {
//         method: "POST",
//         body: JSON.stringify({
//           ...params,
//           // Convert vendorId to phoneNumber if needed, or handle differently
//           phoneNumber: params.vendorId, // This might need adjustment based on your backend
//         }),
//       });
//     } catch (error: any) {
//       console.error("Error sending WhatsApp message:", error);
//       return {
//         success: false,
//         error: error.message || "Failed to send message",
//       };
//     }
//   }

//   // ✅ NEW: Send bulk messages to multiple parties
//   async sendBulkMessages(
//     params: BulkMessageParams
//   ): Promise<BulkMessageResponse> {
//     try {
//       return await this.fetchAPI("/send-bulk-messages", {
//         method: "POST",
//         body: JSON.stringify({
//           phoneNumbers: params.phoneNumbers,
//           message: params.message,
//           templateId: params.templateId,
//         }),
//       });
//     } catch (error: any) {
//       console.error("Error sending bulk WhatsApp messages:", error);
//       return {
//         total: params.phoneNumbers.length,
//         successful: 0,
//         failed: params.phoneNumbers.length,
//         results: [],
//         errors: params.phoneNumbers.map((phone) => ({
//           phoneNumber: phone,
//           error: error.message || "Failed to send bulk messages",
//         })),
//       };
//     }
//   }

//   // ✅ KEEP: Legacy bulk messages for backward compatibility
//   async sendBulkVendorMessages(params: {
//     vendorIds: string[];
//     message: string;
//     templateId?: string;
//   }): Promise<BulkMessageResponse> {
//     try {
//       return await this.fetchAPI("/send-bulk-messages", {
//         method: "POST",
//         body: JSON.stringify(params),
//       });
//     } catch (error: any) {
//       console.error("Error sending bulk WhatsApp messages:", error);
//       return {
//         total: 0,
//         successful: 0,
//         failed: 0,
//         results: [],

//         errors: [
//           {
//             phoneNumber: "", // Use phoneNumber instead of vendorId
//             partyName: "",
//             error: error.message || "Failed to send bulk messages",
//           },
//         ],

//       };
//     }
//   }

//   // Logout from WhatsApp
//   async logout(): Promise<APIResponse> {
//     try {
//       return await this.fetchAPI("/logout", { method: "POST" });
//     } catch (error: any) {
//       return {
//         success: false,
//         error: error.message || "Failed to logout",
//       };
//     }
//   }

//   // Compatibility methods
//   async getConnection(): Promise<{
//     success: boolean;
//     data?: {
//       connection?: any;
//       hasAccess?: boolean;
//     };
//     error?: string;
//   }> {
//     try {
//       const status = await this.checkStatus();
//       return {
//         success: status.status === "authenticated",
//         data: {
//           connection:
//             status.status === "authenticated"
//               ? {
//                   _id: "temp-id",
//                   client_id: "current-client",
//                   phone_number: status.phoneNumber || "",
//                   connected_by: "current-user",
//                   last_connected: new Date().toISOString(),
//                   status: "authenticated",
//                 }
//               : undefined,
//           hasAccess: status.status === "authenticated",
//         },
//       };
//     } catch (error: any) {
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }

//   async createConnection(phoneNumber: string): Promise<APIResponse> {
//     return await this.initialize();
//   }

//   async deleteConnection(): Promise<APIResponse> {
//     return await this.logout();
//   }

//   async getConnectionHistory(): Promise<APIResponse<any[]>> {
//     return {
//       success: true,
//       data: [],
//     };
//   }
// }

// export const whatsappAPI = new WhatsAppAPI();
