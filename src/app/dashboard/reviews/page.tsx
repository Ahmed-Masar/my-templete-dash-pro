"use client";

import { useState, useEffect } from "react";
import {
    Trash2, Search, Star,
    ShieldCheck, Clock, ChevronDown, CheckCircle2,
    ShoppingBag, AlertTriangle, Eye, PanelRight, AppWindow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { approveReview, deleteReview, fetchReviews, Review } from "@/store/slices/reviewsSlice";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";

const ITEMS_PER_PAGE = 10;

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
    const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`${cls} ${i < rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20"}`} />
            ))}
        </div>
    );
}

export default function ReviewsPage() {
    const dispatch = useAppDispatch();
    const { reviews, loading, total } = useAppSelector((s) => s.reviews);
    const { toast } = useToast();

    const [deleteId,       setDeleteId]       = useState<string | null>(null);
    const [searchTerm,     setSearchTerm]     = useState("");
    const [currentPage,    setCurrentPage]    = useState(1);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [lightboxImg,    setLightboxImg]    = useState<string | null>(null);
    const [viewMode,       setViewMode]       = useState<"dialog" | "sheet">("dialog");

    useEffect(() => {
        dispatch(fetchReviews({ page: currentPage, limit: ITEMS_PER_PAGE }));
    }, [dispatch, currentPage]);

    const handleApprove = async (id: string) => {
        try {
            await dispatch(approveReview(id)).unwrap();
            toast({ title: "Review Approved ✓", description: "The review is now visible to customers." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e || "Failed to approve" });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        if (selectedReview?._id === id) setSelectedReview(null);
        try {
            await dispatch(deleteReview(id)).unwrap();
            toast({ title: "Review Deleted", description: "The review has been removed." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e || "Failed to delete" });
        }
    };

    const filtered    = reviews.filter((r) =>
        (r.user?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (r.comment?.toLowerCase()    || "").includes(searchTerm.toLowerCase())
    );
    const totalPages  = Math.ceil(total / ITEMS_PER_PAGE) || 1;
    const hasPrev     = currentPage > 1;
    const hasNext     = currentPage < totalPages;

    return (
        <div className="container mx-auto p-6 space-y-6">

            {/* ── Header ── */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Reviews</h1>
                    <p className="text-muted-foreground">Manage and moderate customer reviews.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 w-64"
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-semibold">User</TableHead>
                                <TableHead className="font-semibold">Rating</TableHead>
                                <TableHead className="font-semibold">Comment</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading Data...</TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No reviews found.</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((review) => (
                                    <TableRow key={review._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedReview(review)}>

                                        {/* User */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
                                                    {review.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-sm">{review.user?.name || "Unknown"}</p>
                                                    {review.isBought && (
                                                        <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                                                            <ShoppingBag className="w-2.5 h-2.5" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Rating */}
                                        <TableCell>
                                            <StarDisplay rating={review.rating} />
                                        </TableCell>

                                        {/* Comment */}
                                        <TableCell className="max-w-[220px]">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {review.comment || "—"}
                                            </p>
                                        </TableCell>

                                        {/* Status — same pattern as Users.tsx */}
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <button className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer
                                                        ${review.isApproved
                                                            ? "border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400"
                                                            : "border-orange-400/40 text-orange-600 bg-orange-50/60 hover:bg-orange-100/80 dark:bg-orange-900/20 dark:text-orange-400"
                                                        }`}>
                                                        {review.isApproved
                                                            ? <CheckCircle2 className="w-3 h-3" />
                                                            : <Clock className="w-3 h-3" />}
                                                        {review.isApproved ? "Approved" : "Pending"}
                                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); if (!review.isApproved) handleApprove(review._id); }}
                                                        className={`flex items-center gap-2 cursor-pointer ${review.isApproved ? "bg-green-50/60 text-green-700 font-semibold pointer-events-none" : ""}`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span>Approve</span>
                                                        {review.isApproved && <span className="ml-auto text-[10px] text-green-500">✓ Active</span>}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex items-center gap-2 pointer-events-none opacity-50">
                                                        <Clock className="w-4 h-4 text-orange-500" />
                                                        <span>Pending</span>
                                                        {!review.isApproved && <span className="ml-auto text-[10px] text-orange-500">✓ Active</span>}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {formatDate(review.createdAt)}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {!review.isApproved && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); handleApprove(review._id); }}
                                                        className="hover:bg-green-600 hover:text-white hover:border-green-600 border-green-500/50 text-green-600 transition-all duration-200"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedReview(review); }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); setDeleteId(review._id); }}
                                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination — same as Users.tsx */}
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        {total > 0 ? `Showing page ${currentPage} of ${totalPages}` : "No results"}
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={!hasPrev || loading}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={!hasNext || loading}>Next</Button>
                    </div>
                </div>
            </div>

            {/* ── Review Detail — shared content ── */}
            {(() => {
                if (!selectedReview) return null;

                const reviewContent = (
                    <>
                        {/* User info */}
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/60">
                            <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0 select-none">
                                {selectedReview.user?.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                            <div>
                                <p className="font-semibold">{selectedReview.user?.name || "Unknown"}</p>
                                {selectedReview.isBought ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-1">
                                        <ShoppingBag className="w-3 h-3" /> Verified Purchase
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Unverified purchase</span>
                                )}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</p>
                            <div className="flex items-center gap-2">
                                <StarDisplay rating={selectedReview.rating} size="lg" />
                                <span className="text-sm font-semibold text-muted-foreground">{selectedReview.rating} / 5</span>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
                                    ${selectedReview.isApproved
                                        ? "border-green-500/40 text-green-600 bg-green-50/60"
                                        : "border-orange-400/40 text-orange-600 bg-orange-50/60"
                                    }`}>
                                    {selectedReview.isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                    {selectedReview.isApproved ? "Approved" : "Pending"}
                                </span>
                                {!selectedReview.isApproved && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/40 text-green-600 hover:bg-green-50"
                                        onClick={() => handleApprove(selectedReview._id)}>
                                        <ShieldCheck className="w-3 h-3 mr-1" /> Approve
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comment</p>
                            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                                {selectedReview.comment
                                    ? <p className="text-sm leading-relaxed">{selectedReview.comment}</p>
                                    : <p className="text-sm italic text-muted-foreground">No comment provided.</p>
                                }
                            </div>
                        </div>

                        {/* Images */}
                        {selectedReview.images && selectedReview.images.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Images ({selectedReview.images.length})
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedReview.images.map((img, i) => (
                                        <button key={i} onClick={() => setLightboxImg(img)}
                                            className="aspect-square rounded-lg overflow-hidden border border-border hover:scale-105 hover:shadow-md transition-all duration-200">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDate(selectedReview.createdAt)}
                            </p>
                        </div>
                    </>
                );

                /* ── Toggle button ── */
                const toggleBtn = (
                    <button
                        title={viewMode === "dialog" ? "Switch to side panel" : "Switch to popup"}
                        onClick={() => setViewMode(v => v === "dialog" ? "sheet" : "dialog")}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        {viewMode === "dialog"
                            ? <PanelRight className="w-4 h-4" />
                            : <AppWindow className="w-4 h-4" />
                        }
                    </button>
                );

                /* ── Footer buttons ── */
                const footerBtns = (
                    <>
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedReview(null)}>Close</Button>
                        <Button variant="destructive" className="flex-1"
                            onClick={() => { setDeleteId(selectedReview._id); setSelectedReview(null); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    </>
                );

                /* ── Dialog mode ── */
                if (viewMode === "dialog") return (
                    <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                        <DialogContent className="max-w-lg">
                            {/* Toggle sits on same row as X (right-4 top-4), so we place it at right-10 top-4 */}
                            <div className="absolute right-10 top-4 z-10">
                                {toggleBtn}
                            </div>
                            <DialogHeader>
                                <DialogTitle>Review Details</DialogTitle>
                                <DialogDescription>Full review information and actions</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
                                {reviewContent}
                            </div>
                            <DialogFooter className="flex gap-2 pt-2">
                                {footerBtns}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                );

                /* ── Sheet mode ── */
                return (
                    <Sheet open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
                        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                            {/* Toggle sits on same row as X (right-4 top-4), so we place it at right-10 top-4 */}
                            <div className="absolute right-10 top-4 z-10">
                                {toggleBtn}
                            </div>
                            <SheetHeader className="px-6 py-5 border-b shrink-0">
                                <SheetTitle>Review Details</SheetTitle>
                                <SheetDescription>Full review information and actions</SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                                {reviewContent}
                            </div>
                            <div className="px-6 py-4 border-t shrink-0 flex gap-2">
                                {footerBtns}
                            </div>
                        </SheetContent>
                    </Sheet>
                );
            })()}

            {/* ── Image Lightbox ── */}
            <Dialog open={!!lightboxImg} onOpenChange={(open) => !open && setLightboxImg(null)}>
                <DialogContent className="max-w-3xl p-2 bg-black/90 border-0">
                    {lightboxImg && <img src={lightboxImg} alt="Review" className="w-full h-auto rounded-lg object-contain max-h-[85vh]" />}
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm — same as Users.tsx ── */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="items-center text-center pb-2">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>
                        <DialogTitle>Delete Review</DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to delete this review? This action is irreversible!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)} className="w-full">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} className="w-full">Delete Now</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
