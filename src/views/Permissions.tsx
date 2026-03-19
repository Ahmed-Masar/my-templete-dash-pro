"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, createUser, updateUser, deleteUser } from "@/store/slices/usersSlice";
import type { User } from "@/store/slices/usersSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  SecuritySafe as Shield,
  SearchNormal1 as Search,
  Refresh2 as RefreshCw,
  Add as Plus,
  Trash,
  Edit2 as Edit,
  Chart1 as BarChart2,
  Home2 as Home,
  ShoppingBag,
  Tag as Tags,
  Speaker as Megaphone,
  Notification as Bell,
  ShoppingCart,
  Gift,
  Shop as Store,
  User as UserIcon,
  Briefcase,
  Messages1 as MessageSquare,
  TickCircle as CheckCircle2,
  People as Users,
  Element3 as LayoutDashboard,
  TickCircle as Check,
  Eye,
  EyeSlash as EyeOff,
  Refresh as Loader2,
} from "iconsax-react";

// ── Permission Matrix ─────────────────────────────────────────────────────────

const PERMISSION_MATRIX = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { key: "stats", label: "Overview", icon: BarChart2 },
      { key: "home",  label: "Home Screen", icon: Home },
    ],
  },
  {
    group: "Catalog",
    icon: ShoppingBag,
    items: [
      { key: "products",   label: "Products",   icon: ShoppingBag },
      { key: "categories", label: "Categories", icon: Tags },
      { key: "tags",       label: "Tags",       icon: Tags },
    ],
  },
  {
    group: "Marketing",
    icon: Megaphone,
    items: [
      { key: "ads",           label: "App Ads",       icon: Megaphone },
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "sponsors",      label: "Sponsors",      icon: BarChart2 },
    ],
  },
  {
    group: "Commerce",
    icon: ShoppingCart,
    items: [
      { key: "carts",        label: "Orders & Carts", icon: ShoppingCart },
      { key: "points-store", label: "Points Store",   icon: Gift },
      { key: "stores",       label: "Stores",         icon: Store },
    ],
  },
  {
    group: "Management",
    icon: Shield,
    items: [
      { key: "users",   label: "Users",      icon: UserIcon },
      { key: "vendors", label: "Vendors",    icon: Briefcase },
      { key: "reviews", label: "Reviews",    icon: MessageSquare },
      { key: "erp",     label: "Technicians", icon: Shield },
    ],
  },
];

const ALL_KEYS    = PERMISSION_MATRIX.flatMap((g) => g.items.map((i) => i.key));
const STAFF_ROLES = ["admin"];

type SaveStatus = "idle" | "saving" | "saved" | "error";
type PanelMode  = "add" | "edit" | null;

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatPhone(phone: string | number | undefined): string {
  if (!phone) return "";
  const s = String(phone);
  return s.length === 10 && !s.startsWith("0") ? "0" + s : s;
}

const emptyForm = () => ({
  name:     "",
  phone:    "",
  password: "",
  pages:    [] as string[],
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function Permissions() {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((s) => s.users);
  const currentUser = useAppSelector((s) => s.auth.user);

  // ── Filter / search ──
  const [search, setSearch] = useState("");

  // ── Inline permission state ──
  const [localPages, setLocalPages] = useState<Record<string, string[]>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const pageTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── CRUD panel ──
  const [panelMode,    setPanelMode]    = useState<PanelMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form,         setForm]         = useState(emptyForm());
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  // ── Delete dialog ──
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  // ── Column hover ──
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // ── Load ──
  useEffect(() => {
    dispatch(fetchUsers({ limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    setLocalPages((prev) => {
      const next = { ...prev };
      users.forEach((u) => {
        if (STAFF_ROLES.includes(u.role) && !(u._id in next))
          next[u._id] = u.pages ?? [];
      });
      return next;
    });
  }, [users]);

  const staffUsers = users.filter((u) => STAFF_ROLES.includes(u.role));
  const filtered   = staffUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || formatPhone(u.phone).includes(search)
  );

  // ── Debounced pages save ──────────────────────────────────────────────────

  const scheduleSave = useCallback((userId: string, pages: string[]) => {
    if (pageTimers.current[userId]) clearTimeout(pageTimers.current[userId]);
    setSaveStatus((p) => ({ ...p, [userId]: "saving" }));
    pageTimers.current[userId] = setTimeout(async () => {
      try {
        await dispatch(updateUser({ id: userId, data: { pages } })).unwrap();
        setSaveStatus((p) => ({ ...p, [userId]: "saved" }));
        setTimeout(() => setSaveStatus((p) => ({ ...p, [userId]: "idle" })), 2000);
      } catch {
        setSaveStatus((p) => ({ ...p, [userId]: "error" }));
        toast.error("Failed to save permissions", { description: "Could not update. Please try again." });
      }
    }, 1200);
  }, [dispatch]);

  const toggle = (userId: string, key: string, locked: boolean) => {
    if (locked) return;
    setLocalPages((prev) => {
      const cur  = prev[userId] ?? [];
      const next = cur.includes(key) ? cur.filter((p) => p !== key) : [...cur, key];
      scheduleSave(userId, next);
      return { ...prev, [userId]: next };
    });
  };

  const toggleAll = (userId: string, locked: boolean) => {
    if (locked) return;
    setLocalPages((prev) => {
      const cur  = prev[userId] ?? [];
      const next = cur.length === ALL_KEYS.length ? [] : [...ALL_KEYS];
      scheduleSave(userId, next);
      return { ...prev, [userId]: next };
    });
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setSelectedUser(null);
    setForm(emptyForm());
    setPanelMode("add");
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      name:     user.name || "",
      phone:    formatPhone(user.phone),
      password: "",
      pages:    localPages[user._id] ?? user.pages ?? [],
    });
    setPanelMode("edit");
  };

  const closePanel = () => {
    setPanelMode(null);
    setSelectedUser(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload: any = {
      name:  form.name,
      phone: form.phone,
      role:  "admin",
      pages: form.pages,
    };
    if (panelMode === "add") payload.password = form.password;
    try {
      if (panelMode === "edit" && selectedUser) {
        await dispatch(updateUser({ id: selectedUser._id, data: payload })).unwrap();
        setLocalPages((prev) => ({ ...prev, [selectedUser._id]: payload.pages }));
        toast.success("Staff member updated");
      } else {
        const created: any = await dispatch(createUser(payload)).unwrap();
        if (created?._id) {
          setLocalPages((prev) => ({ ...prev, [created._id]: payload.pages }));
        }
        toast.success("Staff member added");
      }
      closePanel();
      dispatch(fetchUsers({ limit: 200 }));
    } catch (err: any) {
      toast.error("Operation failed", { description: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteUser(deleteTarget._id)).unwrap();
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error("Delete failed", { description: String(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────

  const totalGranted = staffUsers.reduce((sum, u) => sum + (localPages[u._id] ?? []).length, 0);
  const maxPossible  = staffUsers.length * ALL_KEYS.length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Permissions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage staff accounts and control module access across the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search color="currentColor" size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="pl-9 w-52"
            />
          </div>
          <Button
            variant="outline" size="icon"
            onClick={() => dispatch(fetchUsers({ limit: 200 }))}
            className={cn("transition-opacity", loading && "opacity-60 pointer-events-none")}
          >
            <RefreshCw color="currentColor" size="16" className={cn(loading && "animate-spin")} />
          </Button>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus color="currentColor" size="16" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Staff Members",       value: String(staffUsers.length), sub: "",                 icon: Users        },
          { label: "Permissions Granted", value: String(totalGranted),      sub: `/ ${maxPossible}`, icon: CheckCircle2 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                  <Icon color="currentColor" size="18" className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
                  <p className="text-2xl font-bold leading-tight">
                    {s.value}
                    {s.sub && <span className="text-sm font-normal text-muted-foreground ml-1">{s.sub}</span>}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Matrix Table ── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ minWidth: "max-content", width: "100%" }}>
            <thead>

              {/* Row 1 — group labels */}
              <tr className="border-b border-border/60">
                <th className="sticky left-0 z-20 bg-card backdrop-blur-sm border-r border-border/50 px-5 py-3.5 text-left" style={{ minWidth: 260 }}>
                  <div className="flex items-center gap-2">
                    <Shield color="currentColor" size="14" className="text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">Staff Member</span>
                  </div>
                </th>

                {PERMISSION_MATRIX.map((group) => (
                  <th key={group.group} colSpan={group.items.length}
                    className="px-2 py-3.5 text-center border-r border-border/30 last:border-r-0"
                    style={{ minWidth: group.items.length * 60 }}
                  >
                    <span className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest">
                      {group.group}
                    </span>
                  </th>
                ))}

                <th className="px-4 py-3.5 text-center" style={{ minWidth: 120 }}>
                  <span className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Progress</span>
                </th>
              </tr>

              {/* Row 2 — permission icon headers */}
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="sticky left-0 z-20 bg-muted/30 backdrop-blur-sm border-r border-border/50 px-5 py-2" />

                {PERMISSION_MATRIX.flatMap((group, gIdx) =>
                  group.items.map((item, iIdx) => {
                    const Icon         = item.icon;
                    const isLast       = iIdx === group.items.length - 1;
                    const isHov        = hoveredKey === item.key;
                    return (
                      <th key={item.key}
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        className={cn(
                          "px-1 py-2.5 text-center transition-colors duration-100",
                          isLast && gIdx < PERMISSION_MATRIX.length - 1 && "border-r border-border/30",
                          isHov && "bg-primary/[0.06]"
                        )}
                        style={{ width: 60, minWidth: 60 }}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center shadow-sm transition-colors duration-100",
                            isHov ? "bg-primary/10" : "bg-background/80"
                          )}>
                            <Icon color="currentColor" size="14" className={cn("transition-colors", isHov ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <span className={cn(
                            "text-[10px] font-medium leading-none whitespace-nowrap transition-colors",
                            isHov ? "text-primary" : "text-muted-foreground"
                          )}>
                            {item.label}
                          </span>
                        </div>
                      </th>
                    );
                  })
                )}

                <th className="px-4 py-2" />
              </tr>
            </thead>

            <tbody>
              {loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={ALL_KEYS.length + 2} className="py-16 text-center text-sm text-muted-foreground">
                    <Loader2 color="currentColor" size="20" className="animate-spin mx-auto mb-2 opacity-40" />
                    Loading staff members...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={ALL_KEYS.length + 2} className="py-16 text-center text-sm text-muted-foreground">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filtered.map((user, rowIdx) => {
                  const isSelf  = user._id === currentUser?._id;
                  const pages   = localPages[user._id] ?? [];
                  const status        = saveStatus[user._id] ?? "idle";
                  const count         = pages.length;
                  const pct           = Math.round((count / ALL_KEYS.length) * 100);

                  return (
                    <tr key={user._id} className={cn(
                      "group border-b border-border/40 last:border-b-0 transition-colors duration-100",
                      rowIdx % 2 === 0 ? "bg-background" : "bg-muted/[0.04]",
                      isSelf ? "opacity-60" : "hover:bg-muted/[0.08]"
                    )}>

                      {/* ── User + Role cell ── */}
                      <td className={cn(
                        "sticky left-0 z-10 border-r border-border/40 px-5 py-2.5 backdrop-blur-sm transition-colors duration-100",
                        rowIdx % 2 === 0
                          ? "bg-background group-hover:bg-muted/[0.08]"
                          : "bg-muted/[0.04] group-hover:bg-muted/[0.08]"
                      )} style={{ minWidth: 280 }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm bg-muted text-foreground/70 border border-border/60">
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {isSelf ? (
                                <span className="text-sm font-medium truncate leading-snug">{user.name}</span>
                              ) : (
                                <button
                                  onClick={() => openEdit(user)}
                                  className="text-sm font-medium truncate leading-snug hover:text-primary transition-colors text-left block"
                                >
                                  {user.name}
                                </button>
                              )}
                              {isSelf && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground uppercase tracking-wide flex-shrink-0">You</span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">{formatPhone(user.phone)}</span>
                          </div>
                          {/* ── Action buttons inline ── */}
                          {!isSelf && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEdit(user)}
                                title="Edit staff member"
                                className="w-6 h-6 rounded-md flex items-center justify-center border border-border/60 bg-muted/40 text-foreground/70 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all duration-150"
                              >
                                <Edit color="currentColor" size="14" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(user)}
                                title="Remove staff member"
                                className="w-6 h-6 rounded-md flex items-center justify-center border border-border/60 bg-muted/40 text-foreground/70 hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-all duration-150"
                              >
                                <Trash color="currentColor" size="14" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* ── Permission cells ── */}
                      {PERMISSION_MATRIX.flatMap((group, gIdx) =>
                        group.items.map((item, iIdx) => {
                          const active  = pages.includes(item.key);
                          const isLast  = iIdx === group.items.length - 1;
                          const isHov   = hoveredKey === item.key;
                          return (
                            <td key={item.key}
                              onMouseEnter={() => setHoveredKey(item.key)}
                              onMouseLeave={() => setHoveredKey(null)}
                              className={cn(
                                "px-1 py-2.5 text-center transition-colors duration-100",
                                isLast && gIdx < PERMISSION_MATRIX.length - 1 && "border-r border-border/20",
                                isHov && "bg-primary/[0.04]"
                              )}
                              style={{ width: 60 }}
                            >
                              <button
                                onClick={() => toggle(user._id, item.key, isSelf)}
                                disabled={isSelf}
                                title={isSelf ? "You cannot modify your own account" : item.label}
                                className={cn(
                                  "w-7 h-7 rounded-full mx-auto flex items-center justify-center",
                                  "transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                  active
                                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/80 hover:scale-110 cursor-pointer"
                                    : "bg-transparent border-2 border-border/40 text-transparent hover:border-primary/50 hover:scale-105 cursor-pointer"
                                )}
                              >
                                  {active && (
                                    <Check color="currentColor" size="14" variant="Bold" />
                                  )}
                              </button>
                            </td>
                          );
                        })
                      )}

                      {/* ── Progress cell ── */}
                      <td className="px-4 py-2.5" style={{ minWidth: 120 }}>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleAll(user._id, isSelf)}
                              disabled={isSelf}
                              className="text-[10px] font-semibold transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {count} / {ALL_KEYS.length}
                            </button>
                            <span className={cn(
                              "text-[10px] font-bold",
                              pct === 100 ? "text-primary" : "text-muted-foreground"
                            )}>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                pct === 100 ? "bg-primary" : pct >= 50 ? "bg-primary/70" : "bg-primary/40"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="h-3.5 flex items-center">
                            {status === "saving" && (
                              <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                                <Loader2 color="currentColor" size="10" className="animate-spin" /> Saving
                              </span>
                            )}
                            {status === "saved" && (
                              <span className="flex items-center gap-1 text-[9px] text-green-500">
                                <CheckCircle2 color="currentColor" size="12" variant="Bold" /> Saved
                              </span>
                            )}
                            {status === "error" && (
                              <span className="text-[9px] font-semibold text-destructive">Error</span>
                            )}
                          </div>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Click any circle to toggle. Click a name to edit. Role changes apply instantly.
          </p>
          <p className="text-xs text-muted-foreground">
            Click any circle to toggle page access.
          </p>
        </div>
      </div>

      {/* ── Add / Edit Staff Panel ── */}
      <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) closePanel(); }}>
        <FormPanelContent>
          <FormPanelHeader>
            <FormPanelTitle>
              {panelMode === "edit" ? "Edit Staff Member" : "Add Staff Member"}
            </FormPanelTitle>
            <FormPanelDescription>
              {panelMode === "edit"
                ? "Update basic info or page access below."
                : "Create a new staff account and configure their access."}
            </FormPanelDescription>
          </FormPanelHeader>

          <form onSubmit={handleSubmit} className="space-y-7 mt-2">

            {/* ── Basic fields ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <UserIcon color="currentColor" size="16" className="text-primary" />
                <span className="text-sm font-semibold tracking-wide">Basic Details</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sf-name">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="sf-name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required placeholder="e.g. Ahmad Al-Rashid" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sf-phone">Phone Number <span className="text-destructive">*</span></Label>
                  <Input id="sf-phone" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required placeholder="07xxxxxxxxxx" />
                </div>
                {panelMode === "add" && (
                  <div className="space-y-2">
                    <Label htmlFor="sf-pw">Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input id="sf-pw" type={showPassword ? "text" : "password"} value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required className="pr-9" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff color="currentColor" size="16" /> : <Eye color="currentColor" size="16" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Page Access ── */}
            <PermissionCardGrid
              pages={form.pages}
              onChange={(pages) => setForm((f) => ({ ...f, pages }))}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={closePanel} className="min-w-[90px]">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[110px] bg-primary hover:bg-primary/90 shadow-md">
                {isSubmitting ? "Saving..." : panelMode === "edit" ? "Update" : "Add Staff"}
              </Button>
            </div>
          </form>
        </FormPanelContent>
      </FormPanel>

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="items-center text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <RefreshCw color="currentColor" size="32" className="text-destructive animate-spin" />
            </div>
            <DialogTitle>Remove Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?{" "}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="w-full">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="w-full">
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── Permission Card Grid ──────────────────────────────────────────────────────

function PermissionCardGrid({
  pages, onChange,
}: {
  pages: string[];
  onChange: (pages: string[]) => void;
}) {
  const total       = ALL_KEYS.length;
  const activeCount = pages.length;
  const allSelected = activeCount === total;

  const toggleKey = (key: string) => {
    onChange(pages.includes(key) ? pages.filter((p) => p !== key) : [...pages, key]);
  };

  const toggleGroup = (keys: string[]) => {
    const allOn = keys.every((k) => pages.includes(k));
    if (allOn) {
      onChange(pages.filter((p) => !keys.includes(p)));
    } else {
      onChange(Array.from(new Set([...pages, ...keys])));
    }
  };

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Shield color="currentColor" size="16" className="text-primary" />
          <span className="text-sm font-semibold tracking-wide">Page Access</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini progress bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.round((activeCount / total) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {activeCount}<span className="text-muted-foreground/50">/{total}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : [...ALL_KEYS])}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-2"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {PERMISSION_MATRIX.map((group) => {
          const GroupIcon   = group.icon;
          const groupKeys   = group.items.map((i) => i.key);
          const activeInGrp = groupKeys.filter((k) => pages.includes(k)).length;
          const allInGrp    = activeInGrp === groupKeys.length;
          const someInGrp   = activeInGrp > 0 && !allInGrp;

          return (
            <div key={group.group}>
              {/* Group label row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <GroupIcon color="currentColor" size="14" className="text-muted-foreground/70" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.group}
                  </span>
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 rounded-full",
                    allInGrp ? "bg-primary/15 text-primary" : someInGrp ? "bg-primary/8 text-primary/70" : "bg-muted/60 text-muted-foreground"
                  )}>
                    {activeInGrp}/{groupKeys.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKeys)}
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    allInGrp ? "text-primary/80 hover:text-destructive" : "text-primary hover:text-primary/70"
                  )}
                >
                  {allInGrp ? "Remove all" : "Add all"}
                </button>
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) => {
                  const Icon   = item.icon;
                  const active = pages.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleKey(item.key)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 px-2 py-3.5 rounded-xl border-2 transition-all duration-200 group/card",
                        active
                          ? "border-primary/60 bg-primary/[0.06] shadow-sm"
                          : "border-border/50 bg-muted/10 hover:border-border hover:bg-muted/30"
                      )}
                    >
                      {/* Icon container */}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "bg-muted/60 text-muted-foreground group-hover/card:bg-muted"
                      )}>
                        <Icon color="currentColor" size="18" variant={active ? "Bold" : "Linear"} />
                      </div>

                      {/* Label */}
                      <span className={cn(
                        "text-[11px] font-medium text-center leading-tight transition-colors",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>

                      {/* Check indicator */}
                      <div className={cn(
                        "absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground scale-100 opacity-100"
                          : "bg-border/40 scale-75 opacity-0 group-hover/card:opacity-40 group-hover/card:scale-90"
                      )}>
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
