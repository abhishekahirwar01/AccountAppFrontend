// @/components/settings/template-settings.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye, Check, Laptop, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate8 } from "@/lib/pdf-template8";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import { generatePdfForTemplate18 } from "@/lib/pdf-template18";
import { generatePdfForTemplate19 } from "@/lib/pdf-template19";
import { generatePdfForTemplate20 } from "@/lib/pdf-template20";
import { generatePdfForTemplate21 } from "@/lib/pdf-template21";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_2 } from "@/lib/pdf-templateA3-2";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplateA5_5 } from "@/lib/pdf-templateA5-5";
import jsPDF from "jspdf";
import type { Company, Party, Transaction } from "@/lib/types";

const templateOptions: {
  value: TemplateKey;
  label: string;
  color: string;
  paperSize: string;
}[] = [
  {
    value: "template1",
    label: "Template 1",
    color: "bg-blue-500",
    paperSize: "A4",
  },
  {
    value: "template8",
    label: "Template 2",
    color: "bg-purple-500",
    paperSize: "A4",
  },
  {
    value: "template11",
    label: "Template 3",
    color: "bg-gray-800",
    paperSize: "A4",
  },
  {
    value: "template12",
    label: "Template 4",
    color: "bg-green-500",
    paperSize: "A4",
  },
  {
    value: "template16",
    label: "Template 5",
    color: "bg-amber-600",
    paperSize: "A4",
  },
  {
    value: "template17",
    label: "Template 6",
    color: "bg-indigo-600",
    paperSize: "A4",
  },
  {
    value: "template19",
    label: "Template 7",
    color: "bg-teal-600",
    paperSize: "A4",
  },
  {
    value: "template20",
    label: "Template 8",
    color: "bg-indigo-600",
    paperSize: "A4",
  },
  {
    value: "template21",
    label: "Template 9",
    color: "bg-teal-600",
    paperSize: "A4",
  },
  {
    value: "templateA5",
    label: "Template A5",
    color: "bg-pink-500",
    paperSize: "A5 Landscape",
  },
  {
    value: "templateA5_2",
    label: "Template A5-2",
    color: "bg-green-500",
    paperSize: "A5",
  },
  {
    value: "templateA5_3",
    label: "Template A5-3",
    color: "bg-orange-500",
    paperSize: "A5",
  },
  {
    value: "templateA5_4",
    label: "Template A5-4",
    color: "bg-cyan-500",
    paperSize: "A5 Landscape",
  },
   {
    value: "templateA5_5",
    label: "Template A5-5",
    color: "bg-cyan-500",
    paperSize: "A5 Landscape",
  },
  {
    value: "template-t3",
    label: "Template T3",
    color: "bg-lime-500",
    paperSize: "Thermal Invoice",
  },
  {
    value: "template18",
    label: "Template T3-2",
    color: "bg-rose-500",
    paperSize: "Thermal Invoice",
  },
];

// Dummy data for preview
const dummyCompany: Company = {
  _id: "company1",
  registrationNumber: "REG123456",
  businessName: "Your Company Inc.",
  businessType: "Private Limited",
  address: "123 Business St",
  mobileNumber: "1234567890",
  gstin: "GSTIN123456789",
};

const dummyParty: Party = {
  _id: "party1",
  name: "Client Name",
  type: "party",
  createdByClient: "client1",
  email: "client@example.com",
  address: "123 Client Street",
  city: "Client City",
  state: "Client State",
  gstin: "GSTIN987654321",
  phone: undefined,
};

const dummyTransaction: Transaction = {
  _id: "trans1",
  date: new Date(),
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
  invoiceNumber: "INV-2023-001",
  items: [
    {
      id: "1",
      name: "Web Development",
      quantity: 1,
      price: 1200,
      taxRate: 18,
    },
    {
      id: "2",
      name: "UI/UX Design",
      quantity: 1,
      price: 800,
      taxRate: 18,
    },
    {
      id: "3",
      name: "Consultation",
      quantity: 2,
      price: 100,
      taxRate: 18,
    },
  ],
  type: "sales" as const,
  amount: 2496,
  fromState: undefined,
  toState: undefined,
  services: undefined,
  products: undefined,
  invoiceTotal: undefined,
  taxAmount: 0,
  isExpense: false,
  expense: undefined,
};

const dummyServiceNames = new Map([
  ["service1", "Web Development"],
  ["service2", "UI/UX Design"],
  ["service3", "Consultation"],
]);

const dummyBank = {
  _id: "bank1",
  client: "client1",
  user: "user1",
  company: "company1",
  bankName: "Sample Bank",
  managerName: "John Manager",
  contactNumber: "9876543210",
  email: "manager@samplebank.com",
  city: "Mumbai",
  ifscCode: "SBIN0001234",
  branchAddress: "Main Branch, Mumbai",
  accountNumber: "1234567890",
  upiId: "sample@upi",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  __v: 0,
} as any;

const dummyClient = {
  _id: "client1",
  clientUsername: "johndoe",
  contactName: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  role: "admin",
  createdAt: new Date().toISOString(),
  companyName: "Sample Company",
  subscriptionPlan: "Premium" as const,
  status: "Active" as const,
  revenue: 100000,
  users: 5,
  companies: 2,
  totalSales: 50000,
  totalPurchases: 30000,
  maxCompanies: 5,
  maxUsers: 10,
  maxInventories: 1000,
  canSendInvoiceEmail: true,
  canSendInvoiceWhatsapp: true,
  canCreateProducts: true,
  canCreateCustomers: true,
  canCreateVendors: true,
  canCreateCompanies: true,
  canCreateInventory: true,
  canUpdateCompanies: true,
  slug: "sample-client",
} as any;

const thermalCompany = { ...dummyCompany, businessName: "Thermal Receipt Co." };

type TemplateKey =
  | "template1"
  | "template8"
  | "template11"
  | "template12"
  | "template16"
  | "template17"
  | "template19"
  | "template20"
  | "template21"
  | "templateA5"
  | "templateA5_2"
  | "templateA5_3"
  | "templateA5_4"
  | "templateA5_5"
  | "template-t3"
  | "template18";

// Thumbnail cache to prevent regeneration
const thumbnailCache = new Map<TemplateKey, string>();

// Thumbnail component
const TemplateThumbnail = React.memo(
  ({
    template,
    isSelected,
    onClick,
    isGenerating,
  }: {
    template: {
      value: TemplateKey;
      label: string;
      color: string;
      paperSize: string;
    };
    isSelected: boolean;
    onClick: () => void;
    isGenerating: boolean;
  }) => {
    const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const generateThumbnail = async () => {
        // Check cache first
        if (thumbnailCache.has(template.value)) {
          setThumbnailUrl(thumbnailCache.get(template.value)!);
          setIsLoading(false);
          return;
        }

        try {
          const simplifiedTransaction = {
            ...dummyTransaction,
            items: dummyTransaction.items ? [dummyTransaction.items[0]] : [],
          };

          let pdfBlob: Blob;

          // Templates that use react-pdf (return Blob directly)
          if (
            template.value === "template1" ||
            template.value === "template8" ||
            template.value === "template12" ||
            template.value === "templateA5" ||
            template.value === "template18" ||
            template.value === "template20" ||
            template.value === "template21" ||
            template.value === "templateA5_2" ||
            template.value === "templateA5_3" ||
            template.value === "templateA5_4" ||
            template.value === "templateA5_5" ||
            template.value === "template-t3"
          ) {
            switch (template.value) {
              case "template1":
                pdfBlob = await generatePdfForTemplate1(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                );
                break;
              case "template8":
                pdfBlob = await generatePdfForTemplate8(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                );
                break;
              case "template12":
                pdfBlob = await generatePdfForTemplate12(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                );
                break;
              case "template20":
                pdfBlob = await generatePdfForTemplate20(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                );
                break;
              case "template21":
                pdfBlob = await generatePdfForTemplate21(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                );
                break;
              case "templateA5":
                pdfBlob = await generatePdfForTemplateA5(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank,
                  dummyClient
                );
                break;
              case "templateA5_2":
                pdfBlob = await generatePdfForTemplateA5_2(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank,
                  dummyClient
                );
                break;
              case "templateA5_3":
                pdfBlob = await generatePdfForTemplateA5_3(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank,
                  dummyClient
                );
                break;
              case "templateA5_4":
                pdfBlob = await generatePdfForTemplateA5_4(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank,
                  dummyClient
                );
                break;
                 case "templateA5_5":
                pdfBlob = await generatePdfForTemplateA5_5(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank,
                  dummyClient
                );
                break;
              case "template-t3":
                pdfBlob = await generatePdfForTemplatet3(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  null,
                  dummyBank
                );
                break;
              case "template18":
                pdfBlob = await generatePdfForTemplate18(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyBank
                );
                break;
              default:
                pdfBlob = await generatePdfForTemplate1(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                );
            }
          } else {
            // Templates that use jsPDF
            let docPromise: Promise<jsPDF>;

            switch (template.value) {
              case "template11":
                docPromise = Promise.resolve(
                  generatePdfForTemplate11(
                    simplifiedTransaction,
                    dummyCompany,
                    dummyParty,
                    dummyServiceNames,
                    null,
                    undefined,
                    dummyBank
                  )
                );
                break;
              case "template16":
                docPromise = Promise.resolve(
                  generatePdfForTemplate16(
                    simplifiedTransaction,
                    dummyCompany,
                    dummyParty,
                    dummyServiceNames,
                    null
                  )
                );
                break;
              case "template17":
                docPromise = Promise.resolve(
                  generatePdfForTemplate17(
                    simplifiedTransaction,
                    dummyCompany,
                    dummyParty,
                    dummyServiceNames,
                    null,
                    dummyBank
                  )
                );
                break;
              case "template19":
                docPromise = Promise.resolve(
                  generatePdfForTemplate19(
                    simplifiedTransaction,
                    dummyCompany,
                    dummyParty,
                    dummyServiceNames,
                    null,
                    dummyBank
                  )
                );
                break;
              default:
                docPromise = generatePdfForTemplate3(
                  simplifiedTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null
                );
            }

            const doc = await docPromise;
            pdfBlob = doc.output("blob");
          }

          const url = URL.createObjectURL(pdfBlob);
          thumbnailCache.set(template.value, url);
          setThumbnailUrl(url);
        } catch (error) {
          console.error(
            `Failed to generate thumbnail for ${template.label}:`,
            error
          );
        } finally {
          setIsLoading(false);
        }
      };

      generateThumbnail();

      return () => {
        // Don't revoke URL immediately as it's cached
      };
    }, [template.value]);

    return (
      <div
        className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all group ${
          isSelected
            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
            : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30"
        } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={isGenerating ? undefined : onClick}
      >
        {/* Full clickable overlay */}
        <div
          className="absolute inset-0 z-10"
          onClick={isGenerating ? undefined : onClick}
        />

        <div className="space-y-3 relative z-0">
          {/* PDF Thumbnail Preview */}
          <div className="aspect-[3/4]  rounded-md overflow-hidden border shadow-sm items-center justify-center">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
            ) : thumbnailUrl ? (
              <iframe
                src={thumbnailUrl}
                className="w-full h-full transform pointer-events-none" // Disable iframe clicks
                title={`${template.label} preview`}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                <span className="text-xs">Preview unavailable</span>
              </div>
            )}
          </div>

          {/* Template Label */}
          <div className="flex items-center justify-between min-h-[2rem] flex-wrap">
            <div className="flex-1 mr-2 flex flex-row gap-2 align-middle text-center items-center">
              <span className="text-sm font-medium truncate block">
                {template.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {template.paperSize}
              </span>
            </div>
            {isSelected && (
              <Badge
                variant="default"
                className="text-[10px] px-2 py-0.5 shrink-0 mt-1"
              >
                <Check className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TemplateThumbnail.displayName = "TemplateThumbnail";

export function TemplateSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateKey>("template1");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(true);
  const [fetchedTemplate, setFetchedTemplate] =
    React.useState<TemplateKey>("template1");
  const { toast } = useToast();

  // Load template setting
  React.useEffect(() => {
    const loadTemplateSetting = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${baseURL}/api/settings/default-template`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const template = data.defaultTemplate || "template1";
          setSelectedTemplate(template as TemplateKey);
          setFetchedTemplate(template as TemplateKey);
        } else if (response.status === 404) {
          setSelectedTemplate("template1");
          setFetchedTemplate("template1");
        } else {
          throw new Error("Failed to fetch template");
        }
      } catch (error) {
        console.error("Failed to load template setting:", error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateSetting();
  }, [toast, baseURL]);

  // Generate main PDF preview when template changes
  React.useEffect(() => {
    let objectUrl: string | null = null;

    const generatePdfPreview = async () => {
      setIsGeneratingPreview(true);
      try {
        let pdfBlob: Blob;

        // Templates that use react-pdf (return Blob directly)
        if (
          selectedTemplate === "template1" ||
          selectedTemplate === "template8" ||
          selectedTemplate === "template12" ||
          selectedTemplate === "templateA5" ||
          selectedTemplate === "template18" ||
          selectedTemplate === "template20" ||
          selectedTemplate === "template21" ||
          selectedTemplate === "templateA5_2" ||
          selectedTemplate === "templateA5_3" ||
          selectedTemplate === "templateA5_4" ||
          selectedTemplate === "templateA5_5" ||
          selectedTemplate === "template-t3"
        ) {
          switch (selectedTemplate) {
            case "template1":
              pdfBlob = await generatePdfForTemplate1(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
              break;
            case "template8":
              pdfBlob = await generatePdfForTemplate8(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
              break;
            case "template12":
              pdfBlob = await generatePdfForTemplate12(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
              break;
            case "template20":
              pdfBlob = await generatePdfForTemplate20(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
              break;
            case "template21":
              pdfBlob = await generatePdfForTemplate21(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
              break;
            case "templateA5":
              pdfBlob = await generatePdfForTemplateA5(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank,
                dummyClient
              );
              break;
            case "template18":
              pdfBlob = await generatePdfForTemplate18(
                dummyTransaction,
                thermalCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
              break;
            case "templateA5_2":
              pdfBlob = await generatePdfForTemplateA5_2(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank,
                dummyClient
              );
              break;
            case "templateA5_3":
              pdfBlob = await generatePdfForTemplateA5_3(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank,
                dummyClient
              );
              break;
            case "templateA5_4":
              pdfBlob = await generatePdfForTemplateA5_4(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank,
                dummyClient
              );
              break;

              case "templateA5_5":
              pdfBlob = await generatePdfForTemplateA5_5(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank,
                dummyClient
              );
              break;
            case "template-t3":
              pdfBlob = await generatePdfForTemplatet3(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                null,
                dummyBank
              );
              break;
            default:
              pdfBlob = await generatePdfForTemplate1(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null,
                dummyBank
              );
          }
        } else {
          // Templates that use jsPDF
          let docPromise: Promise<jsPDF>;

          switch (selectedTemplate) {
            case "template11":
              docPromise = Promise.resolve(
                generatePdfForTemplate11(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  undefined,
                  dummyBank
                )
              );
              break;
            case "template16":
              docPromise = Promise.resolve(
                generatePdfForTemplate16(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null
                )
              );
              break;
            case "template17":
              docPromise = Promise.resolve(
                generatePdfForTemplate17(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                )
              );
              break;
            case "template19":
              docPromise = Promise.resolve(
                generatePdfForTemplate19(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null,
                  dummyBank
                )
              );
              break;
            default:
              docPromise = generatePdfForTemplate3(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null
              );
          }

          const doc = await docPromise;
          pdfBlob = doc.output("blob");
        }

        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("Failed to generate preview:", err);
        setPdfUrl(null);
        toast({
          title: "Error",
          description: "Failed to generate template preview",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    generatePdfPreview();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedTemplate, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseURL}/api/settings/default-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultTemplate: selectedTemplate }),
      });

      if (response.ok) {
        setFetchedTemplate(selectedTemplate);
        toast({
          title: "Success",
          description: "Default template updated successfully",
        });
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      toast({
        title: "Error",
        description: "Failed to save template setting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateChange = (value: TemplateKey) => {
    setSelectedTemplate(value);
  };

  const getCurrentTemplate = () => {
    return (
      templateOptions.find((template) => template.value === selectedTemplate) ||
      templateOptions[0]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentTemplate = getCurrentTemplate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="flex justify-between items-center">
          <CardHeader className="flex-4">
          <CardTitle>Default Template</CardTitle>
          <CardDescription>
            Choose your preferred invoice template
          </CardDescription>
        </CardHeader>
        <Button onClick={handleSave} disabled={isSaving} className="w-full flex-1">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Template
              </>
            )}
        </Button>
        </div>
        <CardContent className="space-y-6">
          {/* Display current template from DB */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Template:</span>
                <Badge variant="secondary" className="capitalize">
                  {templateOptions.find((t) => t.value === fetchedTemplate)
                    ?.label || "Not set"}
                </Badge>
              </div>
              <Check className="h-4 w-4 text-green-500" />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Select Default Template</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {templateOptions.map((template) => (
                <TemplateThumbnail
                  key={template.value}
                  template={template}
                  isSelected={selectedTemplate === template.value}
                  onClick={() => handleTemplateChange(template.value)}
                  isGenerating={
                    isGeneratingPreview && selectedTemplate === template.value
                  }
                />
              ))}
            </div>
          </div>

          
        </CardContent>
      </Card>

      {/* Desktop Preview */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Current Template Preview
            </CardTitle>
            <CardDescription>
              This is how your invoices will appear to clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-md ${currentTemplate.color} flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-xs">INV</span>
                </div>
                <div>
                  <h3 className="font-semibold">{currentTemplate.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Selected as default
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Active
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden bg-secondary h-[100vh]">
              {isGeneratingPreview ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="ml-3">Generating Preview...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p>Could not generate template preview.</p>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                This preview shows how your invoices will look with the{" "}
                <strong>{currentTemplate.label}</strong> template.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Preview */}
      <div className="md:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Current Template Preview
            </CardTitle>
            <CardDescription>
              This is how your invoices will appear to clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-md ${currentTemplate.color} flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-xs">INV</span>
                </div>
                <div>
                  <h3 className="font-semibold">{currentTemplate.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Selected as default
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Active
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden bg-secondary h-64">
              {isGeneratingPreview ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="ml-2 text-sm">Generating Preview...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-sm">
                    Could not generate template preview.
                  </p>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                This preview shows how your invoices will look with the{" "}
                <strong>{currentTemplate.label}</strong> template.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
