"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormFocus } from "@/hooks/useFormFocus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Combobox } from "../ui/combobox";

interface ReceiptPaymentFieldsProps {
  form: any;
  type: "receipt" | "payment";
  companies: any[];
  paymentExpenses: any[];
  setPaymentExpenses: (expenses: any[] | ((prev: any[]) => any[])) => void;
  partyLabel: string;
  partyOptions: any[];
  partyCreatable: boolean;
  partyBalance: number | null;
  vendorBalance: number | null;
  paymentMethodsForReceipt: string[];
  handlePartyChange: (value: string) => void;
  handleTriggerCreateParty?: (name: string) => void;
  baseURL: string;
}

export const ReceiptPaymentFields: React.FC<ReceiptPaymentFieldsProps> = ({
  form,
  type,
  companies,
  paymentExpenses,
  setPaymentExpenses,
  partyLabel,
  partyOptions,
  partyCreatable,
  partyBalance,
  vendorBalance,
  paymentMethodsForReceipt,
  handlePartyChange,
  handleTriggerCreateParty,
  baseURL,
}) => {
  const { toast } = useToast();

  // Use the form focus hook with current form errors
  const { registerField } = useFormFocus(form.formState.errors);

  // ✅ Simple wrapper that returns Promise
  const handlePartyCreateWrapper = async (name: string): Promise<string> => {
    if (handleTriggerCreateParty) {
      handleTriggerCreateParty(name);
    }
    return ""; // Return empty string
  };

  return (
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
      </div>

      {type === "payment" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isExpense"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <div
                    ref={(el: HTMLDivElement | null) =>
                      registerField("isExpense", el)
                    }
                  >
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
                          form.setValue("expense", "", {
                            shouldValidate: false,
                          });
                        }
                        // Trigger full form validation to update field requirements
                        form.trigger();
                      }}
                    />
                  </div>
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
                  <div
                    ref={(el: HTMLDivElement | null) =>
                      registerField("expense", el)
                    }
                  >
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
                  </div>
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
                <div
                  ref={(el: HTMLDivElement | null) =>
                    registerField("party", el)
                  }
                >
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
                    onCreate={handlePartyCreateWrapper}
                  />
                </div>
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
                    ref={(el: HTMLInputElement | null) =>
                      registerField("totalAmount", el)
                    }
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
                  <SelectTrigger
                    ref={(el: HTMLButtonElement | null) =>
                      registerField("paymentMethod", el)
                    }
                  >
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
                <Input
                  placeholder="e.g. Cheque No, Ref #"
                  {...field}
                  ref={(el: HTMLInputElement | null) =>
                    registerField("referenceNumber", el)
                  }
                />
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
              <Textarea
                placeholder="Describe the transaction..."
                {...field}
                ref={(el: HTMLTextAreaElement | null) =>
                  registerField("description", el)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
