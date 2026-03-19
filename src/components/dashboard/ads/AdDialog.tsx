"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createAd, updateAd } from "@/store/slices/adsSlice";
import { fetchProducts } from "@/store/slices/productsSlice";
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Refresh as Loader2, HambergerMenu as GripVertical, TickCircle as Check, ArrowSwapVertical as ChevronsUpDown } from "iconsax-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { ImageUpload } from "@/components/ui/image-upload";
import { SECTION_LABELS } from "@/components/dashboard/home/SectionsList";
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
import { LocalizedInput, LangValue, toLang, emptyLang, fromLang } from "@/components/ui/localized-input";

function t(val: any): string { return fromLang(val); }


const AD_TYPES = [
    "fullWidthSliderBannerWithLogo",
    "fullWidthBanner",
    "bannerContainedRoundedGrid",
    "verticalBannerCards",
    "bannerContainedRoundedStatic2Cta",
    "bannerVisualStaticRounded",
    "bannerVisualStaticRoundedCta",
    "bannerVisualSliderRounded",
    "bannerVisualStatic",
    "bannerVisualSlider",
    "announcementBar",
] as const;


type TypeConfig = {
    mainBgImage?: true;
    mainImage?: true;
    logo?: true;
    title?: true;
    description?: true;
    cta?: true;
    ctaSecondary?: true;
    color?: true;
    singleLink?: true;
    extraLinks?: 2 | 3;
    gridImages?: 2 | 3;
    gridImageLabels?: string[];
};

const TYPE_CONFIG: Record<string, TypeConfig> = {
    fullWidthSliderBannerWithLogo: {
        mainBgImage: true, logo: true,
        title: true, description: true, cta: true,
        color: true, singleLink: true,
    },
    fullWidthBanner: {
        mainBgImage: true,
        title: true, description: true, cta: true,
        color: true, singleLink: true,
    },
    bannerContainedRoundedGrid: {
        mainImage: true,
        gridImages: 2,
        gridImageLabels: ["Bottom Left Image", "Bottom Right Image"],
        title: true, description: true, cta: true,
        color: true, extraLinks: 3,
    },
    verticalBannerCards: {
        gridImages: 3,
        gridImageLabels: ["Card 1 Image", "Card 2 Image", "Card 3 Image"],
        title: true, description: true, cta: true,
        color: true, extraLinks: 3,
    },
    bannerContainedRoundedStatic2Cta: {
        mainBgImage: true,
        title: true, description: true,
        cta: true, ctaSecondary: true,
        color: true, extraLinks: 2,
    },
    bannerVisualStaticRounded: {
        mainBgImage: true,
        title: true, description: true, cta: true,
        color: true, singleLink: true,
    },
    bannerVisualStaticRoundedCta: {
        mainBgImage: true,
        title: true, description: true, cta: true,
        color: true, singleLink: true,
    },
    bannerVisualSliderRounded: {
        gridImages: 3,
        gridImageLabels: ["Slide 1 Image", "Slide 2 Image", "Slide 3 Image"],
        title: true, description: true, cta: true,
        color: true, extraLinks: 3,
    },
    bannerVisualStatic: {
        mainBgImage: true,
        title: true, description: true,
        color: true, singleLink: true,
    },
    bannerVisualSlider: {
        gridImages: 3,
        gridImageLabels: ["Slide 1 Image", "Slide 2 Image", "Slide 3 Image"],
        title: true, description: true, cta: true,
        color: true, extraLinks: 3,
    },
    announcementBar: {
        title: true,
        color: true, singleLink: true,
    },
};


const multiLang = () =>
    z.object({ ar: z.string().default(""), en: z.string().default(""), ch: z.string().default(""), tr: z.string().default(""), ku: z.string().default("") })
     .default({ ar: "", en: "", ch: "", tr: "", ku: "" });

const adFormSchema = z.object({
    adType: z.enum(AD_TYPES),
    titleText: multiLang(),
    color: z.string().optional(),
    descriptionText: multiLang(),
    descriptionVisibility: z.boolean().default(true),
    ctaBtnText: multiLang(),
    ctaVisibility: z.boolean().default(true),
    CtaText: multiLang(),
    mainBackgroundImage: z.string().optional(),
    mainImage: z.string().optional(),
    logo: z.string().optional(),
    logoDescription: multiLang(),
    logoVisibility: z.boolean().default(true),
    adTitleImageOverlay: multiLang(),
    adDescriptionImageOverlay: multiLang(),
    imageBackgroundTop01: z.string().optional(),
    imageBackgroundTop02: z.string().optional(),
    imageBackgroundTop03: z.string().optional(),
    imageBackgroundBottom01: z.string().optional(),
    imageBackgroundBottom02: z.string().optional(),
    imageBackgroundBottom03: z.string().optional(),
    clickAction: z.enum(["clickable", "none"]).default("none"),
    linkType: z.enum(["internal", "external"]).default("external"),
    link: z.string().optional(),
    link1: z.string().optional(),
    link1Type: z.enum(["internal", "external"]).default("external"),
    link2: z.string().optional(),
    link2Type: z.enum(["internal", "external"]).default("external"),
    link3: z.string().optional(),
    link3Type: z.enum(["internal", "external"]).default("external"),
    order: z.coerce.number().default(0),
    active: z.boolean().default(true),
});

type AdFormValues = z.infer<typeof adFormSchema>;

const DEFAULT_VALUES: AdFormValues = {
    adType: "fullWidthBanner",
    active: true,
    descriptionVisibility: true,
    ctaVisibility: true,
    logoVisibility: true,
    clickAction: "none",
    linkType: "external",
    link1Type: "external",
    link2Type: "external",
    link3Type: "external",
    order: 0,
    titleText: emptyLang(),
    color: "",
    descriptionText: emptyLang(),
    ctaBtnText: emptyLang(),
    CtaText: emptyLang(),
    mainBackgroundImage: "",
    mainImage: "",
    logo: "",
    logoDescription: emptyLang(),
    adTitleImageOverlay: emptyLang(),
    adDescriptionImageOverlay: emptyLang(),
    imageBackgroundTop01: "",
    imageBackgroundTop02: "",
    imageBackgroundTop03: "",
    imageBackgroundBottom01: "",
    imageBackgroundBottom02: "",
    imageBackgroundBottom03: "",
    link: "",
    link1: "",
    link2: "",
    link3: "",
};


interface AdDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adToEdit: any;
    defaultAdType?: string;
}

export function AdDialog({ open, onOpenChange, adToEdit, defaultAdType }: AdDialogProps) {
    const dispatch = useAppDispatch();
    const [submitting, setSubmitting] = useState(false);
    const [localIds, setLocalIds] = useState<string[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const allAds = useAppSelector((state) => state.ads.ads);
    const products = useAppSelector((state) => state.products.products);

    const form = useForm<AdFormValues>({
        resolver: zodResolver(adFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const adType = useWatch({ control: form.control, name: "adType" });
    const titleText = useWatch({ control: form.control, name: "titleText" });
    const cfg: TypeConfig = TYPE_CONFIG[adType] ?? {};

    useEffect(() => {
        if (open && products.length === 0) {
            dispatch(fetchProducts({ limit: 500 }));
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (open) {
            if (adToEdit) {
                form.reset({
                    ...adToEdit,
                    titleText: toLang(adToEdit.titleText),
                    descriptionText: toLang(adToEdit.descriptionText),
                    ctaBtnText: toLang(adToEdit.ctaBtnText),
                    CtaText: toLang(adToEdit.CtaText),
                    logoDescription: toLang(adToEdit.logoDescription),
                    adTitleImageOverlay: toLang(adToEdit.adTitleImageOverlay),
                    adDescriptionImageOverlay: toLang(adToEdit.adDescriptionImageOverlay),
                });
            } else {
                form.reset(defaultAdType
                    ? { ...DEFAULT_VALUES, adType: defaultAdType as any }
                    : DEFAULT_VALUES);
            }
        }
    }, [open, adToEdit, defaultAdType, form]);

    useEffect(() => {
        if (!open) return;
        const sorted = allAds
            .filter((a) => a.adType === adType)
            .sort((a, b) => a.order - b.order)
            .map((a) => a._id);
        if (adToEdit) {
            setLocalIds(sorted);
        } else {
            setLocalIds([...sorted, "__new__"]);
        }
    }, [open, adType]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDragEnd = () => {
        if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
            const next = [...localIds];
            const [moved] = next.splice(draggedIndex, 1);
            next.splice(overIndex, 0, moved);
            setLocalIds(next);
        }
        setDraggedIndex(null);
        setOverIndex(null);
    };

    const onSubmit = async (values: AdFormValues) => {
        setSubmitting(true);
        try {
            let resolvedId: string;

            if (adToEdit) {
                await dispatch(updateAd({ id: adToEdit._id, data: values })).unwrap();
                resolvedId = adToEdit._id;
                toast.success("Advertisement updated successfully");
            } else {
                const newAd = await dispatch(createAd({ ...values, order: 0 })).unwrap();
                resolvedId = newAd._id;
                toast.success("Advertisement created successfully");
            }

            const finalIds = localIds.map((id) => (id === "__new__" ? resolvedId : id));
            if (finalIds.length > 0) {
                await Promise.all(
                    finalIds.map((id, index) =>
                        dispatch(updateAd({ id, data: { order: index + 1 } })).unwrap()
                    )
                );
            }

            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.message ?? "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const gridImageKeys = ["imageBackgroundTop01", "imageBackgroundTop02", "imageBackgroundTop03"] as const;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">

                <SheetHeader className="px-6 py-5 border-b shrink-0">
                    <SheetTitle className="text-xl font-bold">
                        {adToEdit ? "Edit Advertisement" : "New Advertisement"}
                    </SheetTitle>
                    <SheetDescription>
                        Fields shown below depend on the selected ad type.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                            <FormField
                                control={form.control}
                                name="adType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ad Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {AD_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {(SECTION_LABELS as any)[type] ?? type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Determines which home screen section this ad appears in.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(cfg.mainBgImage || cfg.mainImage || cfg.logo || cfg.gridImages) && (
                                <Section title="Images">
                                    {cfg.mainBgImage && (
                                        <ImageField form={form} name="mainBackgroundImage" label="Background Image" />
                                    )}
                                    {cfg.mainImage && (
                                        <ImageField form={form} name="mainImage" label="Main Image" />
                                    )}
                                    {cfg.logo && (
                                        <ImageField form={form} name="logo" label="Logo" />
                                    )}
                                    {cfg.gridImages && gridImageKeys.slice(0, cfg.gridImages).map((key, i) => (
                                        <ImageField
                                            key={key}
                                            form={form}
                                            name={key}
                                            label={cfg.gridImageLabels?.[i] ?? `Image ${i + 1}`}
                                        />
                                    ))}
                                </Section>
                            )}

                            {(cfg.title || cfg.description || cfg.cta || cfg.logo) && (
                                <Section title="Content">
                                    {cfg.title && (
                                        <FormField
                                            control={form.control}
                                            name="titleText"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Title</FormLabel>
                                                    <FormControl>
                                                        <LocalizedInput
                                                            value={field.value as LangValue}
                                                            onChange={field.onChange}
                                                            placeholder="e.g. Summer Sale 50% Off"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    {cfg.description && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="descriptionText"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <LocalizedInput
                                                                value={field.value as LangValue}
                                                                onChange={field.onChange}
                                                                placeholder="Ad description..."
                                                                multiline
                                                                rows={3}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="descriptionVisibility"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                        <div>
                                                            <FormLabel>Description Visibility</FormLabel>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Show description text on the banner</p>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}
                                    {cfg.cta && (
                                        <>
                                            <div className="space-y-3">
                                                <FormField
                                                    control={form.control}
                                                    name="ctaBtnText"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                {cfg.ctaSecondary ? "Primary Button" : "CTA Button"}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <LocalizedInput
                                                                    value={field.value as LangValue}
                                                                    onChange={field.onChange}
                                                                    placeholder="Shop Now"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {cfg.ctaSecondary && (
                                                    <FormField
                                                        control={form.control}
                                                        name="CtaText"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Secondary Button</FormLabel>
                                                                <FormControl>
                                                                    <LocalizedInput
                                                                        value={field.value as LangValue}
                                                                        onChange={field.onChange}
                                                                        placeholder="Learn More"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="ctaVisibility"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                        <div>
                                                            <FormLabel>CTA Visibility</FormLabel>
                                                            <p className="text-xs text-muted-foreground mt-0.5">Show the button on the banner</p>
                                                        </div>
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}
                                    {cfg.logo && (
                                        <FormField
                                            control={form.control}
                                            name="logoDescription"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Logo Description</FormLabel>
                                                    <FormControl>
                                                        <LocalizedInput
                                                            value={field.value as LangValue}
                                                            onChange={field.onChange}
                                                            placeholder="Brand tagline..."
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </Section>
                            )}

                            {cfg.color && (
                                <Section title="Appearance">
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Background Color</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-3 items-center">
                                                        <ColorPicker
                                                            value={field.value || "#ffffff"}
                                                            onChange={field.onChange}
                                                        />
                                                        <Input
                                                            placeholder="#FF5733"
                                                            value={field.value || ""}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </Section>
                            )}

                            {(cfg.singleLink || cfg.extraLinks) && (
                                <Section title="Links">
                                    {cfg.singleLink && (
                                        <div className="space-y-3">
                                            <FormField
                                                control={form.control}
                                                name="clickAction"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Click Action</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="none">None</SelectItem>
                                                                <SelectItem value="clickable">Clickable</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {form.watch("clickAction") === "clickable" && (
                                                <>
                                                    <FormField
                                                        control={form.control}
                                                        name="linkType"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Link Type</FormLabel>
                                                                <Select onValueChange={(val) => { field.onChange(val); form.setValue("link", ""); }} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="external">External URL</SelectItem>
                                                                        <SelectItem value="internal">Internal Product</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {form.watch("linkType") === "internal" ? (
                                                        <FormField
                                                            control={form.control}
                                                            name="link"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Product</FormLabel>
                                                                    <FormControl>
                                                                        <ProductPicker
                                                                            value={field.value ?? ""}
                                                                            onChange={field.onChange}
                                                                            products={products}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <FormField
                                                            control={form.control}
                                                            name="link"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>URL</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="https://..." {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {cfg.extraLinks && (
                                        <div className="space-y-5">
                                            {(["link1", "link2", "link3"] as const).slice(0, cfg.extraLinks).map((linkKey, i) => {
                                                const typeKey = `${linkKey}Type` as "link1Type" | "link2Type" | "link3Type";
                                                const currentType = form.watch(typeKey);
                                                return (
                                                    <div key={linkKey} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium">Link {i + 1}</p>
                                                            <FormField
                                                                control={form.control}
                                                                name={typeKey}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={(val) => { field.onChange(val); form.setValue(linkKey, ""); }} value={field.value}>
                                                                        <SelectTrigger className="w-36 h-7 text-xs">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="external">External URL</SelectItem>
                                                                            <SelectItem value="internal">Internal Product</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </div>
                                                        {currentType === "internal" ? (
                                                            <FormField
                                                                control={form.control}
                                                                name={linkKey}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <ProductPicker
                                                                                value={field.value ?? ""}
                                                                                onChange={field.onChange}
                                                                                products={products}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ) : (
                                                            <FormField
                                                                control={form.control}
                                                                name={linkKey}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input placeholder="https://..." {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Section>
                            )}

                            <Section title="Settings">
                                <FormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <FormLabel>Active</FormLabel>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Show this ad in the mobile app
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </Section>

                            <Section title="Position in Section">
                                {localIds.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-3">
                                        First ad in this section
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {localIds.map((id, index) => {
                                            const isNew = id === "__new__";
                                            const isCurrent = !isNew && adToEdit?._id === id;
                                            const ad = isNew ? null : allAds.find((a) => a._id === id);
                                            const title = isNew
                                                ? (t(titleText) || (adType ? ((SECTION_LABELS as any)[adType] ?? "New Ad") : "New Ad"))
                                                : (t(ad?.titleText) || `Ad #${index + 1}`);

                                            return (
                                                <div
                                                    key={id}
                                                    draggable
                                                    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggedIndex(index); }}
                                                    onDragEnter={(e) => { e.preventDefault(); setOverIndex(index); }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDragEnd={handleDragEnd}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm select-none transition-all duration-150
                                                        ${draggedIndex === index ? "opacity-40 scale-[0.98]" : ""}
                                                        ${overIndex === index && draggedIndex !== index
                                                            ? "border-primary border-dashed bg-primary/10"
                                                            : isNew
                                                                ? "border-primary bg-primary/5 font-semibold"
                                                                : isCurrent
                                                                    ? "border-blue-400 bg-blue-50/60 dark:bg-blue-900/20 font-semibold"
                                                                    : "bg-background border-border/60"
                                                        }`}
                                                >
                                                    <GripVertical color="currentColor" size="16" className="text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />
                                                    <span className="text-[10px] font-mono text-muted-foreground w-5 text-center shrink-0">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </span>
                                                    <span className="flex-1 truncate">{title}</span>
                                                    {(isNew || isCurrent) && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                                                            isNew
                                                                ? "bg-primary/15 text-primary"
                                                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                                        }`}>
                                                            {isNew ? "New" : "Current"}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Section>

                        </div>

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
                                {submitting && <Loader2 color="currentColor" size="16" className="animate-spin mr-2" />}
                                {adToEdit ? "Save Changes" : "Create Ad"}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}


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


function ImageField({ form, name, label }: { form: any; name: string; label: string }) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
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
    );
}
