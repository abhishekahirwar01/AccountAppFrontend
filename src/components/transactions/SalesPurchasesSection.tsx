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

import { useToast } from "@/hooks/use-toast";
import { useFormFocus } from "@/hooks/useFormFocus"; // ADDED: Import the hook
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
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { Badge } from "@/components/ui/badge";
import QuillEditor from "@/components/ui/quill-editor";

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
import { HSNSearchInput } from "@/components/ui/hsn-search-input";
import { SACSearchInput } from "@/components/ui/sac-search-input";

// Import types and constants from your main component
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
const GST_OPTIONS = [
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "Standard (18%)", value: "18" },
  { label: "40%", value: "40" },
  { label: "Custom", value: "custom" },
] as const;

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

// Define proper types for the form fields
interface ProductItem {
  itemType: "product";
  product: string;
  quantity: number;
  pricePerUnit: number;
  unitType: string;
  otherUnit: string;
  amount: number;
  gstPercentage: number;
  lineTax: number;
  lineTotal: number;
  hsnCode?: string;
}

interface ServiceItem {
  itemType: "service";
  service: string;
  amount: number;
  description: string;
  gstPercentage: number;
  lineTax: number;
  lineTotal: number;
  sacCode?: string;
}

type FormItem = ProductItem | ServiceItem;

interface SalesPurchaseFieldsProps {
  form: any;
  type: "sales" | "purchases";
  companies: Company[];
  parties: Party[];
  vendors: Vendor[];
  products: Product[];
  services: Service[];
  banks: any[];
  shippingAddresses: any[];
  partyBalance: number | null;
  vendorBalance: number | null;
  selectedCompanyIdWatch: string;
  gstEnabled: boolean;
  partyCreatable: boolean;
  serviceCreatable: boolean;
  canCreateInventory: boolean;
  existingUnits: any[];
  itemRenderKeys: { [key: number]: number };
  forceUpdate: number;
  lastEditedField: Record<
    number,
    "quantity" | "pricePerUnit" | "amount" | "lineTotal"
  >;
  customGstInputs: Record<number, boolean>;

  // Functions
  handlePartyChange: (partyId: string) => void;
  handleTriggerCreateParty: (name: string) => void;
  handleTriggerCreateProduct: (name: string) => void;
  handleTriggerCreateService: (name: string) => void;
  handleProductCreated: (newProduct: Product) => void;
  handleServiceCreated: (newService: Service) => void;
  handleDeleteUnit: (unitId: string) => void;

  // State setters - FIXED TYPES
  setCreatingProductForIndex: (index: number | null) => void;
  setCreatingServiceForIndex: (index: number | null) => void;
  setUnitOpen: (open: boolean) => void;
  setItemRenderKeys: React.Dispatch<
    React.SetStateAction<{ [key: number]: number }>
  >;
  setLastEditedField: React.Dispatch<
    React.SetStateAction<
      Record<number, "quantity" | "pricePerUnit" | "amount" | "lineTotal">
    >
  >;
  setCustomGstInputs: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  setShippingStateCode: (code: string | null) => void;
  setEditingShippingAddress: (address: any) => void;
  setEditAddressForm: (form: any) => void;
  setIsEditShippingAddressDialogOpen: (open: boolean) => void;
  setShowNotes: (show: boolean) => void;

  // Other props
  transactionToEdit?: Transaction | null;
  indiaStates: any[];
  shippingStateCode: string | null;
  unitOpen: boolean;
  showNotes: boolean;
  toast: any;
}

export function SalesPurchaseFields({
  form,
  type,
  companies,
  parties,
  vendors,
  products,
  services,
  banks,
  shippingAddresses,
  partyBalance,
  vendorBalance,
  selectedCompanyIdWatch,
  gstEnabled,
  partyCreatable,
  serviceCreatable,
  canCreateInventory,
  existingUnits,
  itemRenderKeys,
  forceUpdate,
  lastEditedField,
  customGstInputs,
  handlePartyChange,
  handleTriggerCreateParty,
  handleTriggerCreateService,
  handleTriggerCreateProduct,
  handleProductCreated,
  handleServiceCreated,
  handleDeleteUnit,
  setCreatingProductForIndex,
  setCreatingServiceForIndex,
  setUnitOpen,
  setItemRenderKeys,
  setLastEditedField,
  setCustomGstInputs,
  setShippingStateCode,
  setEditingShippingAddress,
  setEditAddressForm,
  setIsEditShippingAddressDialogOpen,
  setShowNotes,
  transactionToEdit,
  indiaStates,
  shippingStateCode,
  unitOpen,
  showNotes,
  toast,
}: SalesPurchaseFieldsProps) {
  const { toast: toastHook } = useToast();

  // ADDED: Use the form focus hook with current form errors
  const { registerField } = useFormFocus(form.formState.errors);

  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const paymentMethods = [
    "Cash",
    "Credit",
    "UPI",
    "Bank Transfer",
    "Cheque",
    "Others",
  ];

  // Shipping address state and city dropdowns
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

  const getPartyOptions = () => {
    if (type === "sales") {
      const source = parties;
      const nameCount = source.reduce((acc, p) => {
        const name = p.name || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

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

    if (type === "purchases") {
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
      default:
        return "Party";
    }
  };

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

  const serviceOptions = services.map((s) => ({
    value: s._id,
    label: s.serviceName,
  }));

  return (
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
                  <SelectTrigger
                    ref={(el: HTMLButtonElement | null) =>
                      registerField("company", el)
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
                      ref={(el: HTMLButtonElement | null) =>
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

        {/* Due Date Field */}
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
                      ref={(el: HTMLButtonElement | null) =>
                        registerField("dueDate", el)
                      }
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
              <div
                ref={(el: HTMLDivElement | null) => registerField("party", el)}
              >
                <Combobox
                  options={partyOptions}
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value);
                    handlePartyChange(value);
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
                          type === "sales"
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
                    vendorBalance < 0
                      ? cn(
                          "text-red-600 bg-red-50 border-red-200",
                          "dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50"
                        )
                      : vendorBalance > 0
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
                  {vendorBalance < 0
                    ? `You need to pay vendor: ₹${Math.abs(
                        vendorBalance
                      ).toFixed(2)}`
                    : vendorBalance > 0
                    ? `Vendor advance payment: ₹${vendorBalance.toFixed(2)}`
                    : `Vendor balance: ₹${vendorBalance.toFixed(2)}`}
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
                    className={
                      form.formState.errors.paymentMethod
                        ? "border-red-500"
                        : ""
                    }
                    ref={(el: HTMLButtonElement | null) =>
                      registerField("paymentMethod", el)
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

      {paymentMethod !== "Cash" && (
        <FormField
          control={form.control}
          name="bank"
          render={({ field }) => {
            // Auto-select the first bank when banks are loaded and no bank is selected
            React.useEffect(() => {
              if (banks && banks.length > 0 && !field.value) {
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
                      <SelectTrigger
                        ref={(el: HTMLButtonElement | null) =>
                          registerField("bank", el)
                        }
                      >
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
                    <div
                      ref={(el: HTMLDivElement | null) =>
                        registerField("sameAsBilling", el)
                      }
                    >
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
                                contactNumber:
                                  selectedParty.contactNumber || "",
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
                    </div>
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
                          <SelectTrigger
                            ref={(el: HTMLButtonElement | null) =>
                              registerField("shippingAddress", el)
                            }
                          >
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
                              ref={(el: HTMLInputElement | null) =>
                                registerField(
                                  "shippingAddressDetails.label",
                                  el
                                )
                              }
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
                            <Input
                              placeholder="Contact number"
                              {...field}
                              ref={(el: HTMLInputElement | null) =>
                                registerField(
                                  "shippingAddressDetails.contactNumber",
                                  el
                                )
                              }
                            />
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
                            <Textarea
                              placeholder="Full address"
                              {...field}
                              ref={(el: HTMLTextAreaElement | null) =>
                                registerField(
                                  "shippingAddressDetails.address",
                                  el
                                )
                              }
                            />
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
                          <div
                            ref={(el: HTMLDivElement | null) =>
                              registerField("shippingAddressDetails.state", el)
                            }
                          >
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
                                form.setValue(
                                  "shippingAddressDetails.city",
                                  "",
                                  {
                                    shouldValidate: true,
                                  }
                                );
                              }}
                              placeholder="Select state"
                              searchPlaceholder="Type a state…"
                              noResultsText="No states found."
                            />
                          </div>
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
                          <div
                            ref={(el: HTMLDivElement | null) =>
                              registerField("shippingAddressDetails.city", el)
                            }
                          >
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
                          </div>
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
                            <Input
                              placeholder="Pincode"
                              {...field}
                              ref={(el: HTMLInputElement | null) =>
                                registerField(
                                  "shippingAddressDetails.pincode",
                                  el
                                )
                              }
                            />
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

              {/* Type guard to check if it's a product item */}
              {form.watch(`items.${index}.itemType`) === "product" ? (
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

                          <div
                            ref={(el: HTMLDivElement | null) =>
                              registerField(`items.${index}.product`, el)
                            }
                          >
                            <Combobox
                              options={productOptions}
                              value={field.value || ""}
                              onChange={(value: string) => {
                                console.log(
                                  "🔍 === PRODUCT SELECTION START ==="
                                );
                                console.log("🔍 Product ID selected:", value);

                                field.onChange(value);

                                if (value && typeof value === "string") {
                                  const selectedProduct = products.find(
                                    (p) => p._id === value
                                  );
                                  console.log(
                                    "🔍 Found product:",
                                    selectedProduct
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
                                    console.log(
                                      "🔍 Setting pricePerUnit to:",
                                      selectedProduct.sellingPrice
                                    );
                                    form.setValue(
                                      `items.${index}.pricePerUnit`,
                                      selectedProduct.sellingPrice
                                    );

                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "pricePerUnit",
                                    }));
                                  } else {
                                    form.setValue(
                                      `items.${index}.pricePerUnit`,
                                      0
                                    );
                                  }

                                  setItemRenderKeys((prev) => ({
                                    ...prev,
                                    [index]: (prev[index] || 0) + 1,
                                  }));

                                  console.log(
                                    "🔍 Forced re-render for item:",
                                    index
                                  );
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
                          </div>

                          <FormMessage />
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
                                  currentStock > 0 && currentStock <= 5;

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
                                  const productId = form.getValues(
                                    `items.${index}.product`
                                  );
                                  const quantityNumber = Number(newValue) || 0;

                                  if (productId && quantityNumber > 0) {
                                    const selectedProduct = products.find(
                                      (p) => p._id === productId
                                    );
                                    if (
                                      selectedProduct &&
                                      selectedProduct.stocks !== undefined &&
                                      selectedProduct.stocks !== null
                                    ) {
                                      const currentStock =
                                        Number(selectedProduct.stocks) || 0;
                                      const requestedQuantity = quantityNumber;

                                      if (currentStock <= 0) {
                                        toast({
                                          variant: "destructive",
                                          title: "Out of Stock",
                                          description: `${selectedProduct.name} is out of stock.`,
                                          duration: 5000,
                                        });
                                      } else if (
                                        requestedQuantity > currentStock
                                      ) {
                                        toast({
                                          variant: "destructive",
                                          title: "Insufficient Stock",
                                          description: `You're ordering ${requestedQuantity} units but only ${currentStock} are available.`,
                                          duration: 5000,
                                        });
                                      }
                                    }
                                  }
                                }}
                                ref={(el: HTMLInputElement | null) =>
                                  registerField(`items.${index}.quantity`, el)
                                }
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
                                    ref={(el: HTMLButtonElement | null) =>
                                      registerField(
                                        `items.${index}.unitType`,
                                        el
                                      )
                                    }
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
                                  ref={(el: HTMLInputElement | null) =>
                                    registerField(
                                      `items.${index}.otherUnit`,
                                      el
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Price/Unit */}
                    <div className="min-w-[90px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.pricePerUnit`}
                        render={({ field }) => {
                          const productId = form.watch(
                            `items.${index}.product`
                          );

                          return (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Price/Unit
                              </FormLabel>
                              <FormControl>
                                <Input
                                  key={`price-${index}-${productId}-${forceUpdate}`}
                                  className="h-9 text-sm px-2 tabular-nums text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={field.value || ""}
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value);
                                    field.onChange(value);
                                    setLastEditedField((prev) => ({
                                      ...prev,
                                      [index]: "pricePerUnit",
                                    }));
                                  }}
                                  ref={(el: HTMLInputElement | null) =>
                                    registerField(
                                      `items.${index}.pricePerUnit`,
                                      el
                                    )
                                  }
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
                                  ref={(el: HTMLInputElement | null) =>
                                    registerField(`items.${index}.amount`, el)
                                  }
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
                              <div
                                ref={(el: HTMLDivElement | null) =>
                                  registerField(`items.${index}.hsnCode`, el)
                                }
                              >
                                <HSNSearchInput
                                  placeholder="Search HSN..."
                                  onSelect={async (hsnCode) => {
                                    const productId = form.watch(
                                      `items.${index}.product`
                                    );
                                    if (!productId) {
                                      toast({
                                        variant: "destructive",
                                        title: "No Product Selected",
                                        description:
                                          "Please select a product first.",
                                      });
                                      return;
                                    }

                                    try {
                                      const token =
                                        localStorage.getItem("token");
                                      if (!token)
                                        throw new Error(
                                          "Authentication token not found."
                                        );

                                      const baseURL =
                                        process.env.NEXT_PUBLIC_BASE_URL;

                                      const res = await fetch(
                                        `${baseURL}/api/products/${productId}`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({
                                            hsn: hsnCode.code,
                                          }),
                                        }
                                      );

                                      if (!res.ok) {
                                        const errorData = await res.json();
                                        throw new Error(
                                          errorData.message ||
                                            "Failed to update product HSN"
                                        );
                                      }

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
                                  }}
                                />
                              </div>
                            );
                          }
                        })()}
                      </FormItem>
                    </div>

                    {gstEnabled && (
                      <>
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
                                        ref={(el: HTMLInputElement | null) =>
                                          registerField(
                                            `items.${index}.gstPercentage`,
                                            el
                                          )
                                        }
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
                                      <SelectTrigger
                                        className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
                                        ref={(el: HTMLButtonElement | null) =>
                                          registerField(
                                            `items.${index}.gstPercentage`,
                                            el
                                          )
                                        }
                                      >
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
                                        );
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
                                      ref={(el: HTMLInputElement | null) =>
                                        registerField(
                                          `items.${index}.lineTax`,
                                          el
                                        )
                                      }
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
                                        );
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
                                      ref={(el: HTMLInputElement | null) =>
                                        registerField(
                                          `items.${index}.lineTotal`,
                                          el
                                        )
                                      }
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

                        <div
                          ref={(el: HTMLDivElement | null) =>
                            registerField(`items.${index}.service`, el)
                          }
                        >
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

                              setCreatingServiceForIndex(index);
                              handleTriggerCreateService(name);
                              return "";
                            }}
                          />
                        </div>
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
                                  ref={(el: HTMLInputElement | null) =>
                                    registerField(`items.${index}.amount`, el)
                                  }
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
                                ref={(el: HTMLInputElement | null) =>
                                  registerField(
                                    `items.${index}.description`,
                                    el
                                  )
                                }
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
                              <div
                                ref={(el: HTMLDivElement | null) =>
                                  registerField(`items.${index}.sacCode`, el)
                                }
                              >
                                <SACSearchInput
                                  placeholder="Search SAC..."
                                  onSelect={async (sacCode) => {
                                    const serviceId = form.watch(
                                      `items.${index}.service`
                                    );
                                    if (!serviceId) {
                                      toast({
                                        variant: "destructive",
                                        title: "No Service Selected",
                                        description:
                                          "Please select a service first.",
                                      });
                                      return;
                                    }

                                    try {
                                      const token =
                                        localStorage.getItem("token");
                                      if (!token)
                                        throw new Error(
                                          "Authentication token not found."
                                        );

                                      const baseURL =
                                        process.env.NEXT_PUBLIC_BASE_URL;

                                      const res = await fetch(
                                        `${baseURL}/api/services/${serviceId}`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({
                                            sac: sacCode.code,
                                          }),
                                        }
                                      );

                                      if (!res.ok) {
                                        const errorData = await res.json();
                                        throw new Error(
                                          errorData.message ||
                                            "Failed to update service SAC"
                                        );
                                      }

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
                                  }}
                                />
                              </div>
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
                                        ref={(el: HTMLInputElement | null) =>
                                          registerField(
                                            `items.${index}.gstPercentage`,
                                            el
                                          )
                                        }
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
                                      <SelectTrigger
                                        className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
                                        ref={(el: HTMLButtonElement | null) =>
                                          registerField(
                                            `items.${index}.gstPercentage`,
                                            el
                                          )
                                        }
                                      >
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
                                      ref={(el: HTMLInputElement | null) =>
                                        registerField(
                                          `items.${index}.lineTax`,
                                          el
                                        )
                                      }
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
                                      ref={(el: HTMLInputElement | null) =>
                                        registerField(
                                          `items.${index}.lineTotal`,
                                          el
                                        )
                                      }
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
                      <div
                        ref={(el: HTMLDivElement | null) =>
                          registerField("notes", el)
                        }
                      >
                        <QuillEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Add detailed notes with formatting..."
                          className="min-h-[120px]"
                        />
                      </div>
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
                        ref={(el: HTMLInputElement | null) =>
                          registerField("totalAmount", el)
                        }
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
                        ref={(el: HTMLInputElement | null) =>
                          registerField("taxAmount", el)
                        }
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
                        ref={(el: HTMLInputElement | null) =>
                          registerField("invoiceTotal", el)
                        }
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>
      ) : (
        /* For purchases transactions, totals on the right */
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
                        ref={(el: HTMLInputElement | null) =>
                          registerField("totalAmount", el)
                        }
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
                        ref={(el: HTMLInputElement | null) =>
                          registerField("taxAmount", el)
                        }
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
                        ref={(el: HTMLInputElement | null) =>
                          registerField("invoiceTotal", el)
                        }
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
