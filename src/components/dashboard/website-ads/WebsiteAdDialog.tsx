"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts } from "@/store/slices/productsSlice";
import { createWebsiteAd, updateWebsiteAd, WebsiteAd } from "@/store/slices/websiteAdsSlice";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { LocalizedInput, LangValue, toLang, emptyLang } from "@/components/ui/localized-input";
import { NumberInput } from "@/components/ui/number-input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const multiLang = (required = false) =>
    z.object({
        ar: required ? z.string().min(1, "Arabic title is required") : z.string().default(""),
        en: z.string().default(""),
        ch: z.string().default(""),
        tr: z.string().default(""),
        ku: z.string().default(""),
    });

const websiteAdSchema = z.object({
    title: multiLang(true),
    image: z.string().min(1, "Image is required"),
    productUrl: z.string().min(1, "Product is required"),
    order: z.coerce.number().default(0),
    active: z.boolean().default(true),
});

type WebsiteAdFormValues = z.infer<typeof websiteAdSchema>;

const DEFAULT_VALUES = {
    title: emptyLang(),
    image: "",
    productUrl: "",
    order: 0,
    active: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface WebsiteAdDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adToEdit?: WebsiteAd | null;
}

export function WebsiteAdDialog({ open, onOpenChange, adToEdit }: WebsiteAdDialogProps) {
    const dispatch = useAppDispatch();
    const products = useAppSelector((state) => state.products.products);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<WebsiteAdFormValues>({
        resolver: zodResolver(websiteAdSchema),
        defaultValues: DEFAULT_VALUES,
    });

    useEffect(() => {
        if (open) {
            if (products.length === 0) dispatch(fetchProducts({ limit: 500 }));
            form.reset(
                adToEdit
                    ? {
                        title: toLang(adToEdit.title),
                        image: adToEdit.image ?? "",
                        productUrl: adToEdit.productUrl ?? "",
                        order: adToEdit.order ?? 0,
                        active: adToEdit.active ?? true,
                    }
                    : DEFAULT_VALUES
            );
        }
    }, [open, adToEdit, form]); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = async (values: WebsiteAdFormValues) => {
        setSubmitting(true);
        try {
            if (adToEdit) {
                await dispatch(updateWebsiteAd({ id: adToEdit._id, data: values })).unwrap();
                toast.success("Website ad updated successfully");
            } else {
                await dispatch(createWebsiteAd(values)).unwrap();
                toast.success("Website ad created successfully");
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.message ?? "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">

                <SheetHeader className="px-6 py-5 border-b shrink-0">
                    <SheetTitle className="text-xl font-bold">
                        {adToEdit ? "Edit Website Ad" : "New Website Ad"}
                    </SheetTitle>
                    <SheetDescription>
                        Manage website advertisement details including image.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                            {/* ── Image ────────────────────────────────────────── */}
                            <Section title="Image">
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ad Image <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <ImageUpload
                                                    value={field.value ? [field.value] : []}
                                                    onChange={(urls) => field.onChange(urls[0] ?? "")}
                                                    multiple={false}
                                                    aspect="video"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </Section>

                            {/* ── Content ──────────────────────────────────────── */}
                            <Section title="Content">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <LocalizedInput
                                                    value={field.value as LangValue}
                                                    onChange={field.onChange}
                                                    placeholder="e.g. Summer Sale"
                                                    required
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="productUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <ProductPicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    products={products}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </Section>

                            {/* ── Settings ─────────────────────────────────────── */}
                            <Section title="Settings">
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Order</FormLabel>
                                            <FormControl>
                                                <NumberInput
                                                    value={field.value}
                                                    onChange={(val) => field.onChange(val)}
                                                    min={0}
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <FormLabel>Active</FormLabel>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Show this ad on the website
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </Section>

                        </div>

                        {/* Footer */}
                        <SheetFooter className="px-6 py-4 border-t shrink-0 flex flex-row gap-2 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="min-w-[120px]">
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {adToEdit ? "Save Changes" : "Create Ad"}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {title}
            </p>
            {children}
            <div className="border-t pt-2" />
        </div>
    );
}

// ─── Product Picker ────────────────────────────────────────────────────────────

type ProductName = string | { en?: string; ar?: string; [key: string]: string | undefined };

interface ProductPickerProps {
    value: string;
    onChange: (id: string) => void;
    products: { _id: string; name: ProductName; image?: string }[];
}

function getProductName(name: ProductName): string {
    if (!name) return "";
    if (typeof name === "string") return name;
    return name.en ?? name.ar ?? Object.values(name).find(Boolean) ?? "";
}

function ProductPicker({ value, onChange, products }: ProductPickerProps) {
    const [open, setOpen] = useState(false);
    const selected = products.find((p) => p._id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {selected ? getProductName(selected.name) : "Select product..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                            {products.map((product) => {
                                const displayName = getProductName(product.name);
                                return (
                                    <CommandItem
                                        key={product._id}
                                        value={displayName}
                                        onSelect={() => {
                                            onChange(product._id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                value === product._id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{displayName}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
