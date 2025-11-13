import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function StepTwo({ form }: { form: any }) {
  const fields = [
    "gstin", "gstState", "RegistrationType", "PeriodicityofGSTReturns", "GSTUsername",
    "GSTPassword"," ewayBillApplicable", "EWBBillUsername", "EWBBillPassword",
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {fields.map((field) => (
        <FormField
          key={field}
          control={form.control}
          name={field}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>{field}</FormLabel>
              <FormControl>
                <Input {...f} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
