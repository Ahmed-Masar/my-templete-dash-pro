"use client";

import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchStores, assignHomeStores, Store } from "@/store/slices/storesSlice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HambergerMenu as GripVertical, Add as X, Add as Plus, SearchNormal1 as Search, Refresh as Loader2, Shop as StoreIcon } from "iconsax-react";
import { toast } from "sonner";
import { fromLang } from "@/components/ui/localized-input";

interface StoreSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function t(val: any): string {
    return fromLang(val);
}

export function StoreSectionDialog({ open, onOpenChange }: StoreSectionDialogProps) {
    const dispatch = useAppDispatch();
    const allStores = useAppSelector((state) => state.stores.stores);

    const [sectionItems, setSectionItems] = useState<Store[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    // Prevent re-sync after user starts editing
    const syncedRef = useRef(false);

    useEffect(() => {
        if (!open) {
            syncedRef.current = false;
            return;
        }
        dispatch(fetchStores({ limit: 500 }));
    }, [open, dispatch]);

    // Sync only once per dialog open — first time data arrives
    useEffect(() => {
        if (!open || syncedRef.current) return;
        if (allStores.length === 0) return;
        syncedRef.current = true;
        const assigned = [...allStores]
            .filter((s) => s.isHomeStore)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setSectionItems(assigned);
        setSearchTerm("");
    }, [open, allStores]);

    const available = allStores.filter(
        (s) =>
            !sectionItems.find((si) => si._id === s._id) &&
            t(s.title).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = (store: Store) => {
        setSectionItems((prev) => [...prev, store]);
        setSearchTerm("");
    };

    const handleRemove = (id: string) => {
        setSectionItems((prev) => prev.filter((s) => s._id !== id));
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
            const items = sectionItems.map((s, index) => ({ id: s._id, order: index + 1, isHomeStore: true }));
            await dispatch(assignHomeStores(items)).unwrap();
            toast.success("Brand logos updated");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error || "Failed to save brand logos");
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
                        <span className="text-primary font-normal">Brand Logos</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* Phone-style preview — horizontal logo strip */}
                    {sectionItems.length > 0 && (
                        <div className="rounded-xl border bg-white dark:bg-zinc-950 px-3 py-4 overflow-x-auto">
                            <p className="text-[10px] text-muted-foreground mb-3 font-medium uppercase tracking-wide">Preview</p>
                            <div className="flex gap-2.5" style={{ width: "max-content" }}>
                                {sectionItems.map((store) => (
                                    <div
                                        key={store._id}
                                        className="shrink-0 flex items-center justify-center overflow-hidden"
                                        style={{
                                            width: "76px",
                                            height: "44px",
                                            borderRadius: "10px",
                                            background: "#F8F9FA",
                                            border: "1px solid #E5E7EB",
                                        }}
                                    >
                                        {store.image ? (
                                            <img
                                                src={store.image}
                                                className="w-full h-full object-contain p-1.5"
                                                alt=""
                                            />
                                        ) : (
                                                <span
                                                    className="text-center leading-tight px-1"
                                                    style={{ fontSize: "9px", fontWeight: 700, color: "#374151", letterSpacing: "0.3px" }}
                                                >
                                                    {t(store.title)}
                                                </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned list */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Brands in this section</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {sectionItems.length} brand{sectionItems.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {sectionItems.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 flex flex-col items-center justify-center gap-2">
                                <StoreIcon color="currentColor" size="24" className="text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground">No brands assigned. Search below to add.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {sectionItems.map((store, index) => (
                                    <div
                                        key={store._id}
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
                                        <GripVertical color="currentColor" size="16" className="text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0" />
                                        <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 text-center shrink-0">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        {/* Rectangular logo thumbnail */}
                                        <div
                                            className="shrink-0 flex items-center justify-center overflow-hidden"
                                            style={{
                                                width: "56px",
                                                height: "32px",
                                                borderRadius: "8px",
                                                background: "#F8F9FA",
                                                border: "1px solid #E5E7EB",
                                            }}
                                        >
                                            {store.image ? (
                                                <img src={store.image} className="w-full h-full object-contain p-1" alt="" />
                                            ) : (
                                                <StoreIcon color="currentColor" size="14" className="text-muted-foreground/40" />
                                            )}
                                        </div>
                                            <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{t(store.title)}</p>
                                            {store.isActive !== undefined && (
                                                <p className={`text-[10px] ${store.isActive ? "text-emerald-600" : "text-orange-500"}`}>
                                                    {store.isActive ? "Active" : "Inactive"}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(store._id)}
                                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                        >
                                            <X color="currentColor" size="14" className="rotate-45" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border/60" />

                    {/* Search to add */}
                    <div className="space-y-3">
                        <span className="text-sm font-semibold">Add brands</span>
                        <div className="relative">
                            <Search color="currentColor" size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search brands..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        {searchTerm && (
                            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-card p-1">
                                {available.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No brands found</p>
                                ) : (
                                    available.slice(0, 20).map((store) => (
                                        <button
                                            key={store._id}
                                            type="button"
                                            onClick={() => handleAdd(store)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                                        >
                                            <div
                                                className="shrink-0 flex items-center justify-center overflow-hidden"
                                                style={{
                                                    width: "44px",
                                                    height: "26px",
                                                    borderRadius: "6px",
                                                    background: "#F8F9FA",
                                                    border: "1px solid #E5E7EB",
                                                }}
                                            >
                                                {store.image ? (
                                                    <img src={store.image} className="w-full h-full object-contain p-0.5" alt="" />
                                                ) : (
                                                    <StoreIcon color="currentColor" size="12" className="text-muted-foreground/40" />
                                                )}
                                            </div>
                                            <span className="flex-1 text-sm truncate">{t(store.title)}</span>
                                            <Plus color="currentColor" size="14" className="text-primary shrink-0" />
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
                        {saving && <Loader2 color="currentColor" size="16" className="animate-spin" />}
                        {saving ? "Saving..." : "Save Section"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
