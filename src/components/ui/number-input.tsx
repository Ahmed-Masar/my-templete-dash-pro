"use client";

import * as React from "react";
import { Minus, Add as Plus } from "iconsax-react";
import { cn } from "@/lib/utils";

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, step = 1, min, max, disabled, ...props }, ref) => {
    const numValue = parseFloat(String(value)) || 0;

    const canDecrement = min === undefined || numValue - step >= min;
    const canIncrement = max === undefined || numValue + step <= max;

    const handleIncrement = () => {
      if (disabled || !canIncrement) return;
      const newValue = Math.round((numValue + step) * 100) / 100;
      onChange(String(max !== undefined ? Math.min(newValue, max) : newValue));
    };

    const handleDecrement = () => {
      if (disabled || !canDecrement) return;
      const newValue = Math.round((numValue - step) * 100) / 100;
      onChange(String(min !== undefined ? Math.max(newValue, min) : newValue));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
    };

    return (
      <div
        className={cn(
          "flex h-10 items-center rounded-md border border-input bg-background ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || !canDecrement}
          onClick={handleDecrement}
          className="flex h-full items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <Minus color="currentColor" size="14" />
        </button>
        <input
          ref={ref}
          type="number"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          className="h-full w-full flex-1 bg-transparent px-1 text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || !canIncrement}
          onClick={handleIncrement}
          className="flex h-full items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <Plus color="currentColor" size="14" />
        </button>
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
