"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Loader2,
  PlusCircle,
  Trash2,
  Copy,
  Pencil,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
// import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useFormFocus } from "@/hooks/useFormFocus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import type {
  Company,
  Party,
  Product,
  Vendor,
  Transaction,
  Item,
  Service,
} from "@/lib/types";

import React, { useState, useEffect } from "react";
import { Combobox } from "../ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { VendorForm } from "../vendors/vendor-form";
import { CustomerForm } from "../customers/customer-form";
import { useCompany } from "@/contexts/company-context";
import { ProductForm } from "../products/product-form";
import { ServiceForm } from "../services/service-form";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { useUserPermissions } from "@/contexts/user-permissions-context";
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
import { getUnifiedLines } from "@/lib/getUnifiedLines";
import { Badge } from "@/components/ui/badge";
import QuillEditor from "@/components/ui/quill-editor";
import axios from "axios";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { State, City } from "country-state-city";
import { searchHSNCodes, type HSNCode } from "@/lib/hsnProduct";
import { searchSACCodes, type SACCode } from "@/lib/sacService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Mail, Download, Printer, MessageCircle } from "lucide-react";
import { WhatsAppComposerDialog } from "./whatsapp-composer-dialog";

// HSN Search Input Component
function HSNSearchInput({
  onSelect,
  placeholder,
}: {
  onSelect: (hsn: HSNCode) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<HSNCode[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchHSNCodes(inputValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("HSN search error:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (hsn: HSNCode) => {
    setInputValue(hsn.code);
    setShowSuggestions(false);
    onSelect(hsn);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          if (inputValue.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((hsn) => (
            <div
              key={hsn.code}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors"
              onClick={() => handleSelect(hsn)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {hsn.code}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  HSN
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {hsn.description}
              </div>
            </div>
          ))}
        </div>
      )}
      {showSuggestions &&
        inputValue.length >= 2 &&
        suggestions.length === 0 &&
        !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No matching HSN codes found.
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
              Please check the code or enter manually.
            </div>
          </div>
        )}
    </div>
  );
}

// SAC Search Input Component
function SACSearchInput({
  onSelect,
  placeholder,
}: {
  onSelect: (sac: SACCode) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<SACCode[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchSACCodes(inputValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("SAC search error:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (sac: SACCode) => {
    setInputValue(sac.code);
    setShowSuggestions(false);
    onSelect(sac);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          if (inputValue.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((sac) => (
            <div
              key={sac.code}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors"
              onClick={() => handleSelect(sac)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="flex justify-between items-start">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {sac.code}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  SAC
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {sac.description}
              </div>
            </div>
          ))}
        </div>
      )}
      {showSuggestions &&
        inputValue.length >= 2 &&
        suggestions.length === 0 &&
        !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No matching SAC codes found.
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
              Please check the code or enter manually.
            </div>
          </div>
        )}
    </div>
  );
}

// reads gstin from various possible shapes/keys
const getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
  const x = c as any;
  return (
    x?.gstin ??
    x?.gstIn ??
    x?.gstNumber ??
    x?.gst_no ??
    x?.gst ??
    x?.gstinNumber ??
    x?.tax?.gstin ??
    null
  );
};

const unitTypes = [
  "Kg",
  "Litre",
  "Piece",
  "Box",
  "Meter",
  "Dozen",
  "Pack",
  "Other",
] as const;

type UnitType = (typeof unitTypes)[number] | string;
const STANDARD_GST = 18; // default "Standard"
const GST_OPTIONS = [
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "Standard (18%)", value: "18" },
  { label: "40%", value: "40" },
  { label: "Custom", value: "custom" },
] as const;

type StockItemInput = { product: string; quantity: number };

interface BankDetail {
  _id: string;
  client: string;
  company: string | Company; // Can be string ID or Company object
  bankName: string;
  managerName: string;
  contactNumber: string;
  email?: string;
  city: string;
  ifscCode?: string;
  branchAddress?: string;
}

const PRODUCT_DEFAULT = {
  itemType: "product" as const,
  product: "",
  quantity: 1,
  pricePerUnit: 0,
  unitType: "Piece",
  otherUnit: "",
  amount: 0,
  gstPercentage: STANDARD_GST, // NEW
  lineTax: 0, // NEW
  lineTotal: 0,
};

const itemSchema = z
  .object({
    itemType: z.enum(["product", "service"]),
    product: z.string().optional(),
    service: z.string().optional(),
    quantity: z.coerce.number().optional(),
    unitType: z.string().optional(),
    otherUnit: z.string().optional(),
    pricePerUnit: z.coerce.number().optional(),
    description: z.string().optional(),
    amount: z.coerce.number(),
    gstPercentage: z.coerce.number().min(0).max(100).optional(),
    lineTax: z.coerce.number().min(0).optional(),
    lineTotal: z.coerce.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    // Custom validations for products
    if (data.itemType === "product") {
      if (!data.product) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["product"],
          message: "Select a product",
        });
      }
      if (!data.quantity || data.quantity <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity must be > 0",
        });
      }
      if (data.pricePerUnit == null || data.pricePerUnit < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pricePerUnit"],
          message: "Price/Unit must be ≥ 0",
        });
      }
      // NEW: Validation for otherUnit
      if (data.unitType === "Other" && !data.otherUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["otherUnit"],
          message: "Please specify the unit type",
        });
      }
    }
  });

const formSchema = z
  .object({
    type: z.enum([
      "sales",
      "purchases",
      "receipt",
      "payment",
      "journal",
      "proforma",
    ]),
    company: z.string().min(1, "Please select a company."),
    party: z.string().optional(),
    expense: z.string().optional(),
    isExpense: z.boolean().optional(),
    date: z.date({ required_error: "A date is required." }),
    dueDate: z.date().optional(),
    items: z.array(itemSchema).optional(),
    totalAmount: z.coerce
      .number()
      .positive("Amount must be a positive number.")
      .optional(), // Main amount for non-item transactions
    description: z.string().optional(),
    customPaymentMethod: z.string().optional(),
    referenceNumber: z.string().optional(),
    fromAccount: z.string().optional(), // For Journal Debit
    toAccount: z.string().optional(), // For Journal Credit
    narration: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentMethodsForReceipt: z.string().optional(),
    taxAmount: z.coerce.number().min(0).optional(), // <-- NEW (derived)
    invoiceTotal: z.coerce.number().min(0).optional(),
    subTotal: z.coerce.number().min(0).optional(),
    dontSendInvoice: z.boolean().optional(),
    bank: z.string().optional(),
    notes: z.string().optional(),
    // Shipping address fields
    sameAsBilling: z.boolean().optional(),
    shippingAddress: z.string().optional(),
    shippingAddressDetails: z
      .object({
        label: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        contactNumber: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (["sales", "purchases", "receipt"].includes(data.type)) {
        return !!data.party;
      }
      if (data.type === "payment" && !data.isExpense) {
        return !!data.party;
      }
      return true;
    },
    {
      message: "This field is required for this transaction type.",
      path: ["party"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "payment" && data.isExpense) {
        return !!data.expense;
      }
      return true;
    },
    {
      message: "This field is required for this transaction type.",
      path: ["expense"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "sales" || data.type === "purchases") {
        return data.items && data.items.length > 0;
      }
      return true;
    },
    {
      message: "At least one item is required for a sale or purchase.",
      path: ["items"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "journal") {
        return !!data.fromAccount && !!data.toAccount;
      }
      return true;
    },
    {
      message: "Debit and Credit accounts are required for a journal entry.",
      path: ["fromAccount"], // Report error on one of the fields
    }
  )
  .refine(
    (data) => {
      if (["sales", "purchases", "receipt", "payment"].includes(data.type)) {
        return !!data.paymentMethod;
      }
      return true;
    },
    {
      message: "Payment method is required for this transaction type.",
      path: ["paymentMethod"],
    }
  );

interface TransactionFormProps {
  transactionToEdit?: Transaction | null;
  onFormSubmit: () => void;
  defaultType?: "sales" | "purchases" | "receipt" | "payment" | "journal"; // Add this
  serviceNameById: Map<string, string>;
  transaction: any;
  party: any;
  company: any;
  prefillFrom?: Transaction | null; // Add this for pre-filling from proforma
}

export function TransactionForm({
  transactionToEdit,
  onFormSubmit,
  defaultType = "sales",
  serviceNameById,
  transaction,
  party,
  company,
  prefillFrom,
}: TransactionFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPartyDialogOpen, setIsPartyDialogOpen] = React.useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [newEntityName, setNewEntityName] = React.useState("");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [partyBalance, setPartyBalance] = React.useState<number | null>(null); // For receipt transactions
  const [vendorBalance, setVendorBalance] = React.useState<number | null>(null); // For payment transactions
  const [banks, setBanks] = React.useState<any[]>([]);
  const [paymentExpenses, setPaymentExpenses] = React.useState<any[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [newExpenseName, setNewExpenseName] = React.useState("");

  const [partyBalances, setPartyBalances] = React.useState<
    Record<string, number>
  >({});

  // which line (items[index]) is creating a product/service right now?
  const [creatingProductForIndex, setCreatingProductForIndex] = React.useState<
    number | null
  >(null);
  const [creatingServiceForIndex, setCreatingServiceForIndex] = React.useState<
    number | null
  >(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [showNotes, setShowNotes] = React.useState(false);
  const paymentMethods = [
    "Cash",
    "Credit",
    "UPI",
    "Bank Transfer",
    "Cheque",
    "Others",
  ];
  const paymentMethodsForReceipt = ["Cash", "UPI", "Bank Transfer", "Cheque"];
  const [existingUnits, setExistingUnits] = React.useState<any[]>([]);
  const [unitOpen, setUnitOpen] = React.useState(false);
  const [originalQuantities, setOriginalQuantities] = React.useState<
    Map<string, number>
  >(new Map());

  // Shipping address states
  const [shippingAddresses, setShippingAddresses] = React.useState<any[]>([]);
  const [isShippingAddressDialogOpen, setIsShippingAddressDialogOpen] =
    React.useState(false);
  const [selectedShippingAddress, setSelectedShippingAddress] =
    React.useState<any>(null);
  const [isEditShippingAddressDialogOpen, setIsEditShippingAddressDialogOpen] =
    React.useState(false);
  const [editingShippingAddress, setEditingShippingAddress] =
    React.useState<any>(null);
  const [editAddressForm, setEditAddressForm] = React.useState({
    label: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
  });
  // State for custom GST input
  const [customGstInputs, setCustomGstInputs] = React.useState<
    Record<number, boolean>
  >({});
  const [invoicePreviewOpen, setInvoicePreviewOpen] = React.useState(false);
  const [generatedInvoice, setGeneratedInvoice] = React.useState<any>(null);
  const [isTransactionSaved, setIsTransactionSaved] = React.useState(false);
  const [savedTransactionData, setSavedTransactionData] =
    React.useState<any>(null);

  const [serviceCreationModal, setServiceCreationModal] = useState({
    open: false,
    name: "",
    index: null as number | null,
    amount: 0,
  });

  // Track last edited field per item index for calculation logic
  const [lastEditedField, setLastEditedField] = React.useState<
    Record<number, "quantity" | "pricePerUnit" | "amount" | "lineTotal">
  >({});

  const [forceUpdate, setForceUpdate] = React.useState(0);

  const [whatsappComposerOpen, setWhatsappComposerOpen] = useState(false);
  const [itemRenderKeys, setItemRenderKeys] = React.useState<{
    [key: number]: number;
  }>({});

  const { selectedCompanyId } = useCompany();
  const { permissions: userCaps } = useUserPermissions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // <— add this
    reValidateMode: "onChange", // <— and this
    defaultValues: React.useMemo(() => {
      // If prefillFrom is provided (e.g., from proforma), use its data
      if (prefillFrom) {
        // Combine products and services from proforma, similar to transactionToEdit logic
        let prefillItems: any[] = [];

        // 1) New unified shape already on the doc
        if (
          Array.isArray((prefillFrom as any).items) &&
          (prefillFrom as any).items.length
        ) {
          prefillItems = (prefillFrom as any).items.map((item: any) => ({
            itemType: item.itemType || (item.product ? "product" : "service"),
            product: item.product?._id || item.product || "",
            service: item.service?._id || item.service || "",
            quantity: item.quantity || 1,
            unitType: item.unitType || "Piece",
            otherUnit: item.otherUnit || "",
            pricePerUnit: item.pricePerUnit || 0,
            amount: item.amount || 0,
            gstPercentage: item.gstPercentage || 18,
            lineTax: item.lineTax || 0,
            lineTotal: item.lineTotal || item.amount || 0,
            description: item.description || "",
          }));
        } else {
          // 2) Legacy/new arrays - combine both products and services
          const prodArr = Array.isArray((prefillFrom as any).products)
            ? (prefillFrom as any).products.map((p: any) => ({
                itemType: "product" as const,
                product: p.product?._id || p.product || "",
                service: "",
                quantity: p.quantity || 1,
                unitType: p.unitType || "Piece",
                otherUnit: p.otherUnit || "",
                pricePerUnit: p.pricePerUnit || 0,
                amount: p.amount || 0,
                gstPercentage: p.gstPercentage || 18,
                lineTax: p.lineTax || 0,
                lineTotal: p.lineTotal || p.amount || 0,
                description: p.description || "",
              }))
            : [];

          const svcArr = Array.isArray((prefillFrom as any).services)
            ? (prefillFrom as any).services.map((s: any) => ({
                itemType: "service" as const,
                product: "",
                service: s.service?._id || s.service || "",
                quantity: undefined, // services don't have quantity
                unitType: undefined,
                otherUnit: undefined,
                pricePerUnit: undefined,
                amount: s.amount || 0,
                gstPercentage: s.gstPercentage || 18,
                lineTax: s.lineTax || 0,
                lineTotal: s.lineTotal || s.amount || 0,
                description: s.description || "",
              }))
            : [];

          prefillItems = [...prodArr, ...svcArr];
        }

        const normalizedItems =
          prefillItems.length > 0 ? prefillItems : [PRODUCT_DEFAULT];

        return {
          party:
            typeof prefillFrom.party === "object" && prefillFrom.party?._id
              ? prefillFrom.party._id
              : typeof prefillFrom.party === "string"
              ? prefillFrom.party
              : "",
          expense: "",
          isExpense: false,
          description: prefillFrom.description || "",
          totalAmount: prefillFrom.totalAmount || 0,
          items: normalizedItems,
          type: "sales", // Force to sales when converting from proforma
          referenceNumber: "",
          fromAccount: "",
          toAccount: "",
          narration: "",
          company:
            typeof prefillFrom.company === "object" && prefillFrom.company?._id
              ? prefillFrom.company._id
              : typeof prefillFrom.company === "string"
              ? prefillFrom.company
              : selectedCompanyId || "",
          date: new Date(),
          taxAmount: prefillFrom.taxAmount || 0,
          invoiceTotal:
            prefillFrom.invoiceTotal || prefillFrom.totalAmount || 0,
          notes: "",
          sameAsBilling: true,
          shippingAddress:
            prefillFrom.shippingAddress &&
            typeof prefillFrom.shippingAddress === "object"
              ? prefillFrom.shippingAddress._id || ""
              : prefillFrom.shippingAddress || "",
          shippingAddressDetails:
            prefillFrom.shippingAddress &&
            typeof prefillFrom.shippingAddress === "object"
              ? {
                  label: prefillFrom.shippingAddress.label || "",
                  address: prefillFrom.shippingAddress.address || "",
                  city: prefillFrom.shippingAddress.city || "",
                  state: prefillFrom.shippingAddress.state || "",
                  pincode: prefillFrom.shippingAddress.pincode || "",
                  contactNumber:
                    prefillFrom.shippingAddress.contactNumber || "",
                }
              : {
                  label: "",
                  address: "",
                  city: "",
                  state: "",
                  pincode: "",
                  contactNumber: "",
                },
        };
      }

      // Default values for new transactions
      return {
        party: "",
        expense: "",
        isExpense: false,
        description: "",
        totalAmount: 0,
        items: [PRODUCT_DEFAULT],
        type: defaultType,
        referenceNumber: "",
        fromAccount: "",
        toAccount: "",
        narration: "",
        company: selectedCompanyId || "",
        date: new Date(),
        taxAmount: 0,
        invoiceTotal: 0,
        notes: "",
        sameAsBilling: true,
        shippingAddress: "",
        shippingAddressDetails: {
          label: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          contactNumber: "",
        },
      };
    }, [prefillFrom, defaultType, selectedCompanyId]),
  });

  // Shipping address state and city dropdowns
  const indiaStates = React.useMemo(() => State.getStatesOfCountry("IN"), []);
  const [shippingStateCode, setShippingStateCode] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    const currentStateName = form
      .getValues("shippingAddressDetails.state")
      ?.trim();
    if (!currentStateName) {
      setShippingStateCode(null);
      return;
    }
    const found = indiaStates.find(
      (s) => s.name.toLowerCase() === currentStateName.toLowerCase()
    );
    setShippingStateCode(found?.isoCode || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update shippingStateCode when edit dialog opens
  React.useEffect(() => {
    if (isEditShippingAddressDialogOpen && editAddressForm.state) {
      const found = indiaStates.find(
        (s) => s.name.toLowerCase() === editAddressForm.state.toLowerCase()
      );
      setShippingStateCode(found?.isoCode || null);
    }
  }, [isEditShippingAddressDialogOpen, editAddressForm.state, indiaStates]);

  const shippingStateOptions = React.useMemo(
    () =>
      indiaStates
        .map((s) => ({ value: s.isoCode, label: s.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [indiaStates]
  );

  const shippingCityOptions = React.useMemo(() => {
    if (!shippingStateCode) return [];
    const list = City.getCitiesOfState("IN", shippingStateCode);
    return list
      .map((c) => ({ value: c.name, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [shippingStateCode]);

  // which company is currently selected?
  const selectedCompanyIdWatch = useWatch({
    control: form.control,
    name: "company",
  });

  const selectedCompany = React.useMemo(
    () => companies.find((c) => c._id === selectedCompanyIdWatch),
    [companies, selectedCompanyIdWatch]
  );

  const companyGSTIN = React.useMemo(
    () => getCompanyGSTIN(selectedCompany),
    [selectedCompany]
  );

  const gstEnabled = !!(companyGSTIN && String(companyGSTIN).trim());

  const role = localStorage.getItem("role");
  const isSuper = role === "master" || role === "customer";

  const canSales = isSuper || !!userCaps?.canCreateSaleEntries;
  const canPurchases = isSuper || !!userCaps?.canCreatePurchaseEntries;
  const canReceipt = isSuper || !!userCaps?.canCreateReceiptEntries;
  const canPayment = isSuper || !!userCaps?.canCreatePaymentEntries;
  const canJournal = isSuper || !!userCaps?.canCreateJournalEntries;

  // entity-create caps (single inventory flag)
  const canCreateCustomer = isSuper || !!userCaps?.canCreateCustomers;
  const canCreateVendor = isSuper || !!userCaps?.canCreateVendors;
  const canCreateInventory = isSuper || !!userCaps?.canCreateInventory;

  const allowedTypes = React.useMemo(() => {
    const arr: Array<z.infer<typeof formSchema>["type"]> = [];
    if (canSales) arr.push("sales");
    if (canPurchases) arr.push("purchases");
    if (canReceipt) arr.push("receipt");
    if (canPayment) arr.push("payment");
    if (canJournal) arr.push("journal");
    return arr;
  }, [canSales, canPurchases, canReceipt, canPayment, canJournal]);

  const { fields, append, remove, replace, insert } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const receiptAmountWatch = useWatch({
    control: form.control,
    name: "totalAmount",
  });
  const type = form.watch("type");

  // right after your existing watches
  const afterReceiptBalance = React.useMemo(() => {
    if (type !== "receipt" || balance == null) return null;
    const amt = Number(receiptAmountWatch || 0);
    return Math.max(0, Number(balance) - (Number.isFinite(amt) ? amt : 0));
  }, [type, balance, receiptAmountWatch]);

  const afterPaymentBalance = React.useMemo(() => {
    if (type !== "payment" || balance == null) return null;
    const amt = Number(receiptAmountWatch || 0);
    return Number(balance) + (Number.isFinite(amt) ? amt : 0);
  }, [type, balance, receiptAmountWatch]);

  // Derived flags for current tab
  const partyCreatable = React.useMemo(() => {
    if (type === "sales" || type === "receipt") return canCreateCustomer;
    if (type === "purchases" || type === "payment") return canCreateVendor;
    return false;
  }, [type, canCreateCustomer, canCreateVendor]);

  const serviceCreatable = canCreateInventory;

  // Add this function in your TransactionForm component
  const handleNewTransaction = () => {
    console.log("🔄 Resetting form for new transaction");

    form.reset({
      party: "",
      expense: "",
      isExpense: false,
      description: "",
      totalAmount: 0,
      items: [PRODUCT_DEFAULT],
      type: defaultType,
      referenceNumber: "",
      fromAccount: "",
      toAccount: "",
      narration: "",
      company: selectedCompanyId || "",
      date: new Date(),
      taxAmount: 0,
      invoiceTotal: 0,
      notes: "",
      sameAsBilling: true,
      shippingAddress: "",
      shippingAddressDetails: {
        label: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        contactNumber: "",
      },
    });

    // Also clear any internal states
    setPartyBalance(null);
    setVendorBalance(null);
    setBalance(null);
    setShippingAddresses([]);
    setShowNotes(false);
  };

  // ADD THIS useEffect (keeps items only where they belong)
  React.useEffect(() => {
    if (type === "sales" || type === "purchases") {
      if (!form.getValues("items")?.length) {
        replace([PRODUCT_DEFAULT]);
      }
    } else {
      // receipt/payment/journal don't use items
      if (form.getValues("items")?.length) {
        replace([]);
      }
    }
  }, [type, replace, form]);

  // ⬇️ FIXED: per-line GST computation with proper field priority
  React.useEffect(() => {
    if (!watchedItems || !["sales", "purchases"].includes(type)) return;

    let subTotal = 0;
    let totalTax = 0;

    watchedItems.forEach((it, idx) => {
      if (!it) return;

      let base = 0;
      let lineTax = 0;
      let lineTotal = 0;
      const lastEdited = lastEditedField[idx];

      if (it.itemType === "product") {
        const q = Number(it.quantity) || 0;
        const p = Number(it.pricePerUnit) || 0;
        const amt = Number(it.amount) || 0;
        const lineTot = Number(it.lineTotal) || 0;
        const pct = gstEnabled ? Number(it?.gstPercentage ?? 18) : 0;

        // FIXED: Priority-based calculation
        if (lastEdited === "lineTotal") {
          // If lineTotal was edited, calculate backwards
          lineTotal = lineTot;
          base = +(lineTotal / (1 + pct / 100)).toFixed(2);
          lineTax = +(lineTotal - base).toFixed(2);

          // Update amount and recalculate pricePerUnit based on quantity
          if (base !== amt) {
            form.setValue(`items.${idx}.amount`, base, {
              shouldValidate: false,
            });
          }

          // Recalculate pricePerUnit = amount / quantity
          if (q !== 0) {
            const calculatedPrice = +(base / q).toFixed(2);
            if (calculatedPrice !== p) {
              form.setValue(`items.${idx}.pricePerUnit`, calculatedPrice, {
                shouldValidate: false,
              });
            }
          }
        } else if (lastEdited === "amount") {
          // If amount was edited, keep it as base and recalculate pricePerUnit
          base = amt;
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);

          // Recalculate pricePerUnit = amount / quantity
          if (q !== 0) {
            const calculatedPrice = +(base / q).toFixed(2);
            if (calculatedPrice !== p) {
              form.setValue(`items.${idx}.pricePerUnit`, calculatedPrice, {
                shouldValidate: false,
              });
            }
          }
        } else if (lastEdited === "quantity") {
          // If quantity was edited, calculate amount = quantity * pricePerUnit
          base = +(q * p).toFixed(2);
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);

          if (base !== amt) {
            form.setValue(`items.${idx}.amount`, base, {
              shouldValidate: false,
            });
          }
        } else if (lastEdited === "pricePerUnit") {
          // If pricePerUnit was edited, calculate amount = quantity * pricePerUnit
          base = +(q * p).toFixed(2);
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);

          if (base !== amt) {
            form.setValue(`items.${idx}.amount`, base, {
              shouldValidate: false,
            });
          }
        } else {
          // Default: calculate from quantity * pricePerUnit
          base = +(q * p).toFixed(2);
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);

          if (base !== amt) {
            form.setValue(`items.${idx}.amount`, base, {
              shouldValidate: false,
            });
          }
        }
      } else if (it.itemType === "service") {
        const amt = Number(it.amount) || 0;
        const lineTot = Number(it.lineTotal) || 0;
        const pct = gstEnabled ? Number(it?.gstPercentage ?? 18) : 0;

        if (lastEdited === "lineTotal") {
          // If lineTotal was edited, calculate backwards
          lineTotal = lineTot;
          base = +(lineTotal / (1 + pct / 100)).toFixed(2);
          lineTax = +(lineTotal - base).toFixed(2);

          if (base !== amt) {
            form.setValue(`items.${idx}.amount`, base, {
              shouldValidate: false,
            });
          }
        } else {
          // Default: amount is the base
          base = amt;
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);
        }
      }

      subTotal += base;
      totalTax += lineTax;

      // Set the line values back to form only if they have changed
      const currentLineTax =
        Number(form.getValues(`items.${idx}.lineTax`)) || 0;
      const currentLineTotal =
        Number(form.getValues(`items.${idx}.lineTotal`)) || 0;

      if (currentLineTax !== lineTax) {
        form.setValue(`items.${idx}.lineTax`, lineTax, {
          shouldValidate: false,
        });
      }
      if (currentLineTotal !== lineTotal) {
        form.setValue(`items.${idx}.lineTotal`, lineTotal, {
          shouldValidate: false,
        });
      }
    });

    const invoiceTotal = +(subTotal + totalTax).toFixed(2);

    // Set the total values back to form only if they have changed
    if ((Number(form.getValues("totalAmount")) || 0) !== subTotal) {
      form.setValue("totalAmount", subTotal, { shouldValidate: true });
    }
    if ((Number(form.getValues("taxAmount")) || 0) !== totalTax) {
      form.setValue("taxAmount", totalTax, { shouldValidate: false });
    }
    if ((Number(form.getValues("invoiceTotal")) || 0) !== invoiceTotal) {
      form.setValue("invoiceTotal", invoiceTotal, { shouldValidate: false });
    }
  }, [watchedItems, type, gstEnabled, form, lastEditedField]);

  // Try a bulk endpoint first; if not available, fall back to per-party calls
  const loadPartyBalances = React.useCallback(
    async (list: Party[]) => {
      const token = localStorage.getItem("token");
      if (!token || !Array.isArray(list) || list.length === 0) return;

      // 1) Try bulk endpoint: GET /api/parties/balances -> { balances: { [partyId]: number } }
      try {
        const bulk = await fetch(`${baseURL}/api/parties/balances`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bulk.ok) {
          const data = await bulk.json();
          const map = (data && (data.balances as Record<string, number>)) || {};
          setPartyBalances(map);
          return; // done
        }
      } catch {
        // ignore and fall back
      }

      // 2) Fallback: GET /api/parties/:id/balance for each party
      // (kept simple; you can add throttling if your list is huge)
      const entries = await Promise.all(
        list.map(async (p) => {
          try {
            const r = await fetch(`${baseURL}/api/parties/${p._id}/balance`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!r.ok) return [p._id, 0] as const;
            const d = await r.json();
            return [p._id, Number(d?.balance ?? 0)] as const;
          } catch {
            return [p._id, 0] as const;
          }
        })
      );
      setPartyBalances(Object.fromEntries(entries));
    },
    [baseURL]
  );

  // Wrap fetchBanks in useCallback to prevent infinite re-renders
  const fetchBanks = React.useCallback(
    async (companyId: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          `${baseURL}/api/bank-details?companyId=${companyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Check the actual structure of the response
          let banksData = data;

          // Handle different response structures
          if (data && data.banks) {
            banksData = data.banks; // If response has { banks: [...] }
          } else if (Array.isArray(data)) {
            banksData = data; // If response is directly an array
          } else {
            banksData = []; // Fallback to empty array
          }

          // console.log("Processed Banks Data:", banksData);

          // Filter banks by company ID - check different possible structures
          const filteredBanks = banksData.filter((bank: any) => {
            // Handle different possible structures for company reference
            const bankCompanyId =
              bank.company?._id || // Object with _id
              bank.company || // Direct string ID
              bank.companyId; // Alternative field name

            // console.log(
            //   `Bank: ${bank.bankName}, Company ID: ${bankCompanyId}, Target: ${companyId}`
            // );

            return bankCompanyId === companyId;
          });

          // console.log("Filtered Banks:", filteredBanks);
          setBanks(filteredBanks);
        } else {
          throw new Error("Failed to fetch banks.");
        }
      } catch (error) {
        console.error("Error fetching banks:", error);
        setBanks([]);
        toast({
          variant: "destructive",
          title: "Error fetching banks",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    },
    [baseURL, toast]
  ); // Add dependencies

  // Use useEffect to fetch banks when the selected company in the FORM changes
  React.useEffect(() => {
    if (selectedCompanyIdWatch) {
      fetchBanks(selectedCompanyIdWatch);
      // Also fetch payment expenses for the selected company
      fetchPaymentExpenses(selectedCompanyIdWatch);
    } else {
      setBanks([]); // Clear banks if no company is selected in the form
      setPaymentExpenses([]); // Clear expenses if no company is selected
    }
  }, [selectedCompanyIdWatch, fetchBanks]); // Use selectedCompanyIdWatch instead of selectedCompanyId

  // Function to fetch payment expenses for a specific company
  const fetchPaymentExpenses = React.useCallback(
    async (companyId: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          `${baseURL}/api/payment-expenses?companyId=${companyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          console.log("Fetched payment expenses for company:", companyId, data);
          setPaymentExpenses(Array.isArray(data.data) ? data.data : []);
        } else {
          console.error("Failed to fetch payment expenses");
          setPaymentExpenses([]);
        }
      } catch (error) {
        console.error("Error fetching payment expenses:", error);
        setPaymentExpenses([]);
      }
    },
    [baseURL]
  );

  const transactionDate = form.watch("date");
  const dueDate = form.watch("dueDate");

  useEffect(() => {
    if (transactionDate && !dueDate) {
      form.setValue("dueDate", transactionDate);
    }
  }, [transactionDate, dueDate, form]);
  // Fetch shipping addresses when party changes
  const fetchShippingAddresses = React.useCallback(
    async (partyId: string) => {
      if (!partyId) {
        setShippingAddresses([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          `${baseURL}/api/shipping-addresses/party/${partyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setShippingAddresses(data.shippingAddresses || []);
        } else {
          setShippingAddresses([]);
        }
      } catch (error) {
        console.error("Error fetching shipping addresses:", error);
        setShippingAddresses([]);
      }
    },
    [baseURL]
  );

  const fetchInitialData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [
        companiesRes,
        partiesRes,
        productsRes,
        vendorsRes,
        servicesRes,
        paymentExpensesRes,
      ] = await Promise.all([
        fetch(`${baseURL}/api/companies/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/parties`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/services`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/payment-expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (
        !companiesRes.ok ||
        !partiesRes.ok ||
        !productsRes.ok ||
        !vendorsRes.ok ||
        !servicesRes.ok ||
        !paymentExpensesRes.ok
      ) {
        throw new Error("Failed to fetch initial form data.");
      }

      const companiesData = await companiesRes.json();
      const partiesData = await partiesRes.json();
      const productsData = await productsRes.json();
      const vendorsData = await vendorsRes.json();
      const servicesData = await servicesRes.json();
      const paymentExpensesData = await paymentExpensesRes.json();

      setCompanies(companiesData);
      setParties(
        Array.isArray(partiesData) ? partiesData : partiesData.parties || []
      );

      const list: Party[] = Array.isArray(partiesData)
        ? partiesData
        : partiesData.parties || [];

      const listHasInlineBalance =
        Array.isArray(list) &&
        list.some((p: any) => typeof p?.balance === "number");

      if (!listHasInlineBalance) {
        // fetch balances if not already present on party objects
        loadPartyBalances(list);
      } else {
        // use inline balances directly to build the map for quick lookup
        const map: Record<string, number> = {};
        list.forEach((p: any) => (map[p._id] = Number(p.balance || 0)));
        setPartyBalances(map);
      }
      setProducts(
        Array.isArray(productsData) ? productsData : productsData.products || []
      );
      setServices(
        Array.isArray(servicesData) ? servicesData : servicesData.services || []
      );
      setVendors(
        Array.isArray(vendorsData) ? vendorsData : vendorsData.vendors || []
      );
      console.log("Fetched payment expenses on frontend:", paymentExpensesData);
      setPaymentExpenses(
        Array.isArray(paymentExpensesData.data)
          ? paymentExpensesData.data
          : paymentExpensesData.expenses || []
      );

      if (companiesData.length > 0 && !transactionToEdit) {
        // Use the context-based selected company if available, otherwise default to first.
        form.setValue("company", selectedCompanyId || companiesData[0]._id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, form, transactionToEdit, selectedCompanyId]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  React.useEffect(() => {
    const fetchUnits = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${baseURL}/api/units`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("units fetched :", res);
        if (res.ok) {
          const units = await res.json();
          setExistingUnits(units);
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
      }
    };
    fetchUnits();
  }, [baseURL]);

  React.useEffect(() => {
    if (!transactionToEdit) return;

    // ---------- helpers ----------
    const toProductItem = (p: any) => ({
      itemType: "product" as const,
      product:
        p.product && typeof p.product === "object"
          ? String(p.product._id)
          : String(p.product || ""),
      quantity: p.quantity ?? 1,
      unitType: p.unitType ?? "Piece",
      otherUnit: p.otherUnit ?? " ",
      pricePerUnit: p.pricePerUnit ?? 0,
      description: p.description ?? "",
      amount:
        typeof p.amount === "number"
          ? p.amount
          : Number(p.quantity || 0) * Number(p.pricePerUnit || 0),
      gstPercentage: p.gstPercentage ?? 18, // Ensure GST is set
      lineTax: p.lineTax ?? 0, // Ensure lineTax is set
      lineTotal: p.lineTotal ?? p.amount, // Ensure lineTotal is set correctly
    });

    const toServiceId = (s: any) => {
      // handle both new and legacy shapes for services
      const raw =
        (s.service &&
          (typeof s.service === "object" ? s.service._id : s.service)) ??
        (s.serviceName &&
          (typeof s.serviceName === "object"
            ? s.serviceName._id
            : s.serviceName)) ??
        s.serviceId; // Add serviceId as fallback

      return raw ? String(raw) : "";
    };

    const toServiceItem = (s: any) => ({
      itemType: "service" as const,
      service: toServiceId(s),
      description: s.description ?? "",
      amount: Number(s.amount || 0),
      gstPercentage: s.gstPercentage ?? 18, // Ensure GST is included for services
      lineTax: s.lineTax ?? 0, // Ensure lineTax is set for services
      lineTotal: s.lineTotal ?? s.amount, // Ensure lineTotal is set correctly for services
    });

    const toUnifiedItem = (i: any) => ({
      itemType:
        (i.itemType as "product" | "service") ??
        (i.product || i.productId
          ? "product"
          : i.service || i.serviceName
          ? "service"
          : "product"), // Better service detection
      product:
        i.product && typeof i.product === "object"
          ? String(i.product._id)
          : String(i.product || ""),
      service: toServiceId(i),
      quantity: i.quantity ?? (i.itemType === "service" ? undefined : 1),
      unitType: i.unitType ?? "Piece",
      otherUnit: i.otherUnit ?? " ",
      pricePerUnit: i.pricePerUnit ?? undefined,
      description: i.description ?? "",
      amount:
        typeof i.amount === "number"
          ? i.amount
          : Number(i.quantity || 0) * Number(i.pricePerUnit || 0),
      gstPercentage: i.gstPercentage ?? 18,
      lineTax: i.lineTax ?? 0,
      lineTotal: i.lineTotal ?? i.amount,
    });

    // ---------- choose source ----------
    let itemsToSet: any[] = [];

    // 1) New unified shape already on the doc
    if (
      Array.isArray((transactionToEdit as any).items) &&
      (transactionToEdit as any).items.length
    ) {
      itemsToSet = (transactionToEdit as any).items.map(toUnifiedItem);
    } else {
      // 2) Legacy/new arrays
      const prodArr = Array.isArray((transactionToEdit as any).products)
        ? (transactionToEdit as any).products.map(toProductItem)
        : [];

      // NEW: read plural `services`
      const svcPlural = Array.isArray((transactionToEdit as any).services)
        ? (transactionToEdit as any).services.map(toServiceItem)
        : [];

      // Legacy: some data used `service` (singular)
      const svcLegacy = Array.isArray((transactionToEdit as any).service)
        ? (transactionToEdit as any).service.map(toServiceItem)
        : [];

      itemsToSet = [...prodArr, ...svcPlural, ...svcLegacy];
    }

    // sales/purchases need at least one row
    if (
      (!itemsToSet || itemsToSet.length === 0) &&
      (transactionToEdit.type === "sales" ||
        transactionToEdit.type === "purchases")
    ) {
      itemsToSet = [
        {
          itemType: "product" as const,
          product: "",
          quantity: 1,
          pricePerUnit: 0,
          unitType: "Piece",
          otherUnit: " ",
          amount: 0,
          description: "",
        },
      ];
    }

    // party/vendor id - FIXED VERSION
    let partyId: string | undefined;

    if (
      transactionToEdit.type === "sales" ||
      transactionToEdit.type === "receipt"
    ) {
      // For sales/receipt, use party field
      partyId = (transactionToEdit as any).party
        ? typeof (transactionToEdit as any).party === "object"
          ? (transactionToEdit as any).party._id
          : (transactionToEdit as any).party
        : undefined;
    } else if (
      transactionToEdit.type === "purchases" ||
      transactionToEdit.type === "payment"
    ) {
      // For purchases/payment, use vendor field
      partyId = (transactionToEdit as any).vendor
        ? typeof (transactionToEdit as any).vendor === "object"
          ? (transactionToEdit as any).vendor._id
          : (transactionToEdit as any).vendor
        : undefined;
    }

    console.log("🔍 DEBUG - Setting party for edit:", {
      type: transactionToEdit.type,
      partyId,
      transactionParty: (transactionToEdit as any).party,
      transactionVendor: (transactionToEdit as any).vendor,
    });

    // reset the form with normalized items
    // reset the form with normalized items
    form.reset({
      type: transactionToEdit.type,
      company:
        transactionToEdit?.company &&
        typeof transactionToEdit.company === "object"
          ? transactionToEdit.company._id || ""
          : typeof transactionToEdit?.company === "string"
          ? transactionToEdit.company === "all"
            ? ""
            : transactionToEdit.company
          : selectedCompanyId || "",
      date: new Date(transactionToEdit.date),
      dueDate: transactionToEdit.dueDate
        ? new Date(transactionToEdit.dueDate)
        : undefined,
      totalAmount:
        transactionToEdit.totalAmount || (transactionToEdit as any).amount,
      items: itemsToSet,
      description: transactionToEdit.description || "",
      narration: (transactionToEdit as any).narration || "",
      party: partyId,
      referenceNumber: (transactionToEdit as any).referenceNumber,
      fromAccount: (transactionToEdit as any).debitAccount,
      toAccount: (transactionToEdit as any).creditAccount,
      paymentMethod: (transactionToEdit as any).paymentMethod || "",

      bank:
        (transactionToEdit as any).bank &&
        typeof (transactionToEdit as any).bank === "object"
          ? (transactionToEdit as any).bank._id
          : (transactionToEdit as any).bank || "",
      notes: (transactionToEdit as any).notes || "",
      sameAsBilling: !(transactionToEdit as any).shippingAddress,
      shippingAddress:
        (transactionToEdit as any).shippingAddress &&
        typeof (transactionToEdit as any).shippingAddress === "object"
          ? (transactionToEdit as any).shippingAddress._id
          : (transactionToEdit as any).shippingAddress || "",
      shippingAddressDetails:
        (transactionToEdit as any).shippingAddress &&
        typeof (transactionToEdit as any).shippingAddress === "object"
          ? {
              label: (transactionToEdit as any).shippingAddress.label || "",
              address: (transactionToEdit as any).shippingAddress.address || "",
              city: (transactionToEdit as any).shippingAddress.city || "",
              state: (transactionToEdit as any).shippingAddress.state || "",
              pincode: (transactionToEdit as any).shippingAddress.pincode || "",
              contactNumber:
                (transactionToEdit as any).shippingAddress.contactNumber || "",
            }
          : {
              label: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
              contactNumber: "",
            },
    });
    // Show notes section if there are existing notes
    if (
      (transactionToEdit as any).notes &&
      (transactionToEdit as any).notes.trim()
    ) {
      setShowNotes(true);
    }

    replace(itemsToSet);

    // Store original quantities for stock updates
    const origMap = new Map<string, number>();
    itemsToSet.forEach((item: any) => {
      if (item.product) {
        origMap.set(item.product, Number(item.quantity) || 0);
      }
    });
    setOriginalQuantities(origMap);
  }, [transactionToEdit, form, replace, isLoading]);

  React.useEffect(() => {
    if (transactionToEdit) return; // don't change type while editing
    const current = form.getValues("type");
    if (!allowedTypes.includes(current)) {
      form.setValue("type", allowedTypes[0] ?? "sales");
    }
  }, [allowedTypes, transactionToEdit, form]);

  // Add this useEffect to reset product prices when switching between sales and purchases
  const isInitialLoad = React.useRef(true);

  React.useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const currentType = form.getValues("type");
    const items = form.getValues("items");

    if (items && items.length > 0) {
      // Reset pricePerUnit for all product items when switching types
      const updatedItems = items.map((item: any) => {
        if (item.itemType === "product") {
          return {
            ...item,
            pricePerUnit: 0, // Reset price to 0
            amount: 0, // Reset amount to 0
            lineTax: 0, // Reset tax to 0
            lineTotal: 0, // Reset total to 0
          };
        }
        return item;
      });

      form.setValue("items", updatedItems);

      // Also reset the totals
      form.setValue("totalAmount", 0);
      form.setValue("taxAmount", 0);
      form.setValue("invoiceTotal", 0);
    }
  }, [type, form]);

  // Add this useEffect to handle bank selection after banks are loaded
  React.useEffect(() => {
    if (transactionToEdit && banks.length > 0) {
      const bankValue = form.getValues("bank");
      if (bankValue) {
        // Check if the bank value exists in the banks list
        const bankExists = banks.some((bank) => bank._id === bankValue);
        if (!bankExists) {
          console.log("Bank not found in available banks, clearing value");
          form.setValue("bank", "");
        } else {
          console.log("Bank found, keeping value:", bankValue);
        }
      }
    }
  }, [banks, transactionToEdit, form]);

  // Fetch shipping addresses when party changes
  React.useEffect(() => {
    const partyId = form.watch("party");
    if (partyId && type === "sales") {
      fetchShippingAddresses(partyId);
    }
  }, [form.watch("party"), type, fetchShippingAddresses]);

  // Update balance when company changes and party is selected
  React.useEffect(() => {
    const partyId = form.watch("party");
    if (partyId && selectedCompanyIdWatch) {
      handlePartyChange(partyId);
    }
  }, [selectedCompanyIdWatch, form.watch("party"), type]);

  // Populate shipping address details when editing and addresses are loaded
  React.useEffect(() => {
    if (transactionToEdit && shippingAddresses.length > 0) {
      const shippingAddrId = form.getValues("shippingAddress");
      if (shippingAddrId && shippingAddrId !== "new") {
        const selectedAddr = shippingAddresses.find(
          (addr) => addr._id === shippingAddrId
        );
        if (selectedAddr) {
          form.setValue("shippingAddressDetails", {
            label: selectedAddr.label,
            address: selectedAddr.address,
            city: selectedAddr.city,
            state: selectedAddr.state,
            pincode: selectedAddr.pincode || "",
            contactNumber: selectedAddr.contactNumber || "",
          });
          // Update state code for city dropdown
          const found = indiaStates.find(
            (s) =>
              s.name.toLowerCase() === (selectedAddr.state || "").toLowerCase()
          );
          setShippingStateCode(found?.isoCode || null);
        }
      }
    }
  }, [transactionToEdit, shippingAddresses, form, indiaStates]);

  // async function updateStock(token: string, items: Item[]) {
  async function updateStock(
    token: string,
    items: StockItemInput[],
    action: "increase" | "decrease" = "decrease"
  ) {
    try {
      const res = await fetch(`${baseURL}/api/products/update-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items, action }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update stock levels.");
      }
    } catch (error) {
      console.error("Stock update failed:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update stock levels.";

      toast({
        variant: "destructive",
        title: "Stock Update Failed",
        description: `Transaction was saved, but ${errorMessage}`,
      });
    }
  }

  // Add this helper function
  const enrichTransactionWithNames = (
    transaction: any,
    products: Product[],
    services: Service[]
  ) => {
    if (!transaction) return transaction;

    const enriched = { ...transaction };

    // Enrich products
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

    // Enrich services
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

  // Put this near your onSubmit (or in a util)
  function buildInvoiceEmailHTML(opts: {
    companyName: string;
    partyName?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    logoUrl?: string | null; // optional if you store one
  }) {
    const {
      companyName,
      partyName = "Customer",
      supportEmail = "",
      supportPhone = "",
      logoUrl,
    } = opts;

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
                ${
                  logoUrl
                    ? `<img src="${logoUrl}" alt="${companyName}" width="32" height="32" style="border-radius:6px;display:inline-block;">`
                    : ``
                }
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
  }

  const handleCreateTransactionWithPreview = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      scrollToFirstError();
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const values = form.getValues();

      if (values.paymentMethod === "Others" && values.customPaymentMethod) {
        values.paymentMethod = values.customPaymentMethod;
      }

      if (values.type === "sales") {
        // Submit the transaction first
        const result = await onSubmit(values, false); // false = don't close form

        if (result && result.entry) {
          const savedTransaction = result.entry;

          // Store the saved transaction data
          setSavedTransactionData(savedTransaction);
          setIsTransactionSaved(true);

          // 🔽 FETCH COMPLETE PARTY DETAILS like in download function
          let partyToUse = null;
          const partyId = savedTransaction.party?._id || savedTransaction.party;

          if (partyId) {
            try {
              const token = localStorage.getItem("token");
              const response = await fetch(
                `${baseURL}/api/parties/${partyId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.ok) {
                partyToUse = await response.json();
                console.log("🔍 Fetched complete party details:", partyToUse);
              }
            } catch (error) {
              console.error("Error fetching party details:", error);
            }
          }

          // 🔽 FETCH COMPLETE COMPANY DETAILS
          let companyToUse = null;
          const companyId =
            savedTransaction.company?._id || savedTransaction.company;

          if (companyId) {
            try {
              const token = localStorage.getItem("token");
              const response = await fetch(
                `${baseURL}/api/companies/${companyId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.ok) {
                companyToUse = await response.json();
                console.log(
                  "🔍 Fetched complete company details:",
                  companyToUse
                );
              }
            } catch (error) {
              console.error("Error fetching company details:", error);
            }
          }

          let bankDetails = null;
          const bankId =
            savedTransaction.bank?._id || savedTransaction.bank || values.bank;

          if (bankId) {
            try {
              const token = localStorage.getItem("token");
              // Try to fetch bank details from API
              const response = await fetch(
                `${baseURL}/api/bank-details/${bankId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.ok) {
                bankDetails = await response.json();
                console.log("🔍 Fetched bank details from API:", bankDetails);
              } else {
                // If API fails, try to find in local banks array
                bankDetails = banks.find((bank) => bank._id === bankId);
                console.log("🔍 Using local bank details:", bankDetails);
              }
            } catch (error) {
              console.error("Error fetching bank details:", error);
              // Fallback to local banks array
              bankDetails = banks.find((bank) => bank._id === bankId);
            }
          }

          let shippingAddressData = null;

          if (!values.sameAsBilling) {
            if (values.shippingAddress && values.shippingAddress !== "new") {
              // Use existing shipping address
              shippingAddressData = shippingAddresses.find(
                (addr) => addr._id === values.shippingAddress
              );
            } else if (
              values.shippingAddress === "new" &&
              values.shippingAddressDetails
            ) {
              // Use new shipping address from form
              shippingAddressData = {
                _id: "new-address",
                ...values.shippingAddressDetails,
              };
            }
          } else {
            // Use party's billing address when sameAsBilling is true
            shippingAddressData = {
              label: "Billing Address",
              address: partyToUse?.address || "",
              city: partyToUse?.city || "",
              state: partyToUse?.state || "",
              pincode: "",
              contactNumber: partyToUse?.contactNumber || "",
            };
          }

          // Create preview data
          const previewData = {
            ...savedTransaction,
            company:
              companyToUse ||
              companies.find(
                (c) =>
                  c._id ===
                  (savedTransaction.company?._id || savedTransaction.company)
              ),
            party:
              partyToUse ||
              parties.find(
                (p) =>
                  p._id ===
                  (savedTransaction.party?._id || savedTransaction.party)
              ),
            bank: bankDetails?.data || bankDetails,
            // Add shipping address to preview data
            shippingAddress: shippingAddressData,
            // Also include the sameAsBilling flag for template logic
            sameAsBilling: values.sameAsBilling,
            paymentMethod: values.paymentMethod,
          };

          console.log("🔍 ========== COMPLETE PREVIEW DATA ==========");
          console.log("🔍 Preview data:", previewData);
          console.log("🔍 Bank in preview data:", previewData.bank);
          console.log("🔍 Bank details:", bankDetails);
          console.log("🔍 Shipping address data:", shippingAddressData);
          console.log("🔍 Same as billing:", values.sameAsBilling);
          console.log("🔍 Payment method:", values.paymentMethod);
          console.log("🔍 ============================================");
          setGeneratedInvoice(previewData);

          setInvoicePreviewOpen(true);
        }
      } else {
        // For non-sales transactions, submit and close form normally
        await onSubmit(values, true);
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create transaction",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToFirstError = () => {
    const errors = form.formState.errors;
    const currentType = form.getValues("type");

    // Define the order of fields to check for errors (top to bottom), filtered by transaction type
    let fieldOrder: string[] = [];

    // Common fields for all types
    fieldOrder.push("company", "date");

    // Party field for types that require it
    if (
      ["sales", "purchases", "receipt"].includes(currentType) ||
      (currentType === "payment" && !form.getValues("isExpense"))
    ) {
      fieldOrder.push("party");
    }

    // Expense field for payment with expense
    if (currentType === "payment" && form.getValues("isExpense")) {
      fieldOrder.push("expense");
    }

    // Payment method for applicable types
    if (["sales", "purchases", "receipt", "payment"].includes(currentType)) {
      fieldOrder.push("paymentMethod");
    }

    // Bank field
    fieldOrder.push("bank");

    // Item fields only for sales/purchases
    if (["sales", "purchases"].includes(currentType)) {
      fieldOrder.push(
        "items.0.product",
        "items.0.quantity",
        "items.0.unitType",
        "items.0.otherUnit",
        "items.0.pricePerUnit",
        "items.0.amount",
        "items.0.gstPercentage",
        "items.0.lineTax",
        "items.0.lineTotal",
        "items.0.description"
      );
    }

    // Amount fields
    if (
      ["sales", "purchases", "receipt", "payment", "journal"].includes(
        currentType
      )
    ) {
      fieldOrder.push("totalAmount");
    }

    // GST fields only for sales/purchases
    if (["sales", "purchases"].includes(currentType)) {
      fieldOrder.push("taxAmount", "invoiceTotal");
    }

    // Reference number
    fieldOrder.push("referenceNumber");

    // Description/narration
    fieldOrder.push("description", "narration");

    // Journal specific fields
    if (currentType === "journal") {
      fieldOrder.push("fromAccount", "toAccount");
    }

    // Notes
    fieldOrder.push("notes");

    // Find the first field in order that has an error
    for (const fieldName of fieldOrder) {
      if (errors[fieldName as keyof typeof errors]) {
        // Use react-hook-form's setFocus to focus the field
        form.setFocus(fieldName as any);
        // Also scroll the field into view within the ScrollArea
        setTimeout(() => {
          // Try multiple selectors to find the field element
          let element = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          if (!element) {
            element = document.querySelector(`#${fieldName}`) as HTMLElement;
          }
          if (!element && fieldName.includes(".")) {
            // For nested fields like items.0.product, try data attributes or other selectors
            const parts = fieldName.split(".");
            element = document.querySelector(
              `[data-field="${fieldName}"]`
            ) as HTMLElement;
          }
          if (!element) {
            // Try to find by form field wrapper or label
            const label = document.querySelector(
              `label[for="${fieldName}"]`
            ) as HTMLElement;
            if (label) {
              element = label.closest(".space-y-2") as HTMLElement;
            }
          }
          if (!element) {
            // For party field, look for the combobox input
            if (fieldName === "party") {
              element = document.querySelector(
                '[data-testid="party-combobox"] input'
              ) as HTMLElement;
            }
            // For paymentMethod field, look for the select trigger
            if (fieldName === "paymentMethod") {
              element = document.querySelector(
                '[data-testid="payment-method-select"] button'
              ) as HTMLElement;
            }
          }

          if (element) {
            const scrollContainer = document.querySelector(
              ".flex-1.overflow-auto"
            ) as HTMLElement;
            if (scrollContainer) {
              // Calculate position relative to scroll container
              const elementRect = element.getBoundingClientRect();
              const containerRect = scrollContainer.getBoundingClientRect();
              const scrollTop =
                scrollContainer.scrollTop +
                (elementRect.top - containerRect.top) -
                100; // 100px offset for better visibility
              scrollContainer.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: "smooth",
              });
            } else {
              element.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            }
          }
        }, 100);
        break; // Stop after finding the first error
      }
    }
  };

  const { registerField } = useFormFocus(form.formState.errors);

  async function onSubmit(
    values: z.infer<typeof formSchema>,
    shouldCloseForm: boolean = true
  ) {
    // First, trigger form validation
    const isValid = await form.trigger();

    if (!isValid) {
      // Form has validation errors - focus will be handled by our useFormFocus hook
      console.log("Form validation failed");
      return; // Stop submission
    }

    if (values.type === "sales" && values.items) {
      values.items.forEach((item, index) => {
        if (item.itemType === "product" && item.product && item.quantity) {
          const selectedProduct = products.find((p) => p._id === item.product);
          if (
            selectedProduct &&
            selectedProduct.stocks !== undefined &&
            selectedProduct.stocks !== null
          ) {
            const currentStock = Number(selectedProduct.stocks) || 0;
            const requestedQuantity = Number(item.quantity) || 0;

            // Calculate what the stock will be AFTER this transaction
            const stockAfterTransaction = currentStock - requestedQuantity;

            if (currentStock <= 0) {
              toast({
                variant: "destructive",
                title: "Out of Stock",
                description: `${selectedProduct.name} is out of stock.`,
              });
            } else if (requestedQuantity > currentStock) {
              toast({
                variant: "destructive",
                title: "Insufficient Stock",
                description: `${selectedProduct.name}: Ordered ${requestedQuantity} but only ${currentStock} available.`,
                duration: 6000,
              });
            } else if (stockAfterTransaction <= 0) {
              // Will be out of stock after this transaction
              toast({
                variant: "destructive",
                title: "Stock Depletion",
                description: `${selectedProduct.name} will be out of stock after this order.`,
                duration: 6000,
              });
            } else if (stockAfterTransaction <= 5) {
              // Will be low stock after this transaction
              toast({
                variant: "destructive",
                title: "Low Stock After Order",
                description: `${selectedProduct.name} will have only ${stockAfterTransaction} units left after this order.`,
                duration: 5000,
              });
            } else if (currentStock <= 5) {
              // Currently low stock (but won't be critical after this order)
              toast({
                variant: "destructive",
                title: "Low Stock",
                description: `${selectedProduct.name} currently has low stock (${currentStock} units).`,
                duration: 5000,
              });
            }
          }
        }
      });
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const endpointMap: Record<string, string> = {
        sales: `/api/sales`,
        purchases: `/api/purchase`,
        receipt: `/api/receipts`,
        payment: `/api/payments`,
        journal: `/api/journals`,
      };

      const method = transactionToEdit ? "PUT" : "POST";
      let endpoint = endpointMap[values.type];

      if (transactionToEdit) {
        const editType = transactionToEdit.type; // use original type for endpoint
        endpoint = `${endpointMap[editType]}/${transactionToEdit._id}`;
      }

      // --- Build line items ---
      const productLines =
        values.items
          ?.filter((i) => i.itemType === "product")
          .map((i) => ({
            product: i.product, // ObjectId
            quantity: i.quantity,
            unitType: i.unitType,
            otherUnit: i.otherUnit,
            pricePerUnit: i.pricePerUnit,
            amount:
              typeof i.amount === "number"
                ? i.amount
                : Number(i.quantity || 0) * Number(i.pricePerUnit || 0),
            description: i.description ?? "",
            gstPercentage: gstEnabled ? Number(i.gstPercentage ?? 18) : 0,
            lineTax: gstEnabled ? Number(i.lineTax ?? 0) : 0,
            lineTotal: gstEnabled ? Number(i.lineTotal ?? i.amount) : i.amount,
          })) ?? [];

      const serviceLines =
        values.items
          ?.filter((i) => i.itemType === "service")
          .map((i) => ({
            service: i.service, // ✅ send id under "service"
            amount: i.amount,
            description: i.description ?? "",
            gstPercentage: gstEnabled ? Number(i.gstPercentage ?? 18) : 0,
            lineTax: gstEnabled ? Number(i.lineTax ?? 0) : 0,
            lineTotal: gstEnabled ? Number(i.lineTotal ?? i.amount) : i.amount,
          })) ?? [];

      // --- Totals coming from UI ---
      const uiSubTotal = Number(values.totalAmount ?? 0);

      // if GST disabled, force tax=0 and total=subtotal
      const uiTax = gstEnabled ? Number(values.taxAmount ?? 0) : 0;
      const uiInvoiceTotal = gstEnabled
        ? Number(values.invoiceTotal ?? uiSubTotal)
        : uiSubTotal;
      const receiptAmount = Number(
        values.totalAmount ?? values.subTotal ?? values.invoiceTotal ?? 0
      );

      // --- Handle shipping address for sales ---
      let shippingAddressId = null;
      if (values.type === "sales") {
        if (values.sameAsBilling) {
          // Use party's default address - no shipping address record needed
          shippingAddressId = null;
        } else if (values.shippingAddress && values.shippingAddress !== "new") {
          // Use existing shipping address
          shippingAddressId = values.shippingAddress;
        } else if (
          values.shippingAddress === "new" &&
          values.shippingAddressDetails
        ) {
          // Create new shipping address
          try {
            const shippingPayload = {
              party: values.party,
              label: values.shippingAddressDetails.label || "New Address",
              address: values.shippingAddressDetails.address || "",
              city: values.shippingAddressDetails.city || "",
              state: values.shippingAddressDetails.state || "",
              pincode: values.shippingAddressDetails.pincode || "",
              contactNumber: values.shippingAddressDetails.contactNumber || "",
            };

            const shippingRes = await fetch(
              `${baseURL}/api/shipping-addresses`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(shippingPayload),
              }
            );

            if (shippingRes.ok) {
              const shippingData = await shippingRes.json();
              shippingAddressId = shippingData.shippingAddress._id;

              // Add to local state for future use
              setShippingAddresses((prev) => [
                ...prev,
                shippingData.shippingAddress,
              ]);
            } else {
              throw new Error("Failed to create shipping address");
            }
          } catch (error) {
            console.error("Error creating shipping address:", error);
            toast({
              variant: "destructive",
              title: "Shipping Address Error",
              description:
                "Failed to save shipping address. Transaction will proceed without it.",
            });
          }
        }
      }

      // --- Build payload ---
      let payload: any;

      if (values.type === "receipt") {
        // ✅ send the exact shape your backend expects
        payload = {
          type: "receipt",
          company: values.company,
          party: values.party,
          date: values.date,
          amount: receiptAmount, // <-- important
          description: values.description,
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber,
        };
      } else {
        // (unchanged for sales/purchases/payment/journal except for the block below)
        payload = {
          type: values.type,
          company: values.company,
          party: values.party,
          date: values.date,
          dueDate: values.dueDate,
          description: values.description,
          referenceNumber: values.referenceNumber,
          narration: values.narration,
          products: productLines,
          services: serviceLines,
          totalAmount: uiInvoiceTotal,
          subTotal: uiSubTotal,
          taxAmount: uiTax,
          paymentMethod: values.paymentMethod,
          invoiceTotal: uiInvoiceTotal,
          bank: values.bank || undefined,
          notes: values.notes || "",
          shippingAddress: shippingAddressId,
        };
      }

      // Special handling for payment transactions - backend expects 'amount' field
      if (values.type === "payment") {
        payload.amount = values.totalAmount;
        payload.isExpense = values.isExpense || false;
        if (values.isExpense && values.expense) {
          payload.expense = values.expense;
        }
        delete payload.totalAmount;
        delete payload.subTotal;
        delete payload.taxAmount;
        delete payload.invoiceTotal;
        delete payload.products;
        delete payload.services;
      }

      // Clean up fields not needed by the server
      delete (payload as any).items;
      delete (payload as any).gstRate;

      // Role-based payload tweaks
      if (values.type === "purchases" || values.type === "payment") {
        payload.vendor = values.party;
        delete payload.party;
      }

      if (values.type === "journal") {
        payload.debitAccount = values.fromAccount;
        payload.creditAccount = values.toAccount;
        payload.amount = Number(values.totalAmount ?? 0);

        delete payload.fromAccount;
        delete payload.toAccount;
        delete payload.party;
        delete payload.products;
        delete payload.services;
        delete payload.referenceNumber;
        delete payload.subTotal;
        delete payload.taxAmount;
        delete payload.invoiceTotal;
        delete payload.gstPercentage;
        delete payload.totalAmount;
      }

      const res = await fetch(`${baseURL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to submit ${values.type} entry.`
        );
      }

      // Update stock for sales (decrease) and purchases (increase)
      if (
        (values.type === "sales" || values.type === "purchases") &&
        productLines.length
      ) {
        let stockUpdates: {
          product: string;
          quantity: number;
          action: "increase" | "decrease";
        }[] = [];

        if (transactionToEdit) {
          // For updates, calculate differences
          for (const newItem of productLines) {
            const productId = newItem.product!;
            const newQty = Number(newItem.quantity) || 0;
            const oldQty = originalQuantities.get(productId) || 0;
            const diff = newQty - oldQty;

            if (diff !== 0) {
              let action: "increase" | "decrease";
              if (values.type === "sales") {
                action = diff > 0 ? "decrease" : "increase";
              } else {
                action = diff > 0 ? "increase" : "decrease";
              }
              stockUpdates.push({
                product: productId,
                quantity: Math.abs(diff),
                action,
              });
            }
          }
        } else {
          // For new transactions
          const action = values.type === "sales" ? "decrease" : "increase";
          stockUpdates = productLines.map((p) => ({
            product: p.product!,
            quantity: Number(p.quantity) || 0,
            action,
          }));
        }

        // Group by action and call updateStock
        const decreaseItems = stockUpdates
          .filter((u) => u.action === "decrease")
          .map((u) => ({ product: u.product, quantity: u.quantity }));
        const increaseItems = stockUpdates
          .filter((u) => u.action === "increase")
          .map((u) => ({ product: u.product, quantity: u.quantity }));

        if (decreaseItems.length > 0) {
          await updateStock(token, decreaseItems, "decrease");
        }
        if (increaseItems.length > 0) {
          await updateStock(token, increaseItems, "increase");
        }
      }

      if (shouldCloseForm) {
        onFormSubmit();
      }

      // 🔽 SEND INVOICE PDF BY EMAIL (Sales only)

      const templateRes = await fetch(
        `${baseURL}/api/settings/default-template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const templateData = await templateRes.json();

      if (values.type === "sales") {
        const saved = data?.entry || data?.sale || {};
        const savedCompanyId = String(
          saved.company?._id || saved.company || values.company
        );
        const savedPartyId = String(
          saved.party?._id || saved.party || values.party
        );

        const companyDoc = companies.find(
          (c) => String(c._id) === savedCompanyId
        );
        const partyDoc = parties.find((p) => String(p._id) === savedPartyId);

        if (partyDoc?.email) {
          toast({
            title: "Transaction Created",
            description:
              "Invoice created successfully. You can now send it via email using the email button.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "No customer email",
            description:
              "Transaction created but customer doesn't have an email address.",
          });
        }
      }

      const inv =
        values.type === "sales" ? data?.entry?.invoiceNumber : undefined;
      toast({
        title: `Transaction ${transactionToEdit ? "Updated" : "Submitted"}!`,
        description: inv
          ? `Your ${values.type} entry has been recorded. Invoice #${inv}.`
          : `Your ${values.type} entry has been recorded.`,
        duration: 2000,
      });

      return data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleTriggerCreateParty = (name: string) => {
    const needCustomer = type === "sales" || type === "receipt";
    const allowed = needCustomer ? canCreateCustomer : canCreateVendor;
    if (!allowed) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: needCustomer
          ? "You don't have permission to create customers."
          : "You don't have permission to create vendors.",
      });
      return;
    }
    setNewEntityName(name);
    setIsPartyDialogOpen(true);
  };

  const handlePartyCreated = (newEntity: Party | Vendor) => {
    const entityId = newEntity._id;
    const entityName = newEntity.name || newEntity.vendorName;

    if (["sales", "receipt"].includes(form.getValues("type"))) {
      setParties((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newEntity as Party,
      ]);
    } else {
      setVendors((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newEntity as Vendor,
      ]);
    }

    form.setValue("party", entityId, { shouldValidate: true });
    toast({
      title: `New ${
        ["sales", "receipt"].includes(form.getValues("type"))
          ? "Customer"
          : "Vendor"
      } Created`,
      description: `${entityName} has been added.`,
    });
    setIsPartyDialogOpen(false);
  };

  const handlePartyChange = async (partyId: string) => {
    if (!partyId) {
      // Clear all balance states when no party is selected
      setPartyBalance(null);
      setVendorBalance(null);
      setBalance(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // Determine the correct API endpoint based on transaction type
      if (type === "sales" || type === "receipt") {
        // Only fetch if the selected party is actually a customer (exists in parties array)
        const selectedParty = parties.find((p) => p._id === partyId);
        if (!selectedParty) {
          console.log(
            `Selected party ${partyId} is not a customer, skipping balance fetch for ${type}`
          );
          setPartyBalance(null);
          return;
        }

        const endpoint = `${baseURL}/api/parties/${partyId}`;

        console.log(
          `Fetching customer details for ${type} transaction from: ${endpoint}`
        );

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log(`Customer response for ${type}:`, data);

        // Extract balance from balances object based on selected company
        const balances = data.balances || {};
        const companyBalance = balances[selectedCompanyIdWatch] ?? 0;

        console.log(
          `Customer balance for company ${selectedCompanyIdWatch}:`,
          companyBalance
        );

        // Set party balance for sales and receipt
        setPartyBalance(companyBalance);
        console.log(`Set partyBalance for ${type}:`, companyBalance);

        // Update the parties array with the fetched data
        setParties((prev) => {
          const exists = prev.find((p) => p._id === partyId);
          if (!exists) {
            return [...prev, data];
          }
          return prev.map((p) => (p._id === partyId ? data : p));
        });

        // form.setValue("totalAmount", 0, { shouldValidate: true });

        // Fetch shipping addresses only for sales
        if (type === "sales") {
          await fetchShippingAddresses(partyId);
          form.setValue("shippingAddress", "");
          form.setValue("sameAsBilling", true);
        }
      } else if (type === "purchases" || type === "payment") {
        // Only fetch if the selected party is actually a vendor (exists in vendors array)
        const selectedVendor = vendors.find((v) => v._id === partyId);
        if (!selectedVendor) {
          console.log(
            `Selected party ${partyId} is not a vendor, skipping balance fetch for ${type}`
          );
          setVendorBalance(null);
          return;
        }

        const endpoint = `${baseURL}/api/vendors/${partyId}`;

        console.log(
          `Fetching vendor details for ${type} transaction from: ${endpoint}`
        );

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log(`Vendor response for ${type}:`, data);

        // Extract balance from balances object based on selected company
        const balances = data.balances || {};
        const companyBalance = balances[selectedCompanyIdWatch] ?? 0;

        console.log(
          `Vendor balance for company ${selectedCompanyIdWatch}:`,
          companyBalance
        );

        // Set vendor balance for purchases and payment
        setVendorBalance(companyBalance);
        console.log(`Set vendorBalance for ${type}:`, companyBalance);

        // Update the vendors array with the fetched data
        setVendors((prev) => {
          const exists = prev.find((v) => v._id === partyId);
          if (!exists) {
            return [...prev, data];
          }
          return prev.map((v) => (v._id === partyId ? data : v));
        });

        // form.setValue("totalAmount", 0, { shouldValidate: true });
      }
    } catch (error) {
      console.error(`Error in handlePartyChange for ${type}:`, error);

      // Only show error if we actually tried to fetch balance (party exists in correct array)
      const shouldShowError =
        ((type === "sales" || type === "receipt") &&
          parties.find((p) => p._id === partyId)) ||
        ((type === "purchases" || type === "payment") &&
          vendors.find((v) => v._id === partyId));

      if (shouldShowError) {
        if (type === "sales" || type === "receipt") {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch customer balance.",
          });
        } else if (type === "purchases" || type === "payment") {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch vendor balance.",
          });
        }
      }

      // Clear balance states based on transaction type
      if (type === "sales" || type === "receipt") {
        setPartyBalance(null);
      } else if (type === "purchases" || type === "payment") {
        setVendorBalance(null);
      }
      setBalance(null);
    }
  };

  React.useEffect(() => {
    const currentPartyId = form.watch("party");
    console.log("🔍 DEBUG - Current party selection:", {
      currentPartyId,
      type,
      parties: parties.map((p) => ({ id: p._id, name: p.name })),
      vendors: vendors.map((v) => ({ id: v._id, name: v.vendorName })),
      transactionToEdit: transactionToEdit
        ? {
            type: transactionToEdit.type,
            party: (transactionToEdit as any).party,
            vendor: (transactionToEdit as any).vendor,
          }
        : null,
    });

    if (currentPartyId && (type === "sales" || type === "receipt")) {
      const selectedParty = parties.find((p) => p._id === currentPartyId);
      console.log("🔍 Selected Party:", selectedParty);
    } else if (currentPartyId && (type === "purchases" || type === "payment")) {
      const selectedVendor = vendors.find((v) => v._id === currentPartyId);
      console.log("🔍 Selected Vendor:", selectedVendor);
    }
  }, [form.watch("party"), type, parties, vendors, transactionToEdit]);

  // Add this useEffect to maintain customer selection when switching tabs
  React.useEffect(() => {
    const currentPartyId = form.watch("party");

    if (!currentPartyId) {
      // Clear balances if no party is selected
      setPartyBalance(null);
      setVendorBalance(null);
      setBalance(null);
      return;
    }

    // Check if the current party ID belongs to the correct entity type for the current tab
    const isCustomer = parties.find((p) => p._id === currentPartyId);
    const isVendor = vendors.find((v) => v._id === currentPartyId);

    // If we have a selected party and we're switching to sales/receipt,
    // and the party is actually a customer, fetch customer balance
    if (
      currentPartyId &&
      (type === "sales" || type === "receipt") &&
      isCustomer &&
      partyBalance === null
    ) {
      // Only fetch if we don't already have the balance and the party is a customer
      handlePartyChange(currentPartyId);
    }

    // If we have a selected party and we're switching to purchase/payment,
    // and the party is actually a vendor, fetch vendor balance
    if (
      currentPartyId &&
      (type === "purchases" || type === "payment") &&
      isVendor &&
      vendorBalance === null
    ) {
      // Only fetch if we don't already have the balance and the party is a vendor
      handlePartyChange(currentPartyId);
    }

    // If the party doesn't match the current tab type, clear the balance display
    if ((type === "sales" || type === "receipt") && !isCustomer) {
      setPartyBalance(null);
    }
    if ((type === "purchases" || type === "payment") && !isVendor) {
      setVendorBalance(null);
    }
  }, [type, form.watch("party")]);

  const handleTriggerCreateProduct = (name: string) => {
    setNewEntityName(name); // Store the name in state
    setIsProductDialogOpen(true);
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);

    // ⬇️ NEW: auto-select on the row that initiated creation
    if (creatingProductForIndex !== null) {
      form.setValue(
        `items.${creatingProductForIndex}.product`,
        newProduct._id,
        { shouldValidate: true, shouldDirty: true }
      );
      // ensure the row is a product row (defensive)
      form.setValue(`items.${creatingProductForIndex}.itemType`, "product", {
        shouldValidate: false,
      });

      // Auto-populate unit and selling price for newly created product
      if (newProduct?.unit) {
        form.setValue(
          `items.${creatingProductForIndex}.unitType`,
          newProduct.unit
        );
      }
      if (newProduct?.sellingPrice && newProduct.sellingPrice > 0) {
        form.setValue(
          `items.${creatingProductForIndex}.pricePerUnit`,
          newProduct.sellingPrice
        );
      }
    }
    setCreatingProductForIndex(null);

    toast({
      title: "Product Created",
      description: `${newProduct.name} has been added.`,
    });
    setIsProductDialogOpen(false);
  };

  const handleServiceCreated = (newService: Service) => {
    setServices((prev) => [...prev, newService]);

    // ⬇️ NEW: auto-select on the row that initiated creation
    if (creatingServiceForIndex !== null) {
      form.setValue(
        `items.${creatingServiceForIndex}.service`,
        newService._id,
        { shouldValidate: true, shouldDirty: true }
      );
      form.setValue(`items.${creatingServiceForIndex}.itemType`, "service", {
        shouldValidate: false,
      });
    }
    setCreatingServiceForIndex(null);

    toast({
      title: "Service Created",
      description: `${newService.serviceName} has been added.`,
    });
    setIsServiceDialogOpen(false);
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/units/${unitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete unit");
      }

      // Refresh units
      const unitsRes = await fetch(`${baseURL}/api/units`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (unitsRes.ok) {
        const units = await unitsRes.json();
        setExistingUnits(units);
      }

      toast({
        title: "Unit deleted",
        description: "The unit has been removed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const handleHSNSelect = async (hsnCode: HSNCode, index: number) => {
    const productId = form.watch(`items.${index}.product`);
    if (!productId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // Use PATCH to only update the HSN field
      const res = await fetch(`${baseURL}/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hsn: hsnCode.code }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update product HSN");
      }

      // Update local products state
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, hsn: hsnCode.code } : p))
      );

      toast({
        title: "HSN Updated",
        description: `HSN ${hsnCode.code} saved to product.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save HSN to product.",
      });
    }
  };

  const handleSACSelect = async (sacCode: SACCode, index: number) => {
    const serviceId = form.watch(`items.${index}.service`);
    if (!serviceId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // Use PATCH to only update the SAC field
      const res = await fetch(`${baseURL}/api/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sac: sacCode.code }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update service SAC");
      }

      // Update local services state
      setServices((prev) =>
        prev.map((s) => (s._id === serviceId ? { ...s, sac: sacCode.code } : s))
      );

      toast({
        title: "SAC Updated",
        description: `SAC ${sacCode.code} saved to service.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save SAC to service.",
      });
    }
  };

  const handleEmailInvoice = async () => {
    if (!generatedInvoice) return;

    try {
      let transactionToUse = generatedInvoice;
      // If transaction is not saved yet, save it first (but don't close form)
      if (!isTransactionSaved) {
        const result = await onSubmit(form.getValues(), false);
        if (result && result.entry) {
          const savedTransaction = result.entry;
          setSavedTransactionData(savedTransaction);
          setIsTransactionSaved(true);
          transactionToUse = savedTransaction;

          // Update the generatedInvoice with saved data
          const updatedPreview = {
            ...savedTransaction,
            company: companies.find(
              (c) =>
                c._id ===
                (savedTransaction.company?._id || savedTransaction.company)
            ),
            party: parties.find(
              (p) =>
                p._id ===
                (savedTransaction.party?._id || savedTransaction.party)
            ),
          };
          setGeneratedInvoice(updatedPreview);
          transactionToUse = updatedPreview;
        }
      } else {
        // Use the already saved transaction
        transactionToUse = savedTransactionData || generatedInvoice;
      }

      // Now send email using the existing transaction
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

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

      // Generate PDF for email
      const enrichedTransaction = enrichTransactionWithNames(
        transactionToUse,
        products,
        services
      );

      // Get template for email
      const templateRes = await fetch(
        `${baseURL}/api/settings/default-template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const templateData = await templateRes.json();
      const selectedTemplate = templateData.defaultTemplate || "template1";

      let pdfDoc;
      switch (selectedTemplate) {
        case "template1":
          pdfDoc = generatePdfForTemplate1(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template2":
          pdfDoc = generatePdfForTemplate2(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template3":
          pdfDoc = generatePdfForTemplate3(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template4":
          pdfDoc = generatePdfForTemplate4(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template5":
          pdfDoc = generatePdfForTemplate5(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template6":
          pdfDoc = generatePdfForTemplate6(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template7":
          pdfDoc = generatePdfForTemplate7(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template8":
          pdfDoc = generatePdfForTemplate8(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template11":
          pdfDoc = generatePdfForTemplate11(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template12":
          pdfDoc = generatePdfForTemplate12(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template16":
          pdfDoc = generatePdfForTemplate16(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template17":
          pdfDoc = generatePdfForTemplate17(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template18":
          pdfDoc = generatePdfForTemplate18(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template19":
          pdfDoc = generatePdfForTemplate19(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5":
          pdfDoc = generatePdfForTemplateA5(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5_2":
          pdfDoc = generatePdfForTemplateA5_2(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5_3":
          pdfDoc = generatePdfForTemplateA5_3(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5_4":
          pdfDoc = generatePdfForTemplateA5_4(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template-t3":
          pdfDoc = generatePdfForTemplatet3(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any
          );
          break;
        default:
          pdfDoc = generatePdfForTemplate1(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
      }

      const pdfInstance = await pdfDoc;
      let pdfBase64: string;

      if (pdfInstance instanceof Blob) {
        const reader = new FileReader();
        reader.readAsDataURL(pdfInstance);
        await new Promise<void>((resolve) => {
          reader.onload = () => resolve();
        });
        const dataUrl = reader.result as string;
        pdfBase64 = dataUrl.split(",")[1];
      } else if (typeof (pdfInstance as any).output === "function") {
        // It's a jsPDF instance
        pdfBase64 = (pdfInstance as any).output("datauristring").split(",")[1];
      } else {
        console.error("Unknown PDF instance type:", pdfInstance);
        throw new Error("Unsupported PDF instance type");
      }

      const subject = `Invoice From ${
        companyDoc?.businessName ?? "Your Company"
      }`;
      const bodyHtml = buildInvoiceEmailHTML({
        companyName: companyDoc?.businessName ?? "Your Company",
        partyName: partyDoc?.name ?? "Customer",
        supportEmail: companyDoc?.emailId ?? "",
        supportPhone: companyDoc?.mobileNumber ?? "",
      });

      const fileName = `${
        transactionToUse.invoiceNumber ??
        transactionToUse.referenceNumber ??
        "invoice"
      }.pdf`;

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

      // SLIDER STAYS OPEN - user must click Close button manually
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
    }
  };

  const handleDownloadInvoice = async () => {
    if (!generatedInvoice) return;

    try {
      let transactionToUse = generatedInvoice;

      // If transaction is not saved yet, save it first
      if (!isTransactionSaved) {
        const result = await onSubmit(form.getValues(), false);
        if (result && result.entry) {
          const savedTransaction = result.entry;
          setSavedTransactionData(savedTransaction);
          setIsTransactionSaved(true);
          transactionToUse = savedTransaction;
        }
      } else {
        // Use the already saved transaction
        transactionToUse = savedTransactionData || generatedInvoice;
      }

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

      const enrichedTransaction = enrichTransactionWithNames(
        transactionToUse,
        products,
        services
      );

      // Get template for download
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
      const selectedTemplate = templateData.defaultTemplate || "template1";

      // Generate PDF with actual invoice number
      let pdfDoc;
      switch (selectedTemplate) {
        case "template1":
          pdfDoc = generatePdfForTemplate1(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "template2":
          pdfDoc = generatePdfForTemplate2(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template3":
          pdfDoc = generatePdfForTemplate3(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template4":
          pdfDoc = generatePdfForTemplate4(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template5":
          pdfDoc = generatePdfForTemplate5(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template6":
          pdfDoc = generatePdfForTemplate6(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template7":
          pdfDoc = generatePdfForTemplate7(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template8":
          pdfDoc = generatePdfForTemplate8(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template11":
          pdfDoc = generatePdfForTemplate11(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template12":
          pdfDoc = generatePdfForTemplate12(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template16":
          pdfDoc = generatePdfForTemplate16(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template17":
          pdfDoc = generatePdfForTemplate17(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template18":
          pdfDoc = generatePdfForTemplate18(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template19":
          pdfDoc = generatePdfForTemplate19(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5":
          pdfDoc = generatePdfForTemplateA5(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5_2":
          pdfDoc = generatePdfForTemplateA5_2(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5_3":
          pdfDoc = generatePdfForTemplateA5_3(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "templateA5_4":
          pdfDoc = generatePdfForTemplateA5_4(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById
          );
          break;
        case "template-t3":
          pdfDoc = generatePdfForTemplatet3(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any
          );
          break;
        default:
          pdfDoc = generatePdfForTemplate1(
            enrichedTransaction,
            companyDoc as any,
            partyDoc as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
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

      // Create download link with actual invoice number
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;

      const invoiceNumber =
        transactionToUse.invoiceNumber || transactionToUse.referenceNumber;
      const fname = `Invoice-${
        invoiceNumber ||
        (transactionToUse._id ?? "INV").toString().slice(-6).toUpperCase()
      }.pdf`;
      link.download = fname;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoiceNumber} saved as ${fname}`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download invoice",
      });
    }
  };

  const handlePrintInvoice = async () => {
    if (!generatedInvoice) return;

    try {
      let transactionToUse = generatedInvoice;

      // If transaction is not saved yet, save it first
      if (!isTransactionSaved) {
        const result = await onSubmit(form.getValues(), false);
        if (result && result.entry) {
          const savedTransaction = result.entry;
          setSavedTransactionData(savedTransaction);
          setIsTransactionSaved(true);
          transactionToUse = savedTransaction;
        }
      } else {
        // Use the already saved transaction
        transactionToUse = savedTransactionData || generatedInvoice;
      }

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

      const enrichedTransaction = enrichTransactionWithNames(
        transactionToUse,
        products,
        services
      );

      // Get template and generate PDF with actual invoice number
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
      const selectedTemplate = templateData.defaultTemplate || "template1";

      let pdfDoc;
      switch (selectedTemplate) {
        case "template1":
          pdfDoc = generatePdfForTemplate1(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "template2":
          pdfDoc = generatePdfForTemplate2(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById
          );
          break;
        case "template3":
          pdfDoc = generatePdfForTemplate3(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById
          );
          break;
        case "template4":
          pdfDoc = generatePdfForTemplate4(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById
          );
          break;
        case "template5":
          pdfDoc = generatePdfForTemplate5(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById
          );
          break;
        case "template6":
          pdfDoc = generatePdfForTemplate6(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById
          );
          break;
        case "template7":
          pdfDoc = generatePdfForTemplate7(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById
          );
          break;
        case "template8":
          pdfDoc = generatePdfForTemplate8(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "template11":
          pdfDoc = generatePdfForTemplate11(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            undefined,
            generatedInvoice.bank
          );
          break;
        case "template12":
          pdfDoc = generatePdfForTemplate12(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "template16":
          pdfDoc = generatePdfForTemplate16(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress
          );
          break;
        case "template17":
          pdfDoc = generatePdfForTemplate17(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "template18":
          pdfDoc = generatePdfForTemplate18(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "template19":
          pdfDoc = generatePdfForTemplate19(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        case "templateA5":
          pdfDoc = generatePdfForTemplateA5(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank,
            null
          );
          break;
        case "templateA5_2":
          pdfDoc = generatePdfForTemplateA5_2(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank,
            null
          );
          break;
        case "templateA5_3":
          pdfDoc = generatePdfForTemplateA5_3(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank,
            null
          );
          break;
        case "templateA5_4":
          pdfDoc = generatePdfForTemplateA5_4(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank,
            null
          );
          break;
        case "template-t3":
          pdfDoc = generatePdfForTemplatet3(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
          );
          break;
        default:
          pdfDoc = generatePdfForTemplate1(
            enrichedTransaction,
            generatedInvoice.company as any,
            generatedInvoice.party as any,
            serviceNameById,
            generatedInvoice.shippingAddress,
            generatedInvoice.bank
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
            // setInvoicePreviewOpen(false);
            iframe.contentWindow?.removeEventListener("afterprint", cleanup);
          };

          iframe.contentWindow?.addEventListener("afterprint", cleanup);

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(pdfUrl);
              setInvoicePreviewOpen(false);
            }
          }, 30000);
        }, 1000);
      };

      iframe.onerror = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(pdfUrl);
        setInvoicePreviewOpen(false);
        toast({
          variant: "destructive",
          title: "Print failed",
          description: "Failed to load PDF for printing",
        });
      };
    } catch (error) {
      console.error("Print failed:", error);
      toast({
        variant: "destructive",
        title: "Print failed",
        description: "Failed to generate invoice for printing",
      });
    }
  };

  // const handleWhatsAppInvoice = async () => {
  //   if (!generatedInvoice) return;

  //   try {
  //     await onSubmit(form.getValues());
  //     const partyDoc = parties.find((p) => p._id === generatedInvoice.party);

  //     if (partyDoc?.contactNumber) {
  //       const message = `Hello ${partyDoc.name},\n\nYour invoice ${generatedInvoice.invoiceNumber} for ₹${generatedInvoice.invoiceTotal} is ready.\n\nThank you for your business!`;

  //       const encodedMessage = encodeURIComponent(message);
  //       const whatsappUrl = `https://wa.me/${partyDoc.contactNumber}?text=${encodedMessage}`;

  //       window.open(whatsappUrl, "_blank");
  //       setInvoicePreviewOpen(false);
  //       toast({
  //         title: "WhatsApp opened",
  //         description: "Invoice details ready to share",
  //       });
  //     } else {
  //       toast({
  //         variant: "destructive",
  //         title: "No contact number",
  //         description: "Customer does not have a contact number for WhatsApp",
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       variant: "destructive",
  //       title: "WhatsApp failed",
  //       description: "Failed to open WhatsApp",
  //     });
  //   }
  // };

  // const handleConfirmAndSubmit = async () => {
  //   setInvoicePreviewOpen(false);
  //   await onSubmit(form.getValues());
  // };

  const handleWhatsAppInvoice = () => {
    console.log("handleWhatsAppInvoice called");
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

  const InvoiceTemplateRenderer = ({ invoiceData }: { invoiceData: any }) => {
    const [pdfDataUrl, setPdfDataUrl] = React.useState<string>("");
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const generatePreview = async () => {
        if (!invoiceData) return;

        try {
          setLoading(true);

          const companyDoc = invoiceData.company;
          const partyDoc = invoiceData.party;
          console.log("Company data for preview:", companyDoc);
          console.log("Party data for preview:", partyDoc);
          console.log("Transaction data for preview:", invoiceData);
          console.log(
            "🔍 Shipping address in preview:",
            invoiceData.shippingAddress
          );
          console.log(
            "🔍 Same as billing in preview:",
            invoiceData.sameAsBilling
          );
          if (!companyDoc || !partyDoc) {
            console.error("Missing company or party data");
            throw new Error("Company or party data is missing");
          }

          const enrichedTransaction = enrichTransactionWithNames(
            invoiceData,
            products,
            services
          );

          // Get the selected template
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
          const selectedTemplate = templateData.defaultTemplate || "template1";
          console.log("🔍 partyDoc in preview:", partyDoc);
          console.log("🔍 partyDoc name:", partyDoc?.name);
          console.log("🔍 partyDoc contactName:", partyDoc?.contactName);
          // Generate the actual PDF
          let pdfDoc;
          switch (selectedTemplate) {
            case "template1":
              pdfDoc = generatePdfForTemplate1(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                invoiceData.shippingAddress,
                invoiceData.bank
              );
              break;
            case "template2":
              pdfDoc = generatePdfForTemplate2(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById
              );
              break;
            case "template3":
              pdfDoc = generatePdfForTemplate3(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById
              );
              break;
            case "template4":
              pdfDoc = generatePdfForTemplate4(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById
              );
              break;
            case "template5":
              pdfDoc = generatePdfForTemplate5(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById
              );
              break;
            case "template6":
              pdfDoc = generatePdfForTemplate6(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById
              );
              break;
            case "template7":
              pdfDoc = generatePdfForTemplate7(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById
              );
              break;
            case "template8":
              pdfDoc = generatePdfForTemplate8(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank
              );
              break;
            case "template11":
              pdfDoc = generatePdfForTemplate11(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                undefined,
                enrichedTransaction.bank
              );
              break;
            case "template12":
              pdfDoc = generatePdfForTemplate12(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank
              );
              break;
            case "template16":
              pdfDoc = generatePdfForTemplate16(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress
              );
              break;
            case "template17":
              pdfDoc = generatePdfForTemplate17(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank
              );
              break;
            case "template18":
              pdfDoc = generatePdfForTemplate18(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank
              );
              break;
            case "template19":
              pdfDoc = generatePdfForTemplate19(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank
              );
              break;
            case "templateA5":
              pdfDoc = generatePdfForTemplateA5(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank,
                null
              );
              break;
            case "templateA5_2":
              pdfDoc = generatePdfForTemplateA5_2(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank,
                null
              );
              break;
            case "templateA5_3":
              pdfDoc = generatePdfForTemplateA5_3(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank,
                null
              );
              break;
            case "templateA5_4":
              pdfDoc = generatePdfForTemplateA5_4(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank,
                null
              );
              break;
            case "template-t3":
              pdfDoc = generatePdfForTemplatet3(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                enrichedTransaction.shippingAddress,
                enrichedTransaction.bank
              );
              break;
            default:
              pdfDoc = generatePdfForTemplate1(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById,
                invoiceData.shippingAddress,
                invoiceData.bank
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

          // Convert to Base64 data URL instead of object URL
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            setPdfDataUrl(base64 + "#toolbar=0&navpanes=0");
          };
          reader.readAsDataURL(pdfBlob);
        } catch (error) {
          console.error("Error generating preview:", error);
          toast({
            variant: "destructive",
            title: "Preview Error",
            description: "Failed to generate invoice preview",
          });
        } finally {
          setLoading(false);
        }
      };

      generatePreview();
    }, [invoiceData]);

    if (loading) {
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

  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const getPartyOptions = () => {
    console.log("🔍 DEBUG - Generating party options:", {
      type,
      partiesCount: parties.length,
      vendorsCount: vendors.length,
      transactionToEdit: transactionToEdit
        ? {
            type: transactionToEdit.type,
            party: (transactionToEdit as any).party,
            vendor: (transactionToEdit as any).vendor,
            partyId:
              transactionToEdit.type === "sales" ||
              transactionToEdit.type === "receipt"
                ? (transactionToEdit as any).party?._id ||
                  (transactionToEdit as any).party
                : (transactionToEdit as any).vendor?._id ||
                  (transactionToEdit as any).vendor,
          }
        : null,
      formPartyValue: form.watch("party"),
    });
    if (type === "sales" || type === "receipt") {
      // All parties (customers) – no filter for balance
      const source = parties;

      // Group by name to check for duplicates
      const nameCount = source.reduce((acc, p) => {
        const name = p.name || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // For RECEIPT, show all customers regardless of balance
      return source.map((p) => {
        const name = p.name || "";
        const hasDuplicates = nameCount[name] > 1;
        const label = hasDuplicates
          ? `${name} (${p.contactNumber || ""})`
          : name;
        return {
          value: p._id,
          label: String(label),
        };
      });
    }

    if (type === "purchases" || type === "payment") {
      // vendors
      // Group by vendorName to check for duplicates
      const nameCount = vendors.reduce((acc, v) => {
        const name = v.vendorName || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return vendors.map((v) => {
        const name = v.vendorName || "";
        const hasDuplicates = nameCount[name] > 1;
        const label = hasDuplicates
          ? `${name} (${v.contactNumber || ""})`
          : name;
        return {
          value: v._id,
          label: String(label),
        };
      });
    }

    return [];
  };

  const getPartyLabel = () => {
    switch (type) {
      case "sales":
        return "Customer Name";
      case "purchases":
        return "Vendor Name";
      case "receipt":
        return "Received From";
      case "payment":
        return "Paid To";
      default:
        return "Party";
    }
  };
  console.log(products[0]);

  const partyOptions = getPartyOptions();
  const partyLabel = getPartyLabel();

  const productOptions = products.map((p) => {
    const stockNum = Number(p.stocks ?? p.stock ?? 0);

    let stockLabel;
    if (stockNum > 0) {
      stockLabel = `${stockNum} in stock`;
    } else if (stockNum < 0) {
      stockLabel = `${stockNum} in stock`;
    } else {
      stockLabel = "Out of stock";
    }

    return {
      label: `${p.name} (${stockLabel})`,
      value: p._id,
    };
  });

  // CONFIRM this code exists:
  const serviceOptions = services.map((s) => ({
    value: s._id,
    label: s.serviceName,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading form data...</p>
      </div>
    );
  }

  // Must have at least one transaction-create permission.
  const hasAnyTxnCreate =
    canSales || canPurchases || canReceipt || canPayment || canJournal;

  const hasAnyEntityCreate =
    canCreateCustomer || canCreateVendor || canCreateInventory;

  const canOpenForm = isSuper || !!transactionToEdit || hasAnyTxnCreate;

  if (!canOpenForm) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-lg font-semibold">Access denied</h2>
            <p className="text-sm text-muted-foreground">
              Your admin hasn’t granted you the permissions required to create
              transactions here.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {!hasAnyTxnCreate && (
                <li>
                  You lack permission to create
                  Sales/Purchases/Receipt/Payment/Journal.
                </li>
              )}
              {!hasAnyEntityCreate && (
                <li>
                  You lack permission to create Customers, Vendors, or Inventory
                  (Products/Services).
                </li>
              )}
            </ul>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSalesPurchasesFields = () => (
    <div className="space-y-4">
      {/* Core Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full px-3 py-2 h-10 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add Due Date Field Here */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full px-3 py-2 h-10 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select due date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    {/* Quick Date Options Sidebar */}
                    <div className="flex flex-col p-3 border-r bg-muted/50 max-w-min">
                      <div className="space-y-1 max-w-sm">
                        {[
                          { label: "7 Days", days: 7 },
                          { label: "10 Days", days: 10 },
                          { label: "15 Days", days: 15 },
                          { label: "30 Days", days: 30 },
                          { label: "45 Days", days: 45 },
                          { label: "60 Days", days: 60 },
                          { label: "90 Days", days: 90 },
                        ].map((option) => (
                          <Button
                            key={option.days}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-7 px-2"
                            onClick={() => {
                              const currentDate =
                                form.getValues("date") || new Date();
                              const dueDate = new Date(currentDate);
                              dueDate.setDate(dueDate.getDate() + option.days);
                              form.setValue("dueDate", dueDate);
                            }}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>

                      {/* Custom Date Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-7 px-2 mt-2 border-t pt-2"
                        onClick={() => {
                          // This will keep the calendar open for custom selection
                        }}
                      >
                        Custom Date
                      </Button>
                    </div>

                    {/* Calendar Section */}
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        className="p-0"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="party"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{partyLabel}</FormLabel>
              <div ref={(el) => registerField("party", el)}>
                <Combobox
                  options={partyOptions}
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value);
                    // Fetch balance for all transaction types
                    if (
                      type === "sales" ||
                      type === "purchases" ||
                      type === "receipt" ||
                      type === "payment"
                    ) {
                      handlePartyChange(value);
                    }
                  }}
                  placeholder="Select or create..."
                  searchPlaceholder="Enter Name"
                  noResultsText="No results found."
                  creatable={partyCreatable}
                  onCreate={async (name) => {
                    if (!partyCreatable) {
                      toast({
                        variant: "destructive",
                        title: "Permission denied",
                        description:
                          type === "sales" || type === "receipt"
                            ? "You don't have permission to create customers."
                            : "You don't have permission to create vendors.",
                      });
                      return "";
                    }
                    handleTriggerCreateParty(name);
                    return "";
                  }}
                  className={
                    form.formState.errors.party ? "border-red-500" : ""
                  }
                />
              </div>
              <FormMessage />

              {/* Display balance for sales transactions (Customer balance) */}
              {partyBalance != null && type === "sales" && (
                <div
                  className={cn(
                    "text-sm mt-2 font-medium p-3 rounded-lg border transition-colors",
                    partyBalance > 0
                      ? cn(
                          "text-red-600 bg-red-50 border-red-200",
                          "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                        )
                      : partyBalance < 0
                      ? cn(
                          "text-green-600 bg-green-50 border-green-200",
                          "dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                        )
                      : cn(
                          "text-gray-600 bg-gray-50 border-gray-200",
                          "dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"
                        )
                  )}
                >
                  {partyBalance > 0
                    ? `Customer needs to pay: ₹${partyBalance.toFixed(2)}`
                    : partyBalance < 0
                    ? `Customer advance payment: ₹${Math.abs(
                        partyBalance
                      ).toFixed(2)}`
                    : `Customer balance: ₹${partyBalance.toFixed(2)}`}
                </div>
              )}

              {/* Display balance for purchases transactions (Vendor balance) */}
              {vendorBalance != null && type === "purchases" && (
                <div
                  className={cn(
                    "text-sm mt-2 font-medium p-3 rounded-lg border transition-colors",
                    vendorBalance < 0 // CHANGED: Negative = Payable (Red)
                      ? cn(
                          "text-red-600 bg-red-50 border-red-200",
                          "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                        )
                      : vendorBalance > 0 // CHANGED: Positive = Advance (Green)
                      ? cn(
                          "text-green-600 bg-green-50 border-green-200",
                          "dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                        )
                      : cn(
                          "text-gray-600 bg-gray-50 border-gray-200",
                          "dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"
                        )
                  )}
                >
                  {vendorBalance < 0 // CHANGED
                    ? `You need to pay vendor: ₹${Math.abs(
                        vendorBalance
                      ).toFixed(2)}`
                    : vendorBalance > 0 // CHANGED
                    ? `Vendor advance payment: ₹${vendorBalance.toFixed(2)}`
                    : `Vendor balance: ₹${vendorBalance.toFixed(2)}`}
                </div>
              )}

              {/* Display balance for receipt transactions */}
              {partyBalance != null && type === "receipt" && (
                <div className="space-y-2 mt-2">
                  <div
                    className={cn(
                      "text-sm font-medium p-3 rounded-lg border transition-colors",
                      partyBalance > 0
                        ? cn(
                            "text-red-600 bg-red-50 border-red-200",
                            "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                          )
                        : partyBalance < 0
                        ? cn(
                            "text-green-600 bg-green-50 border-green-200",
                            "dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                          )
                        : cn(
                            "text-gray-600 bg-gray-50 border-gray-200",
                            "dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"
                          )
                    )}
                  >
                    <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Current Balance
                    </div>
                    {partyBalance > 0
                      ? `Customer needs to pay: ₹${partyBalance.toFixed(2)}`
                      : partyBalance < 0
                      ? `Customer advance payment: ₹${Math.abs(
                          partyBalance
                        ).toFixed(2)}`
                      : `Customer balance: ₹${partyBalance.toFixed(2)}`}
                  </div>
                </div>
              )}

              {/* Display balance for payment transactions */}
              {vendorBalance != null && type === "payment" && (
                <div className="space-y-2 mt-2">
                  <div
                    className={cn(
                      "text-sm font-medium p-3 rounded-lg border transition-colors",
                      vendorBalance < 0 // CHANGED: Negative = Payable (Red)
                        ? cn(
                            "text-red-600 bg-red-50 border-red-200",
                            "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                          )
                        : vendorBalance > 0 // CHANGED: Positive = Advance (Green)
                        ? cn(
                            "text-green-600 bg-green-50 border-green-200",
                            "dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                          )
                        : cn(
                            "text-gray-600 bg-gray-50 border-gray-200",
                            "dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"
                          )
                    )}
                  >
                    <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Current Balance
                    </div>
                    {vendorBalance < 0 // CHANGED
                      ? `You need to pay vendor: ₹${Math.abs(
                          vendorBalance
                        ).toFixed(2)}`
                      : vendorBalance > 0 // CHANGED
                      ? `Vendor advance payment: ₹${vendorBalance.toFixed(2)}`
                      : `Vendor balance: ₹${vendorBalance.toFixed(2)}`}
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>

              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger
                    ref={(el) => registerField("paymentMethod", el)}
                    className={
                      form.formState.errors.paymentMethod
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* {paymentMethod !== "Cash" && (
        <FormField
          control={form.control}
          name="bank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              {banks && banks.length > 0 ? (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank._id} value={bank._id}>
                        {bank.bankName}{" "}
                        {bank.company?.businessName
                          ? `(${bank.company.businessName})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  {selectedCompanyIdWatch
                    ? "No banks available for the selected company"
                    : "Select a company first"}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )} */}
      {paymentMethod !== "Cash" && (
        <FormField
          control={form.control}
          name="bank"
          render={({ field }) => {
            // Auto-select the first bank when banks are loaded and no bank is selected
            React.useEffect(() => {
              if (banks && banks.length > 0 && !field.value) {
                // If only one bank exists, auto-select it
                // If multiple banks exist, auto-select the first one
                const firstBankId = banks[0]._id;
                console.log(
                  `🔍 Auto-selecting bank: ${firstBankId} (${banks.length} banks available)`
                );
                field.onChange(firstBankId);
              }
            }, [banks, field.value]);

            return (
              <FormItem>
                <FormLabel>Bank</FormLabel>
                {banks && banks.length > 0 ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            banks.length === 1
                              ? `${banks[0].bankName} (Auto-selected)`
                              : "Select a bank"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {banks.map((bank, index) => (
                        <SelectItem key={bank._id} value={bank._id}>
                          {bank.bankName}
                          {bank.company?.businessName
                            ? ` (${bank.company.businessName})`
                            : ""}
                          {index === 0 && banks.length > 1 && " (First)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                    {selectedCompanyIdWatch
                      ? "No banks available for the selected company"
                      : "Select a company first"}
                  </div>
                )}
                <FormMessage />

                {/* Show auto-selection info */}
                {banks &&
                  banks.length > 0 &&
                  !form.formState.dirtyFields.bank && (
                    <FormDescription className="text-xs text-blue-600 dark:text-blue-400">
                      {banks.length === 1
                        ? "Only one bank available - auto-selected"
                        : "First bank auto-selected - you can change it"}
                    </FormDescription>
                  )}
              </FormItem>
            );
          }}
        />
      )}

      {/* Shipping Address Section - Only for Sales */}
      {type === "sales" && (
        <>
          <Separator />

          <div className="space-y-4 min-h-[20vh]">
            <h3 className="text-base font-medium">Shipping Address</h3>

            <FormField
              control={form.control}
              name="sameAsBilling"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          // Populate with party's billing address
                          const selectedParty = parties.find(
                            (p) => p._id === form.getValues("party")
                          );
                          if (selectedParty) {
                            form.setValue("shippingAddressDetails", {
                              label: "Billing Address",
                              address: selectedParty.address || "",
                              city: selectedParty.city || "",
                              state: selectedParty.state || "",
                              pincode: "",
                              contactNumber: selectedParty.contactNumber || "",
                            });
                            form.setValue("shippingAddress", "");
                          }
                        } else {
                          // Clear shipping address details
                          form.setValue("shippingAddressDetails", {
                            label: "",
                            address: "",
                            city: "",
                            state: "",
                            pincode: "",
                            contactNumber: "",
                          });
                          form.setValue("shippingAddress", "");
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Same as billing address
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Use the customer's billing address as the shipping address
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!form.watch("sameAsBilling") && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value && value !== "new") {
                            const selectedAddr = shippingAddresses.find(
                              (addr) => addr._id === value
                            );
                            if (selectedAddr) {
                              form.setValue("shippingAddressDetails", {
                                label: selectedAddr.label,
                                address: selectedAddr.address,
                                city: selectedAddr.city,
                                state: selectedAddr.state,
                                pincode: selectedAddr.pincode || "",
                                contactNumber: selectedAddr.contactNumber || "",
                              });
                              // Update state code for city dropdown
                              const found = indiaStates.find(
                                (s) =>
                                  s.name.toLowerCase() ===
                                  (selectedAddr.state || "").toLowerCase()
                              );
                              setShippingStateCode(found?.isoCode || null);
                            }
                          } else if (value === "new") {
                            // Clear details for new address
                            form.setValue("shippingAddressDetails", {
                              label: "",
                              address: "",
                              city: "",
                              state: "",
                              pincode: "",
                              contactNumber: "",
                            });
                            setShippingStateCode(null);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select saved address or create new" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingAddresses.map((addr) => (
                            <SelectItem key={addr._id} value={addr._id}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {addr.label} - {addr.address}, {addr.city}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingShippingAddress(addr);
                                    setEditAddressForm({
                                      label: addr.label || "",
                                      address: addr.address || "",
                                      city: addr.city || "",
                                      state: addr.state || "",
                                      pincode: addr.pincode || "",
                                      contactNumber: addr.contactNumber || "",
                                    });
                                    setIsEditShippingAddressDialogOpen(true);
                                  }}
                                ></Button>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            + Create New Address
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("shippingAddress") === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Label</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Home, Office, Warehouse"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Combobox
                            options={shippingStateOptions}
                            value={
                              shippingStateCode ??
                              shippingStateOptions.find(
                                (o) =>
                                  o.label.toLowerCase() ===
                                  (field.value || "").toLowerCase()
                              )?.value ??
                              ""
                            }
                            onChange={(iso) => {
                              setShippingStateCode(iso);
                              const selected = indiaStates.find(
                                (s) => s.isoCode === iso
                              );
                              field.onChange(selected?.name || "");
                              form.setValue("shippingAddressDetails.city", "", {
                                shouldValidate: true,
                              });
                            }}
                            placeholder="Select state"
                            searchPlaceholder="Type a state…"
                            noResultsText="No states found."
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Combobox
                            options={shippingCityOptions}
                            value={
                              shippingCityOptions.find(
                                (o) =>
                                  o.label.toLowerCase() ===
                                  (field.value || "").toLowerCase()
                              )?.value ?? ""
                            }
                            onChange={(v) => field.onChange(v)}
                            placeholder={
                              shippingStateCode
                                ? "Select city"
                                : "Select a state first"
                            }
                            searchPlaceholder="Type a city…"
                            noResultsText={
                              shippingStateCode
                                ? "No cities found."
                                : "Select a state first"
                            }
                            disabled={
                              !shippingStateCode ||
                              shippingCityOptions.length === 0
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="Pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {form.watch("shippingAddress") &&
              form.watch("shippingAddress") !== "new" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const selectedAddr = shippingAddresses.find(
                      (addr) => addr._id === form.watch("shippingAddress")
                    );
                    if (selectedAddr) {
                      setEditingShippingAddress(selectedAddr);
                      setEditAddressForm({
                        label: selectedAddr.label || "",
                        address: selectedAddr.address || "",
                        city: selectedAddr.city || "",
                        state: selectedAddr.state || "",
                        pincode: selectedAddr.pincode || "",
                        contactNumber: selectedAddr.contactNumber || "",
                      });
                      setIsEditShippingAddressDialogOpen(true);
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Address
                </Button>
              )}
          </div>
        </>
      )}

      <Separator />

      {/* Items Array */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Items & Services</h3>
        {fields.map((item, index) => (
          // <Card key={item.id} className="relative">
          <Card
            key={`item-${index}-${itemRenderKeys[index] || 0}`}
            className="relative"
          >
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-10 h-6 w-6"
                  onClick={() => {
                    const currentItem = form.getValues(`items.${index}`);
                    insert(index + 1, JSON.parse(JSON.stringify(currentItem)));
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {/* product */}

              {item.itemType === "product" ? (
                <>
                  {/* Product Selection */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <FormField
                      control={form.control}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-blue-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Product Selection
                          </FormLabel>

                          {/* <Combobox
                            options={productOptions}
                            value={field.value || ""}
                            onChange={(value) => {
                              console.log(
                                "🔍 Product selected - Value:",
                                value
                              );
                              console.log(
                                "🔍 Available products count:",
                                products.length
                              );
                              console.log("🔍 Products array:", products);
                              field.onChange(value);
                              // Auto-populate unit and selling price when product is selected
                              if (value) {
                                const selectedProduct = products.find(
                                  (p) => p._id === value
                                );
                                console.log(
                                  "🔍 Selected product:",
                                  selectedProduct
                                );
                                console.log(
                                  "🔍 Selling price:",
                                  selectedProduct?.sellingPrice
                                );
                                if (selectedProduct?.unit) {
                                  form.setValue(
                                    `items.${index}.unitType`,
                                    selectedProduct.unit
                                  );
                                }
                                if (
                                  type === "sales" &&
                                  selectedProduct?.sellingPrice &&
                                  selectedProduct.sellingPrice > 0
                                ) {
                                  form.setValue(
                                    `items.${index}.pricePerUnit`,
                                    selectedProduct.sellingPrice
                                  );
                                } else {
                                  // Product doesn't have selling price or it's 0 - reset to 0
                                  form.setValue(
                                    `items.${index}.pricePerUnit`,
                                    0
                                  );
                                }
                                // Show stock notification if stock is low
                                if (
                                  selectedProduct &&
                                  selectedProduct.stocks !== undefined
                                ) {
                                  const currentStock =
                                    Number(selectedProduct.stocks) || 0;
                                  if (currentStock <= 0) {
                                    // Show out of stock message for negative or zero stock
                                    toast({
                                      variant: "destructive",
                                      title: "Out of Stock",
                                      description: `${selectedProduct.name} is out of stock.`,
                                      duration: 4000,
                                    });
                                  } else if (currentStock <= 5) {
                                    // Show low stock message only for positive stock <= 5
                                    toast({
                                      variant: "destructive",
                                      title: "Low Stock Alert",
                                      description: `${selectedProduct.name} has only ${currentStock} units left in stock.`,
                                      duration: 4000,
                                    });
                                  }
                                }
                              }
                            }}
                            placeholder="Select or create a product..."
                            searchPlaceholder="Search products..."
                            noResultsText="No product found."
                            creatable
                            onCreate={async (name) => {
                              setCreatingProductForIndex(index);
                              handleTriggerCreateProduct(name);
                              return "";
                            }}
                          /> */}
                          <Combobox
                            options={productOptions}
                            value={field.value || ""}
                            // onChange={(value: string) => { // Explicitly type the value as string
                            //   console.log("🔍 === PRODUCT SELECTION START ===");
                            //   console.log("🔍 Product ID selected:", value);
                            //   console.log("🔍 Type of value:", typeof value);
                            //   console.log("🔍 Products array length:", products.length);

                            //   field.onChange(value);

                            //   if (value && typeof value === 'string') {
                            //     const selectedProduct = products.find((p) => p._id === value);
                            //     console.log("🔍 Found product:", selectedProduct);
                            //     console.log("🔍 Product sellingPrice:", selectedProduct?.sellingPrice);
                            //     console.log("🔍 Transaction type:", type);

                            //     if (selectedProduct?.unit) {
                            //       console.log("🔍 Setting unit to:", selectedProduct.unit);
                            //       form.setValue(`items.${index}.unitType`, selectedProduct.unit, {
                            //         shouldValidate: true,
                            //       });
                            //     }

                            //     if (type === "sales" && selectedProduct?.sellingPrice && selectedProduct.sellingPrice > 0) {
                            //       console.log("🔍 Setting pricePerUnit to:", selectedProduct.sellingPrice);
                            //       form.setValue(`items.${index}.pricePerUnit`, selectedProduct.sellingPrice, {
                            //         shouldValidate: true,
                            //         shouldDirty: true,
                            //       });

                            //       // Immediately check if the value was set
                            //       setTimeout(() => {
                            //         const currentValue = form.getValues(`items.${index}.pricePerUnit`);
                            //         console.log("🔍 Current pricePerUnit after set:", currentValue);
                            //       }, 100);
                            //     } else {
                            //       console.log("🔍 Resetting pricePerUnit to 0");
                            //       form.setValue(`items.${index}.pricePerUnit`, 0, {
                            //         shouldValidate: true,
                            //         shouldDirty: true,
                            //       });
                            //     }
                            //   } else {
                            //     console.log("🔍 Invalid value received:", value);
                            //   }
                            //   console.log("🔍 === PRODUCT SELECTION END ===");
                            // }}

                            onChange={(value: string) => {
  console.log("🔍 === PRODUCT SELECTION START ===");
  console.log("🔍 Product ID selected:", value);
  
  field.onChange(value);
  
  if (value && typeof value === "string") {
    const selectedProduct = products.find((p) => p._id === value);
    console.log("🔍 Found product:", selectedProduct);

    if (selectedProduct?.unit) {
      form.setValue(`items.${index}.unitType`, selectedProduct.unit);
    }

    if (type === "sales" && selectedProduct?.sellingPrice && selectedProduct.sellingPrice > 0) {
      const newPrice = selectedProduct.sellingPrice;
      console.log("🔍 Setting pricePerUnit to:", newPrice);
      
      // METHOD 1: Set form value
      form.setValue(`items.${index}.pricePerUnit`, newPrice, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      // METHOD 2: Direct DOM manipulation (IMMEDIATE)
      setTimeout(() => {
        // Find all price inputs for this item
        const priceInputs = document.querySelectorAll(`input[name="items.${index}.pricePerUnit"]`);
        console.log(`🔍 Found ${priceInputs.length} price inputs for item ${index}`);
        
        priceInputs.forEach((input, i) => {
          if (input instanceof HTMLInputElement) {
            console.log(`🔍 Updating input ${i} to:`, newPrice);
            input.value = newPrice.toString();
            // Trigger both input and change events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }, 10);
      
      // METHOD 3: Force multiple re-renders
      setItemRenderKeys((prev) => ({
        ...prev,
        [index]: (prev[index] || 0) + 1,
      }));
      
      // Additional re-render after DOM update
      setTimeout(() => {
        setItemRenderKeys((prev) => ({
          ...prev,
          [index]: (prev[index] || 0) + 1,
        }));
      }, 100);

    } else {
      form.setValue(`items.${index}.pricePerUnit`, 0);
      
      // Direct DOM reset
      setTimeout(() => {
        const priceInputs = document.querySelectorAll(`input[name="items.${index}.pricePerUnit"]`);
        priceInputs.forEach(input => {
          if (input instanceof HTMLInputElement) {
            input.value = "0";
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      }, 10);
      
      setItemRenderKeys((prev) => ({
        ...prev,
        [index]: (prev[index] || 0) + 1,
      }));
    }
  }
  console.log("🔍 === PRODUCT SELECTION END ===");
}}
                            placeholder="Select or create a product..."
                            searchPlaceholder="Search products..."
                            noResultsText="No product found."
                            creatable
                            onCreate={async (name) => {
                              setCreatingProductForIndex(index);
                              handleTriggerCreateProduct(name);
                              return "";
                            }}
                          />

                          <FormMessage />
                          {/* Stock Display */}
                          {/* Stock Display */}
                          {field.value &&
                            (() => {
                              const selectedProduct = products.find(
                                (p) => p._id === field.value
                              );
                              if (
                                selectedProduct &&
                                selectedProduct.stocks !== undefined &&
                                selectedProduct.stocks !== null
                              ) {
                                const currentStock =
                                  Number(selectedProduct.stocks) || 0;
                                const isOutOfStock = currentStock <= 0;
                                const isLowStock =
                                  currentStock > 0 && currentStock <= 5; // Only show low stock for positive numbers

                                return (
                                  <div
                                    className={cn(
                                      "text-sm mt-2 font-medium p-2 rounded-lg border transition-colors",
                                      isOutOfStock
                                        ? "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                                        : isLowStock
                                        ? "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800/50"
                                        : "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                                    )}
                                  >
                                    {isOutOfStock
                                      ? `Out of Stock`
                                      : isLowStock
                                      ? `Low Stock: ${currentStock} units left`
                                      : `In Stock: ${currentStock} units`}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Product Details - Responsive Layout */}
                  <div className="grid grid-cols-2 md:flex md:flex-wrap items-end md:gap-3 gap-2 md:p-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Quantity */}
                    <div className="min-w-[80px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Qty
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm px-2 tabular-nums bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                type="number"
                                min="0"
                                placeholder="1"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(
                                    e.target.value === ""
                                      ? ""
                                      : e.target.valueAsNumber
                                  );
                                  setLastEditedField((prev) => ({
                                    ...prev,
                                    [index]: "quantity",
                                  }));

                                  // Check stock when quantity is entered
                                  // Check stock when quantity is entered

                                  {
                                    /* Quantity */
                                  }
                                  <div className="min-w-[80px] flex-1">
                                    <FormField
                                      control={form.control}
                                      name={`items.${index}.quantity`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                            Qty
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              className="h-9 text-sm px-2 tabular-nums bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              type="number"
                                              min="0"
                                              placeholder="1"
                                              {...field}
                                              onChange={(e) => {
                                                const newValue =
                                                  e.target.value === ""
                                                    ? ""
                                                    : e.target.valueAsNumber;
                                                field.onChange(newValue);
                                                setLastEditedField((prev) => ({
                                                  ...prev,
                                                  [index]: "quantity",
                                                }));

                                                // Check stock when quantity is entered
                                                const productId =
                                                  form.getValues(
                                                    `items.${index}.product`
                                                  );
                                                // Convert newValue to number and check if it's greater than 0
                                                const quantityNumber =
                                                  Number(newValue) || 0;

                                                if (
                                                  productId &&
                                                  quantityNumber > 0
                                                ) {
                                                  const selectedProduct =
                                                    products.find(
                                                      (p) => p._id === productId
                                                    );
                                                  if (
                                                    selectedProduct &&
                                                    selectedProduct.stocks !==
                                                      undefined &&
                                                    selectedProduct.stocks !==
                                                      null
                                                  ) {
                                                    const currentStock =
                                                      Number(
                                                        selectedProduct.stocks
                                                      ) || 0;
                                                    const requestedQuantity =
                                                      quantityNumber;

                                                    if (currentStock <= 0) {
                                                      toast({
                                                        variant: "destructive",
                                                        title: "Out of Stock",
                                                        description: `${selectedProduct.name} is out of stock.`,
                                                        duration: 5000,
                                                      });
                                                    } else if (
                                                      requestedQuantity >
                                                      currentStock
                                                    ) {
                                                      toast({
                                                        variant: "destructive",
                                                        title:
                                                          "Insufficient Stock",
                                                        description: `You're ordering ${requestedQuantity} units but only ${currentStock} are available.`,
                                                        duration: 5000,
                                                      });
                                                    }
                                                  }
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>;
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Unit */}
                    <div className="min-w-[100px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Unit
                            </FormLabel>
                            <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={unitOpen}
                                    className="w-full h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 justify-between"
                                  >
                                    {(() => {
                                      const otherUnit = form.watch(
                                        `items.${index}.otherUnit`
                                      );
                                      if (
                                        field.value === "Other" &&
                                        otherUnit
                                      ) {
                                        return otherUnit;
                                      }
                                      return field.value
                                        ? field.value === "Other"
                                          ? "Other (Custom)"
                                          : field.value
                                        : "Select unit...";
                                    })()}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search units..." />
                                  <CommandList>
                                    <CommandEmpty>No unit found.</CommandEmpty>
                                    <CommandGroup>
                                      {unitTypes
                                        .filter((u) => u !== "Other")
                                        .map((unit) => (
                                          <CommandItem
                                            key={unit}
                                            value={unit}
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.unitType`,
                                                unit
                                              );
                                              setUnitOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === unit
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            {unit}
                                          </CommandItem>
                                        ))}
                                      {existingUnits.map((unit) => (
                                        <CommandItem
                                          key={unit._id}
                                          value={unit.name}
                                          onSelect={() => {
                                            form.setValue(
                                              `items.${index}.unitType`,
                                              unit.name
                                            );
                                            setUnitOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === unit.name
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <span className="flex-1">
                                            {unit.name}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteUnit(unit._id);
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </CommandItem>
                                      ))}
                                      <CommandItem
                                        value="Other"
                                        onSelect={() => {
                                          form.setValue(
                                            `items.${index}.unitType`,
                                            "Other"
                                          );
                                          setUnitOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === "Other"
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        Other
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Other Unit Input - Only show when "Other" is selected */}
                    {form.watch(`items.${index}.unitType`) === "Other" && (
                      <div className="max-w-[80px] flex-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.otherUnit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Specify Unit
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="e.g., Bundle, Set, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Price/Unit */}
                    {/* <div className="min-w-[90px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.pricePerUnit`}
                        render={({ field }) => {
                          const formatWithCommas = (value: number | string) => {
                            if (
                              value === "" ||
                              value === null ||
                              value === undefined
                            )
                              return "";
                            const num = Number(value);
                            if (isNaN(num)) return String(value); // ← preserve in-progress input like "50."
                            return new Intl.NumberFormat("en-IN", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }).format(num);
                          };

                          const [displayValue, setDisplayValue] = useState(
                            field.value ? formatWithCommas(field.value) : ""
                          );

                          useEffect(() => {
                            if (
                              field.value !== undefined &&
                              field.value !== null
                            ) {
                              setDisplayValue(formatWithCommas(field.value));
                            }
                          }, [field.value]);

                          return (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Price/Unit
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm px-2 tabular-nums text-right bg-white dark:bg-gray-700 
                         border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 
                         focus:border-transparent"
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={displayValue}
                                  onChange={(e) => {
                                    const rawInput = e.target.value;
                                    // Allow typing dots or partial decimals
                                    const sanitized = rawInput.replace(
                                      /,/g,
                                      ""
                                    );
                                    setDisplayValue(sanitized);

                                    const num = parseFloat(sanitized);
                                    if (!isNaN(num)) {
                                      field.onChange(num);
                                    } else if (sanitized === "") {
                                      field.onChange("");
                                    }

                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "pricePerUnit",
                                    }));
                                  }}
                                  onBlur={() => {
                                    const raw = String(displayValue).replace(
                                      /,/g,
                                      ""
                                    );
                                    const num = parseFloat(raw);
                                    if (!isNaN(num)) {
                                      setDisplayValue(
                                        formatWithCommas(num.toFixed(2))
                                      );
                                      field.onChange(num);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div> */}
                    {/* Price/Unit */}

                   {/* Price/Unit - Uncontrolled Input */}
<div className="min-w-[90px] flex-1">
  <FormField
    control={form.control}
    name={`items.${index}.pricePerUnit`}
    render={({ field }) => {
      console.log(`🔄 Price/Unit Field ${index} RENDERED - Value:`, field.value);
      
      return (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Price/Unit
          </FormLabel>
          <FormControl>
            <Input
              key={`price-${index}-${itemRenderKeys[index] || 0}`}
              className="h-9 text-sm px-2 tabular-nums text-right bg-white dark:bg-gray-700 
                       border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={field.value || ""} // Use defaultValue instead of value
              onChange={(e) => {
                const value = e.target.value === "" ? "" : Number(e.target.value);
                console.log(`📝 Price/Unit ${index} MANUAL CHANGE:`, value);
                field.onChange(value);
                setLastEditedField((prev) => ({
                  ...prev,
                  [index]: "pricePerUnit",
                }));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    }}
  />
</div>
                    {/* Amount */}
                    <div className="min-w-[120px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => {
                          const formatWithCommas = (value: number | string) => {
                            if (
                              value === "" ||
                              value === null ||
                              value === undefined
                            )
                              return "";
                            const num = Number(value);
                            if (isNaN(num)) return "";
                            return new Intl.NumberFormat("en-IN", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }).format(num);
                          };

                          // When the form value updates internally (like auto-calculated amount),
                          // sync the display value with commas.
                          const [displayValue, setDisplayValue] = useState(
                            field.value ? formatWithCommas(field.value) : ""
                          );

                          useEffect(() => {
                            // whenever react-hook-form updates amount (like from price change)
                            if (
                              field.value !== undefined &&
                              field.value !== null
                            ) {
                              setDisplayValue(formatWithCommas(field.value));
                            }
                          }, [field.value]);

                          return (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Amount
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm px-2 tabular-nums text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={displayValue}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /,/g,
                                      ""
                                    );
                                    setDisplayValue(formatWithCommas(raw));
                                    field.onChange(
                                      raw === "" ? "" : parseFloat(raw)
                                    );
                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "amount",
                                    }));
                                  }}
                                  onBlur={() => {
                                    if (displayValue) {
                                      const raw = displayValue.replace(
                                        /,/g,
                                        ""
                                      );
                                      const num = parseFloat(raw);
                                      if (!isNaN(num)) {
                                        setDisplayValue(
                                          formatWithCommas(num.toFixed(2))
                                        );
                                        field.onChange(num);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {/* HSN Code */}
                    <div className="min-w-[200px] flex-1">
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          HSN Code
                        </FormLabel>
                        {(() => {
                          const selectedProduct = products.find(
                            (p) =>
                              p._id === form.watch(`items.${index}.product`)
                          );
                          const hasHSN = selectedProduct?.hsn;

                          if (hasHSN) {
                            return (
                              <div className="h-9 flex items-center px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {selectedProduct.hsn}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <HSNSearchInput
                                onSelect={(hsnCode) =>
                                  handleHSNSelect(hsnCode, index)
                                }
                                placeholder="Search HSN..."
                              />
                            );
                          }
                        })()}
                      </FormItem>
                    </div>

                    {gstEnabled && (
                      <>
                        {/* GST % */}
                        {/* GST % */}
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.gstPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  GST %
                                </FormLabel>
                                {customGstInputs[index] ? (
                                  <div className="flex items-center gap-1">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="Enter %"
                                        className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                          const val =
                                            e.target.value === ""
                                              ? ""
                                              : Number(e.target.value);
                                          if (
                                            val === "" ||
                                            (val >= 0 && val <= 100)
                                          ) {
                                            field.onChange(val);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 px-2"
                                      onClick={() => {
                                        setCustomGstInputs((prev) => ({
                                          ...prev,
                                          [index]: false,
                                        }));
                                        field.onChange(18);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select
                                    disabled={!gstEnabled}
                                    value={String(field.value ?? 18)}
                                    onValueChange={(v) => {
                                      if (v === "custom") {
                                        setCustomGstInputs((prev) => ({
                                          ...prev,
                                          [index]: true,
                                        }));
                                        field.onChange(0);
                                      } else {
                                        field.onChange(Number(v));
                                      }
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500">
                                        <SelectValue placeholder="GST %" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {GST_OPTIONS.map((opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                          className="text-sm"
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Line Tax */}
                        <div className="min-w-[100px] flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTax`}
                            render={({ field }) => {
                              const formatWithCommas = (
                                value: number | string
                              ) => {
                                if (
                                  value === "" ||
                                  value === null ||
                                  value === undefined
                                )
                                  return "";
                                const num = Number(value);
                                if (isNaN(num)) return "";
                                return new Intl.NumberFormat("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }).format(num);
                              };

                              const [displayValue, setDisplayValue] = useState(
                                field.value ? formatWithCommas(field.value) : ""
                              );

                              // keep synced if internal logic changes tax value
                              useEffect(() => {
                                if (
                                  field.value !== undefined &&
                                  field.value !== null
                                ) {
                                  setDisplayValue(
                                    formatWithCommas(field.value)
                                  );
                                }
                              }, [field.value]);

                              return (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Tax
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      className="h-9 text-sm px-2 tabular-nums text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0.00"
                                      value={displayValue}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(
                                          /,/g,
                                          ""
                                        ); // remove commas for math
                                        setDisplayValue(formatWithCommas(raw));
                                        field.onChange(
                                          raw === "" ? "" : parseFloat(raw)
                                        );
                                        setLastEditedField((prev) => ({
                                          ...prev,
                                          [index]: "lineTotal", // keeping your same logic
                                        }));
                                      }}
                                      onBlur={() => {
                                        if (displayValue) {
                                          const raw = displayValue.replace(
                                            /,/g,
                                            ""
                                          );
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) {
                                            setDisplayValue(
                                              formatWithCommas(num.toFixed(2))
                                            );
                                            field.onChange(num);
                                          }
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        {/* Line Total */}
                        <div className="min-w-[120px] flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTotal`}
                            render={({ field }) => {
                              const formatWithCommas = (
                                value: number | string
                              ) => {
                                if (
                                  value === "" ||
                                  value === null ||
                                  value === undefined
                                )
                                  return "";
                                const num = Number(value);
                                if (isNaN(num)) return "";
                                return new Intl.NumberFormat("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }).format(num);
                              };

                              const [displayValue, setDisplayValue] = useState(
                                field.value ? formatWithCommas(field.value) : ""
                              );

                              // 🔄 keep display synced when lineTotal updates internally
                              useEffect(() => {
                                if (
                                  field.value !== undefined &&
                                  field.value !== null
                                ) {
                                  setDisplayValue(
                                    formatWithCommas(field.value)
                                  );
                                }
                              }, [field.value]);

                              return (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Total
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      className="h-9 text-sm px-2 tabular-nums text-right bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 font-medium text-blue-700 dark:text-blue-300"
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0.00"
                                      value={displayValue}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(
                                          /,/g,
                                          ""
                                        ); // remove commas
                                        setDisplayValue(formatWithCommas(raw));
                                        field.onChange(
                                          raw === "" ? "" : parseFloat(raw)
                                        );
                                        setLastEditedField((prev) => ({
                                          ...prev,
                                          [index]: "lineTotal",
                                        }));
                                      }}
                                      onBlur={() => {
                                        if (displayValue) {
                                          const raw = displayValue.replace(
                                            /,/g,
                                            ""
                                          );
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) {
                                            setDisplayValue(
                                              formatWithCommas(num.toFixed(2))
                                            );
                                            field.onChange(num);
                                          }
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Service Card */
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                  {/* Service Selection */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.service`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Service Selection
                        </FormLabel>

                        <Combobox
                          options={serviceOptions}
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            // Auto-populate amount when service is selected
                            if (value) {
                              const selectedService = services.find(
                                (s) => s._id === value
                              );
                              if (
                                type === "sales" &&
                                selectedService?.amount &&
                                selectedService.amount > 0
                              ) {
                                form.setValue(
                                  `items.${index}.amount`,
                                  selectedService.amount
                                );
                              }
                            }
                          }}
                          placeholder="Select or create a service..."
                          searchPlaceholder="Search services..."
                          noResultsText="No service found."
                          creatable={serviceCreatable}
                          onCreate={async (name) => {
                            if (!serviceCreatable) {
                              toast({
                                variant: "destructive",
                                title: "Permission denied",
                                description:
                                  "You don't have permission to create inventory.",
                              });
                              return "";
                            }

                            // Open modal to get service details including amount
                            setCreatingServiceForIndex(index);
                            setNewEntityName(name);
                            setIsServiceDialogOpen(true);
                            return "";
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Amount */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => {
                          const formatWithCommas = (value: number | string) => {
                            if (
                              value === "" ||
                              value === null ||
                              value === undefined
                            )
                              return "";
                            const num = Number(value);
                            if (isNaN(num)) return "";
                            return new Intl.NumberFormat("en-IN", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }).format(num);
                          };

                          const [displayValue, setDisplayValue] = useState(
                            field.value ? formatWithCommas(field.value) : ""
                          );

                          useEffect(() => {
                            if (
                              field.value !== undefined &&
                              field.value !== null
                            ) {
                              setDisplayValue(formatWithCommas(field.value));
                            }
                          }, [field.value]);

                          return (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Amount
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={displayValue}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /,/g,
                                      ""
                                    );
                                    // allow user to type "." for decimals
                                    if (/^\d*\.?\d*$/.test(raw)) {
                                      setDisplayValue(raw);
                                      field.onChange(
                                        raw === "" ? "" : parseFloat(raw)
                                      );
                                      setLastEditedField((prev) => ({
                                        ...prev,
                                        [index]: "amount",
                                      }));
                                    }
                                  }}
                                  onBlur={() => {
                                    if (displayValue) {
                                      const raw = displayValue.replace(
                                        /,/g,
                                        ""
                                      );
                                      const num = parseFloat(raw);
                                      if (!isNaN(num)) {
                                        setDisplayValue(
                                          formatWithCommas(num.toFixed(2))
                                        );
                                        field.onChange(num);
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Service description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* SAC Code */}
                    <div className="md:col-span-2">
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          SAC Code
                        </FormLabel>
                        {(() => {
                          const selectedService = services.find(
                            (s) =>
                              s._id === form.watch(`items.${index}.service`)
                          );
                          const hasSAC = selectedService?.sac;

                          if (hasSAC) {
                            return (
                              <div className="h-9 flex items-center px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {selectedService.sac}
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <SACSearchInput
                                onSelect={(sacCode) =>
                                  handleSACSelect(sacCode, index)
                                }
                                placeholder="Search SAC..."
                              />
                            );
                          }
                        })()}
                      </FormItem>
                    </div>

                    {gstEnabled && (
                      <>
                        {/* GST % */}
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.gstPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  GST %
                                </FormLabel>
                                {customGstInputs[index] ? (
                                  <div className="flex items-center gap-1">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="Enter %"
                                        className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                          const val =
                                            e.target.value === ""
                                              ? ""
                                              : Number(e.target.value);
                                          if (
                                            val === "" ||
                                            (val >= 0 && val <= 100)
                                          ) {
                                            field.onChange(val);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 px-2"
                                      onClick={() => {
                                        setCustomGstInputs((prev) => ({
                                          ...prev,
                                          [index]: false,
                                        }));
                                        field.onChange(18);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Select
                                    disabled={!gstEnabled}
                                    value={String(field.value ?? 18)}
                                    onValueChange={(v) => {
                                      if (v === "custom") {
                                        setCustomGstInputs((prev) => ({
                                          ...prev,
                                          [index]: true,
                                        }));
                                        field.onChange(0);
                                      } else {
                                        field.onChange(Number(v));
                                      }
                                    }}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500">
                                        <SelectValue placeholder="GST %" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {GST_OPTIONS.map((opt) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                          className="text-sm"
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Line Tax */}
                        <div className="md:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTax`}
                            render={({ field }) => {
                              const formatWithCommas = (
                                value: number | string
                              ) => {
                                if (
                                  value === "" ||
                                  value === null ||
                                  value === undefined
                                )
                                  return "";
                                const num = Number(value);
                                if (isNaN(num)) return "";
                                return new Intl.NumberFormat("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }).format(num);
                              };

                              const [displayValue, setDisplayValue] = useState(
                                field.value ? formatWithCommas(field.value) : ""
                              );

                              useEffect(() => {
                                if (
                                  field.value !== undefined &&
                                  field.value !== null
                                ) {
                                  setDisplayValue(
                                    formatWithCommas(field.value)
                                  );
                                }
                              }, [field.value]);

                              return (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Tax
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      className="h-9 px-1 text-sm text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0.00"
                                      value={displayValue}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(
                                          /,/g,
                                          ""
                                        );
                                        if (/^\d*\.?\d*$/.test(raw)) {
                                          setDisplayValue(raw);
                                          field.onChange(
                                            raw === "" ? "" : parseFloat(raw)
                                          );
                                          setLastEditedField((prev) => ({
                                            ...prev,
                                            [index]: "lineTotal",
                                          }));
                                        }
                                      }}
                                      onBlur={() => {
                                        if (displayValue) {
                                          const raw = displayValue.replace(
                                            /,/g,
                                            ""
                                          );
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) {
                                            setDisplayValue(
                                              formatWithCommas(num.toFixed(2))
                                            );
                                            field.onChange(num);
                                          }
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        {/* Line Total */}
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTotal`}
                            render={({ field }) => {
                              const formatWithCommas = (
                                value: number | string
                              ) => {
                                if (
                                  value === "" ||
                                  value === null ||
                                  value === undefined
                                )
                                  return "";
                                const num = Number(value);
                                if (isNaN(num)) return "";
                                return new Intl.NumberFormat("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(num);
                              };

                              const [displayValue, setDisplayValue] = useState(
                                field.value ? formatWithCommas(field.value) : ""
                              );

                              useEffect(() => {
                                if (
                                  field.value !== undefined &&
                                  field.value !== null
                                ) {
                                  setDisplayValue(
                                    formatWithCommas(field.value)
                                  );
                                }
                              }, [field.value]);

                              return (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Total
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      className="h-9 text-sm text-right bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50 font-medium text-green-700 dark:text-green-300"
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0.00"
                                      value={displayValue}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(
                                          /,/g,
                                          ""
                                        );
                                        if (/^\d*\.?\d*$/.test(raw)) {
                                          setDisplayValue(raw);
                                          field.onChange(
                                            raw === "" ? "" : parseFloat(raw)
                                          );
                                          setLastEditedField((prev) => ({
                                            ...prev,
                                            [index]: "lineTotal",
                                          }));
                                        }
                                      }}
                                      onBlur={() => {
                                        if (displayValue) {
                                          const raw = displayValue.replace(
                                            /,/g,
                                            ""
                                          );
                                          const num = parseFloat(raw);
                                          if (!isNaN(num)) {
                                            setDisplayValue(
                                              formatWithCommas(num.toFixed(2))
                                            );
                                            field.onChange(num);
                                          }
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => append({ ...PRODUCT_DEFAULT })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() =>
              append({
                itemType: "service",
                service: "",
                amount: 0,
                description: "",
                gstPercentage: 18, // NEW
                lineTax: 0, // NEW
                lineTotal: 0,
              })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      <Separator />

      {/* Totals and Notes (Notes only for Sales) */}
      {type === "sales" ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Notes Section - Only for Sales */}
          <div className="flex-1">
            {!showNotes ? (
              <div className="flex justify-start py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNotes(true)}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Notes
                </Button>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Notes</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotes(false)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove Notes
                      </Button>
                    </div>
                    <FormControl>
                      <QuillEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Add detailed notes with formatting..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Add rich text notes with formatting, colors, and styles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Totals */}
          <div className="w-full max-w-sm space-y-3">
            {/* Subtotal */}
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => {
                const formatWithCommas = (value: number | string) => {
                  if (value === "" || value === null || value === undefined)
                    return "";
                  const num = Number(value);
                  if (isNaN(num)) return "";
                  return new Intl.NumberFormat("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(num);
                };

                const [displayValue, setDisplayValue] = useState(
                  field.value ? formatWithCommas(field.value) : ""
                );

                // whenever subtotal updates internally → reformat
                useEffect(() => {
                  if (field.value !== undefined && field.value !== null) {
                    setDisplayValue(formatWithCommas(field.value));
                  }
                }, [field.value]);

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-medium">Subtotal</FormLabel>
                      <Input
                        type="text"
                        readOnly
                        className="w-40 text-right bg-muted"
                        value={displayValue}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* GST row only when enabled */}
            {gstEnabled && (
              <div className="flex items-center justify-between">
                <FormLabel className="font-medium">GST</FormLabel>
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => {
                    const formatWithCommas = (value: number | string) => {
                      if (value === "" || value === null || value === undefined)
                        return "";
                      const num = Number(value);
                      if (isNaN(num)) return "";
                      return new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(num);
                    };

                    const [displayValue, setDisplayValue] = useState(
                      field.value ? formatWithCommas(field.value) : ""
                    );

                    useEffect(() => {
                      if (field.value !== undefined && field.value !== null) {
                        setDisplayValue(formatWithCommas(field.value));
                      }
                    }, [field.value]);

                    return (
                      <Input
                        type="text"
                        readOnly
                        className="w-40 text-right bg-muted"
                        value={displayValue}
                      />
                    );
                  }}
                />
              </div>
            )}

            {/* Invoice total */}
            <FormField
              control={form.control}
              name="invoiceTotal"
              render={({ field }) => {
                const formatCurrency = (value: string | number) => {
                  if (value === "" || value === null || value === undefined)
                    return "";
                  const num = Number(value);
                  if (isNaN(num)) return "";
                  return (
                    "₹ " +
                    new Intl.NumberFormat("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(num)
                  );
                };

                const [displayValue, setDisplayValue] = useState(
                  field.value ? formatCurrency(field.value) : ""
                );

                useEffect(() => {
                  if (field.value !== undefined && field.value !== null) {
                    setDisplayValue(formatCurrency(field.value));
                  }
                }, [field.value]);

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-bold">
                        Invoice Total{gstEnabled ? " (GST incl.)" : ""}
                      </FormLabel>
                      <Input
                        type="text"
                        readOnly
                        className="w-40 text-right bg-muted text-lg font-bold"
                        value={displayValue}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* <FormField
              control={form.control}
              name="dontSendInvoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Don't Send Invoice
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Check this if you don't want to email the invoice to the
                      customer
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
          </div>
        </div>
      ) : (
        /* For non-sales transactions, totals on the right */
        <div className="flex justify-end">
          <div className="w-full max-w-md space-y-3">
            {/* Subtotal */}
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => {
                const formatWithCommas = (value: number | string) => {
                  if (value === "" || value === null || value === undefined)
                    return "";
                  const num = Number(value);
                  if (isNaN(num)) return "";
                  return new Intl.NumberFormat("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(num);
                };

                const [displayValue, setDisplayValue] = useState(
                  field.value ? formatWithCommas(field.value) : ""
                );

                // whenever subtotal updates internally → reformat
                useEffect(() => {
                  if (field.value !== undefined && field.value !== null) {
                    setDisplayValue(formatWithCommas(field.value));
                  }
                }, [field.value]);

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-medium">Subtotal</FormLabel>
                      <Input
                        type="text"
                        readOnly
                        className="w-40 text-right bg-muted"
                        value={displayValue}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* GST row only when enabled */}
            {gstEnabled && (
              <div className="flex items-center justify-between">
                <FormLabel className="font-medium">GST</FormLabel>
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => {
                    const formatWithCommas = (value: number | string) => {
                      if (value === "" || value === null || value === undefined)
                        return "";
                      const num = Number(value);
                      if (isNaN(num)) return "";
                      return new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(num);
                    };

                    const [displayValue, setDisplayValue] = useState(
                      field.value ? formatWithCommas(field.value) : ""
                    );

                    useEffect(() => {
                      if (field.value !== undefined && field.value !== null) {
                        setDisplayValue(formatWithCommas(field.value));
                      }
                    }, [field.value]);

                    return (
                      <Input
                        type="text"
                        readOnly
                        className="w-40 text-right bg-muted"
                        value={displayValue}
                      />
                    );
                  }}
                />
              </div>
            )}

            {/* Invoice total */}
            <FormField
              control={form.control}
              name="invoiceTotal"
              render={({ field }) => {
                const formatCurrency = (value: string | number) => {
                  if (value === "" || value === null || value === undefined)
                    return "";
                  const num = Number(value);
                  if (isNaN(num)) return "";
                  return (
                    "₹ " +
                    new Intl.NumberFormat("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(num)
                  );
                };

                const [displayValue, setDisplayValue] = useState(
                  field.value ? formatCurrency(field.value) : ""
                );

                useEffect(() => {
                  if (field.value !== undefined && field.value !== null) {
                    setDisplayValue(formatCurrency(field.value));
                  }
                }, [field.value]);

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-bold">
                        Invoice Total{gstEnabled ? " (GST incl.)" : ""}
                      </FormLabel>
                      <Input
                        type="text"
                        readOnly
                        className="w-40 text-right bg-muted text-lg font-bold"
                        value={displayValue}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* <FormField
              control={form.control}
              name="dontSendInvoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Don't Send Invoice
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Check this if you don't want to email the invoice to the
                      customer
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
          </div>
        </div>
      )}
    </div>
  );

  const renderReceiptPaymentFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full px-3 py-2 h-10 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {type === "payment" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isExpense"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      // Clear any existing errors on both fields
                      form.clearErrors("party");
                      form.clearErrors("expense");
                      if (checked) {
                        // Clear party when expense is checked
                        form.setValue("party", "", { shouldValidate: false });
                      } else {
                        // Clear expense when expense is unchecked
                        form.setValue("expense", "", { shouldValidate: false });
                      }
                      // Trigger full form validation to update field requirements
                      form.trigger();
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">Expense</FormLabel>
                  <FormDescription className="text-xs text-muted-foreground">
                    Check if this is an expense payment
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {type === "payment" && form.watch("isExpense") ? (
          <FormField
            control={form.control}
            name="expense"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Expense</FormLabel>
                  <Combobox
                    options={paymentExpenses.map((expense) => ({
                      value: expense._id,
                      label: expense.name,
                    }))}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select or create expense..."
                    searchPlaceholder="Search expenses..."
                    noResultsText="No expenses found."
                    creatable={true}
                    onCreate={async (name) => {
                      if (!name.trim()) return "";
                      try {
                        const token = localStorage.getItem("token");
                        if (!token)
                          throw new Error("Authentication token not found.");

                        const formValues = form.getValues();
                        const res = await fetch(
                          `${baseURL}/api/payment-expenses`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              name: name.trim(),
                              company: formValues.company,
                            }),
                          }
                        );

                        const data = await res.json();
                        if (!res.ok) {
                          throw new Error(
                            data.message || "Failed to create expense."
                          );
                        }

                        // Add to local state
                        setPaymentExpenses((prev) => [...prev, data.expense]);

                        toast({
                          title: "Expense Created",
                          description: `${name} has been added.`,
                        });

                        // Auto-select the newly created expense
                        form.setValue("expense", data.expense._id, {
                          shouldValidate: true,
                        });
                        return data.expense._id;
                      } catch (error) {
                        console.error("Error creating expense:", error);
                        toast({
                          variant: "destructive",
                          title: "Creation Failed",
                          description:
                            error instanceof Error
                              ? error.message
                              : "Failed to create expense.",
                        });
                        return "";
                      }
                    }}
                  />
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        ) : (
          <FormField
            control={form.control}
            name="party"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{partyLabel}</FormLabel>
                <Combobox
                  data-testid="party-combobox"
                  options={partyOptions}
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value);
                    // Fetch balance for both receipt and payment transactions
                    if (type === "receipt" || type === "payment") {
                      handlePartyChange(value);
                    }
                  }}
                  placeholder="Select or create..."
                  searchPlaceholder="Enter Name"
                  noResultsText="No results found."
                  creatable={partyCreatable}
                  onCreate={async (name) => {
                    if (!partyCreatable) {
                      toast({
                        variant: "destructive",
                        title: "Permission denied",
                        description:
                          "You don't have permission to create vendors.",
                      });
                      return "";
                    }
                    handleTriggerCreateParty(name);
                    return "";
                  }}
                />
                <FormMessage />

                {/* Display balance for receipt transactions */}
                {partyBalance != null && type === "receipt" && (
                  <div className="space-y-2 mt-2">
                    {/* Current Balance */}
                    <div
                      className={cn(
                        "text-sm font-medium p-3 rounded-lg border transition-colors",
                        partyBalance > 0
                          ? cn(
                              "text-red-600 bg-red-50 border-red-200",
                              "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                            )
                          : partyBalance < 0
                          ? cn(
                              "text-green-600 bg-green-50 border-green-200",
                              "dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                            )
                          : cn(
                              "text-gray-600 bg-gray-50 border-gray-200",
                              "dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"
                            )
                      )}
                    >
                      <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Current Balance
                      </div>
                      {partyBalance > 0
                        ? `Customer needs to pay: ₹${partyBalance.toFixed(2)}`
                        : partyBalance < 0
                        ? `Customer has paid: ₹${Math.abs(partyBalance).toFixed(
                            2
                          )}`
                        : `Customer balance: ₹${partyBalance.toFixed(2)}`}
                    </div>
                  </div>
                )}

                {/* Display balance for payment transactions */}
                {vendorBalance != null && type === "payment" && (
                  <div className="space-y-2 mt-2">
                    {/* Current Balance */}
                    <div
                      className={cn(
                        "text-sm font-medium p-3 rounded-lg border transition-colors",
                        vendorBalance > 0
                          ? cn(
                              "text-green-600 bg-green-50 border-green-200",
                              "dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50"
                            )
                          : vendorBalance < 0
                          ? cn(
                              "text-red-600 bg-red-50 border-red-200",
                              "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                            )
                          : cn(
                              "text-gray-600 bg-gray-50 border-gray-200",
                              "dark:text-gray-400 dark:bg-gray-800/50 dark:border-gray-700"
                            )
                      )}
                    >
                      <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Current Balance
                      </div>
                      {vendorBalance > 0
                        ? `You have already paid: ₹${vendorBalance.toFixed(2)}`
                        : vendorBalance < 0
                        ? `You need to pay vendor: ₹${Math.abs(
                            vendorBalance
                          ).toFixed(2)}`
                        : `Vendor balance: ₹${vendorBalance.toFixed(2)}`}
                    </div>
                  </div>
                )}
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => {
            const [displayValue, setDisplayValue] = useState(
              field.value
                ? Number(field.value).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : ""
            );

            const formatInput = (value: string) => {
              // Remove everything except digits and dot
              const cleaned = value.replace(/[^\d.]/g, "");

              // Split integer and decimal parts
              const [integerPart, decimalPart] = cleaned.split(".");
              const formattedInt = integerPart
                ? Number(integerPart).toLocaleString("en-IN")
                : "";

              return decimalPart !== undefined
                ? `${formattedInt}.${decimalPart.slice(0, 2)}` // allow max 2 decimals
                : formattedInt;
            };

            return (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="₹0.00"
                    value={displayValue}
                    onChange={(e) => {
                      const formatted = formatInput(e.target.value);
                      setDisplayValue(formatted);
                      // Send raw number to form state
                      field.onChange(formatted.replace(/,/g, ""));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethodsForReceipt.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cheque No, Ref #" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description / Narration</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the transaction..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  if (!transactionToEdit && !isSuper && allowedTypes.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">No permissions</h2>
        <p className="text-sm text-muted-foreground">
          You don’t have access to create any transactions. Please contact your
          administrator.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="xl:max-h-[80vh] md:max-h-[70vh] max-h-[60vh] overflow-y-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              await handleCreateTransactionWithPreview();
            })}
            className="contents"
            onSelect={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              // Prevent form selection on Tab key
              if (e.key === "Tab") {
                e.preventDefault();
                // Find next focusable element
                const focusableElements = document.querySelectorAll(
                  'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
                );
                const currentIndex = Array.from(focusableElements).indexOf(
                  document.activeElement as Element
                );
                const nextIndex = e.shiftKey
                  ? currentIndex - 1
                  : currentIndex + 1;
                if (nextIndex >= 0 && nextIndex < focusableElements.length) {
                  const nextElement = focusableElements[
                    nextIndex
                  ] as HTMLElement;
                  nextElement.focus();
                  // Scroll the element into view within the ScrollArea
                  nextElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                  });
                }
              }
            }}
          >
            <ScrollArea className="flex-1 overflow-auto" tabIndex={-1}>
              <div className="p-6 space-y-6 select-none">
                {/* Your existing form content remains the same */}
                <div className="w-full">
                  {/* Mobile Dropdown (hidden on desktop) */}
                  <div className="md:hidden mb-4">
                    <Select
                      value={type}
                      onValueChange={(value) =>
                        form.setValue("type", value as any)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {canSales && (
                          <SelectItem
                            value="sales"
                            disabled={!!transactionToEdit}
                          >
                            Sales
                          </SelectItem>
                        )}
                        {canPurchases && (
                          <SelectItem
                            value="purchases"
                            disabled={!!transactionToEdit}
                          >
                            Purchases
                          </SelectItem>
                        )}
                        {canReceipt && (
                          <SelectItem
                            value="receipt"
                            disabled={!!transactionToEdit}
                          >
                            Receipt
                          </SelectItem>
                        )}
                        {canPayment && (
                          <SelectItem
                            value="payment"
                            disabled={!!transactionToEdit}
                          >
                            Payment
                          </SelectItem>
                        )}
                        {canJournal && (
                          <SelectItem
                            value="journal"
                            disabled={!!transactionToEdit}
                          >
                            Journal
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop Tabs (hidden on mobile) */}
                  <div className="hidden md:block">
                    <Tabs
                      value={type}
                      onValueChange={(value) =>
                        form.setValue("type", value as any)
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-5">
                        {canSales && (
                          <TabsTrigger
                            value="sales"
                            disabled={!!transactionToEdit}
                          >
                            Sales
                          </TabsTrigger>
                        )}
                        {canPurchases && (
                          <TabsTrigger
                            value="purchases"
                            disabled={!!transactionToEdit}
                          >
                            Purchases
                          </TabsTrigger>
                        )}
                        {canReceipt && (
                          <TabsTrigger
                            value="receipt"
                            disabled={!!transactionToEdit}
                          >
                            Receipt
                          </TabsTrigger>
                        )}
                        {canPayment && (
                          <TabsTrigger
                            value="payment"
                            disabled={!!transactionToEdit}
                          >
                            Payment
                          </TabsTrigger>
                        )}
                        {canJournal && (
                          <TabsTrigger
                            value="journal"
                            disabled={!!transactionToEdit}
                          >
                            Journal
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Tab Content (same for both mobile and desktop) */}
                  <div className="pt-4 md:pt-6">
                    {type === "sales" && renderSalesPurchasesFields()}
                    {type === "purchases" && renderSalesPurchasesFields()}
                    {type === "receipt" && renderReceiptPaymentFields()}
                    {type === "payment" && renderReceiptPaymentFields()}
                    {type === "journal" && (
                      <div className="space-y-6">
                        {/* Your existing journal fields */}
                        <div className="space-y-2">
                          <h3 className="text-base font-medium pb-2 border-b">
                            Core Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <FormField
                              control={form.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        ref={(el) =>
                                          registerField("company", el)
                                        }
                                        className={
                                          form.formState.errors.company
                                            ? "border-red-500"
                                            : ""
                                        }
                                      >
                                        <SelectValue placeholder="Select a company" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {companies.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>
                                          {c.businessName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className="mb-2">
                                    Transaction Date
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full px-3 py-2 h-10 text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground",
                                            form.formState.errors.date
                                              ? "border-red-500"
                                              : ""
                                          )}
                                          ref={(el) =>
                                            registerField("date", el)
                                          }
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() ||
                                          date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-base font-medium pb-2 border-b">
                            Journal Entry
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <FormField
                              control={form.control}
                              name="fromAccount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Debit Account</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Rent Expense"
                                      {...field}
                                      ref={(el) =>
                                        registerField("fromAccount", el)
                                      }
                                      className={
                                        form.formState.errors.fromAccount
                                          ? "border-red-500"
                                          : ""
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="toAccount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credit Account</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Cash"
                                      {...field}
                                      ref={(el) =>
                                        registerField("toAccount", el)
                                      }
                                      className={
                                        form.formState.errors.toAccount
                                          ? "border-red-500"
                                          : ""
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="totalAmount"
                              render={({ field }) => {
                                const [displayValue, setDisplayValue] =
                                  useState(
                                    field.value
                                      ? Number(field.value).toLocaleString(
                                          "en-IN",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )
                                      : ""
                                  );

                                const formatInput = (value: string) => {
                                  // Keep only digits and decimal point
                                  const cleaned = value.replace(/[^\d.]/g, "");

                                  // Split integer and decimal parts
                                  const [integerPart, decimalPart] =
                                    cleaned.split(".");
                                  const formattedInt = integerPart
                                    ? Number(integerPart).toLocaleString(
                                        "en-IN"
                                      )
                                    : "";

                                  return decimalPart !== undefined
                                    ? `${formattedInt}.${decimalPart.slice(
                                        0,
                                        2
                                      )}`
                                    : formattedInt;
                                };

                                return (
                                  <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        placeholder="₹0.00"
                                        value={displayValue}
                                        ref={(el) =>
                                          registerField("totalAmount", el)
                                        }
                                        className={
                                          form.formState.errors.totalAmount
                                            ? "border-red-500"
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const formatted = formatInput(
                                            e.target.value
                                          );
                                          setDisplayValue(formatted);
                                          // Save raw number (without commas) in form state
                                          field.onChange(
                                            formatted.replace(/,/g, "")
                                          );
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-base font-medium pb-2 border-b">
                            Additional Details
                          </h3>
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Narration</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe the transaction..."
                                    {...field}
                                    ref={(el) =>
                                      registerField("description", el)
                                    }
                                    className={
                                      form.formState.errors.description
                                        ? "border-red-500"
                                        : ""
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Journal Totals (only for journal type) */}
                  {type === "journal" && (
                    <div className="flex justify-end mt-6">
                      <div className="w-full max-w-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="font-medium">Amount</FormLabel>
                          <FormField
                            control={form.control}
                            name="totalAmount"
                            render={({ field }) => {
                              // Format the value as Indian currency with commas and 2 decimals
                              const formattedValue =
                                field.value != null
                                  ? Number(field.value).toLocaleString(
                                      "en-IN",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )
                                  : "0.00";

                              return (
                                <Input
                                  type="text"
                                  readOnly
                                  className="w-40 text-right bg-muted"
                                  value={formattedValue}
                                />
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end p-6 border-t bg-background">
              <Button
                type="submit" // Changed back to submit
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {transactionToEdit ? "Save Changes" : "Create Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <Dialog open={isPartyDialogOpen} onOpenChange={setIsPartyDialogOpen}>
        <DialogContent
          wide
          className="sm:max-w-2xl grid-rows-[auto,1fr,auto] p-0 "
        >
          <DialogHeader className="p-6">
            <DialogTitle>
              Create New{" "}
              {["sales", "receipt"].includes(type) ? "Customer" : "Vendor"}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new entity to your list.
            </DialogDescription>
          </DialogHeader>
          {type === "sales" || type === "receipt" ? (
            <CustomerForm
              initialName={newEntityName}
              onSuccess={handlePartyCreated}
            />
          ) : (
            <VendorForm
              initialName={newEntityName}
              onSuccess={handlePartyCreated}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Fill in the form to add a new product.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            productType={"product"}
            onSuccess={handleProductCreated}
            initialName={newEntityName} // Add this
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Fill in the form to add a new Service.
            </DialogDescription>
          </DialogHeader>
          <ServiceForm
            onSuccess={handleServiceCreated}
            service={undefined}
            initialName={newEntityName}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={isEditShippingAddressDialogOpen}
        onOpenChange={setIsEditShippingAddressDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
            <DialogDescription>
              Update the shipping address details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address Label</label>
                <Input
                  placeholder="e.g., Home, Office, Warehouse"
                  value={editAddressForm.label}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  placeholder="Contact number"
                  value={editAddressForm.contactNumber}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      contactNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                placeholder="Full address"
                value={editAddressForm.address}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Combobox
                  options={shippingStateOptions}
                  value={
                    shippingStateOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.state.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(iso) => {
                    const selected = indiaStates.find((s) => s.isoCode === iso);
                    setEditAddressForm((prev) => ({
                      ...prev,
                      state: selected?.name || "",
                      city: "", // Reset city when state changes
                    }));
                  }}
                  placeholder="Select state"
                  searchPlaceholder="Type a state…"
                  noResultsText="No states found."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Combobox
                  options={shippingCityOptions}
                  value={
                    shippingCityOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.city.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(v) =>
                    setEditAddressForm((prev) => ({ ...prev, city: v }))
                  }
                  placeholder={
                    editAddressForm.state
                      ? "Select city"
                      : "Select a state first"
                  }
                  searchPlaceholder="Type a city…"
                  noResultsText={
                    editAddressForm.state
                      ? "No cities found."
                      : "Select a state first"
                  }
                  disabled={
                    !editAddressForm.state || shippingCityOptions.length === 0
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode</label>
              <Input
                placeholder="Pincode"
                value={editAddressForm.pincode}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditShippingAddressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  if (!token)
                    throw new Error("Authentication token not found.");

                  const updatedAddress = {
                    ...editingShippingAddress,
                    ...editAddressForm,
                  };

                  const res = await fetch(
                    `${baseURL}/api/shipping-addresses/${editingShippingAddress._id}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(updatedAddress),
                    }
                  );

                  if (res.ok) {
                    const data = await res.json();
                    // Update the address in the local state
                    setShippingAddresses((prev) =>
                      prev.map((addr) =>
                        addr._id === editingShippingAddress._id
                          ? data.shippingAddress
                          : addr
                      )
                    );
                    toast({
                      title: "Address Updated",
                      description:
                        "Shipping address has been updated successfully.",
                    });
                    setIsEditShippingAddressDialogOpen(false);
                  } else {
                    throw new Error("Failed to update shipping address");
                  }
                } catch (error) {
                  console.error("Error updating shipping address:", error);
                  toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Failed to update shipping address.",
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditShippingAddressDialogOpen}
        onOpenChange={setIsEditShippingAddressDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
            <DialogDescription>
              Update the shipping address details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address Label</label>
                <Input
                  placeholder="e.g., Home, Office, Warehouse"
                  value={editAddressForm.label}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  placeholder="Contact number"
                  value={editAddressForm.contactNumber}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      contactNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                placeholder="Full address"
                value={editAddressForm.address}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Combobox
                  options={shippingStateOptions}
                  value={
                    shippingStateOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.state.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(iso) => {
                    const selected = indiaStates.find((s) => s.isoCode === iso);
                    setEditAddressForm((prev) => ({
                      ...prev,
                      state: selected?.name || "",
                      city: "", // Reset city when state changes
                    }));
                  }}
                  placeholder="Select state"
                  searchPlaceholder="Type a state…"
                  noResultsText="No states found."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Combobox
                  options={shippingCityOptions}
                  value={
                    shippingCityOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.city.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(v) =>
                    setEditAddressForm((prev) => ({ ...prev, city: v }))
                  }
                  placeholder={
                    editAddressForm.state
                      ? "Select city"
                      : "Select a state first"
                  }
                  searchPlaceholder="Type a city…"
                  noResultsText={
                    editAddressForm.state
                      ? "No cities found."
                      : "Select a state first"
                  }
                  disabled={
                    !editAddressForm.state || shippingCityOptions.length === 0
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode</label>
              <Input
                placeholder="Pincode"
                value={editAddressForm.pincode}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditShippingAddressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  if (!token)
                    throw new Error("Authentication token not found.");

                  const updatedAddress = {
                    ...editingShippingAddress,
                    ...editAddressForm,
                  };

                  const res = await fetch(
                    `${baseURL}/api/shipping-addresses/${editingShippingAddress._id}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(updatedAddress),
                    }
                  );

                  if (res.ok) {
                    const data = await res.json();
                    // Update the address in the local state
                    setShippingAddresses((prev) =>
                      prev.map((addr) =>
                        addr._id === editingShippingAddress._id
                          ? data.shippingAddress
                          : addr
                      )
                    );
                    toast({
                      title: "Address Updated",
                      description:
                        "Shipping address has been updated successfully.",
                    });
                    setIsEditShippingAddressDialogOpen(false);
                  } else {
                    throw new Error("Failed to update shipping address");
                  }
                } catch (error) {
                  console.error("Error updating shipping address:", error);
                  toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Failed to update shipping address.",
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* invoice preview slider */}

      <Sheet open={invoicePreviewOpen} onOpenChange={setInvoicePreviewOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[800px] lg:max-w-5xl overflow-y-auto p-0 [&>button]:hidden"
        >
          <div className="flex flex-col h-full">
            {/* Header - Mobile Responsive */}
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
                </div>
              </SheetTitle>
            </SheetHeader>

            {/* Desktop: Show Invoice Preview */}
            <div className="hidden sm:flex flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
              {generatedInvoice && (
                <div className="w-full max-w-5xl mx-auto">
                  <InvoiceTemplateRenderer invoiceData={generatedInvoice} />
                </div>
              )}
            </div>

            {/* Mobile: Show Action Buttons Only */}
            <div className="sm:hidden flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
              {generatedInvoice && (
                <div className="text-center space-y-6 w-full">
                  <div className="space-y-2">
                    <Download className="w-16 h-16 text-blue-500 mx-auto" />
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

                  {/* All Action Buttons for Mobile */}
                  <div className="flex flex-col gap-3 w-full text-center justify-center items-center">
                    <Button
                      onClick={handleWhatsAppInvoice}
                      className="w-[50%] bg-gradient-to-r from-green-600 to-green-700 text-white py-3 text-base dark:bg-yellow-700, dark:hover:bg-green-800 px-2"
                      size="lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Whatsapp Invoice
                    </Button>

                    <Button
                      onClick={handleDownloadInvoice}
                      className="w-[50%] bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-3 text-base dark:bg-yellow-700, dark:hover:bg-yellow-800 px-2"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </Button>

                    <Button
                      onClick={handleEmailInvoice}
                      className="w-[50%] bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 text-base dark:bg-orange-700, dark:hover:bg-orange-800"
                      size="lg"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Email Invoice
                    </Button>

                    <Button
                      onClick={handlePrintInvoice}
                      variant="outline"
                      className="w-[50%] bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white hover:bg-green-50 py-3 text-base dark:bg-blue-700, dark:hover:bg-blue-800"
                      size="lg"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      Print Invoice
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-white">
                    The invoice will open in your device's default PDF viewer
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons Footer - Desktop Only */}
            <div className="hidden sm:block border-t bg-white p-6 dark:bg-gray-800">
              <div className="flex justify-between items-center gap-3">
                {/* Close Button */}
                <Button
                  onClick={() => {
                    setInvoicePreviewOpen(false);
                    onFormSubmit();
                  }}
                  variant="ghost"
                  className="text-black bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 hover:text-gray-700 p-3 gap-1 dark:text-white"
                  size="lg"
                >
                  <X className="w-5 h-5" />
                  Close
                </Button>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleWhatsAppInvoice}
                    className="w-[50%] bg-gradient-to-r from-green-600 to-green-700 text-white py-3 text-base dark:bg-yellow-700, dark:hover:bg-green-800 px-2"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Whatsapp Invoice
                  </Button>
                  <Button
                    onClick={handleEmailInvoice}
                    className="p-3 gap-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white "
                    size="lg"
                  >
                    <Mail className="w-5 h-5 mr-2 text-white" />
                    Email
                  </Button>

                  <Button
                    onClick={handleDownloadInvoice}
                    variant="outline"
                    className="p-3 gap-1 bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-200 text-white hover:bg-yellow-50 hover:text-yellow-800"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </Button>

                  <Button
                    onClick={handlePrintInvoice}
                    variant="outline"
                    className="p-3 gap-1 bg-gradient-to-r from-green-600 to-green-700 border-green-200 text-white hover:bg-green-50 hover:text-green-800"
                    size="lg"
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Footer with Close Button Only */}
            <div className="sm:hidden border-t bg-white p-4 dark:bg-gray-800">
              <Button
                onClick={() => {
                  setInvoicePreviewOpen(false);
                  onFormSubmit();
                }}
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

      {/* Service Creation Modal - Add this at the end */}
      {serviceCreationModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Service</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Service Name
                </label>
                <Input
                  value={serviceCreationModal.name}
                  onChange={(e) =>
                    setServiceCreationModal((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceCreationModal.amount}
                  onChange={(e) =>
                    setServiceCreationModal((prev) => ({
                      ...prev,
                      amount:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() =>
                    setServiceCreationModal({
                      open: false,
                      name: "",
                      index: null,
                      amount: 0,
                    })
                  }
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const { name, amount, index } = serviceCreationModal;

                    try {
                      const token = localStorage.getItem("token");
                      if (!token)
                        throw new Error("Authentication token not found.");

                      const res = await fetch(`${baseURL}/api/services`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          serviceName: name.trim(),
                          amount: amount,
                          company: selectedCompanyIdWatch,
                        }),
                      });

                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(
                          data.message || "Failed to create service."
                        );
                      }

                      // Add to local state
                      setServices((prev) => [...prev, data.service]);

                      // Set form values if index is provided
                      if (index !== null) {
                        form.setValue(
                          `items.${index}.service`,
                          data.service._id,
                          { shouldValidate: true, shouldDirty: true }
                        );
                        form.setValue(`items.${index}.itemType`, "service", {
                          shouldValidate: false,
                        });
                        form.setValue(`items.${index}.amount`, amount);
                      }

                      toast({
                        title: "Service Created",
                        description: `${name} has been added.`,
                      });

                      setServiceCreationModal({
                        open: false,
                        name: "",
                        index: null,
                        amount: 0,
                      });
                    } catch (error) {
                      console.error("Error creating service:", error);
                      toast({
                        variant: "destructive",
                        title: "Creation Failed",
                        description:
                          error instanceof Error
                            ? error.message
                            : "Failed to create service.",
                      });
                    }
                  }}
                >
                  Create Service
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Composer Dialog */}
      <WhatsAppComposerDialog
        isOpen={whatsappComposerOpen}
        onClose={() => setWhatsappComposerOpen(false)}
        transaction={generatedInvoice}
        party={generatedInvoice?.party}
        company={generatedInvoice?.company}
        products={products} // Pass the products array
        services={services}
        onGeneratePdf={async (transaction, party, company) => {
          // Use your existing PDF generation logic here
          const { generatePdfForTemplate1 } = await import(
            "@/lib/pdf-template1"
          );
          return await generatePdfForTemplate1(
            transaction,
            company,
            party,
            serviceNameById
          );
        }}
        serviceNameById={serviceNameById}
        className="z-[100]"
      />
    </>
  );
}
