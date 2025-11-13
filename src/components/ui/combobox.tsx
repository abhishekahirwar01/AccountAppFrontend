"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  creatable?: boolean;
  onCreate?: (inputValue: string) => Promise<any>;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Enter Name",
  searchPlaceholder = "Enter Name ",
  noResultsText = "No results found.",
  creatable = false,
  onCreate,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [filteredOptions, setFilteredOptions] = React.useState(options);

  const selectedOption = options.find((option) => option.value === value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  React.useEffect(() => {
    if (open) {
      // ✅ Clear search when opening, and show full list
      setSearchValue("");
      setFilteredOptions(options);
    } else {
      // ✅ When closed, show the selected option’s label
      const selected = options.find((o) => o.value === value);
      setSearchValue(selected?.label || "");
    }
  }, [open, value, options]);

  const handleCreate = async () => {
    if (onCreate && searchValue) {
      setOpen(false); // close immediately
      await onCreate(searchValue);
      setSearchValue("");
      setFilteredOptions(options);
    }
  };

  const handleInputChange = (text: string) => {
    setSearchValue(text);

    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(text.toLowerCase())
    );

    // Agar input empty hai, poori list show karo
    setFilteredOptions(text.trim() === "" ? options : filtered);

    // suggestions hamesha open
    setOpen(true);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    const newSelected = options.find(
      (option) => option.value === selectedValue
    );
    setSearchValue(newSelected?.label || "");
    setFilteredOptions(options);
    setOpen(false);
  };

  const showCreateOption =
    creatable &&
    searchValue &&
    !filteredOptions.some(
      (opt) => opt.label.toLowerCase() === searchValue.toLowerCase()
    );

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="relative w-full border border-gray-800 rounded-md focus:border-primary focus:ring-1 focus:ring-primary py-0">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={handleInputChange}
            onFocus={() => {
              setOpen(true);
              setSearchValue(""); // ✅ clear right when focusing
              setFilteredOptions(options); // show full list on fresh focus
            }}
            disabled={disabled}
            className=" "
          />

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50">
              <CommandList
                className="w-full border rounded-md shadow-lg bg-white text-black
                 dark:bg-gray-900 dark:text-white dark:border-gray-800
                 max-h-72 overflow-y-auto"
              >
                <CommandEmpty>
                  {showCreateOption ? "" : noResultsText}
                </CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                  {showCreateOption && (
                    <CommandItem
                      value={searchValue}
                      onSelect={handleCreate}
                      className="flex items-center text-primary"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </div>
          )}
        </Command>
      </div>
    </div>
  );
}