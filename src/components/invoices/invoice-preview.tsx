"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2, Edit } from "lucide-react";
import type { Company, Party, Transaction } from "@/lib/types";
import { DialogFooter } from "../ui/dialog";
// import {
//   generatePdfForTemplate1,
//   generatePdfForTemplate2,
//   generatePdfForTemplate3,
//   generatePdfForTemplate4,
//   generatePdfForTemplate5,
//   generatePdfForTemplate6,
//   generatePdfForTemplate7,
// } from "@/lib/pdf-templates";

import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
// priya
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate8 } from "@/lib/pdf-template8";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import { generatePdfForTemplateA5_2 } from "@/lib/pdf-templateA3-2";
import { generatePdfForTemplateA5_5 } from "@/lib/pdf-templateA5-5";
//amit
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import { generatePdfForTemplate18 } from "@/lib/pdf-template18";

//aditya
import { generatePdfForTemplate20 } from "@/lib/pdf-template20";
import { generatePdfForTemplate21 } from "@/lib/pdf-template21";
import jsPDF from "jspdf";




import { generatePdfForTemplate11React } from "@/lib/pdf-template11-react-pdf";


import { EnhancedInvoicePreview } from "./enhanced-invoice-preview";
import { generatePdfForTemplate19 } from "@/lib/pdf-template19";

type TemplateKey =
  | "template1"
  | "template2"
  | "template3"
  | "template4"
  | "template5"
  | "template6"
  | "template7"
  | "template8"
  | "template9"
  | "template11"
  | "template12"
  | "templateA5"
  | "templateA5_2"
  | "templateA5_3"
  | "templateA5_4"
  |"templateA5_5"
  | "template-t3"
  | "template16"
  | "template17"
  | "template18"
  | "template19"
  | "template20"
  | "template21";

interface InvoicePreviewProps {
  transaction: Transaction | null;
  company: Company | null;
  party: Party | null;
  serviceNameById?: Map<string, string>;
  editMode?: boolean;
  onSave?: (updatedTransaction: Transaction) => void;
  onCancel?: () => void;
}

export function InvoicePreview({
  transaction,
  company,
  party,
  serviceNameById,
  editMode = false,
  onSave,
  onCancel,
}: InvoicePreviewProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateKey>("template1");

  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  // Use the editMode prop instead of internal state
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [bank, setBank] = React.useState<any>(null);
  const [client, setClient] = React.useState<any>(null);

  // Fetch bank details
  React.useEffect(() => {
    console.log("transaction.bank:", transaction?.bank);
    if (transaction?.bank) {
      if (typeof transaction.bank === "object" && transaction.bank.bankName) {
        // Already populated Bank object
        console.log("bank already populated:", transaction.bank);
        setBank(transaction.bank);
      } else {
        // Need to fetch
        const bankId =
          typeof transaction.bank === "string"
            ? transaction.bank
            : (transaction.bank as any)?.$oid || (transaction.bank as any)?._id;
        console.log("bankId:", bankId);
        if (bankId) {
          fetch(`${baseURL}/api/bank-details/${bankId}`)
            .then((res) => res.json())
            .then((data) => {
              console.log("fetched bank:", data);
              setBank(data);
            })
            .catch((err) => console.error("Failed to fetch bank:", err));
        }
      }
    } else {
      setBank(null);
    }
  }, [transaction?.bank]);

  console.log("bank details:", bank);
  console.log("shipping address:", transaction);
  console.log("company:", company);
  console.log("party:", party);

  // Fetch client details
  React.useEffect(() => {
    console.log("company?.client:", company?.client);
    if (company?.client) {
      if (typeof company.client === "object" && company.client.contactName) {
        // Already populated Client object
        console.log("client already populated:", company.client);
        setClient(company.client);
      } else {
        // Need to fetch
        const clientId =
          typeof company.client === "string"
            ? company.client
            : (company.client as any)?.$oid || (company.client as any)?._id;
        console.log("clientId:", clientId);
        if (clientId) {
          fetch(`${baseURL}/api/clients/${clientId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("fetched client:", data);
              setClient(data);
            })
            .catch((err) => console.error("Failed to fetch client:", err));
        }
      }
    } else {
      setClient(null);
    }
  }, [company?.client]);

  // console.log("Client Data :", client.contactName)

  React.useEffect(() => {
    let objectUrl: string | null = null;

    const generatePdf = async () => {
      if (!transaction) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // ✅ forward serviceNameById to the PDF generators
        let pdfBlob: Blob;

        // Extract shipping address from transaction
        let shippingAddress = null;

        if (transaction?.shippingAddress) {
          const addr = transaction.shippingAddress as any;
          if (addr instanceof Map || addr?.size > 0) {
            // it's a Map of services, not an address
            shippingAddress = null;
          } else if (
            typeof addr === "object" &&
            (addr.address || addr.city || addr.state)
          ) {
            // it's a real address object
            shippingAddress = addr;
          }
        }

        if (
          selectedTemplate === "template1" ||
          selectedTemplate === "template8" ||
          selectedTemplate ===  "template9" ||
          selectedTemplate === "templateA5" ||
          selectedTemplate === "template18" ||
          selectedTemplate === "template20" ||
          selectedTemplate === "template21" ||
          selectedTemplate === "template12" ||
          selectedTemplate === "templateA5_2" ||
          selectedTemplate === "templateA5_3" ||
          selectedTemplate === "templateA5_4" ||
          selectedTemplate === "templateA5_5" ||
          selectedTemplate === "template-t3"
        ) {
          // Template 8 and Template A5 use react-pdf and return Blob directly
          switch (selectedTemplate) {
            case "template1":
              pdfBlob = await generatePdfForTemplate1(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank,
                // client.contactName
              );
              break;
            case "template8":
              pdfBlob = await generatePdfForTemplate8(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
               case "template9":
              pdfBlob = await generatePdfForTemplate11React(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
            case "template12":
              pdfBlob = await generatePdfForTemplate12(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
            case "templateA5":
              pdfBlob = await generatePdfForTemplateA5(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank,
                client
                // client.contactName
              );
              break;

            case "template18":
              pdfBlob = await generatePdfForTemplate18(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
            case "template20":
              pdfBlob = await generatePdfForTemplate20(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
            case "template21":
              pdfBlob = await generatePdfForTemplate21(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
            case "templateA5_2":
              pdfBlob = await generatePdfForTemplateA5_2(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank,
                client
                // client.contactName
              );
              break;
            case "templateA5_3":
              pdfBlob = await generatePdfForTemplateA5_3(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank,
                client
                // client.contactName
              );
              break;
            case "templateA5_4":
              pdfBlob = await generatePdfForTemplateA5_4(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank,
                client
                // client.contactName
              );
              break;

             case "templateA5_5":
              pdfBlob = await generatePdfForTemplateA5_5(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress,
                bank,
                client
                // client.contactName
              );
              break;
            case "template-t3":
              pdfBlob = await generatePdfForTemplatet3(
                transaction,
                company,
                party,
                shippingAddress,
                bank
                // client.contactName
              );
              break;
          }
        } else {
          // Other templates use jsPDF
          let docPromise: Promise<jsPDF>;

          switch (selectedTemplate) {
            case "template2":
              docPromise = Promise.resolve(
                generatePdfForTemplate2(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress
                  // client.contactName
                )
              );
              break;
            case "template3":
              docPromise = generatePdfForTemplate3(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
                // client.contactName
              );
              break;
            case "template4":
              docPromise = Promise.resolve(
                generatePdfForTemplate4(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress
                  // client.contactName
                )
              );
              break;
            case "template5":
              docPromise = Promise.resolve(
                generatePdfForTemplate5(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress
                  // client.contactName
                )
              );
              break;
            case "template6":
              docPromise = Promise.resolve(
                generatePdfForTemplate6(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress
                  // client.contactName
                )
              );
              break;
            case "template7":
              docPromise = Promise.resolve(
                generatePdfForTemplate7(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress
                  // client.contactName
                )
              );
              break;
            // Template 11 case ko fix karo - line 300 ke aas paas

            case "template11":
              docPromise = Promise.resolve(
                generatePdfForTemplate11(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress,
                  {
                    displayCompanyName: company?.businessName,
                    logoUrl: company?.logo
                      ? `${baseURL}${company.logo}`
                      : undefined,
                  },
                  bank
                )
              );
              break;

            case "template16":
              docPromise = Promise.resolve(
                generatePdfForTemplate16(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress,
                  bank
                  // client.contactName
                )
              );
              break;
            case "template17":
              docPromise = Promise.resolve(
                generatePdfForTemplate17(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress,
                  bank
                  // client.contactName
                )
              );
              break;

            case "template19":
              docPromise = Promise.resolve(
                generatePdfForTemplate19(
                  transaction,
                  company,
                  party,
                  serviceNameById,
                  shippingAddress,
                  bank
                  // client.contactName
                )
              );
              break;
            default:
              docPromise = generatePdfForTemplate3(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
                // client.contactName
              );
          }

          const doc = await docPromise;
          pdfBlob = doc.output("blob");
        }
        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
        setPdfBlob(pdfBlob);
      } catch (err) {
        console.error(err);
        setPdfUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    generatePdf();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    selectedTemplate,
    transaction,
    company,
    party,
    serviceNameById,
    bank,
    client,
  ]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${party?.name || 'invoice'}(${company?.businessName || company?.companyName || 'company'}).pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // add a small adapter so types match Select's signature
  const handleTemplateChange = React.useCallback((v: string) => {
    setSelectedTemplate(v as TemplateKey);
  }, []);

  // If in edit mode, render the enhanced editor
  if (editMode) {
    console.log(
      "🎨 Edit mode active, PDF blob available:",
      !!pdfBlob,
      "Loading:",
      isLoading
    );
    return (
      <div className="max-h-[80vh] overflow-auto">
        <EnhancedInvoicePreview
          transaction={transaction}
          company={company}
          party={party}
          serviceNameById={serviceNameById}
          initialPdfBlob={pdfBlob}
          onExitEditMode={onCancel}
        />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 flex-1 min-h-0">
        <div className="bg-secondary rounded-lg overflow-auto h-full w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-3">Generating PDF Preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Invoice Preview"
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p>Could not generate PDF preview.</p>
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="p-6 pt-4 bg-background border-t flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">
              {party?.name || 'Invoice'} ({company?.businessName || company?.companyName || 'Company'})
            </label>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template1">Template 1</SelectItem>
              {/*  <SelectItem value="template2">Creative</SelectItem>
              <SelectItem value="template3">Modern</SelectItem>
              <SelectItem value="template4">Minimal</SelectItem>
              <SelectItem value="template5">Refined</SelectItem>
              <SelectItem value="template6">Standard</SelectItem>
              <SelectItem value="template7">Prestige</SelectItem> */}
              {/* priya  */}
              <SelectItem value="template8">Template 2</SelectItem>
              {/* <SelectItem value="template8">Template 8</SelectItem>  */}
              <SelectItem value="template11">Template 3</SelectItem>
              {/* <SelectItem value="template9">Template 9</SelectItem> */}
              <SelectItem value="template12">Template 4</SelectItem>
              {/* <SelectItem value="template16">Template 5</SelectItem> */}
              <SelectItem value="template9">Template 5</SelectItem>
              <SelectItem value="template19">Template 6</SelectItem>
              <SelectItem value="template17">Template 7</SelectItem>

              <SelectItem value="template20">Template 8</SelectItem>
              <SelectItem value="template21">Template 9</SelectItem>
              <SelectItem value="templateA5">Template A5</SelectItem>
              <SelectItem value="templateA5_2">Template A5-2</SelectItem>
              <SelectItem value="templateA5_3">Template A5-3</SelectItem>
              <SelectItem value="templateA5_4">Template A5-4</SelectItem>
              <SelectItem value="templateA5_5">Template A5-5</SelectItem>
              <SelectItem value="template-t3">Template T3</SelectItem>
              <SelectItem value="template18">Template T3-2</SelectItem>
              {/* amit  */}
            </SelectContent>
          </Select>
        </div>
        {/* Edit button removed - now controlled by parent component */}
        <Button onClick={handleDownload} disabled={isLoading || !pdfUrl}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </DialogFooter>
    </>
  );
}
