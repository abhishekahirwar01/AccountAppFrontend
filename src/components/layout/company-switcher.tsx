"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import type { Company } from "@/lib/types";
import { Loader2, Building } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { Button } from "../ui/button";

export function CompanySwitcher() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();

  React.useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(`${baseURL}/api/companies/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch companies.");
        }
        const data = await res.json();
        setCompanies(data);
        const savedCompanyId = localStorage.getItem("selectedCompanyId");
       if (data.length > 0) {
  if (savedCompanyId) {
    setSelectedCompanyId(savedCompanyId === "all" ? null : savedCompanyId);
  } else {
    setSelectedCompanyId(null);
    localStorage.setItem("selectedCompanyId", "all");
  }
}
      }  catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load companies",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, baseURL]);

 const handleCompanyChange = (companyId: string) => {
  setSelectedCompanyId(companyId === "all" ? null : companyId);
   localStorage.setItem("selectedCompanyId", companyId);
};

  // Add "All" option to the beginning of the list
  const companyOptions = [
    { value: "all", label: "All Companies" },
    ...companies.map((c) => ({
      value: c._id,
      label: c.businessName,
    })),
  ];


  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground w-full max-w-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading companies...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return null; // Don't show the switcher if there are no companies
  }

  if (companies.length === 1) {
    return (
      <Button variant="outline" className="pointer-events-none">
        <Building className="mr-2 h-4 w-4" />
        {companies[0].businessName}
      </Button>
    );
  }

  return (
   <div className="lg:w-60 w-40" >
      <Combobox
        options={companyOptions}
        value={selectedCompanyId || "all"} // Default to "all" if no company is selected
        onChange={handleCompanyChange}
        placeholder="Select a company..."
        searchPlaceholder="Search companies..."
        noResultsText="No companies found."
         className=""
      />
    </div>
  );
}
