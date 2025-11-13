"use client";
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Country, State, City } from "country-state-city";
import { Combobox } from "@/components/ui/combobox";


export default function StepOne({ form }: { form: any }) {
  const fields = [
    "businessName", "businessType", "address",  "Pincode", "Telephone", "mobileNumber", "emailId",
    "Website", "PANNumber", "IncomeTaxLoginPassword"
  ];
  const india = Country.getCountryByCode("IN")!;
  const [countryCode, setCountryCode] = React.useState<string>("IN"); // ISO of country
  const [stateCode, setStateCode] = React.useState<string>("");       // ISO of state
  const [stateOptions, setStateOptions] = React.useState<{label:string; value:string}[]>([]);
  const [cityOptions, setCityOptions]   = React.useState<{label:string; value:string}[]>([]);
  
    // Build states whenever country changes
  React.useEffect(() => {
    const states = State.getStatesOfCountry(countryCode) || [];
    setStateOptions(states.map(s => ({ label: s.name, value: s.isoCode })));
  }, [countryCode]);
  
  // Build cities whenever state changes
  React.useEffect(() => {
    if (!countryCode || !stateCode) {
      setCityOptions([]);
      return;
    }
    const cities = City.getCitiesOfState(countryCode, stateCode) || [];
    setCityOptions(cities.map(c => ({ label: c.name, value: c.name }))); // store city name
  }, [countryCode, stateCode]);
  
  // On load, default Country to India and sync existing state/city (edit mode)
  React.useEffect(() => {
    // default country name
    if (!form.getValues("Country")) {
      form.setValue("Country", india.name, { shouldValidate: true });
    }
    // try to detect state ISO from existing state name
    const existingStateName = (form.getValues("addressState") || "").toString();
    if (existingStateName) {
      const iso = State.getStatesOfCountry("IN")
        .find(s => s.name.toLowerCase() === existingStateName.toLowerCase())
        ?.isoCode;
      if (iso) setStateCode(iso);
    }
  }, []); // run once
  

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

      {/* Country */}
      <FormField
        control={form.control}
        name="Country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
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

      {/* State */}
      <FormField
        control={form.control}
        name="addressState"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State</FormLabel>
            <Combobox
              options={stateOptions}
              value={
                stateCode ||
                stateOptions.find(
                  (o) => o.label.toLowerCase() === (field.value || "").toLowerCase()
                )?.value ||
                ""
              }
              onChange={(iso: string) => {
                setStateCode(iso);
                const selected = stateOptions.find((s) => s.value === iso);
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

      {/* City */}
      <FormField
        control={form.control}
        name="City"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <Combobox
              options={cityOptions}
              value={
                cityOptions.find(
                  (o) => o.label.toLowerCase() === (field.value || "").toLowerCase()
                )?.value || ""
              }
              onChange={(v: string) => field.onChange(v)}
              placeholder={stateCode ? "Select city" : "Select a state first"}
              searchPlaceholder="Type city name"
              disabled={!stateCode || cityOptions.length === 0}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
