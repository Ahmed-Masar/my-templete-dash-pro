"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { assignProductType, fetchProducts, Product } from "@/store/slices/productsSlice";
import { ProductSectionKey } from "@/store/slices/homeSlice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SECTION_LABELS } from "@/components/dashboard/home/SectionsList";
import { HambergerMenu as GripVertical, Add as X, Add as Plus, SearchNormal1 as Search, Refresh as Loader2, ShoppingBag } from "iconsax-react";
import { toast } from "sonner";

function t(val: any): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
        return val.ar ?? val.en ?? val.ch ?? val.tr ?? val.ku ?? "";
    }
    return String(val);
}

interface ProductSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sectionKey: ProductSectionKey | null;
}

export function ProductSectionDialog({ open, onOpenChange, sectionKey }: ProductSectionDialogProps) {
    const dispatch = useAppDispatch();
    const allProducts = useAppSelector((state) => state.products.products);

    const [sectionProducts, setSectionProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (open && sectionKey) {
            const assigned = [...allProducts]
                .filter((p) => p.productType === sectionKey && p.isHomeProduct === true)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
            setSectionProducts(assigned);
            setSearchTerm("");
        }
    }, [open, sectionKey, allProducts]);

    const availableProducts = allProducts.filter((p) => {
        if (sectionProducts.find((sp) => sp._id === p._id)) return false;
        if (!searchTerm) return true;
        // Search across all language values of name
        const nameValues = typeof p.name === "object" && p.name !== null
            ? Object.values(p.name as Record<string, string>)
            : [p.name as string];
        return nameValues.some((v) => String(v || "").toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const handleAddProduct = (product: Product) => {
        setSectionProducts((prev) => [...prev, product]);
        setSearchTerm("");
    };

    const handleRemoveProduct = (id: string) => {
        
        setSectionProducts((prev) => prev.filter((p) => p._id !== id));
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
            const reordered = [...sectionProducts];
            const [moved] = reordered.splice(draggedIndex, 1);
            reordered.splice(overIndex, 0, moved);
            setSectionProducts(reordered);
        }
        setDraggedIndex(null);
        setOverIndex(null);
    };

    const handleSave = async () => {
        if (!sectionKey) return;
        setSaving(true);
        try {
            const items = sectionProducts.map((p, index) => ({ id: p._id, order: index + 1, isHomeProduct: true }));
            await dispatch(assignProductType({ productType: sectionKey, items })).unwrap();
            dispatch(fetchProducts({ limit: 500 }));
            toast.success("Section updated successfully");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error || "Failed to save section");
        } finally {
            setSaving(false);
        }
    };

    if (!sectionKey) return null;

    const label = SECTION_LABELS[sectionKey];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col p-0" side="right">
                <SheetHeader className="px-6 py-4 border-b shrink-0">
                    <SheetTitle className="text-base font-semibold">
                        Edit Section —{" "}
                        <span className="text-primary font-normal">{label}</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Assigned products */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Products in this section</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {sectionProducts.length} product{sectionProducts.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {sectionProducts.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 flex flex-col items-center justify-center gap-2">
                                <ShoppingBag color="currentColor" size="24" className="text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground">No products assigned. Search below to add.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {sectionProducts.map((product, index) => {
                                    const thumb = product.variants?.[0]?.images?.[0];
                                    return (
                                        <div
                                            key={product._id}
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
                                            {thumb ? (
                                                <img src={thumb} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    <ShoppingBag color="currentColor" size="16" className="text-muted-foreground/40" />
                                                </div>
                                            )}
                                            <span className="flex-1 text-sm font-medium truncate">{t(product.name)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProduct(product._id)}
                                                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                            >
                                                <X color="currentColor" size="14" className="rotate-45" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border/60" />

                    <div className="space-y-3">
                        <span className="text-sm font-semibold">Add products</span>
                        <div className="relative">
                            <Search color="currentColor" size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        {searchTerm && (
                            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-card p-1">
                                {availableProducts.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">No products found</p>
                                ) : (
                                    availableProducts.slice(0, 20).map((product) => {
                                        const thumb = product.variants?.[0]?.images?.[0];
                                        return (
                                            <button
                                                key={product._id}
                                                type="button"
                                                onClick={() => handleAddProduct(product)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                                            >
                                                {thumb ? (
                                                    <img src={thumb} className="w-7 h-7 rounded-md object-cover shrink-0" alt="" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-md bg-muted shrink-0" />
                                                )}
                                                <span className="flex-1 text-sm truncate">{t(product.name)}</span>
                                                <Plus color="currentColor" size="14" className="text-primary shrink-0" />
                                            </button>
                                        );
                                    })
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
