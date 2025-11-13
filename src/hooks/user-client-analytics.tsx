
import React from 'react';
import type { Client, Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ClientAnalyticsContextType {
    selectedClient: Client | null;
    companies: Company[];
    isCompaniesLoading: boolean;
    isClientDataLoading: boolean;
}

const ClientAnalyticsContext = React.createContext<ClientAnalyticsContextType | undefined>(undefined);

export function ClientAnalyticsProvider({ clientId, children }: { clientId: string, children: React.ReactNode }) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [isClientDataLoading, setIsClientDataLoading] = React.useState(false);
    const [isCompaniesLoading, setIsCompaniesLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        async function getClient(id: string) {
            if (!id) {
                setSelectedClient(null);
                setCompanies([]);
                return;
            };
            setIsClientDataLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");
                const res = await fetch(`${baseURL}/api/clients/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch client data");
                const data = await res.json();
                setSelectedClient(data);
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load client data", description: error instanceof Error ? error.message : "An error occurred" });
                setSelectedClient(null);
            } finally {
                setIsClientDataLoading(false);
            }
        }
        getClient(clientId);
    }, [clientId, toast]);
    
    React.useEffect(() => {
        async function fetchCompanies(id: string) {
            if (!id) {
                setCompanies([]);
                return
            };
            setIsCompaniesLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");
                const res = await fetch(`${baseURL}/api/companies/by-client/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch companies");
                const data = await res.json();
                setCompanies(data);
            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load companies", description: error instanceof Error ? error.message : "An error occurred" });
                setCompanies([]);
            } finally {
                setIsCompaniesLoading(false);
            }
        }
        fetchCompanies(clientId);
    }, [clientId, toast]);


    const value = {
        selectedClient,
        companies,
        isCompaniesLoading,
        isClientDataLoading
    };

    return (
        <ClientAnalyticsContext.Provider value={value}>
            {children}
        </ClientAnalyticsContext.Provider>
    );
}

export function useClientAnalytics() {
    const context = React.useContext(ClientAnalyticsContext);
    if (context === undefined) {
        throw new Error('useClientAnalytics must be used within a ClientAnalyticsProvider');
    }
    return context;
}
