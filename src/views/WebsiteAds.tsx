"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchWebsiteAds,
    deleteWebsiteAd,
    updateWebsiteAd,
    WebsiteAd,
} from "@/store/slices/websiteAdsSlice";
import { WebsiteAdDialog } from "@/components/dashboard/website-ads/WebsiteAdDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { fetchProducts } from "@/store/slices/productsSlice";
import { 
    Add as Plus, 
    Edit2 as Edit, 
    Trash, 
    SearchNormal1 as Search, 
    Global as Globe, 
    Refresh as Loader2, 
    TickCircle as CheckCircle2, 
    CloseCircle as XCircle, 
    ArrowDown2 as ChevronDown, 
    Box as Package 
} from "iconsax-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function t(val: any): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") return val.ar ?? val.en ?? val.ch ?? val.tr ?? val.ku ?? "";
    return String(val);
}

export function WebsiteAds() {
    const dispatch = useAppDispatch();
    const { ads, loading, total } = useAppSelector((state) => state.websiteAds);
    const products = useAppSelector((state) => state.products.products);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<WebsiteAd | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchWebsiteAds({ page: currentPage, limit: itemsPerPage }));
        if (products.length === 0) dispatch(fetchProducts({ limit: 500 }));
    }, [dispatch, currentPage, itemsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

    const sorted = [...ads].sort((a, b) => a.order - b.order);

    const filteredAds = sorted.filter((ad) =>
        t(ad.title).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const handleAdd = () => {
        setSelectedAd(null);
        setDialogOpen(true);
    };

    const handleEdit = (ad: WebsiteAd) => {
        setSelectedAd(ad);
        setDialogOpen(true);
    };

    const handleDeleteClick = (ad: WebsiteAd) => {
        setSelectedAd(ad);
        setDeleteOpen(true);
    };

    const handleToggleStatus = async (ad: WebsiteAd, active: boolean) => {
        try {
            await dispatch(updateWebsiteAd({ id: ad._id, data: { active } })).unwrap();
            toast({ title: active ? "Ad activated" : "Ad deactivated" });
        } catch {
            toast({ variant: "destructive", title: "Failed to update ad status" });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAd) return;
        setDeleting(true);
        try {
            await dispatch(deleteWebsiteAd(selectedAd._id)).unwrap();
            toast({ title: "Success", description: "Ad deleted successfully" });
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete ad" });
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
            setSelectedAd(null);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Website Ads</h1>
                    <p className="text-muted-foreground">Manage website advertisements</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search color="currentColor" size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search ads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Button onClick={handleAdd} className="transition-all duration-200 hover:shadow-lg bg-primary">
                        <Plus color="currentColor" size="16" className="mr-2" />
                        <span>Add New</span>
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-10 font-semibold">#</TableHead>
                            <TableHead className="w-[80px] font-semibold">Image</TableHead>
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">Product</TableHead>
                            <TableHead className="font-semibold text-center">Status</TableHead>
                            <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 color="currentColor" size="20" className="animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredAds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No website ads found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAds.map((ad, index) => (
                                <TableRow
                                    key={ad._id}
                                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => handleEdit(ad)}
                                >
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                        {String(index + 1).padStart(2, "0")}
                                    </TableCell>
                                    <TableCell>
                                        {ad.image ? (
                                            <img
                                                src={ad.image}
                                                alt={t(ad.title)}
                                                className="w-14 h-10 rounded-lg object-cover bg-muted"
                                            />
                                        ) : (
                                            <div className="w-14 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                <Globe color="currentColor" size="20" className="text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {t(ad.title) || <span className="text-muted-foreground italic">Untitled</span>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {(() => {
                                            const product = products.find((p) => p._id === ad.productUrl);
                                            return product ? (
                                                <span className="flex items-center gap-1.5 text-sm">
                                                    <Package color="currentColor" size="14" className="text-muted-foreground shrink-0" />
                                                    <span className="truncate max-w-[200px]">{t(product.name)}</span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer
                                                    ${ad.active
                                                        ? "border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400"
                                                        : "border-orange-400/40 text-orange-600 bg-orange-50/60 hover:bg-orange-100/80 dark:bg-orange-900/20 dark:text-orange-400"
                                                    }`}
                                                >
                                                    {ad.active ? <CheckCircle2 color="currentColor" size="12" /> : <XCircle color="currentColor" size="12" />}
                                                    {ad.active ? "Active" : "Inactive"}
                                                    <ChevronDown color="currentColor" size="12" className="opacity-60" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleStatus(ad, true)}
                                                    className={`flex items-center gap-2 cursor-pointer ${ad.active ? "bg-green-50/60 text-green-700 font-semibold" : ""}`}
                                                >
                                                    <CheckCircle2 color="currentColor" size="16" className="text-green-500" />
                                                    <span>Active</span>
                                                    {ad.active && <span className="ml-auto text-[10px] text-green-500">✓ Current</span>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleStatus(ad, false)}
                                                    className={`flex items-center gap-2 cursor-pointer ${!ad.active ? "bg-orange-50/60 text-orange-700 font-semibold" : ""}`}
                                                >
                                                    <XCircle color="currentColor" size="16" className="text-orange-500" />
                                                    <span>Inactive</span>
                                                    {!ad.active && <span className="ml-auto text-[10px] text-orange-500">✓ Current</span>}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(ad)}
                                                className="hover:bg-primary hover:text-primary-foreground"
                                            >
                                                <Edit color="currentColor" size="16" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteClick(ad)}
                                                className="hover:bg-destructive hover:text-white"
                                            >
                                                <Trash color="currentColor" size="16" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2">
                    <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[110px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="25">25 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                            <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        {total > 0 ? `Showing page ${currentPage} of ${totalPages}` : "No results"}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={!hasPrev || loading}>
                        Previous
                    </Button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={!hasNext || loading}>
                        Next
                    </Button>
                </div>
            </div>

            <WebsiteAdDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                adToEdit={selectedAd}
            />

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{t(selectedAd?.title) || "this ad"}&rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
                            {deleting ? <Loader2 color="currentColor" size="16" className="animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
}
