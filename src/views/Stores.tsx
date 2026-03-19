"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
    Store as StoreIcon, Plus, Edit, Trash2, Search, MapPin, Globe,
    Facebook, Instagram, Twitter, Youtube, MessageCircle, Send, Music2,
    MessageSquare, X as XIcon, AlertTriangle, CheckCircle2, XCircle, ChevronDown
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchStores, createStore, updateStore, deleteStore, Store } from "@/store/slices/storesSlice";
import { ImageUpload } from "@/components/ui/image-upload";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedInput, LangValue, toLang, emptyLang, fromLang } from "@/components/ui/localized-input";

const SOCIAL_PLATFORMS = [
    { key: "facebook", label: "Facebook", Icon: Facebook, placeholder: "https://facebook.com/..." },
    { key: "instgram", label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/..." },
    { key: "tiktok", label: "TikTok", Icon: Music2, placeholder: "https://tiktok.com/@..." },
    { key: "youtube", label: "YouTube", Icon: Youtube, placeholder: "https://youtube.com/..." },
    { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, placeholder: "e.g. +966xxxxxxxx" },
    { key: "telegram", label: "Telegram", Icon: Send, placeholder: "https://t.me/..." },
    { key: "x", label: "X", Icon: Twitter, placeholder: "https://x.com/..." },
    { key: "messagener", label: "Messenger", Icon: MessageSquare, placeholder: "https://m.me/..." },
    { key: "map", label: "Maps", Icon: MapPin, placeholder: "https://maps.google.com/..." },
] as const;

function t(val: any): string {
    return fromLang(val);
}

const Stores: React.FC = () => {
    const dispatch = useAppDispatch();
    const { stores, loading, total } = useAppSelector((state) => state.stores);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openSocials, setOpenSocials] = useState<string[]>([]);

    const [storeForm, setStoreForm] = useState<{
        title: LangValue;
        description: LangValue;
        image: string | null;
        latitude: string;
        longitude: string;
        isActive: boolean;
        isHomeStore: boolean;
        facebook: string;
        instgram: string;
        messagener: string;
        tiktok: string;
        youtube: string;
        map: string;
        whatsapp: string;
        x: string;
        telegram: string;
    }>({
        title: emptyLang(),
        description: emptyLang(),
        image: null,
        latitude: "",
        longitude: "",
        isActive: true,
        isHomeStore: false,
        facebook: "",
        instgram: "",
        messagener: "",
        tiktok: "",
        youtube: "",
        map: "",
        whatsapp: "",
        x: "",
        telegram: "",
    });

    useEffect(() => {
        dispatch(fetchStores({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);

    const resetForm = () => {
        setStoreForm({
            title: emptyLang(),
            description: emptyLang(),
            image: null,
            latitude: "",
            longitude: "",
            isActive: true,
            isHomeStore: false,
            facebook: "",
            instgram: "",
            messagener: "",
            tiktok: "",
            youtube: "",
            map: "",
            whatsapp: "",
            x: "",
            telegram: "",
        });
        setOpenSocials([]);
    };

    const toggleSocial = (key: string) => {
        if (openSocials.includes(key)) {
            setOpenSocials((prev) => prev.filter((k) => k !== key));
            setStoreForm((prev) => ({ ...prev, [key]: "" } as typeof prev));
        } else {
            setOpenSocials((prev) => [...prev, key]);
        }
    };

    const handleClosePanel = () => {
        setPanelMode(null);
        setSelectedStore(null);
        resetForm();
    };

    const handleAdd = () => {
        setSelectedStore(null);
        resetForm();
        setPanelMode('add');
    };

    const handleEdit = (store: Store) => {
        setSelectedStore(store);
        const lat = store.location?.coordinates[1] ? String(store.location.coordinates[1]) : "";
        const lng = store.location?.coordinates[0] ? String(store.location.coordinates[0]) : "";

        setStoreForm({
            title: toLang(store.title),
            description: toLang(store.description),
            image: store.image || null,
            latitude: lat,
            longitude: lng,
            isActive: store.isActive ?? true,
            isHomeStore: store.isHomeStore ?? false,
            facebook: store.facebook || "",
            instgram: store.instgram || "",
            messagener: store.messagener || "",
            tiktok: store.tiktok || "",
            youtube: store.youtube || "",
            map: store.map || "",
            whatsapp: store.whatsapp || "",
            x: store.x || "",
            telegram: store.telegram || "",
        });

        const preFilled = SOCIAL_PLATFORMS
            .filter((p) => !!(store as unknown as Record<string, unknown>)[p.key])
            .map((p) => p.key);
        setOpenSocials(preFilled);

        setPanelMode('edit');
    };

    const handleToggleStatus = async (store: Store, isActive: boolean) => {
        try {
            await dispatch(updateStore({ id: store._id, data: { isActive } })).unwrap();
            toast({ title: isActive ? "Store Activated" : "Store Deactivated", description: `${store.title} has been ${isActive ? 'activated' : 'deactivated'} successfully.` });
        } catch (error: unknown) {
            toast({ variant: "destructive", title: "Error", description: String(error) || "Failed to update store status" });
        }
    };

    const handleDelete = (id: string) => {
        setStoreToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!storeToDelete) return;
        try {
            await dispatch(deleteStore(storeToDelete)).unwrap();
            toast({ title: "Success", description: "Store deleted successfully" });
            setIsDeleteDialogOpen(false);
            setStoreToDelete(null);
        } catch (error: unknown) {
            toast({ variant: "destructive", title: "Error", description: String(error) || "Failed to delete store" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const titleAr = storeForm.title.ar.trim();
        if (!titleAr) {
            toast({ variant: "destructive", title: "Validation Error", description: "Store name is required" });
            setIsSubmitting(false);
            return;
        }

        const lat = parseFloat(storeForm.latitude);
        const lng = parseFloat(storeForm.longitude);
        const location = (!isNaN(lat) && !isNaN(lng))
            ? { type: "Point", coordinates: [lng, lat] }
            : undefined;

        const payload: any = {
            title: storeForm.title,
            image: storeForm.image,
            location,
            isActive: storeForm.isActive,
            isHomeStore: storeForm.isHomeStore,
            facebook: storeForm.facebook,
            instgram: storeForm.instgram,
            messagener: storeForm.messagener,
            tiktok: storeForm.tiktok,
            youtube: storeForm.youtube,
            map: storeForm.map,
            whatsapp: storeForm.whatsapp,
            x: storeForm.x,
            telegram: storeForm.telegram,
        };
        if (storeForm.description.ar || storeForm.description.en || storeForm.description.ch || storeForm.description.tr || storeForm.description.ku) {
            payload.description = storeForm.description;
        }

        try {
            if (selectedStore) {
                await dispatch(updateStore({ id: selectedStore._id, data: payload })).unwrap();
                toast({ title: "Success", description: "Store updated successfully" });
            } else {
                await dispatch(createStore(payload)).unwrap();
                toast({ title: "Success", description: "Store added successfully" });
            }
            handleClosePanel();
            dispatch(fetchStores({ page: currentPage, limit: itemsPerPage }));
        } catch (error: unknown) {
            toast({ variant: "destructive", title: "Error", description: String(error) || "Operation failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStores = stores.filter((store) =>
        t(store.title).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const goToPrevPage = () => { if (hasPrev) setCurrentPage((p) => p - 1); };
    const goToNextPage = () => { if (hasNext) setCurrentPage((p) => p + 1); };

    const renderFormFields = (isEdit: boolean) => (
        <div className="space-y-6 mt-2">
            <ImageUpload
                label="Store Image"
                description="Upload store logo or storefront image. Max 5 MB · PNG, JPG, WEBP"
                value={storeForm.image ? [storeForm.image] : []}
                onChange={(urls) => setStoreForm((prev) => ({ ...prev, image: urls[0] || null }))}
                multiple={false}
                maxSizeInMB={5}
            />

            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <StoreIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Basic Information</span>
                </div>

                <div className="space-y-2">
                    <Label>
                        Store Name <span className="text-destructive">*</span>
                    </Label>
                    <LocalizedInput
                        value={storeForm.title}
                        onChange={(v) => setStoreForm({ ...storeForm, title: v })}
                        placeholder="e.g. Tech Hub Jeddah"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={isEdit ? "editStoreDesc" : "storeDesc"}>Description</Label>
                    <LocalizedInput
                        value={storeForm.description}
                        onChange={(v) => setStoreForm({ ...storeForm, description: v })}
                        placeholder="Brief description of the store..."
                        multiline
                        rows={3}
                    />
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors group">
                    <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">Active Status</p>
                        <p className="text-xs text-muted-foreground">Store will be visible to customers</p>
                    </div>
                    <div
                        onClick={() => setStoreForm({ ...storeForm, isActive: !storeForm.isActive })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${storeForm.isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${storeForm.isActive ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors group">
                    <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">Show on Home Screen</p>
                        <p className="text-xs text-muted-foreground">Store logo will appear in the home screen brand logos section</p>
                    </div>
                    <div
                        onClick={() => setStoreForm({ ...storeForm, isHomeStore: !storeForm.isHomeStore })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${storeForm.isHomeStore ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${storeForm.isHomeStore ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>
            </section>



            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Social Links</span>
                    <span className="text-xs text-muted-foreground ml-auto">Click an icon to add a link</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {SOCIAL_PLATFORMS.map(({ key, label, Icon }) => {
                        const hasValue = !!(storeForm as unknown as Record<string, unknown>)[key];
                        const isActive = openSocials.includes(key) || hasValue;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleSocial(key)}
                                title={`Add ${label} link`}
                                className={`
                                    flex flex-col items-center gap-1.5 p-3 rounded-xl border-2
                                    text-xs font-medium transition-all duration-200 select-none
                                    ${isActive
                                        ? "border-primary/30 bg-primary/8 text-primary shadow-sm"
                                        : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/40 hover:scale-105"
                                    }
                                `}
                            >
                                <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? "bg-primary shadow-sm" : "bg-muted"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                                </div>
                                <span className="truncate w-full text-center leading-tight">{label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-2">
                    {SOCIAL_PLATFORMS.map(({ key, label, Icon, placeholder }) => {
                        const isVisible = openSocials.includes(key) || !!(storeForm as unknown as Record<string, unknown>)[key];
                        return (
                            <div
                                key={key}
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary shadow-sm">
                                        <Icon className="w-4 h-4 text-primary-foreground" />
                                    </div>

                                    <Input
                                        aria-label={label}
                                        value={(storeForm as unknown as Record<string, string>)[key] || ""}
                                        onChange={(e) =>
                                            setStoreForm((prev) => ({ ...prev, [key]: e.target.value }))
                                        }
                                        placeholder={placeholder}
                                        className="flex-1 h-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm px-1"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => toggleSocial(key)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                                        title={`Remove ${label}`}
                                    >
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClosePanel}
                    className="min-w-[90px]"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[100px] bg-primary hover:bg-primary/90 shadow-md"
                >
                    {isSubmitting
                        ? (isEdit ? "Updating..." : "Adding...")
                        : (isEdit ? "Update Store" : "Add Store")}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Stores</h1>
                    <p className="text-muted-foreground">Manage partner stores and locations</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search stores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="transition-all duration-200 hover:shadow-lg hover:scale-105 bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="font-medium">Add New</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b">
                                <TableHead className="w-[80px] font-semibold">Image</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredStores.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No stores found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredStores.map((store) => (
                                    <TableRow
                                        key={store._id}
                                        className="hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm border-b hover:border-primary/20"
                                        onClick={() => handleEdit(store)}
                                    >
                                        <TableCell>
                                            {store.image ? (
                                                <img
                                                    src={store.image}
                                                    alt={t(store.title)}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <StoreIcon className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{t(store.title)}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {t(store.description) || "N/A"}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer
                                                        ${store.isActive !== false
                                                            ? 'border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'border-orange-400/40 text-orange-600 bg-orange-50/60 hover:bg-orange-100/80 dark:bg-orange-900/20 dark:text-orange-400'
                                                        }`}>
                                                        {store.isActive !== false
                                                            ? <CheckCircle2 className="w-3 h-3" />
                                                            : <XCircle className="w-3 h-3" />
                                                        }
                                                        {store.isActive !== false ? "Active" : "Inactive"}
                                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(store, true)}
                                                        className={`flex items-center gap-2 cursor-pointer ${store.isActive !== false ? 'bg-green-50/60 text-green-700 font-semibold' : ''}`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span>Active</span>
                                                        {store.isActive !== false && <span className="ml-auto text-[10px] text-green-500">✓ Current</span>}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(store, false)}
                                                        className={`flex items-center gap-2 cursor-pointer ${store.isActive === false ? 'bg-orange-50/60 text-orange-700 font-semibold' : ''}`}
                                                    >
                                                        <XCircle className="w-4 h-4 text-orange-500" />
                                                        <span>Inactive</span>
                                                        {store.isActive === false && <span className="ml-auto text-[10px] text-orange-500">✓ Current</span>}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(store); }}
                                                    className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(store._id); }}
                                                    className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
                                                >
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
                            {total > 0 ? `Showing page ${currentPage} of ${totalPages}` : "No results"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={!hasPrev || loading}>Previous</Button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!hasNext || loading}>Next</Button>
                    </div>
                </div>
            </div>

            <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>{panelMode === 'edit' ? 'Edit Store' : 'Add Store'}</FormPanelTitle>
                        <FormPanelDescription>{panelMode === 'edit' ? 'Update the store details' : 'Fill in the details for the new store'}</FormPanelDescription>
                    </FormPanelHeader>
                    <form onSubmit={handleSubmit}>
                        {renderFormFields(panelMode === 'edit')}
                    </form>
                </FormPanelContent>
            </FormPanel>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="items-center text-center pb-2">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <DialogTitle className="text-xl">Delete Store?</DialogTitle>
                        <DialogDescription className="text-center pt-1">
                            This action cannot be undone. The store and all its associated data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="w-full sm:w-auto shadow-md"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Store
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
};

export default Stores;
