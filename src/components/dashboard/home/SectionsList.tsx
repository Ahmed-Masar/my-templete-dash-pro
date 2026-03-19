"use client";

import { useState, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
    ArrowUp2 as ChevronUp,
    ArrowDown2 as ChevronDown,
    HambergerMenu as GripVertical,
    Add as Plus,
    Task as LayoutList,
    Edit2 as Pencil,
} from "iconsax-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    toggleSection,
    moveSection,
    reorderSection,
    ALL_SECTIONS,
    BANNER_SECTIONS,
    SectionKey,
    ProductSectionKey,
    HomeConfig,
} from "@/store/slices/homeSlice";
import { cn } from "@/lib/utils";


export const SECTION_LABELS: Record<SectionKey, string> = {
    fullWidthSliderBannerWithLogo: 'Full Width Slider + Logo',
    fullWidthBanner: 'Full Width Banner',
    bannerContainedRoundedGrid: 'Rounded Grid Banner',
    verticalBannerCards: 'Vertical Banner Cards',
    bannerContainedRoundedStatic2Cta: 'Static Banner (2 CTAs)',
    bannerVisualStaticRounded: 'Static Rounded Banner',
    bannerVisualStaticRoundedCta: 'Static Rounded + CTA',
    bannerVisualSliderRounded: 'Slider Rounded Banner',
    bannerVisualStatic: 'Static Visual Banner',
    bannerVisualSlider: 'Slider Banner',
    announcementBar: 'Announcement Bar',
    productsGrid: 'Products Grid',
    productCardInteractive3xl: 'Product Cards (3XL)',
    productCardStandard2xl: 'Product Cards (2XL)',
    categoryDiscoveryGrid: 'Category Discovery Grid',
    productCardGridVerticalXl: 'Product Cards (XL)',
    productPromotionCard: 'Product Promotion Card',
    productCardInteractiveM: 'Product Cards (M)',
    productCardInteractiveS: 'Product Cards (S)',
    logos: 'Brand Logos',
};

const BANNER_SET = new Set<string>(BANNER_SECTIONS);
const CATEGORY_SET = new Set<string>(['categoryDiscoveryGrid']);
const LOGO_SET = new Set<string>(['logos']);

type SectionType = 'banner' | 'product' | 'category' | 'logos';

function getSectionType(key: string): SectionType {
    if (BANNER_SET.has(key)) return 'banner';
    if (CATEGORY_SET.has(key)) return 'category';
    if (LOGO_SET.has(key)) return 'logos';
    return 'product';
}

const TYPE_META: Record<SectionType, { label: string; border: string; badge: string; dot: string }> = {
    banner:   { label: 'Banner',   border: 'border-l-slate-400/60',  badge: 'bg-slate-100/80 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400',  dot: 'bg-slate-400' },
    product:  { label: 'Product',  border: 'border-l-emerald-400/50',badge: 'bg-emerald-50/80 text-emerald-600/80 dark:bg-emerald-950/40 dark:text-emerald-500/80', dot: 'bg-emerald-400' },
    category: { label: 'Category', border: 'border-l-violet-400/50', badge: 'bg-violet-50/80 text-violet-500/80 dark:bg-violet-950/40 dark:text-violet-400/80', dot: 'bg-violet-400' },
    logos:    { label: 'Logos',    border: 'border-l-amber-400/50',  badge: 'bg-amber-50/80 text-amber-600/80 dark:bg-amber-950/40 dark:text-amber-400/80',  dot: 'bg-amber-400' },
};


function SectionRow({
    sectionKey,
    config,
    globalMinOrder,
    globalMaxOrder,
    adCount,
    productCount,
    categoryCount,
    logoCount,
    isDragging,
    isOver,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onEditAdSection,
    onEditProductSection,
    onEditCategories,
    onEditLogos,
}: {
    sectionKey: SectionKey;
    config: HomeConfig;
    globalMinOrder: number;
    globalMaxOrder: number;
    adCount: number;
    productCount: number;
    categoryCount: number;
    logoCount: number;
    isDragging: boolean;
    isOver: boolean;
    onDragStart: () => void;
    onDragEnter: () => void;
    onDragEnd: () => void;
    onEditAdSection?: (key: string) => void;
    onEditProductSection?: (key: ProductSectionKey) => void;
    onEditCategories?: () => void;
    onEditLogos?: () => void;
}) {
    const dispatch = useAppDispatch();
    const section = config[sectionKey] ?? { active: false, order: 0 };
    const isFirst = section.order === globalMinOrder;
    const isLast = section.order === globalMaxOrder;
    const type = getSectionType(sectionKey);
    const meta = TYPE_META[type];

    const isBanner = type === 'banner';
    const isProduct = type === 'product';
    const isCat = type === 'category';
    const isLogo = type === 'logos';

    const contentCount = isBanner ? adCount : isCat ? categoryCount : isLogo ? logoCount : productCount;
    const hasContent = contentCount > 0;

    return (
        <div
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
            onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
            className={cn(
                "group relative flex items-center gap-2.5 pl-3 pr-3 py-2.5 rounded-lg border border-l-[3px] transition-all duration-100 select-none",
                meta.border,
                isDragging && "opacity-30 scale-[0.98]",
                isOver && !isDragging
                    ? "border-foreground/40 border-dashed bg-muted/60"
                    : section.active
                        ? "bg-background border-border shadow-sm"
                        : "bg-muted/20 border-border/40",
            )}
        >
            {/* Drag handle */}
            <GripVertical color="currentColor" size="16" className="text-muted-foreground/25 group-hover:text-muted-foreground/60 shrink-0 cursor-grab active:cursor-grabbing transition-colors" />

            {/* Up / order / Down */}
            <div className="flex flex-col items-center shrink-0 gap-0">
                <Button
                    variant="ghost" size="icon"
                    className="h-4 w-4 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    disabled={isFirst}
                    onClick={() => dispatch(moveSection({ key: sectionKey, direction: 'up' }))}
                >
                    <ChevronUp color="currentColor" size="10" />
                </Button>
                <span className="text-[9px] font-mono text-muted-foreground/40 tabular-nums leading-none">
                    {String(section.order).padStart(2, '0')}
                </span>
                <Button
                    variant="ghost" size="icon"
                    className="h-4 w-4 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    disabled={isLast}
                    onClick={() => dispatch(moveSection({ key: sectionKey, direction: 'down' }))}
                >
                    <ChevronDown color="currentColor" size="10" />
                </Button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                {/* Badge on its own line, name below */}
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm", meta.badge)}>
                    {meta.label}
                </span>
                <p className={cn(
                    "text-[12.5px] font-medium truncate mt-0.5",
                    section.active ? "text-foreground" : "text-muted-foreground"
                )}>
                    {SECTION_LABELS[sectionKey]}
                </p>

                {/* Manage button */}
                <div className="mt-1.5">
                    {isBanner && onEditAdSection && (
                        <button
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-border bg-muted/60 text-muted-foreground shadow-sm transition-all duration-100 cursor-pointer hover:bg-muted hover:text-foreground hover:border-foreground/30 active:scale-95 active:shadow-none"
                            onClick={(e) => { e.stopPropagation(); onEditAdSection(sectionKey); }}>
                            {hasContent
                                ? <><LayoutList color="currentColor" size="12" />{contentCount} ad{contentCount !== 1 ? 's' : ''}<Pencil color="currentColor" size="10" className="ml-0.5 opacity-60" /></>
                                : <><Plus color="currentColor" size="12" />Add ads</>}
                        </button>
                    )}
                    {isCat && onEditCategories && (
                        <button
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-border bg-muted/60 text-muted-foreground shadow-sm transition-all duration-100 cursor-pointer hover:bg-muted hover:text-foreground hover:border-foreground/30 active:scale-95 active:shadow-none"
                            onClick={(e) => { e.stopPropagation(); onEditCategories(); }}>
                            {hasContent
                                ? <><LayoutList color="currentColor" size="12" />{contentCount} categor{contentCount !== 1 ? 'ies' : 'y'}<Pencil color="currentColor" size="10" className="ml-0.5 opacity-60" /></>
                                : <><Plus color="currentColor" size="12" />Add categories</>}
                        </button>
                    )}
                    {isLogo && onEditLogos && (
                        <button
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-border bg-muted/60 text-muted-foreground shadow-sm transition-all duration-100 cursor-pointer hover:bg-muted hover:text-foreground hover:border-foreground/30 active:scale-95 active:shadow-none"
                            onClick={(e) => { e.stopPropagation(); onEditLogos(); }}>
                            {hasContent
                                ? <><LayoutList color="currentColor" size="12" />{contentCount} logo{contentCount !== 1 ? 's' : ''}<Pencil color="currentColor" size="10" className="ml-0.5 opacity-60" /></>
                                : <><Plus color="currentColor" size="12" />Add logos</>}
                        </button>
                    )}
                    {isProduct && onEditProductSection && (
                        <button
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-border bg-muted/60 text-muted-foreground shadow-sm transition-all duration-100 cursor-pointer hover:bg-muted hover:text-foreground hover:border-foreground/30 active:scale-95 active:shadow-none"
                            onClick={(e) => { e.stopPropagation(); onEditProductSection(sectionKey as ProductSectionKey); }}>
                            {hasContent
                                ? <><LayoutList color="currentColor" size="12" />{contentCount} product{contentCount !== 1 ? 's' : ''}<Pencil color="currentColor" size="10" className="ml-0.5 opacity-60" /></>
                                : <><Plus color="currentColor" size="12" />Add products</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Toggle */}
            <Switch
                checked={section.active}
                onCheckedChange={() => dispatch(toggleSection(sectionKey))}
                className="shrink-0 scale-[0.8] origin-right"
            />
        </div>
    );
}


export function SectionsList({ onEditAdSection, onEditProductSection, onEditCategories, onEditLogos }: {
    onEditAdSection?: (key: string) => void;
    onEditProductSection?: (key: ProductSectionKey) => void;
    onEditCategories?: () => void;
    onEditLogos?: () => void;
} = {}) {
    const dispatch = useAppDispatch();
    const config = useAppSelector((s) => s.home.config);
    const ads = useAppSelector((s) => s.ads.ads);
    const products = useAppSelector((s) => (s as any).products?.products || []);
    const categories = useAppSelector((s) => s.categories.allMainCategories);
    const stores = useAppSelector((s) => s.stores.stores);

    const [draggedKey, setDraggedKey] = useState<SectionKey | null>(null);
    const [overKey, setOverKey] = useState<SectionKey | null>(null);
    const dragTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (!config) return null;

    const activeCount = ALL_SECTIONS.filter((k) => config[k]?.active).length;

    const adCounts: Record<string, number> = {};
    ads.forEach((ad: any) => { adCounts[ad.adType] = (adCounts[ad.adType] ?? 0) + 1; });

    const productCounts: Record<string, number> = {};
    products.forEach((p: any) => {
        if (p.productType && p.isHomeProduct) productCounts[p.productType] = (productCounts[p.productType] ?? 0) + 1;
    });

    const categoryCount = categories.filter((c: any) => c.isHomeCategory).length;
    const logoCount = stores.filter((s: any) => s.isHomeStore).length;

    const globalMinOrder = Math.min(...ALL_SECTIONS.map((k) => config[k]?.order ?? 99));
    const globalMaxOrder = Math.max(...ALL_SECTIONS.map((k) => config[k]?.order ?? 0));

    const sortedAll = [...ALL_SECTIONS].sort(
        (a, b) => (config[a]?.order ?? 99) - (config[b]?.order ?? 99)
    );

    const handleDragEnd = () => {
        if (draggedKey && overKey && draggedKey !== overKey) {
            dispatch(reorderSection({ from: draggedKey, to: overKey }));
        }
        if (dragTimeout.current) clearTimeout(dragTimeout.current);
        setDraggedKey(null);
        setOverKey(null);
    };

    return (
        <div className="flex flex-col gap-3 pb-4">

            {/* Stats row */}
            <div className="flex items-center justify-between py-1.5 px-2 bg-muted/40 rounded-lg">
                <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{activeCount}</span> / {ALL_SECTIONS.length} active
                </span>
                {/* Mini dot progress */}
                <div className="flex gap-px items-center">
                    {sortedAll.map((k) => (
                        <span
                            key={k}
                            title={SECTION_LABELS[k]}
                            className={cn(
                                "w-1.5 h-1.5 rounded-sm transition-all",
                                config[k]?.active ? TYPE_META[getSectionType(k)].dot : 'bg-muted-foreground/15'
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Flat ordered list */}
            <div className="flex flex-col gap-1.5">
                {sortedAll.map((key) => (
                    <SectionRow
                        key={key}
                        sectionKey={key}
                        config={config}
                        globalMinOrder={globalMinOrder}
                        globalMaxOrder={globalMaxOrder}
                        adCount={adCounts[key] ?? 0}
                        productCount={productCounts[key] ?? 0}
                        categoryCount={categoryCount}
                        logoCount={logoCount}
                        isDragging={draggedKey === key}
                        isOver={overKey === key}
                        onDragStart={() => setDraggedKey(key)}
                        onDragEnter={() => {
                            if (dragTimeout.current) clearTimeout(dragTimeout.current);
                            setOverKey(key);
                        }}
                        onDragEnd={handleDragEnd}
                        onEditAdSection={onEditAdSection}
                        onEditProductSection={onEditProductSection}
                        onEditCategories={onEditCategories}
                        onEditLogos={onEditLogos}
                    />
                ))}
            </div>

        </div>
    );
}
