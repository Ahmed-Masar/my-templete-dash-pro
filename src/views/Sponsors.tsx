"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Plus, Edit, Trash2, Search, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSponsors, createSponsor, updateSponsor, deleteSponsor, Sponsor } from "@/store/slices/sponsorsSlice";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatDate } from "@/lib/formatters";

const Sponsors: React.FC = () => {
    const dispatch = useAppDispatch();
    const { sponsors, loading, total } = useAppSelector((state) => state.sponsors);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
    const [sponsorToDelete, setSponsorToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [sponsorForm, setSponsorForm] = useState({
        name: "",
        image: "" as string | null,
        link: "",
    });

    useEffect(() => {
        dispatch(fetchSponsors({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);

    const handleAdd = () => {
        setSelectedSponsor(null);
        setSponsorForm({ name: "", image: null, link: "" });
        setIsAddDialogOpen(true);
    };

    const handleEdit = (sponsor: Sponsor) => {
        setSelectedSponsor(sponsor);
        setSponsorForm({
            name: sponsor.name,
            image: sponsor.image || null,
            link: sponsor.link || "",
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setSponsorToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!sponsorToDelete) return;
        try {
            await dispatch(deleteSponsor(sponsorToDelete)).unwrap();
            toast({ title: "Success", description: "Sponsor deleted successfully" });
            setIsDeleteDialogOpen(false);
            setSponsorToDelete(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to delete sponsor" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const name = sponsorForm.name.trim();
        if (!name) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Sponsor name is required",
            });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            name,
            image: sponsorForm.image,
            link: sponsorForm.link,
        };

        try {
            if (selectedSponsor) {
                await dispatch(updateSponsor({ id: selectedSponsor._id, data: payload })).unwrap();
                toast({ title: "Success", description: "Sponsor updated successfully" });
                setIsEditDialogOpen(false);
            } else {
                await dispatch(createSponsor(payload)).unwrap();
                toast({ title: "Success", description: "Sponsor added successfully" });
                setIsAddDialogOpen(false);
            }
            setSponsorForm({ name: "", image: null, link: "" });
            setSelectedSponsor(null);
            dispatch(fetchSponsors({ page: currentPage, limit: itemsPerPage }));
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSponsors = sponsors.filter((sponsor) =>
        sponsor.name && sponsor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const goToPrevPage = () => { if (hasPrev) setCurrentPage((p) => p - 1); };
    const goToNextPage = () => { if (hasNext) setCurrentPage((p) => p + 1); };

    const renderFormFields = (isEdit: boolean) => (
        <div className="space-y-4 mt-4">
            <div className="space-y-2">
                <ImageUpload
                    label="Sponsor Image"
                    description="Upload sponsor image. Max 5 MB · PNG, JPG, WEBP"
                    value={sponsorForm.image ? [sponsorForm.image] : []}
                    onChange={(urls) => setSponsorForm((prev) => ({ ...prev, image: urls[0] || null }))}
                    multiple={false}
                    maxSizeInMB={5}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={isEdit ? "editSponsorName" : "sponsorName"}>Sponsor Name *</Label>
                <Input
                    id={isEdit ? "editSponsorName" : "sponsorName"}
                    value={sponsorForm.name}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                    required
                    placeholder="e.g. Acme Corp"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={isEdit ? "editSponsorLink" : "sponsorLink"}>Link *</Label>
                <Input
                    id={isEdit ? "editSponsorLink" : "sponsorLink"}
                    value={sponsorForm.link}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, link: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                    required
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update" : "Add")}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Sponsors</h1>
                    <p className="text-muted-foreground">Manage sponsors and partnerships</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sponsors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="transition-all duration-200 hover:shadow-lg hover:scale-105 bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="font-medium">Add New</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b">
                                <TableHead className="w-[80px] font-semibold">Logo</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Website</TableHead>
                                <TableHead className="font-semibold">Created Date</TableHead>
                                <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredSponsors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No sponsors found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredSponsors.map((sponsor) => (
                                    <TableRow
                                        key={sponsor._id}
                                        className="hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm border-b hover:border-primary/20"
                                        onClick={() => handleEdit(sponsor)}
                                    >
                                        <TableCell>
                                            {sponsor.image ? (
                                                <img
                                                    src={sponsor.image}
                                                    alt={sponsor.name}
                                                    className="w-10 h-10 rounded-lg object-cover bg-muted"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{sponsor.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {sponsor.link ? (
                                                <a
                                                    href={sponsor.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center hover:underline hover:text-primary gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {sponsor.link} <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>{formatDate(sponsor.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(sponsor);
                                                    }}
                                                    className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(sponsor._id);
                                                    }}
                                                    className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevPage}
                            disabled={!hasPrev || loading}
                        >
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={!hasNext || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <FormPanel open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) setSponsorForm({ name: "", image: null, link: "" });
            }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>Add Sponsor</FormPanelTitle>
                        <FormPanelDescription>Add a new sponsor partner</FormPanelDescription>
                    </FormPanelHeader>
                    <form onSubmit={handleSubmit}>
                        {renderFormFields(false)}
                    </form>
                </FormPanelContent>
            </FormPanel>

            <FormPanel open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) setSelectedSponsor(null);
            }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>Edit Sponsor</FormPanelTitle>
                        <FormPanelDescription>Update sponsor details</FormPanelDescription>
                    </FormPanelHeader>
                    <form onSubmit={handleSubmit}>
                        {renderFormFields(true)}
                    </form>
                </FormPanelContent>
            </FormPanel>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this sponsor? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
};

export default Sponsors;
