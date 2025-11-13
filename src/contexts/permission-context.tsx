
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';

type Permissions = Partial<Pick<Client,
    'canCreateUsers' |
    'canCreateProducts' |
    'canCreateCustomers' |
    'canCreateVendors' |
    'canCreateCompanies' |
    'canCreateInventory' |
    'canUpdateCompanies' |
    'canSendInvoiceEmail' |
    'canSendInvoiceWhatsapp' |
    'maxCompanies' |
    'maxUsers' |
    'maxInventories'
>>;

interface PermissionContextType {
  permissions: Permissions | null;
  isLoading: boolean;
  refetch: () => void;
}

const PermissionContext = React.createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [permissions, setPermissions] = React.useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchPermissions = React.useCallback(async () => {
    const currentUser = getCurrentUser();
    if (currentUser?.role !== 'customer') {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      
      const res = await fetch(`${baseURL}/api/clients/my/permissions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          // No specific permissions set, use client defaults
          const clientRes = await fetch(`${baseURL}/api/clients/my`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const clientData = await clientRes.json();
          setPermissions({
              canCreateUsers: clientData.canCreateUsers,
              canCreateProducts: clientData.canCreateProducts,
              canCreateCustomers: clientData.canCreateCustomers,
              canCreateVendors: clientData.canCreateVendors,
              canCreateCompanies: clientData.canCreateCompanies,
              canCreateInventory: clientData.canCreateInventory,
              canUpdateCompanies: clientData.canUpdateCompanies,
              canSendInvoiceEmail: clientData.canSendInvoiceEmail,
              canSendInvoiceWhatsapp: clientData.canSendInvoiceWhatsapp,
          });
        } else {
            throw new Error('Failed to fetch permissions');
        }
      } else {
        const data = await res.json();
        setPermissions(data);
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not load permissions",
        description: error instanceof Error ? error.message : "An unknown error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const value = { permissions, isLoading, refetch: fetchPermissions };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = React.useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
