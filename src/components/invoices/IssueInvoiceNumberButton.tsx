"use client";

import * as React from "react";
import { issueInvoiceNumber } from "@/lib/invoices"; // your API helper
import { Button } from "@/components/ui/button";

export function IssueInvoiceNumberButton({
  companyId,
  onIssued,
}: {
  companyId: string;
  onIssued: (invoiceNumber: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (!companyId) {
      alert("No company selected");
      return;
    }

    try {
      setLoading(true);
      const number = await issueInvoiceNumber(companyId);
      onIssued(number); // send back to parent (e.g., setInvoiceNumber)
    } catch (e: any) {
      console.error("Issue invoice number failed:", e?.message || e);
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to issue invoice number"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Issuing…" : "Get Invoice Number"}
    </Button>
  );
}
