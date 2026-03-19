"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatIQD } from "@/lib/currency";
import { formatDate } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import {
    Search, Star, FileText,
    Clock, FileCheck, CheckCircle2, XCircle,
    ChevronDown, ChevronRight, Download,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCarts, updateCartStatus, optimisticUpdateStatus, revertCartStatus, Cart, CartStatus } from "@/store/slices/cartsSlice";

const STATUS_CONFIG: Record<CartStatus, {
    label: string;
    triggerClass: string;
    icon: React.ReactNode;
    activeItemClass: string;
}> = {
    draft: {
        label: "Draft",
        triggerClass: "border-slate-400/40 text-slate-600 bg-slate-50/60 hover:bg-slate-100/80 dark:bg-slate-800/30 dark:text-slate-300",
        icon: <Clock className="w-3 h-3" />,
        activeItemClass: "bg-slate-50/60 text-slate-700 font-semibold",
    },
    generated: {
        label: "Generated",
        triggerClass: "border-blue-400/40 text-blue-600 bg-blue-50/60 hover:bg-blue-100/80 dark:bg-blue-900/20 dark:text-blue-400",
        icon: <FileCheck className="w-3 h-3" />,
        activeItemClass: "bg-blue-50/60 text-blue-700 font-semibold",
    },
    completed: {
        label: "Completed",
        triggerClass: "border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400",
        icon: <CheckCircle2 className="w-3 h-3" />,
        activeItemClass: "bg-green-50/60 text-green-700 font-semibold",
    },
    cancelled: {
        label: "Cancelled",
        triggerClass: "border-red-400/40 text-red-600 bg-red-50/60 hover:bg-red-100/80 dark:bg-red-900/20 dark:text-red-400",
        icon: <XCircle className="w-3 h-3" />,
        activeItemClass: "bg-red-50/60 text-red-700 font-semibold",
    },
};

const STATUS_OPTIONS: { value: CartStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "draft", label: "Draft", icon: <Clock className="w-4 h-4 text-slate-500" />, color: "text-slate-500" },
    { value: "generated", label: "Generated", icon: <FileCheck className="w-4 h-4 text-blue-500" />, color: "text-blue-500" },
    { value: "completed", label: "Completed", icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, color: "text-green-500" },
    { value: "cancelled", label: "Cancelled", icon: <XCircle className="w-4 h-4 text-red-500" />, color: "text-red-500" },
];

const getUserName = (user: Cart["user"]) =>
    typeof user === "object" ? user?.name ?? "Unknown" : "Unknown";

const getUserPhone = (user: Cart["user"]) =>
    typeof user === "object" ? user?.phone : undefined;

const Carts: React.FC = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { carts, loading, total } = useAppSelector((s) => s.carts);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<CartStatus | "all">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        dispatch(fetchCarts({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);

    const handleStatusChange = (id: string, newStatus: CartStatus) => {
        const cart = carts.find(c => c._id === id);
        if (!cart || cart.status === newStatus) return;

        const previousStatus = cart.status;

        dispatch(optimisticUpdateStatus({ id, status: newStatus }));
        setSubmittingIds(prev => new Set(prev).add(id));

        dispatch(updateCartStatus({ id, status: newStatus }))
            .unwrap()
            .then(() => {
                toast({ title: "Status updated", description: "Cart status has been updated successfully." });
            })
            .catch((err: any) => {
                dispatch(revertCartStatus({ id, status: previousStatus }));
                toast({ variant: "destructive", title: "Error", description: String(err) || "Failed to update status." });
            })
            .finally(() => {
                setSubmittingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            });
    };

    const toggleRow = (id: string) =>
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
        });

    const filteredCarts = carts.filter(cart => {
        const q = searchTerm.toLowerCase();
        const name = getUserName(cart.user).toLowerCase();
        return (
            (!q || cart._id.toLowerCase().includes(q) || name.includes(q)) &&
            (statusFilter === "all" || cart.status === statusFilter)
        );
    });

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return (
        <div className="container mx-auto p-6 space-y-6">

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Carts</h1>
                    <p className="text-muted-foreground">Manage and update customer cart statuses</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by ID or customer..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={v => { setStatusFilter(v as CartStatus | "all"); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="generated">Generated</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b">
                                <TableHead className="w-10" />
                                <TableHead className="font-semibold">Cart ID</TableHead>
                                <TableHead className="font-semibold">Customer</TableHead>
                                <TableHead className="font-semibold text-center">Items</TableHead>
                                <TableHead className="font-semibold text-center">Points</TableHead>
                                <TableHead className="font-semibold text-right">Total</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCarts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        No carts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCarts.map(cart => {
                                    const cfg = STATUS_CONFIG[cart.status] ?? STATUS_CONFIG.draft;
                                    const isSubmitting = submittingIds.has(cart._id);
                                    const isExpanded = expandedRows.has(cart._id);
                                    const itemsLen = cart.items?.length ?? 0;

                                    return (
                                        <React.Fragment key={cart._id}>

                                            <TableRow
                                                className={cn(
                                                    "border-b cursor-pointer transition-all duration-150 group",
                                                    isExpanded
                                                        ? "bg-muted/30"
                                                        : "hover:bg-muted/50 hover:shadow-sm hover:border-primary/20"
                                                )}
                                                onClick={() => toggleRow(cart._id)}
                                            >
                                                <TableCell className="w-10 pr-0 pl-4">
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                                        isExpanded && "rotate-90 text-primary"
                                                    )} />
                                                </TableCell>

                                                <TableCell>
                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                                                        #{cart._id.slice(-8)}
                                                    </code>
                                                </TableCell>

                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{getUserName(cart.user)}</p>
                                                        {getUserPhone(cart.user) && (
                                                            <p className="text-xs text-muted-foreground">{getUserPhone(cart.user)}</p>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-semibold">
                                                        {itemsLen}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                        <span className="text-sm font-medium">{cart.totalPoints ?? 0}</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <span className="font-semibold text-sm tabular-nums">
                                                        {formatIQD(cart.totalPrice ?? 0)}
                                                    </span>
                                                </TableCell>

                                                <TableCell
                                                    className="text-center"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                disabled={isSubmitting}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${cfg.triggerClass}`}
                                                            >
                                                                {cfg.icon}
                                                                {cfg.label}
                                                                <ChevronDown className="w-3 h-3 opacity-60" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                                                Change Status
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {STATUS_OPTIONS.map(opt => (
                                                                <DropdownMenuItem
                                                                    key={opt.value}
                                                                    onClick={() => handleStatusChange(cart._id, opt.value)}
                                                                    className={`flex items-center gap-2 cursor-pointer ${cart.status === opt.value ? STATUS_CONFIG[opt.value].activeItemClass : ""}`}
                                                                >
                                                                    {opt.icon}
                                                                    <span>{opt.label}</span>
                                                                    {cart.status === opt.value && (
                                                                        <span className={`ml-auto text-[10px] ${opt.color}`}>✓ Active</span>
                                                                    )}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>

                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground tabular-nums">
                                                            {formatDate(cart.createdAt)}
                                                        </span>
                                                </TableCell>

                                                <TableCell
                                                    className="text-center"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition-colors"
                                                            title="View Invoice"
                                                            onClick={() => router.push(`/invoice/${cart._id}`)}
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                        </Button>
                                                        {cart.pdfUrl && (
                                                            <a href={cart.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors" title="Download PDF">
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {isExpanded && (
                                                <TableRow className="hover:bg-transparent">
                                                    <TableCell colSpan={9} className="p-0 border-b bg-muted/5">
                                                        <div className="mx-6 my-4 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                                                            <div className="grid grid-cols-[1fr_260px]">

                                                                <div className="p-5 border-r border-border/60">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                            Order Items
                                                                        </p>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {itemsLen} product{itemsLen !== 1 ? "s" : ""}
                                                                        </span>
                                                                    </div>

                                                                    {itemsLen > 0 ? (
                                                                        <div>
                                                                            <div className="flex items-center justify-between px-2 pb-2 border-b border-border/50 mb-1">
                                                                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                                                                                    Product
                                                                                </span>
                                                                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                                                                                    Subtotal
                                                                                </span>
                                                                            </div>

                                                                            {cart.items!.map((item, idx) => (
                                                                                <div key={idx}>
                                                                                    <div className="flex items-center justify-between gap-4 py-2.5 px-2">
                                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                                            <span className="text-xs text-muted-foreground/40 tabular-nums w-3.5 shrink-0 text-right">
                                                                                                {idx + 1}
                                                                                            </span>
                                                                                            <div className="min-w-0">
                                                                                                <p className="text-sm font-medium truncate leading-none">
                                                                                                    {item.title || "Product"}
                                                                                                </p>
                                                                                                <p className="text-xs text-muted-foreground tabular-nums mt-1">
                                                                                                    {item.quantity} × {formatIQD(item.itemPrice)}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <span className="text-sm font-bold tabular-nums shrink-0">
                                                                                            {formatIQD(item.totalItemPrice)}
                                                                                        </span>
                                                                                    </div>
                                                                                    {idx < itemsLen - 1 && (
                                                                                        <div className="border-b border-dashed border-border/40 mx-2" />
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-muted-foreground px-2 py-4">
                                                                            No items in this cart.
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="p-5 flex flex-col gap-5 bg-muted/20">

                                                                    <div>
                                                                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
                                                                            Customer
                                                                        </p>
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                                                <span className="text-xs font-bold text-primary select-none">
                                                                                    {getUserName(cart.user).charAt(0).toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold leading-none">
                                                                                    {getUserName(cart.user)}
                                                                                </p>
                                                                                {getUserPhone(cart.user) && (
                                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                                        {getUserPhone(cart.user)}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
                                                                            Summary
                                                                        </p>
                                                                        <div className="space-y-2">
                                                                            {cart.totalPoints != null && (
                                                                                <div className="flex items-center justify-between text-sm">
                                                                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                                                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                                                        Customer pts
                                                                                    </span>
                                                                                    <span className="font-semibold tabular-nums">{cart.totalPoints}</span>
                                                                                </div>
                                                                            )}
                                                                            {cart.totalVendorPoints != null && (
                                                                                <div className="flex items-center justify-between text-sm">
                                                                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                                                                        <Star className="w-3 h-3 fill-purple-400 text-purple-400" />
                                                                                        Vendor pts
                                                                                    </span>
                                                                                    <span className="font-semibold tabular-nums">{cart.totalVendorPoints}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
                                                                                <span className="text-sm font-bold">Total</span>
                                                                                <span className="text-base font-bold tabular-nums">
                                                                                    {formatIQD(cart.totalPrice ?? 0)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full gap-2"
                                                                        onClick={() => router.push(`/invoice/${cart._id}`)}
                                                                    >
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                        View Invoice
                                                                    </Button>
                                                                    {cart.pdfUrl && (
                                                                        <a href={cart.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                                                <Download className="w-3.5 h-3.5" />
                                                                                Download PDF
                                                                            </Button>
                                                                        </a>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex items-center gap-2">
                        <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[110px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 / page</SelectItem>
                                <SelectItem value="25">25 / page</SelectItem>
                                <SelectItem value="50">50 / page</SelectItem>
                                <SelectItem value="100">100 / page</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">
                            {total > 0 ? `Showing page ${currentPage} of ${totalPages}` : "No results"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={!hasPrev || loading}>
                            Previous
                        </Button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={!hasNext || loading}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <Toaster />
        </div>
    );
};

export default Carts;
