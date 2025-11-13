 "use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import React from "react"
import { useToast } from "@/hooks/use-toast"
import type { Vendor } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { ScrollArea } from "../ui/scroll-area"
import { State, City } from "country-state-city"
import { Combobox } from "@/components/ui/combobox"
import { CompanyFormValidations } from "@/lib/validation-utils"

interface VendorFormProps {
    vendor?: Vendor;
    initialName?: string;
    onSuccess: (vendor: Vendor) => void;
}

const gstRegistrationTypes = ["Regular", "Composition", "Unregistered", "Consumer", "Overseas", "Special Economic Zone", "Unknown"] as const;

const formSchema = z.object({
  vendorName: z.string().min(2, "Vendor name is required."),
    contactNumber: z.string().optional().refine((val) => !val || val === '' || /^[6-9]\d{9}$/.test(val), "Invalid mobile number"),
   email: z.string().optional().refine((val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email"),
   address: z.string().optional(),
   city: z.string().optional(),
   state: z.string().optional(),
   gstin: z.string()
     .optional()
     .or(z.literal(''))
     .refine((val) => {
       if (!val || val.trim() === '') return true;
       const result = CompanyFormValidations.validateGSTIN(val);
       return result.isValid;
     }, {
       message: "Please enter a valid GSTIN (15 characters: 2-digit state code + 10-char business ID + entity + Z + checksum, (Format: 27ABCDE1234F2Z5))"
     }),
   gstRegistrationType: z.enum(gstRegistrationTypes).default("Unregistered"),
   pan: z.string()
     .optional()
     .or(z.literal(''))
     .refine((val) => {
       if (!val || val.trim() === '') return true;
       const result = CompanyFormValidations.validatePANNumber(val);
       return result.isValid;
     }, {
       message: "Please enter a valid PAN number (Format: AAAAA9999A)"
     }),
   isTDSApplicable: z.boolean().default(false),
   tdsRate: z.coerce.number().optional(),
   tdsSection: z.string().optional(),
 });

type FormData = z.infer<typeof formSchema>;

export function VendorForm({ vendor, initialName, onSuccess }: VendorFormProps) {

    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: vendor?.vendorName || initialName || "",
      contactNumber: vendor?.contactNumber || "",
      email: vendor?.email || "",
      address: vendor?.address || "",
      city: vendor?.city || "",
      state: vendor?.state || "",
      gstin: vendor?.gstin || "",
      gstRegistrationType: vendor?.gstRegistrationType || "Unregistered",
      pan: vendor?.pan || "",
      isTDSApplicable: vendor?.isTDSApplicable || false,
      tdsRate: vendor?.tdsRate || 0,
      tdsSection: vendor?.tdsSection || "",
    },
  });

  const isTDSApplicable = form.watch("isTDSApplicable");
  const indiaStates = React.useMemo(() => State.getStatesOfCountry("IN"), []);
  const [stateCode, setStateCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const currentStateName = form.getValues("state")?.trim();
    if (!currentStateName) {
      setStateCode(null);
      return;
    }
    const found = indiaStates.find(
      (s) => s.name.toLowerCase() === currentStateName.toLowerCase()
    );
    setStateCode(found?.isoCode || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateOptions = React.useMemo(
    () =>
      indiaStates
        .map((s) => ({ value: s.isoCode, label: s.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [indiaStates]
  );

  const cityOptions = React.useMemo(() => {
    if (!stateCode) return [];
    const list = City.getCitiesOfState("IN", stateCode);
    return list
      .map((c) => ({ value: c.name, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [stateCode]);


  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const url = vendor 
            ? `${baseURL}/api/vendors/${vendor._id}` 
            : `${baseURL}/api/vendors`;
        
        const method = vendor ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(values),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || `Failed to ${vendor ? 'update' : 'create'} vendor.`);
        }
        
        onSuccess(data.vendor);

    } catch (error) {
       toast({
            variant: "destructive",
            title: "Operation Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (isValid) {
      await onSubmit(form.getValues());
    } else {
      // Focus on the first field with an error
      const errors = form.formState.errors;
      const firstErrorField = Object.keys(errors)[0] as keyof FormData;
      if (firstErrorField) {
        form.setFocus(firstErrorField);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="contents"
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const focusableElements = document.querySelectorAll(
              'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
            );
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
            const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
            if (nextIndex >= 0 && nextIndex < focusableElements.length) {
              (focusableElements[nextIndex] as HTMLElement).focus();
            }
          }
        }}
      >
        <ScrollArea className="max-h-[60vh] flex-1" tabIndex={-1}>
            <div className="px-6 pb-6 select-none">
                <FormField
                    control={form.control}
                    name="vendorName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vendor Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="e.g. Acme Supplies" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>Mobile Number / Whatsapp</FormLabel><FormControl><Input placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email ID</FormLabel><FormControl><Input type="email" placeholder="e.g. contact@acme.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g. 123 Industrial Area" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  {/* STATE (searchable) */}
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Combobox
                          options={stateOptions}
                          // value is the isoCode of the selected state
                          value={
                            stateCode ??
                            stateOptions.find(
                              (o) =>
                                o.label.toLowerCase() ===
                                (field.value || "").toLowerCase()
                            )?.value ??
                            ""
                          }
                          onChange={(iso) => {
                            setStateCode(iso);
                            const selected = indiaStates.find(
                              (s) => s.isoCode === iso
                            );
                            // store STATE NAME in your form (backend unchanged)
                            field.onChange(selected?.name || "");
                            // clear city when state changes
                            form.setValue("city", "", { shouldValidate: true });
                          }}
                          placeholder="Select state"
                          searchPlaceholder="Type a state…"
                          noResultsText="No states found."
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CITY (searchable, depends on state) */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <Combobox
                          options={cityOptions}
                          // we store the city NAME directly
                          value={
                            cityOptions.find(
                              (o) =>
                                o.label.toLowerCase() ===
                                (field.value || "").toLowerCase()
                            )?.value ?? ""
                          }
                          onChange={(v) => field.onChange(v)}
                          placeholder={
                            stateCode ? "Select city" : "Select a state first"
                          }
                          searchPlaceholder="Type a city…"
                          noResultsText={
                            stateCode ? "No cities found." : "Select a state first"
                          }
                          disabled={!stateCode || cityOptions.length === 0}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input placeholder="15-digit GSTIN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="pan" render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input placeholder="10-digit PAN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField
                    control={form.control}
                    name="gstRegistrationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>GST Registration Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {gstRegistrationTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isTDSApplicable"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>TDS Applicable or Not</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                {/* {isTDSApplicable && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                         <FormField
                            control={form.control}
                            name="tdsRate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>TDS Rate (%)</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g. 10" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tdsSection"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>TDS Section</FormLabel>
                                <FormControl><Input placeholder="e.g. 194J" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )} */}
            </div>
        </ScrollArea>
        <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {vendor ? "Save Changes" : "Create Vendor"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
