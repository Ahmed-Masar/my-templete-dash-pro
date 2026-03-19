"use client";

import * as React from "react";
import { ArrowLeft2 as ChevronLeft, ArrowRight2 as ChevronRight, Calendar, Add as X, ArrowSwapVertical as ChevronsUpDown } from "iconsax-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

const YEARS_PER_PAGE = 12;

// ── Nav button shared style ───────────────────────────────────────────────────

const navBtn = cn(
  "h-7 w-7 flex items-center justify-center rounded-lg",
  "text-muted-foreground hover:text-foreground hover:bg-muted",
  "transition-all duration-150 active:scale-90",
  "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

// ── Props ────────────────────────────────────────────────────────────────────

interface LuxuryDatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function LuxuryDatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  className,
  disabled,
}: LuxuryDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"days" | "years">("days");
  const [displayMonth, setDisplayMonth] = React.useState<Date>(() => (value ? toLocal(value) : new Date()));
  const [yearPageStart, setYearPageStart] = React.useState<number>(() => {
    const y = (value ? toLocal(value) : new Date()).getFullYear();
    return Math.floor(y / YEARS_PER_PAGE) * YEARS_PER_PAGE;
  });

  const selected = value ? toLocal(value) : undefined;

  // Reset view when popover opens
  React.useEffect(() => {
    if (!open) return;
    const base = value ? toLocal(value) : new Date();
    setDisplayMonth(base);
    setYearPageStart(Math.floor(base.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE);
    setViewMode("days");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatted = selected
    ? selected.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? toISO(date) : null);
    if (date) setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleToday = () => {
    onChange(toISO(new Date()));
    setOpen(false);
  };

  const selectYear = (year: number) => {
    setDisplayMonth(new Date(year, displayMonth.getMonth(), 1));
    setViewMode("days");
  };

  // ── Custom Caption (rendered inside DayPicker) ────────────────────────────
  const Caption = React.useCallback(
    ({ displayMonth: dm }: { displayMonth: Date }) => (
      <div className="relative flex items-center justify-center h-9">
        {/* Prev month */}
        <button
          className={cn(navBtn, "absolute left-0")}
          onClick={() => setDisplayMonth(new Date(dm.getFullYear(), dm.getMonth() - 1, 1))}
        >
          <ChevronLeft color="currentColor" size="14" />
        </button>

        {/* Clickable Month + Year → flips to year grid */}
        <button
          onClick={() => {
            setYearPageStart(Math.floor(dm.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE);
            setViewMode("years");
          }}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md select-none",
            "text-[13px] font-semibold tracking-tight text-foreground",
            "hover:bg-muted transition-all duration-150",
          )}
        >
          <span>{dm.toLocaleDateString("en-US", { month: "long" })}</span>
          <span className="text-muted-foreground tabular-nums">{dm.getFullYear()}</span>
          <ChevronsUpDown color="currentColor" size="12" className="text-muted-foreground/60" />
        </button>

        {/* Next month */}
        <button
          className={cn(navBtn, "absolute right-0")}
          onClick={() => setDisplayMonth(new Date(dm.getFullYear(), dm.getMonth() + 1, 1))}
        >
          <ChevronRight color="currentColor" size="14" />
        </button>
      </div>
    ),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i);
  const todayYear = new Date().getFullYear();
  const selectedYear = selected?.getFullYear();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      {/* ── Trigger ── */}
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "group w-full flex items-center gap-2.5 h-9 px-3 rounded-lg",
            "border border-border bg-background",
            "text-sm transition-all duration-200",
            "hover:border-foreground/30",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            open && "border-foreground/40",
            className,
          )}
        >
          <Calendar
            color="currentColor"
            size="14"
            className={cn(
              "shrink-0 transition-colors duration-200",
              formatted ? "text-foreground/60" : "text-muted-foreground",
              "group-hover:text-foreground/80",
            )}
          />
          <span
            className={cn(
              "flex-1 text-left truncate transition-colors duration-200",
              formatted ? "text-foreground text-xs font-medium tracking-wide" : "text-muted-foreground text-xs",
            )}
          >
            {formatted ?? placeholder}
          </span>
          {value ? (
            <span
              role="button"
              onClick={handleClear}
              className="shrink-0 opacity-40 hover:opacity-100 text-foreground transition-opacity cursor-pointer"
            >
              <X color="currentColor" size="12" className="rotate-45" />
            </span>
          ) : (
            <ChevronRight
              color="currentColor"
              size="12"
              className={cn(
                "shrink-0 text-muted-foreground/50 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
          )}
        </button>
      </PopoverTrigger>

      {/* ── Popover panel ── */}
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "w-[280px] p-0 overflow-hidden",
          "border border-border/70 rounded-xl bg-background",
          "shadow-[0_4px_6px_-2px_hsl(var(--foreground)/0.04),0_12px_32px_-4px_hsl(var(--foreground)/0.10),0_0_0_1px_hsl(var(--border)/0.5)]",
        )}
      >
        {/* ── Year grid ── */}
        {viewMode === "years" ? (
          <div className="p-4">
            {/* Year page nav */}
            <div className="relative flex items-center justify-center h-9 mb-3">
              <button
                className={cn(navBtn, "absolute left-0")}
                onClick={() => setYearPageStart((p) => p - YEARS_PER_PAGE)}
              >
                <ChevronLeft color="currentColor" size="14" />
              </button>
              <span className="text-[13px] font-semibold tracking-tight text-foreground select-none">
                {yearPageStart} – {yearPageStart + YEARS_PER_PAGE - 1}
              </span>
              <button
                className={cn(navBtn, "absolute right-0")}
                onClick={() => setYearPageStart((p) => p + YEARS_PER_PAGE)}
              >
                <ChevronRight color="currentColor" size="14" />
              </button>
            </div>

            {/* Year buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => selectYear(year)}
                  className={cn(
                    "h-9 rounded-lg text-[13px] transition-all duration-100",
                    "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    selectedYear === year
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-foreground font-normal hover:bg-muted hover:text-foreground",
                    todayYear === year && selectedYear !== year &&
                      "ring-1 ring-inset ring-foreground/20 font-semibold",
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ── Day grid ── */
          <div className="px-3 pt-3 pb-0">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              showOutsideDays
              components={{ Caption: Caption as any }}
              classNames={{
                months: "flex flex-col",
                month: "space-y-2",
                caption: "",
                caption_label: "hidden",
                nav: "hidden",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell:
                  "w-9 text-center text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 select-none",
                row: "flex w-full mt-0.5",
                cell: "relative h-9 w-9 p-0 text-center [&:has([aria-selected])]:rounded-md",
                day: cn(
                  "h-9 w-9 p-0 rounded-lg text-[13px] font-normal",
                  "flex items-center justify-center w-full",
                  "transition-all duration-100",
                  "hover:bg-muted hover:text-foreground",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "aria-selected:opacity-100",
                ),
                day_selected:
                  "bg-foreground text-background font-semibold hover:bg-foreground hover:text-background shadow-sm",
                day_today: "font-semibold ring-1 ring-inset ring-foreground/25",
                day_outside: "text-muted-foreground/25",
                day_disabled: "text-muted-foreground/20 cursor-not-allowed",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 py-2.5 mt-1 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground tabular-nums select-none">
            {selected ? toISO(selected) : "No date selected"}
          </span>
          <button
            onClick={handleToday}
            className="text-[11px] font-medium text-foreground/60 hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
