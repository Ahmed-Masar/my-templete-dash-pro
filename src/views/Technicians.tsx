"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
    Search, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle, UserCog, Loader2, Store
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTechnicians, approveTechnician, rejectTechnician, Technician } from "@/store/slices/techniciansSlice";
import { formatDate } from "@/lib/formatters";

export default function Technicians() {
    const dispatch = useAppDispatch();
    const { technicians, loading, total, results } = useAppSelector((state) => state.technicians);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: "approve" | "reject";
        technician: Technician | null;
    }>({ open: false, type: "approve", technician: null });

    useEffect(() => {
        dispatch(fetchTechnicians({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);

    const openConfirm = (type: "approve" | "reject", technician: Technician) => {
        setConfirmDialog({ open: true, type, technician });
    };

    const closeConfirm = () => {
        setConfirmDialog({ open: false, type: "approve", technician: null });
    };

    const confirmAction = async () => {
        if (!confirmDialog.technician) return;
        const { type, technician } = confirmDialog;
        closeConfirm();
        try {
            if (type === "approve") {
                await dispatch(approveTechnician(technician._id)).unwrap();
                toast({
                    title: "Technician Approved ✓",
                    description: `${technician.name} has been approved successfully.`,
                });
            } else {
                await dispatch(rejectTechnician(technician._id)).unwrap();
                toast({
                    title: "Technician Rejected",
                    description: `${technician.name} access has been revoked.`,
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error || "Operation failed. Please try again.",
            });
        }
    };

    const filteredTechnicians = technicians.filter(
        (t) =>
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(t.phone).includes(searchTerm) ||
            t.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const approvedCount = technicians.filter((t) => t.isApproved).length;
    const pendingCount = technicians.filter((t) => !t.isApproved).length;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Technicians</h1>
                    <p className="text-muted-foreground">Manage technician accounts and approvals.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, phone, city or vendor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-80"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                        <UserCog className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Technicians</p>
                        <p className="text-2xl font-bold">{results}</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Approved</p>
                        <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 rounded-lg bg-orange-400/10">
                        <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Phone</TableHead>
                                <TableHead className="font-semibold">City</TableHead>
                                <TableHead className="font-semibold">Vendor</TableHead>
                                <TableHead className="font-semibold text-center">Points</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                                <TableHead className="font-semibold text-center">Joined</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTechnicians.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        No technicians found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTechnicians.map((technician) => (
                                    <TableRow
                                        key={technician._id}
                                        className="hover:bg-muted/50 cursor-pointer"
                                        onClick={() => setSelectedTechnician(technician)}
                                    >
                                        <TableCell className="font-medium">{technician.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{technician.phone}</TableCell>
                                        <TableCell>{technician.city || "—"}</TableCell>
                                        <TableCell>
                                            {technician.vendor ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="font-medium text-sm">{technician.vendor.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                                <span className="font-semibold">{technician.points ?? 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {technician.isApproved ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/40 text-green-600 bg-green-50/60 dark:bg-green-900/20 dark:text-green-400">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-orange-400/40 text-orange-600 bg-orange-50/60 dark:bg-orange-900/20 dark:text-orange-400">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground text-sm">
                                            {formatDate(technician.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {!technician.isApproved ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); openConfirm("approve", technician); }}
                                                        className="hover:bg-green-600 hover:text-white hover:border-green-600 border-green-500/50 text-green-600 transition-all duration-200"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); openConfirm("reject", technician); }}
                                                        className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive border-orange-400/50 text-orange-600 transition-all duration-200"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
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
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => p - 1)}
                            disabled={currentPage <= 1 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage >= totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Technician Detail Dialog */}
            <Dialog open={!!selectedTechnician} onOpenChange={(open) => { if (!open) setSelectedTechnician(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Technician Details</DialogTitle>
                        <DialogDescription>Full information for this technician account.</DialogDescription>
                    </DialogHeader>
                    {selectedTechnician && (
                        <div className="space-y-4">
                            {/* Avatar + Name */}
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/60">
                                <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0 select-none">
                                    {selectedTechnician.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                                <div>
                                    <p className="font-semibold text-base">{selectedTechnician.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedTechnician.city || "—"}</p>
                                </div>
                                <div className="ml-auto">
                                    {selectedTechnician.isApproved ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/40 text-green-600 bg-green-50/60">
                                            <CheckCircle2 className="w-3 h-3" /> Approved
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-orange-400/40 text-orange-600 bg-orange-50/60">
                                            <Clock className="w-3 h-3" /> Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone</p>
                                    <p className="font-semibold">{selectedTechnician.phone}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">City</p>
                                    <p className="font-semibold">{selectedTechnician.city || "—"}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-primary/5 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Points</p>
                                    <p className="font-bold text-primary text-lg">{selectedTechnician.points ?? 0}</p>
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Joined</p>
                                    <p className="font-semibold text-sm">{formatDate(selectedTechnician.createdAt)}</p>
                                </div>
                            </div>

                            {/* Vendor Info */}
                            <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Assigned Vendor</p>
                                {selectedTechnician.vendor ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Store className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <p className="font-semibold">{selectedTechnician.vendor.name}</p>
                                    </div>
                                ) : (
                                    <p className="font-semibold text-muted-foreground">No vendor assigned</p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedTechnician(null)}>
                            Close
                        </Button>
                        {selectedTechnician && !selectedTechnician.isApproved ? (
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => { openConfirm("approve", selectedTechnician); setSelectedTechnician(null); }}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                            </Button>
                        ) : selectedTechnician ? (
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => { openConfirm("reject", selectedTechnician); setSelectedTechnician(null); }}
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => { if (!open) closeConfirm(); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="items-center text-center pb-2">
                        <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                                confirmDialog.type === "approve" ? "bg-green-500/10" : "bg-destructive/10"
                            }`}
                        >
                            {confirmDialog.type === "approve" ? (
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            ) : (
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            )}
                        </div>
                        <DialogTitle>
                            {confirmDialog.type === "approve" ? "Approve Technician" : "Reject Technician"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === "approve"
                                ? `Are you sure you want to approve ${confirmDialog.technician?.name}? They will gain full platform access.`
                                : `Are you sure you want to reject ${confirmDialog.technician?.name}? This will revoke their platform access.`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={closeConfirm} className="w-full">
                            Cancel
                        </Button>
                        <Button
                            variant={confirmDialog.type === "approve" ? "default" : "destructive"}
                            onClick={confirmAction}
                            className={`w-full ${confirmDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                            {confirmDialog.type === "approve" ? "Approve" : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
}
