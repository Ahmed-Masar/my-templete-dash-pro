"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHome, saveHome, saveHomeSettings, HomeSettings } from "@/store/slices/homeSlice";
import { fetchAds, Ad } from "@/store/slices/adsSlice";
import { fetchProducts } from "@/store/slices/productsSlice";
import { fetchStores } from "@/store/slices/storesSlice";
import { fetchAllMainCategories } from "@/store/slices/categoriesSlice";
import { HomeScreenDemo } from "@/components/dashboard/home/phone-simulator/HomeScreenDemo";
import { SectionsList } from "@/components/dashboard/home/SectionsList";
import { AdDialog } from "@/components/dashboard/ads/AdDialog";
import { AdSectionDialog } from "@/components/dashboard/ads/AdSectionDialog";
import { ProductSectionDialog } from "@/components/dashboard/home/ProductSectionDialog";
import { CategorySectionDialog } from "@/components/dashboard/home/CategorySectionDialog";
import { StoreSectionDialog } from "@/components/dashboard/home/StoreSectionDialog";
import { ALL_SECTIONS, ProductSectionKey } from "@/store/slices/homeSlice";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LuxuryDatePicker } from "@/components/ui/luxury-date-picker";
import {
    Save,
    Loader2,
    Home as HomeIcon,
    Smartphone,
    LayoutList,
    CheckCircle2,
    Settings2,
    Plus,
    X,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PHONE_W = 390;

export function Home() {
    const dispatch = useAppDispatch();

    const { config, loading, saving, isDirty, error } = useAppSelector((s) => s.home);
    const { ads } = useAppSelector((s) => s.ads);
    const products = useAppSelector((s) => (s as any).products?.products || []);
    const stores = useAppSelector((s) => (s as any).stores?.stores || []);
    const categories = useAppSelector((s) => (s as any).categories?.allMainCategories || []);

    const [leftTab, setLeftTab] = useState<'sections' | 'settings'>('sections');
    const [settingsForm, setSettingsForm] = useState<HomeSettings>({
        privecyPolicy: '', termsOfService: '', aboutUs: '', contactUs: [], expirePointsDate: null,
    });
    const [contactInput, setContactInput] = useState('');
    const [settingsSaving, setSettingsSaving] = useState(false);

    // Sync form when config loads
    useEffect(() => {
        if (!config) return;
        setSettingsForm({
            privecyPolicy: config.privecyPolicy ?? '',
            termsOfService: config.termsOfService ?? '',
            aboutUs: config.aboutUs ?? '',
            contactUs: config.contactUs ?? [],
            expirePointsDate: config.expirePointsDate
                ? new Date(config.expirePointsDate).toISOString().slice(0, 10)
                : null,
        });
    }, [config?._id]);

    const handleSettingsSave = async () => {
        if (!config) return;
        setSettingsSaving(true);
        try {
            await dispatch(saveHomeSettings(settingsForm)).unwrap();
            toast.success('Settings saved');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSettingsSaving(false);
        }
    };

    const addContact = () => {
        const val = contactInput.trim();
        if (!val) return;
        setSettingsForm((p) => ({ ...p, contactUs: [...(p.contactUs ?? []), val] }));
        setContactInput('');
    };

    const removeContact = (i: number) =>
        setSettingsForm((p) => ({ ...p, contactUs: (p.contactUs ?? []).filter((_, idx) => idx !== i) }));

    const [adDialogOpen, setAdDialogOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
    const [adSectionDialogOpen, setAdSectionDialogOpen] = useState(false);
    const [selectedAdSection, setSelectedAdSection] = useState<string | null>(null);
    const [productSectionOpen, setProductSectionOpen] = useState(false);
    const [selectedProductSection, setSelectedProductSection] = useState<ProductSectionKey | null>(null);
    const [categorySectionOpen, setCategorySectionOpen] = useState(false);
    const [logosSectionOpen, setLogosSectionOpen] = useState(false);

    const previewRef = useRef<HTMLDivElement>(null);
    const [phoneScale, setPhoneScale] = useState(0.85);

    const recalcScale = useCallback((el: HTMLDivElement) => {
        const availH = el.clientHeight - 48;   // 24px top + 24px bottom padding
        const availW = el.clientWidth - 40;    // 20px each side
        const scaleByH = availH / 844;
        const scaleByW = availW / PHONE_W;
        setPhoneScale(Math.max(Math.min(scaleByH, scaleByW), 0.45));
    }, []);

    useEffect(() => {
        if (loading) return;               
        const el = previewRef.current;
        if (!el) return;
        recalcScale(el);
        const ro = new ResizeObserver(() => recalcScale(el));
        ro.observe(el);
        return () => ro.disconnect();
    }, [recalcScale, loading]);            // re-run when loading finishes

    useEffect(() => {
        dispatch(fetchHome());
        dispatch(fetchAds({ limit: 50 }));
        dispatch(fetchProducts({ limit: 500 }));
        dispatch(fetchStores({ limit: 500 }));
        dispatch(fetchAllMainCategories());
    }, [dispatch]);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSave = async () => {
        if (!config) return;
        const { _id, createdAt, updatedAt, ...sections } = config as any;
        try {
            await dispatch(saveHome({ id: _id, data: sections })).unwrap();
            toast.success("Home settings saved successfully");
        } catch {
            toast.error("Failed to save settings");
        }
    };

    const activeCount = config ? ALL_SECTIONS.filter((k) => config[k]?.active).length : 0;

    return (
        <div className="flex flex-col h-full bg-background">

            {/* ── Top Header ── */}
            <div className="shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
                        <HomeIcon className="h-4.5 w-4.5 text-background" style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold leading-tight">Home Screen</h1>
                        <p className="text-xs text-muted-foreground">
                            {loading ? "Loading..." : `${activeCount} of ${ALL_SECTIONS.length} sections active`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Dirty indicator */}
                    {isDirty && !saving && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Unsaved changes
                        </span>
                    )}
                    {!isDirty && !loading && !saving && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Saved
                        </span>
                    )}

                    <Button
                        onClick={handleSave}
                        disabled={!isDirty || saving || loading}
                        size="sm"
                        className={cn("gap-1.5 h-8 px-3 transition-all", isDirty && !saving && "ring-1 ring-foreground/20")}
                    >
                        {saving
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Save className="h-3.5 w-3.5" />
                        }
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            {/* ── Body ── */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading home settings...</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left panel ── */}
                    <div className="w-[320px] shrink-0 flex flex-col border-r bg-muted/5">

                        {/* Tab bar */}
                        <div className="flex shrink-0 border-b bg-background">
                            <button
                                onClick={() => setLeftTab('sections')}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1.5 h-11 text-xs font-semibold border-b-2 transition-colors',
                                    leftTab === 'sections'
                                        ? 'border-foreground text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <LayoutList className="h-3.5 w-3.5" />
                                Sections
                                <span className="tabular-nums text-[10px] font-bold opacity-60">{activeCount}/{ALL_SECTIONS.length}</span>
                            </button>
                            <button
                                onClick={() => setLeftTab('settings')}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1.5 h-11 text-xs font-semibold border-b-2 transition-colors',
                                    leftTab === 'settings'
                                        ? 'border-foreground text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                Settings
                            </button>
                        </div>

                        {leftTab === 'sections' ? (
                            <ScrollArea className="flex-1">
                                <div className="p-3">
                                    <SectionsList
                                        onEditAdSection={(key) => { setSelectedAdSection(key); setAdSectionDialogOpen(true); }}
                                        onEditProductSection={(key) => { setSelectedProductSection(key); setProductSectionOpen(true); }}
                                        onEditCategories={() => setCategorySectionOpen(true)}
                                        onEditLogos={() => setLogosSectionOpen(true)}
                                    />
                                </div>
                            </ScrollArea>
                        ) : (
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-5">

                                    {/* Privacy Policy */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Privacy Policy</Label>
                                        <Textarea
                                            rows={4}
                                            placeholder="Enter privacy policy..."
                                            value={settingsForm.privecyPolicy ?? ''}
                                            onChange={(e) => setSettingsForm((p) => ({ ...p, privecyPolicy: e.target.value }))}
                                            className="text-xs resize-none"
                                        />
                                    </div>

                                    {/* Terms of Service */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Terms of Service</Label>
                                        <Textarea
                                            rows={4}
                                            placeholder="Enter terms of service..."
                                            value={settingsForm.termsOfService ?? ''}
                                            onChange={(e) => setSettingsForm((p) => ({ ...p, termsOfService: e.target.value }))}
                                            className="text-xs resize-none"
                                        />
                                    </div>

                                    {/* About Us */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">About Us</Label>
                                        <Textarea
                                            rows={4}
                                            placeholder="Enter about us..."
                                            value={settingsForm.aboutUs ?? ''}
                                            onChange={(e) => setSettingsForm((p) => ({ ...p, aboutUs: e.target.value }))}
                                            className="text-xs resize-none"
                                        />
                                    </div>

                                    {/* Contact Us */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Contact Us</Label>

                                        {/* Existing entries */}
                                        {(settingsForm.contactUs ?? []).length > 0 && (
                                            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                                                {settingsForm.contactUs!.map((c, i) => (
                                                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-background group">
                                                        <span className="text-[10px] tabular-nums text-muted-foreground/50 select-none w-4 shrink-0">{i + 1}</span>
                                                        <span className="flex-1 text-xs text-foreground truncate">{c}</span>
                                                        <button
                                                            onClick={() => removeContact(i)}
                                                            className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add new */}
                                        <div className="flex gap-1.5">
                                            <Input
                                                placeholder="Add phone or email..."
                                                value={contactInput}
                                                onChange={(e) => setContactInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addContact()}
                                                className="text-xs h-8"
                                            />
                                            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={addContact}>
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expire Points Date */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Expire Points Date</Label>
                                        <LuxuryDatePicker
                                            value={settingsForm.expirePointsDate ?? null}
                                            onChange={(v) => setSettingsForm((p) => ({ ...p, expirePointsDate: v }))}
                                        />
                                    </div>

                                    <Button
                                        className="w-full gap-1.5 h-8"
                                        size="sm"
                                        disabled={settingsSaving}
                                        onClick={handleSettingsSave}
                                    >
                                        {settingsSaving
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Save className="h-3.5 w-3.5" />}
                                        {settingsSaving ? 'Saving...' : 'Save Settings'}
                                    </Button>

                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* ── Right panel: Preview ── */}
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* Panel header */}
                        <div className="flex items-center justify-between px-5 h-11 border-b bg-background shrink-0">
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-semibold">Preview</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </span>
                            </div>
                        </div>

                        {/* Preview area */}
                        <div
                            ref={previewRef}
                            className="flex-1 overflow-y-auto overflow-x-hidden flex items-start justify-center"
                            style={{
                                background: "radial-gradient(ellipse at 50% 0%, hsl(var(--muted)/0.8) 0%, hsl(var(--background)) 70%)",
                                padding: '24px 20px',
                            }}
                        >
                            <div className="flex justify-center">
                                <HomeScreenDemo
                                    config={config}
                                    ads={ads}
                                    products={products}
                                    stores={stores}
                                    categories={categories}
                                    scale={phoneScale}
                                    onEditAd={(ad) => { setSelectedAd(ad); setAdDialogOpen(true); }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* ── Dialogs ── */}
            <AdDialog open={adDialogOpen} onOpenChange={setAdDialogOpen} adToEdit={selectedAd} />
            <AdSectionDialog open={adSectionDialogOpen} onOpenChange={setAdSectionDialogOpen} adType={selectedAdSection} />
            <ProductSectionDialog open={productSectionOpen} onOpenChange={setProductSectionOpen} sectionKey={selectedProductSection} />
            <CategorySectionDialog open={categorySectionOpen} onOpenChange={setCategorySectionOpen} />
            <StoreSectionDialog open={logosSectionOpen} onOpenChange={setLogosSectionOpen} />
        </div>
    );
}
