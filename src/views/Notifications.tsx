"use client";

import { useState, useEffect, useMemo } from "react";
import {
    AppNotification,
    NotificationStatus,
    TargetType,
    RoleType,
    NotificationTarget,
} from "@/store/slices/notificationsSlice";
import { notificationsAPI, usersAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription,
} from "@/components/ui/form-panel";
import { NotificationPhonePreview } from "@/components/dashboard/notifications/NotificationPhonePreview";
import { UserPicker, UserPickerUser } from "@/components/ui/user-picker";
import {
    Bell, Plus, Trash2, Send,
    CheckCircle2, XCircle,
    Users, User, UserCheck,
    Search, Eye, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/formatters";

// ── Types ─────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<NotificationStatus, {
    label: string;
    icon: React.ElementType;
    className: string;
}> = {
    sent: {
        label: "Sent",
        icon: CheckCircle2,
        className: "border-green-500/40 text-green-600 bg-green-50/60 dark:bg-green-900/20 dark:text-green-400",
    },
    failed: {
        label: "Failed",
        icon: XCircle,
        className: "border-orange-400/40 text-orange-600 bg-orange-50/60 dark:bg-orange-900/20 dark:text-orange-400",
    },
};

function formatTarget(n: AppNotification): { label: string; icon: React.ElementType } {
    if (n.target.type === "all") return { label: "All Users", icon: Users };
    if (n.target.type === "role") {
        if (n.target.role === "vendor") return { label: "Vendors", icon: UserCheck };
        if (n.target.role === "technician") return { label: "Technicians", icon: UserCheck };
        return { label: "Users", icon: UserCheck };
    }
    return { label: n.target.userName || n.target.userId || "Specific User", icon: User };
}

function formatReach(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function mapNotification(b: any): AppNotification {
    const user = b.user && typeof b.user === "object" ? b.user : null;
    let target: NotificationTarget = { type: "all" };
    if (user) {
        if (user.role === "vendor") target = { type: "role", role: "vendor" };
        else if (user.role === "technician") target = { type: "role", role: "technician" };
        else target = { type: "user", userId: user._id, userName: user.name || user.phone };
    }
    return {
        _id: b._id,
        title: b.title?.en || b.title?.ar || String(b.title || ""),
        message: b.body?.en || b.body?.ar || String(b.body || ""),
        target,
        reach: 0,
        status: "sent",
        sentAt: b.createdAt,
        createdAt: b.createdAt,
    };
}

// ── Notification Form ─────────────────────────────────────────────────────────

interface NotificationFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

function NotificationForm({ onSuccess, onCancel }: NotificationFormProps) {
    const [titleAr, setTitleAr] = useState("");
    const [titleEn, setTitleEn] = useState("");
    const [messageAr, setMessageAr] = useState("");
    const [messageEn, setMessageEn] = useState("");
    const [targetType, setTargetType] = useState<TargetType>("all");
    const [targetRole, setTargetRole] = useState<RoleType>("user");
    const [targetUserId, setTargetUserId] = useState("");
    const [users, setUsers] = useState<UserPickerUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const loadUsers = async () => {
        if (usersLoading) return;
        setUsersLoading(true);
        try {
            const res: any = await usersAPI.getAll({ page: 1, limit: 200 });
            const list = res?.data?.users ?? res?.data ?? [];
            if (Array.isArray(list)) setUsers(list);
            else setUsers([]);
        } catch {
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (targetType !== "user") {
            if (targetUserId) setTargetUserId("");
            return;
        }
        if (users.length === 0) loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titleAr.trim()) { toast.error("Arabic title is required"); return; }
        if (!messageAr.trim()) { toast.error("Arabic message is required"); return; }
        if (targetType === "user" && !targetUserId.trim()) { toast.error("Please select a user"); return; }

        setSending(true);
        try {
            const payload = {
                title: {
                    ar: titleAr.trim(),
                    en: (titleEn || titleAr).trim(),
                },
                body: {
                    ar: messageAr.trim(),
                    en: (messageEn || messageAr).trim(),
                },
            };

            if (targetType === "all") {
                await notificationsAPI.sendToAll(payload);
            } else if (targetType === "role") {
                if (targetRole === "vendor") await notificationsAPI.sendToVendors(payload);
                else if (targetRole === "technician") await notificationsAPI.sendToTechnicians(payload);
                else await notificationsAPI.sendToNormalUsers(payload);
            } else {
                await notificationsAPI.sendToUser(targetUserId.trim(), payload);
            }

            toast.success("Notification sent successfully");
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">

            {/* Phone Preview */}
            <div className="flex justify-center py-2">
                <NotificationPhonePreview title={titleAr || titleEn} message={messageAr || messageEn} scale={0.72} />
            </div>

            {/* Content */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Bell className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Content</span>
                </div>
                {/* Title (AR) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Title (Arabic) <span className="text-destructive">*</span></Label>
                        <span className={cn("text-xs text-muted-foreground", titleAr.length > 55 && "text-destructive")}>
                            {titleAr.length}/65
                        </span>
                    </div>
                    <Input
                        placeholder="مثال: عرض نهاية الأسبوع"
                        value={titleAr}
                        onChange={e => setTitleAr(e.target.value.slice(0, 65))}
                    />
                </div>
                {/* Title (EN) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Title (English)</Label>
                        <span className={cn("text-xs text-muted-foreground", titleEn.length > 55 && "text-destructive")}>
                            {titleEn.length}/65
                        </span>
                    </div>
                    <Input
                        placeholder="e.g. Weekend Flash Sale"
                        value={titleEn}
                        onChange={e => setTitleEn(e.target.value.slice(0, 65))}
                    />
                </div>
                {/* Message (AR) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Message (Arabic) <span className="text-destructive">*</span></Label>
                        <span className={cn("text-xs text-muted-foreground", messageAr.length > 200 && "text-destructive")}>
                            {messageAr.length}/240
                        </span>
                    </div>
                    <Textarea
                        placeholder="اكتب نص الإشعار هنا..."
                        value={messageAr}
                        onChange={e => setMessageAr(e.target.value.slice(0, 240))}
                        className="resize-none"
                        rows={3}
                    />
                </div>
                {/* Message (EN) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Message (English)</Label>
                        <span className={cn("text-xs text-muted-foreground", messageEn.length > 200 && "text-destructive")}>
                            {messageEn.length}/240
                        </span>
                    </div>
                    <Textarea
                        placeholder="Write your notification message here..."
                        value={messageEn}
                        onChange={e => setMessageEn(e.target.value.slice(0, 240))}
                        className="resize-none"
                        rows={3}
                    />
                </div>
            </section>

            {/* Target Audience */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Target Audience</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {([
                        { value: "all" as TargetType, icon: Users, label: "All Users", desc: "Everyone" },
                        { value: "role" as TargetType, icon: UserCheck, label: "By Role", desc: "Filter by type" },
                        { value: "user" as TargetType, icon: User, label: "Specific User", desc: "One person" },
                    ] as const).map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTargetType(opt.value)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                                targetType === opt.value
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:bg-muted/40"
                            )}
                        >
                            <opt.icon className={cn("h-4 w-4", targetType === opt.value ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-xs font-semibold", targetType === opt.value ? "text-primary" : "text-foreground")}>
                                {opt.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                        </button>
                    ))}
                </div>
                {targetType === "role" && (
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={targetRole} onValueChange={v => setTargetRole(v as RoleType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">Users (Shoppers)</SelectItem>
                                <SelectItem value="vendor">Vendors (Store Owners)</SelectItem>
                                <SelectItem value="technician">Technicians</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {targetType === "user" && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label>User <span className="text-destructive">*</span></Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={loadUsers}
                                disabled={usersLoading}
                            >
                                {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                            </Button>
                        </div>
                        <UserPicker
                            value={targetUserId}
                            onChange={setTargetUserId}
                            users={users}
                            placeholder={usersLoading ? "Loading users..." : "Select user..."}
                            emptyText={usersLoading ? "Loading..." : "No users found."}
                            searchPlaceholder="Search by name or phone..."
                        />
                    </div>
                )}
            </section>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button type="button" variant="outline" onClick={onCancel} className="min-w-[90px]">
                    Cancel
                </Button>
                <Button type="submit" disabled={sending} className="min-w-[140px] bg-primary hover:bg-primary/90 shadow-md">
                    {sending
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                        : <><Send className="h-4 w-4 mr-2" /> Send Notification</>
                    }
                </Button>
            </div>
        </form>
    );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function Notifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<AppNotification | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | NotificationStatus>("all");
    const [search, setSearch] = useState("");

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationsAPI.getAll({ limit: 100, page: 1 });
            setNotifications((res.data ?? []).map(mapNotification));
        } catch {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const filtered = useMemo(() => {
        let list = statusFilter === "all" ? notifications : notifications.filter(n => n.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(n =>
                n.title.toLowerCase().includes(q) ||
                n.message.toLowerCase().includes(q) ||
                (n.target.userName ?? "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [notifications, statusFilter, search]);

    const confirmDelete = () => {
        if (!selected) return;
        setNotifications(prev => prev.filter(n => n._id !== selected._id));
        toast.success("Notification removed");
        setDeleteOpen(false);
        setSelected(null);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Notifications</h1>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Button onClick={() => setPanelOpen(true)} className="bg-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Send Notification
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-semibold w-10">#</TableHead>
                            <TableHead className="font-semibold">Notification</TableHead>
                            <TableHead className="font-semibold">Recipient</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    {search ? "No notifications match your search." : "No notifications yet."}
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((n, i) => {
                            const target = formatTarget(n);
                            const TargetIcon = target.icon;

                            return (
                                <TableRow
                                    key={n._id}
                                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => { setSelected(n); setPreviewOpen(true); }}
                                >
                                    <TableCell className="text-muted-foreground font-mono text-xs">
                                        {String(i + 1).padStart(2, "0")}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{n.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] mt-0.5">{n.message}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <TargetIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm">{target.label}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDateTime(n.sentAt)}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { setSelected(n); setPreviewOpen(true); }}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setSelected(n); setDeleteOpen(true); }}
                                                className="hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Send Panel */}
            <FormPanel open={panelOpen} onOpenChange={open => { if (!open) setPanelOpen(false); }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>Send Notification</FormPanelTitle>
                        <FormPanelDescription>
                            Fill in the details to send a push notification to your app users.
                        </FormPanelDescription>
                    </FormPanelHeader>
                    {panelOpen && (
                        <NotificationForm
                            onSuccess={() => { setPanelOpen(false); fetchNotifications(); }}
                            onCancel={() => setPanelOpen(false)}
                        />
                    )}
                </FormPanelContent>
            </FormPanel>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={open => { if (!open) setSelected(null); setPreviewOpen(open); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            {selected?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <p className="text-sm text-foreground/80 leading-relaxed">{selected.message}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Recipient</p>
                                    <p className="font-semibold text-sm">{formatTarget(selected).label}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/20 space-y-1 col-span-2">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sent At</p>
                                    <p className="font-semibold text-sm">{formatDateTime(selected.sentAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" className="flex-1" onClick={() => setPreviewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
