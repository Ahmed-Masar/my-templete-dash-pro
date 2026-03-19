"use client";

import * as React from "react";
import { TickCircle as Check, ArrowSwapVertical as ChevronsUpDown } from "iconsax-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type UserPickerUser = {
  _id: string;
  name?: string | null;
  phone?: string | number | null;
  role?: string | null;
};

function displayUser(u: UserPickerUser): { label: string; searchValue: string; meta?: string } {
  const name = (u.name ?? "").trim();
  const phone = u.phone == null ? "" : String(u.phone).trim();
  const metaParts = [phone, (u.role ?? "").trim()].filter(Boolean);
  const meta = metaParts.join(" • ");

  if (name) {
    return {
      label: meta ? `${name} (${meta})` : name,
      searchValue: `${name} ${phone} ${u.role ?? ""}`.trim(),
      meta,
    };
  }

  if (phone) {
    return {
      label: meta ? `${phone} (${meta})` : phone,
      searchValue: `${phone} ${u.role ?? ""}`.trim(),
      meta,
    };
  }

  return { label: u._id, searchValue: u._id };
}

export function UserPicker({
  value,
  onChange,
  users,
  placeholder = "Select user...",
  emptyText = "No users found.",
  searchPlaceholder = "Search users...",
}: {
  value: string;
  onChange: (id: string) => void;
  users: UserPickerUser[];
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => users.find((u) => u._id === value) ?? null, [users, value]);
  const selectedLabel = selected ? displayUser(selected).label : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selectedLabel : placeholder}</span>
          <ChevronsUpDown color="currentColor" size="16" className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {users.map((u) => {
                const d = displayUser(u);
                return (
                  <CommandItem
                    key={u._id}
                    value={d.searchValue}
                    onSelect={() => {
                      onChange(u._id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      color="currentColor"
                      size="18"
                      className={cn(
                        "mr-2 shrink-0",
                        value === u._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{d.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

