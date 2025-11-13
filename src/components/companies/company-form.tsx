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
import { ImageCropper } from '@/components/ui/image-cropper';
import { Input } from "@/components/ui/input";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlusCircle,
  Save,
  AlertCircle,
} from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Company, Client } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Country, State, City } from "country-state-city";
import { Combobox } from "@/components/ui/combobox";
import { useCompanyFormValidation, CompanyFormValidations } from '@/lib/validation-utils';

interface AdminCompanyFormProps {
  company?: Company;
  clients: Client[];
  onFormSubmit: () => void;
}

const formSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  businessName: z.string().min(2),
  businessType: z.string().min(2),
  address: z.string().min(5),
  City: z.string().optional(),
  addressState: z.string().optional(),
  Country: z.string().optional(),
  Pincode: z.string().optional(),
  Telephone: z.string().optional(),
  mobileNumber: z
    .string({ required_error: "Mobile number is required" })
    .trim()
    .min(10, "Enter a valid 10-digit mobile number")
    .max(10, "Enter a valid 10-digit mobile number"),

  // emailId: z.string().optional(),
  emailId: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Optional field
    const validation = CompanyFormValidations.validateEmail(val);
    return validation.isValid;
  }, "Please enter a valid email address"),
  
  Website: z.string().optional(),
  // PANNumber: z.string().optional(),
   PANNumber: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Optional field
    const validation = CompanyFormValidations.validatePANNumber(val);
    return validation.isValid;
  }, "Please enter a valid PAN number (Format: AAAAA9999A)"),
  IncomeTaxLoginPassword: z.string().optional(),
  // gstin: z.string().optional(),
    gstin: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Optional field
    const validation = CompanyFormValidations.validateGSTIN(val);
    return validation.isValid;
  }, "Please enter a valid GSTIN"),
  gstState: z.string().optional(),
  RegistrationType: z.string().optional(),
  PeriodicityofGSTReturns: z.string().optional(),
  GSTUsername: z.string().optional(),
  GSTPassword: z.string().optional(),
  ewayBillApplicable: z.enum(["true", "false"]),
  EWBBillUsername: z.string().optional(),
  EWBBillPassword: z.string().optional(),
  // TANNumber: z.string().optional(),
  TANNumber: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Optional field
    const validation = CompanyFormValidations.validateTANNumber(val);
    return validation.isValid;
  }, "Please enter a valid TAN number (Format: ABCD12345E)"),
  TAXDeductionCollectionAcc: z.string().optional(),
  DeductorType: z.string().optional(),
  TDSLoginUsername: z.string().optional(),
  TDSLoginPassword: z.string().optional(),
  client: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultBusinessTypes = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited Company",
  "Limited Company",
  "Others",
];

// GST Registration Types (Copied from the reference code)
const gstRegistrationTypes = [
  "Sole Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited Company",
  "Public Limited Company",
  "Section 8 Company",
  "Others",
];

// Fields for each step - client field is conditional
const getStepFields = (isClient: boolean) => ({
  1: [
    ...(isClient ? [] : ["client"]),
    "businessType",
    "businessName",
    "registrationNumber",
    "address",
    "Country",
    "addressState",
    "City",
    "Pincode",
    "Telephone",
    "mobileNumber",
  ],
  2: [
    "gstin",
    "gstState",
    "RegistrationType",
    "PeriodicityofGSTReturns",
    "GSTUsername",
    "GSTPassword",
    "ewayBillApplicable",
    "EWBBillUsername",
    "EWBBillPassword",
  ],
  3: [
    "TANNumber",
    "TAXDeductionCollectionAcc",
    "DeductorType",
    "TDSLoginUsername",
    "TDSLoginPassword",
  ],
});

// Pretty labels for fields
const FIELD_LABELS: Partial<Record<keyof FormData | string, string>> = {
  client: "Assign to Client",
  businessType: "Business Type",
  businessName: "Business Name",
  registrationNumber: "Registration Number",
  address: "Address",
  City: "City",
  addressState: "Address State",
  Country: "Country",
  Pincode: "Pincode",
  Telephone: "Telephone",
  mobileNumber: "Mobile Number",
  emailId: "Email ID",
  Website: "Website",
  PANNumber: "PAN Number",
  IncomeTaxLoginPassword: "Income Tax Login Password",
  gstin: "GSTIN",
  gstState: "GST State",
  RegistrationType: "Registration Type",
  PeriodicityofGSTReturns: "Periodicity of GST Returns",
  GSTUsername: "GST Username",
  GSTPassword: "GST Password",
  ewayBillApplicable: "E-Way Bill Applicable",
  EWBBillUsername: "EWB Username",
  EWBBillPassword: "EWB Password",
  TANNumber: "TAN Number",
  TAXDeductionCollectionAcc: "Tax Deduction/Collection A/c",
  DeductorType: "Deductor Type",
  TDSLoginUsername: "TDS Login Username",
  TDSLoginPassword: "TDS Login Password",
};

// fallback: camelCase/PascalCase/underscores → Title Case
const titleize = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

// single helper
const getLabel = (name: keyof FormData | string) =>
  FIELD_LABELS[name] ?? titleize(String(name));

export function CompanyForm({
  company,
  clients,
  onFormSubmit,
}: AdminCompanyFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(
    company?.logo
      ? company.logo.startsWith("/uploads")
        ? `${baseURL}${company.logo}` // served by your API (static /uploads)
        : company.logo // absolute URL already
      : null
  );

  // Duplicate check states
  const [isCheckingDuplicate, setIsCheckingDuplicate] = React.useState(false);
  const [duplicateError, setDuplicateError] = React.useState<string>("");
  const checkTimeoutRef = React.useRef<NodeJS.Timeout>();

   const { validateField } = useCompanyFormValidation();

  const role = localStorage.getItem("role");
  const isClient = role === "customer";
const [showCropper, setShowCropper] = React.useState(false);
const [tempImageSrc, setTempImageSrc] = React.useState<string>("");
const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Default country = India
  const india = Country.getCountryByCode("IN")!;
  const [countryCode, setCountryCode] = React.useState<string>("IN"); // ISO of country
  const [stateCode, setStateCode] = React.useState<string>(""); // ISO of state
  const [stateOptions, setStateOptions] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [cityOptions, setCityOptions] = React.useState<
    { label: string; value: string }[]
  >([]);

  // States for GST State dropdown (Copied from the reference code)
  const [gstStateCode, setGstStateCode] = React.useState<string>("");
  const [gstStateOptions, setGstStateOptions] = React.useState<
    { label: string; value: string }[]
  >([]);

 const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleFieldValidation = (fieldName: string, value: string) => {
    const validation = validateField(fieldName, value);
    
    setFieldErrors(prev => {
      if (validation.isValid) {
        const { [fieldName]: removed, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [fieldName]: validation.message };
      }
    });
  };
  const getClientId = (client: string | Client | undefined) => {
    if (!client) return "";
    if (typeof client === "string") return client;
    return client._id;
  };

  // Function to scroll to first error field
 const scrollToFirstError = () => {
  const formErrors = form.formState.errors;
  const errorFields = Object.keys(formErrors);

  if (errorFields.length > 0) {
    const firstErrorField = errorFields[0];

    // Try normal input first
    let element = document.querySelector(`[name="${firstErrorField}"]`);

    // Fallback: also check data-name or id attributes (for custom components)
    if (!element) {
      element = document.querySelector(`[data-name="${firstErrorField}"]`) ||
                document.querySelector(`#${firstErrorField}`);
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        (element as HTMLElement).focus?.();
      }, 400);
    }
  }
};

  const checkDuplicateRegistration = React.useCallback(
    async (regNumber: string) => {
      console.log("🔍 Starting duplicate check for:", regNumber);
      
      if (!regNumber || regNumber.trim() === "") {
        console.log("⚠️ Empty registration number, skipping check");
        setDuplicateError("");
        return;
      }
    
      if (company?.registrationNumber === regNumber) {
        console.log("✅ Same company being edited, skipping duplicate check");
        setDuplicateError("");
        return;
      }

      setIsCheckingDuplicate(true);
      setDuplicateError("");

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        console.log("🔑 Token:", token ? "Present ✅" : "Missing ❌");
        
        if (!token) {
          console.error("❌ No token found in localStorage");
          setIsCheckingDuplicate(false);
          return;
        }

        const apiUrl = `${baseURL}/api/companies/check-duplicate?registrationNumber=${encodeURIComponent(regNumber)}`;
        console.log("🌐 API URL:", apiUrl);
        console.log("📡 Making API call...");

        const res = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("📥 Response Status:", res.status, res.statusText);
        
        const data = await res.json();
        console.log("📦 Response Data:", data);
        
        if (res.ok) {
          if (data.exists) {
            console.log("❌ Registration number already exists!");
            setDuplicateError("This registration number is already in use");
          } else {
            console.log("✅ Registration number is available");
            setDuplicateError("");
          }
        } else {
          console.error("❌ API Error:", res.status, data);
        }
      } catch (error) {
        console.error("❌ Error checking duplicate:", error);
      } finally {
        setIsCheckingDuplicate(false);
        console.log("🏁 Duplicate check completed");
      }
    },
    [baseURL, company]
  );

  // Debounced duplicate check
  const handleRegistrationChange = (value: string) => {
    // Clear previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Set new timeout for debounced check
    checkTimeoutRef.current = setTimeout(() => {
      checkDuplicateRegistration(value);
    }, 500); // 500ms delay
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      registrationNumber: company?.registrationNumber || "",
      businessName: company?.businessName || "",
      businessType: company?.businessType || "",
      address: company?.address || "",
      City: company?.City || "",
      addressState: company?.addressState || "",
      Country: company?.Country || "",
      Pincode: company?.Pincode || "",
      Telephone: company?.Telephone || "",
      mobileNumber: company?.mobileNumber || "",
      emailId: company?.emailId || "",
      Website: company?.Website || "",
      PANNumber: company?.PANNumber || "",
      IncomeTaxLoginPassword: company?.IncomeTaxLoginPassword || "",
      gstin: company?.gstin || "",
      gstState: company?.gstState || "",
      RegistrationType: company?.RegistrationType || "",
      PeriodicityofGSTReturns: company?.PeriodicityofGSTReturns || "",
      GSTUsername: company?.GSTUsername || "",
      GSTPassword: company?.GSTPassword || "",
      ewayBillApplicable:
        company?.ewayBillApplicable === true
          ? "true"
          : company?.ewayBillApplicable === false
            ? "false"
            : "false",
      
      EWBBillUsername: company?.EWBBillUsername || "",
      EWBBillPassword: company?.EWBBillPassword || "",
      TANNumber: company?.TANNumber || "",
      TAXDeductionCollectionAcc: company?.TAXDeductionCollectionAcc || "",
      DeductorType: company?.DeductorType || "",
      TDSLoginUsername: company?.TDSLoginUsername || "",
      TDSLoginPassword: company?.TDSLoginPassword || "",
      client: getClientId(company?.client),
    },
  });

  // useEffect to set initial gstStateCode (Copied from the reference code)
  React.useEffect(() => {
    const existingGstStateName = (form.getValues("gstState") || "").toString();
    if (existingGstStateName) {
      const iso = State.getStatesOfCountry("IN").find(
        (s) => s.name.toLowerCase() === existingGstStateName.toLowerCase()
      )?.isoCode;
      if (iso) setGstStateCode(iso);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // useEffect to populate GST state options (Copied from the reference code)
  React.useEffect(() => {
    const states = State.getStatesOfCountry("IN") || []; // Assuming India for GST
    setGstStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
  }, [countryCode]); // eslint-disable-line react-hooks/exhaustive-deps


  // Reset form when company changes
  React.useEffect(() => {
    if (company) {
      form.reset({
        registrationNumber: company.registrationNumber || "",
        businessName: company.businessName || "",
        businessType: company.businessType || "",
        address: company.address || "",
        City: company.City || "",
        addressState: company.addressState || "",
        Country: company.Country || "",
        Pincode: company.Pincode || "",
        Telephone: company.Telephone || "",
        mobileNumber: company.mobileNumber || "",
        emailId: company.emailId || "",
        Website: company.Website || "",
        PANNumber: company.PANNumber || "",
        IncomeTaxLoginPassword: company.IncomeTaxLoginPassword || "",
        gstin: company.gstin || "",
        gstState: company.gstState || "",
        RegistrationType: company.RegistrationType || "",
        PeriodicityofGSTReturns: company.PeriodicityofGSTReturns || "",
        GSTUsername: company.GSTUsername || "",
        GSTPassword: company.GSTPassword || "",
        ewayBillApplicable:
          company.ewayBillApplicable === true
            ? "true"
            : company.ewayBillApplicable === false
              ? "false"
              : "false",
        EWBBillUsername: company.EWBBillUsername || "",
        EWBBillPassword: company.EWBBillPassword || "",
        TANNumber: company.TANNumber || "",
        TAXDeductionCollectionAcc: company.TAXDeductionCollectionAcc || "",
        DeductorType: company.DeductorType || "",
        TDSLoginUsername: company.TDSLoginUsername || "",
        TDSLoginPassword: company.TDSLoginPassword || "",
        client: getClientId(company.client),
      });
    } else {
      form.reset({
        registrationNumber: "",
        businessName: "",
        businessType: "",
        address: "",
        City: "",
        addressState: "",
        Country: "",
        Pincode: "",
        Telephone: "",
        mobileNumber: "",
        emailId: "",
        Website: "",
        PANNumber: "",
        IncomeTaxLoginPassword: "",
        gstin: "",
        gstState: "",
        RegistrationType: "",
        PeriodicityofGSTReturns: "",
        GSTUsername: "",
        GSTPassword: "",
        ewayBillApplicable: "false",
        EWBBillUsername: "",
        EWBBillPassword: "",
        TANNumber: "",
        TAXDeductionCollectionAcc: "",
        DeductorType: "",
        TDSLoginUsername: "",
        TDSLoginPassword: "",
        client: "",
      });
    }
  }, [company, form]);

  async function onSubmit(values: FormData) {
    // Final check before submission
    if (duplicateError) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: duplicateError,
      });
      return;
    }

    console.log("Form onSubmit called with values:", values);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = company
        ? `${baseURL}/api/companies/${company._id}`
        : isClient
          ? `${baseURL}/api/companies/create`
          : `${baseURL}/api/companies`;
      console.log("Submitting to URL:", url);
      const method = company ? "PUT" : "POST";

      // Map form values → body fields expected by backend
      // NOTE: backend expects selectedClient; don't send "client" directly.
      const { client, ...rest } = values;
      const payload = isClient ? rest : { ...rest, selectedClient: client };

      let headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      let body: BodyInit;

      if (logoFile || method === "POST") {
        // Use FormData for create or when logo is being uploaded
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        if (logoFile) fd.append("logo", logoFile);
        body = fd;
      } else {
        // Use JSON for update without logo
        // Convert ewayBillApplicable to boolean for JSON
        const jsonPayload = { ...payload, ewayBillApplicable: payload.ewayBillApplicable === "true" };
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(jsonPayload);
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed.");

      toast({
        title: company ? "Company Updated!" : "Company Created!",
        description: `${values.businessName} has been successfully saved.`,
      });
      onFormSubmit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveLogo() {
    if (!company?._id) return;
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/companies/${company._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logo: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove logo");

      setLogoFile(null);
      setLogoPreview(null);
      toast({ title: "Logo removed" });
      onFormSubmit();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: e instanceof Error ? e.message : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  React.useEffect(() => {
    const states = State.getStatesOfCountry(countryCode) || [];
    setStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
  }, [countryCode]);

  // Build cities whenever state changes
  React.useEffect(() => {
    if (!countryCode || !stateCode) {
      setCityOptions([]);
      return;
    }
    const cities = City.getCitiesOfState(countryCode, stateCode) || [];
    setCityOptions(cities.map((c) => ({ label: c.name, value: c.name })));
  }, [countryCode, stateCode]);

  // On load, default Country to India and sync existing state/city (edit mode)
  React.useEffect(() => {
    // default country name
    if (!form.getValues("Country")) {
      form.setValue("Country", india.name, { shouldValidate: true });
    }
    const existingStateName = (form.getValues("addressState") || "").toString();
    if (existingStateName) {
      const iso = State.getStatesOfCountry("IN").find(
        (s) => s.name.toLowerCase() === existingStateName.toLowerCase()
      )?.isoCode;
      if (iso) setStateCode(iso);
    }
  }, []);

  // Handle Next button with duplicate check
  const handleNextStep = async () => {
    // Check if duplicate error exists for registration number
    if (step === 1 && duplicateError) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: duplicateError,
      });
      return;
    }

    const isValid = await form.trigger(getStepFields(isClient)[step as keyof ReturnType<typeof getStepFields>] as (keyof FormData)[]);
    if (isValid) {
      setStep(step + 1);
    } else {
      scrollToFirstError();
    }
  };

  // Handle form submission with scroll to error
  const handleFormSubmit = async () => {
    const currentStepFields = getStepFields(isClient)[step as keyof ReturnType<typeof getStepFields>] as (keyof FormData)[];
    const isValid = await form.trigger(currentStepFields);
    
    if (!isValid) {
      scrollToFirstError();
      return;
    }

    if (step === 3) {
      form.handleSubmit(onSubmit)();
    }
  };

  // return (
  //   <>
  //     <div className="w-full max-w-5xl mx-auto px-4 md:px-8 overflow-y-auto max-h-[80vh] md:block">
  //       <Form {...form}>
  //         <form className="space-y-4">
  //           {/* Mobile Stepper - Vertical */}
  //           <div className="md:hidden flex flex-col space-y-3 pb-2">
  //             {[
  //               { number: 1, label: "Company Basic Details" },
  //               { number: 2, label: "GST Registration Details" },
  //               { number: 3, label: "Company TDS Details" },
  //             ].map(({ number, label }) => (
  //               <button
  //                 key={number}
  //                 type="button"
  //                 onClick={() => setStep(number)}
  //                 className={`flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 ${
  //                   step === number
  //                     ? "bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-950/30 dark:border-indigo-800"
  //                     : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
  //                 } hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600`}
  //               >
  //                 <div
  //                   className={`w-6 h-6 text-base flex items-center justify-center rounded-full border-2 font-semibold flex-shrink-0 transition-all ${
  //                     step === number
  //                       ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
  //                       : "bg-white text-gray-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
  //                   }`}
  //                 >
  //                   {number}
  //                 </div>
  //                 <span
  //                   className={`text-sm font-medium ${
  //                     step === number
  //                       ? "text-indigo-600 dark:text-indigo-400"
  //                       : "text-gray-600 dark:text-gray-300"
  //                   }`}
  //                 >
  //                   {label}
  //                 </span>
  //                 {step === number && (
  //                   <ChevronRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 ml-auto flex-shrink-0" />
  //                 )}
  //               </button>
  //             ))}
  //           </div>

  //           {/* Desktop Stepper - Hidden on mobile */}
  //           <div className="hidden md:flex justify-center items-center gap-8 pb-10">
  //             {[
  //               { number: 1, label: "Company Basic Details" },
  //               { number: 2, label: "GST Registration Details" },
  //               { number: 3, label: "Company TDS Details" },
  //             ].map(({ number, label }, index, array) => (
  //               <div key={number} className="flex items-center">
  //                 <button
  //                   type="button"
  //                   onClick={() => setStep(number)}
  //                   className={`flex flex-col items-center group transition-all duration-300`}
  //                 >
  //                   <div
  //                     className={`w-8 h-8 text-base flex items-center justify-center rounded-full border-2 font-semibold mb-3 transition-all ${
  //                       step === number
  //                         ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110"
  //                         : step > number
  //                           ? "bg-green-500 text-white border-green-500"
  //                           : "bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 group-hover:border-indigo-400 dark:group-hover:border-indigo-500"
  //                     }`}
  //                   >
  //                     {step > number ? <Check className="h-5 w-5" /> : number}
  //                   </div>
  //                   <span
  //                     className={`text-sm font-medium text-center  leading-tight ${
  //                       step === number
  //                         ? "text-indigo-600 dark:text-indigo-400 font-semibold"
  //                         : step > number
  //                           ? "text-green-600 dark:text-green-400"
  //                           : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
  //                     }`}
  //                   >
  //                     {label}
  //                   </span>
  //                   {step === number && (
  //                     <div className="w-6 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-2"></div>
  //                   )}
  //                 </button>

  //                 {index < array.length - 1 && (
  //                   <div
  //                     className={`w-16 h-1 rounded-full mx-4 transition-all duration-300 ${
  //                       step > number + 1
  //                         ? "bg-green-500"
  //                         : step > number
  //                           ? "bg-indigo-300 dark:bg-indigo-600"
  //                           : "bg-gray-200 dark:bg-gray-700"
  //                     }`}
  //                   />
  //                 )}
  //               </div>
  //             ))}
  //           </div>

  //           <div className="pb-20 md:pb-[15vh]">
  //             {/* Step 1 */}
  //             {step === 1 && (
  //               <div className="space-y-4">
  //                 {!isClient && (
  //                   <FormField
  //                     control={form.control}
  //                     name="client"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           Assign to Client
  //                         </FormLabel>
  //                         <Select
  //                           onValueChange={field.onChange}
  //                           value={field.value}
  //                           defaultValue={field.value}
  //                         >
  //                           <FormControl>
  //                             <SelectTrigger className="text-sm">
  //                               <SelectValue placeholder="Select a client" />
  //                             </SelectTrigger>
  //                           </FormControl>
  //                           <SelectContent>
  //                             {clients.map((client) => (
  //                               <SelectItem
  //                                 key={client._id}
  //                                 value={client._id}
  //                                 className="text-sm"
  //                               >
  //                                 {client.contactName} - ({client.email})
  //                               </SelectItem>
  //                             ))}
  //                           </SelectContent>
  //                         </Select>
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />
  //                 )}

  //                 <div className="space-y-2">
  //                   <FormLabel className="text-sm font-medium">
  //                     Company Logo
  //                   </FormLabel>
  //                   <Input
  //                     type="file"
  //                     accept="image/*"
  //                     onChange={(e) => {
  //                       const f = e.target.files?.[0] || null;
  //                       setLogoFile(f);
  //                       setLogoPreview(
  //                         f ? URL.createObjectURL(f) : logoPreview
  //                       );
  //                     }}
  //                     className="text-sm"
  //                   />
  //                   {logoPreview && (
  //                     <img
  //                       src={logoPreview}
  //                       alt="Logo preview"
  //                       className="mt-2 h-16 w-auto rounded border"
  //                     />
  //                   )}
  //                   {company?.logo && (
  //                     <Button
  //                       type="button"
  //                       variant="outline"
  //                       size="sm"
  //                       onClick={handleRemoveLogo}
  //                       className="mt-2 text-xs"
  //                     >
  //                       Remove current logo
  //                     </Button>
  //                   )}
  //                 </div>

  //                 <div className="grid md:grid-cols-2 gap-4">
  //                   <FormField
  //                     control={form.control}
  //                     name="businessType"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           Business Type
  //                         </FormLabel>
  //                         <Select
  //                           onValueChange={field.onChange}
  //                           value={field.value}
  //                           defaultValue={field.value}
  //                         >
  //                           <FormControl>
  //                             <SelectTrigger className="text-sm">
  //                               <SelectValue placeholder="Select business type" />
  //                             </SelectTrigger>
  //                           </FormControl>
  //                           <SelectContent>
  //                             {defaultBusinessTypes.map((type) => (
  //                               <SelectItem
  //                                 key={type}
  //                                 value={type}
  //                                 className="text-sm"
  //                               >
  //                                 {type}
  //                               </SelectItem>
  //                             ))}
  //                           </SelectContent>
  //                         </Select>
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   <FormField
  //                     control={form.control}
  //                     name="businessName"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           {getLabel("businessName")}
  //                         </FormLabel>
  //                         <FormControl>
  //                           <Input {...field} className="text-sm" />
  //                         </FormControl>
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   {/* Registration Number with Duplicate Check */}
  //                   <FormField
  //                     control={form.control}
  //                     name="registrationNumber"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           {getLabel("registrationNumber")}
  //                         </FormLabel>
  //                         <FormControl>
  //                           <div className="relative">
  //                             <Input
  //                               {...field}
  //                               className="text-sm"
  //                               onChange={(e) => {
  //                                 field.onChange(e);
  //                                 handleRegistrationChange(e.target.value);
  //                               }}
  //                             />
  //                             {isCheckingDuplicate && (
  //                               <div className="absolute right-3 top-1/2 -translate-y-1/2">
  //                                 <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
  //                               </div>
  //                             )}
  //                           </div>
  //                         </FormControl>
  //                         {duplicateError && (
  //                           <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 mt-1">
  //                             <AlertCircle className="h-4 w-4" />
  //                             <span>{duplicateError}</span>
  //                           </div>
  //                         )}
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   {[
  //                     "Pincode",
  //                     "Telephone",
  //                     "mobileNumber",
  //                     "emailId",
  //                     "Website",
  //                     "PANNumber",
  //                     "IncomeTaxLoginPassword",
  //                     "address",
  //                   ].map((name) => (
  //                     <FormField
  //                       key={name}
  //                       control={form.control}
  //                       name={name as keyof FormData}
  //                       render={({ field }) => (
  //                         <FormItem>
  //                           <FormLabel className="text-sm font-medium">
  //                             {getLabel(name)}
  //                           </FormLabel>
  //                           <FormControl>
  //                             <Input {...field} className="text-sm" />
  //                           </FormControl>
  //                           <FormMessage />
  //                         </FormItem>
  //                       )}
  //                     />
  //                   ))}

  //                   <FormField
  //                     control={form.control}
  //                     name="Country"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           Country
  //                         </FormLabel>
  //                         <Combobox
  //                           options={[{ label: "India", value: "IN" }]}
  //                           value={countryCode}
  //                           onChange={(iso: string) => {
  //                             setCountryCode(iso);
  //                             setStateCode("");
  //                             form.setValue("Country", "India");
  //                             form.setValue("addressState", "");
  //                             form.setValue("City", "");
  //                           }}
  //                           placeholder="Select country"
  //                           searchPlaceholder="Type to search"
  //                         />
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   <FormField
  //                     control={form.control}
  //                     name="addressState"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           State
  //                         </FormLabel>
  //                         <Combobox
  //                           options={stateOptions}
  //                           value={
  //                             stateCode ||
  //                             stateOptions.find(
  //                               (o) =>
  //                                 o.label.toLowerCase() ===
  //                                 (field.value || "").toLowerCase()
  //                             )?.value ||
  //                             ""
  //                           }
  //                           onChange={(iso: string) => {
  //                             setStateCode(iso);
  //                             const selected = stateOptions.find(
  //                               (s) => s.value === iso
  //                             );
  //                             field.onChange(selected?.label || "");
  //                             form.setValue("City", "");
  //                           }}
  //                           placeholder="Select state"
  //                           searchPlaceholder="Type state name"
  //                         />
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   <FormField
  //                     control={form.control}
  //                     name="City"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           City
  //                         </FormLabel>
  //                         <Combobox
  //                           options={cityOptions}
  //                           value={
  //                             cityOptions.find(
  //                               (o) =>
  //                                 o.label.toLowerCase() ===
  //                                 (field.value || "").toLowerCase()
  //                             )?.value || ""
  //                           }
  //                           onChange={(v: string) => field.onChange(v)}
  //                           placeholder={
  //                             stateCode ? "Select city" : "Select a state first"
  //                           }
  //                           searchPlaceholder="Type city name"
  //                           disabled={!stateCode || cityOptions.length === 0}
  //                         />
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />
  //                 </div>
  //               </div>
  //             )}

  //             {/* Step 2 */}
  //             {step === 2 && (
  //               <div className="space-y-4">
  //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                   <FormField
  //                     control={form.control}
  //                     name="gstin"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           {getLabel("gstin")}
  //                         </FormLabel>
  //                         <FormControl>
  //                           <Input {...field} className="text-sm" />
  //                         </FormControl>
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   {/* GST State Dropdown (Added as requested) */}
  //                   <FormField
  //                     control={form.control}
  //                     name="gstState"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           {getLabel("gstState")}
  //                         </FormLabel>
  //                         <Combobox
  //                           options={gstStateOptions}
  //                           value={
  //                             gstStateCode ||
  //                             gstStateOptions.find(
  //                               (o) =>
  //                                 o.label.toLowerCase() === (field.value || "").toLowerCase()
  //                             )?.value ||
  //                             ""
  //                           }
  //                           onChange={(iso: string) => {
  //                             setGstStateCode(iso);
  //                             const selected = gstStateOptions.find(
  //                               (s) => s.value === iso
  //                             );
  //                             field.onChange(selected?.label || "");
  //                           }}
  //                           placeholder="Select GST state"
  //                           searchPlaceholder="Type state name"
  //                         />
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />

  //                   <FormField
  //                     control={form.control}
  //                     name="RegistrationType"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           {getLabel("RegistrationType")}
  //                         </FormLabel>
  //                         <Select
  //                           onValueChange={field.onChange}
  //                           value={field.value}
  //                           defaultValue={field.value}
  //                         >
  //                           <FormControl>
  //                             <SelectTrigger className="text-sm">
  //                               <SelectValue placeholder="Select registration type" />
  //                             </SelectTrigger>
  //                           </FormControl>
  //                           <SelectContent>
  //                             {gstRegistrationTypes.map((type) => (
  //                               <SelectItem
  //                                 key={type}
  //                                 value={type}
  //                                 className="text-sm"
  //                               >
  //                                 {type}
  //                               </SelectItem>
  //                             ))}
  //                           </SelectContent>
  //                         </Select>
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />


  //                   {[
  //                     "PeriodicityofGSTReturns",
  //                     "GSTUsername",
  //                     "GSTPassword",
  //                     "EWBBillUsername",
  //                     "EWBBillPassword",
  //                   ].map((name) => (

  //                     <FormField
  //                       key={name}
  //                       control={form.control}
  //                       name={name as keyof FormData}
  //                       render={({ field }) => (
  //                         <FormItem>
  //                           <FormLabel className="text-sm font-medium">
  //                             {getLabel(name)}
  //                           </FormLabel>
  //                           <FormControl>
  //                             <Input {...field} className="text-sm" />
  //                           </FormControl>
  //                           <FormMessage />
  //                         </FormItem>
  //                       )}
  //                     />
  //                   ))}

  //                   <FormField
  //                     control={form.control}
  //                     name="ewayBillApplicable"
  //                     render={({ field }) => (
  //                       <FormItem>
  //                         <FormLabel className="text-sm font-medium">
  //                           {getLabel("ewayBillApplicable")}
  //                         </FormLabel>
  //                         <Select
  //                           onValueChange={field.onChange}
  //                           value={field.value}
  //                         >
  //                           <FormControl>
  //                             <SelectTrigger className="text-sm">
  //                               <SelectValue placeholder="Select Yes or No" />
  //                             </SelectTrigger>
  //                           </FormControl>
  //                           <SelectContent>
  //                             <SelectItem value="true" className="text-sm">
  //                               Yes
  //                             </SelectItem>
  //                             <SelectItem value="false" className="text-sm">
  //                               No
  //                             </SelectItem>
  //                           </SelectContent>
  //                         </Select>
  //                         <FormMessage />
  //                       </FormItem>
  //                     )}
  //                   />
  //                 </div>
  //               </div>
  //             )}

  //             {/* Step 3 */}
  //             {step === 3 && (
  //               <div className="space-y-4">
  //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                   {[
  //                     "TANNumber",
  //                     "TAXDeductionCollectionAcc",
  //                     "DeductorType",
  //                     "TDSLoginUsername",
  //                     "TDSLoginPassword",
  //                   ].map((name) => (
  //                     <FormField
  //                       key={name}
  //                       control={form.control}
  //                       name={name as keyof FormData}
  //                       render={({ field }) => (
  //                         <FormItem>
  //                           <FormLabel className="text-sm font-medium">
  //                             {getLabel(name)}
  //                           </FormLabel>
  //                           <FormControl>
  //                             <Input {...field} className="text-sm" />
  //                           </FormControl>
  //                           <FormMessage />
  //                         </FormItem>
  //                       )}
  //                     />
  //                   ))}
  //                 </div>
  //               </div>
  //             )}
  //           </div>

  //           {/* Mobile Bottom Actions */}
  //           <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50 md:hidden">
  //             <div className="flex justify-between items-center gap-3">
  //               {step > 1 ? (
  //                 <Button
  //                   type="button"
  //                   variant="outline"
  //                   onClick={() => setStep(step - 1)}
  //                   className="flex-1 gap-1 text-sm"
  //                 >
  //                   <ChevronLeft className="h-4 w-4" />
  //                   Previous
  //                 </Button>
  //               ) : (
  //                 <div className="flex-1"></div>
  //               )}

  //               {step < 3 ? (
  //                 <Button
  //                   type="button"
  //                   onClick={handleNextStep}
  //                   disabled={isCheckingDuplicate}
  //                   className="flex-1 gap-1 text-sm"
  //                 >
  //                   {isCheckingDuplicate ? (
  //                     <>
  //                       <Loader2 className="h-4 w-4 animate-spin" />
  //                       Checking...
  //                     </>
  //                   ) : (
  //                     <>
  //                       Next
  //                       <ChevronRight className="h-4 w-4" />
  //                     </>
  //                   )}
  //                 </Button>
  //               ) : (
  //                 <Button
  //                   type="button"
  //                   onClick={form.handleSubmit(onSubmit)}
  //                   disabled={isSubmitting || !!duplicateError}
  //                   className="flex-1 bg-primary hover:bg-primary/90 transition-colors text-sm"
  //                 >
  //                   {isSubmitting ? (
  //                     <>
  //                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  //                       {company ? "Saving..." : "Creating..."}
  //                     </>
  //                   ) : (
  //                     <>
  //                       {company ? (
  //                         <>
  //                           <Save className="mr-2 h-4 w-4" />
  //                           Save
  //                         </>
  //                       ) : (
  //                         <>
  //                           <PlusCircle className="mr-2 h-4 w-4" />
  //                           Create
  //                         </>
  //                       )}
  //                     </>
  //                   )}
  //                 </Button>
  //               )}
  //             </div>
  //           </div>

  //           {/* Desktop Bottom Actions */}
  //           <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50">
  //             <div className="container flex justify-between items-center">
  //               {step > 1 && (
  //                 <Button
  //                   type="button"
  //                   variant="outline"
  //                   onClick={() => setStep(step - 1)}
  //                   className="gap-1 transition-all hover:gap-2 min-w-[7rem]"
  //                 >
  //                   <ChevronLeft className="h-4 w-4" />
  //                   Previous
  //                 </Button>
  //               )}
  //               {step < 3 ? (
  //                 <Button
  //                   type="button"
  //                   onClick={handleNextStep}
  //                   disabled={isCheckingDuplicate}
  //                   className="gap-1 transition-all hover:gap-2 min-w-[7rem] ml-auto"
  //                 >
  //                   {isCheckingDuplicate ? (
  //                     <>
  //                       <Loader2 className="h-4 w-4 animate-spin" />
  //                       Checking...
  //                     </>
  //                   ) : (
  //                     <>
  //                       Next
  //                       <ChevronRight className="h-4 w-4" />
  //                     </>
  //                   )}
  //                 </Button>
  //               ) : (
  //                 <Button
  //                   type="button"
  //                   onClick={() => form.handleSubmit(onSubmit)()}
  //                   disabled={isSubmitting || !!duplicateError}
  //                   className="bg-primary hover:bg-primary/90 transition-colors min-w-[10rem] ml-auto"
  //                 >
  //                   {isSubmitting ? (
  //                     <>
  //                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  //                       {company ? "Saving..." : "Creating..."}
  //                     </>
  //                   ) : (
  //                     <>
  //                       {company ? (
  //                         <>
  //                           <Save className="mr-2 h-4 w-4" />
  //                           Save Changes
  //                         </>
  //                       ) : (
  //                         <>
  //                           <PlusCircle className="mr-2 h-4 w-4" />
  //                           Create Company
  //                         </>
  //                       )}
  //                     </>
  //                   )}
  //                 </Button>
  //               )}
  //             </div>
  //           </div>
  //         </form>
  //       </Form>
  //     </div>
  //   </>
  // );
 return (
    <>
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 overflow-y-auto max-h-[80vh] md:block">
        <Form {...form}>
          <form className="space-y-4">
            {/* Mobile Stepper - Vertical */}
            <div className="md:hidden flex flex-col space-y-3 pb-2">
              {[
                { number: 1, label: "Company Basic Details" },
                { number: 2, label: "GST Registration Details" },
                { number: 3, label: "Company TDS Details" },
              ].map(({ number, label }) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setStep(number)}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 ${
                    step === number
                      ? "bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-950/30 dark:border-indigo-800"
                      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  } hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600`}
                >
                  <div
                    className={`w-6 h-6 text-base flex items-center justify-center rounded-full border-2 font-semibold flex-shrink-0 transition-all ${
                      step === number
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-gray-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {number}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === number
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {label}
                  </span>
                  {step === number && (
                    <ChevronRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Desktop Stepper - Hidden on mobile */}
            <div className="hidden md:flex justify-center items-center gap-8 pb-10">
              {[
                { number: 1, label: "Company Basic Details" },
                { number: 2, label: "GST Registration Details" },
                { number: 3, label: "Company TDS Details" },
              ].map(({ number, label }, index, array) => (
                <div key={number} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setStep(number)}
                    className={`flex flex-col items-center group transition-all duration-300`}
                  >
                    <div
                      className={`w-8 h-8 text-base flex items-center justify-center rounded-full border-2 font-semibold mb-3 transition-all ${
                        step === number
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110"
                          : step > number
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 group-hover:border-indigo-400 dark:group-hover:border-indigo-500"
                      }`}
                    >
                      {step > number ? <Check className="h-5 w-5" /> : number}
                    </div>
                    <span
                      className={`text-sm font-medium text-center  leading-tight ${
                        step === number
                          ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                          : step > number
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }`}
                    >
                      {label}
                    </span>
                    {step === number && (
                      <div className="w-6 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-2"></div>
                    )}
                  </button>

                  {index < array.length - 1 && (
                    <div
                      className={`w-16 h-1 rounded-full mx-4 transition-all duration-300 ${
                        step > number + 1
                          ? "bg-green-500"
                          : step > number
                            ? "bg-indigo-300 dark:bg-indigo-600"
                            : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pb-20 md:pb-[15vh]">
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  {!isClient && (
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Assign to Client
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem
                                  key={client._id}
                                  value={client._id}
                                  className="text-sm"
                                >
                                  {client.contactName} - ({client.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

<div className="space-y-2">
  <FormLabel className="text-sm font-medium">
    Company Logo <span className="text-xs text-gray-500 ml-1">(Upload under 200 KB)</span>
  </FormLabel>

  <Input
  ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (!f) return;

      if (f.size > 200 * 1024) {
        alert("File size must be less than 200 KB");
        e.target.value = "";
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(f);
    }}
    className="text-sm"
  />

  {logoPreview && (
    <img
      src={logoPreview}
      alt="Logo preview"
      className="mt-2 h-16 w-auto rounded border"
    />
  )}

  {(logoPreview || company?.logo) && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        handleRemoveLogo();
        setLogoFile(null);
        setLogoPreview(null);
      }}
      className="mt-2 text-xs"
    >
      Remove Logo
    </Button>
  )}
</div>

{/* ✅ Cropper Modal */}
{showCropper && (
  <ImageCropper
    image={tempImageSrc}
    onCropComplete={(croppedBlob) => {
      const croppedFile = new File([croppedBlob], "logo.jpg", {
        type: "image/jpeg",
      });
      setLogoFile(croppedFile);
      setLogoPreview(URL.createObjectURL(croppedBlob));
      setShowCropper(false);
      setTempImageSrc("");
    }}
    onCancel={() => {
      setShowCropper(false);
      setTempImageSrc("");
    }}
  />
)}



                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Business Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
  id="businessType"
  data-name="businessType"
  className="text-sm"
>
  <SelectValue placeholder="Select business type" />
</SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {defaultBusinessTypes.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="text-sm"
                                >
                                  {type}
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
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("businessName")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Registration Number with Duplicate Check */}
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("registrationNumber")}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                className="text-sm"
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleRegistrationChange(e.target.value);
                                }}
                              />
                              {isCheckingDuplicate && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {duplicateError && (
                            <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 mt-1">
                              <AlertCircle className="h-4 w-4" />
                              <span>{duplicateError}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Regular fields without validation */}
                    {["Pincode", "Telephone", "IncomeTaxLoginPassword", "address"].map((name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof FormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {getLabel(name)}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className="text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}

                    {/* Mobile Number (Mandatory - keep as is) */}
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("mobileNumber")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email with real-time validation */}
                    <FormField
                      control={form.control}
                      name="emailId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("emailId")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="text-sm"
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldValidation("emailId", e.target.value);
                              }}
                              onBlur={(e) => handleFieldValidation("emailId", e.target.value)}
                            />
                          </FormControl>
                          {fieldErrors["emailId"] && (
                            <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>{fieldErrors["emailId"]}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Website */}
                    <FormField
                      control={form.control}
                      name="Website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("Website")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* PAN Number with real-time validation */}
                    <FormField
                      control={form.control}
                      name="PANNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("PANNumber")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="text-sm"
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldValidation("PANNumber", e.target.value);
                              }}
                              onBlur={(e) => handleFieldValidation("PANNumber", e.target.value)}
                            />
                          </FormControl>
                          {fieldErrors["PANNumber"] && (
                            <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>{fieldErrors["PANNumber"]}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="Country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Country
                          </FormLabel>
                          <Combobox
                            options={[{ label: "India", value: "IN" }]}
                            value={countryCode}
                            onChange={(iso: string) => {
                              setCountryCode(iso);
                              setStateCode("");
                              form.setValue("Country", "India");
                              form.setValue("addressState", "");
                              form.setValue("City", "");
                            }}
                            placeholder="Select country"
                            searchPlaceholder="Type to search"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            State
                          </FormLabel>
                          <Combobox
                            options={stateOptions}
                            value={
                              stateCode ||
                              stateOptions.find(
                                (o) =>
                                  o.label.toLowerCase() ===
                                  (field.value || "").toLowerCase()
                              )?.value ||
                              ""
                            }
                            onChange={(iso: string) => {
                              setStateCode(iso);
                              const selected = stateOptions.find(
                                (s) => s.value === iso
                              );
                              field.onChange(selected?.label || "");
                              form.setValue("City", "");
                            }}
                            placeholder="Select state"
                            searchPlaceholder="Type state name"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="City"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            City
                          </FormLabel>
                          <Combobox
                            options={cityOptions}
                            value={
                              cityOptions.find(
                                (o) =>
                                  o.label.toLowerCase() ===
                                  (field.value || "").toLowerCase()
                              )?.value || ""
                            }
                            onChange={(v: string) => field.onChange(v)}
                            placeholder={
                              stateCode ? "Select city" : "Select a state first"
                            }
                            searchPlaceholder="Type city name"
                            disabled={!stateCode || cityOptions.length === 0}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* GSTIN with real-time validation */}
                    <FormField
                      control={form.control}
                      name="gstin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("gstin")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="text-sm"
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldValidation("gstin", e.target.value);
                              }}
                              onBlur={(e) => handleFieldValidation("gstin", e.target.value)}
                            />
                          </FormControl>
                          {fieldErrors["gstin"] && (
                            <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>{fieldErrors["gstin"]}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* GST State Dropdown */}
                    <FormField
                      control={form.control}
                      name="gstState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("gstState")}
                          </FormLabel>
                          <Combobox
                            options={gstStateOptions}
                            value={
                              gstStateCode ||
                              gstStateOptions.find(
                                (o) =>
                                  o.label.toLowerCase() === (field.value || "").toLowerCase()
                              )?.value ||
                              ""
                            }
                            onChange={(iso: string) => {
                              setGstStateCode(iso);
                              const selected = gstStateOptions.find(
                                (s) => s.value === iso
                              );
                              field.onChange(selected?.label || "");
                            }}
                            placeholder="Select GST state"
                            searchPlaceholder="Type state name"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="RegistrationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("RegistrationType")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select registration type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {gstRegistrationTypes.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="text-sm"
                                >
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {[
                      "PeriodicityofGSTReturns",
                      "GSTUsername",
                      "GSTPassword",
                      "EWBBillUsername",
                      "EWBBillPassword",
                    ].map((name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof FormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {getLabel(name)}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className="text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}

                    <FormField
                      control={form.control}
                      name="ewayBillApplicable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("ewayBillApplicable")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select Yes or No" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true" className="text-sm">
                                Yes
                              </SelectItem>
                              <SelectItem value="false" className="text-sm">
                                No
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TAN Number with real-time validation */}
                    <FormField
                      control={form.control}
                      name="TANNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {getLabel("TANNumber")}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="text-sm"
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldValidation("TANNumber", e.target.value);
                              }}
                              onBlur={(e) => handleFieldValidation("TANNumber", e.target.value)}
                            />
                          </FormControl>
                          {fieldErrors["TANNumber"] && (
                            <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>{fieldErrors["TANNumber"]}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {[
                      "TAXDeductionCollectionAcc",
                      "DeductorType",
                      "TDSLoginUsername",
                      "TDSLoginPassword",
                    ].map((name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof FormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {getLabel(name)}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className="text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50 md:hidden">
              <div className="flex justify-between items-center gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 gap-1 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                ) : (
                  <div className="flex-1"></div>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isCheckingDuplicate || Object.keys(fieldErrors).some(key => 
                      getStepFields(isClient)[step as keyof ReturnType<typeof getStepFields>]?.includes(key as keyof FormData)
                    )}
                    className="flex-1 gap-1 text-sm"
                  >
                    {isCheckingDuplicate ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={isSubmitting || !!duplicateError || Object.keys(fieldErrors).length > 0}
                    className="flex-1 bg-primary hover:bg-primary/90 transition-colors text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {company ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        {company ? (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        ) : (
                          <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Bottom Actions */}
            <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50">
              <div className="container flex justify-between items-center">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="gap-1 transition-all hover:gap-2 min-w-[7rem]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isCheckingDuplicate || Object.keys(fieldErrors).some(key => 
                      getStepFields(isClient)[step as keyof ReturnType<typeof getStepFields>]?.includes(key as keyof FormData)
                    )}
                    className="gap-1 transition-all hover:gap-2 min-w-[7rem] ml-auto"
                  >
                    {isCheckingDuplicate ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={isSubmitting || !!duplicateError || Object.keys(fieldErrors).length > 0}
                    className="bg-primary hover:bg-primary/90 transition-colors min-w-[10rem] ml-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {company ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        {company ? (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Company
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}







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
// import {
//   Check,
//   ChevronLeft,
//   ChevronRight,
//   Loader2,
//   PlusCircle,
//   Save,
//   AlertCircle,
// } from "lucide-react";
// import React from "react";
// import { useToast } from "@/hooks/use-toast";
// import type { Company, Client } from "@/lib/types";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";

// import { Country, State, City } from "country-state-city";
// import { Combobox } from "@/components/ui/combobox";
// import { validateMobileNumber, validateEmail, validatePAN, validateGSTIN, validateTAN } from '@/lib/validations';

// interface AdminCompanyFormProps {
//   company?: Company;
//   clients: Client[];
//   onFormSubmit: () => void;
// }

// interface FormData {
//   registrationNumber: string;
//   businessName: string;
//   businessType: string;
//   address: string;
//   City?: string;
//   addressState?: string;
//   Country?: string;
//   Pincode?: string;
//   Telephone?: string;
//   mobileNumber: string;
//   emailId?: string;
//   Website?: string;
//   PANNumber?: string;
//   IncomeTaxLoginPassword?: string;
//   gstin?: string;
//   gstState?: string;
//   RegistrationType?: string;
//   PeriodicityofGSTReturns?: string;
//   GSTUsername?: string;
//   GSTPassword?: string;
//   ewayBillApplicable: "true" | "false";
//   EWBBillUsername?: string;
//   EWBBillPassword?: string;
//   TANNumber?: string;
//   TAXDeductionCollectionAcc?: string;
//   DeductorType?: string;
//   TDSLoginUsername?: string;
//   TDSLoginPassword?: string;
//   client?: string;
// }

// // SIMPLE VALIDATION FUNCTION
// const validateField = (value: string, validateFn: (value: string) => { isValid: boolean; message?: string }) => {
//   if (!value || value.trim() === '') return true; // Optional field
//   const result = validateFn(value);
//   return result.isValid || result.message || "Invalid format";
// };

// // Remove the complex Zod schema and use a simpler one
// // const formSchema = z.object({
// //   registrationNumber: z.string().min(1, "Registration number is required"),
// //   businessName: z.string().min(2, "Business name must be at least 2 characters"),
// //   businessType: z.string().min(2, "Business type must be at least 2 characters"),
// //   address: z.string().min(5, "Address must be at least 5 characters"),
// //   City: z.string().optional(),
// //   addressState: z.string().optional(),
// //   Country: z.string().optional(),
// //   Pincode: z.string().optional(),
// //   Telephone: z.string().optional(),
// //   mobileNumber: z
// //     .string({ required_error: "Mobile number is required" })
// //     .trim()
// //     .min(10, "Enter a valid 10-digit mobile number")
// //     .max(10, "Enter a valid 10-digit mobile number"),
// //   emailId: z.string().optional(),
// //   Website: z.string().optional(),
// //   PANNumber: z.string().optional(),
// //   IncomeTaxLoginPassword: z.string().optional(),
// //   gstin: z.string().optional(),
// //   gstState: z.string().optional(),
// //   RegistrationType: z.string().optional(),
// //   PeriodicityofGSTReturns: z.string().optional(),
// //   GSTUsername: z.string().optional(),
// //   GSTPassword: z.string().optional(),
// //   ewayBillApplicable: z.enum(["true", "false"]),
// //   EWBBillUsername: z.string().optional(),
// //   EWBBillPassword: z.string().optional(),
// //   TANNumber: z.string().optional(),
// //   TAXDeductionCollectionAcc: z.string().optional(),
// //   DeductorType: z.string().optional(),
// //   TDSLoginUsername: z.string().optional(),
// //   TDSLoginPassword: z.string().optional(),
// //   client: z.string().optional(),
// // });

// // type FormData = z.infer<typeof formSchema>;

// const defaultBusinessTypes = [
//   "Sole Proprietorship",
//   "Partnership",
//   "Private Limited Company",
//   "Limited Company",
//   "Others",
// ];

// const gstRegistrationTypes = [
//   "Sole Proprietorship",
//   "Partnership",
//   "LLP",
//   "Private Limited Company",
//   "Public Limited Company",
//   "Section 8 Company",
//   "Others",
// ];

// // Fields for each step - client field is conditional
// const getStepFields = (isClient: boolean) => ({
//   1: [
//     ...(isClient ? [] : ["client"]),
//     "businessType",
//     "businessName",
//     "registrationNumber",
//     "address",
//     "Country",
//     "addressState",
//     "City",
//     "Pincode",
//     "Telephone",
//     "mobileNumber",
//   ],
//   2: [
//     "gstin",
//     "gstState",
//     "RegistrationType",
//     "PeriodicityofGSTReturns",
//     "GSTUsername",
//     "GSTPassword",
//     "ewayBillApplicable",
//     "EWBBillUsername",
//     "EWBBillPassword",
//   ],
//   3: [
//     "TANNumber",
//     "TAXDeductionCollectionAcc",
//     "DeductorType",
//     "TDSLoginUsername",
//     "TDSLoginPassword",
//   ],
// });

// // Pretty labels for fields
// const FIELD_LABELS: Partial<Record<keyof FormData | string, string>> = {
//   client: "Assign to Client",
//   businessType: "Business Type",
//   businessName: "Business Name",
//   registrationNumber: "Registration Number",
//   address: "Address",
//   City: "City",
//   addressState: "Address State",
//   Country: "Country",
//   Pincode: "Pincode",
//   Telephone: "Telephone",
//   mobileNumber: "Mobile Number",
//   emailId: "Email ID",
//   Website: "Website",
//   PANNumber: "PAN Number",
//   IncomeTaxLoginPassword: "Income Tax Login Password",
//   gstin: "GSTIN",
//   gstState: "GST State",
//   RegistrationType: "Registration Type",
//   PeriodicityofGSTReturns: "Periodicity of GST Returns",
//   GSTUsername: "GST Username",
//   GSTPassword: "GST Password",
//   ewayBillApplicable: "E-Way Bill Applicable",
//   EWBBillUsername: "EWB Username",
//   EWBBillPassword: "EWB Password",
//   TANNumber: "TAN Number",
//   TAXDeductionCollectionAcc: "Tax Deduction/Collection A/c",
//   DeductorType: "Deductor Type",
//   TDSLoginUsername: "TDS Login Username",
//   TDSLoginPassword: "TDS Login Password",
// };

// const titleize = (s: string) =>
//   s
//     .replace(/([a-z])([A-Z])/g, "$1 $2")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (m) => m.toUpperCase());

// const getLabel = (name: keyof FormData | string) =>
//   FIELD_LABELS[name] ?? titleize(String(name));

// // Custom validated input component using React Hook Form's native validation
// const ValidatedOptionalInput = ({ 
//   control, 
//   name, 
//   label,
//   validateFn 
// }: { 
//   control: any; 
//   name: keyof FormData; 
//   label: string;
//   validateFn: (value: string) => { isValid: boolean; message?: string };
// }) => (
//   <FormField
//     control={control}
//     name={name}
//     render={({ field }) => (
//       <FormItem>
//         <FormLabel className="text-sm font-medium">{label}</FormLabel>
//         <FormControl>
//           <Input
//             {...field}
//             className="text-sm"
//             onChange={(e) => {
//               const value = e.target.value;
//               field.onChange(value);
              
//               // Validate in real-time
//               if (value && value.trim() !== '') {
//                 const result = validateFn(value);
//                 if (!result.isValid) {
//                   // Set custom error using React Hook Form
//                   control.setError(name, { 
//                     type: 'manual', 
//                     message: result.message || 'Invalid format' 
//                   });
//                 } else {
//                   // Clear error if valid
//                   control.clearErrors(name);
//                 }
//               } else {
//                 // Clear error if empty
//                 control.clearErrors(name);
//               }
//             }}
//             onBlur={(e) => {
//               field.onBlur();
//               const value = e.target.value;
              
//               // Validate on blur as well
//               if (value && value.trim() !== '') {
//                 const result = validateFn(value);
//                 if (!result.isValid) {
//                   control.setError(name, { 
//                     type: 'manual', 
//                     message: result.message || 'Invalid format' 
//                   });
//                 }
//               }
//             }}
//           />
//         </FormControl>
//         <FormMessage />
//       </FormItem>
//     )}
//   />
// );

// export function CompanyForm({
//   company,
//   clients,
//   onFormSubmit,
// }: AdminCompanyFormProps) {
//   const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
//   const { toast } = useToast();
//   const [isSubmitting, setIsSubmitting] = React.useState(false);
//   const [step, setStep] = React.useState(1);
//   const [logoFile, setLogoFile] = React.useState<File | null>(null);
//   const [logoPreview, setLogoPreview] = React.useState<string | null>(
//     company?.logo
//       ? company.logo.startsWith("/uploads")
//         ? `${baseURL}${company.logo}`
//         : company.logo
//       : null
//   );

//   // Duplicate check states
//   const [isCheckingDuplicate, setIsCheckingDuplicate] = React.useState(false);
//   const [duplicateError, setDuplicateError] = React.useState<string>("");
//   const checkTimeoutRef = React.useRef<NodeJS.Timeout>();

//   const role = localStorage.getItem("role");
//   const isClient = role === "customer";

//   // Default country = India
//   const india = Country.getCountryByCode("IN")!;
//   const [countryCode, setCountryCode] = React.useState<string>("IN");
//   const [stateCode, setStateCode] = React.useState<string>("");
//   const [stateOptions, setStateOptions] = React.useState<
//     { label: string; value: string }[]
//   >([]);
//   const [cityOptions, setCityOptions] = React.useState<
//     { label: string; value: string }[]
//   >([]);

//   // States for GST State dropdown
//   const [gstStateCode, setGstStateCode] = React.useState<string>("");
//   const [gstStateOptions, setGstStateOptions] = React.useState<
//     { label: string; value: string }[]
//   >([]);

//   const getClientId = (client: string | Client | undefined) => {
//     if (!client) return "";
//     if (typeof client === "string") return client;
//     return client._id;
//   };

//   // Function to check duplicate registration number
//   const checkDuplicateRegistration = React.useCallback(
//     async (regNumber: string) => {
//       if (!regNumber || regNumber.trim() === "") {
//         setDuplicateError("");
//         return;
//       }
    
//       if (company?.registrationNumber === regNumber) {
//         setDuplicateError("");
//         return;
//       }

//       setIsCheckingDuplicate(true);
//       setDuplicateError("");

//       try {
//         const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
//         if (!token) {
//           setIsCheckingDuplicate(false);
//           return;
//         }

//         const apiUrl = `${baseURL}/api/companies/check-duplicate?registrationNumber=${encodeURIComponent(regNumber)}`;
//         const res = await fetch(apiUrl, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
        
//         const data = await res.json();
//         if (res.ok) {
//           if (data.exists) {
//             setDuplicateError("This registration number is already in use");
//           } else {
//             setDuplicateError("");
//           }
//         }
//       } catch (error) {
//         console.error("Error checking duplicate:", error);
//       } finally {
//         setIsCheckingDuplicate(false);
//       }
//     },
//     [baseURL, company]
//   );

//   // Debounced duplicate check
//   const handleRegistrationChange = (value: string) => {
//     if (checkTimeoutRef.current) {
//       clearTimeout(checkTimeoutRef.current);
//     }

//     checkTimeoutRef.current = setTimeout(() => {
//       checkDuplicateRegistration(value);
//     }, 500);
//   };

//    const form = useForm<FormData>({
//     mode: 'onChange',
//     defaultValues: {
//       registrationNumber: company?.registrationNumber || "",
//       businessName: company?.businessName || "",
//       businessType: company?.businessType || "",
//       address: company?.address || "",
//       City: company?.City || "",
//       addressState: company?.addressState || "",
//       Country: company?.Country || "",
//       Pincode: company?.Pincode || "",
//       Telephone: company?.Telephone || "",
//       mobileNumber: company?.mobileNumber || "",
//       emailId: company?.emailId || "",
//       Website: company?.Website || "",
//       PANNumber: company?.PANNumber || "",
//       IncomeTaxLoginPassword: company?.IncomeTaxLoginPassword || "",
//       gstin: company?.gstin || "",
//       gstState: company?.gstState || "",
//       RegistrationType: company?.RegistrationType || "",
//       PeriodicityofGSTReturns: company?.PeriodicityofGSTReturns || "",
//       GSTUsername: company?.GSTUsername || "",
//       GSTPassword: company?.GSTPassword || "",
//       ewayBillApplicable: company?.ewayBillApplicable === true ? "true" : "false",
//       EWBBillUsername: company?.EWBBillUsername || "",
//       EWBBillPassword: company?.EWBBillPassword || "",
//       TANNumber: company?.TANNumber || "",
//       TAXDeductionCollectionAcc: company?.TAXDeductionCollectionAcc || "",
//       DeductorType: company?.DeductorType || "",
//       TDSLoginUsername: company?.TDSLoginUsername || "",
//       TDSLoginPassword: company?.TDSLoginPassword || "",
//       client: getClientId(company?.client),
//     },
//   });

//    const ValidatedInput = ({ 
//     name, 
//     label,
//     validateFn 
//   }: { 
//     name: keyof FormData; 
//     label: string;
//     validateFn: (value: string) => { isValid: boolean; message?: string };
//   }) => {
//     return (
//       <FormField
//         control={form.control}
//         name={name}
//         rules={{
//           validate: (value) => validateField(value || '', validateFn)
//         }}
//         render={({ field }) => (
//           <FormItem>
//             <FormLabel className="text-sm font-medium">{label}</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 className="text-sm"
//                 onChange={(e) => {
//                   field.onChange(e);
//                   // Manually trigger validation
//                   form.trigger(name);
//                 }}
//                 onBlur={() => {
//                   field.onBlur();
//                   form.trigger(name);
//                 }}
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//     );
//   };

//   // Add validation before submission
//   const validateCustomFields = (data: FormData): boolean => {
//     let isValid = true;
    
//     // Validate email
//     if (data.emailId && data.emailId.trim() !== '') {
//       const emailResult = validateEmail(data.emailId);
//       if (!emailResult.isValid) {
//         form.setError('emailId', { type: 'manual', message: emailResult.message || 'Invalid email' });
//         isValid = false;
//       }
//     }
    
//     // Validate PAN
//     if (data.PANNumber && data.PANNumber.trim() !== '') {
//       const panResult = validatePAN(data.PANNumber);
//       if (!panResult.isValid) {
//         form.setError('PANNumber', { type: 'manual', message: panResult.message || 'Invalid PAN' });
//         isValid = false;
//       }
//     }
    
//     // Validate GSTIN
//     if (data.gstin && data.gstin.trim() !== '') {
//       const gstinResult = validateGSTIN(data.gstin);
//       if (!gstinResult.isValid) {
//         form.setError('gstin', { type: 'manual', message: gstinResult.message || 'Invalid GSTIN' });
//         isValid = false;
//       }
//     }
    
//     // Validate TAN
//     if (data.TANNumber && data.TANNumber.trim() !== '') {
//       const tanResult = validateTAN(data.TANNumber);
//       if (!tanResult.isValid) {
//         form.setError('TANNumber', { type: 'manual', message: tanResult.message || 'Invalid TAN' });
//         isValid = false;
//       }
//     }
    
//     return isValid;
//   };

//   // useEffect to set initial gstStateCode
//   React.useEffect(() => {
//     const existingGstStateName = (form.getValues("gstState") || "").toString();
//     if (existingGstStateName) {
//       const iso = State.getStatesOfCountry("IN").find(
//         (s) => s.name.toLowerCase() === existingGstStateName.toLowerCase()
//       )?.isoCode;
//       if (iso) setGstStateCode(iso);
//     }
//   }, []);

//   // useEffect to populate GST state options
//   React.useEffect(() => {
//     const states = State.getStatesOfCountry("IN") || [];
//     setGstStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
//   }, [countryCode]);

//   // Reset form when company changes
//   React.useEffect(() => {
//     if (company) {
//       form.reset({
//         registrationNumber: company.registrationNumber || "",
//         businessName: company.businessName || "",
//         businessType: company.businessType || "",
//         address: company.address || "",
//         City: company.City || "",
//         addressState: company.addressState || "",
//         Country: company.Country || "",
//         Pincode: company.Pincode || "",
//         Telephone: company.Telephone || "",
//         mobileNumber: company.mobileNumber || "",
//         emailId: company.emailId || "",
//         Website: company.Website || "",
//         PANNumber: company.PANNumber || "",
//         IncomeTaxLoginPassword: company.IncomeTaxLoginPassword || "",
//         gstin: company.gstin || "",
//         gstState: company.gstState || "",
//         RegistrationType: company.RegistrationType || "",
//         PeriodicityofGSTReturns: company.PeriodicityofGSTReturns || "",
//         GSTUsername: company.GSTUsername || "",
//         GSTPassword: company.GSTPassword || "",
//         ewayBillApplicable:
//           company.ewayBillApplicable === true
//             ? "true"
//             : company.ewayBillApplicable === false
//               ? "false"
//               : "false",
//         EWBBillUsername: company.EWBBillUsername || "",
//         EWBBillPassword: company.EWBBillPassword || "",
//         TANNumber: company.TANNumber || "",
//         TAXDeductionCollectionAcc: company.TAXDeductionCollectionAcc || "",
//         DeductorType: company.DeductorType || "",
//         TDSLoginUsername: company.TDSLoginUsername || "",
//         TDSLoginPassword: company.TDSLoginPassword || "",
//         client: getClientId(company.client),
//       });
//     } else {
//       form.reset({
//         registrationNumber: "",
//         businessName: "",
//         businessType: "",
//         address: "",
//         City: "",
//         addressState: "",
//         Country: "",
//         Pincode: "",
//         Telephone: "",
//         mobileNumber: "",
//         emailId: "",
//         Website: "",
//         PANNumber: "",
//         IncomeTaxLoginPassword: "",
//         gstin: "",
//         gstState: "",
//         RegistrationType: "",
//         PeriodicityofGSTReturns: "",
//         GSTUsername: "",
//         GSTPassword: "",
//         ewayBillApplicable: "false",
//         EWBBillUsername: "",
//         EWBBillPassword: "",
//         TANNumber: "",
//         TAXDeductionCollectionAcc: "",
//         DeductorType: "",
//         TDSLoginUsername: "",
//         TDSLoginPassword: "",
//         client: "",
//       });
//     }
//   }, [company, form]);

//   async function onSubmit(values: FormData) {
//     if (duplicateError) {
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: duplicateError,
//       });
//       return;
//     }

//     console.log("Form onSubmit called with values:", values);
//     setIsSubmitting(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const url = company
//         ? `${baseURL}/api/companies/${company._id}`
//         : isClient
//           ? `${baseURL}/api/companies/create`
//           : `${baseURL}/api/companies`;
//       const method = company ? "PUT" : "POST";

//       const { client, ...rest } = values;
//       const payload = isClient ? rest : { ...rest, selectedClient: client };

//       let headers: Record<string, string> = { Authorization: `Bearer ${token}` };
//       let body: BodyInit;

//       if (logoFile || method === "POST") {
//         const fd = new FormData();
//         Object.entries(payload).forEach(([k, v]) => {
//           if (v !== undefined && v !== null) fd.append(k, String(v));
//         });
//         if (logoFile) fd.append("logo", logoFile);
//         body = fd;
//       } else {
//         const jsonPayload = { ...payload, ewayBillApplicable: payload.ewayBillApplicable === "true" };
//         headers["Content-Type"] = "application/json";
//         body = JSON.stringify(jsonPayload);
//       }

//       const res = await fetch(url, {
//         method,
//         headers,
//         body,
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Operation failed.");

//       toast({
//         title: company ? "Company Updated!" : "Company Created!",
//         description: `${values.businessName} has been successfully saved.`,
//       });
//       onFormSubmit();
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Operation Failed",
//         description:
//           error instanceof Error ? error.message : "An error occurred.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }


//   async function handleRemoveLogo() {
//     if (!company?._id) return;
//     try {
//       setIsSubmitting(true);
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const res = await fetch(`${baseURL}/api/companies/${company._id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ logo: null }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Failed to remove logo");

//       setLogoFile(null);
//       setLogoPreview(null);
//       toast({ title: "Logo removed" });
//       onFormSubmit();
//     } catch (e) {
//       toast({
//         variant: "destructive",
//         title: "Failed",
//         description: e instanceof Error ? e.message : "An error occurred.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   // Build states whenever country changes
//   React.useEffect(() => {
//     const states = State.getStatesOfCountry(countryCode) || [];
//     setStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
//   }, [countryCode]);

//   // Build cities whenever state changes
//   React.useEffect(() => {
//     if (!countryCode || !stateCode) {
//       setCityOptions([]);
//       return;
//     }
//     const cities = City.getCitiesOfState(countryCode, stateCode) || [];
//     setCityOptions(cities.map((c) => ({ label: c.name, value: c.name })));
//   }, [countryCode, stateCode]);

//   // On load, default Country to India and sync existing state/city (edit mode)
//   React.useEffect(() => {
//     if (!form.getValues("Country")) {
//       form.setValue("Country", india.name, { shouldValidate: true });
//     }
//     const existingStateName = (form.getValues("addressState") || "").toString();
//     if (existingStateName) {
//       const iso = State.getStatesOfCountry("IN").find(
//         (s) => s.name.toLowerCase() === existingStateName.toLowerCase()
//       )?.isoCode;
//       if (iso) setStateCode(iso);
//     }
//   }, []);

//   // Handle Next button with duplicate check
//   const handleNextStep = async () => {
//     if (step === 1 && duplicateError) {
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: duplicateError,
//       });
//       return;
//     }

//     // Validate custom fields before proceeding to next step
//     const currentValues = form.getValues();
//     const isCustomValid = validateCustomFields(currentValues);
    
//     if (!isCustomValid) {
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: "Please fix the validation errors before proceeding.",
//       });
//       return;
//     }

//     const isValid = await form.trigger(getStepFields(isClient)[step as keyof ReturnType<typeof getStepFields>] as (keyof FormData)[]);
//     if (isValid) {
//       setStep(step + 1);
//     }
//   };

//   return (
//     <>
//       <div className="w-full max-w-5xl mx-auto px-4 md:px-8 overflow-y-auto max-h-[80vh] md:block">
//         <Form {...form}>
//           <form className="space-y-4">
           
//             {/* Stepper code remains the same */}
//             <div className="md:hidden flex flex-col space-y-3 pb-2">
//               {[
//                 { number: 1, label: "Company Basic Details" },
//                 { number: 2, label: "GST Registration Details" },
//                 { number: 3, label: "Company TDS Details" },
//               ].map(({ number, label }) => (
//                 <button
//                   key={number}
//                   type="button"
//                   onClick={() => setStep(number)}
//                   className={`flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 ${
//                     step === number
//                       ? "bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-950/30 dark:border-indigo-800"
//                       : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
//                   } hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600`}
//                 >
//                   <div
//                     className={`w-6 h-6 text-base flex items-center justify-center rounded-full border-2 font-semibold flex-shrink-0 transition-all ${
//                       step === number
//                         ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
//                         : "bg-white text-gray-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
//                     }`}
//                   >
//                     {number}
//                   </div>
//                   <span
//                     className={`text-sm font-medium ${
//                       step === number
//                         ? "text-indigo-600 dark:text-indigo-400"
//                         : "text-gray-600 dark:text-gray-300"
//                     }`}
//                   >
//                     {label}
//                   </span>
//                   {step === number && (
//                     <ChevronRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400 ml-auto flex-shrink-0" />
//                   )}
//                 </button>
//               ))}
//             </div>

//             <div className="hidden md:flex justify-center items-center gap-8 pb-10">
//               {[
//                 { number: 1, label: "Company Basic Details" },
//                 { number: 2, label: "GST Registration Details" },
//                 { number: 3, label: "Company TDS Details" },
//               ].map(({ number, label }, index, array) => (
//                 <div key={number} className="flex items-center">
//                   <button
//                     type="button"
//                     onClick={() => setStep(number)}
//                     className={`flex flex-col items-center group transition-all duration-300`}
//                   >
//                     <div
//                       className={`w-8 h-8 text-base flex items-center justify-center rounded-full border-2 font-semibold mb-3 transition-all ${
//                         step === number
//                           ? "bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110"
//                           : step > number
//                             ? "bg-green-500 text-white border-green-500"
//                             : "bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 group-hover:border-indigo-400 dark:group-hover:border-indigo-500"
//                       }`}
//                     >
//                       {step > number ? <Check className="h-5 w-5" /> : number}
//                     </div>
//                     <span
//                       className={`text-sm font-medium text-center  leading-tight ${
//                         step === number
//                           ? "text-indigo-600 dark:text-indigo-400 font-semibold"
//                           : step > number
//                             ? "text-green-600 dark:text-green-400"
//                             : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
//                       }`}
//                     >
//                       {label}
//                     </span>
//                     {step === number && (
//                       <div className="w-6 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-2"></div>
//                     )}
//                   </button>

//                   {index < array.length - 1 && (
//                     <div
//                       className={`w-16 h-1 rounded-full mx-4 transition-all duration-300 ${
//                         step > number + 1
//                           ? "bg-green-500"
//                           : step > number
//                             ? "bg-indigo-300 dark:bg-indigo-600"
//                             : "bg-gray-200 dark:bg-gray-700"
//                       }`}
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>

//             <div className="pb-20 md:pb-[15vh]">
//               {/* Step 1 */}
//               {step === 1 && (
//                 <div className="space-y-4">
//                   {!isClient && (
//                     <FormField
//                       control={form.control}
//                       name="client"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             Assign to Client...........
//                           </FormLabel>
//                           <Select
//                             onValueChange={field.onChange}
//                             value={field.value}
//                             defaultValue={field.value}
//                           >
//                             <FormControl>
//                               <SelectTrigger className="text-sm">
//                                 <SelectValue placeholder="Select a client" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               {clients.map((client) => (
//                                 <SelectItem
//                                   key={client._id}
//                                   value={client._id}
//                                   className="text-sm"
//                                 >
//                                   {client.contactName} - ({client.email})
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   )}

//                   <div className="space-y-2">
//                     <FormLabel className="text-sm font-medium">
//                       Company Logo
//                     </FormLabel>
//                     <Input
//                       type="file"
//                       accept="image/*"
//                       onChange={(e) => {
//                         const f = e.target.files?.[0] || null;
//                         setLogoFile(f);
//                         setLogoPreview(
//                           f ? URL.createObjectURL(f) : logoPreview
//                         );
//                       }}
//                       className="text-sm"
//                     />
//                     {logoPreview && (
//                       <img
//                         src={logoPreview}
//                         alt="Logo preview"
//                         className="mt-2 h-16 w-auto rounded border"
//                       />
//                     )}
//                     {company?.logo && (
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={handleRemoveLogo}
//                         className="mt-2 text-xs"
//                       >
//                         Remove current logo
//                       </Button>
//                     )}
//                   </div>

//                   <div className="grid md:grid-cols-2 gap-4">
//                     <FormField
//                       control={form.control}
//                       name="businessType"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             Business Type
//                           </FormLabel>
//                           <Select
//                             onValueChange={field.onChange}
//                             value={field.value}
//                             defaultValue={field.value}
//                           >
//                             <FormControl>
//                               <SelectTrigger className="text-sm">
//                                 <SelectValue placeholder="Select business type" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               {defaultBusinessTypes.map((type) => (
//                                 <SelectItem
//                                   key={type}
//                                   value={type}
//                                   className="text-sm"
//                                 >
//                                   {type}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="businessName"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             {getLabel("businessName")}
//                           </FormLabel>
//                           <FormControl>
//                             <Input {...field} className="text-sm" />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     {/* Registration Number with Duplicate Check */}
//                     <FormField
//                       control={form.control}
//                       name="registrationNumber"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             {getLabel("registrationNumber")}
//                           </FormLabel>
//                           <FormControl>
//                             <div className="relative">
//                               <Input
//                                 {...field}
//                                 className="text-sm"
//                                 onChange={(e) => {
//                                   field.onChange(e);
//                                   handleRegistrationChange(e.target.value);
//                                 }}
//                               />
//                               {isCheckingDuplicate && (
//                                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                                   <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
//                                 </div>
//                               )}
//                             </div>
//                           </FormControl>
//                           {duplicateError && (
//                             <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 mt-1">
//                               <AlertCircle className="h-4 w-4" />
//                               <span>{duplicateError}</span>
//                             </div>
//                           )}
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     {/* Regular fields */}
//                     {["Pincode", "Telephone", "Website", "IncomeTaxLoginPassword", "address"].map((name) => (
//                       <FormField
//                         key={name}
//                         control={form.control}
//                         name={name as keyof FormData}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel className="text-sm font-medium">
//                               {getLabel(name)}
//                             </FormLabel>
//                             <FormControl>
//                               <Input {...field} className="text-sm" />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     ))}

//                     {/* Mobile Number (required) */}
//                     <FormField
//                       control={form.control}
//                       name="mobileNumber"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             {getLabel("mobileNumber")}
//                           </FormLabel>
//                           <FormControl>
//                             <Input {...field} className="text-sm" />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     {/* Custom validated fields - THIS WILL NOW WORK */}
//                     <ValidatedOptionalInput 
//                       control={form.control} 
//                       name="emailId" 
//                       label={getLabel("emailId")}
//                       validateFn={validateEmail}
//                     />
                    
//                     <ValidatedOptionalInput 
//                       control={form.control} 
//                       name="PANNumber" 
//                       label={getLabel("PANNumber")}
//                       validateFn={validatePAN}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="Country"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             Country
//                           </FormLabel>
//                           <Combobox
//                             options={[{ label: "India", value: "IN" }]}
//                             value={countryCode}
//                             onChange={(iso: string) => {
//                               setCountryCode(iso);
//                               setStateCode("");
//                               form.setValue("Country", "India");
//                               form.setValue("addressState", "");
//                               form.setValue("City", "");
//                             }}
//                             placeholder="Select country"
//                             searchPlaceholder="Type to search"
//                           />
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="addressState"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             State
//                           </FormLabel>
//                           <Combobox
//                             options={stateOptions}
//                             value={
//                               stateCode ||
//                               stateOptions.find(
//                                 (o) =>
//                                   o.label.toLowerCase() ===
//                                   (field.value || "").toLowerCase()
//                               )?.value ||
//                               ""
//                             }
//                             onChange={(iso: string) => {
//                               setStateCode(iso);
//                               const selected = stateOptions.find(
//                                 (s) => s.value === iso
//                               );
//                               field.onChange(selected?.label || "");
//                               form.setValue("City", "");
//                             }}
//                             placeholder="Select state"
//                             searchPlaceholder="Type state name"
//                           />
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="City"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             City
//                           </FormLabel>
//                           <Combobox
//                             options={cityOptions}
//                             value={
//                               cityOptions.find(
//                                 (o) =>
//                                   o.label.toLowerCase() ===
//                                   (field.value || "").toLowerCase()
//                               )?.value || ""
//                             }
//                             onChange={(v: string) => field.onChange(v)}
//                             placeholder={
//                               stateCode ? "Select city" : "Select a state first"
//                             }
//                             searchPlaceholder="Type city name"
//                             disabled={!stateCode || cityOptions.length === 0}
//                           />
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 </div>
//               )}

//               {/* Step 2 */}
//               {step === 2 && (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <ValidatedOptionalInput 
//                       control={form.control} 
//                       name="gstin" 
//                       label={getLabel("gstin")}
//                       validateFn={validateGSTIN}
//                     />

//                     {/* GST State Dropdown */}
//                     <FormField
//                       control={form.control}
//                       name="gstState"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             {getLabel("gstState")}
//                           </FormLabel>
//                           <Combobox
//                             options={gstStateOptions}
//                             value={
//                               gstStateCode ||
//                               gstStateOptions.find(
//                                 (o) =>
//                                   o.label.toLowerCase() === (field.value || "").toLowerCase()
//                               )?.value ||
//                               ""
//                             }
//                             onChange={(iso: string) => {
//                               setGstStateCode(iso);
//                               const selected = gstStateOptions.find(
//                                 (s) => s.value === iso
//                               );
//                               field.onChange(selected?.label || "");
//                             }}
//                             placeholder="Select GST state"
//                             searchPlaceholder="Type state name"
//                           />
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="RegistrationType"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             {getLabel("RegistrationType")}
//                           </FormLabel>
//                           <Select
//                             onValueChange={field.onChange}
//                             value={field.value}
//                             defaultValue={field.value}
//                           >
//                             <FormControl>
//                               <SelectTrigger className="text-sm">
//                                 <SelectValue placeholder="Select registration type" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               {gstRegistrationTypes.map((type) => (
//                                 <SelectItem
//                                   key={type}
//                                   value={type}
//                                   className="text-sm"
//                                 >
//                                   {type}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     {[
//                       "PeriodicityofGSTReturns",
//                       "GSTUsername",
//                       "GSTPassword",
//                       "EWBBillUsername",
//                       "EWBBillPassword",
//                     ].map((name) => (
//                       <FormField
//                         key={name}
//                         control={form.control}
//                         name={name as keyof FormData}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel className="text-sm font-medium">
//                               {getLabel(name)}
//                             </FormLabel>
//                             <FormControl>
//                               <Input {...field} className="text-sm" />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     ))}

//                     <FormField
//                       control={form.control}
//                       name="ewayBillApplicable"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel className="text-sm font-medium">
//                             {getLabel("ewayBillApplicable")}
//                           </FormLabel>
//                           <Select
//                             onValueChange={field.onChange}
//                             value={field.value}
//                           >
//                             <FormControl>
//                               <SelectTrigger className="text-sm">
//                                 <SelectValue placeholder="Select Yes or No" />
//                               </SelectTrigger>
//                             </FormControl>
//                             <SelectContent>
//                               <SelectItem value="true" className="text-sm">
//                                 Yes
//                               </SelectItem>
//                               <SelectItem value="false" className="text-sm">
//                                 No
//                               </SelectItem>
//                             </SelectContent>
//                           </Select>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>
//                 </div>
//               )}

//               {/* Step 3 */}
//               {step === 3 && (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <ValidatedOptionalInput 
//                       control={form.control} 
//                       name="TANNumber" 
//                       label={getLabel("TANNumber")}
//                       validateFn={validateTAN}
//                     />
                    
//                     {[
//                       "TAXDeductionCollectionAcc",
//                       "DeductorType",
//                       "TDSLoginUsername",
//                       "TDSLoginPassword",
//                     ].map((name) => (
//                       <FormField
//                         key={name}
//                         control={form.control}
//                         name={name as keyof FormData}
//                         render={({ field }) => (
//                           <FormItem>
//                             <FormLabel className="text-sm font-medium">
//                               {getLabel(name)}
//                             </FormLabel>
//                             <FormControl>
//                               <Input {...field} className="text-sm" />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Bottom actions remain the same */}
//             <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50 md:hidden">
//               <div className="flex justify-between items-center gap-3">
//                 {step > 1 ? (
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setStep(step - 1)}
//                     className="flex-1 gap-1 text-sm"
//                   >
//                     <ChevronLeft className="h-4 w-4" />
//                     Previous
//                   </Button>
//                 ) : (
//                   <div className="flex-1"></div>
//                 )}

//                 {step < 3 ? (
//                   <Button
//                     type="button"
//                     onClick={handleNextStep}
//                     disabled={isCheckingDuplicate}
//                     className="flex-1 gap-1 text-sm"
//                   >
//                     {isCheckingDuplicate ? (
//                       <>
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                         Checking...
//                       </>
//                     ) : (
//                       <>
//                         Next
//                         <ChevronRight className="h-4 w-4" />
//                       </>
//                     )}
//                   </Button>
//                 ) : (
//                   <Button
//                     type="button"
//                     onClick={form.handleSubmit(onSubmit)}
//                     disabled={isSubmitting || !!duplicateError}
//                     className="flex-1 bg-primary hover:bg-primary/90 transition-colors text-sm"
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         {company ? "Saving..." : "Creating..."}
//                       </>
//                     ) : (
//                       <>
//                         {company ? (
//                           <>
//                             <Save className="mr-2 h-4 w-4" />
//                             Save
//                           </>
//                         ) : (
//                           <>
//                             <PlusCircle className="mr-2 h-4 w-4" />
//                             Create
//                           </>
//                         )}
//                       </>
//                     )}
//                   </Button>
//                 )}
//               </div>
//             </div>

//             <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50">
//               <div className="container flex justify-between items-center">
//                 {step > 1 && (
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setStep(step - 1)}
//                     className="gap-1 transition-all hover:gap-2 min-w-[7rem]"
//                   >
//                     <ChevronLeft className="h-4 w-4" />
//                     Previous
//                   </Button>
//                 )}
//                 {step < 3 ? (
//                   <Button
//                     type="button"
//                     onClick={handleNextStep}
//                     disabled={isCheckingDuplicate}
//                     className="gap-1 transition-all hover:gap-2 min-w-[7rem] ml-auto"
//                   >
//                     {isCheckingDuplicate ? (
//                       <>
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                         Checking...
//                       </>
//                     ) : (
//                       <>
//                         Next
//                         <ChevronRight className="h-4 w-4" />
//                       </>
//                     )}
//                   </Button>
//                 ) : (
//                   <Button
//                     type="button"
//                     onClick={() => form.handleSubmit(onSubmit)()}
//                     disabled={isSubmitting || !!duplicateError}
//                     className="bg-primary hover:bg-primary/90 transition-colors min-w-[10rem] ml-auto"
//                   >
//                     {isSubmitting ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         {company ? "Saving..." : "Creating..."}
//                       </>
//                     ) : (
//                       <>
//                         {company ? (
//                           <>
//                             <Save className="mr-2 h-4 w-4" />
//                             Save Changes
//                           </>
//                         ) : (
//                           <>
//                             <PlusCircle className="mr-2 h-4 w-4" />
//                             Create Company
//                           </>
//                         )}
//                       </>
//                     )}
//                   </Button>
//                 )}
//               </div>
//             </div>
//           </form>
//         </Form>
//       </div>
//     </>
//   );
// }