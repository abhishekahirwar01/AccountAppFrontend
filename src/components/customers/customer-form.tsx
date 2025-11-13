// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Loader2 } from "lucide-react";
// import React from "react";
// import { useToast } from "@/hooks/use-toast";
// import type { Party } from "@/lib/types";
// import { Switch } from "../ui/switch";
// import { ScrollArea } from "../ui/scroll-area";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import { State, City } from "country-state-city";
// import { Combobox } from "@/components/ui/combobox";

// interface CustomerFormProps {
//   customer?: Party;
//   initialName?: string;
//   onSuccess: (customer: Party) => void;
// }

// const gstRegistrationTypes = [
//   "Regular",
//   "Composition",
//   "Unregistered",
//   "Consumer",
//   "Overseas",
//   "Special Economic Zone",
//   "Unknown",
// ] as const;

// // const formSchema = z
// //   .object({
// //     name: z.string().min(2, "Customer name is required."),
// //     contactNumber: z.string().optional(),
// //     email: z
// //       .string()
// //       .email("Invalid email address.")
// //       .optional()
// //       .or(z.literal("")),
// //     address: z.string().optional(),
// //     city: z.string().optional(),
// //     state: z.string().optional(),
// //     gstin: z.string().optional().or(z.literal("")), // will validate conditionally
// //     gstRegistrationType: z.enum(gstRegistrationTypes).default("Unregistered"),
// //     pan: z
// //       .string()
// //       .length(10, "PAN must be 10 characters.")
// //       .optional()
// //       .or(z.literal("")),
// //     isTDSApplicable: z.boolean().default(false),
// //     tdsRate: z.coerce.number().optional(),
// //     tdsSection: z.string().optional(),
// //   })
// //   .superRefine((data, ctx) => {
// //     const needsGstin = data.gstRegistrationType !== "Unregistered";
// //     if (needsGstin) {
// //       const v = (data.gstin || "").trim();
// //       if (v.length !== 15) {
// //         ctx.addIssue({
// //           code: z.ZodIssueCode.custom,
// //           path: ["gstin"],
// //           message:
// //             "GSTIN must be 15 characters for the selected registration type.",
// //         });
// //       }
// //     }
// //   });

// const formSchema = z
//   .object({
//     name: z.string().min(2, "Customer name is required."),
//     contactNumber: z.string().optional(),
//     email: z.string().optional(),
//     address: z.string().optional(),
//     city: z.string().optional(),
//     state: z.string().optional(),
//     pincode: z.string().optional(),
//     gstin: z.string().optional().or(z.literal("")),
//     gstRegistrationType: z.enum(gstRegistrationTypes).default("Unregistered"),
//     pan: z
//       .string()
//       .length(10, "PAN must be 10 characters.")
//       .optional()
//       .or(z.literal("")),
//     isTDSApplicable: z.boolean().default(false),
//     tdsRate: z.coerce.number().optional(),
//     tdsSection: z.string().optional(),
//   })
//   .superRefine((data, ctx) => {
//     const needsGstin = data.gstRegistrationType !== "Unregistered";
//     if (needsGstin) {
//       const v = (data.gstin || "").trim();
//       if (v.length !== 15) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ["gstin"],
//           message: "GSTIN must be 15 characters for the selected registration type.",
//         });
//       }
//     }
//   });

// type FormData = z.infer<typeof formSchema>;

// export function CustomerForm({
//   customer,
//   initialName,
//   onSuccess,
// }: CustomerFormProps) {
//   const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
//   const { toast } = useToast();
//   const [isSubmitting, setIsSubmitting] = React.useState(false);

//   const form = useForm<FormData>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       name: customer?.name || initialName || "",
//       contactNumber: customer?.contactNumber || "",
//       email: customer?.email || "",
//       address: customer?.address || "",
//       city: customer?.city || "",
//       state: customer?.state || "",
//       pincode: customer?.pincode || "",
//       gstin: customer?.gstin || "",
//       gstRegistrationType: customer?.gstRegistrationType || "Unregistered",
//       pan: customer?.pan || "",
//       isTDSApplicable: customer?.isTDSApplicable || false,
//       tdsRate: customer?.tdsRate || 0,
//       tdsSection: customer?.tdsSection || "",
//     },
//   });

//   const regType = form.watch("gstRegistrationType");
//   const indiaStates = React.useMemo(() => State.getStatesOfCountry("IN"), []);
//   const [stateCode, setStateCode] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     if (regType === "Unregistered") {
//       form.setValue("gstin", "", { shouldValidate: true });
//     }
//   }, [regType, form]);

//   React.useEffect(() => {
//     const currentStateName = form.getValues("state")?.trim();
//     if (!currentStateName) {
//       setStateCode(null);
//       return;
//     }
//     const found = indiaStates.find(
//       (s) => s.name.toLowerCase() === currentStateName.toLowerCase()
//     );
//     setStateCode(found?.isoCode || null);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const stateOptions = React.useMemo(
//     () =>
//       indiaStates
//         .map((s) => ({ value: s.isoCode, label: s.name }))
//         .sort((a, b) => a.label.localeCompare(b.label)),
//     [indiaStates]
//   );

//   const cityOptions = React.useMemo(() => {
//     if (!stateCode) return [];
//     const list = City.getCitiesOfState("IN", stateCode);
//     return list
//       .map((c) => ({ value: c.name, label: c.name }))
//       .sort((a, b) => a.label.localeCompare(b.label));
//   }, [stateCode]);


//   const isTDSApplicable = form.watch("isTDSApplicable");

//     async function onSubmit(values: FormData) {
//     setIsSubmitting(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const url = customer
//         ? `${baseURL}/api/parties/${customer._id}`
//         : `${baseURL}/api/parties`;

//       const method = customer ? "PUT" : "POST";

//       const cleanedValues = Object.fromEntries(
//         Object.entries(values).map(([key, value]) => [
//           key,
//           value === "" ? undefined : value
//         ])
//       );

//       const res = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(cleanedValues),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(
//           data.message ||
//             `Failed to ${customer ? "update" : "create"} customer.`
//         );
//       }

//       onSuccess(data.party);
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Operation Failed",
//         description:
//           error instanceof Error ? error.message : "An unknown error occurred.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <Form {...form}>

//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="contents"
//         onSelect={(e) => e.preventDefault()}
//         onKeyDown={(e) => {
//           // Prevent form selection on Tab key
//           if (e.key === 'Tab') {
//             e.preventDefault();
//             // Find next focusable element
//             const focusableElements = document.querySelectorAll(
//               'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
//             );
//             const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
//             const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
//             if (nextIndex >= 0 && nextIndex < focusableElements.length) {
//               (focusableElements[nextIndex] as HTMLElement).focus();
//             }
//           }
//         }}
//       >
//         <ScrollArea className="max-h-[60vh] flex-1" tabIndex={-1}>
//           <div className=" px-6 select-none">

//             <FormField
//               control={form.control}
//               name="name"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Customer Name<span className="text-red-600">*</span></FormLabel>
//                   <FormControl>
//                     <Input placeholder="e.g. John Doe" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <div className="grid  md:grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="contactNumber"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Mobile Number / Whatsapp</FormLabel>
//                     <FormControl>
//                       <Input placeholder="e.g. 9876543210" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email ID</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="email"
//                         placeholder="e.g. john.doe@example.com"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//             <FormField
//               control={form.control}
//               name="address"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Address</FormLabel>
//                   <FormControl>
//                     <Input placeholder="e.g. 456 Park Avenue" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
           

//             {/* <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="city"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>City</FormLabel>
//                     <FormControl>
//                       <Input placeholder="e.g. Mumbai" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="state"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>State</FormLabel>
//                     <FormControl>
//                       <Input placeholder="e.g. Maharashtra" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div> */}
//             <div className="grid grid-cols-2 gap-4">
//               {/* STATE (searchable) */}
//               <FormField
//                 control={form.control}
//                 name="state"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>State</FormLabel>
//                     <Combobox
//                       options={stateOptions}
//                       // value is the isoCode of the selected state
//                       value={
//                         stateCode ??
//                         stateOptions.find(
//                           (o) =>
//                             o.label.toLowerCase() ===
//                             (field.value || "").toLowerCase()
//                         )?.value ??
//                         ""
//                       }
//                       onChange={(iso) => {
//                         setStateCode(iso);
//                         const selected = indiaStates.find(
//                           (s) => s.isoCode === iso
//                         );
//                         // store STATE NAME in your form (backend unchanged)
//                         field.onChange(selected?.name || "");
//                         // clear city when state changes
//                         form.setValue("city", "", { shouldValidate: true });
//                       }}
//                       placeholder="Select state"
//                       searchPlaceholder="Type a state…"
//                       noResultsText="No states found."
//                     />
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* CITY (searchable, depends on state) */}
//               <FormField
//                 control={form.control}
//                 name="city"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>City</FormLabel>
//                     <Combobox
//                       options={cityOptions}
//                       // we store the city NAME directly
//                       value={
//                         cityOptions.find(
//                           (o) =>
//                             o.label.toLowerCase() ===
//                             (field.value || "").toLowerCase()
//                         )?.value ?? ""
//                       }
//                       onChange={(v) => field.onChange(v)}
//                       placeholder={
//                         stateCode ? "Select city" : "Select a state first"
//                       }
//                       searchPlaceholder="Type a city…"
//                       noResultsText={
//                         stateCode ? "No cities found." : "Select a state first"
//                       }
//                       disabled={!stateCode || cityOptions.length === 0}
//                     />
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//              <FormField
//               control={form.control}
//               name="pincode"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Pincode</FormLabel>
//                   <FormControl>
//                     <Input placeholder="e.g. 400001" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <div className="grid md:grid-cols-2 gap-4">
//               {/* …after City/State … */}

//               <FormField
//                 control={form.control}
//                 name="gstRegistrationType"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>GST Registration Type</FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select registration type" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {gstRegistrationTypes.map((type) => (
//                           <SelectItem key={type} value={type}>
//                             {type}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* PAN always visible */}
//               <FormField
//                 control={form.control}
//                 name="pan"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>PAN</FormLabel>
//                     <FormControl>
//                       <Input placeholder="10-digit PAN" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               {/* GSTIN only when registered */}
//               {regType !== "Unregistered" && (
//                 <FormField
//                   control={form.control}
//                   name="gstin"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>GSTIN</FormLabel>
//                       <FormControl>
//                         <Input placeholder="15-digit GSTIN" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               )}
//             </div>
//             {/* <FormField
//               control={form.control}
//               name="gstRegistrationType"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>GST Registration Type</FormLabel>
//                   <Select onValueChange={field.onChange} value={field.value}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select registration type" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {gstRegistrationTypes.map((type) => (
//                         <SelectItem key={type} value={type}>
//                           {type}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             /> */}
//             <FormField
//               control={form.control}
//               name="isTDSApplicable"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
//                   <div className="space-y-0.5">
//                     <FormLabel>TDS Applicable ?</FormLabel>
//                   </div>
//                   <FormControl>
//                     <Switch
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />

//             {isTDSApplicable && (
//               <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
//                 <FormField
//                   control={form.control}
//                   name="tdsRate"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>TDS Rate (%)</FormLabel>
//                       <FormControl>
//                         <Input type="number" placeholder="e.g. 10" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <FormField
//                   control={form.control}
//                   name="tdsSection"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>TDS Section</FormLabel>
//                       <FormControl>
//                         <Input placeholder="e.g. 194J" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </div>
//             )}
//           </div>
//         </ScrollArea>
//         <div className="flex justify-end p-6 border-t bg-background">
//           <Button type="submit" disabled={isSubmitting}>
//             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             {customer ? "Save Changes" : "Create Customer"}
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// }










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
import { Loader2 } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Party } from "@/lib/types";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { State, City } from "country-state-city";
import { Combobox } from "@/components/ui/combobox";
import { CompanyFormValidations } from "@/lib/validation-utils";

interface CustomerFormProps {
  customer?: Party;
  initialName?: string;
  onSuccess: (customer: Party) => void;
}

const gstRegistrationTypes = [
  "Regular",
  "Composition",
  "Unregistered",
  "Consumer",
  "Overseas",
  "Special Economic Zone",
  "Unknown",
] as const;

const formSchema = z
  .object({
    name: z.string().min(2, "Customer name is required."),
    contactNumber: z.string()
      .optional()
      .or(z.literal(''))
      .refine((val) => {
        // If empty, it's valid
        if (!val || val.trim() === '') return true;
        
        // If filled, validate as Indian mobile number (10 digits starting with 6-9)
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(val.replace(/\s+/g, '').replace(/[^\d]/g, ''));
      }, {
        message: "Please enter a valid 10-digit Indian mobile number"
      }),
    email: z.string()
      .optional()
      .or(z.literal(''))
      .refine((val) => {
        // If empty, it's valid
        if (!val || val.trim() === '') return true;
        
        // If filled, validate as email using Zod's built-in email validation
        try {
          z.string().email().parse(val);
          return true;
        } catch {
          return false;
        }
      }, {
        message: "Please enter a valid email address"
      }),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gstin: z.string()
      .optional()
      .or(z.literal(""))
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
      .or(z.literal(""))
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
  })
  .superRefine((data, ctx) => {
    const needsGstin = data.gstRegistrationType !== "Unregistered";
    if (needsGstin) {
      const v = (data.gstin || "").trim();
      if (v.length !== 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gstin"],
          message: "GSTIN must be 15 characters for the selected registration type.",
        });
      }
    }
  });

type FormData = z.infer<typeof formSchema>;

export function CustomerForm({
  customer,
  initialName,
  onSuccess,
}: CustomerFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || initialName || "",
      contactNumber: customer?.contactNumber || "",
      email: customer?.email || "",
      address: customer?.address || "",
      city: customer?.city || "",
      state: customer?.state || "",
      pincode: customer?.pincode || "",
      gstin: customer?.gstin || "",
      gstRegistrationType: customer?.gstRegistrationType || "Unregistered",
      pan: customer?.pan || "",
      isTDSApplicable: customer?.isTDSApplicable || false,
      tdsRate: customer?.tdsRate || 0,
      tdsSection: customer?.tdsSection || "",
    },
  });

  const regType = form.watch("gstRegistrationType");
  const indiaStates = React.useMemo(() => State.getStatesOfCountry("IN"), []);
  const [stateCode, setStateCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (regType === "Unregistered") {
      form.setValue("gstin", "", { shouldValidate: true });
    }
  }, [regType, form]);

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

  const isTDSApplicable = form.watch("isTDSApplicable");

  // Function to clean mobile number by removing non-digit characters
  const cleanMobileNumber = (mobile: string) => {
    return mobile.replace(/\s+/g, '').replace(/[^\d]/g, '');
  };

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = customer
        ? `${baseURL}/api/parties/${customer._id}`
        : `${baseURL}/api/parties`;

      const method = customer ? "PUT" : "POST";

      const cleanedValues = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          key === 'contactNumber' && value
            ? cleanMobileNumber(value as string)
            : value
        ])
      );

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedValues),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message ||
            `Failed to ${customer ? "update" : "create"} customer.`
        );
      }

      onSuccess(data.party);
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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
          <div className=" px-6 select-none">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name<span className="text-red-600">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid  md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number / Whatsapp</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 9876543210" 
                        {...field}
                        onChange={(e) => {
                          // Remove non-digits and limit to 10 characters for better UX
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                          field.onChange(cleaned);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ID</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g. john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 456 Park Avenue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           
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
                        field.onChange(selected?.name || "");
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
             <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 400001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gstRegistrationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Registration Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select registration type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gstRegistrationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PAN always visible */}
              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit PAN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GSTIN only when registered */}
              {regType !== "Unregistered" && (
                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input placeholder="15-digit GSTIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="isTDSApplicable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>TDS Applicable ?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isTDSApplicable && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="tdsRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TDS Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 10" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input placeholder="e.g. 194J" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end p-6 border-t bg-background">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {customer ? "Save Changes" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}