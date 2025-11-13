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
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import bankList from "@/data/bankList.json";

// Update interfaces to handle both string and object company types
interface Company {
  _id: string;
  businessName: string;
}

interface BankDetail {
  _id: string;
  client: string;
  company: string | Company;  // Can be string ID or Company object
  bankName: string;
  // managerName: string;
  // contactNumber: string;
  // email?: string;
  city: string;
  accountNo: string;
  ifscCode?: string;
  branchAddress?: string;
  upiDetails?: {
    upiId?: string;
    upiName?: string;
    upiMobile?: string;
  };
  qrCode?: string; // Path to uploaded QR code image
}

interface BankDetailsFormProps {
  bankDetail?: BankDetail;
  onSuccess: () => void;
  onCancel?: () => void;
}

// Form validation schema
const formSchema = z.object({
  company: z.string().min(1, "Company is required."),
  bankName: z.string().min(2, "Bank name is required."),
  // managerName: z.string().min(2, "Manager name is required."),
  // contactNumber: z
  //   .string()
  //   .min(10, "Valid 10-digit contact number required.")
  //   .max(10, "Valid 10-digit contact number required."),
  // email: z
  //   .string()
  //   .email("Invalid email address.")
  //   .optional()
  //   .or(z.literal("")),
  city: z.string().min(2, "City is required."),
  accountNo: z.string().min(1, "Account number is required."),
  ifscCode: z
    .string()
    .min(11, "IFSC code must be 11 characters.")
    .max(11, "IFSC code must be 11 characters.")
    .optional()
    .or(z.literal("")),
  branchAddress: z.string().optional().or(z.literal("")),
  upiId: z.string().optional().or(z.literal("")),
  upiName: z.string().optional().or(z.literal("")),
  upiMobile: z.string().optional().or(z.literal("")),
  qrCode: z.string().optional().or(z.literal("")), // QR code file path
});

type FormData = z.infer<typeof formSchema>;

export function BankDetailsForm({
  bankDetail,
  onSuccess,
  onCancel,
}: BankDetailsFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Bank search states
  const [bankSuggestions, setBankSuggestions] = React.useState<any[]>([]);
  const [showBankSuggestions, setShowBankSuggestions] = React.useState(false);
  const [isLoadingBankSuggestions, setIsLoadingBankSuggestions] = React.useState(false);
  const [focusedBankIndex, setFocusedBankIndex] = React.useState(-1);
  const [bankSelectedFromDropdown, setBankSelectedFromDropdown] = React.useState(false);
  const bankInputRef = React.useRef<HTMLInputElement>(null);
  const [qrCodeFile, setQrCodeFile] = React.useState<File | null>(null);
  const [existingQrCode, setExistingQrCode] = React.useState<string>("");

  // Helper function to extract company ID
  const getCompanyId = (company: string | Company | undefined): string => {
    if (!company) return "";
    if (typeof company === "string") return company;
    return company._id;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: getCompanyId(bankDetail?.company),
      bankName: bankDetail?.bankName || "",
      // managerName: bankDetail?.managerName || "",
      // contactNumber: bankDetail?.contactNumber || "",
      // email: bankDetail?.email || "",
      city: bankDetail?.city || "",
      accountNo: bankDetail?.accountNo || "",
      ifscCode: bankDetail?.ifscCode || "",
      branchAddress: bankDetail?.branchAddress || "",
      upiId: bankDetail?.upiDetails?.upiId || "",
      upiName: bankDetail?.upiDetails?.upiName || "",
      upiMobile: bankDetail?.upiDetails?.upiMobile || "",
      qrCode: bankDetail?.qrCode || "",
    },
  });

  // Fetch companies from the backend
  const fetchCompanies = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${baseURL}/api/companies/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch companies.");
      }

      const companiesData = await response.json();
      setCompanies(companiesData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load companies",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [baseURL, toast]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Update form values when bankDetail changes
  React.useEffect(() => {
    if (bankDetail) {
      form.reset({
        company: getCompanyId(bankDetail.company),
        bankName: bankDetail.bankName,
        // managerName: bankDetail.managerName,
        // contactNumber: bankDetail.contactNumber,
        // email: bankDetail.email || "",
        city: bankDetail.city,
        accountNo: bankDetail.accountNo || "",
        ifscCode: bankDetail.ifscCode || "",
        branchAddress: bankDetail.branchAddress || "",
        upiId: bankDetail.upiDetails?.upiId || "",
        upiName: bankDetail.upiDetails?.upiName || "",
        upiMobile: bankDetail.upiDetails?.upiMobile || "",
        qrCode: bankDetail.qrCode || "",
      });
      // Set existing QR code for display
      setExistingQrCode(bankDetail.qrCode || "");
      // Set bank as selected if editing existing bank detail
      if (bankDetail.bankName) {
        setBankSelectedFromDropdown(true);
      }
    }
  }, [bankDetail, form]);

  // Get the current bank name value from form
  const bankNameValue = form.watch("bankName");

  // Debounced search for bank names
  React.useEffect(() => {
    if (bankSelectedFromDropdown) {
      setShowBankSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      if (bankNameValue && bankNameValue.length >= 2) {
        setIsLoadingBankSuggestions(true);
        const results = (bankList as any[]).filter((bank: any) =>
          bank.bank_name.toLowerCase().includes(bankNameValue.toLowerCase()) ||
          bank.ifsc.toLowerCase().includes(bankNameValue.toLowerCase())
         )
  .slice(0, 20); 
        setBankSuggestions(results);
        setShowBankSuggestions(true);
        setIsLoadingBankSuggestions(false);
      } else {
        setShowBankSuggestions(false);
        setBankSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [bankNameValue, bankSelectedFromDropdown]);

  const handleBankSelect = (bank: any) => {
    form.setValue("bankName", bank.bank_name);
    form.setValue("ifscCode", bank.ifsc);
    setShowBankSuggestions(false);
    setBankSelectedFromDropdown(true);
    bankInputRef.current?.blur();
  };

  const handleBankInputBlur = () => {
    setTimeout(() => {
      setShowBankSuggestions(false);
    }, 200);
  };

  // Function to decode JWT token and extract client ID
  const getClientIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      // Decode the token without verification (for client-side use only)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.clientId || payload.id || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // Decode the token and extract the clientId
      const clientId = getClientIdFromToken();
      if (!clientId) {
        throw new Error("Client authentication required. Please log in again.");
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add all form values
      formDataToSend.append('company', values.company);
      formDataToSend.append('bankName', values.bankName);
      formDataToSend.append('city', values.city);
      formDataToSend.append('accountNo', values.accountNo);
      if (values.ifscCode) formDataToSend.append('ifscCode', values.ifscCode);
      if (values.branchAddress) formDataToSend.append('branchAddress', values.branchAddress);
      if (values.upiId) formDataToSend.append('upiId', values.upiId);
      if (values.upiName) formDataToSend.append('upiName', values.upiName);
      if (values.upiMobile) formDataToSend.append('upiMobile', values.upiMobile);
      formDataToSend.append('client', clientId);

      // Add QR code file if selected
      if (qrCodeFile) {
        formDataToSend.append('qrCode', qrCodeFile);
      } else if (bankDetail && existingQrCode) {
        // Keep existing QR code if no new file uploaded
        formDataToSend.append('qrCode', existingQrCode);
      }

      // Determine if we're creating a new or updating an existing bank detail
      const url = bankDetail
        ? `${baseURL}/api/bank-details/${bankDetail._id}` // URL for updating
        : `${baseURL}/api/bank-details`; // URL for creating

      const method = bankDetail ? "PUT" : "POST"; // Method based on if we're creating or updating

      // Make the fetch request to the backend API
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let browser set it for FormData
        },
        body: formDataToSend, // Send FormData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to ${bankDetail ? "update" : "create"} bank detail.`
        );
      }

      // Success toast
      toast({
        title: "Success",
        description: `Bank detail ${bankDetail ? "updated" : "created"} successfully.`,
      });

      // Trigger the success callback to close or refresh the form
      onSuccess();
    } catch (error) {
      // Error toast
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false); // Reset the submitting state
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
        <ScrollArea className="max-h-[60vh] flex-1">
          <div className="space-y-4 px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Company Dropdown */}
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.businessName}
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
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="relative">
                          <Input
                            placeholder="Search bank name (e.g., State Bank)"
                            {...field}
                            ref={bankInputRef}
                            onChange={(e) => {
                              field.onChange(e);
                              setShowBankSuggestions(true);
                              setFocusedBankIndex(-1);
                              setBankSelectedFromDropdown(false);
                            }}
                            onBlur={handleBankInputBlur}
                            onFocus={() => {
                              if (field.value && field.value.length >= 2) {
                                setIsLoadingBankSuggestions(true);
                                const results = (bankList as any[]).filter((bank: any) =>
                                  bank.bank_name.toLowerCase().includes(field.value.toLowerCase()) ||
                                  bank.ifsc.toLowerCase().includes(field.value.toLowerCase())
                                );
                                setBankSuggestions(results);
                                setShowBankSuggestions(true);
                                setIsLoadingBankSuggestions(false);
                              } else {
                                setShowBankSuggestions(true);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (!showBankSuggestions || bankSuggestions.length === 0) return;

                              switch (e.key) {
                                case 'ArrowDown':
                                  e.preventDefault();
                                  setFocusedBankIndex(prev =>
                                    prev < bankSuggestions.length - 1 ? prev + 1 : 0
                                  );
                                  break;
                                case 'ArrowUp':
                                  e.preventDefault();
                                  setFocusedBankIndex(prev =>
                                    prev > 0 ? prev - 1 : bankSuggestions.length - 1
                                  );
                                  break;
                                case 'Enter':
                                  e.preventDefault();
                                  if (focusedBankIndex >= 0 && focusedBankIndex < bankSuggestions.length) {
                                    handleBankSelect(bankSuggestions[focusedBankIndex]);
                                  }
                                  break;
                                case 'Escape':
                                  e.preventDefault();
                                  setShowBankSuggestions(false);
                                  setFocusedBankIndex(-1);
                                  break;
                              }
                            }}
                          />
                          {isLoadingBankSuggestions && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>

                        {/* Bank Suggestions Dropdown */}
                        {showBankSuggestions && bankSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                            {bankSuggestions.map((bank, index) => (
                              <div
                                key={bank.id}
                                className={cn(
                                  "px-3 py-2 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors",
                                  index === focusedBankIndex
                                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                                onClick={() => handleBankSelect(bank)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {bank.bank_name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    {bank.ifsc}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* No results message */}
                        {showBankSuggestions && bankNameValue && bankNameValue.length >= 2 &&
                          bankSuggestions.length === 0 && !isLoadingBankSuggestions && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                              No matching banks found.
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                              Please check the bank name or enter manually.
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Start typing 2+ characters to see bank suggestions
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 9876543210"
                        {...field}
                        type="tel"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div> */}
{/* 
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. john@example.com" 
                        {...field} 
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 123 Main St, New York"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 123456789012"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. SBIN0123456"
                        {...field}
                        style={{ textTransform: 'uppercase' }}
                        maxLength={11}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 123 Main St, New York"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. user@bank"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="upiName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="upiMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI Mobile</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 9876543210"
                        {...field}
                        type="tel"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* QR Code Upload */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="qrCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Code Image</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setQrCodeFile(file);
                              field.onChange(file.name); // Store filename for form validation
                            }
                          }}
                        />
                        {existingQrCode && !qrCodeFile && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Current QR Code:
                            </span>
                            <img
                              src={`${baseURL}/${existingQrCode}`}
                              alt="Current QR Code"
                              className="h-16 w-16 object-contain border rounded"
                            />
                          </div>
                        )}
                        {qrCodeFile && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              New QR Code:
                            </span>
                            <img
                              src={URL.createObjectURL(qrCodeFile)}
                              alt="New QR Code"
                              className="h-16 w-16 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload a QR code image (PNG, JPG, etc.) for payment scanning
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 p-6 border-t bg-background">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {bankDetail ? "Save Changes" : "Create Bank Detail"}
          </Button>
        </div>
      </form>
    </Form>
  );
}