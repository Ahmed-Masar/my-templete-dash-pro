"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingCart,
  BarChart2,
  DollarSign,
  Box,
  Store,
  Grid,
  Tag,
  Star,
  Users,
  Briefcase,
  Wrench,
  UserCog,
  ShoppingBag,
  CircleDollarSign,
  Wallet,
  Award,
  MessageSquare,
} from "lucide-react";
import { apiHelpers } from "@/lib/axios";
import { ApiResponse } from "@/lib/api";
import { formatIQD } from "@/lib/currency";
import { useAppSelector } from "@/store/hooks";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type LangField = string | { en?: string; ar?: string } | undefined | null;

interface DashboardStats {
  totals: {
    products: number;
    stores: number;
    categories: number;
    tags: number;
    reviews: number;
    users: {
      total: number;
      user: number;
      vendor: number;
      technician: number;
      admin: number;
      sales: number;
    };
    carts: {
      total: number;
      draft: number;
      generated: number;
      completed: number;
      cancelled: number;
    };
  };
  financial: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalPointsIssued: number;
    totalVendorPointsIssued: number;
    profit: {
      totalRevenue: number;
      totalJumlaaCost: number;
      grossProfit: number;
    };
    pointsInWallets: {
      totalUserPoints: number;
      totalVendorPoints: number;
    };
  };
  topProducts: Array<{
    name: LangField;
    store: LangField;
    price: number;
    jumlaaPrice: number;
    avgRating: number;
    soldCount?: number;
    quantitySold?: number;
  }>;
  topStoresByProducts: Array<{
    name: LangField;
    productCount: number;
  }>;
  topStoresByOrders: Array<{
    name: LangField;
    revenue: number;
    orderCount?: number;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveName(field: LangField): string {
  if (!field) return "—";
  if (typeof field === "string") return field || "—";
  return field.en || field.ar || "—";
}

function fNum(n: number | undefined | null): string {
  if (n == null || isNaN(n as number)) return "0";
  return (n as number).toLocaleString("en-US");
}

function fPct(a: number, b: number): string {
  if (!b) return "0%";
  return `${((a / b) * 100).toFixed(1)}%`;
}

function safePct(a: number, b: number): number {
  if (!b) return 0;
  return Math.min(100, (a / b) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton pulse
// ─────────────────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return (
    <div className={cn("bg-muted/60 animate-pulse rounded-lg", className)} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header — eyebrow + gradient rule
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 mb-5", className)}>
      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/55 shrink-0 select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium card base
// ─────────────────────────────────────────────────────────────────────────────

const CARD =
  "bg-card border border-border/40 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_4px_18px_rgba(0,0,0,0.05)]";

// ─────────────────────────────────────────────────────────────────────────────
// Rank badge
// ─────────────────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-[11px] font-bold bg-warning/15 text-warning border border-warning/25">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full text-[11px] font-semibold bg-muted/80 text-muted-foreground/80">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 text-[11px] tabular-nums text-muted-foreground/40 font-medium">
      {rank}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Star rating
// ─────────────────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star className="h-3 w-3 text-warning fill-current shrink-0" />
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {(rating || 0).toFixed(1)}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slim progress bar
// ─────────────────────────────────────────────────────────────────────────────

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  return (
    <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          className ?? "bg-foreground/20"
        )}
        style={{ width: `${safePct(value, max)}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-1.5 pb-5">
        <Sk className="h-6 w-52 rounded-md" />
        <Sk className="h-3.5 w-36 rounded-md" />
      </div>
      <div className="space-y-4">
        <Sk className="h-3 w-32 rounded-md" />
        <Sk className="h-36 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Sk className="h-3 w-32 rounded-md" />
        <Sk className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Sk className="h-52 rounded-xl" />
          <Sk className="h-52 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Sk className="h-3 w-32 rounded-md" />
        <Sk className="h-52 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Sk className="h-3 w-32 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Sk className="h-40 rounded-xl" />
          <Sk className="h-40 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Sk className="h-3 w-32 rounded-md" />
        <Sk className="h-[28rem] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Sk className="h-64 rounded-xl" />
          <Sk className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Overview() {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiHelpers.get<ApiResponse<DashboardStats>>(
          "/dashboard/stats"
        );
        if (res.status === "success") {
          setStats(res.data);
        } else {
          setError(res.message ?? "Could not load dashboard stats.");
        }
      } catch {
        setError("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <OverviewSkeleton />;

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <BarChart2 className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          {error ?? "No data available."}
        </p>
      </div>
    );
  }

  // ── Normalise potentially missing nested objects ──────────────────────────
  const totals = stats.totals ?? ({} as DashboardStats["totals"]);
  const financial = stats.financial ?? ({} as DashboardStats["financial"]);
  const safeUsers = totals.users ?? {
    total: 0,
    user: 0,
    vendor: 0,
    technician: 0,
    admin: 0,
    sales: 0,
  };
  const safeCarts = totals.carts ?? {
    total: 0,
    draft: 0,
    generated: 0,
    completed: 0,
    cancelled: 0,
  };
  const profit = financial.profit ?? {
    totalRevenue: 0,
    totalJumlaaCost: 0,
    grossProfit: 0,
  };
  const pointsInWallets = financial.pointsInWallets ?? {
    totalUserPoints: 0,
    totalVendorPoints: 0,
  };

  const grossMarginPct =
    profit.totalRevenue > 0
      ? ((profit.grossProfit / profit.totalRevenue) * 100).toFixed(1)
      : "0";
  const jumlaaPct =
    profit.totalRevenue > 0
      ? ((profit.totalJumlaaCost / profit.totalRevenue) * 100).toFixed(1)
      : "0";
  const totalIssued =
    (financial.totalPointsIssued || 0) +
    (financial.totalVendorPointsIssued || 0);
  const totalInWallets =
    (pointsInWallets.totalUserPoints || 0) +
    (pointsInWallets.totalVendorPoints || 0);

  const maxStoreProducts =
    (stats.topStoresByProducts && stats.topStoresByProducts[0]?.productCount) || 1;
  const maxStoreRevenue = (stats.topStoresByOrders && stats.topStoresByOrders[0]?.revenue) || 1;
  const maxSoldQty = Math.max(
    1,
    ...(stats.topProducts || []).map(
      (p) => p.soldCount ?? p.quantitySold ?? 0
    )
  );

  const userRoles = [
    { label: "Customers", value: safeUsers.user },
    { label: "Vendors", value: safeUsers.vendor },
    { label: "Technicians", value: safeUsers.technician },
    { label: "Admins", value: safeUsers.admin },
    { label: "Sales", value: safeUsers.sales },
  ];

  const cartStatuses = [
    {
      label: "Completed",
      value: safeCarts.completed,
      bar: "bg-success/55",
      text: "text-success",
      dot: "bg-success",
    },
    {
      label: "Generated",
      value: safeCarts.generated,
      bar: "bg-foreground/30",
      text: "text-foreground",
      dot: "bg-foreground/50",
    },
    {
      label: "Draft",
      value: safeCarts.draft,
      bar: "bg-muted-foreground/25",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground/50",
    },
    {
      label: "Cancelled",
      value: safeCarts.cancelled,
      bar: "bg-destructive/35",
      text: "text-destructive/80",
      dot: "bg-destructive/60",
    },
  ];

  return (
    <div className="space-y-10 pb-8 animate-fade-in">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Page header                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between pb-5 border-b border-border/30">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {greeting},{" "}
            <span className="font-bold">{user?.name ?? "Admin"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">
            {today}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground select-none">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-ping opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Hero KPI band                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader label="Executive Summary" />

        {/* Single panel, internally divided with gap-px trick */}
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            "gap-px bg-border/30 rounded-xl overflow-hidden",
            "shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_6px_24px_rgba(0,0,0,0.07)]",
            "border border-border/40"
          )}
        >
          {/* ── Total Revenue — inverted primary tile ── */}
          <div className="relative bg-foreground p-6 flex flex-col gap-4 overflow-hidden">
            {/* Subtle inner vignette */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/20 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-primary-foreground/45 select-none">
                Total Revenue
              </span>
              <div className="w-7 h-7 rounded-md bg-primary-foreground/8 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary-foreground/50" />
              </div>
            </div>
            <div className="relative">
              <div className="text-3xl font-bold tracking-tight leading-none text-primary-foreground">
                {formatIQD(financial.totalRevenue)}
              </div>
              <div className="text-xs text-primary-foreground/40 mt-2">
                {fNum(financial.totalOrders)} orders &middot; avg{" "}
                {formatIQD(financial.avgOrderValue)}
              </div>
            </div>
          </div>

          {/* ── Gross Profit ── */}
          <div className="bg-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-muted-foreground/60 select-none">
                Gross Profit
              </span>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight leading-none text-success">
                {formatIQD(profit.grossProfit)}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-success/70 bg-success/10 px-1.5 py-0.5 rounded-full">
                  {grossMarginPct}%
                </span>
                <span className="text-xs text-muted-foreground">
                  gross margin
                </span>
              </div>
            </div>
          </div>

          {/* ── Total Orders ── */}
          <div className="bg-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-muted-foreground/60 select-none">
                Total Orders
              </span>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight leading-none text-foreground">
                {fNum(financial.totalOrders)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Fulfilled orders placed
              </div>
            </div>
          </div>

          {/* ── Avg Order Value ── */}
          <div className="bg-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-muted-foreground/60 select-none">
                Avg Order Value
              </span>
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight leading-none text-foreground">
                {formatIQD(financial.avgOrderValue)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Average per transaction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Business structure                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader label="Business Structure" />

        {/* ── Catalog strip — 5 stats horizontal band ── */}
        <div
          className={cn(
            CARD,
            "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border/25 mb-4"
          )}
        >
          {[
            { label: "Products", value: totals.products, icon: Box },
            { label: "Stores", value: totals.stores, icon: Store },
            { label: "Categories", value: totals.categories, icon: Grid },
            { label: "Tags", value: totals.tags, icon: Tag },
            {
              label: "Reviews",
              value: totals.reviews,
              icon: MessageSquare,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card px-5 py-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/60">
                  {label}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {fNum(value)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Users + Carts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* User Distribution */}
          <div className={CARD}>
            <div className="px-5 pt-5 pb-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  User Distribution
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {fNum(safeUsers.total)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  total
                </span>
              </div>
            </div>
            <div className="p-5 space-y-3.5">
              {userRoles.map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        {fPct(value, safeUsers.total)}
                      </span>
                      <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">
                        {fNum(value)}
                      </span>
                    </div>
                  </div>
                  <Bar value={value} max={safeUsers.total} />
                </div>
              ))}
            </div>
          </div>

          {/* Cart Pipeline */}
          <div className={CARD}>
            <div className="px-5 pt-5 pb-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  Cart Pipeline
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {fNum(safeCarts.total)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  total
                </span>
              </div>
            </div>
            <div className="p-5">
              {/* Segmented bar — thick, with gap-px technique */}
              <div className="flex h-2.5 gap-px rounded-full overflow-hidden mb-5">
                {cartStatuses.map(({ label, value, bar }) => {
                  const w = safePct(value, safeCarts.total);
                  return w > 0 ? (
                    <div
                      key={label}
                      className={cn("h-full", bar)}
                      style={{ width: `${w}%` }}
                    />
                  ) : null;
                })}
              </div>
              <div className="space-y-3">
                {cartStatuses.map(({ label, value, dot, text }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)}
                      />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn("font-semibold tabular-nums", text)}
                      >
                        {fNum(value)}
                      </span>
                      <span className="text-muted-foreground/40 tabular-nums w-10 text-right">
                        {fPct(value, safeCarts.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Profit analysis                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader label="Financials" />
        <div className={CARD}>

          {/* Three numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
            <div className="p-6">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/60 mb-3 select-none">
                Total Revenue
              </p>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatIQD(profit.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                100% — baseline
              </p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/60 mb-3 select-none">
                Jumlaa Cost
              </p>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatIQD(profit.totalJumlaaCost)}
              </div>
              <p className="text-xs text-destructive/60 mt-1.5">
                {jumlaaPct}% of revenue
              </p>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/60 mb-3 select-none">
                Gross Profit
              </p>
              <div className="text-2xl font-bold tracking-tight text-success">
                {formatIQD(profit.grossProfit)}
              </div>
              <p className="text-xs text-success/60 mt-1.5">
                {grossMarginPct}% margin
              </p>
            </div>
          </div>

          {/* Visual bars + margin badge */}
          <div className="px-6 py-5 border-t border-border/30 bg-muted/20 space-y-2.5">
            {[
              {
                label: "Revenue",
                value: profit.totalRevenue,
                max: profit.totalRevenue,
                bar: "bg-foreground/18",
              },
              {
                label: "Jumlaa Cost",
                value: profit.totalJumlaaCost,
                max: profit.totalRevenue,
                bar: "bg-destructive/30",
              },
              {
                label: "Gross Profit",
                value: profit.grossProfit,
                max: profit.totalRevenue,
                bar: "bg-success/45",
              },
            ].map(({ label, value, max, bar }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-24 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      bar
                    )}
                    style={{ width: `${safePct(value, max)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">
                  {fPct(value, max)}
                </span>
              </div>
            ))}
            {/* Margin callout */}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t border-border/25">
              <span className="text-xs text-muted-foreground">Gross margin</span>
              <span className="text-sm font-bold text-success px-2 py-0.5 bg-success/10 rounded-full border border-success/15">
                {grossMarginPct}%
              </span>
              <span className="text-xs text-muted-foreground/50 ml-auto">
                Revenue − Jumlaa Cost ÷ Revenue
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Loyalty & points                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader label="Loyalty & Points" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Points Issued */}
          <div className={CARD}>
            <div className="px-5 pt-5 pb-4 border-b border-border/30 flex items-center gap-2">
              <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                Points Issued
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    User Points
                  </p>
                  <div className="text-xl font-bold tracking-tight text-foreground">
                    {fNum(financial.totalPointsIssued)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Issued to customers
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    Vendor Points
                  </p>
                  <div className="text-xl font-bold tracking-tight text-foreground">
                    {fNum(financial.totalVendorPointsIssued)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Issued to vendors
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Total issued</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {fNum(totalIssued)}
                  </span>
                </div>
                <Bar
                  value={financial.totalPointsIssued}
                  max={totalIssued}
                  className="bg-foreground/22"
                />
                <div className="flex justify-between text-[10px] mt-1.5 text-muted-foreground/50">
                  <span>
                    Customers{" "}
                    {fPct(financial.totalPointsIssued, totalIssued)}
                  </span>
                  <span>
                    Vendors{" "}
                    {fPct(financial.totalVendorPointsIssued, totalIssued)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Points in Wallets */}
          <div className={CARD}>
            <div className="px-5 pt-5 pb-4 border-b border-border/30 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                Points in Wallets
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    User Wallets
                  </p>
                  <div className="text-xl font-bold tracking-tight text-foreground">
                    {fNum(pointsInWallets.totalUserPoints)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fPct(
                      pointsInWallets.totalUserPoints,
                      financial.totalPointsIssued
                    )}{" "}
                    retained
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    Vendor Wallets
                  </p>
                  <div className="text-xl font-bold tracking-tight text-foreground">
                    {fNum(pointsInWallets.totalVendorPoints)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fPct(
                      pointsInWallets.totalVendorPoints,
                      financial.totalVendorPointsIssued
                    )}{" "}
                    retained
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">
                    Total in wallets
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {fNum(totalInWallets)}
                  </span>
                </div>
                <Bar
                  value={totalInWallets}
                  max={totalIssued}
                  className="bg-foreground/22"
                />
                <div className="flex justify-between text-[10px] mt-1.5 text-muted-foreground/50">
                  <span>In wallets vs issued</span>
                  <span>{fPct(totalInWallets, totalIssued)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Rankings                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader label="Rankings" />

          {/* ── Top Products ── */}
          <div className={cn(CARD, "mb-4")}>
          {/* Table header */}
          <div className="px-5 py-3.5 border-b border-border/30 flex items-center gap-2.5 bg-muted/20">
            <Award className="h-3.5 w-3.5 text-warning shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              Top 10 Products by Sales
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground/50 hidden md:block">
              Price &middot; Margin &middot; Rating &middot; Sold
            </span>
          </div>

          {stats.topProducts.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No product data available.
            </div>
          ) : (
            <div className="divide-y divide-border/25">
              {stats.topProducts.map((product, idx) => {
                const soldQty =
                  product.soldCount ?? product.quantitySold ?? 0;
                const margin =
                  product.price > 0
                    ? (
                        ((product.price - product.jumlaaPrice) /
                          product.price) *
                        100
                      ).toFixed(1)
                    : "—";

                return (
                  <div
                    key={idx}
                    className={cn(
                      "relative flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/30",
                      idx === 0 && "bg-warning/[0.03]"
                    )}
                  >
                    {/* Rank-1 left accent line */}
                    {idx === 0 && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-warning/50 rounded-r-full" />
                    )}

                    <RankBadge rank={idx + 1} />

                    {/* Name + store */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium text-foreground truncate",
                          idx === 0 && "font-semibold"
                        )}
                      >
                        {resolveName(product.name)}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {resolveName(product.store)}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="hidden sm:block shrink-0">
                      <StarRating rating={product.avgRating || 0} />
                    </div>

                    {/* Price / cost / margin */}
                    <div className="hidden md:block text-right shrink-0 min-w-[110px]">
                      <div className="text-xs font-semibold text-foreground tabular-nums">
                        {formatIQD(product.price)}
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        Cost {formatIQD(product.jumlaaPrice)}
                      </div>
                      <div className="text-[10px] text-success/75 tabular-nums">
                        {margin}% margin
                      </div>
                    </div>

                    {/* Sold count + mini bar */}
                    <div className="text-right shrink-0 min-w-[3.5rem]">
                      <div
                        className={cn(
                          "font-bold text-foreground tabular-nums",
                          idx === 0 ? "text-base" : "text-sm"
                        )}
                      >
                        {fNum(soldQty)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        sold
                      </div>
                      {/* Relative bar */}
                      <div className="mt-1 w-full h-0.5 bg-border/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/20 rounded-full"
                          style={{
                            width: `${safePct(soldQty, maxSoldQty)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top Stores (2 cols) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* By Product Count */}
          <div className={CARD}>
            <div className="px-5 py-3.5 border-b border-border/30 flex items-center gap-2 bg-muted/20">
              <Box className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                Top Stores by Products
              </span>
            </div>
            {stats.topStoresByProducts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No data.
              </div>
            ) : (
              <div className="divide-y divide-border/25">
                {stats.topStoresByProducts.map((store, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-muted/30",
                      idx === 0 && "bg-warning/[0.03]"
                    )}
                  >
                    {idx === 0 && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-warning/50 rounded-r-full" />
                    )}
                    <RankBadge rank={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm text-foreground truncate mb-1.5",
                          idx === 0 ? "font-semibold" : "font-medium"
                        )}
                      >
                        {resolveName(store.name)}
                      </div>
                      <Bar
                        value={store.productCount}
                        max={maxStoreProducts}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                      {fNum(store.productCount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By Revenue */}
          <div className={CARD}>
            <div className="px-5 py-3.5 border-b border-border/30 flex items-center gap-2 bg-muted/20">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                Top Stores by Revenue
              </span>
            </div>
            {stats.topStoresByOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No data.
              </div>
            ) : (
              <div className="divide-y divide-border/25">
                {stats.topStoresByOrders.map((store, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-muted/30",
                      idx === 0 && "bg-warning/[0.03]"
                    )}
                  >
                    {idx === 0 && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-warning/50 rounded-r-full" />
                    )}
                    <RankBadge rank={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm text-foreground truncate mb-1.5",
                          idx === 0 ? "font-semibold" : "font-medium"
                        )}
                      >
                        {resolveName(store.name)}
                      </div>
                      <Bar value={store.revenue} max={maxStoreRevenue} />
                    </div>
                    <span className="text-xs font-semibold text-foreground tabular-nums shrink-0 text-right">
                      {formatIQD(store.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
