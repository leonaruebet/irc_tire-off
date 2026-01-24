"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean; // Allow typing custom values not in options
}

/**
 * Combobox component that supports both free text input and selection from options
 * Used for oil model and viscosity fields with previous values as suggestions
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select or type...",
  className,
  allowCustom = true,
}: ComboboxProps) {
  const [open, set_open] = React.useState(false);
  const [input_value, set_input_value] = React.useState(value);

  // Update input value when external value changes
  React.useEffect(() => {
    set_input_value(value);
  }, [value]);

  // Filter options based on input
  const filtered_options = React.useMemo(() => {
    if (!input_value) return options;

    return options.filter((option) =>
      option.toLowerCase().includes(input_value.toLowerCase())
    );
  }, [input_value, options]);

  /**
   * Handle option selection
   * Updates both the input value and the actual value
   */
  function handle_select(option: string) {
    set_input_value(option);
    onChange(option);
    set_open(false);
  }

  /**
   * Handle input change
   * Allows free typing when allowCustom is true
   */
  function handle_input_change(new_value: string) {
    set_input_value(new_value);
    if (allowCustom) {
      onChange(new_value);
    }
  }

  /**
   * Clear the selection
   */
  function handle_clear() {
    set_input_value("");
    onChange("");
    set_open(false);
  }

  return (
    <Popover open={open} onOpenChange={set_open}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handle_clear();
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={input_value}
            onValueChange={handle_input_change}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filtered_options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handle_select(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
