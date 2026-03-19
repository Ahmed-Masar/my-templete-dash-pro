"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Ad, updateAd, deleteAd } from "@/store/slices/adsSlice";
import { AdDialog } from "@/components/dashboard/ads/AdDialog";
import { SECTION_LABELS } from "@/components/dashboard/home/SectionsList";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HambergerMenu as GripVertical, Edit2 as Pencil, Trash as Trash2, Add as Plus, Refresh as Loader2 } from "iconsax-react";
import { toast } from "sonner";
import { fromLang } from "@/components/ui/localized-input";

function t(val: any): string { return fromLang(val); }

interface AdSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adType: string | null;
}

export function AdSectionDialog({ open, onOpenChange, adType }: AdSectionDialogProps) {
    const dispatch = useAppDispatch();
    const ads = useAppSelector((state) => state.ads.ads);

    const sectionAds = adType
        ? [...ads.filter((a) => a.adType === adType)].sort((a, b) => a.order - b.order)
        : [];

    const [localIds, setLocalIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const [adDialogOpen, setAdDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);

    useEffect(() => {
        if (open) {
            setLocalIds(sectionAds.map((a) => a._id));
        }
    }, [open, adType]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAdDialogChange = (isOpen: boolean) => {
        setAdDialogOpen(isOpen);
        if (!isOpen) {
            setTimeout(() => {
                setLocalIds((prev) => {
                    const currentSet = new Set(sectionAds.map((a) => a._id));
                    const filtered = prev.filter((id) => currentSet.has(id));
                    const added = sectionAds
                        .filter((a) => !prev.includes(a._id))
                        .map((a) => a._id);
                    return [...filtered, ...added];
                });
            }, 0);
        }
    };

    const orderedAds = localIds
        .map((id) => ads.find((a) => a._id === id))
        .filter((a): a is Ad => Boolean(a));

    const isDirty = localIds.some((id, i) => sectionAds[i]?._id !== id);


    const handleDragEnd = () => {
        if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
            const newIds = [...localIds];
            const [moved] = newIds.splice(draggedIndex, 1);
            newIds.splice(overIndex, 0, moved);
            setLocalIds(newIds);
        }
        setDraggedIndex(null);
        setOverIndex(null);
    };


    const handleSaveOrder = async () => {
        setSaving(true);
        try {
            await Promise.all(
                localIds.map((id, index) =>
                    dispatch(updateAd({ id, data: { order: index + 1 } })).unwrap()
                )
            );
            toast.success("Order saved");
            onOpenChange(false);
        } catch {
            toast.error("Failed to save order");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ad: Ad) => {
        try {
            await dispatch(deleteAd(ad._id)).unwrap();
            setLocalIds((prev) => prev.filter((id) => id !== ad._id));
            toast.success("Ad deleted");
        } catch {
            toast.error("Failed to delete ad");
        }
    };

    const handleEdit = (ad: Ad) => {
        setEditingAd(ad);
        setAdDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingAd(null);
        setAdDialogOpen(true);
    };

    const label = adType ? ((SECTION_LABELS as any)[adType] ?? adType) : "";

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">

                    <SheetHeader className="px-6 py-5 border-b shrink-0">
                        <SheetTitle>{label}</SheetTitle>
                        <SheetDescription>
                            {orderedAds.length} ad{orderedAds.length !== 1 ? "s" : ""} · drag rows to reorder
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {orderedAds.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-12">
                                No ads yet. Click &ldquo;Add Ad&rdquo; to create one.
                            </p>
                        ) : (
                            orderedAds.map((ad, index) => (
                                <div
                                    key={ad._id}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = "move";
                                        setDraggedIndex(index);
                                    }}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        setOverIndex(index);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 select-none
                                        ${draggedIndex === index ? "opacity-40 scale-[0.98]" : ""}
                                        ${overIndex === index && draggedIndex !== index
                                            ? "border-primary border-dashed bg-primary/10 scale-[1.01]"
                                            : "bg-background border-border/60 hover:border-border"
                                        }`}
                                >
                                    <GripVertical color="currentColor" size="16" className="text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />

                                    <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 shrink-0 text-center">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {t(ad.titleText) || `Ad #${index + 1}`}
                                        </p>
                                    </div>

                                    <Badge
                                        variant={ad.active ? "default" : "secondary"}
                                        className="text-[10px] shrink-0"
                                    >
                                        {ad.active ? "Active" : "Inactive"}
                                    </Badge>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleEdit(ad)}
                                        title="Edit ad"
                                    >
                                        <Pencil color="currentColor" size="14" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(ad)}
                                        title="Delete ad"
                                    >
                                        <Trash2 color="currentColor" size="14" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    <SheetFooter className="px-6 py-4 border-t shrink-0 flex flex-row items-center gap-2 justify-between">
                        <Button onClick={handleAddNew} variant="outline" className="gap-1.5">
                            <Plus color="currentColor" size="16" />
                            Add Ad
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                            {isDirty && (
                                <Button onClick={handleSaveOrder} disabled={saving} className="gap-2">
                                    {saving && <Loader2 color="currentColor" size="16" className="animate-spin" />}
                                    Save Order
                                </Button>
                            )}
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AdDialog
                open={adDialogOpen}
                onOpenChange={handleAdDialogChange}
                adToEdit={editingAd}
                defaultAdType={adType ?? undefined}
            />
        </>
    );
}
