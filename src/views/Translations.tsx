"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Languages,
  Search,
  Save,
  SaveAll,
  Loader2,
  RefreshCw,
  Grid,
  Tag,
  Gift,
  Megaphone,
  Globe,
  Wrench,
  Bell,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Store as StoreIcon,
} from "lucide-react";
import {
  categoriesAPI,
  tagsAPI,
  pointsStoreAPI,
  notificationsAPI,
  adsAPI,
  websiteAdsAPI,
  productsAPI,
  storesAPI,
} from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

const LANGS = ["ar", "en", "ch", "tr", "ku"] as const;
type Lang = (typeof LANGS)[number];

const LANG_LABELS: Record<Lang, string> = {
  ar: "العربية",
  en: "English",
  ch: "中文",
  tr: "Türkçe",
  ku: "Kurdî",
};

interface FieldConfig {
  key: string;
  label: string;
  multiline: boolean;
}

interface ModelConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  fetchFn: (params: any) => Promise<any>;
  updateFn: (id: string, data: any) => Promise<any>;
  extractItems: (res: any) => any[];
  extractTotal: (res: any) => number;
  fields: FieldConfig[];
  getRef: (item: any) => string;
}

// ── Model configuration ────────────────────────────────────────────────────────

const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: "categories",
    label: "Categories",
    icon: Grid,
    fetchFn: (p) => categoriesAPI.getAll(p),
    updateFn: (id, data) => categoriesAPI.update(id, data),
    extractItems: (res) => res.data?.categories ?? [],
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [{ key: "title", label: "Title", multiline: false }],
    getRef: (item) => item.title?.ar || item.title || "—",
  },
  {
    id: "tags",
    label: "Tags",
    icon: Tag,
    fetchFn: (p) => tagsAPI.getAll(p),
    updateFn: (id, data) => tagsAPI.update(id, data),
    extractItems: (res) => res.data?.tags ?? [],
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [{ key: "title", label: "Title", multiline: false }],
    getRef: (item) => item.title?.ar || item.title || "—",
  },
  {
    id: "points-store",
    label: "Points Store",
    icon: Gift,
    fetchFn: (p) => pointsStoreAPI.getAll(p),
    updateFn: (id, data) => pointsStoreAPI.update(id, data),
    extractItems: (res) => {
      const d = res.data;
      if (!d) return [];
      return (
        d.items ??
        d.pointsStoreItems ??
        (Object.values(d).find(Array.isArray) as any[]) ??
        []
      );
    },
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [
      { key: "title", label: "Title", multiline: false },
      { key: "description", label: "Description", multiline: true },
    ],
    getRef: (item) => item.title?.ar || item.title || "—",
  },
  {
    id: "stores",
    label: "Stores",
    icon: StoreIcon,
    fetchFn: (p) => storesAPI.getAll(p),
    updateFn: (id, data) => storesAPI.update(id, data),
    extractItems: (res) => res.data?.stores ?? [],
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [
      { key: "title", label: "Title", multiline: false },
      { key: "description", label: "Description", multiline: true },
    ],
    getRef: (item) => item.title?.ar || item.title || "—",
  },
  {
    id: "ads",
    label: "App Ads",
    icon: Megaphone,
    fetchFn: (p) => adsAPI.getAll(p),
    updateFn: (id, data) => adsAPI.update(id, data),
    extractItems: (res) => res.data?.ads ?? [],
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [
      { key: "titleText", label: "Title", multiline: false },
      { key: "descriptionText", label: "Description", multiline: true },
      { key: "ctaBtnText", label: "CTA Button", multiline: false },
      { key: "adTitleImageOverlay", label: "Image Title", multiline: false },
      { key: "adDescriptionImageOverlay", label: "Image Description", multiline: true },
      { key: "logoDescription", label: "Logo Description", multiline: false },
    ],
    getRef: (item) => item.titleText?.ar || item.titleText || "—",
  },
  {
    id: "website-ads",
    label: "Website Ads",
    icon: Globe,
    fetchFn: (p) => websiteAdsAPI.getAll(p),
    updateFn: (id, data) => websiteAdsAPI.update(id, data),
    extractItems: (res) => res.data?.websiteAds ?? [],
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [{ key: "title", label: "Title", multiline: false }],
    getRef: (item) => item.title?.ar || item.title || "—",
  },
  {
    id: "products",
    label: "Products",
    icon: Wrench,
    fetchFn: (p) => productsAPI.getAll(p),
    updateFn: (id, data) => productsAPI.update(id, data),
    extractItems: (res) => res.data?.products ?? [],
    extractTotal: (res) => res.results ?? res.total ?? 0,
    fields: [
      { key: "name", label: "Name", multiline: false },
      { key: "generalDescription", label: "Description", multiline: true },
      { key: "techSpecs", label: "Tech Specs", multiline: true },
      { key: "specialSpecs", label: "Special Specs", multiline: true },
    ],
    getRef: (item) => item.name?.ar || item.name || "—",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRowKey(itemId: string, fieldKey: string) {
  return `${itemId}:${fieldKey}`;
}

function getLangValue(item: any, fieldKey: string, lang: Lang): string {
  const val = item[fieldKey];
  if (!val) return "";
  if (typeof val === "object") return val[lang] ?? "";
  return typeof val === "string" ? val : "";
}

// Row status: which state a row is in
type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

// ── Component ─────────────────────────────────────────────────────────────────

const Translations: React.FC = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("categories");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");

  // Pending edits: key = "itemId:fieldKey" → { ar, en, ch, tr, ku }
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, string>>>({});

  // Per-row status tracking
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());  // ✓ shown briefly
  const [errorKeys, setErrorKeys] = useState<Set<string>>(new Set());  // ✗ shown until retry

  // Global saving flag (Save All in progress)
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Tab switch guard
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);

  // Timers for "saved" visual state auto-clear
  const savedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const activeModel = MODEL_CONFIGS.find((m) => m.id === activeTab)!;
  const dirtyCount = Object.keys(editedValues).length;
  const hasUnsaved = dirtyCount > 0;

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadItems = useCallback(async () => {
    const model = MODEL_CONFIGS.find((m) => m.id === activeTab)!;
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      const res = await model.fetchFn(params);
      if (res.status === "success") {
        setItems(model.extractItems(res));
        setTotal(model.extractTotal(res));
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, search, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const markSaved = (keys: string[]) => {
    setSavedKeys((prev) => {
      const s = new Set(prev);
      keys.forEach((k) => s.add(k));
      return s;
    });
    setErrorKeys((prev) => {
      const s = new Set(prev);
      keys.forEach((k) => s.delete(k));
      return s;
    });
    // Auto-clear the "saved" visual after 2.5s
    keys.forEach((k) => {
      if (savedTimers.current.has(k)) clearTimeout(savedTimers.current.get(k)!);
      const t = setTimeout(() => {
        setSavedKeys((prev) => { const s = new Set(prev); s.delete(k); return s; });
        savedTimers.current.delete(k);
      }, 2500);
      savedTimers.current.set(k, t);
    });
  };

  const markError = (keys: string[]) => {
    setErrorKeys((prev) => {
      const s = new Set(prev);
      keys.forEach((k) => s.add(k));
      return s;
    });
  };

  const getRowStatus = (itemId: string, fieldKey: string): RowStatus => {
    const k = getRowKey(itemId, fieldKey);
    if (savingKeys.has(k)) return "saving";
    if (savedKeys.has(k)) return "saved";
    if (errorKeys.has(k)) return "error";
    if (k in editedValues) return "dirty";
    return "idle";
  };

  // Commit multiple fields for one item in a single PATCH call
  const commitItem = async (
    model: ModelConfig,
    item: any,
    fields: Record<string, Record<string, string>>,
    rowKeys: string[]
  ) => {
    setSavingKeys((prev) => { const s = new Set(prev); rowKeys.forEach((k) => s.add(k)); return s; });
    try {
      await model.updateFn(item._id, fields);
      // Patch local item state
      setItems((prev) =>
        prev.map((i) =>
          i._id === item._id
            ? { ...i, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { ...v }])) }
            : i
        )
      );
      // Clear dirty state
      setEditedValues((prev) => {
        const next = { ...prev };
        rowKeys.forEach((k) => delete next[k]);
        return next;
      });
      markSaved(rowKeys);
      return true;
    } catch {
      markError(rowKeys);
      return false;
    } finally {
      setSavingKeys((prev) => { const s = new Set(prev); rowKeys.forEach((k) => s.delete(k)); return s; });
    }
  };

  // ── Tab change guard ────────────────────────────────────────────────────────

  const handleTabChange = (tabId: string) => {
    if (hasUnsaved) {
      setPendingTabChange(tabId);
      return;
    }
    doTabChange(tabId);
  };

  const doTabChange = (tabId: string) => {
    // Clear saved timers
    savedTimers.current.forEach((t) => clearTimeout(t));
    savedTimers.current.clear();
    setActiveTab(tabId);
    setPage(1);
    setSearch("");
    setItems([]);
    setTotal(0);
    setEditedValues({});
    setSavingKeys(new Set());
    setSavedKeys(new Set());
    setErrorKeys(new Set());
    setPendingTabChange(null);
  };

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const handleCellChange = (item: any, fieldKey: string, lang: Lang, value: string) => {
    const rowKey = getRowKey(item._id, fieldKey);
    // If this row had an error, clear it when user starts editing again
    setErrorKeys((prev) => { const s = new Set(prev); s.delete(rowKey); return s; });
    setEditedValues((prev) => {
      const base =
        prev[rowKey] ??
        Object.fromEntries(LANGS.map((l) => [l, getLangValue(item, fieldKey, l)]));
      const nextRow = { ...base, [lang]: value };

      // If all language values match the original values again, clear dirty state
      const allMatchOriginal = LANGS.every(
        (l) => nextRow[l] === getLangValue(item, fieldKey, l)
      );

      const next = { ...prev };
      if (allMatchOriginal) {
        delete next[rowKey];
      } else {
        next[rowKey] = nextRow;
      }
      return next;
    });
  };

  const getDisplayValue = (item: any, fieldKey: string, lang: Lang): string => {
    const rowKey = getRowKey(item._id, fieldKey);
    return editedValues[rowKey]?.[lang] ?? getLangValue(item, fieldKey, lang);
  };

  const handleDiscard = (itemId: string, fieldKey: string) => {
    const rowKey = getRowKey(itemId, fieldKey);
    setEditedValues((prev) => { const next = { ...prev }; delete next[rowKey]; return next; });
    setErrorKeys((prev) => { const s = new Set(prev); s.delete(rowKey); return s; });
  };

  const handleDiscardAll = () => {
    savedTimers.current.forEach((t) => clearTimeout(t));
    savedTimers.current.clear();
    setEditedValues({});
    setErrorKeys(new Set());
    setSavedKeys(new Set());
  };

  // ── Save single row (one field) ────────────────────────────────────────────

  const handleSaveRow = async (item: any, fieldKey: string) => {
    const model = MODEL_CONFIGS.find((m) => m.id === activeTab)!;
    const rowKey = getRowKey(item._id, fieldKey);
    const values = editedValues[rowKey];
    if (!values) return;

    const ok = await commitItem(model, item, { [fieldKey]: values }, [rowKey]);
    if (ok) toast({ title: "Saved" });
    else toast({ variant: "destructive", title: "Failed to save", description: "Click retry to try again" });
  };

  // ── Save All (all dirty rows, grouped by item — one PATCH per item) ────────

  const handleSaveAll = async () => {
    const model = MODEL_CONFIGS.find((m) => m.id === activeTab)!;
    if (!hasUnsaved || isSavingAll) return;

    // Group dirty keys by itemId
    const byItem: Record<string, { fields: Record<string, Record<string, string>>; keys: string[] }> = {};
    for (const rowKey of Object.keys(editedValues)) {
      const colonIdx = rowKey.indexOf(":");
      const itemId = rowKey.slice(0, colonIdx);
      const fieldKey = rowKey.slice(colonIdx + 1);
      if (!byItem[itemId]) byItem[itemId] = { fields: {}, keys: [] };
      byItem[itemId].fields[fieldKey] = editedValues[rowKey];
      byItem[itemId].keys.push(rowKey);
    }

    const allRowKeys = Object.values(byItem).flatMap((g) => g.keys);
    setIsSavingAll(true);
    setSavingKeys(new Set(allRowKeys));

    const entries = Object.entries(byItem);
    const results = await Promise.allSettled(
      entries.map(([itemId, { fields }]) => {
        const item = items.find((i) => i._id === itemId);
        if (!item) return Promise.reject(new Error("Item not found"));
        return model.updateFn(itemId, fields).then(() => ({ itemId, fields }));
      })
    );

    const successKeys: string[] = [];
    const failedKeys: string[] = [];

    results.forEach((result, idx) => {
      const { keys, fields } = entries[idx][1];
      const itemId = entries[idx][0];
      if (result.status === "fulfilled") {
        successKeys.push(...keys);
        // Patch local state
        setItems((prev) =>
          prev.map((i) =>
            i._id === itemId
              ? { ...i, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { ...v }])) }
              : i
          )
        );
      } else {
        failedKeys.push(...keys);
      }
    });

    // Clear dirty state for successes
    setEditedValues((prev) => {
      const next = { ...prev };
      successKeys.forEach((k) => delete next[k]);
      return next;
    });

    setSavingKeys(new Set());
    setIsSavingAll(false);

    if (successKeys.length > 0) markSaved(successKeys);
    if (failedKeys.length > 0) markError(failedKeys);

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.filter((r) => r.status === "rejected").length;

    if (failCount === 0) {
      toast({ title: "All saved", description: `${successCount} item${successCount !== 1 ? "s" : ""} updated successfully` });
    } else if (successCount === 0) {
      toast({ variant: "destructive", title: "Save failed", description: "None of the items could be saved" });
    } else {
      toast({
        variant: "destructive",
        title: "Partially saved",
        description: `${successCount} saved, ${failCount} failed — failed rows are highlighted in red`,
      });
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit) || 1;
  // Field col + lang cols
  const colSpan = LANGS.length + 1;

  const rows = items.flatMap((item) =>
    activeModel.fields.map((field, idx) => ({ item, field, isFirst: idx === 0 }))
  );

  // ── Cell renderer ──────────────────────────────────────────────────────────

  const renderInputCell = (item: any, field: FieldConfig, lang: Lang) => {
    const rowKey = getRowKey(item._id, field.key);
    const status = getRowStatus(item._id, field.key);
    const value = getDisplayValue(item, field.key, lang);
    const disabled = status === "saving" || isSavingAll;
    const isRTL = lang === "ar";

    const sharedClass = cn(
      "w-full min-w-[150px] px-2 py-1.5 text-sm bg-transparent border border-transparent rounded",
      "hover:border-border/50 focus:border-primary focus:bg-card focus:outline-none",
      "transition-colors disabled:opacity-40",
      status === "error" && "border-destructive/40 hover:border-destructive"
    );

    if (field.multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleCellChange(item, field.key, lang, e.target.value)}
          disabled={disabled}
          dir={isRTL ? "rtl" : "ltr"}
          rows={2}
          className={cn(sharedClass, "resize-none min-h-[56px]")}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleCellChange(item, field.key, lang, e.target.value)}
        disabled={disabled}
        dir={isRTL ? "rtl" : "ltr"}
        className={sharedClass}
      />
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Languages className="w-7 h-7" />
          Localization
        </h1>
        <p className="text-muted-foreground">
          Manage multilingual content (AR · EN · CH · TR · KU) across all models
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>

        {/* Model tabs */}
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {MODEL_CONFIGS.map((m) => (
            <TabsTrigger key={m.id} value={m.id} className="flex items-center gap-1.5 text-sm">
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {MODEL_CONFIGS.map((m) => (
          <TabsContent key={m.id} value={m.id} className="space-y-4 mt-4">

            {/* Controls row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>

              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={loadItems}
                disabled={loading || isSavingAll}
                className="h-9 w-9"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>

              {/* Unsaved indicator + bulk actions */}
              {hasUnsaved && (
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    {dirtyCount} unsaved
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardAll}
                    disabled={isSavingAll}
                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard all
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={isSavingAll}
                    className="h-8 gap-1.5 bg-primary hover:bg-primary/90 shadow-sm"
                  >
                    {isSavingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <SaveAll className="w-3.5 h-3.5" />
                    )}
                    {isSavingAll ? "Saving…" : "Save all"}
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="rounded-lg border shadow-sm bg-card overflow-x-auto">
              <Table className="min-w-max">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="min-w-[120px] font-semibold sticky left-0 bg-muted/30 z-10">
                      Field
                    </TableHead>
                    {LANGS.map((lang) => (
                      <TableHead key={lang} className="min-w-[170px] font-semibold">
                        {LANG_LABELS[lang]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(({ item, field, isFirst }) => {
                      const status = getRowStatus(item._id, field.key);
                      const showItemHeader = isFirst && activeModel.fields.length > 1;

                      return (
                        <React.Fragment key={getRowKey(item._id, field.key)}>
                          {showItemHeader && (
                            <TableRow className="border-t-2 border-t-border/50 bg-muted/40 hover:bg-muted/40">
                              <TableCell colSpan={colSpan} className="py-1.5 px-3">
                                <span className="text-xs font-semibold text-foreground/60 truncate">
                                  {activeModel.getRef(item)}
                                </span>
                              </TableCell>
                            </TableRow>
                          )}
                        <TableRow
                          className={cn(
                            "transition-all duration-200",
                            !showItemHeader && isFirst && "border-t-2 border-t-border/40",
                            status === "dirty"   && "bg-amber-500/5 border-l-[3px] border-l-amber-500",
                            status === "saving"  && "bg-primary/5 border-l-[3px] border-l-primary opacity-70",
                            status === "saved"   && "bg-emerald-500/5 border-l-[3px] border-l-emerald-500",
                            status === "error"   && "bg-destructive/5 border-l-[3px] border-l-destructive",
                          )}
                        >
                          {/* Field label + inline actions — sticky left, always visible */}
                          <TableCell className={cn(
                            "align-top py-2 sticky left-0 z-10 transition-colors",
                            status === "dirty"  && "bg-amber-500/5",
                            status === "saving" && "bg-primary/5",
                            status === "saved"  && "bg-emerald-500/5",
                            status === "error"  && "bg-destructive/5",
                            status === "idle"   && "bg-card",
                          )}>
                            <div className="flex items-center gap-2">
                              {/* Per-row actions — small icons beside field */}
                              <div className="flex items-center gap-1.5 min-h-[24px]">
                                {/* Saving spinner */}
                                {status === "saving" && (
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                )}

                                {/* Saved checkmark */}
                                {status === "saved" && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                )}

                                {/* Error state */}
                                {status === "error" && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleSaveRow(item, field.key)}
                                    disabled={isSavingAll}
                                    className="h-7 w-7 p-0 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </Button>
                                )}

                                {/* Dirty state: discard + save row */}
                                {status === "dirty" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDiscard(item._id, field.key)}
                                      disabled={isSavingAll}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      onClick={() => handleSaveRow(item, field.key)}
                                      disabled={isSavingAll}
                                      className="h-7 w-7 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>

                              <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
                                {field.label}
                              </Badge>
                            </div>
                          </TableCell>

                          {/* Language input cells */}
                          {LANGS.map((lang) => (
                            <TableCell key={lang} className="align-top p-1">
                              {renderInputCell(item, field, lang)}
                            </TableCell>
                          ))}
                        </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">
                {total > 0 ? `${total} total · Page ${page} of ${totalPages}` : "No results"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>

          </TabsContent>
        ))}
      </Tabs>

      {/* Tab switch guard dialog */}
      <AlertDialog open={pendingTabChange !== null} onOpenChange={(open) => { if (!open) setPendingTabChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Unsaved changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have <strong>{dirtyCount}</strong> unsaved change{dirtyCount !== 1 ? "s" : ""} on this tab.
              Switching tabs will discard them permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTabChange(null)}>
              Stay here
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingTabChange && doTabChange(pendingTabChange)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Discard & switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
};

export default Translations;
