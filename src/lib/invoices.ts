

import axios from "axios";

export async function issueInvoiceNumber(companyId: string, date?: string): Promise<string> {
  if (!companyId) throw new Error("companyId is required");

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // set to your BE origin
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // const res = await axios.post(
  //   `http://localhost:5000/api/invoices/issue-number`,
  //   { companyId, ...(date ? { date } : {}) },
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //     },
  //   }
  // );
  const payload: any = { companyId };
  if (date) {
    const iso =
      typeof date === "string" ? date : new Date(date).toISOString();
    payload.date = iso;
  }

  try {
    const res = await axios.post(`${baseURL}/api/invoices/issue-number`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // withCredentials: true, // uncomment if your BE uses cookies + CORS
    });
      console.log("[issueInvoiceNumber] ✅ Response:", res.data);
    const invoiceNumber = res?.data?.invoiceNumber;
    if (!invoiceNumber) {
      console.error("[issueInvoiceNumber] ❌ No invoiceNumber in response");  
      throw new Error("Backend did not return invoiceNumber");
    }
    return invoiceNumber as string;
  } catch (err: any) {
    console.error("[issueInvoiceNumber] ❌ Error:", err?.response?.data || err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to issue invoice number";
    throw new Error(msg);
  }
  // return res.data.invoiceNumber as string;
}
