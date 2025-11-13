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
} from "lucide-react";
import { format } from "date-fns";
// import React from "react";
import { useToast } from "@/hooks/use-toast";
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
import { getUnifiedLines } from "@/lib/getUnifiedLines";

import QuillEditor from "@/components/ui/quill-editor";
import axios from "axios";

import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { searchSACCodes, getSACByCode, type SACCode } from "@/lib/sacService";
import { searchHSNCodes, getHSNByCode, type HSNCode } from "@/lib/hsnProduct";

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
      if (data.itemType === "product") {
        if (data.pricePerUnit == null || data.pricePerUnit < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pricePerUnit"],
            message: "Price/Unit is required for products and must be ≥ 0",
          });
        }
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
    type: z.literal("proforma"),
    company: z.string().min(1, "Please select a company."),
    party: z.string().optional(),
    date: z.date({ required_error: "A date is required." }),
    dueDate: z.date().optional(),
    items: z.array(itemSchema).optional(),
    totalAmount: z.coerce
      .number()
      .positive("Amount must be a positive number.")
      .optional(), // Main amount for non-item transactions
    description: z.string().optional(),
    referenceNumber: z.string().optional(),
    narration: z.string().optional(),
    paymentMethod: z.string().optional(),
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
      return !!data.party;
    },
    {
      message: "Customer is required for proforma invoice.",
      path: ["party"],
    }
  )
  .refine(
    (data) => {
      return data.items && data.items.length > 0;
    },
    {
      message: "At least one item is required for a proforma invoice.",
      path: ["items"],
    }
  );

interface ProformaFormProps {
  onFormSubmit: () => void;
  serviceNameById: Map<string, string>;
  transactionToEdit?: Transaction | null;
}

export default function ProformaForm({
  onFormSubmit,
  serviceNameById,
  transactionToEdit,
}: ProformaFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPartyDialogOpen, setIsPartyDialogOpen] = React.useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
  const [newEntityName, setNewEntityName] = React.useState("");
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [banks, setBanks] = React.useState<any[]>([]);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = React.useState(false);
  const [newCustomerName, setNewCustomerName] = React.useState("");

  const [newServiceName, setNewServiceName] = useState("");

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
  const paymentMethods = ["Cash", "Credit", "UPI", "Bank Transfer", "Cheque"];
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

  // Track last edited field per item index for calculation logic
  const [lastEditedField, setLastEditedField] = React.useState<
    Record<number, "quantity" | "pricePerUnit" | "amount" | "lineTotal">
  >({});

  const { selectedCompanyId } = useCompany();
  const { permissions: userCaps } = useUserPermissions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // <— add this
    reValidateMode: "onChange", // <— and this
    defaultValues: {
      party: "",
      description: "",
      totalAmount: 0,
      items: [PRODUCT_DEFAULT],
      type: "proforma",
      referenceNumber: "",
      narration: "",
      company: selectedCompanyId || "",
      date: new Date(),
      // gstRate: STANDARD_GST, // <-- NEW (Sales/Purchases will use this)
      taxAmount: 0, // <-- NEW
      invoiceTotal: 0,
      notes: "",
      sameAsBilling: true, // Default to same as billing
      shippingAddress: "",
      shippingAddressDetails: {
        label: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        contactNumber: "",
      },
    },
  });

  // Populate form with transactionToEdit data
  React.useEffect(() => {
    if (transactionToEdit && transactionToEdit.type === "proforma") {
      const tx = transactionToEdit as any;

      // Build items from products and services
      const items: any[] = [];

      // Add products
      if (tx.products && Array.isArray(tx.products)) {
        tx.products.forEach((prod: any) => {
          items.push({
            itemType: "product",
            product: prod.product?._id || prod.product,
            quantity: prod.quantity || 1,
            unitType: prod.unitType || "Piece",
            otherUnit: prod.otherUnit || "",
            pricePerUnit: prod.pricePerUnit || 0,
            amount: prod.amount || 0,
            gstPercentage: prod.gstPercentage || 18,
            lineTax: prod.lineTax || 0,
            lineTotal: prod.lineTotal || prod.amount || 0,
            description: prod.description || "",
          });
        });
      }

      // Add services
      if (tx.services && Array.isArray(tx.services)) {
        tx.services.forEach((svc: any) => {
          items.push({
            itemType: "service",
            service: svc.service?._id || svc.service,
            amount: svc.amount || 0,
            gstPercentage: svc.gstPercentage || 18,
            lineTax: svc.lineTax || 0,
            lineTotal: svc.lineTotal || svc.amount || 0,
            description: svc.description || "",
          });
        });
      }

      // If no items, add default
      if (items.length === 0) {
        items.push(PRODUCT_DEFAULT);
      }

      form.reset({
        type: "proforma",
        company:
          typeof tx.company === "object" && tx.company !== null
            ? tx.company._id
            : tx.company || selectedCompanyId || "",
        party:
          typeof tx.party === "object" && tx.party !== null
            ? tx.party._id
            : tx.party || "",
        date: tx.date ? new Date(tx.date) : new Date(),
        dueDate: tx.dueDate ? new Date(tx.dueDate) : undefined,
        items,
        totalAmount: tx.subTotal || tx.totalAmount || 0,
        description: tx.description || "",
        referenceNumber: tx.referenceNumber || "",
        narration: tx.narration || "",
        paymentMethod: tx.paymentMethod || "",
        taxAmount: tx.taxAmount || 0,
        invoiceTotal: tx.invoiceTotal || tx.totalAmount || 0,
        subTotal: tx.subTotal || 0,
        dontSendInvoice: false,
        bank:
          typeof tx.bank === "object" && tx.bank !== null
            ? tx.bank._id
            : tx.bank || "",
        notes: tx.notes || "",
        sameAsBilling: !tx.shippingAddress,
        shippingAddress:
          typeof tx.shippingAddress === "object" && tx.shippingAddress !== null
            ? tx.shippingAddress._id
            : tx.shippingAddress || "",
        shippingAddressDetails:
          typeof tx.shippingAddress === "object" && tx.shippingAddress !== null
            ? {
                label: tx.shippingAddress.label || "",
                address: tx.shippingAddress.address || "",
                city: tx.shippingAddress.city || "",
                state: tx.shippingAddress.state || "",
                pincode: tx.shippingAddress.pincode || "",
                contactNumber: tx.shippingAddress.contactNumber || "",
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
    }
  }, [transactionToEdit, form, selectedCompanyId]);

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
  const isSuper = role === "master" || role === "client";

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
    if (canSales) arr.push("proforma");
    return arr;
  }, [canSales]);

  const { fields, append, remove, replace, insert } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const type = "proforma";

  // Derived flags for current tab
  const partyCreatable = React.useMemo(() => {
    return canCreateCustomer;
  }, [canCreateCustomer]);

  const serviceCreatable = canCreateInventory;

  // ⬇️ FIXED: per-line GST computation with proper field priority
  React.useEffect(() => {
    if (!watchedItems || type !== "proforma") return;

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
  // Open modal to create new customer
  const handleTriggerCreateCustomer = (name: string) => {
    if (!canCreateCustomer) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to create customers.",
      });
      return;
    }

    setNewEntityName(name); // Store typed name
    setIsPartyDialogOpen(true); // Open the CustomerForm modal
  };

  // After customer is created
  const handleCustomerCreated = (newCustomer: Party) => {
    const entityId = newCustomer._id;
    const entityName = newCustomer.name;

    // Add to parties list
    setParties((prev) => [...(Array.isArray(prev) ? prev : []), newCustomer]);

    // Set as selected in form
    form.setValue("party", entityId, { shouldValidate: true });

    toast({
      title: `New Customer Created`,
      description: `${entityName} has been added.`,
    });

    setIsPartyDialogOpen(false); // Close modal
  };

  // inside your component
  const transactionDate = form.watch("date");
  const dueDate = form.watch("dueDate");

  // effect to set default due date
  useEffect(() => {
    if (!dueDate) {
      form.setValue("dueDate", transactionDate);
    }
  }, [transactionDate, dueDate, form]);
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
    } else {
      setBanks([]); // Clear banks if no company is selected in the form
    }
  }, [selectedCompanyIdWatch, fetchBanks]); // Use selectedCompanyIdWatch instead of selectedCompanyId

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

      const [companiesRes, partiesRes, productsRes, vendorsRes, servicesRes] =
        await Promise.all([
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
        ]);

      if (
        !companiesRes.ok ||
        !partiesRes.ok ||
        !productsRes.ok ||
        !vendorsRes.ok ||
        !servicesRes.ok
      ) {
        throw new Error("Failed to fetch initial form data.");
      }

      const companiesData = await companiesRes.json();
      const partiesData = await partiesRes.json();
      const productsData = await productsRes.json();
      const vendorsData = await vendorsRes.json();
      const servicesData = await servicesRes.json();

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

      if (companiesData.length > 0) {
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
  }, [toast, form, selectedCompanyId]);

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

  // Fetch shipping addresses when party changes
  React.useEffect(() => {
    const partyId = form.watch("party");
    if (partyId && type === "proforma") {
      fetchShippingAddresses(partyId);
    }
  }, [form.watch("party"), type, fetchShippingAddresses]);

  // Populate shipping address details when editing and addresses are loaded
  React.useEffect(() => {
    if (shippingAddresses.length > 0) {
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
  }, [shippingAddresses, form, indiaStates]);
  const scrollToError = () => {
    // Wait for form validation to complete
    setTimeout(() => {
      // Find the first error message element
      const errorElement =
        document.querySelector('[role="alert"]') ||
        document.querySelector(".text-destructive");

      if (errorElement) {
        // Scroll to the error with smooth behavior
        errorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };
  const handleFormSubmit = form.handleSubmit(
    async (values) => {
      // Success case - form valid hai
      await onSubmit(values);
    },
    (errors) => {
      // Error case - form invalid hai
      console.log("Form validation errors:", errors);
      scrollToError();
    }
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const method = transactionToEdit ? "PUT" : "POST";
      let endpoint = `/api/proforma`;

      if (transactionToEdit) {
        endpoint = `/api/proforma/${transactionToEdit._id}`;
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

      // --- Handle shipping address for proforma ---
      let shippingAddressId = null;
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

          const shippingRes = await fetch(`${baseURL}/api/shipping-addresses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(shippingPayload),
          });

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
              "Failed to save shipping address. Proforma will proceed without it.",
          });
        }
      }

      // --- Build payload ---
      const payload: any = {
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
        paymentMethod: values.paymentMethod || undefined,
        invoiceTotal: uiInvoiceTotal,
        bank: values.bank || undefined,
        notes: values.notes || "",
        shippingAddress: shippingAddressId,
      };

      // Clean up fields not needed by the server
      delete (payload as any).items;
      delete (payload as any).gstRate;

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
        throw new Error(data.message || `Failed to submit proforma entry.`);
      }

      // Success toast and form close for all transactions
      const inv = data?.entry?.invoiceNumber;
      toast({
        title: transactionToEdit
          ? `Proforma Invoice Updated!`
          : `Proforma Invoice Submitted!`,
        description: inv
          ? `Your proforma entry has been ${
              transactionToEdit ? "updated" : "recorded"
            }. Invoice #${inv}.`
          : `Your proforma entry has been ${
              transactionToEdit ? "updated" : "recorded"
            }.`,
      });

      onFormSubmit();
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
      // Remove auto-population of amount when service is selected
      // form.setValue(`items.${creatingServiceForIndex}.amount`, newService.price || 0);
    }
    setCreatingServiceForIndex(null);

    toast({
      title: "Service Created",
      description: `${newService.serviceName} has been added.`,
    });
    setIsServiceDialogOpen(false);
  };

  const getPartyOptions = () => {
    // All parties (customers) – no filter for balance
    const source = parties;

    // Group by name to check for duplicates
    const nameCount = source.reduce((acc, p) => {
      const name = p.name || "";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // For PROFORMA, show all customers
    return source.map((p) => {
      const name = p.name || "";
      const hasDuplicates = nameCount[name] > 1;
      const label = hasDuplicates ? `${name} (${p.contactNumber || ""})` : name;
      return {
        value: p._id,
        label: String(label),
      };
    });
  };

  const partyOptions = getPartyOptions();

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
  const hasAnyTxnCreate = canSales;

  const renderProformaFields = () => (
    <div className="space-y-6">
      {/* Core Details */}
      <div className="space-y-2">
        <h3 className="text-base font-medium pb-2 border-b">Core Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
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
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">Due Date (Optional)</FormLabel>
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
                      selected={field.value || transactionDate} // fallback to transaction date
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
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

      {/* Customer Details */}
      <div className="space-y-2">
        <h3 className="text-base font-medium pb-2 border-b">
          Customer Details
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <FormField
            control={form.control}
            name="party"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Combobox
                  options={partyOptions}
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select or create..."
                  creatable={true}
                  onCreate={(name: string) => {
                    setNewCustomerName(name); // set name for modal
                    setIsCreateCustomerOpen(true); // open CustomerForm modal
                    return Promise.resolve(name); // satisfy typing
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer Form Modal */}
          <Dialog
            open={isCreateCustomerOpen}
            onOpenChange={setIsCreateCustomerOpen}
          >
            <DialogContent className="max-w-2xl w-full p-6">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Fill out the form below to add a new customer.
                </DialogDescription>
              </DialogHeader>

              <CustomerForm
                initialName={newCustomerName}
                onSuccess={handleCustomerCreated}
              />
            </DialogContent>
          </Dialog>
          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. PO No, Ref #" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-2">
        <h3 className="text-base font-medium pb-2 border-b">Items</h3>
        <div className="space-y-4 pt-2">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Product Selection */}
                  {form.watch(`items.${index}.itemType`) === "product" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      {/* Product Selection */}
                      <div
                        className={
                          gstEnabled ? "lg:col-span-2" : "lg:col-span-3"
                        }
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.product`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Product
                              </FormLabel>
                              <Combobox
                                options={productOptions}
                                value={field.value || ""}
                                onChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(
                                    `items.${index}.pricePerUnit`,
                                    0,
                                    { shouldValidate: false }
                                  );
                                  // Auto-populate selling price if available
                                  if (value) {
                                    const selectedProduct = products.find(
                                      (p) => p._id === value
                                    );
                                    const price =
                                      selectedProduct?.sellingPrice ||
                                      selectedProduct?.price;
                                    if (price != null && Number(price) > 0) {
                                      form.setValue(
                                        `items.${index}.pricePerUnit`,
                                        Number(price),
                                        { shouldValidate: false }
                                      );
                                      setLastEditedField((prev) => ({
                                        ...prev,
                                        [index]: "pricePerUnit",
                                      }));
                                    }
                                  }
                                }}
                                placeholder="Select product..."
                                searchPlaceholder="Search products..."
                                noResultsText="No products found."
                                creatable={true} // ✅ always allow create option
                                onCreate={async (name) => {
                                  // Permission check
                                  // if (!serviceCreatable) {
                                  //   toast({
                                  //     variant: "destructive",
                                  //     title: "Permission denied",
                                  //     description: "You don't have permission to create inventory.",
                                  //   });
                                  //   return Promise.resolve("");
                                  // }
                                  setCreatingProductForIndex(index);
                                  handleTriggerCreateProduct(name);

                                  return Promise.resolve(""); // required by Combobox type
                                }}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Dialog
                          open={isProductDialogOpen}
                          onOpenChange={setIsProductDialogOpen}
                        >
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
                      </div>

                      {/* Quantity */}
                      <div
                        className={
                          gstEnabled ? "lg:col-span-1" : "lg:col-span-1"
                        }
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Quantity
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0"
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
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Unit Type */}
                      <div
                        className={
                          gstEnabled ? "lg:col-span-1" : "lg:col-span-1"
                        }
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Unit
                              </FormLabel>
                              <Select
                                value={field.value || ""}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (value !== "Other") {
                                    form.setValue(
                                      `items.${index}.otherUnit`,
                                      ""
                                    );
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500">
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {unitTypes.map((unit) => (
                                    <SelectItem
                                      key={unit}
                                      value={unit}
                                      className="text-sm"
                                    >
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Other Unit (conditional) */}
                      {form.watch(`items.${index}.unitType`) === "Other" && (
                        <div className="lg:col-span-2">
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
                                    className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="e.g. Kg"
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
                      {/* <div
                        className={
                          gstEnabled ? "lg:col-span-1" : "lg:col-span-2"
                        }
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.pricePerUnit`}
                          render={({ field }) => {
                            const formatIndianNumber = (value: string) => {
                              if (!value) return "";
                              const [intPart, decPart] = value.split(".");
                              const num = intPart.replace(/\D/g, "");
                              const lastThree = num.slice(-3);
                              const otherNumbers = num.slice(0, -3);
                              const formattedInt = otherNumbers
                                ? otherNumbers.replace(
                                    /\B(?=(\d{2})+(?!\d))/g,
                                    ","
                                  ) +
                                  "," +
                                  lastThree
                                : lastThree;
                              return decPart !== undefined
                                ? `${formattedInt}.${decPart}`
                                : formattedInt;
                            };

                            const [displayValue, setDisplayValue] =
                              React.useState(
                                field.value
                                  ? formatIndianNumber(field.value.toString())
                                  : ""
                              );

                            return (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Price/Unit
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 p-1 text-sm text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={displayValue}
                                    onChange={(e) => {
                                      let input = e.target.value.replace(
                                        /,/g,
                                        ""
                                      );
                                      if (!/^\d*\.?\d*$/.test(input)) return; // prevent invalid chars

                                      setDisplayValue(
                                        formatIndianNumber(input)
                                      );
                                      const num = parseFloat(input);
                                      field.onChange(isNaN(num) ? "" : num);

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
                      </div> */}

                      <div className="min-w-[90px] flex-1 pe-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.pricePerUnit`}
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
                              if (isNaN(num)) return value; // ← preserve in-progress input like "50."
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
                      </div>

                      {/* Amount (editable) */}
                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Amount
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  type="text" // keep text to allow formatting
                                  placeholder="0.00"
                                  value={
                                    field.value != null
                                      ? Number(field.value).toLocaleString(
                                          "en-IN",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )
                                      : ""
                                  }
                                  onChange={(e) => {
                                    // Remove commas and parse number
                                    const rawValue = e.target.value.replace(
                                      /,/g,
                                      ""
                                    );
                                    const numberValue =
                                      rawValue === ""
                                        ? undefined
                                        : Number(rawValue);

                                    field.onChange(numberValue);

                                    // Track last edited field
                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "amount",
                                    }));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* HSN Code */}
                      <div
                        className={
                          gstEnabled ? "lg:col-span-1" : "lg:col-span-1"
                        }
                      >
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            HSN Code
                          </FormLabel>
                          <div className="h-9 flex items-center px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                            <span
                              className="text-gray-700 dark:text-gray-300 font-medium truncate w-full cursor-pointer"
                              title={(() => {
                                const selectedProduct = products.find(
                                  (p) =>
                                    p._id ===
                                    form.watch(`items.${index}.product`)
                                );
                                return selectedProduct?.hsn || "-";
                              })()}
                            >
                              {(() => {
                                const selectedProduct = products.find(
                                  (p) =>
                                    p._id ===
                                    form.watch(`items.${index}.product`)
                                );
                                return selectedProduct?.hsn || "-";
                              })()}
                            </span>
                          </div>
                        </FormItem>
                      </div>

                      {/* GST % */}
                      {gstEnabled && (
                        <div className="lg:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.gstPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  GST %
                                </FormLabel>
                                <Select
                                  disabled={!gstEnabled}
                                  value={String(field.value ?? 18)}
                                  onValueChange={(v) =>
                                    field.onChange(Number(v))
                                  }
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Line Tax */}
                      {gstEnabled && (
                        <div className="lg:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTax`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Tax
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 px-1 text-sm text-right bg-gray-100 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 font-medium"
                                    type="text"
                                    readOnly
                                    value={
                                      field.value != null
                                        ? Number(field.value).toLocaleString(
                                            "en-IN",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )
                                        : "0.00"
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Line Total (editable) */}

                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.lineTotal`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Total
                                </FormLabel>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="h-7 px-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <FormControl>
                                <Input
                                  className="mt-1 h-9 text-sm text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  type="text" // text to allow formatting
                                  placeholder="0.00"
                                  value={
                                    field.value != null
                                      ? Number(field.value).toLocaleString(
                                          "en-IN",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )
                                      : ""
                                  }
                                  onChange={(e) => {
                                    // Remove commas and parse the number
                                    const rawValue = e.target.value.replace(
                                      /,/g,
                                      ""
                                    );
                                    const numberValue =
                                      rawValue === ""
                                        ? undefined
                                        : Number(rawValue);

                                    field.onChange(numberValue);

                                    // Track last edited field
                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "lineTotal",
                                    }));
                                  }}
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Service Selection */}
                  {form.watch(`items.${index}.itemType`) === "service" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                      {/* Service Selection */}
                      <div
                        className={
                          gstEnabled ? "lg:col-span-2" : "lg:col-span-3"
                        }
                      >
                        {/* Service Selection with Create Option */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.service`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Service
                              </FormLabel>
                              <Combobox
                                options={serviceOptions}
                                value={field.value || ""}
                                onChange={(value) => {
                                  field.onChange(value);
                                  // Auto-populate service amount if available
                                  if (value) {
                                    const selectedService = services.find(
                                      (s) => s._id === value
                                    );
                                    if (selectedService?.amount) {
                                      form.setValue(
                                        `items.${index}.amount`,
                                        selectedService.amount,
                                        { shouldValidate: false }
                                      );
                                      setLastEditedField((prev) => ({
                                        ...prev,
                                        [index]: "amount",
                                      }));
                                    }
                                  }
                                }}
                                placeholder="Select service..."
                                searchPlaceholder="Search services..."
                                noResultsText="No services found."
                                creatable={true} // ✅ always allow create option
                                onCreate={async (name) => {
                                  // if (!serviceCreatable) {
                                  //   toast({
                                  //     variant: "destructive",
                                  //     title: "Permission denied",
                                  //     description: "You don't have permission to create services.",
                                  //   });
                                  //   return "";
                                  // }

                                  // open modal to create service
                                  setCreatingServiceForIndex(index);
                                  setNewServiceName(name);
                                  setIsServiceDialogOpen(true);

                                  return ""; // Combobox expects string return
                                }}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Create Service Dialog */}
                        <Dialog
                          open={isServiceDialogOpen}
                          onOpenChange={setIsServiceDialogOpen}
                        >
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Create New Service</DialogTitle>
                              <DialogDescription>
                                Fill out the form below to add a new service.
                              </DialogDescription>
                            </DialogHeader>

                            <ServiceForm
                              initialName={newServiceName}
                              onSuccess={(newService) => {
                                // newService is an object like { _id, name, price, ... }
                                if (
                                  creatingServiceForIndex !== null &&
                                  newService?._id
                                ) {
                                  form.setValue(
                                    `items.${creatingServiceForIndex}.service`,
                                    newService._id,
                                    { shouldValidate: true, shouldDirty: true }
                                  );
                                  form.setValue(
                                    `items.${creatingServiceForIndex}.itemType`,
                                    "service"
                                  );
                                }

                                setIsServiceDialogOpen(false);
                                setCreatingServiceForIndex(null);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Service Amount */}
                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Amount
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(
                                      e.target.value === ""
                                        ? ""
                                        : e.target.valueAsNumber
                                    );
                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "amount",
                                    }));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Service Description */}
                      <div
                        className={
                          gstEnabled ? "lg:col-span-3" : "lg:col-span-3"
                        }
                      >
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

                      <div
                        className={
                          gstEnabled ? "lg:col-span-1" : "lg:col-span-2"
                        }
                      >
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            SAC Code
                          </FormLabel>
                          <div className="h-9 flex items-center px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {(() => {
                                const selectedService = services.find(
                                  (s) =>
                                    s._id ===
                                    form.watch(`items.${index}.service`)
                                );
                                return selectedService?.sac || "-";
                              })()}
                            </span>
                          </div>
                        </FormItem>
                      </div>

                      {/* GST % */}
                      {gstEnabled && (
                        <div className="lg:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.gstPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  GST %
                                </FormLabel>
                                <Select
                                  disabled={!gstEnabled}
                                  value={String(field.value ?? 18)}
                                  onValueChange={(v) =>
                                    field.onChange(Number(v))
                                  }
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Line Tax */}
                      {gstEnabled && (
                        <div className="lg:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTax`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Tax
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 px-1 text-sm text-right bg-gray-100 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 font-medium"
                                    type="text" // text so we can format with commas
                                    readOnly
                                    value={
                                      field.value != null
                                        ? Number(field.value).toLocaleString(
                                            "en-IN",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          )
                                        : "0.00"
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Line Total (editable) */}

                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.lineTotal`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Total
                                </FormLabel>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="h-7 px-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <FormControl>
                                <Input
                                  className="h-9 text-sm text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  type="text" // changed to text for comma formatting
                                  placeholder="0.00"
                                  value={
                                    field.value != null
                                      ? Number(field.value).toLocaleString(
                                          "en-IN",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )
                                      : ""
                                  }
                                  onChange={(e) => {
                                    // Remove commas before storing
                                    const rawValue = e.target.value.replace(
                                      /,/g,
                                      ""
                                    );
                                    const numberValue =
                                      rawValue === ""
                                        ? undefined
                                        : Number(rawValue);

                                    field.onChange(numberValue);

                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "lineTotal",
                                    }));
                                  }}
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
              </CardContent>
            </Card>
          ))}

          {/* Add Item Buttons */}
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
                  gstPercentage: 18,
                  lineTax: 0,
                  lineTotal: 0,
                })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-2">
        <h3 className="text-base font-medium pb-2 border-b">
          Additional Details
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description / Narration</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the proforma invoice..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!showNotes ? (
            <div className="flex justify-start">
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
      </div>

      {/* Totals */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1" />
        <div className="w-full max-w-sm space-y-3">
          {/* Subtotal */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-medium">Subtotal</FormLabel>
                  <Input
                    type="text" // text so we can show commas
                    readOnly
                    className="w-40 text-right bg-muted"
                    value={
                      field.value != null
                        ? Number(field.value).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : ""
                    }
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* GST row only when enabled */}
          {gstEnabled && (
            <div className="flex items-center justify-between">
              <FormLabel className="font-medium">GST</FormLabel>
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <Input
                    type="text"
                    readOnly
                    className="w-40 text-right bg-muted"
                    value={
                      field.value != null
                        ? Number(field.value).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"
                    }
                  />
                )}
              />
            </div>
          )}

          {/* Invoice total */}
          <FormField
            control={form.control}
            name="invoiceTotal"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-bold">
                    Invoice Total{gstEnabled ? " (GST incl.)" : ""}
                  </FormLabel>
                  <Input
                    type="text"
                    readOnly
                    className="w-40 text-right bg-muted text-lg font-bold"
                    value={
                      field.value != null
                        ? Number(field.value).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"
                    }
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:max-h-[80vh] md:max-h-[70vh] max-h-[60vh] overflow-y-auto">
      <Form {...form}>
        <form
          onSubmit={handleFormSubmit}
          className="contents"
          onSelect={(e) => e.preventDefault()}
        >
          <ScrollArea className="flex-1 overflow-auto" tabIndex={-1}>
            <div className="p-6 space-y-6 select-none">
              {renderProformaFields()}
            </div>
          </ScrollArea>
          <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {transactionToEdit
                ? "Update Proforma Invoice"
                : "Create Proforma Invoice"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
