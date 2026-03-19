"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

const LANGS = ["ar", "en", "ch", "tr", "ku"] as const;
type Lang = (typeof LANGS)[number];

const LANG_CONFIG = {
    ar: { label: "AR", dir: "rtl" as const, fullName: "Arabic"  },
    en: { label: "EN", dir: "ltr" as const, fullName: "English" },
    ch: { label: "CH", dir: "ltr" as const, fullName: "Chinese" },
    tr: { label: "TR", dir: "ltr" as const, fullName: "Turkish" },
    ku: { label: "KU", dir: "rtl" as const, fullName: "Kurdish" },
} as const;

// ── Utilities ─────────────────────────────────────────────────────────────────

export interface LangValue {
    ar: string;
    en: string;
    ch: string;
    tr: string;
    ku: string;
}

export function toLang(val: any): LangValue {
    if (!val) return emptyLang();
    if (typeof val === "string") return { ar: val, en: "", ch: "", tr: "", ku: "" };
    return { ar: val.ar ?? "", en: val.en ?? "", ch: val.ch ?? "", tr: val.tr ?? "", ku: val.ku ?? "" };
}

export function emptyLang(): LangValue {
    return { ar: "", en: "", ch: "", tr: "", ku: "" };
}

export function fromLang(val: any): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") return val.ar ?? val.en ?? val.ch ?? val.tr ?? val.ku ?? "";
    return String(val);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LocalizedInputProps {
    value: LangValue;
    onChange: (v: LangValue) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export function LocalizedInput({
    value,
    onChange,
    placeholder,
    multiline,
    rows = 3,
    required,
    disabled,
    className,
}: LocalizedInputProps) {
    const [active, setActive] = useState<Lang>("ar");
    const activeIndex = LANGS.indexOf(active);
    const cfg = LANG_CONFIG[active];
    const filledCount = LANGS.filter((l) => (value[l] ?? "").trim().length > 0).length;

    const handleChange = (text: string) => onChange({ ...value, [active]: text });

    return (
        <div
            className={cn(
                "relative border border-border/50 bg-background overflow-hidden",
                "rounded-lg transition-colors duration-300",
                "focus-within:border-foreground/25",
                disabled && "opacity-50 pointer-events-none",
                className,
            )}
        >
            {/* ── Tab strip ────────────────────────────────────── */}
            <div className="relative flex">
                {/* Sliding underline indicator */}
                <div
                    aria-hidden
                    className="absolute bottom-0 h-px bg-foreground/70 transition-all duration-300 ease-out pointer-events-none"
                    style={{
                        width: `${100 / LANGS.length}%`,
                        transform: `translateX(${activeIndex * 100}%)`,
                    }}
                />

                {LANGS.map((lang) => {
                    const isFilled = (value[lang] ?? "").trim().length > 0;
                    const isActive = active === lang;
                    const isRequired = lang === "ar" && required;

                    return (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setActive(lang)}
                            disabled={disabled}
                            className={cn(
                                "flex-1 relative flex items-center justify-center py-3.5 select-none",
                                "transition-colors duration-200",
                                isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground/40 hover:text-muted-foreground/70",
                            )}
                        >
                            {/* Language code — perfectly centered */}
                            <span className={cn(
                                "text-[10px] tracking-[0.22em] leading-none flex items-center gap-px",
                                isActive ? "font-semibold" : "font-medium",
                            )}>
                                {LANG_CONFIG[lang].label}
                                {isRequired && (
                                    <span className="text-destructive font-bold">*</span>
                                )}
                            </span>

                            {/* Filled dot — corner badge */}
                            <span className={cn(
                                "absolute top-2 right-2.5 w-[5px] h-[5px] rounded-full transition-all duration-300",
                                isFilled
                                    ? isActive ? "bg-foreground/60 scale-100" : "bg-muted-foreground/35 scale-90"
                                    : "opacity-0 scale-0",
                            )} />
                        </button>
                    );
                })}
            </div>

            {/* ── Hairline divider ─────────────────────────────── */}
            <div className="h-px bg-border/40 mx-4" />

            {/* ── Input ────────────────────────────────────────── */}
            {multiline ? (
                <textarea
                    value={value[active] ?? ""}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    required={required && active === "ar"}
                    disabled={disabled}
                    dir={cfg.dir}
                    style={{ minHeight: `${rows * 30}px` }}
                    className={cn(
                        "w-full bg-transparent px-4 py-3 text-sm resize-none block",
                        "placeholder:text-muted-foreground/25 focus:outline-none",
                        cfg.dir === "rtl" ? "text-right" : "text-left",
                    )}
                />
            ) : (
                <input
                    type="text"
                    value={value[active] ?? ""}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    required={required && active === "ar"}
                    disabled={disabled}
                    dir={cfg.dir}
                    className={cn(
                        "w-full h-10 bg-transparent px-4 text-sm block",
                        "placeholder:text-muted-foreground/25 focus:outline-none",
                        cfg.dir === "rtl" ? "text-right" : "text-left",
                    )}
                />
            )}

            {/* ── Footer ───────────────────────────────────────── */}
            <div className="h-px bg-border/30 mx-4" />
            <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/30 font-medium select-none">
                    {cfg.fullName}
                </span>
                <span className={cn(
                    "text-[9px] font-mono tracking-wider transition-colors duration-300 select-none",
                    filledCount === LANGS.length
                        ? "text-foreground/40"
                        : "text-muted-foreground/25",
                )}>
                    {filledCount > 0 ? `${filledCount} / ${LANGS.length}` : ""}
                </span>
            </div>
        </div>
    );
}
