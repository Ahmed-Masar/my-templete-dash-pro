"use client";

import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchAllMainCategories,
    assignHomeCategories,
    Category,
} from "@/store/slices/categoriesSlice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, X, Plus, Search, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { fromLang } from "@/components/ui/localized-input";

function t(val: any): string {
    return fromLang(val);
}

const CIRCLE_COLORS = ["#E8F4FD", "#FDF0E8", "#F0F8E8", "#F8E8F4", "#E8F8F4", "#F4F0E8"];

interface CategorySectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CategorySectionDialog({ open, onOpenChange }: CategorySectionDialogProps) {
    const dispatch = useAppDispatch();
    const allCategories = useAppSelector((state) => state.categories.allMainCategories);

    const [sectionItems, setSectionItems] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const syncedRef = useRef(false);

    useEffect(() => {
        if (!open) {
            syncedRef.current = false;
            return;
        }
        dispatch(fetchAllMainCategories());
    }, [open, dispatch]);

    useEffect(() => {
        if (!open || syncedRef.current) return;
        if (allCategories.length === 0) return;
        syncedRef.current = true;
        const assigned = [...allCategories]
            .filter((c) => c.isHomeCategory)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setSectionItems(assigned);
        setSearchTerm("");
    }, [open, allCategories]);

    const available = allCategories.filter(
        (c) =>
            !sectionItems.find((s) => s._id === c._id) &&
            t(c.title).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = (cat: Category) => {
        setSectionItems((prev) => [...prev, cat]);
        setSearchTerm("");
    };

    const handleRemove = (id: string) => {
        setSectionItems((prev) => prev.filter((c) => c._id !== id));
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
            const reordered = [...sectionItems];
            const [moved] = reordered.splice(draggedIndex, 1);
            reordered.splice(overIndex, 0, moved);
            setSectionItems(reordered);
        }
        setDraggedIndex(null);
        setOverIndex(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const items = sectionItems.map((c, index) => ({ id: c._id, order: index + 1, isHomeCategory: true }));
            await dispatch(assignHomeCategories(items)).unwrap();
            toast.success("Categories updated");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error || "Failed to save categories");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col p-0" side="right">
                <SheetHeader className="px-6 py-4 border-b shrink-0">
                    <SheetTitle className="text-base font-semibold">
                        Edit Section —{" "}
                        <span className="text-primary font-normal">Categories</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {sectionItems.length > 0 && (
                        <div className="rounded-xl border bg-white dark:bg-zinc-950 px-3 py-4 overflow-x-auto">
                            <p className="text-[10px] text-muted-foreground mb-3 font-medium uppercase tracking-wide">Preview</p>
                            <div className="flex gap-4" style={{ width: "max-content" }}>
                                {sectionItems.map((cat, i) => (
                                    <div key={cat._id} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: "60px" }}>
                                        <div
                                            className="flex items-center justify-center overflow-hidden shrink-0"
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "50%",
                                                background: CIRCLE_COLORS[i % CIRCLE_COLORS.length],
                                            }}
                                        >
                                            {cat.image ? (
                                                <img src={cat.image} className="w-full h-full object-cover rounded-full" alt="" />
                                            ) : (
                                                <Tag className="h-5 w-5 text-muted-foreground/50" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-center font-medium leading-tight" style={{ color: "#4A5763", maxWidth: "60px" }} dir="rtl">
                                            {t(cat.title)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Categories in this section</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {sectionItems.length} categor{sectionItems.length !== 1 ? "ies" : "y"}
                            </span>
                        </div>

                        {sectionItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 flex flex-col items-center justify-center gap-2">
                                <Tag className="h-6 w-6 text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground">No categories assigned. Search below to add.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {sectionItems.map((cat, index) => (
                                    <div
                                        key={cat._id}
                                        draggable
                                        onDragStart={() => setDraggedIndex(index)}
                                        onDragEnter={() => setOverIndex(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDragEnd={handleDragEnd}
                                        className={[
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card transition-all duration-150 select-none",
                                            draggedIndex === index ? "opacity-40 scale-[0.98]" : "",
                                            overIndex === index && draggedIndex !== index
                                                ? "border-primary border-dashed bg-primary/5 scale-[1.01] shadow-sm"
                                                : "border-border/60 hover:border-border",
                                        ].join(" ")}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0" />
                                        <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 text-center shrink-0">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <div
                                            className="flex items-center justify-center overflow-hidden shrink-0"
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "50%",
                                                background: CIRCLE_COLORS[index % CIRCLE_COLORS.length],
                                            }}
                                        >
                                            {cat.image ? (
                                                <img src={cat.image} className="w-full h-full object-cover rounded-full" alt="" />
                                            ) : (
                                                <Tag className="h-3.5 w-3.5 text-muted-foreground/50" />
                                            )}
                                        </div>
                                        <span className="flex-1 text-sm font-medium truncate">{t(cat.title)}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(cat._id)}
                                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border/60" />

                    <div className="space-y-3">
                        <span className="text-sm font-semibold">Add categories</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        {searchTerm && (
                            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-card p-1">
                                {available.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No categories found</p>
                                ) : (
                                    available.slice(0, 20).map((cat, i) => (
                                        <button
                                            key={cat._id}
                                            type="button"
                                            onClick={() => handleAdd(cat)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                                        >
                                            <div
                                                className="flex items-center justify-center overflow-hidden shrink-0"
                                                style={{
                                                    width: "30px",
                                                    height: "30px",
                                                    borderRadius: "50%",
                                                    background: CIRCLE_COLORS[i % CIRCLE_COLORS.length],
                                                }}
                                            >
                                                {cat.image ? (
                                                    <img src={cat.image} className="w-full h-full object-cover rounded-full" alt="" />
                                                ) : (
                                                    <Tag className="h-3 w-3 text-muted-foreground/50" />
                                                )}
                                            </div>
                                            <span className="flex-1 text-sm truncate">{t(cat.title)}</span>
                                            <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t shrink-0 flex flex-row gap-2 justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? "Saving..." : "Save Section"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
