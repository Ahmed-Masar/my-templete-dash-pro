"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Plus, Edit, Trash2, Search, Layers, X, Tag, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle } from "@/components/ui/form-panel";
import { formatIQD, parseFormattedNumber } from "@/lib/currency";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts, createProduct, updateProduct, deleteProduct, Product } from "@/store/slices/productsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchStores } from "@/store/slices/storesSlice";
import { fetchTags } from "@/store/slices/tagsSlice";
import { ImageUpload } from "@/components/ui/image-upload";
import { PdfUpload } from "@/components/ui/pdf-upload";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LocalizedInput, LangValue, toLang, emptyLang, fromLang } from "@/components/ui/localized-input";

const PRODUCT_TYPE_OPTIONS = [
  { value: "productsGrid", label: "Products Grid" },
  { value: "productCardInteractive3xl", label: "Product Cards (3XL)" },
  { value: "productCardStandard2xl", label: "Product Cards (2XL)" },
  { value: "categoryDiscoveryGrid", label: "Category Discovery Grid" },
  { value: "productCardGridVerticalXl", label: "Product Cards (XL)" },
  { value: "productPromotionCard", label: "Product Promotion Card" },
  { value: "productCardInteractiveM", label: "Product Cards (M)" },
  { value: "productCardInteractiveS", label: "Product Cards (S)" },
  { value: "collectionsCategories", label: "Collections/Categories" },
];


interface ProductVariant {
  color: string;
  images: string[];
  specs: string[];
}

interface ProductFormData {
  name: LangValue;
  price: string;
  jumlaaPrice: string;
  originalPrice: string;
  discount: string;
  points: string;
  category: string;
  generalDescription: LangValue;
  techSpecs: LangValue;
  specialSpecs: LangValue;
  store: string;
  tags: string[];
  pdf: string | null;
  variants: ProductVariant[];
  productType: string;
}

const EMPTY_FORM: ProductFormData = {
  name: emptyLang(), price: "", jumlaaPrice: "", originalPrice: "", discount: "",
  points: "", category: "", generalDescription: emptyLang(),
  techSpecs: emptyLang(), specialSpecs: emptyLang(), store: "", tags: [], pdf: null,
  variants: [{ color: "Default", images: [], specs: [] }], productType: "productsGrid",
};


interface ProductFormProps {
  initialData: ProductFormData;
  isEdit: boolean;
  isSubmitting: boolean;
  categories: any[];
  stores: any[];
  tags: any[];
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

function t(val: any): string { return fromLang(val); }

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel, categories, stores, tags }) => {
  const [form, setForm] = useState<ProductFormData>(JSON.parse(JSON.stringify(initialData)));
  const [isSubmitting, setIsSubmitting] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [tagSearch, setTagSearch] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  useEffect(() => {
    setForm(JSON.parse(JSON.stringify(initialData)));
  }, [initialData]);

  const set = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Product Name <span className="text-destructive">*</span></Label>
        <LocalizedInput
          value={form.name}
          onChange={(v) => set("name", v)}
          placeholder="e.g. Smart Watch"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={form.category || undefined} onValueChange={(v) => set("category", v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Category</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {t(cat.title)} {cat.categoryType === "main" ? "(Main)" : "(Sub)"}
                  </SelectItem>
                ))}
              </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <LocalizedInput
          value={form.generalDescription}
          onChange={(v) => set("generalDescription", v)}
          placeholder="Product details..."
          multiline
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Technical Specs</Label>
        <LocalizedInput
          value={form.techSpecs}
          onChange={(v) => set("techSpecs", v)}
          placeholder="Technical details..."
          multiline
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Special Specs</Label>
        <LocalizedInput
          value={form.specialSpecs}
          onChange={(v) => set("specialSpecs", v)}
          placeholder="Special features..."
          multiline
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Price</Label><CurrencyInput value={form.originalPrice} onChange={(v) => set("originalPrice", v)} /></div>
        <div className="space-y-2"><Label>Discounted Price</Label><CurrencyInput value={form.price} onChange={(v) => set("price", v)} /></div>
        <div className="space-y-2"><Label>Jumlaa Price</Label><CurrencyInput value={form.jumlaaPrice} onChange={(v) => set("jumlaaPrice", v)} /></div>
        <div className="space-y-2">
          <Label>Points</Label>
          <NumberInput value={form.points} onChange={(v) => set("points", v)} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Store</Label>
          <Select value={form.store || undefined} onValueChange={(v) => set("store", v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Store" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Store</SelectItem>
                {stores.map(s => (
                  <SelectItem key={s._id} value={s._id}>{t(s.title)}</SelectItem>
                ))}
              </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Display Style</Label>
          <Select value={form.productType || undefined} onValueChange={(v) => set("productType", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Style" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-sm">Tag</Label>
          </div>

          {(() => {
            const selectedTag = tags.find((tag: any) => form.tags.includes(tag._id));
            const filtered = tags.filter((tag: any) =>
              t(tag.title).toLowerCase().includes(tagSearch.toLowerCase())
            );
            return (
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  >
                    {selectedTag ? (
                      <span className="flex items-center gap-2">
                        {selectedTag.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: selectedTag.color }}
                          />
                        )}
                        <span className="font-medium">{t(selectedTag.title)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select a tag…</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
                  align="start"
                  sideOffset={4}
                >
                  <div className="flex items-center gap-2 px-3 border-b border-border">
                    <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      autoFocus
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="Search…"
                      className="flex-1 h-10 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {tagSearch && (
                      <button type="button" onClick={() => setTagSearch("")}>
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-52 overflow-y-auto p-1 scrollbar-thin">
                    {selectedTag && (
                      <button
                        type="button"
                        onClick={() => set("tags", [])}
                        className="flex items-center w-full gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear selection
                      </button>
                    )}

                    {filtered.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">No tags found</p>
                    ) : (
                      filtered.map((tag: any) => {
                        const isSelected = form.tags.includes(tag._id);
                        return (
                          <button
                            key={tag._id}
                            type="button"
                            onClick={() => { set("tags", isSelected ? [] : [tag._id]); setTagPopoverOpen(false); setTagSearch(""); }}
                            className={cn(
                              "flex items-center w-full gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                              isSelected
                                ? "bg-primary/8 text-foreground"
                                : "hover:bg-muted/60 text-foreground"
                            )}
                          >
                            {tag.color ? (
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-border/50"
                                style={{ backgroundColor: tag.color }}
                              />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-muted border border-border" />
                            )}
                            <span className="flex-1 text-left">{t(tag.title)}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })()}
        </div>
      </div>

      <PdfUpload
        label="PDF File"
        value={form.pdf}
        onChange={(url) => set("pdf", url)}
      />

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Variants</Label>
            <span className="text-xs text-muted-foreground">— Colors, Images &amp; Specs</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs gap-1.5"
            onClick={() => set("variants", [...form.variants, { color: "", images: [], specs: [] }])}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Variant
          </Button>
        </div>

        {form.variants.map((variant, index) => (
          <div key={index} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
              <span className="text-xs font-bold text-muted-foreground w-5 text-center select-none">
                {index + 1}
              </span>
              <div
                className="w-6 h-6 rounded-full border border-border/80 shadow-sm flex-shrink-0"
                style={{ backgroundColor: variant.color.startsWith('#') ? variant.color : 'hsl(var(--muted))' }}
              />
              <span className="text-sm font-medium flex-1 truncate">
                {variant.color || <span className="text-muted-foreground italic font-normal">Unnamed variant</span>}
              </span>
              {form.variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => set("variants", form.variants.filter((_, i) => i !== index))}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color / Variant Name</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={variant.color.startsWith('#') ? variant.color : '#000000'}
                    onChange={(hex) => {
                      const nv = [...form.variants];
                      nv[index].color = hex;
                      set("variants", nv);
                    }}
                  />
                  <Input
                    value={variant.color}
                    onChange={(e) => {
                      const nv = [...form.variants];
                      nv[index].color = e.target.value;
                      set("variants", nv);
                    }}
                    placeholder="e.g. #ff5500, Red, XL, Default"
                    className="flex-1 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Specs</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const nv = [...form.variants];
                      nv[index].specs = [...nv[index].specs, ""];
                      set("variants", nv);
                    }}
                    className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add spec
                  </button>
                </div>
                {variant.specs.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic py-1">No specs added</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {variant.specs.map((spec, si) => (
                      <div
                        key={si}
                        className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full border border-border bg-background"
                      >
                        <Input
                          value={spec}
                          onChange={(e) => {
                            const nv = [...form.variants];
                            nv[index].specs[si] = e.target.value;
                            set("variants", nv);
                          }}
                          placeholder="16A…"
                          className="border-0 bg-transparent h-auto p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                          style={{ width: `${Math.max(60, (spec.length || 6) * 8)}px` }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nv = [...form.variants];
                            nv[index].specs = nv[index].specs.filter((_, i) => i !== si);
                            set("variants", nv);
                          }}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ImageUpload
                label="Images"
                value={variant.images}
                onChange={(urls) => {
                  const nv = [...form.variants];
                  nv[index].images = urls;
                  set("variants", nv);
                }}
                multiple={true}
                maxImages={10}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

const Products: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading: productsLoading, total: totalProducts } = useAppSelector((state) => state.products);
  const { categories } = useAppSelector((state) => state.categories);
  const { stores } = useAppSelector((state) => state.stores);
  const { tags } = useAppSelector((state) => state.tags);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialData, setFormInitialData] = useState<ProductFormData>(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, limit: itemsPerPage }));
  }, [dispatch, currentPage, itemsPerPage]);

  useEffect(() => {
    dispatch(fetchCategories({ limit: 500 }));
    dispatch(fetchStores({ limit: 500 }));
    dispatch(fetchTags({ limit: 500 }));
  }, [dispatch]);

  const handleAdd = useCallback(() => {
    setSelectedProduct(null);
    setFormInitialData(JSON.parse(JSON.stringify(EMPTY_FORM)));
    setPanelMode('add');
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    const categoryItem = product.categories && product.categories.length > 0 ? product.categories[0] : null;
    let categoryId = "";
    if (categoryItem) {
      if (typeof categoryItem === 'string') categoryId = categoryItem;
      else if (categoryItem.category) categoryId = typeof categoryItem.category === 'string' ? categoryItem.category : categoryItem.category._id;
      else if ((categoryItem as any)._id) categoryId = (categoryItem as any)._id;
    }
    const storeId = product.store ? (typeof product.store === 'string' ? product.store : (product.store as any)._id) : "";
    const formVariants = product.variants && product.variants.length > 0
      ? product.variants
      : [{ color: "Default", images: [], specs: [] }];
    const tagIds = product.tags ? product.tags.map(t => typeof t === 'string' ? t : (t as any)._id) : [];

    setFormInitialData({
      name: toLang(product.name),
      price: String(product.price),
      jumlaaPrice: product.jumlaaPrice ? String(product.jumlaaPrice) : "",
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      discount: product.discount ? String(product.discount) : "",
      points: product.points ? String(product.points) : "",
      category: categoryId,
      generalDescription: toLang(product.generalDescription),
      techSpecs: toLang(product.techSpecs),
      specialSpecs: toLang(product.specialSpecs),
      store: storeId,
      tags: tagIds,
      pdf: product.pdf || null,
      variants: JSON.parse(JSON.stringify(formVariants)),
      productType: product.productType || "productsGrid",
    });
    setPanelMode('edit');
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelMode(null);
    setSelectedProduct(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await dispatch(deleteProduct(productToDelete)).unwrap();
      toast({ title: "Success", description: "Product deleted successfully" });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      dispatch(fetchProducts({ page: currentPage, limit: itemsPerPage }));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error || "Failed to delete product" });
    }
  };

  const handleFormSubmit = useCallback(async (data: ProductFormData) => {
    setIsSubmitting(true);
    if (!data.name.ar.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Arabic product name is required" });
      setIsSubmitting(false);
      return;
    }

    const payload: any = {
      name: data.name,
      price: parseFormattedNumber(data.price),
      productType: data.productType || "productsGrid",
      categories: data.category ? [data.category] : [],
      tags: data.tags || [],
      variants: data.variants.map(v => ({
        color: v.color || "Default",
        images: v.images,
        specs: v.specs
      })),
    };

    if (data.generalDescription.ar) payload.generalDescription = data.generalDescription;
    if (data.techSpecs.ar) payload.techSpecs = data.techSpecs;
    if (data.specialSpecs.ar) payload.specialSpecs = data.specialSpecs;
    if (data.pdf) payload.pdf = data.pdf;
    if (data.store) payload.store = data.store;

    if (data.jumlaaPrice) payload.jumlaaPrice = parseFormattedNumber(data.jumlaaPrice);
    if (data.originalPrice) payload.originalPrice = parseFormattedNumber(data.originalPrice);
    if (data.discount) payload.discount = parseFloat(data.discount);
    if (data.points) payload.points = parseInt(data.points);
    try {
      if (panelMode === 'edit' && selectedProduct) {
        await dispatch(updateProduct({ id: selectedProduct._id, data: payload })).unwrap();
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        await dispatch(createProduct(payload)).unwrap();
        toast({ title: "Success", description: "Product added successfully" });
      }
      setPanelMode(null);
      setSelectedProduct(null);
      dispatch(fetchProducts({ page: currentPage, limit: itemsPerPage }));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, panelMode, selectedProduct, currentPage, toast]);

  const filteredProducts = products.filter(p =>
    t(p.name).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(totalProducts / itemsPerPage) || 1;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const goToPrevPage = useCallback(() => { if (hasPrev) setCurrentPage(p => p - 1); }, [hasPrev]);
  const goToNextPage = useCallback(() => { if (hasNext) setCurrentPage(p => p + 1); }, [hasNext]);

  const getCategoryName = (p: Product) => {
    if (!p.categories || p.categories.length === 0) return "N/A";
    const cat = p.categories[0];

    // When category is stored by ID
    if (typeof cat === "string") {
      const found = categories.find((c: any) => c._id === cat);
      return found ? t(found.title) || "Unknown" : "Unknown";
    }

    // When category is a populated object with nested `category`
    if ((cat as any).category) {
      const inner = (cat as any).category;
      if (typeof inner === "object" && inner.title) return t(inner.title) || "Unknown";
      return "Unknown";
    }

    // When category itself has a `title`
    const title = (cat as any).title;
    return title ? t(title) || "Unknown" : "Unknown";
  };
  const getProductImage = (p: Product) => {
    if (p.variants && p.variants.length > 0 && p.variants[0].images?.length > 0) return p.variants[0].images[0];
    return p.image;
  };

  const isEdit = panelMode === 'edit';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
          </div>
          <Button onClick={handleAdd} className="bg-primary"><Plus className="w-4 h-4 mr-2" />Add New</Button>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Image</TableHead><TableHead>Name</TableHead>
              <TableHead>Price</TableHead><TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : filteredProducts.map(p => (
              <TableRow
                key={p._id}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleEdit(p)}
              >
                <TableCell>
                  {getProductImage(p)
                    ? <img src={getProductImage(p)} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></div>}
                </TableCell>
                <TableCell className="font-medium">{t(p.name)}</TableCell>
                <TableCell>{formatIQD(p.price)}</TableCell>
                <TableCell><Badge variant="outline">{getCategoryName(p)}</Badge></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(p)} className="mr-2"><Edit className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(p._id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">{totalProducts > 0 ? `Showing page ${currentPage} of ${totalPages}` : 'No results'}</div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={!hasPrev || productsLoading}>Previous</Button>
          <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!hasNext || productsLoading}>Next</Button>
        </div>
      </div>

      <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
        <FormPanelContent>
          <FormPanelHeader>
            <FormPanelTitle>{isEdit ? 'Edit Product' : 'Add Product'}</FormPanelTitle>
          </FormPanelHeader>
          {panelMode !== null && (
            <ProductForm
              key={`${panelMode}-${selectedProduct?._id || 'new'}`}
              initialData={formInitialData}
              isEdit={isEdit}
              isSubmitting={isSubmitting}
              categories={categories}
              stores={stores}
              tags={tags}
              onSubmit={handleFormSubmit}
              onCancel={handleClosePanel}
            />
          )}
        </FormPanelContent>
      </FormPanel>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
