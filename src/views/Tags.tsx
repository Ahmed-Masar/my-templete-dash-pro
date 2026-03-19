"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { 
  Tag as TagIcon, 
  Add as Plus, 
  Edit2 as Edit, 
  Trash, 
  SearchNormal1 as Search, 
  Danger as AlertTriangle, 
  Colorfilter as Palette 
} from "iconsax-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTags, createTag, updateTag, deleteTag, Tag } from "@/store/slices/tagsSlice";
import { ColorPicker } from "@/components/ui/color-picker";
import { LocalizedInput, LangValue, toLang, emptyLang, fromLang } from "@/components/ui/localized-input";

function t(val: any): string { return fromLang(val); }

const Tags: React.FC = () => {
    const dispatch = useAppDispatch();
    const { tags, loading, total } = useAppSelector((state) => state.tags);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [tagToDelete, setTagToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [tagForm, setTagForm] = useState<{ title: LangValue; color: string }>({
        title: emptyLang(),
        color: "#000000",
    });

    useEffect(() => {
        dispatch(fetchTags({ page: currentPage, limit: itemsPerPage }));
    }, [dispatch, currentPage, itemsPerPage]);


    const resetForm = () => {
        setTagForm({ title: emptyLang(), color: "#000000" });
    };

    const handleClosePanel = () => {
        setPanelMode(null);
        setSelectedTag(null);
        resetForm();
    };

    const handleAdd = () => {
        setSelectedTag(null);
        resetForm();
        setPanelMode('add');
    };

    const handleEdit = (tag: Tag) => {
        setSelectedTag(tag);
        setTagForm({
            title: toLang(tag.title),
            color: tag.color || "#000000",
        });
        setPanelMode('edit');
    };

    const handleDelete = (id: string) => {
        setTagToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!tagToDelete) return;
        try {
            await dispatch(deleteTag(tagToDelete)).unwrap();
            toast({ title: "Success", description: "Tag deleted successfully" });
            setIsDeleteDialogOpen(false);
            setTagToDelete(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to delete tag" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!tagForm.title.ar.trim()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Arabic tag name is required",
            });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            title: tagForm.title,
            color: tagForm.color,
        };

        try {
            if (selectedTag) {
                await dispatch(updateTag({ id: selectedTag._id, data: payload })).unwrap();
                toast({ title: "Success", description: "Tag updated successfully" });
            } else {
                await dispatch(createTag(payload)).unwrap();
                toast({ title: "Success", description: "Tag added successfully" });
            }
            handleClosePanel();
            dispatch(fetchTags({ page: currentPage, limit: itemsPerPage }));
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
        } finally {
            setIsSubmitting(false);
        }
    };


    const filteredTags = tags.filter((tag) =>
        t(tag.title).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;
    const goToPrevPage = () => { if (hasPrev) setCurrentPage((p) => p - 1); };
    const goToNextPage = () => { if (hasNext) setCurrentPage((p) => p + 1); };


    const renderFormFields = (isEdit: boolean) => (
        <div className="space-y-6 mt-2">

            <div className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-border/60 bg-muted/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Preview</p>
                <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-md transition-all duration-300"
                    style={{
                        backgroundColor: tagForm.color,
                        color: "#ffffff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                >
                    <TagIcon color="currentColor" size="14" />
                    <span>{tagForm.title.ar || "Tag Name"}</span>
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <TagIcon color="currentColor" size="16" className="text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Tag Information</span>
                </div>

                <div className="space-y-2">
                    <Label>
                        Tag Name <span className="text-destructive">*</span>
                    </Label>
                    <LocalizedInput
                        value={tagForm.title}
                        onChange={(v) => setTagForm({ ...tagForm, title: v })}
                        placeholder="e.g. New Arrival"
                        required
                    />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Palette color="currentColor" size="16" className="text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Tag Color</span>
                </div>

                <div className="space-y-2">
                    <Label>Color <span className="text-destructive">*</span></Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/20 transition-colors">
                        <ColorPicker
                            value={tagForm.color}
                            onChange={(hex) => setTagForm({ ...tagForm, color: hex })}
                        />
                        <div className="flex-1">
                            <p className="text-sm font-semibold font-mono">{tagForm.color}</p>
                            <p className="text-xs text-muted-foreground">Click the swatch to pick a color</p>
                        </div>
                        <div
                            className="w-8 h-8 rounded-lg border border-border/60 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: tagForm.color }}
                        />
                    </div>
                </div>
            </section>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClosePanel}
                    className="min-w-[90px]"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[100px] bg-primary hover:bg-primary/90 shadow-md"
                >
                    {isSubmitting
                        ? (isEdit ? "Updating..." : "Adding...")
                        : (isEdit ? "Update Tag" : "Add Tag")}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tags</h1>
                    <p className="text-muted-foreground">Manage product identification tags</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search color="currentColor" size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        className="transition-all duration-200 hover:shadow-lg hover:scale-105 bg-primary hover:bg-primary/90"
                    >
                        <Plus color="currentColor" size="16" className="mr-2" />
                        <span className="font-medium">Add New</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-b">
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Color</TableHead>
                                <TableHead className="w-[120px] text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredTags.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No tags found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredTags.map((tag) => (
                                    <TableRow
                                        key={tag._id}
                                        className="hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm border-b hover:border-primary/20"
                                        onClick={() => handleEdit(tag)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <TagIcon color="currentColor" size="16" className="text-muted-foreground" />
                                                {t(tag.title)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full border shadow-sm"
                                                    style={{ backgroundColor: tag.color || '#000000' }}
                                                />
                                                <span className="text-xs text-muted-foreground font-mono">{tag.color || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(tag); }}
                                                    className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
                                                >
                                                    <Edit color="currentColor" size="16" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(tag._id); }}
                                                    className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:shadow-md hover:scale-105"
                                                >
                                                    <Trash color="currentColor" size="16" />
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
                        <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={!hasPrev || loading}>Previous</Button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!hasNext || loading}>Next</Button>
                    </div>
                </div>
            </div>

            <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>{panelMode === 'edit' ? 'Edit Tag' : 'Add Tag'}</FormPanelTitle>
                        <FormPanelDescription>{panelMode === 'edit' ? 'Update the tag details' : 'Fill in the details for the new tag'}</FormPanelDescription>
                    </FormPanelHeader>
                    <form onSubmit={handleSubmit}>
                        {renderFormFields(panelMode === 'edit')}
                    </form>
                </FormPanelContent>
            </FormPanel>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="items-center text-center pb-2">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                            <AlertTriangle color="currentColor" size="32" className="text-destructive" />
                        </div>
                        <DialogTitle className="text-xl">Delete Tag?</DialogTitle>
                        <DialogDescription className="text-center pt-1">
                            This action cannot be undone. The tag will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            className="w-full sm:w-auto shadow-md"
                        >
                            <Trash color="currentColor" size="16" className="mr-2" />
                            Delete Tag
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
};

export default Tags;
