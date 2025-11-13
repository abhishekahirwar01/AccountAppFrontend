"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { searchHSNCodes, type HSNCode } from "@/lib/hsnProduct";

interface HSNSearchInputProps {
  onSelect: (hsn: HSNCode) => void;
  placeholder: string;
}

export function HSNSearchInput({ onSelect, placeholder }: HSNSearchInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<HSNCode[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchHSNCodes(inputValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("HSN search error:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (hsn: HSNCode) => {
    setInputValue(hsn.code);
    setShowSuggestions(false);
    onSelect(hsn);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          if (inputValue.length >= 2 && suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((hsn) => (
            <div
              key={hsn.code}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors"
              onClick={() => handleSelect(hsn)}
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
      {showSuggestions &&
        inputValue.length >= 2 &&
        suggestions.length === 0 &&
        !isLoading && (
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
  );
}
