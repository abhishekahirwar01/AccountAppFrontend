"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { searchHSNCodes, getHSNByCode, type HSNCode } from "@/lib/hsnProduct";

interface ProductFormProps {
  productType?: string;
  product?: Product;
  onSuccess: (product: Product) => void;
  initialName?: string;
}

const formSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  stocks: z.coerce.number().min(0, "Stock cannot be negative.").optional(),
  unit: z.string().min(1, "Unit is required.").optional(),
  customUnit: z.string().optional(),
  hsn: z.string().optional(),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative.").optional(),
}).refine((data) => {
  // If HSN is provided, it must be a valid HSN code
  if (data.hsn && data.hsn.trim()) {
    const validHSN = getHSNByCode(data.hsn.trim());
    return validHSN !== undefined;
  }
  return true;
}, {
  message: "Please select a valid HSN code from the suggestions.",
  path: ["hsn"],
});

type FormData = z.infer<typeof formSchema>;

export function ProductForm({
  product,
  onSuccess,
  initialName,
  productType,
}: ProductFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [existingUnits, setExistingUnits] = React.useState<any[]>([]);
  const [unitOpen, setUnitOpen] = React.useState(false);
  
  // HSN Search States
  const [hsnSuggestions, setHsnSuggestions] = React.useState<HSNCode[]>([]);
  const [showHsnSuggestions, setShowHsnSuggestions] = React.useState(false);
  const [isLoadingHsnSuggestions, setIsLoadingHsnSuggestions] = React.useState(false);
  const [focusedHsnIndex, setFocusedHsnIndex] = React.useState(-1);
  const [hsnSelectedFromDropdown, setHsnSelectedFromDropdown] = React.useState(false);
  const hsnInputRef = React.useRef<HTMLInputElement>(null);

  // 💡 FIX 1: Add a ref to manage the "initial load" state
  const isInitialLoad = React.useRef(true);


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
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

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

  const getDefaultUnit = (productUnit?: string) => {
    const standardUnits = ["Piece", "Kg", "Litre", "Box", "Meter", "Dozen", "Pack"];
    const existingUnitNames = existingUnits.map(u => u.name);
    if (!productUnit || standardUnits.includes(productUnit) || existingUnitNames.includes(productUnit)) {
      return productUnit || "Piece";
    }
    return "Other";
  };

  const getDefaultCustomUnit = (productUnit?: string) => {
    const standardUnits = ["Piece", "Kg", "Litre", "Box", "Meter", "Dozen", "Pack"];
    const existingUnitNames = existingUnits.map(u => u.name);
    if (!productUnit || standardUnits.includes(productUnit) || existingUnitNames.includes(productUnit)) {
      return "";
    }
    return productUnit;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || initialName || "",
      stocks: product?.stocks ?? 0,
      unit: getDefaultUnit(product?.unit),
      customUnit: getDefaultCustomUnit(product?.unit),
      hsn: product?.hsn || "",
      sellingPrice: product?.sellingPrice ?? 0,
    },
  });

  // Get the current HSN value from form
  const hsnValue = form.watch("hsn");

  // Debounced search for HSN codes - FIX 2 APPLIED HERE
  React.useEffect(() => {
    // Skip all logic on the very first mount if there's pre-filled HSN data.
    // This stops the initial page load from showing the dropdown.
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        // Check if HSN is pre-filled on load. If so, skip the initial effect run.
        if (product?.hsn && product.hsn.length >= 2) {
            return;
        }
    }
    
    // Standard logic for when the user types
    if (hsnSelectedFromDropdown) {
      setShowHsnSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      if (hsnValue && hsnValue.length >= 2) {
        setIsLoadingHsnSuggestions(true);
        const results = searchHSNCodes(hsnValue);
        setHsnSuggestions(results);
        // Only show if the user is typing
        setShowHsnSuggestions(true); 
        setIsLoadingHsnSuggestions(false);
      } else {
        setShowHsnSuggestions(false);
        setHsnSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hsnValue, hsnSelectedFromDropdown, product]); 
  // Added 'product' to effect dependencies to correctly handle initial load skip based on product data

  const handleHSNSelect = (hsnCode: HSNCode) => {
    form.setValue("hsn", hsnCode.code);
    setShowHsnSuggestions(false);
    setHsnSelectedFromDropdown(true);
    hsnInputRef.current?.blur(); // Blur the input to close the dropdown
  };

  const handleHSNInputBlur = () => {
    setTimeout(() => {
      setShowHsnSuggestions(false);
    }, 200);
  };
  
  // No separate focus handler needed now. Logic is inline in render.

  async function onSubmit(values: FormData) {
    // Validate HSN code before submission
    if (values.hsn && values.hsn.trim() && !hsnSelectedFromDropdown) {
      const validHSN = getHSNByCode(values.hsn.trim());
      if (!validHSN) {
        form.setError("hsn", {
          type: "manual",
          message: "Please select a valid HSN code from the dropdown suggestions."
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = product
        ? `${baseURL}/api/products/${product._id}`
        : `${baseURL}/api/products`;

      const method = product ? "PUT" : "POST";

      const payload = {
        ...values,
        unit: values.unit === "Other" ? values.customUnit : values.unit,
      };

      const res = await fetch(url, {
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
          data.message || `Failed to ${product ? "update" : "create"} product.`
        );
      }

      onSuccess(data.product);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Website Development" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stocks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
         </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <FormField
  control={form.control}
  name="sellingPrice"
  render={({ field }) => {
    const formatCurrency = (value: string) => {
      if (value === "") return "";
      const num = Number(value);
      if (isNaN(num)) return value;

      const parts = value.split(".");
      const formatted = new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(Number(parts[0]));

      return parts.length > 1 ? `₹${formatted}.${parts[1]}` : `₹${formatted}`;
    };

    const [displayValue, setDisplayValue] = useState(
      field.value ? formatCurrency(String(field.value)) : ""
    );

    return (
      <FormItem>
        <FormLabel>Selling Price</FormLabel>
        <FormControl>
          <Input
            type="text"
            placeholder="₹0"
            value={displayValue}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.]/g, ""); // allow digits and dot
              setDisplayValue(formatCurrency(raw));
              field.onChange(raw);
            }}
            onBlur={() => {
              // Optional: tidy formatting on blur (e.g., 50.2 → ₹50.20)
              if (displayValue) {
                const num = parseFloat(displayValue.replace(/[^\d.]/g, ""));
                if (!isNaN(num)) {
                  const formatted = new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(num);
                  setDisplayValue(formatted);
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

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={unitOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? field.value === "Other"
                            ? "Other (Custom)"
                            : field.value
                          : "Select unit..."}
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
                          <CommandItem
                            value="Piece"
                            onSelect={() => {
                              form.setValue("unit", "Piece");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Piece" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Piece
                          </CommandItem>
                          <CommandItem
                            value="Kg"
                            onSelect={() => {
                              form.setValue("unit", "Kg");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Kg" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Kg
                          </CommandItem>
                          <CommandItem
                            value="Litre"
                            onSelect={() => {
                              form.setValue("unit", "Litre");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Litre" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Litre
                          </CommandItem>
                          <CommandItem
                            value="Box"
                            onSelect={() => {
                              form.setValue("unit", "Box");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Box" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Box
                          </CommandItem>
                          <CommandItem
                            value="Meter"
                            onSelect={() => {
                              form.setValue("unit", "Meter");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Meter" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Meter
                          </CommandItem>
                          <CommandItem
                            value="Dozen"
                            onSelect={() => {
                              form.setValue("unit", "Dozen");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Dozen" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Dozen
                          </CommandItem>
                          <CommandItem
                            value="Pack"
                            onSelect={() => {
                              form.setValue("unit", "Pack");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Pack" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Pack
                          </CommandItem>
                          {existingUnits.map((unit) => (
                            <CommandItem
                              key={unit._id}
                              value={unit.name}
                              onSelect={() => {
                                form.setValue("unit", unit.name);
                                setUnitOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === unit.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="flex-1">{unit.name}</span>
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
                              form.setValue("unit", "Other");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Other" ? "opacity-100" : "opacity-0"
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
          {form.watch("unit") === "Other" && (
            <FormField
              control={form.control}
              name="customUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter custom unit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* HSN Code Field with Search */}
          <FormField
            control={form.control}
            name="hsn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HSN Code</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="relative">
                      <Input
                        placeholder="Search HSN code (e.g., 85)"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setShowHsnSuggestions(true);
                          setFocusedHsnIndex(-1); // Reset focus when typing
                          setHsnSelectedFromDropdown(false); // Reset selection flag when typing
                        }}
                        onBlur={handleHSNInputBlur}
                        onFocus={() => {
                          // 💡 FIX 3: Manually trigger the initial search on focus if content exists
                          if (field.value && field.value.length >= 2) {
                            setIsLoadingHsnSuggestions(true);
                            const results = searchHSNCodes(field.value);
                            setHsnSuggestions(results);
                            setShowHsnSuggestions(true);
                            setIsLoadingHsnSuggestions(false);
                          } else {
                            // If empty, show the dropdown so typing instantly updates it
                            setShowHsnSuggestions(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!showHsnSuggestions || hsnSuggestions.length === 0) return;

                          switch (e.key) {
                            case 'ArrowDown':
                              e.preventDefault();
                              setFocusedHsnIndex(prev =>
                                prev < hsnSuggestions.length - 1 ? prev + 1 : 0
                              );
                              break;
                            case 'ArrowUp':
                              e.preventDefault();
                              setFocusedHsnIndex(prev =>
                                prev > 0 ? prev - 1 : hsnSuggestions.length - 1
                              );
                              break;
                            case 'Enter':
                              e.preventDefault();
                              if (focusedHsnIndex >= 0 && focusedHsnIndex < hsnSuggestions.length) {
                                handleHSNSelect(hsnSuggestions[focusedHsnIndex]);
                              }
                              break;
                            case 'Escape':
                              e.preventDefault();
                              setShowHsnSuggestions(false);
                              setFocusedHsnIndex(-1);
                              break;
                          }
                        }}
                      />
                      {isLoadingHsnSuggestions && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* HSN Suggestions Dropdown */}
                    {showHsnSuggestions && hsnSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {hsnSuggestions.map((hsn, index) => (
                          <div
                            key={hsn.code}
                            className={cn(
                              "px-3 py-2 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors",
                              index === focusedHsnIndex
                                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                            onClick={() => handleHSNSelect(hsn)}
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
                    
                    {/* No results message */}
                    {showHsnSuggestions && hsnValue && hsnValue.length >= 2 && 
                      hsnSuggestions.length === 0 && !isLoadingHsnSuggestions && (
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
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Start typing 2+ characters to see HSN code suggestions
                </p>
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}