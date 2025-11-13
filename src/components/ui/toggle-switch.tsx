"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ToggleSwitch({ options, value, onChange, className }: ToggleSwitchProps) {
  return (
    <div className={cn("flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex-1",
            value === option.value
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}