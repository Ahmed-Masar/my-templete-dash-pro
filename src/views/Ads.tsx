"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAds, deleteAd, updateAd, setCurrentAd, Ad } from "@/store/slices/adsSlice";
import { AdDialog } from "@/components/dashboard/ads/AdDialog";
import { AdSectionDialog } from "@/components/dashboard/ads/AdSectionDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Pencil, Trash2, Megaphone, Loader2,
    CheckCircle2, XCircle, ChevronDown, ChevronRight, LayoutList,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { SECTION_LABELS } from "@/components/dashboard/home/SectionsList";
import { fromLang } from "@/components/ui/localized-input";

function t(val: any): string { return fromLang(val); }

export function Ads() {
    const dispatch = useAppDispatch();
    const { ads, loading } = useAppSelector((state) => state.ads);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
    const [selectedAdType, setSelectedAdType] = useState<string | null>(null);

    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        dispatch(fetchAds({ limit: 100 }));
    }, [dispatch]);

    const grouped = ads.reduce<Record<string, Ad[]>>((acc, ad) => {
        if (!acc[ad.adType]) acc[ad.adType] = [];
        acc[ad.adType].push(ad);
        return acc;
    }, {});
    Object.values(grouped).forEach((group) => group.sort((a, b) => a.order - b.order));

    const groupKeys = Object.keys(grouped).sort((a, b) =>
        ((SECTION_LABELS as any)[a] ?? a).localeCompare((SECTION_LABELS as any)[b] ?? b)
    );


    const handleAdd = () => {
        setSelectedAd(null);
        dispatch(setCurrentAd(null));
        setDialogOpen(true);
    };

    const handleEdit = (ad: Ad) => {
        setSelectedAd(ad);
        dispatch(setCurrentAd(ad));
        setDialogOpen(true);
    };

    const handleDeleteClick = (ad: Ad) => {
        setSelectedAd(ad);
        setDeleteOpen(true);
    };

    const handleToggleStatus = async (ad: Ad, active: boolean) => {
        try {
            await dispatch(updateAd({ id: ad._id, data: { active } })).unwrap();
            toast.success(active ? "Ad activated" : "Ad deactivated");
        } catch {
            toast.error("Failed to update ad status");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAd) return;
        setDeleting(true);
        try {
            await dispatch(deleteAd(selectedAd._id)).unwrap();
            toast.success("Ad deleted successfully");
        } catch {
            toast.error("Failed to delete ad");
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
            setSelectedAd(null);
        }
    };

    const handleManageOrder = (adType: string) => {
        setSelectedAdType(adType);
        setSectionDialogOpen(true);
    };

    const toggleSection = (adType: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            if (next.has(adType)) { next.delete(adType); } else { next.add(adType); }
            return next;
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 animate-in fade-in duration-500 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-bold">Advertisements</h1>
                        <p className="text-xs text-muted-foreground">
                            {ads.length} ad{ads.length !== 1 ? "s" : ""}{groupKeys.length > 0 ? ` across ${groupKeys.length} section${groupKeys.length !== 1 ? "s" : ""}` : ""}
                        </p>
                    </div>
                </div>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Advertisement
                </Button>
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : ads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Megaphone className="h-12 w-12 opacity-20" />
                    <span className="text-sm">No advertisements yet</span>
                    <Button variant="outline" size="sm" onClick={handleAdd}>Create first ad</Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {groupKeys.map((adType) => {
                        const sectionAds = grouped[adType];
                        const isCollapsed = collapsedSections.has(adType);
                        const label = (SECTION_LABELS as any)[adType] ?? adType;

                        return (
                            <div key={adType} className="rounded-xl border overflow-hidden">

                                {/* Section header */}
                                <div
                                    className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleSection(adType)}
                                >
                                    {isCollapsed
                                        ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                    }
                                    <span className="font-semibold text-sm flex-1 truncate">{label}</span>
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                        {sectionAds.length} ad{sectionAds.length !== 1 ? "s" : ""}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 h-7 text-xs shrink-0"
                                        onClick={(e) => { e.stopPropagation(); handleManageOrder(adType); }}
                                    >
                                        <LayoutList className="h-3.5 w-3.5" />
                                        Manage Order
                                    </Button>
                                </div>

                                {/* Ads table */}
                                {!isCollapsed && (
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/10 border-t border-b">
                                            <tr>
                                                <th className="text-left px-4 py-2 font-medium text-muted-foreground w-10">#</th>
                                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Title</th>
                                                <th className="text-left px-4 py-2 font-medium text-muted-foreground w-36">Status</th>
                                                <th className="px-4 py-2 w-20" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {sectionAds.map((ad, index) => (
                                                <tr
                                                    key={ad._id}
                                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                    onClick={() => handleEdit(ad)}
                                                >
                                                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        {t(ad.titleText) || <span className="text-muted-foreground italic">Untitled</span>}
                                                    </td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:shadow-md hover:scale-105 cursor-pointer
                                                                    ${ad.active
                                                                        ? "border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400"
                                                                        : "border-orange-400/40 text-orange-600 bg-orange-50/60 hover:bg-orange-100/80 dark:bg-orange-900/20 dark:text-orange-400"
                                                                    }`}
                                                                >
                                                                    {ad.active
                                                                        ? <CheckCircle2 className="w-3 h-3" />
                                                                        : <XCircle className="w-3 h-3" />
                                                                    }
                                                                    {ad.active ? "Active" : "Inactive"}
                                                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(ad, true)}
                                                                    className={`flex items-center gap-2 cursor-pointer ${ad.active ? "bg-green-50/60 text-green-700 font-semibold" : ""}`}
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                    <span>Active</span>
                                                                    {ad.active && <span className="ml-auto text-[10px] text-green-500">✓ Current</span>}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleToggleStatus(ad, false)}
                                                                    className={`flex items-center gap-2 cursor-pointer ${!ad.active ? "bg-orange-50/60 text-orange-700 font-semibold" : ""}`}
                                                                >
                                                                    <XCircle className="w-4 h-4 text-orange-500" />
                                                                    <span>Inactive</span>
                                                                    {!ad.active && <span className="ml-auto text-[10px] text-orange-500">✓ Current</span>}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(ad)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteClick(ad)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AdDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                adToEdit={selectedAd}
            />

            <AdSectionDialog
                open={sectionDialogOpen}
                onOpenChange={setSectionDialogOpen}
                adType={selectedAdType}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{t(selectedAd?.titleText) || "this ad"}&rdquo;?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
