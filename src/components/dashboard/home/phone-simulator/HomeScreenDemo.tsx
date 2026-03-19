"use client";

import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/dashboard/ads/phone-simulator/PhoneFrame";
import { ALL_SECTIONS, HomeConfig, SectionKey } from "@/store/slices/homeSlice";
import { SECTION_LABELS } from "@/components/dashboard/home/SectionsList";
import { Ad } from "@/store/slices/adsSlice";
import { Store } from "@/store/slices/storesSlice";
import { Category } from "@/store/slices/categoriesSlice";

const ESH = 720;

/** Safely extract a display string from a plain string or a {ar, en, ch, tr, ku} object. */
function t(val: any): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") return val.ar ?? val.en ?? val.ch ?? val.tr ?? val.ku ?? "";
    return String(val);
}

function ShowAll({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "16px", paddingRight: "16px", paddingTop: "8px", paddingBottom: "4px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#161A1D", lineHeight: 1.3 }}>{title}</span>
                {subtitle && <span style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.3 }}>{subtitle}</span>}
            </div>
            <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>عرض الكل</span>
        </div>
    );
}


const MOCK_PRODUCTS = [
    { _id: "m1", name: "مطرقة احترافية", price: 75000, originalPrice: 95000, discount: 21, mockImage: "/hammer.png" },
    { _id: "m2", name: "قاطع دقيق", price: 45000, originalPrice: 60000, discount: 25, mockImage: "/cutter.png" },
    { _id: "m3", name: "صندوق عدة كامل", price: 120000, mockImage: "/toolbox.png" },
    { _id: "m4", name: "قفازات واقية", price: 35000, originalPrice: 45000, discount: 22, mockImage: "/gloves.png" },
    { _id: "m5", name: "فنار كهربائي", price: 55000, mockImage: "/fanar.png" },
    { _id: "m6", name: "فنار يدوي", price: 40000, originalPrice: 50000, discount: 20, mockImage: "/fanar2.png" },
];

const MOCK_BANNER: Record<string, string> = {
    fullWidthBanner: "/ad1.png",
    fullWidthSliderBannerWithLogo: "/ad3.png",
    bannerVisualStaticRounded: "/ad2.png",
    bannerVisualStaticRoundedCta: "/ad2.png",
    bannerVisualStatic: "/ad6.png",
    bannerVisualSlider: "/ad7.png",
    bannerVisualSliderRounded: "/ad4.png",
    bannerContainedRoundedStatic2Cta: "/ad5.png",
    bannerContainedRoundedGrid: "/ad8.png",
    verticalBannerCards: "/ad4.png",
    announcementBar: "",
};

const MOCK_GRID_IMAGES = ["/ad8.png", "/ad9.png", "/ad3.png"];
const MOCK_CATEGORY_ICONS = ["👗", "👟", "💍", "👜", "⌚", "🧴"];
const MOCK_CATEGORY_LABELS = ["ملابس", "أحذية", "مجوهرات", "حقائب", "ساعات", "عناية"];


interface Product {
    _id: string;
    name: string;
    price?: number;
    originalPrice?: number;
    discount?: number;
    variants?: { images: string[] }[];
    gradient?: string;
}

// ── ProductCard (used by productsGrid & productCardInteractive3xl) ──────────
// Matches Flutter's ProductCard: heart + bag buttons top-right, white discount badge bottom-left
function ProductCard({ product, height = "158px" }: { product: Product; height?: string }) {
    const image = product.variants?.[0]?.images?.[0] || (product as any).mockImage;
    const iconBtn = (children: React.ReactNode) => (
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            {children}
        </div>
    );
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "12px", height, backgroundColor: "#F3F3F3" }}>
                {image && <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} />}
                <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px" }}>
                    {iconBtn(
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#161A1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    )}
                    {iconBtn(
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#161A1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                    )}
                </div>
                {product.discount && (
                    <div style={{ position: "absolute", bottom: "8px", left: "8px", backgroundColor: "white", borderRadius: "100px", padding: "4px 12px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#161A1D" }}>-{product.discount}%</span>
                    </div>
                )}
            </div>
            <span dir="rtl" style={{ fontWeight: 600, fontSize: "16px", color: "#161A1D", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t(product.name)}</span>
            <div dir="rtl" style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
                {product.price && <span style={{ fontWeight: 600, fontSize: "16px", color: "#161A1D" }}>{product.price.toLocaleString()} د.ع</span>}
                {product.originalPrice && <span style={{ fontSize: "12px", color: "#9CA3AF", textDecoration: "line-through" }}>{product.originalPrice.toLocaleString()}</span>}
            </div>
        </div>
    );
}

// ── ProductCard2XL (productCardStandard2xl) ──────────────────────────────────
// Matches Flutter's ProductCard2XL: gray bg container, title (w800), brand row, price
function ProductCard2XL({ product }: { product: Product }) {
    const image = product.variants?.[0]?.images?.[0] || (product as any).mockImage;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: `${Math.round(370 * 0.5)}px`, flexShrink: 0 }}>
            <div style={{ height: `${Math.round(ESH * 0.27)}px`, backgroundColor: "#F3F3F3", borderRadius: "12px", padding: "8px", overflow: "hidden" }}>
                {image && <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <span dir="rtl" style={{ fontWeight: 800, fontSize: "13px", color: "#161A1D", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t(product.name)}</span>
            <div dir="rtl" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "#9CA3AF" }}>الفنار</span>
            </div>
            <div dir="rtl" style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
                {product.price && <span style={{ fontWeight: 600, fontSize: "16px", color: "#161A1D" }}>{product.price.toLocaleString()} د.ع</span>}
                {product.originalPrice && <span style={{ fontSize: "12px", color: "#9CA3AF", textDecoration: "line-through" }}>{product.originalPrice.toLocaleString()}</span>}
            </div>
        </div>
    );
}

// ── ProductCardXL (productCardGridVerticalXl) ────────────────────────────────
// Matches Flutter's ProductCardXL: gray bg, borderRadius 16, title (w700 14px), price (w800 15px)
function ProductCardXL({ product }: { product: Product }) {
    const image = product.variants?.[0]?.images?.[0] || (product as any).mockImage;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: `${Math.round(370 * 0.35)}px`, flexShrink: 0 }}>
            <div style={{ height: `${Math.round(ESH * 0.25)}px`, backgroundColor: "#F3F3F3", borderRadius: "16px", padding: "12px", overflow: "hidden" }}>
                {image && <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />}
            </div>
            <span dir="rtl" style={{ fontWeight: 700, fontSize: "14px", color: "#161A1D", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t(product.name)}</span>
            <div dir="rtl" style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
                {product.price && <span style={{ fontWeight: 800, fontSize: "15px", color: "#161A1D" }}>{product.price.toLocaleString()} د.ع</span>}
                {product.originalPrice && <span style={{ fontSize: "12px", color: "#9CA3AF", textDecoration: "line-through" }}>{product.originalPrice.toLocaleString()}</span>}
            </div>
        </div>
    );
}

// ── ProductCardMedium (productCardInteractiveM) ──────────────────────────────
// Matches Flutter's ProductCardMedium: narrow gray bg, price only below
function ProductCardMedium({ product }: { product: Product }) {
    const image = product.variants?.[0]?.images?.[0] || (product as any).mockImage;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: `${Math.round(370 * 0.25)}px`, flexShrink: 0 }}>
            <div style={{ height: `${Math.round(ESH * 0.15)}px`, backgroundColor: "#F3F3F3", borderRadius: "12px", padding: "8px", overflow: "hidden" }}>
                {image && <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "10px" }} />}
            </div>
            {product.price && <span style={{ fontWeight: 800, fontSize: "14px", color: "#161A1D", textAlign: "center" }}>{product.price.toLocaleString()} د.ع</span>}
        </div>
    );
}

// ── ProductCardSmall (productCardInteractiveS) ───────────────────────────────
// Matches Flutter's ProductCardSmall: narrow gray bg, title only below (no price)
function ProductCardSmall({ product }: { product: Product }) {
    const image = product.variants?.[0]?.images?.[0] || (product as any).mockImage;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: `${Math.round(370 * 0.325)}px`, flexShrink: 0 }}>
            <div style={{ height: `${Math.round(ESH * 0.15)}px`, backgroundColor: "#F3F3F3", borderRadius: "12px", padding: "8px", overflow: "hidden" }}>
                {image && <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />}
            </div>
            <span dir="rtl" style={{ fontWeight: 600, fontSize: "12px", color: "#161A1D", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t(product.name)}</span>
        </div>
    );
}

// ── SimProductPromotionCard (productPromotionCard) ───────────────────────────
// Matches Flutter's ProductPromotionCard: dark badge at top, centered image, price below
function SimProductPromotionCard({ product }: { product: Product }) {
    const image = product.variants?.[0]?.images?.[0] || (product as any).mockImage;
    return (
        <div style={{ padding: "8px", backgroundColor: "#F9F9F9", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0", flexShrink: 0, width: "130px" }}>
            {product.discount
                ? <div style={{ backgroundColor: "#2E2E2E", borderRadius: "100px", padding: "5px 16px" }}>
                    <span style={{ color: "white", fontSize: "12px" }}>-{product.discount}%</span>
                  </div>
                : <div style={{ height: "22px" }} />
            }
            <div style={{ height: "16px" }} />
            {image && <img src={image} alt="" style={{ height: `${Math.round(ESH * 0.1)}px`, width: `${Math.round(370 * 0.3)}px`, objectFit: "contain" }} />}
            <div style={{ height: "16px" }} />
            {product.price && <span style={{ fontWeight: 700, fontSize: "13px", color: "#161A1D", textAlign: "center" }}>{product.price.toLocaleString()} د.ع</span>}
            <div style={{ height: "8px" }} />
        </div>
    );
}


function FullBanner({ ad, sectionKey }: { ad?: Ad; sectionKey?: string }) {
    const bg = ad?.mainBackgroundImage || ad?.mainImage || MOCK_BANNER[sectionKey ?? "fullWidthBanner"];
    const bannerTitle = t(ad?.titleText) || "عنوان نصي هنا";
    const bannerDesc = t(ad?.descriptionText) || "وصف العنوان النصي هنا";
    const ctaText = t(ad?.ctaBtnText) || "تسوق الآن";
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ position: "relative", overflow: "hidden", width: "100%", height: `${ESH * 0.5}px`, backgroundColor: ad?.color || "#1a1a2e" }}>
                <img src={bg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.20)" }} />
                <div dir="rtl" style={{ position: "absolute", bottom: "16px", left: "24px", right: "24px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                    <span style={{ color: "white", fontWeight: 800, fontSize: "16px", lineHeight: 1.2 }}>{bannerTitle}</span>
                    <span style={{ color: "white", fontSize: "12px" }}>{bannerDesc}</span>
                    {ad?.ctaVisibility !== false && (
                        <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "4px", marginTop: "4px" }}>
                            <span style={{ color: "white", fontSize: "13px", flex: 1 }}>{ctaText}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function FullWidthSliderWithLogo({ ads }: { ads: Ad[] }) {
    const [activeIdx, setActiveIdx] = useState(0);
    useEffect(() => {
        if (ads.length <= 1) return;
        const t = setInterval(() => setActiveIdx((i) => (i + 1) % ads.length), 2500);
        return () => clearInterval(t);
    }, [ads.length]);
    const slide = ads[activeIdx] ?? ads[0];
    const bg = slide?.mainBackgroundImage || MOCK_BANNER["fullWidthSliderBannerWithLogo"];
    const bannerTitle = t(slide?.titleText) || "عنوان نصي هنا";
    const bannerDesc = t(slide?.descriptionText) || "وصف العنوان النصي هنا";
    const ctaText = t(slide?.ctaBtnText) || "شراء الآن";
    const count = ads.length || 4;
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ position: "relative", overflow: "hidden", width: "100%", height: `${ESH * 0.52}px`, backgroundColor: slide?.color || "#1a1a2e" }}>
                <img src={bg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", transition: "opacity 0.4s" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.643) 0%, rgba(0,0,0,0.643) 25%, rgba(0,0,0,0.20) 65%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {slide?.logo && slide?.logoVisibility !== false && (
                        <>
                            <img src={slide.logo} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "10px" }} />
                            <div style={{ height: "16px" }} />
                        </>
                    )}
                    <span style={{ color: "white", fontWeight: 800, fontSize: "16px", textAlign: "center" }}>{bannerTitle}</span>
                    {slide?.descriptionVisibility !== false && (
                        <span style={{ color: "#B1B1B1", fontSize: "12px", textAlign: "center" }}>{bannerDesc}</span>
                    )}
                    {slide?.ctaVisibility !== false && ctaText && (
                        <>
                            <div style={{ height: "16px" }} />
                            <div style={{ background: "white", color: "#161A1D", borderRadius: "100px", padding: "8px 0", width: "117px", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>{ctaText}</div>
                        </>
                    )}
                    <div style={{ height: "16px" }} />
                    <div style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
                        {Array.from({ length: count }).map((_, i) => (
                            <span key={i} onClick={() => setActiveIdx(i)} style={{ width: i === activeIdx ? "16px" : "4px", height: "4px", borderRadius: "2px", backgroundColor: i === activeIdx ? "rgba(0,0,0,0.5)" : "white", transition: "width 0.3s", cursor: "pointer" }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


function StaticRoundedBanner({ ad, sectionKey }: { ad?: Ad; sectionKey?: string }) {
    const bg = ad?.mainBackgroundImage || ad?.mainImage || MOCK_BANNER[sectionKey ?? "bannerVisualStaticRounded"];
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ paddingLeft: "16px", paddingRight: "16px" }}>
                <div style={{ overflow: "hidden", height: `${ESH * 0.15}px`, borderRadius: "12px" }}>
                    <img src={bg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
            </div>
        </div>
    );
}

function StaticRoundedBannerCta({ ad, sectionKey }: { ad?: Ad; sectionKey?: string }) {
    const bg = ad?.mainBackgroundImage || ad?.mainImage || MOCK_BANNER[sectionKey ?? "bannerVisualStaticRoundedCta"];
    const bannerTitle = t(ad?.titleText) || "عنوان نصي هنا";
    const bannerDesc = t(ad?.descriptionText);
    const ctaText = t(ad?.ctaBtnText) || "المزيد!";
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ paddingLeft: "16px", paddingRight: "16px" }}>
                <div style={{ position: "relative", overflow: "hidden", height: `${ESH * 0.15}px`, borderRadius: "12px" }}>
                    <img src={bg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.20)" }} />
                    <div dir="rtl" style={{ position: "absolute", top: "12px", right: "12px", left: "12px" }}>
                        <div style={{ color: "white", fontSize: "13px", fontWeight: 700, lineHeight: 1.3 }}>{bannerTitle}</div>
                        {bannerDesc && <div style={{ color: "white", fontSize: "11px", lineHeight: 1.3, marginTop: "2px" }}>{bannerDesc}</div>}
                    </div>
                    {ad?.ctaVisibility !== false && (
                        <div style={{ position: "absolute", bottom: "12px", right: "12px" }}>
                            <div style={{ backgroundColor: "white", borderRadius: "100px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: "#161A1D" }}>{ctaText}</div>
                        </div>
                    )}
                    {!ad && (
                        <div style={{ position: "absolute", bottom: "12px", right: "12px" }}>
                            <div style={{ backgroundColor: "white", borderRadius: "100px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: "#161A1D" }}>{ctaText}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function BannerVisualStatic({ ad, sectionKey }: { ad?: Ad; sectionKey?: string }) {
    const bg = ad?.mainBackgroundImage || ad?.mainImage || MOCK_BANNER[sectionKey ?? "bannerVisualStatic"];
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <img src={bg} alt="" style={{ display: "block", width: "100%", objectFit: "cover" }} />
        </div>
    );
}


function SliderBanner({ ad, sectionKey }: { ad?: Ad; sectionKey?: string }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const fallbacks = [MOCK_BANNER[sectionKey ?? ""] || "/ad7.png", "/ad7.png", "/ad7.png"];
    const images = [
        ad?.imageBackgroundTop01 || fallbacks[0],
        ad?.imageBackgroundTop02 || fallbacks[1],
        ad?.imageBackgroundTop03 || fallbacks[2],
    ].filter(Boolean);
    useEffect(() => {
        if (images.length <= 1) return;
        const t = setInterval(() => setActiveIdx((i) => (i + 1) % images.length), 2500);
        return () => clearInterval(t);
    }, [images.length]);
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ position: "relative", overflow: "hidden", width: "100%", height: `${ESH * 0.115}px` }}>
                <img src={images[activeIdx]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.4s" }} />
                <div style={{ position: "absolute", bottom: "8px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "4px" }}>
                    {images.map((_, i) => (
                        <span key={i} onClick={() => setActiveIdx(i)} style={{ width: i === activeIdx ? "16px" : "4px", height: "4px", borderRadius: "2px", backgroundColor: i === activeIdx ? "rgba(0,0,0,0.5)" : "white", transition: "width 0.2s", cursor: "pointer" }} />
                    ))}
                </div>
            </div>
        </div>
    );
}


function SliderRoundedBanner({ ad, sectionKey }: { ad?: Ad; sectionKey?: string }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const fallbacks = [MOCK_BANNER[sectionKey ?? ""] || "/ad4.png", "/ad5.png", "/ad9.png"];
    const images = [
        ad?.imageBackgroundTop01 || fallbacks[0],
        ad?.imageBackgroundTop02 || fallbacks[1],
        ad?.imageBackgroundTop03 || fallbacks[2],
    ].filter(Boolean);
    useEffect(() => {
        if (images.length <= 1) return;
        const t = setInterval(() => setActiveIdx((i) => (i + 1) % images.length), 2500);
        return () => clearInterval(t);
    }, [images.length]);
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ position: "relative", height: `${ESH * 0.15}px` }}>
                <div style={{ paddingLeft: "16px", paddingRight: "16px", height: "100%" }}>
                    <div style={{ position: "relative", overflow: "hidden", height: "100%", borderRadius: "12px" }}>
                        <img src={images[activeIdx]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.4s" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.392) 0%, rgba(0,0,0,0.392) 25%, rgba(0,0,0,0.20) 65%, transparent 100%)" }} />
                    </div>
                </div>
                <div style={{ position: "absolute", bottom: "8px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "4px", pointerEvents: "none" }}>
                    {images.map((_, i) => (
                        <span key={i} style={{ width: i === activeIdx ? "16px" : "4px", height: "4px", borderRadius: "2px", backgroundColor: i === activeIdx ? "rgba(0,0,0,0.5)" : "white", transition: "width 0.2s" }} />
                    ))}
                </div>
            </div>
        </div>
    );
}


function RoundedGridBanner({ ads }: { ads: Ad[] }) {
    const ad = ads[0];
    const topBg = ad?.mainImage || MOCK_GRID_IMAGES[0];
    const leftBg = ad?.imageBackgroundTop01 || MOCK_GRID_IMAGES[1];
    const rightBg = ad?.imageBackgroundTop02 || MOCK_GRID_IMAGES[2];
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ paddingLeft: "16px", paddingRight: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ position: "relative", overflow: "hidden", width: "100%", height: `${ESH * 0.20}px`, borderRadius: "16px", backgroundColor: ad?.color || "#f3f4f6" }}>
                    <img src={topBg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {[leftBg, rightBg].map((bg, i) => (
                        <div key={i} style={{ flex: 1, position: "relative", overflow: "hidden", height: `${ESH * 0.15}px`, borderRadius: "16px", backgroundColor: "#f3f4f6" }}>
                            <img src={bg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


function BannerContainedRoundedStatic2Cta({ ads }: { ads: Ad[] }) {
    const ad = ads[0];
    const bg = ad?.mainBackgroundImage || ad?.mainImage || MOCK_BANNER["bannerContainedRoundedStatic2Cta"];
    const bannerTitle = t(ad?.titleText) || "عنوان نصي هنا";
    const bannerDesc = t(ad?.descriptionText) || "وصف العنوان النصي هنا";
    const primaryCta = t(ad?.ctaBtnText) || "شراء الآن";
    const secondaryCta = t((ad as any)?.ctaText) || "عرض الكل";
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ position: "relative", overflow: "hidden", width: "100%", height: `${ESH * 0.3}px` }}>
                <img src={bg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.643) 0%, rgba(0,0,0,0.643) 25%, rgba(0,0,0,0.20) 65%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ color: "white", fontWeight: 800, fontSize: "16px", textAlign: "center" }}>{bannerTitle}</span>
                    <span style={{ color: "white", fontSize: "12px", textAlign: "center" }}>{bannerDesc}</span>
                    {ad?.ctaVisibility !== false && (
                        <>
                            <div style={{ height: "16px" }} />
                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ background: "white", color: "#161A1D", borderRadius: "100px", padding: "8px 0", width: "117px", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>{primaryCta}</div>
                                <div style={{ background: "rgba(255,255,255,0.094)", color: "white", borderRadius: "100px", padding: "8px 0", width: "117px", textAlign: "center", fontSize: "13px", fontWeight: 700, border: "1px solid rgba(255,255,255,0.2)" }}>{secondaryCta}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


function VerticalBannerCards({ ads }: { ads: Ad[] }) {
    const ad = ads[0];
    const fallbacks = ["/ad4.png", "/ad5.png", "/ad9.png"];
    const images = [
        ad?.imageBackgroundTop01 || fallbacks[0],
        ad?.imageBackgroundTop02 || fallbacks[1],
        ad?.imageBackgroundTop03 || fallbacks[2],
    ];
    return (
        <div>
            <ShowAll title="العروض" subtitle="اكتشف أحدث العروض" />
            <div style={{ height: "4px" }} />
            <div style={{ overflowX: "auto" }} dir="rtl">
                <div style={{ display: "flex", gap: "12px", paddingRight: "16px", paddingLeft: "16px", paddingBottom: "12px" }}>
                    {images.map((bg, i) => (
                        <div key={i} style={{ flexShrink: 0, position: "relative", overflow: "hidden", width: "117px", height: `${ESH * 0.25}px`, borderRadius: "8px", backgroundColor: ad?.color || "#f3f4f6" }}>
                            <img src={bg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


function AnnouncementBar({ ad }: { ad?: Ad }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "6px", paddingBottom: "6px", backgroundColor: ad?.color || "#f59e0b" }}>
            <span dir="rtl" style={{ color: "white", fontSize: "12px", fontWeight: 700, textAlign: "center", paddingLeft: "16px", paddingRight: "16px" }}>
                {t(ad?.titleText) || "اشحن مجاناً على الطلبات فوق ١٠٠,٠٠٠ دينار"}
            </span>
        </div>
    );
}


function GenericBanner({ sectionKey, ad }: { sectionKey: SectionKey; ad?: Ad }) {
    const bg = ad?.mainBackgroundImage || ad?.mainImage || MOCK_BANNER[sectionKey] || "/ad10.png";
    const label = SECTION_LABELS[sectionKey];
    return (
        <div>
            <ShowAll title={t(ad?.titleText) || label} />
            <div style={{ height: "4px" }} />
            <div style={{ paddingLeft: "16px", paddingRight: "16px" }}>
                <div style={{ position: "relative", overflow: "hidden", height: "130px", borderRadius: "16px" }}>
                    <img src={bg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
                    <div dir="rtl" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: "15px", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                            {t(ad?.titleText) || label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}


function ProductsGrid({ products }: { products: Product[] }) {
    const items = products.length > 0 ? products.slice(0, 4) : MOCK_PRODUCTS.slice(0, 4);
    return (
        <div>
            <ShowAll title="المنتجات" subtitle="تصفح جميع المنتجات" />
            <div style={{ height: "4px" }} />
            <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingLeft: "16px", paddingRight: "16px", paddingBottom: "12px" }}>
                {items.map((p) => <ProductCard key={p._id} product={p} height={`${Math.round(ESH * 0.22)}px`} />)}
            </div>
        </div>
    );
}

// productCardInteractive3xl uses the main ProductCard (same as productsGrid but horizontal scroll)
function ProductSection3XL({ products }: { products: Product[] }) {
    const items = products.length > 0 ? products.slice(0, 5) : MOCK_PRODUCTS;
    return (
        <div>
            <ShowAll title="المنتجات" subtitle="تصفح جميع المنتجات" />
            <div style={{ height: "4px" }} />
            <div style={{ overflowX: "auto" }} dir="rtl">
                <div style={{ display: "flex", gap: "12px", paddingRight: "16px", paddingLeft: "16px", paddingBottom: "12px" }}>
                    {items.map((p) => (
                        <div key={p._id} style={{ width: "160px", flexShrink: 0 }}>
                            <ProductCard product={p} height={`${Math.round(ESH * 0.22)}px`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// productCardGridVerticalXl uses ProductCardXL
function ProductCardGridXL({ products }: { products: Product[] }) {
    const items = products.length > 0 ? products.slice(0, 4) : MOCK_PRODUCTS.slice(0, 4);
    return (
        <div>
            <ShowAll title="المنتجات" subtitle="تصفح جميع المنتجات" />
            <div style={{ height: "4px" }} />
            <div style={{ overflowX: "auto" }} dir="rtl">
                <div style={{ display: "flex", gap: "12px", paddingRight: "16px", paddingLeft: "16px", paddingBottom: "12px" }}>
                    {items.map((p) => <ProductCardXL key={p._id} product={p} />)}
                </div>
            </div>
        </div>
    );
}

// Each section key maps to a distinct card design matching the Flutter app
function ProductsHorizontal({ sectionKey, products }: { sectionKey: SectionKey; products: Product[] }) {
    const items = products.length > 0 ? products.slice(0, 5) : MOCK_PRODUCTS.slice(0, 5);
    const subtitle = sectionKey === 'productPromotionCard' ? 'عروض على المنتجات' : 'تصفح جميع المنتجات';
    return (
        <div>
            <ShowAll title="المنتجات" subtitle={subtitle} />
            <div style={{ height: "4px" }} />
            <div style={{ overflowX: "auto" }} dir="rtl">
                <div style={{ display: "flex", gap: "12px", paddingRight: "16px", paddingLeft: "16px", paddingBottom: "12px" }}>
                    {items.map((p) => {
                        if (sectionKey === 'productCardInteractiveM') return <ProductCardMedium key={p._id} product={p} />;
                        if (sectionKey === 'productCardInteractiveS') return <ProductCardSmall key={p._id} product={p} />;
                        if (sectionKey === 'productCardStandard2xl') return <ProductCard2XL key={p._id} product={p} />;
                        if (sectionKey === 'productPromotionCard') return <SimProductPromotionCard key={p._id} product={p} />;
                        // fallback (productCardInteractive3xl handled by ProductSection3XL)
                        return <div key={p._id} style={{ width: "130px", flexShrink: 0 }}><ProductCard product={p} height="130px" /></div>;
                    })}
                </div>
            </div>
        </div>
    );
}


function CategoriesRow({ sectionKey, categories }: { sectionKey: SectionKey; categories: Category[] }) {
    const homeCategories = [...categories]
        .filter((c) => c.isHomeCategory)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const items = homeCategories.length > 0 ? homeCategories : null;
    return (
        <div>
            <ShowAll title={SECTION_LABELS[sectionKey]} />
            <div style={{ height: "4px" }} />
            <div dir="rtl" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingLeft: "16px", paddingRight: "16px", paddingBottom: "12px" }}>
                {items ? (
                    items.map((cat, i) => (
                        <div key={cat._id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "100%", aspectRatio: "1", borderRadius: "12px", backgroundColor: "#F3F3F3", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {cat.image
                                    ? <img src={cat.image} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="" />
                                    : <span style={{ fontSize: "32px" }}>{MOCK_CATEGORY_ICONS[i % MOCK_CATEGORY_ICONS.length]}</span>
                                }
                            </div>
                            <span dir="rtl" style={{ fontSize: "13px", color: "#161A1D", fontWeight: 700, textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: "100%" }}>{t(cat.title)}</span>
                        </div>
                    ))
                ) : (
                    MOCK_CATEGORY_LABELS.map((label, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "100%", aspectRatio: "1", borderRadius: "12px", backgroundColor: "#F3F3F3", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: "32px" }}>{MOCK_CATEGORY_ICONS[i]}</span>
                            </div>
                            <span dir="rtl" style={{ fontSize: "13px", color: "#161A1D", fontWeight: 700, textAlign: "center" }}>{label}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


const MOCK_LOGO_NAMES = ["Nike", "Adidas", "H&M", "Zara", "Guess", "L.C.W"];

function LogosRow({ sectionKey, stores }: { sectionKey: SectionKey; stores: Store[] }) {
    const homeStores = [...stores]
        .filter((s) => s.isHomeStore)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return (
        <div>
            <ShowAll title={SECTION_LABELS[sectionKey]} />
            <div style={{ height: "4px" }} />
            <div style={{ overflowX: "auto" }} dir="rtl">
                <div style={{ display: "flex", gap: "12px", paddingRight: "16px", paddingLeft: "16px", paddingBottom: "12px" }}>
                    {homeStores.length > 0 ? (
                        homeStores.map((store) => (
                            <div key={store._id} style={{ flexShrink: 0, width: "80px", height: "80px", borderRadius: "10px", backgroundColor: "#F7F8F9", border: "1px solid #EBEBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {store.image
                                    ? <img src={store.image} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8px" }} alt="" />
                                    : <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textAlign: "center", padding: "0 4px" }}>{t(store.title)}</span>
                                }
                            </div>
                        ))
                    ) : (
                        MOCK_LOGO_NAMES.map((name, i) => (
                            <div key={i} style={{ flexShrink: 0, width: "80px", height: "80px", borderRadius: "10px", backgroundColor: "#F7F8F9", border: "1px solid #EBEBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: "#374151" }}>{name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}


function renderSection(key: SectionKey, ads: Ad[], products: Product[], stores: Store[], categories: Category[]) {
    const sectionAds = ads.filter((a) => a.adType === key);
    const sectionProducts = products.filter((p: any) => p.productType === key);

    switch (key) {
        case 'fullWidthBanner':
            return <FullBanner ad={sectionAds[0]} sectionKey={key} />;
        case 'fullWidthSliderBannerWithLogo':
            return <FullWidthSliderWithLogo ads={sectionAds} />;
        case 'bannerVisualStaticRounded':
            return <StaticRoundedBanner ad={sectionAds[0]} sectionKey={key} />;
        case 'bannerVisualStaticRoundedCta':
            return <StaticRoundedBannerCta ad={sectionAds[0]} sectionKey={key} />;
        case 'bannerVisualStatic':
            return <BannerVisualStatic ad={sectionAds[0]} sectionKey={key} />;
        case 'bannerVisualSlider':
            return <SliderBanner ad={sectionAds[0]} sectionKey={key} />;
        case 'bannerVisualSliderRounded':
            return <SliderRoundedBanner ad={sectionAds[0]} sectionKey={key} />;
        case 'bannerContainedRoundedGrid':
            return <RoundedGridBanner ads={sectionAds} />;
        case 'bannerContainedRoundedStatic2Cta':
            return <BannerContainedRoundedStatic2Cta ads={sectionAds} />;
        case 'verticalBannerCards':
            return <VerticalBannerCards ads={sectionAds} />;
        case 'announcementBar':
            return <AnnouncementBar ad={sectionAds[0]} />;
        case 'productCardGridVerticalXl':
            return <ProductCardGridXL products={sectionProducts} />;
        case 'productsGrid':
            return <ProductsGrid products={sectionProducts} />;
        case 'productCardInteractive3xl':
            return <ProductSection3XL products={sectionProducts} />;
        case 'productCardStandard2xl':
        case 'productCardInteractiveM':
        case 'productCardInteractiveS':
        case 'productPromotionCard':
            return <ProductsHorizontal sectionKey={key} products={sectionProducts} />;
        case 'categoryDiscoveryGrid':
            return <CategoriesRow sectionKey={key} categories={categories} />;
        case 'logos':
            return <LogosRow sectionKey={key} stores={stores} />;
        default:
            return <GenericBanner sectionKey={key} ad={sectionAds[0]} />;
    }
}


const AD_SECTION_KEYS = new Set([
    'fullWidthBanner', 'fullWidthSliderBannerWithLogo', 'bannerContainedRoundedGrid',
    'verticalBannerCards', 'bannerContainedRoundedStatic2Cta', 'bannerVisualStaticRounded',
    'bannerVisualStaticRoundedCta', 'bannerVisualSliderRounded', 'bannerVisualStatic',
    'bannerVisualSlider', 'announcementBar',
]);

interface HomeScreenDemoProps {
    config: HomeConfig | null;
    ads: Ad[];
    products: any[];
    stores: Store[];
    categories: Category[];
    scale?: number;
    onEditAd?: (ad: Ad) => void;
}


function AppHeader() {
    const iconBtn = (children: React.ReactNode) => (
        <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            border: "1px solid #E5E7EB",
            backgroundColor: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            {children}
        </div>
    );
    const PRIMARY = "#2563EB";
    return (
        <div dir="rtl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "16px", paddingRight: "16px", paddingTop: "8px", paddingBottom: "8px" }}>
            {iconBtn(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {iconBtn(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161A1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 12 20 22 4 22 4 12" />
                        <rect x="2" y="7" width="20" height="5" />
                        <line x1="12" y1="22" x2="12" y2="7" />
                        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                    </svg>
                )}
                {iconBtn(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161A1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                )}
                {iconBtn(
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161A1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                )}
            </div>
        </div>
    );
}

export function HomeScreenDemo({ config, ads, products, stores, categories, scale = 0.58, onEditAd }: HomeScreenDemoProps) {
    const activeSections = config
        ? (ALL_SECTIONS as readonly SectionKey[])
            .filter((key) => config[key]?.active)
            .sort((a, b) => (config[a]?.order ?? 99) - (config[b]?.order ?? 99))
        : [];

    return (
        <PhoneFrame scale={scale}>
            {activeSections.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "60px 32px 0" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>📱</div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>No sections active</p>
                        <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.4 }}>Enable sections from the left panel to see a preview</p>
                    </div>
                </div>
            ) : (
                <>
                    {activeSections.map((key) => {
                        const sectionAds = ads.filter((a) => a.adType === key);
                        const primaryAd = sectionAds[0];
                        const isAdSection = AD_SECTION_KEYS.has(key);
                        const canEdit = isAdSection && !!primaryAd && !!onEditAd;
                        return (
                            <div key={key} style={{ position: "relative", cursor: canEdit ? "pointer" : undefined }} onClick={canEdit ? () => onEditAd!(primaryAd) : undefined}>
                                {renderSection(key, ads, products, stores, categories)}
                                {canEdit && (
                                    <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 30, background: "rgba(0,0,0,0.65)", borderRadius: "6px", padding: "3px 8px", pointerEvents: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        <span style={{ color: "white", fontSize: "10px", fontWeight: 600 }}>Edit</span>
                                    </div>
                                )}
                                <div style={{ height: "16px" }} />
                            </div>
                        );
                    })}
                </>
            )}
        </PhoneFrame>
    );
}
