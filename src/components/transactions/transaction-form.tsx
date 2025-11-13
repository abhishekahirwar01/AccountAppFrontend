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
  FileText,
} from "lucide-react";
import { format } from "date-fns";
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
import { getUnifiedLines } from "@/lib/getUnifiedLines";
import { Badge } from "@/components/ui/badge";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { State, City } from "country-state-city";
import { ReceiptPaymentFields } from "@/components/transactions/ReceiptPaymentFields";
import { SalesPurchaseFields } from "@/components/transactions/SalesPurchasesSection";
import { InvoiceActions } from "@/components/invoices/invoice-actions";

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
const STANDARD_GST = 18;

type StockItemInput = { product: string; quantity: number };

interface BankDetail {
  _id: string;
  client: string;
  company: string | Company;
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
  gstPercentage: STANDARD_GST,
  lineTax: 0,
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
      .optional(),
    description: z.string().optional(),
    customPaymentMethod: z.string().optional(),
    referenceNumber: z.string().optional(),
    fromAccount: z.string().optional(),
    toAccount: z.string().optional(),
    narration: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentMethodsForReceipt: z.string().optional(),
    taxAmount: z.coerce.number().min(0).optional(),
    invoiceTotal: z.coerce.number().min(0).optional(),
    subTotal: z.coerce.number().min(0).optional(),
    dontSendInvoice: z.boolean().optional(),
    bank: z.string().optional(),
    notes: z.string().optional(),
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
      path: ["fromAccount"],
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
  defaultType?: "sales" | "purchases" | "receipt" | "payment" | "journal";
  serviceNameById: Map<string, string>;
  transaction: any;
  party: any;
  company: any;
  prefillFrom?: Transaction | null;
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
  const [partyBalance, setPartyBalance] = React.useState<number | null>(null);
  const [vendorBalance, setVendorBalance] = React.useState<number | null>(null);
  const [banks, setBanks] = React.useState<any[]>([]);
  const [paymentExpenses, setPaymentExpenses] = React.useState<any[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [newExpenseName, setNewExpenseName] = React.useState("");
  const [partyBalances, setPartyBalances] = React.useState<
    Record<string, number>
  >({});
  const [creatingProductForIndex, setCreatingProductForIndex] = React.useState<
    number | null
  >(null);
  const [creatingServiceForIndex, setCreatingServiceForIndex] = React.useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showNotes, setShowNotes] = React.useState(false);
  const [existingUnits, setExistingUnits] = React.useState<any[]>([]);
  const [unitOpen, setUnitOpen] = React.useState(false);
  const [originalQuantities, setOriginalQuantities] = React.useState<
    Map<string, number>
  >(new Map());
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
  const [customGstInputs, setCustomGstInputs] = React.useState<
    Record<number, boolean>
  >({});
  const [generatedInvoice, setGeneratedInvoice] = React.useState<any>(null);
  const [isTransactionSaved, setIsTransactionSaved] = React.useState(false);
  const [savedTransactionData, setSavedTransactionData] =
    React.useState<any>(null);
  const [lastEditedField, setLastEditedField] = React.useState<
    Record<number, "quantity" | "pricePerUnit" | "amount" | "lineTotal">
  >({});
  const [forceUpdate, setForceUpdate] = React.useState(0);
  const [itemRenderKeys, setItemRenderKeys] = React.useState<{
    [key: number]: number;
  }>({});

  // ✅ NEW STATES FOR INVOICE ACTIONS
  const [invoicePreviewOpen, setInvoicePreviewOpen] = React.useState(false);

  const { selectedCompanyId } = useCompany();
  const { permissions: userCaps } = useUserPermissions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: React.useMemo(() => {
      if (prefillFrom) {
        let prefillItems: any[] = [];

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
                quantity: undefined,
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
          type: "sales",
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
  }, []);

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

  const partyCreatable = React.useMemo(() => {
    if (type === "sales" || type === "receipt") return canCreateCustomer;
    if (type === "purchases" || type === "payment") return canCreateVendor;
    return false;
  }, [type, canCreateCustomer, canCreateVendor]);

  const serviceCreatable = canCreateInventory;

  const handleNewTransaction = () => {
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

    setPartyBalance(null);
    setVendorBalance(null);
    setBalance(null);
    setShippingAddresses([]);
    setShowNotes(false);
    setGeneratedInvoice(null);
    setIsTransactionSaved(false);
    setInvoicePreviewOpen(false);
  };

  React.useEffect(() => {
    if (type === "sales" || type === "purchases") {
      if (!form.getValues("items")?.length) {
        replace([PRODUCT_DEFAULT]);
      }
    } else {
      if (form.getValues("items")?.length) {
        replace([]);
      }
    }
  }, [type, replace, form]);

 React.useEffect(() => {
  console.log("🔄 CALCULATION TRIGGERED - Purchases Debug:", {
    type,
    watchedItems: watchedItems?.length,
    gstEnabled,
    hasLastEditedField: Object.keys(lastEditedField).length > 0
  });

  if (!watchedItems || !["sales", "purchases"].includes(type)) {
    console.log("❌ CALCULATION SKIPPED");
    return;
  }

  let subTotal = 0;
  let totalTax = 0;

  watchedItems.forEach((it: any, idx: number) => {
    if (!it) return;

    let base = 0;
    let lineTax = 0;
    let lineTotal = 0;
    const lastEdited = lastEditedField[idx];

    console.log(`📦 Item ${idx}:`, {
      itemType: it.itemType,
      quantity: it.quantity,
      pricePerUnit: it.pricePerUnit,
      amount: it.amount,
      lastEdited
    });

    if (it.itemType === "product") {
      const q = Number(it.quantity) || 0;
      const p = Number(it.pricePerUnit) || 0;
      const amt = Number(it.amount) || 0;
      const lineTot = Number(it.lineTotal) || 0;
      const pct = gstEnabled ? Number(it?.gstPercentage ?? 18) : 0;

      if (lastEdited === "lineTotal") {
        lineTotal = lineTot;
        base = +(lineTotal / (1 + pct / 100)).toFixed(2);
        lineTax = +(lineTotal - base).toFixed(2);

        if (base !== amt) {
          form.setValue(`items.${idx}.amount`, base, {
            shouldValidate: false,
          });
        }

        if (q !== 0) {
          const calculatedPrice = +(base / q).toFixed(2);
          if (calculatedPrice !== p) {
            form.setValue(`items.${idx}.pricePerUnit`, calculatedPrice, {
              shouldValidate: false,
            });
          }
        }
      } else if (lastEdited === "amount") {
        base = amt;
        lineTax = +((base * pct) / 100).toFixed(2);
        lineTotal = +(base + lineTax).toFixed(2);

        if (q !== 0) {
          const calculatedPrice = +(base / q).toFixed(2);
          if (calculatedPrice !== p) {
            form.setValue(`items.${idx}.pricePerUnit`, calculatedPrice, {
              shouldValidate: false,
            });
          }
        }
      } else if (lastEdited === "quantity") {
        base = +(q * p).toFixed(2);
        lineTax = +((base * pct) / 100).toFixed(2);
        lineTotal = +(base + lineTax).toFixed(2);

        if (base !== amt) {
          form.setValue(`items.${idx}.amount`, base, {
            shouldValidate: false,
          });
        }
      } else if (lastEdited === "pricePerUnit") {
        base = +(q * p).toFixed(2);
        lineTax = +((base * pct) / 100).toFixed(2);
        lineTotal = +(base + lineTax).toFixed(2);

        if (base !== amt) {
          form.setValue(`items.${idx}.amount`, base, {
            shouldValidate: false,
          });
        }
      } else {
        // Default calculation when no specific field was edited
        if (amt > 0 && q > 0) {
          base = amt;
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);

          const calculatedPrice = +(base / q).toFixed(2);
          if (calculatedPrice !== p) {
            form.setValue(`items.${idx}.pricePerUnit`, calculatedPrice, {
              shouldValidate: false,
            });
          }
        } else {
          base = +(q * p).toFixed(2);
          lineTax = +((base * pct) / 100).toFixed(2);
          lineTotal = +(base + lineTax).toFixed(2);

          if (base !== amt) {
            form.setValue(`items.${idx}.amount`, base, {
              shouldValidate: false,
            });
          }
        }
      }
    } else if (it.itemType === "service") {
      const amt = Number(it.amount) || 0;
      const lineTot = Number(it.lineTotal) || 0;
      const pct = gstEnabled ? Number(it?.gstPercentage ?? 18) : 0;

      if (lastEdited === "lineTotal") {
        lineTotal = lineTot;
        base = +(lineTotal / (1 + pct / 100)).toFixed(2);
        lineTax = +(lineTotal - base).toFixed(2);

        if (base !== amt) {
          form.setValue(`items.${idx}.amount`, base, {
            shouldValidate: false,
          });
        }
      } else {
        base = amt;
        lineTax = +((base * pct) / 100).toFixed(2);
        lineTotal = +(base + lineTax).toFixed(2);
      }
    }

    subTotal += base;
    totalTax += lineTax;

    const currentLineTax = Number(form.getValues(`items.${idx}.lineTax`)) || 0;
    const currentLineTotal = Number(form.getValues(`items.${idx}.lineTotal`)) || 0;

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

  console.log("📊 FINAL CALCULATION RESULTS:", {
    subTotal,
    totalTax,
    invoiceTotal,
    currentTotalAmount: form.getValues("totalAmount"),
    currentTaxAmount: form.getValues("taxAmount"),
    currentInvoiceTotal: form.getValues("invoiceTotal")
  });

  // Force update the form values
  if ((Number(form.getValues("totalAmount")) || 0) !== subTotal) {
    form.setValue("totalAmount", subTotal, { shouldValidate: true });
  }
  if ((Number(form.getValues("taxAmount")) || 0) !== totalTax) {
    form.setValue("taxAmount", totalTax, { shouldValidate: false });
  }
  if ((Number(form.getValues("invoiceTotal")) || 0) !== invoiceTotal) {
    form.setValue("invoiceTotal", invoiceTotal, { shouldValidate: false });
  }

  // Force re-render
  setForceUpdate(prev => prev + 1);

}, [watchedItems, type, gstEnabled, form, lastEditedField]);

  const loadPartyBalances = React.useCallback(
    async (list: Party[]) => {
      const token = localStorage.getItem("token");
      if (!token || !Array.isArray(list) || list.length === 0) return;

      try {
        const bulk = await fetch(`${baseURL}/api/parties/balances`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bulk.ok) {
          const data = await bulk.json();
          const map = (data && (data.balances as Record<string, number>)) || {};
          setPartyBalances(map);
          return;
        }
      } catch {}

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
          let banksData = data;

          if (data && data.banks) {
            banksData = data.banks;
          } else if (Array.isArray(data)) {
            banksData = data;
          } else {
            banksData = [];
          }

          const filteredBanks = banksData.filter((bank: any) => {
            const bankCompanyId =
              bank.company?._id || bank.company || bank.companyId;

            return bankCompanyId === companyId;
          });

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
  );

  React.useEffect(() => {
    if (selectedCompanyIdWatch) {
      fetchBanks(selectedCompanyIdWatch);
      fetchPaymentExpenses(selectedCompanyIdWatch);
    } else {
      setBanks([]);
      setPaymentExpenses([]);
    }
  }, [selectedCompanyIdWatch, fetchBanks]);

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
        loadPartyBalances(list);
      } else {
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
      setPaymentExpenses(
        Array.isArray(paymentExpensesData.data)
          ? paymentExpensesData.data
          : paymentExpensesData.expenses || []
      );

      if (companiesData.length > 0 && !transactionToEdit) {
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
      gstPercentage: p.gstPercentage ?? 18,
      lineTax: p.lineTax ?? 0,
      lineTotal: p.lineTotal ?? p.amount,
    });

    const toServiceId = (s: any) => {
      const raw =
        (s.service &&
          (typeof s.service === "object" ? s.service._id : s.service)) ??
        (s.serviceName &&
          (typeof s.serviceName === "object"
            ? s.serviceName._id
            : s.serviceName)) ??
        s.serviceId;

      return raw ? String(raw) : "";
    };

    const toServiceItem = (s: any) => ({
      itemType: "service" as const,
      service: toServiceId(s),
      description: s.description ?? "",
      amount: Number(s.amount || 0),
      gstPercentage: s.gstPercentage ?? 18,
      lineTax: s.lineTax ?? 0,
      lineTotal: s.lineTotal ?? s.amount,
    });

    const toUnifiedItem = (i: any) => ({
      itemType:
        (i.itemType as "product" | "service") ??
        (i.product || i.productId
          ? "product"
          : i.service || i.serviceName
          ? "service"
          : "product"),
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

    let itemsToSet: any[] = [];

    if (
      Array.isArray((transactionToEdit as any).items) &&
      (transactionToEdit as any).items.length
    ) {
      itemsToSet = (transactionToEdit as any).items.map(toUnifiedItem);
    } else {
      const prodArr = Array.isArray((transactionToEdit as any).products)
        ? (transactionToEdit as any).products.map(toProductItem)
        : [];

      const svcPlural = Array.isArray((transactionToEdit as any).services)
        ? (transactionToEdit as any).services.map(toServiceItem)
        : [];

      const svcLegacy = Array.isArray((transactionToEdit as any).service)
        ? (transactionToEdit as any).service.map(toServiceItem)
        : [];

      itemsToSet = [...prodArr, ...svcPlural, ...svcLegacy];
    }

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

    let partyId: string | undefined;

    if (
      transactionToEdit.type === "sales" ||
      transactionToEdit.type === "receipt"
    ) {
      partyId = (transactionToEdit as any).party
        ? typeof (transactionToEdit as any).party === "object"
          ? (transactionToEdit as any).party._id
          : (transactionToEdit as any).party
        : undefined;
    } else if (
      transactionToEdit.type === "purchases" ||
      transactionToEdit.type === "payment"
    ) {
      partyId = (transactionToEdit as any).vendor
        ? typeof (transactionToEdit as any).vendor === "object"
          ? (transactionToEdit as any).vendor._id
          : (transactionToEdit as any).vendor
        : undefined;
    }

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

    if (
      (transactionToEdit as any).notes &&
      (transactionToEdit as any).notes.trim()
    ) {
      setShowNotes(true);
    }

    replace(itemsToSet);

    const origMap = new Map<string, number>();
    itemsToSet.forEach((item: any) => {
      if (item.product) {
        origMap.set(item.product, Number(item.quantity) || 0);
      }
    });
    setOriginalQuantities(origMap);
  }, [transactionToEdit, form, replace, isLoading]);

  React.useEffect(() => {
    if (transactionToEdit) return;
    const current = form.getValues("type");
    if (!allowedTypes.includes(current)) {
      form.setValue("type", allowedTypes[0] ?? "sales");
    }
  }, [allowedTypes, transactionToEdit, form]);

  const isInitialLoad = React.useRef(true);

  React.useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const currentType = form.getValues("type");
    const items = form.getValues("items");

    if (items && items.length > 0) {
      const updatedItems = items.map((item: any) => {
        if (item.itemType === "product") {
          return {
            ...item,
            pricePerUnit: 0,
            amount: 0,
            lineTax: 0,
            lineTotal: 0,
          };
        }
        return item;
      });

      form.setValue("items", updatedItems);

      form.setValue("totalAmount", 0);
      form.setValue("taxAmount", 0);
      form.setValue("invoiceTotal", 0);
    }
  }, [type, form]);

  React.useEffect(() => {
    if (transactionToEdit && banks.length > 0) {
      const bankValue = form.getValues("bank");
      if (bankValue) {
        const bankExists = banks.some((bank) => bank._id === bankValue);
        if (!bankExists) {
          form.setValue("bank", "");
        }
      }
    }
  }, [banks, transactionToEdit, form]);

  React.useEffect(() => {
    const partyId = form.watch("party");
    if (partyId && type === "sales") {
      fetchShippingAddresses(partyId);
    }
  }, [form.watch("party"), type, fetchShippingAddresses]);

  React.useEffect(() => {
    const partyId = form.watch("party");
    if (partyId && selectedCompanyIdWatch) {
      handlePartyChange(partyId);
    }
  }, [selectedCompanyIdWatch, form.watch("party"), type]);

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
          const found = indiaStates.find(
            (s) =>
              s.name.toLowerCase() === (selectedAddr.state || "").toLowerCase()
          );
          setShippingStateCode(found?.isoCode || null);
        }
      }
    }
  }, [transactionToEdit, shippingAddresses, form, indiaStates]);

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

  const enrichTransactionWithNames = (
    transaction: any,
    products: Product[],
    services: Service[]
  ) => {
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

  function buildInvoiceEmailHTML(opts: {
    companyName: string;
    partyName?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    logoUrl?: string | null;
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
        const result = await onSubmit(values, false);

        if (result && result.entry) {
          const savedTransaction = result.entry;

          setSavedTransactionData(savedTransaction);
          setIsTransactionSaved(true);

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
              }
            } catch (error) {
              console.error("Error fetching party details:", error);
            }
          }

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
              } else {
                bankDetails = banks.find((bank) => bank._id === bankId);
              }
            } catch (error) {
              console.error("Error fetching bank details:", error);
              bankDetails = banks.find((bank) => bank._id === bankId);
            }
          }

          let shippingAddressData = null;

          if (!values.sameAsBilling) {
            if (values.shippingAddress && values.shippingAddress !== "new") {
              shippingAddressData = shippingAddresses.find(
                (addr) => addr._id === values.shippingAddress
              );
            } else if (
              values.shippingAddress === "new" &&
              values.shippingAddressDetails
            ) {
              shippingAddressData = {
                _id: "new-address",
                ...values.shippingAddressDetails,
              };
            }
          } else {
            shippingAddressData = {
              label: "Billing Address",
              address: partyToUse?.address || "",
              city: partyToUse?.city || "",
              state: partyToUse?.state || "",
              pincode: "",
              contactNumber: partyToUse?.contactNumber || "",
            };
          }

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
            shippingAddress: shippingAddressData,
            sameAsBilling: values.sameAsBilling,
            paymentMethod: values.paymentMethod,
          };

          setGeneratedInvoice(previewData);

          // ✅ AUTO-OPEN INVOICE PREVIEW AFTER SUCCESSFUL TRANSACTION
          setInvoicePreviewOpen(true);
        }
      } else {
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

    let fieldOrder: string[] = [];

    fieldOrder.push("company", "date");

    if (
      ["sales", "purchases", "receipt"].includes(currentType) ||
      (currentType === "payment" && !form.getValues("isExpense"))
    ) {
      fieldOrder.push("party");
    }

    if (currentType === "payment" && form.getValues("isExpense")) {
      fieldOrder.push("expense");
    }

    if (["sales", "purchases", "receipt", "payment"].includes(currentType)) {
      fieldOrder.push("paymentMethod");
    }

    fieldOrder.push("bank");

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

    if (
      ["sales", "purchases", "receipt", "payment", "journal"].includes(
        currentType
      )
    ) {
      fieldOrder.push("totalAmount");
    }

    if (["sales", "purchases"].includes(currentType)) {
      fieldOrder.push("taxAmount", "invoiceTotal");
    }

    fieldOrder.push("referenceNumber");

    fieldOrder.push("description", "narration");

    if (currentType === "journal") {
      fieldOrder.push("fromAccount", "toAccount");
    }

    fieldOrder.push("notes");

    for (const fieldName of fieldOrder) {
      if (errors[fieldName as keyof typeof errors]) {
        form.setFocus(fieldName as any);
        setTimeout(() => {
          let element = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          if (!element) {
            element = document.querySelector(`#${fieldName}`) as HTMLElement;
          }
          if (!element && fieldName.includes(".")) {
            const parts = fieldName.split(".");
            element = document.querySelector(
              `[data-field="${fieldName}"]`
            ) as HTMLElement;
          }
          if (!element) {
            const label = document.querySelector(
              `label[for="${fieldName}"]`
            ) as HTMLElement;
            if (label) {
              element = label.closest(".space-y-2") as HTMLElement;
            }
          }
          if (!element) {
            if (fieldName === "party") {
              element = document.querySelector(
                '[data-testid="party-combobox"] input'
              ) as HTMLElement;
            }
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
              const elementRect = element.getBoundingClientRect();
              const containerRect = scrollContainer.getBoundingClientRect();
              const scrollTop =
                scrollContainer.scrollTop +
                (elementRect.top - containerRect.top) -
                100;
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
        break;
      }
    }
  };

  const { registerField } = useFormFocus(form.formState.errors);

  async function onSubmit(
    values: z.infer<typeof formSchema>,
    shouldCloseForm: boolean = true
  ) {
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    if (values.type === "sales" && values.items) {
      values.items.forEach((item: any, index: number) => {
        if (item.itemType === "product" && item.product && item.quantity) {
          const selectedProduct = products.find((p) => p._id === item.product);
          if (
            selectedProduct &&
            selectedProduct.stocks !== undefined &&
            selectedProduct.stocks !== null
          ) {
            const currentStock = Number(selectedProduct.stocks) || 0;
            const requestedQuantity = Number(item.quantity) || 0;

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
              toast({
                variant: "destructive",
                title: "Stock Depletion",
                description: `${selectedProduct.name} will be out of stock after this order.`,
                duration: 6000,
              });
            } else if (stockAfterTransaction <= 5) {
              toast({
                variant: "destructive",
                title: "Low Stock After Order",
                description: `${selectedProduct.name} will have only ${stockAfterTransaction} units left after this order.`,
                duration: 5000,
              });
            } else if (currentStock <= 5) {
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
        const editType = transactionToEdit.type;
        endpoint = `${endpointMap[editType]}/${transactionToEdit._id}`;
      }

      const productLines =
        values.items
          ?.filter((i: any) => i.itemType === "product")
          .map((i: any) => ({
            product: i.product,
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
          ?.filter((i: any) => i.itemType === "service")
          .map((i: any) => ({
            service: i.service,
            amount: i.amount,
            description: i.description ?? "",
            gstPercentage: gstEnabled ? Number(i.gstPercentage ?? 18) : 0,
            lineTax: gstEnabled ? Number(i.lineTax ?? 0) : 0,
            lineTotal: gstEnabled ? Number(i.lineTotal ?? i.amount) : i.amount,
          })) ?? [];

      const uiSubTotal = Number(values.totalAmount ?? 0);

      const uiTax = gstEnabled ? Number(values.taxAmount ?? 0) : 0;
      const uiInvoiceTotal = gstEnabled
        ? Number(values.invoiceTotal ?? uiSubTotal)
        : uiSubTotal;
      const receiptAmount = Number(
        values.totalAmount ?? values.subTotal ?? values.invoiceTotal ?? 0
      );

      let shippingAddressId = null;
      if (values.type === "sales") {
        if (values.sameAsBilling) {
          shippingAddressId = null;
        } else if (values.shippingAddress && values.shippingAddress !== "new") {
          shippingAddressId = values.shippingAddress;
        } else if (
          values.shippingAddress === "new" &&
          values.shippingAddressDetails
        ) {
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

      let payload: any;

      if (values.type === "receipt") {
        payload = {
          type: "receipt",
          company: values.company,
          party: values.party,
          date: values.date,
          amount: receiptAmount,
          description: values.description,
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber,
        };
      } else {
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

      delete (payload as any).items;
      delete (payload as any).gstRate;

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
          const action = values.type === "sales" ? "decrease" : "increase";
          stockUpdates = productLines.map((p) => ({
            product: p.product!,
            quantity: Number(p.quantity) || 0,
            action,
          }));
        }

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

      if (type === "sales" || type === "receipt") {
        const selectedParty = parties.find((p) => p._id === partyId);
        if (!selectedParty) {
          setPartyBalance(null);
          return;
        }

        const endpoint = `${baseURL}/api/parties/${partyId}`;

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

        const balances = data.balances || {};
        const companyBalance = balances[selectedCompanyIdWatch] ?? 0;

        setPartyBalance(companyBalance);

        setParties((prev) => {
          const exists = prev.find((p) => p._id === partyId);
          if (!exists) {
            return [...prev, data];
          }
          return prev.map((p) => (p._id === partyId ? data : p));
        });

        if (type === "sales") {
          await fetchShippingAddresses(partyId);
          form.setValue("shippingAddress", "");
          form.setValue("sameAsBilling", true);
        }
      } else if (type === "purchases" || type === "payment") {
        const selectedVendor = vendors.find((v) => v._id === partyId);
        if (!selectedVendor) {
          setVendorBalance(null);
          return;
        }

        const endpoint = `${baseURL}/api/vendors/${partyId}`;

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

        const balances = data.balances || {};
        const companyBalance = balances[selectedCompanyIdWatch] ?? 0;

        setVendorBalance(companyBalance);

        setVendors((prev) => {
          const exists = prev.find((v) => v._id === partyId);
          if (!exists) {
            return [...prev, data];
          }
          return prev.map((v) => (v._id === partyId ? data : v));
        });
      }
    } catch (error) {
      console.error(`Error in handlePartyChange for ${type}:`, error);

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

    if (!currentPartyId) {
      setPartyBalance(null);
      setVendorBalance(null);
      setBalance(null);
      return;
    }

    const isCustomer = parties.find((p) => p._id === currentPartyId);
    const isVendor = vendors.find((v) => v._id === currentPartyId);

    if (
      currentPartyId &&
      (type === "sales" || type === "receipt") &&
      isCustomer &&
      partyBalance === null
    ) {
      handlePartyChange(currentPartyId);
    }

    if (
      currentPartyId &&
      (type === "purchases" || type === "payment") &&
      isVendor &&
      vendorBalance === null
    ) {
      handlePartyChange(currentPartyId);
    }

    if ((type === "sales" || type === "receipt") && !isCustomer) {
      setPartyBalance(null);
    }
    if ((type === "purchases" || type === "payment") && !isVendor) {
      setVendorBalance(null);
    }
  }, [type, form.watch("party")]);

  const handleTriggerCreateProduct = (name: string) => {
    setNewEntityName(name);
    setIsProductDialogOpen(true);
  };

  const handleTriggerCreateService = (name: string) => {
    setNewEntityName(name);
    setIsServiceDialogOpen(true);
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);

    if (creatingProductForIndex !== null) {
      form.setValue(
        `items.${creatingProductForIndex}.product`,
        newProduct._id,
        { shouldValidate: true, shouldDirty: true }
      );
      form.setValue(`items.${creatingProductForIndex}.itemType`, "product", {
        shouldValidate: false,
      });

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

  const paymentMethodsForReceipt = ["Cash", "UPI", "Bank Transfer", "Cheque"];

  const getPartyOptions = () => {
    if (type === "sales" || type === "receipt") {
      const source = parties;

      const nameCount = source.reduce((acc: Record<string, number>, p) => {
        const name = p.name || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

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
      const nameCount = vendors.reduce((acc: Record<string, number>, v) => {
        const name = v.vendorName || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

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

  const partyOptions = getPartyOptions();
  const partyLabel = getPartyLabel();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading form data...</p>
      </div>
    );
  }

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
              Your admin hasn't granted you the permissions required to create
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

  if (!transactionToEdit && !isSuper && allowedTypes.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">No permissions</h2>
        <p className="text-sm text-muted-foreground">
          You don't have access to create any transactions. Please contact your
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
              if (e.key === "Tab") {
                e.preventDefault();
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
                <div className="w-full">
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

                  <div className="pt-4 md:pt-6">
                    {(type === "sales" || type === "purchases") && (
                      <SalesPurchaseFields
                        form={form}
                        type={type}
                        companies={companies}
                        parties={parties}
                        vendors={vendors}
                        products={products}
                        services={services}
                        banks={banks}
                        shippingAddresses={shippingAddresses}
                        partyBalance={partyBalance}
                        vendorBalance={vendorBalance}
                        selectedCompanyIdWatch={selectedCompanyIdWatch}
                        gstEnabled={gstEnabled}
                        partyCreatable={partyCreatable}
                        serviceCreatable={serviceCreatable}
                        canCreateInventory={canCreateInventory}
                        existingUnits={existingUnits}
                        itemRenderKeys={itemRenderKeys}
                        forceUpdate={forceUpdate}
                        lastEditedField={lastEditedField}
                        customGstInputs={customGstInputs}
                        handlePartyChange={handlePartyChange}
                        handleTriggerCreateParty={handleTriggerCreateParty}
                        handleTriggerCreateProduct={handleTriggerCreateProduct}
                        handleTriggerCreateService={handleTriggerCreateService}
                        handleProductCreated={handleProductCreated}
                        handleServiceCreated={handleServiceCreated}
                        handleDeleteUnit={handleDeleteUnit}
                        setCreatingProductForIndex={setCreatingProductForIndex}
                        setCreatingServiceForIndex={setCreatingServiceForIndex}
                        setUnitOpen={setUnitOpen}
                        setItemRenderKeys={setItemRenderKeys}
                        setLastEditedField={setLastEditedField}
                        setCustomGstInputs={setCustomGstInputs}
                        setShippingStateCode={setShippingStateCode}
                        setEditingShippingAddress={setEditingShippingAddress}
                        setEditAddressForm={setEditAddressForm}
                        setIsEditShippingAddressDialogOpen={
                          setIsEditShippingAddressDialogOpen
                        }
                        setShowNotes={setShowNotes}
                        transactionToEdit={transactionToEdit}
                        indiaStates={indiaStates}
                        shippingStateCode={shippingStateCode}
                        unitOpen={unitOpen}
                        showNotes={showNotes}
                        toast={toast}
                      />
                    )}
                    {(type === "receipt" || type === "payment") && (
                      <ReceiptPaymentFields
                        form={form}
                        type={type}
                        companies={companies}
                        paymentExpenses={paymentExpenses}
                        setPaymentExpenses={setPaymentExpenses}
                        partyLabel={getPartyLabel()}
                        partyOptions={getPartyOptions()}
                        partyCreatable={partyCreatable}
                        partyBalance={partyBalance}
                        vendorBalance={vendorBalance}
                        paymentMethodsForReceipt={paymentMethodsForReceipt}
                        handlePartyChange={handlePartyChange}
                        handleTriggerCreateParty={handleTriggerCreateParty}
                        baseURL={
                          process.env.NEXT_PUBLIC_BASE_URL ||
                          "http://localhost:8678"
                        }
                      />
                    )}
                    {type === "journal" && (
                      <div className="space-y-6">
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
                                  const cleaned = value.replace(/[^\d.]/g, "");

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

                  {type === "journal" && (
                    <div className="flex justify-end mt-6">
                      <div className="w-full max-w-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="font-medium">Amount</FormLabel>
                          <FormField
                            control={form.control}
                            name="totalAmount"
                            render={({ field }) => {
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

            {/* ✅ UPDATED FORM ACTIONS WITH INVOICE BUTTON */}
            <div className="flex justify-end p-6 border-t bg-background gap-3">
              {generatedInvoice && isTransactionSaved && (
                <Button
                  type="button"
                  onClick={() => setInvoicePreviewOpen(true)}
                  variant="outline"
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Invoice Actions
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
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
            initialName={newEntityName}
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
                      city: "",
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

      {/* ✅ UPDATED INVOICE ACTIONS WITH PROPER STATE MANAGEMENT */}
      <InvoiceActions
        generatedInvoice={generatedInvoice}
        isTransactionSaved={isTransactionSaved}
        savedTransactionData={savedTransactionData}
        companies={companies}
        parties={parties}
        products={products}
        services={services}
        serviceNameById={serviceNameById}
        form={form}
        onSubmit={onSubmit}
        onFormSubmit={onFormSubmit}
        invoicePreviewOpen={invoicePreviewOpen}
        onInvoicePreviewOpenChange={setInvoicePreviewOpen}
      />
    </>
  );
}
