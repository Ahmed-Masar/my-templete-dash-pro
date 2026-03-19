"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, ImageIcon, Layers, Tag, X, ChevronDown, Save } from "lucide-react";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCategories, fetchAllMainCategories, createCategory, updateCategory, deleteCategory, Category } from "@/store/slices/categoriesSlice";
import { ImageUpload } from "@/components/ui/image-upload";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/formatters";
import { LocalizedInput, LangValue, toLang, emptyLang, fromLang } from "@/components/ui/localized-input";

function t(val: any): string { return fromLang(val); }

interface CategoryFormData {
    title: LangValue;
    image: string | null;
    isHomeCategory: boolean;
    categoryType: 'main' | 'sub';
    subCategories: string[];
    parentCategory: string | null;
}

interface CategoryFormProps {
    initialData: CategoryFormData;
    isEdit: boolean;
    isSubmitting: boolean;
    loading: boolean;
    availableSubCategories: Category[];
    mainCategories: Category[];
    onSubmit: (data: CategoryFormData) => void;
    onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
    initialData,
    isEdit,
    isSubmitting,
    loading,
    availableSubCategories,
    mainCategories,
    onSubmit,
    onCancel,
}) => {
    const [form, setForm] = useState<CategoryFormData>(initialData);

    useEffect(() => {
        setForm(initialData);
    }, [initialData]);

    const images = useMemo(() => (form.image ? [form.image] : []), [form.image]);

    const handleImageChange = useCallback((urls: string[]) => {
        setForm(prev => ({ ...prev, image: urls[0] || null }));
    }, []);


    const handleTypeChange = useCallback((v: string) => {
        setForm(prev => ({ ...prev, categoryType: v as 'main' | 'sub' }));
    }, []);

    const handleHomeChange = useCallback((checked: boolean | string) => {
        setForm(prev => ({ ...prev, isHomeCategory: !!checked }));
    }, []);

    const handleSwitchToSub = useCallback(() => {
        setForm(prev => ({ ...prev, categoryType: 'sub' }));
    }, []);

    const toggleSubCategory = useCallback((subId: string) => {
        setForm(prev => {
            const isSelected = prev.subCategories.includes(subId);
            return {
                ...prev,
                subCategories: isSelected
                    ? prev.subCategories.filter(id => id !== subId)
                    : [...prev.subCategories, subId],
            };
        });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">

            {/* Image */}
            <ImageUpload
                label="Category Image"
                value={images}
                onChange={handleImageChange}
                multiple={false}
            />

            <Separator />

            {/* Title */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Category Title <span className="text-destructive">*</span></Label>
                <LocalizedInput
                    value={form.title}
                    onChange={(v) => setForm(prev => ({ ...prev, title: v }))}
                    placeholder="e.g. Electronics, Shoes..."
                    required
                />
            </div>

            {/* Type Toggle — card style */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Category Type</Label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => handleTypeChange('main')}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-150 ${form.categoryType === 'main'
                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                            : 'border-border hover:border-muted-foreground/40 text-muted-foreground hover:bg-muted/30'
                            }`}
                    >
                        <Layers className="w-5 h-5" />
                        <span className="text-xs font-semibold">Main</span>
                        <span className="text-[10px] opacity-60 leading-none">Parent level</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTypeChange('sub')}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-150 ${form.categoryType === 'sub'
                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                            : 'border-border hover:border-muted-foreground/40 text-muted-foreground hover:bg-muted/30'
                            }`}
                    >
                        <Tag className="w-5 h-5" />
                        <span className="text-xs font-semibold">Sub</span>
                        <span className="text-[10px] opacity-60 leading-none">Child level</span>
                    </button>
                </div>
            </div>

            {/* Parent Category — shown only for sub */}
            {form.categoryType === 'sub' && (
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Parent Category</Label>
                    {form.parentCategory ? (
                        (() => {
                            const parent = mainCategories.find(c => c._id === form.parentCategory);
                            return (
                                <div className="flex items-center gap-2.5 px-3 py-2 border-2 border-primary/30 bg-primary/5 rounded-xl">
                                    {parent?.image && (
                                        <img src={parent.image} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                                    )}
                                    <span className="text-sm font-semibold flex-1 text-foreground">{t(parent?.title) || '—'}</span>
                                    <button
                                        type="button"
                                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        onClick={() => setForm(prev => ({ ...prev, parentCategory: null }))}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })()
                    ) : (
                        <Select
                            value={form.parentCategory ?? ''}
                            onValueChange={(val) => setForm(prev => ({ ...prev, parentCategory: val }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select main category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mainCategories.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-muted-foreground">No main categories found</div>
                                ) : (
                                    mainCategories.map(c => (
                                        <SelectItem key={c._id} value={c._id}>
                                            <div className="flex items-center gap-2">
                                                {c.image && <img src={c.image} className="w-5 h-5 rounded object-cover" />}
                                                <span>{t(c.title)}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {form.categoryType === 'main' && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Sub Categories</Label>
                        {form.subCategories.length > 0 && (
                            <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                {form.subCategories.length} selected
                            </Badge>
                        )}
                    </div>

                    {availableSubCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl text-center gap-2">
                            <Tag className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No sub-categories yet</p>
                            <button
                                type="button"
                                className="text-[11px] text-primary hover:underline"
                                onClick={handleSwitchToSub}
                            >
                                Create one first
                            </button>
                        </div>
                    ) : (
                        <ScrollArea className="h-44 rounded-xl border bg-muted/5 p-2">
                            <div className="flex flex-wrap gap-2 p-1">
                                {availableSubCategories.map(sub => {
                                    const isSelected = form.subCategories.includes(sub._id);
                                    return (
                                        <button
                                            key={sub._id}
                                            type="button"
                                            onClick={() => toggleSubCategory(sub._id)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${isSelected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'bg-background border-border hover:border-primary/40 hover:bg-primary/5 text-foreground'
                                                }`}
                                        >
                                            {sub.image && <img src={sub.image} className="w-4 h-4 rounded object-cover" />}
                                            <span>{sub.title}</span>
                                            {isSelected && <X className="w-3 h-3 opacity-70" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            )}

            <Separator />

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors group">
                <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">Show on Home Screen</p>
                    <p className="text-xs text-muted-foreground">Category will appear in the discovery grid on the home screen</p>
                </div>
                <div
                    onClick={() => setForm(prev => ({ ...prev, isHomeCategory: !prev.isHomeCategory }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${form.isHomeCategory ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${form.isHomeCategory ? "translate-x-5" : "translate-x-0"}`} />
                </div>
            </label>

            <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || loading}>
                    {isSubmitting ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Save Changes" : "Create Category")}
                </Button>
            </div>
        </form>
    );
};

const Categories: React.FC = () => {
    const dispatch = useAppDispatch();
    const { categories, allMainCategories, loading, total } = useAppSelector((state) => state.categories);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subcategoriesPopoverOpen, setSubcategoriesPopoverOpen] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchCategories({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);

    useEffect(() => {
        dispatch(fetchAllMainCategories());
    }, [dispatch]);

    const availableSubCategories = useMemo(() =>
        categories.filter(c => c.categoryType === 'sub' && c._id !== selectedCategory?._id),
        [categories, selectedCategory]);

    const subToParentMap = useMemo(() => {
        const map = new Map<string, Category>();
        allMainCategories.forEach(main => {
            (main.subCategories || []).forEach((sub: any) => {
                const subId = typeof sub === 'string' ? sub : sub._id;
                if (subId) map.set(subId, main);
            });
        });
        return map;
    }, [allMainCategories]);

    const emptyForm = useMemo<CategoryFormData>(() => ({
        title: emptyLang(),
        image: null,
        isHomeCategory: false,
        categoryType: "main",
        subCategories: [],
        parentCategory: null,
    }), []);

    const [formInitialData, setFormInitialData] = useState<CategoryFormData>(emptyForm);

    const handleAdd = useCallback(() => {
        setSelectedCategory(null);
        setFormInitialData({
            title: emptyLang(),
            image: null,
            isHomeCategory: false,
            categoryType: "main",
            subCategories: [],
            parentCategory: null,
        });
        setPanelMode('add');
    }, []);

    const handleEdit = useCallback((category: Category) => {
        setSelectedCategory(category);
        setFormInitialData({
            title: toLang(category.title),
            image: category.image || null,
            isHomeCategory: category.isHomeCategory || false,
            categoryType: category.categoryType || 'main',
            subCategories: category.subCategories
                ? category.subCategories.map((c: any) => typeof c === 'string' ? c : c._id)
                : [],
            parentCategory: (category as any).parentCategory ?? null,
        });
        setPanelMode('edit');
    }, []);

    const handleClosePanel = useCallback(() => {
        setPanelMode(null);
        setSelectedCategory(null);
    }, []);

    const handleDelete = useCallback((id: string) => {
        setCategoryToDelete(id);
        setIsDeleteDialogOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await dispatch(deleteCategory(categoryToDelete)).unwrap();
            toast({ title: "Success", description: "Category deleted successfully" });
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
            dispatch(fetchCategories({ page: currentPage, limit: itemsPerPage }));
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to delete category" });
        }
    };

    const handleFormSubmit = useCallback(async (data: CategoryFormData) => {
        setIsSubmitting(true);
        try {
            if (panelMode === 'edit' && selectedCategory) {
                await dispatch(updateCategory({ id: selectedCategory._id, data })).unwrap();
                toast({ title: "Success", description: "Category updated successfully" });
            } else {
                const newCategory = await dispatch(createCategory(data)).unwrap();

                if (data.categoryType === 'sub' && data.parentCategory && newCategory?._id) {
                    const parentCategory = allMainCategories.find(c => c._id === data.parentCategory);
                    const existingSubIds = (parentCategory?.subCategories || []).map(
                        (c: any) => typeof c === 'string' ? c : c._id
                    );
                    await dispatch(updateCategory({
                        id: data.parentCategory,
                        data: { subCategories: [...existingSubIds, newCategory._id] },
                    })).unwrap();
                }

                toast({ title: "Success", description: "Category created successfully" });
            }
            setPanelMode(null);
            setSelectedCategory(null);
            dispatch(fetchCategories({ page: currentPage, limit: itemsPerPage }));
            dispatch(fetchAllMainCategories());
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, panelMode, selectedCategory, currentPage, itemsPerPage, toast, allMainCategories]);

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + categories.length;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const goToPrevPage = useCallback(() => { if (hasPrev) setCurrentPage(p => p - 1); }, [hasPrev]);
    const goToNextPage = useCallback(() => { if (hasNext) setCurrentPage(p => p + 1); }, [hasNext]);

    const isEdit = panelMode === 'edit';
    const filteredCategories = categories.filter(c => t(c.title).toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Categories</h1>
                    <p className="text-muted-foreground">Manage product categories and sub-categories</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Button onClick={handleAdd} className="transition-all duration-200 hover:shadow-lg bg-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        <span>Add New</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-10 text-center">
                                    {/* Compact actions column header as icon only */}
                                    <span className="sr-only">Actions</span>
                                    <Save className="w-4 h-4 inline-block" />
                                </TableHead>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Relationship</TableHead>
                                <TableHead>Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No categories found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((category) => (
                                    <TableRow key={category._id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleEdit(category)}>
                                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-primary"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Save className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {category.image ? (
                                                <img src={category.image} alt={t(category.title)} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center space-x-2">
                                                <span>{t(category.title)}</span>
                                                {category.isHomeCategory && <Badge variant="secondary" className="scale-75 origin-left bg-primary/10 text-primary border-none">Home</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${category.categoryType === 'main'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}>
                                                {category.categoryType === 'main' ? 'Main' : 'Sub'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {category.categoryType === 'main' ? (
                                                <Popover open={subcategoriesPopoverOpen === category._id} onOpenChange={(open) => setSubcategoriesPopoverOpen(open ? category._id : null)}>
                                                    <PopoverTrigger asChild>
                                                        <button type="button" className="flex items-center text-xs text-muted-foreground font-medium hover:text-primary cursor-pointer transition-colors text-left">
                                                            <Layers className="w-3.5 h-3.5 mr-1.5 text-primary/60" />
                                                            {category.subCategories?.length || 0} Sub-categories
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-64 p-0" align="start">
                                                        <div className="p-2 border-b bg-muted/30">
                                                            <p className="text-xs font-semibold text-foreground">Sub-categories - {t(category.title)}</p>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto p-2">
                                                            {(() => {
                                                                const mainCat = allMainCategories.find(m => m._id === category._id) || category;
                                                                const subs = mainCat.subCategories || [];
                                                                if (subs.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">No sub-categories</p>;
                                                                return (
                                                                    <ul className="space-y-1.5">
                                                                        {subs.map((sub: any) => {
                                                                            const subObj = typeof sub === 'object' ? sub : categories.find(c => c._id === sub) || allMainCategories.flatMap(m => m.subCategories || []).flat().find((s: any) => (typeof s === 'object' ? s._id : s) === sub) || { _id: sub, title: String(sub) };
                                                                            const subTitle = typeof subObj === 'object' ? t(subObj.title) : String(subObj);
                                                                            const subImg = typeof subObj === 'object' ? subObj.image : null;
                                                                            const subId = typeof subObj === 'object' ? subObj._id : sub;
                                                                            return (
                                                                                <li key={subId} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50">
                                                                                    {subImg && <img src={subImg} alt="" className="w-6 h-6 rounded object-cover" />}
                                                                                    <span className="text-xs">{subTitle || subId}</span>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                );
                                                            })()}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (() => {
                                                const parent = subToParentMap.get(category._id);
                                                return parent ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {parent.image && <img src={parent.image} className="w-5 h-5 rounded-sm object-cover" />}
                                                        <span className="text-xs font-medium text-muted-foreground">{t(parent.title)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40 italic">—</span>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(category.createdAt)}</TableCell>
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
                        <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!hasNext || loading}>Next</Button>
                    </div>
                </div>
            </div>

            <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>{isEdit ? 'Edit Category' : 'Add Category'}</FormPanelTitle>
                        <FormPanelDescription>{isEdit ? 'Update category details' : 'Create a new category'}</FormPanelDescription>
                    </FormPanelHeader>
                    <CategoryForm
                        initialData={formInitialData}
                        isEdit={isEdit}
                        isSubmitting={isSubmitting}
                        loading={loading}
                        availableSubCategories={availableSubCategories}
                        mainCategories={allMainCategories}
                        onSubmit={handleFormSubmit}
                        onCancel={handleClosePanel}
                    />
                </FormPanelContent>
            </FormPanel>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirm Delete</DialogTitle><DialogDescription>Are you sure? This action cannot be undone.</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Categories;
