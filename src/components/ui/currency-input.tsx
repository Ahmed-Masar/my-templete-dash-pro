"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string | number;
  onChange: (value: string) => void;
  suffix?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, suffix = "IQD", ...props }, ref) => {
    const rawValue = typeof value === "string" ? value : String(value || "");
    const displayValue = rawValue ? formatNumber(rawValue) : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const digitsOnly = input.replace(/\D/g, "");
      onChange(digitsOnly);
    };

    return (
      <div className={cn("relative flex", className)}>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className="pr-16 tabular-nums"
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
