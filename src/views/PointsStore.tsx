"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Gift, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { formatNumber } from "@/lib/currency";
import { formatDate } from "@/lib/formatters";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPointsItems, createPointsItem, updatePointsItem, deletePointsItem, PointsItem, fetchPurchases, markPurchaseAsUsed, Purchase } from "@/store/slices/pointsStoreSlice";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchVendors } from "@/store/slices/vendorsSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { LocalizedInput, LangValue, toLang, emptyLang, fromLang } from "@/components/ui/localized-input";

function t(val: any): string { return fromLang(val); }
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle } from "lucide-react";

const PointsStore: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items, loading: itemsLoading, total: totalItems, purchases, totalPurchases } = useAppSelector((state) => state.pointsStore);
    const { vendors } = useAppSelector((state) => state.vendors);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [purchasesPage, setPurchasesPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PointsItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("items");

    useEffect(() => {
        if (activeTab === "items") {
            dispatch(fetchPointsItems({ page: currentPage, limit: itemsPerPage }));
        } else {
            dispatch(fetchPurchases({ page: purchasesPage, limit: itemsPerPage }));
        }
    }, [dispatch, currentPage, purchasesPage, activeTab, itemsPerPage]);

    useEffect(() => {
        dispatch(fetchVendors({ limit: 1000 }));
    }, [dispatch]);

    const [itemForm, setItemForm] = useState<{
        title: LangValue;
        pointsCost: string;
        description: LangValue;
        images: string[];
        isActive: boolean;
        isVendor: boolean;
        vendorId: string;
    }>({
        title: emptyLang(),
        pointsCost: "",
        description: emptyLang(),
        images: [] as string[],
        isActive: true,
        isVendor: false,
        vendorId: "",

    });

    useEffect(() => {
        dispatch(fetchPointsItems({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);

    const handleClosePanel = () => {
        setPanelMode(null);
        setSelectedItem(null);
        setItemForm({ title: emptyLang(), pointsCost: "", description: emptyLang(), images: [], isActive: true, isVendor: false, vendorId: "" });
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setItemForm({ title: emptyLang(), pointsCost: "", description: emptyLang(), images: [], isActive: true, isVendor: false, vendorId: "" });
        setPanelMode('add');
    };

    const handleEdit = (item: PointsItem) => {
        setSelectedItem(item);

        const images: string[] = [];
        if (item.image) {
            images.push(item.image);
        }

        setItemForm({
            title: toLang(item.title),
            pointsCost: item.pointsCost ? item.pointsCost.toString() : "0",
            description: toLang(item.description),
            images: images,
            isActive: item.isActive !== undefined ? item.isActive : (item.status === 'active' || item.status === 'isActive'),
            isVendor: item.isVendor || false,
            vendorId: item.vendorId || "",
        });
        setPanelMode('edit');
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await dispatch(deletePointsItem(itemToDelete)).unwrap();
            toast({ title: "Success", description: "Item deleted successfully" });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to delete item" });
        }
    };

    const handleToggleItemStatus = async (item: PointsItem, isActive: boolean) => {
        try {
            await dispatch(updatePointsItem({ id: item._id, data: { isActive } })).unwrap();
            toast({ title: isActive ? "Item Activated" : "Item Deactivated", description: `${t(item.title)} has been ${isActive ? 'activated' : 'deactivated'} successfully.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to update item status" });
        }
    };

    const handleMarkAsUsed = async (id: string) => {
        try {
            await dispatch(markPurchaseAsUsed(id)).unwrap();
            toast({ title: "Success", description: "Purchase marked as used" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const pointsCost = parseInt(itemForm.pointsCost, 10);

        if (!itemForm.title.ar.trim() || isNaN(pointsCost)) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill all required fields (Arabic Name, Points)",
            });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            title: itemForm.title,
            pointsCost,
            description: itemForm.description,
            image: itemForm.images.length > 0 ? itemForm.images[0] : "",
            isActive: itemForm.isActive,
            isVendor: itemForm.isVendor,
            ...(itemForm.isVendor && itemForm.vendorId ? { vendorId: itemForm.vendorId } : {})
        };

        try {
            if (selectedItem) {
                await dispatch(updatePointsItem({ id: selectedItem._id, data: payload })).unwrap();
                toast({ title: "Success", description: "Item updated successfully" });
            } else {
                await dispatch(createPointsItem(payload)).unwrap();
                toast({ title: "Success", description: "Item added successfully" });
            }
            handleClosePanel();
            dispatch(fetchPointsItems({ page: currentPage, limit: itemsPerPage }));
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = items.filter(
        (item) => item && t(item.title).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;

    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const goToPrevPage = () => {
        if (hasPrev) setCurrentPage((p) => p - 1);
    };
    const goToNextPage = () => {
        if (hasNext) setCurrentPage((p) => p + 1);
    };

    const renderFormFields = (isEdit: boolean) => (
        <div className="space-y-4 mt-4">
            <ImageUpload
                label="Item Image"
                description="Upload item image. Max 5 MB · PNG, JPG, WEBP"
                value={itemForm.images}
                onChange={(urls) => setItemForm((prev) => ({ ...prev, images: urls }))}
                multiple={false}
                maxImages={1}
                maxSizeInMB={5}
            />

            <div className="space-y-2">
                <Label>Item Name *</Label>
                <LocalizedInput
                    value={itemForm.title}
                    onChange={(v) => setItemForm({ ...itemForm, title: v })}
                    placeholder="Item name..."
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <LocalizedInput
                    value={itemForm.description}
                    onChange={(v) => setItemForm({ ...itemForm, description: v })}
                    placeholder="Item detailed description..."
                    multiline
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={isEdit ? "editItemPoints" : "itemPoints"}>Points Cost *</Label>
                <NumberInput
                    id={isEdit ? "editItemPoints" : "itemPoints"}
                    value={itemForm.pointsCost}
                    onChange={(v) => setItemForm({ ...itemForm, pointsCost: v })}
                    min={0}
                    required
                    placeholder="0"
                />
            </div>

            <div className="flex flex-col gap-3 mt-4">
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors group">
                    <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">Active</p>
                        <p className="text-xs text-muted-foreground">Available for purchase</p>
                    </div>
                    <div
                        onClick={() => setItemForm({ ...itemForm, isActive: !itemForm.isActive })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${itemForm.isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${itemForm.isActive ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors group">
                    <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">Vendor Item</p>
                        <p className="text-xs text-muted-foreground">Belongs to a specific vendor</p>
                    </div>
                    <div
                        onClick={() => setItemForm({ ...itemForm, isVendor: !itemForm.isVendor })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${itemForm.isVendor ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${itemForm.isVendor ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>
            </div>

            {itemForm.isVendor && (
                <div className="space-y-2 mt-4">
                    <Label>Select Vendor *</Label>
                    <Select
                        value={itemForm.vendorId || undefined}
                        onValueChange={(v) => setItemForm({ ...itemForm, vendorId: v })}
                        required={itemForm.isVendor}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a vendor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {vendors.map(v => (
                                <SelectItem key={v._id} value={v._id}>{v.name} ({v.city})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClosePanel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update" : "Add")}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Points Store</h1>
                        <p className="text-muted-foreground">Manage rewards and redemption requests</p>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-muted/40 p-2 rounded-lg">
                    <TabsList>
                        <TabsTrigger value="items">Reward Items</TabsTrigger>
                        <TabsTrigger value="purchases">Redemption Requests</TabsTrigger>
                    </TabsList>

                    {activeTab === 'items' && (
                        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2" /> Add Reward
                        </Button>
                    )}
                </div>

                <TabsContent value="items" className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b">
                                    <TableHead className="w-[80px] font-semibold">Image</TableHead>
                                    <TableHead className="font-semibold">Item Name</TableHead>
                                    <TableHead className="font-semibold">Points Cost</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="w-[120px] font-semibold">Created Date</TableHead>
                                    <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No items found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow
                                            key={item._id}
                                            className="hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm border-b hover:border-primary/20"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <TableCell>
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={t(item.title)}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                        <Gift className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{t(item.title)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    {formatNumber(item.pointsCost)} pts
                                                </Badge>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer
                                                            ${item.status === 'active'
                                                                ? 'border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'border-orange-400/40 text-orange-600 bg-orange-50/60 hover:bg-orange-100/80 dark:bg-orange-900/20 dark:text-orange-400'
                                                            }`}>
                                                            {item.status === 'active'
                                                                ? <CheckCircle2 className="w-3 h-3" />
                                                                : <XCircle className="w-3 h-3" />
                                                            }
                                                            {item.status === 'active' ? "Active" : "Inactive"}
                                                            <ChevronDown className="w-3 h-3 opacity-60" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                        <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleItemStatus(item, true)}
                                                            className={`flex items-center gap-2 cursor-pointer ${item.status === 'active' ? 'bg-green-50/60 text-green-700 font-semibold' : ''}`}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                            <span>Active</span>
                                                            {item.status === 'active' && <span className="ml-auto text-[10px] text-green-500">✓ Current</span>}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleItemStatus(item, false)}
                                                            className={`flex items-center gap-2 cursor-pointer ${item.status !== 'active' ? 'bg-orange-50/60 text-orange-700 font-semibold' : ''}`}
                                                        >
                                                            <XCircle className="w-4 h-4 text-orange-500" />
                                                            <span>Inactive</span>
                                                            {item.status !== 'active' && <span className="ml-auto text-[10px] text-orange-500">✓ Current</span>}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="hover:bg-destructive hover:text-destructive-foreground">
                                                        <Trash2 className="w-4 h-4" />
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
                                {totalItems > 0 ? `Showing page ${currentPage} of ${totalPages}` : 'No results'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={!hasPrev || itemsLoading}>Previous</Button>
                            <span className="text-sm">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!hasNext || itemsLoading}>Next</Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="purchases" className="space-y-4">
                    <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-b">
                                    <TableHead className="font-semibold">User</TableHead>
                                    <TableHead className="font-semibold">Item</TableHead>
                                    <TableHead className="font-semibold">Cost</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeTab === 'purchases' && itemsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : purchases && purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No purchases found.</TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((purchase) => (
                                        <TableRow key={purchase._id} className="hover:bg-muted/50 border-b">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{purchase.user?.name || 'Unknown User'}</span>
                                                    <span className="text-xs text-muted-foreground">{purchase.user?.phone || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{t(purchase.item?.title) || 'Unknown Item'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    {formatNumber(purchase.pointsCost)} pts
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={purchase.used ? 'default' : 'secondary'}
                                                    className={!purchase.used ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''}
                                                >
                                                    {purchase.used ? 'USED' : 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                {!purchase.used && (
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleMarkAsUsed(purchase._id)}>
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Mark Used
                                                    </Button>
                                                )}
                                                {purchase.used && (
                                                    <div className="flex items-center justify-end text-green-600 text-sm font-medium">
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Redeemed
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-2 py-4">
                        <div className="flex items-center gap-2">
                            <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setPurchasesPage(1); }}>
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
                                {totalPurchases > 0 ? `Showing page ${purchasesPage}` : 'No results'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setPurchasesPage(p => Math.max(1, p - 1))} disabled={purchasesPage === 1 || itemsLoading}>Previous</Button>
                            <span className="text-sm">Page {purchasesPage}</span>
                            <Button variant="outline" size="sm" onClick={() => setPurchasesPage(p => p + 1)} disabled={itemsLoading || purchases.length < itemsPerPage}>Next</Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>{panelMode === 'edit' ? 'Edit Reward Item' : 'Add Reward Item'}</FormPanelTitle>
                        <FormPanelDescription>{panelMode === 'edit' ? 'Update item details' : 'Enter item details to add to points store'}</FormPanelDescription>
                    </FormPanelHeader>
                    <form onSubmit={handleSubmit}>
                        {renderFormFields(panelMode === 'edit')}
                    </form>
                </FormPanelContent>
            </FormPanel>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this item? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
};

export default PointsStore;
