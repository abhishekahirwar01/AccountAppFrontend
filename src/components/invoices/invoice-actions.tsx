"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Download,
  Printer,
  MessageCircle,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppComposerDialog } from "@/components/transactions/whatsapp-composer-dialog";

// Import PDF generators
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
import { generatePdfForTemplate8 } from "@/lib/pdf-template8";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import { generatePdfForTemplateA5_2 } from "@/lib/pdf-templateA3-2";
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import { generatePdfForTemplate18 } from "@/lib/pdf-template18";
import { generatePdfForTemplate19 } from "@/lib/pdf-template19";
import { generatePdfForTemplate20 } from "@/lib/pdf-template20";
import { generatePdfForTemplate21 } from "@/lib/pdf-template21";

interface InvoiceActionsProps {
  generatedInvoice: any;
  isTransactionSaved: boolean;
  savedTransactionData: any;
  companies: any[];
  parties: any[];
  products: any[];
  services: any[];
  serviceNameById: Map<string, string>;
  form: any;
  onSubmit: (values: any, shouldCloseForm?: boolean) => Promise<any>;
  onFormSubmit: () => void;
  invoicePreviewOpen?: boolean;
  onInvoicePreviewOpenChange?: (open: boolean) => void;
}

export function InvoiceActions({
  generatedInvoice,
  isTransactionSaved,
  savedTransactionData,
  companies,
  parties,
  products,
  services,
  serviceNameById,
  form,
  onSubmit,
  onFormSubmit,
  invoicePreviewOpen = false,
  onInvoicePreviewOpenChange,
}: InvoiceActionsProps) {
  const [localPreviewOpen, setLocalPreviewOpen] = useState(false);
  const [whatsappComposerOpen, setWhatsappComposerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(true);
  const { toast } = useToast();

  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  // ✅ USE PROPS IF PROVIDED, OTHERWUSE USE LOCAL STATE
  const previewOpen =
    onInvoicePreviewOpenChange !== undefined
      ? invoicePreviewOpen
      : localPreviewOpen;
  const setPreviewOpen = onInvoicePreviewOpenChange || setLocalPreviewOpen;

  // ✅ COMMON ENRICH FUNCTION (InvoiceTemplateRenderer se liya)
  const enrichTransactionWithNames = (transaction: any) => {
    if (!transaction) return transaction;

    const enriched = { ...transaction };

    if (Array.isArray(enriched.products)) {
      enriched.products = enriched.products.map((productItem: any) => {
        const product = products.find((p) => p._id === productItem.product);
        return {
          ...productItem,
          productName: product?.name || "Unknown Product",
          product: product
            ? { ...product, name: product.name }
            : productItem.product,
        };
      });
    }

    if (Array.isArray(enriched.services)) {
      enriched.services = enriched.services.map((serviceItem: any) => {
        const service = services.find((s) => s._id === serviceItem.service);
        return {
          ...serviceItem,
          serviceName: service?.serviceName || "Unknown Service",
          service: service
            ? { ...service, serviceName: service.serviceName }
            : serviceItem.service,
        };
      });
    }

    return enriched;
  };

  // ✅ ACTUAL PDF GENERATION FUNCTION
  const generateActualPdf = async (transactionData: any, template?: string) => {
    try {
      const companyDoc = companies.find(
        (c) =>
          c._id === (transactionData.company?._id || transactionData.company)
      );
      const partyDoc = parties.find(
        (p) => p._id === (transactionData.party?._id || transactionData.party)
      );

      if (!companyDoc || !partyDoc) {
        throw new Error("Company or party data not found");
      }

      // Get template from settings or use default
      const token = localStorage.getItem("token");
      const templateRes = await fetch(
        `${baseURL}/api/settings/default-template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const templateData = await templateRes.json();
      const selectedTemplate =
        template || templateData.defaultTemplate || "template1";

      const enrichedTransaction = enrichTransactionWithNames(transactionData);

      // Handle shipping address
      let shippingAddress = null;
      if (transactionData?.shippingAddress) {
        const addr = transactionData.shippingAddress as any;
        if (
          !(addr instanceof Map) &&
          typeof addr === "object" &&
          (addr.address || addr.city || addr.state)
        ) {
          shippingAddress = addr;
        }
      }

      // Generate PDF based on template
      let pdfDoc;
      switch (selectedTemplate) {
        case "template1":
          pdfDoc = await generatePdfForTemplate1(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template2":
          pdfDoc = generatePdfForTemplate2(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress
          );
          break;
        case "template3":
          pdfDoc = await generatePdfForTemplate3(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress
          );
          break;
        case "template4":
          pdfDoc = generatePdfForTemplate4(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress
          );
          break;
        case "template5":
          pdfDoc = generatePdfForTemplate5(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress
          );
          break;
        case "template6":
          pdfDoc = generatePdfForTemplate6(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress
          );
          break;
        case "template7":
          pdfDoc = generatePdfForTemplate7(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress
          );
          break;
        case "template8":
          pdfDoc = await generatePdfForTemplate8(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template11":
          pdfDoc = generatePdfForTemplate11(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            {
              displayCompanyName: companyDoc?.businessName,
              logoUrl: companyDoc?.logo
                ? `${baseURL}${companyDoc.logo}`
                : undefined,
            },
            transactionData.bank
          );
          break;
        case "template12":
          pdfDoc = await generatePdfForTemplate12(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template16":
          pdfDoc = generatePdfForTemplate16(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template17":
          pdfDoc = generatePdfForTemplate17(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template18":
          pdfDoc = await generatePdfForTemplate18(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template19":
          pdfDoc = generatePdfForTemplate19(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template20":
          pdfDoc = await generatePdfForTemplate20(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "template21":
          pdfDoc = await generatePdfForTemplate21(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
          break;
        case "templateA5":
          pdfDoc = await generatePdfForTemplateA5(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank,
            null
          );
          break;
        case "templateA5_2":
          pdfDoc = await generatePdfForTemplateA5_2(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank,
            null
          );
          break;
        case "templateA5_3":
          pdfDoc = await generatePdfForTemplateA5_3(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank,
            null
          );
          break;
        case "templateA5_4":
          pdfDoc = await generatePdfForTemplateA5_4(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank,
            null
          );
          break;
        case "template-t3":
          pdfDoc = await generatePdfForTemplatet3(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            shippingAddress,
            transactionData.bank
          );
          break;
        default:
          pdfDoc = await generatePdfForTemplate1(
            enrichedTransaction,
            companyDoc,
            partyDoc,
            serviceNameById,
            shippingAddress,
            transactionData.bank
          );
      }

      const pdfInstance = await pdfDoc;
      let pdfBlob: Blob;

      if (pdfInstance instanceof Blob) {
        pdfBlob = pdfInstance;
      } else {
        const pdfData = pdfInstance.output("blob");
        pdfBlob = new Blob([pdfData], { type: "application/pdf" });
      }

      return pdfBlob;
    } catch (error) {
      console.error("PDF generation failed:", error);
      throw new Error("Failed to generate PDF");
    }
  };

  // ✅ PDF PREVIEW GENERATION (InvoiceTemplateRenderer ka functionality)
  useEffect(() => {
    const generatePreview = async () => {
      if (!generatedInvoice || !previewOpen) return;

      try {
        setPdfLoading(true);
        const pdfBlob = await generateActualPdf(generatedInvoice);

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setPdfDataUrl(base64 + "#toolbar=0&navpanes=0");
        };
        reader.readAsDataURL(pdfBlob);
      } catch (error) {
        console.error("Preview generation failed:", error);
        toast({
          variant: "destructive",
          title: "Preview Error",
          description: "Failed to generate invoice preview",
        });
      } finally {
        setPdfLoading(false);
      }
    };

    generatePreview();
  }, [generatedInvoice, previewOpen, toast]);

  // ✅ ACTUAL EMAIL LOGIC
  const handleEmailInvoice = async () => {
    if (!generatedInvoice) return;

    try {
      setIsProcessing(true);
      let transactionToUse = generatedInvoice;

      // Save transaction if not already saved
      if (!isTransactionSaved) {
        const result = await onSubmit(form.getValues(), false);
        if (result && result.entry) {
          transactionToUse = result.entry;
        }
      } else {
        transactionToUse = savedTransactionData || generatedInvoice;
      }

      // Generate PDF
      const pdfBlob = await generateActualPdf(transactionToUse);

      // Convert to base64 for email
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });

      const companyDoc = companies.find(
        (c) =>
          c._id === (transactionToUse.company?._id || transactionToUse.company)
      );
      const partyDoc = parties.find(
        (p) => p._id === (transactionToUse.party?._id || transactionToUse.party)
      );

      if (!companyDoc || !partyDoc) {
        throw new Error("Company or party data not found");
      }

      if (!partyDoc.email) {
        toast({
          variant: "destructive",
          title: "No customer email",
          description: "The selected customer does not have an email address.",
        });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const subject = `Invoice From ${
        companyDoc?.businessName ?? "Your Company"
      }`;
      const fileName = `${
        transactionToUse.invoiceNumber ??
        transactionToUse.referenceNumber ??
        "invoice"
      }.pdf`;

      // Build email HTML body
      const buildInvoiceEmailHTML = (opts: any) => {
        const { companyName, partyName, supportEmail, supportPhone } = opts;
        const contactLine = supportEmail
          ? `for any queries, feel free to contact us at <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>${
              supportPhone ? ` or ${supportPhone}` : ""
            }.`
          : `for any queries, feel free to contact us${
              supportPhone ? ` at ${supportPhone}` : ""
            }.`;

        return `
          <table role="presentation" width="100%" style="background:#f5f7fb;padding:24px 12px;margin:0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                  <tr>
                    <td style="background:#111827;color:#fff;padding:16px 24px;">
                      <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:18px;font-weight:700;letter-spacing:.3px;">${companyName}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 24px 8px;">
                      <p style="margin:0 0 12px 0;font-size:16px;color:#111827;">Dear ${partyName},</p>
                      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
                        Thank you for choosing ${companyName}. Please find attached the invoice for your recent purchase.
                        We appreciate your business and look forward to serving you again.
                      </p>
                      <div style="margin:18px 0;padding:14px 16px;border:1px solid #e5e7eb;background:#f9fafb;border-radius:10px;font-size:14px;color:#111827;">
                        Your invoice is attached as a PDF.
                      </div>
                      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
                        ${contactLine}
                      </p>
                      <p style="margin:24px 0 0 0;font-size:14px;color:#111827;">
                        Warm regards,<br>
                        <strong>${companyName}</strong><br>
                        ${
                          supportEmail
                            ? `<a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>`
                            : ``
                        }
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;padding:12px 24px;border-top:1px solid #e5e7eb;">
                      This is an automated message regarding your invoice. Please reply to the address above if you need help.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`;
      };

      const bodyHtml = buildInvoiceEmailHTML({
        companyName: companyDoc?.businessName ?? "Your Company",
        partyName: partyDoc?.name ?? "Customer",
        supportEmail: companyDoc?.emailId ?? "",
        supportPhone: companyDoc?.mobileNumber ?? "",
      });

      const emailRes = await fetch(
        `${baseURL}/api/integrations/gmail/send-invoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: partyDoc.email,
            subject,
            html: bodyHtml,
            fileName,
            pdfBase64,
            companyId: companyDoc._id,
            sendAs: "companyOwner",
          }),
        }
      );

      if (!emailRes.ok) {
        const eData = await emailRes.json().catch(() => ({}));
        throw new Error(eData.message || "Failed to send invoice email.");
      }

      toast({
        title: "Invoice emailed",
        description: `Sent to ${partyDoc.email}`,
      });
    } catch (error) {
      console.error("Email failed:", error);
      toast({
        variant: "destructive",
        title: "Email failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send invoice email",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ ACTUAL DOWNLOAD LOGIC
  const handleDownloadInvoice = async () => {
    if (!generatedInvoice) return;

    try {
      setIsProcessing(true);
      let transactionToUse = generatedInvoice;

      // Save transaction if not already saved
      if (!isTransactionSaved) {
        const result = await onSubmit(form.getValues(), false);
        if (result && result.entry) {
          transactionToUse = result.entry;
        }
      } else {
        transactionToUse = savedTransactionData || generatedInvoice;
      }

      // Generate fresh PDF
      const pdfBlob = await generateActualPdf(transactionToUse);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;

      const invoiceNumber =
        transactionToUse.invoiceNumber || transactionToUse.referenceNumber;
      const fileName = `Invoice-${
        invoiceNumber ||
        (transactionToUse._id ?? "INV").toString().slice(-6).toUpperCase()
      }.pdf`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoiceNumber} saved as ${fileName}`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download invoice",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ ACTUAL PRINT LOGIC
  const handlePrintInvoice = async () => {
    if (!generatedInvoice) return;

    try {
      setIsProcessing(true);
      let transactionToUse = generatedInvoice;

      // Save transaction if not already saved
      if (!isTransactionSaved) {
        const result = await onSubmit(form.getValues(), false);
        if (result && result.entry) {
          transactionToUse = result.entry;
        }
      } else {
        transactionToUse = savedTransactionData || generatedInvoice;
      }

      // Generate PDF
      const pdfBlob = await generateActualPdf(transactionToUse);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Create iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.src = pdfUrl;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          const cleanup = () => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(pdfUrl);
            iframe.contentWindow?.removeEventListener("afterprint", cleanup);
          };

          iframe.contentWindow?.addEventListener("afterprint", cleanup);

          // Fallback cleanup
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(pdfUrl);
            }
          }, 30000);
        }, 1000);
      };

      iframe.onerror = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(pdfUrl);
        toast({
          variant: "destructive",
          title: "Print failed",
          description: "Failed to load PDF for printing",
        });
      };

      toast({
        title: "Printing",
        description: "Invoice sent to printer",
      });
    } catch (error) {
      console.error("Print failed:", error);
      toast({
        variant: "destructive",
        title: "Print failed",
        description: "Failed to generate invoice for printing",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsAppInvoice = () => {
    if (!generatedInvoice) {
      toast({
        variant: "destructive",
        title: "No Invoice Generated",
        description:
          "Please create the transaction first to generate an invoice.",
      });
      return;
    }
    setWhatsappComposerOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    onFormSubmit();
  };

  // ✅ PDF PREVIEW RENDERER (InvoiceTemplateRenderer ka UI)
  const renderPdfPreview = () => {
    if (pdfLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-2 text-gray-600">Generating preview...</p>
        </div>
      );
    }

    if (!pdfDataUrl) {
      return (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Failed to load invoice preview</p>
        </div>
      );
    }

    return (
      <div className="w-full bg-white">
        <iframe
          src={pdfDataUrl}
          className="w-full h-[800px] border-0"
          title="Invoice Preview"
          style={{
            border: "none",
            boxShadow: "none",
            borderRadius: "0",
          }}
        />
      </div>
    );
  };

  return (
    <>
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[800px] lg:max-w-5xl overflow-y-auto p-0 [&>button]:hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 sm:p-6 border-b bg-white dark:bg-gray-800 text-black dark:text-white">
              <SheetTitle className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-base sm:text-lg font-semibold text-black dark:text-white">
                    Invoice Preview
                  </span>
                  {generatedInvoice?.selectedTemplate && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-500 text-white text-xs sm:text-sm dark:text-white"
                    >
                      {generatedInvoice.selectedTemplate}
                    </Badge>
                  )}
                  {generatedInvoice?.invoiceNumber && (
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      Invoice #: {generatedInvoice.invoiceNumber}
                    </Badge>
                  )}
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="hidden sm:flex flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
              {generatedInvoice && (
                <div className="w-full max-w-5xl mx-auto">
                  {renderPdfPreview()}
                </div>
              )}
            </div>

            <div className="sm:hidden flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
              {generatedInvoice && (
                <div className="text-center space-y-6 w-full">
                  <div className="space-y-2">
                    <FileText className="w-16 h-16 text-blue-500 mx-auto" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Invoice Ready
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Your invoice has been generated successfully
                    </p>
                    {generatedInvoice.invoiceNumber && (
                      <p className="text-gray-700 font-medium dark:text-white">
                        Invoice #: {generatedInvoice.invoiceNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 w-full text-center justify-center items-center">
                    <Button
                      onClick={handleWhatsAppInvoice}
                      disabled={isProcessing}
                      className="w-[50%] bg-gradient-to-r from-green-600 to-green-700 text-white py-3 text-base dark:bg-yellow-700, dark:hover:bg-green-800 px-2"
                      size="lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {isProcessing ? "Processing..." : "Whatsapp Invoice"}
                    </Button>

                    <Button
                      onClick={handleDownloadInvoice}
                      disabled={isProcessing}
                      className="w-[50%] bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-3 text-base dark:bg-yellow-700, dark:hover:bg-yellow-800 px-2"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {isProcessing ? "Processing..." : "Download PDF"}
                    </Button>

                    <Button
                      onClick={handleEmailInvoice}
                      disabled={isProcessing}
                      className="w-[50%] bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 text-base dark:bg-orange-700, dark:hover:bg-orange-800"
                      size="lg"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      {isProcessing ? "Processing..." : "Email Invoice"}
                    </Button>

                    <Button
                      onClick={handlePrintInvoice}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-[50%] bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white hover:bg-green-50 py-3 text-base dark:bg-blue-700, dark:hover:bg-blue-800"
                      size="lg"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      {isProcessing ? "Processing..." : "Print Invoice"}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-white">
                    The invoice will open in your device's default PDF viewer
                  </p>
                </div>
              )}
            </div>

            <div className="hidden sm:block border-t bg-white p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center gap-3">
                <Button
                  onClick={handleClosePreview}
                  variant="ghost"
                  className="text-black bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 hover:text-gray-700 p-3 gap-1 dark:text-white"
                  size="lg"
                >
                  <X className="w-5 h-5" />
                  Close
                </Button>

                <div className="flex gap-3">
                  <Button
                    onClick={handleWhatsAppInvoice}
                    disabled={isProcessing}
                    className="w-[50%] bg-gradient-to-r from-green-600 to-green-700 text-white py-3 text-base dark:bg-yellow-700, dark:hover:bg-green-800 px-2"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing..." : "Whatsapp Invoice"}
                  </Button>
                  <Button
                    onClick={handleEmailInvoice}
                    disabled={isProcessing}
                    className="p-3 gap-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white "
                    size="lg"
                  >
                    <Mail className="w-5 h-5 mr-2 text-white" />
                    {isProcessing ? "Processing..." : "Email"}
                  </Button>

                  <Button
                    onClick={handleDownloadInvoice}
                    disabled={isProcessing}
                    variant="outline"
                    className="p-3 gap-1 bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-200 text-white hover:bg-yellow-50 hover:text-yellow-800"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing..." : "Download PDF"}
                  </Button>

                  <Button
                    onClick={handlePrintInvoice}
                    disabled={isProcessing}
                    variant="outline"
                    className="p-3 gap-1 bg-gradient-to-r from-green-600 to-green-700 border-green-200 text-white hover:bg-green-50 hover:text-green-800"
                    size="lg"
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing..." : "Print"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="sm:hidden border-t bg-white p-4 dark:bg-gray-800">
              <Button
                onClick={handleClosePreview}
                variant="ghost"
                className="w-full text-black dark:text-white bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 hover:text-gray-700 p-3 gap-1"
                size="lg"
              >
                <X className="w-5 h-5" />
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <WhatsAppComposerDialog
        isOpen={whatsappComposerOpen}
        onClose={() => setWhatsappComposerOpen(false)}
        transaction={generatedInvoice}
        party={generatedInvoice?.party}
        company={generatedInvoice?.company}
        products={products}
        services={services}
        onGeneratePdf={async (transaction, party, company) => {
          const transactionData = {
            ...transaction,
            company: company,
            party: party,
          };
          return await generateActualPdf(transactionData);
        }}
        serviceNameById={serviceNameById}
        className="z-[100]"
      />
    </>
  );
}
