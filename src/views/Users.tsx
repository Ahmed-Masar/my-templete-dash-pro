"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPanel, FormPanelContent, FormPanelHeader, FormPanelTitle, FormPanelDescription } from "@/components/ui/form-panel";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { 
    Add as Plus, 
    Edit2 as Edit, 
    Trash, 
    SearchNormal1 as Search, 
    Location as MapPin, 
    Danger as AlertTriangle, 
    People as UsersIcon,
    ArrowDown2 as ChevronDown, 
    TickCircle as CheckCircle2, 
    CloseCircle as XCircle, 
    Timer as Clock 
} from "iconsax-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, createUser, updateUser, deleteUser, User } from "@/store/slices/usersSlice";
import { Badge } from "@/components/ui/badge";
import type L from "leaflet";

const LocationMap = ({ lat, lng, onChange }: { lat: number, lng: number, onChange: (lat: number, lng: number) => void }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const marker = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current || typeof window === 'undefined') return;

        let destroyed = false;

        import('leaflet').then(async (leafletModule) => {
            if (destroyed || !mapRef.current) return;
            await import('leaflet/dist/leaflet.css' as string);
            const L = leafletModule.default;

            const mapIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            if (destroyed || leafletMap.current) return;
            const initialLat = lat || 21.4858;
            const initialLng = lng || 39.1925;
            leafletMap.current = L.map(mapRef.current!).setView([initialLat, initialLng], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(leafletMap.current);

            if (lat && lng) {
                marker.current = L.marker([lat, lng], { icon: mapIcon }).addTo(leafletMap.current);
            }

            leafletMap.current.on('click', (e) => {
                const { lat: newLat, lng: newLng } = e.latlng;
                onChange(newLat, newLng);
                if (marker.current) {
                    marker.current.setLatLng([newLat, newLng]);
                } else {
                    marker.current = L.marker([newLat, newLng], { icon: mapIcon }).addTo(leafletMap.current!);
                }
            });
        });

        return () => {
            destroyed = true;
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
                marker.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (leafletMap.current && marker.current && lat && lng) {
            marker.current.setLatLng([lat, lng]);
            leafletMap.current.setView([lat, lng]);
        }
    }, [lat, lng]);

    return (
        <div className="w-full h-[300px] bg-muted/20 border border-border/60 rounded-xl overflow-hidden relative z-0">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
};

export default function Users() {
    const dispatch = useAppDispatch();
    const { users, loading, total } = useAppSelector((state) => state.users);
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [panelMode, setPanelMode] = useState<'add' | 'edit' | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [userForm, setUserForm] = useState({
        name: "",
        phone: "",
        password: "",
        city: "",
        role: "user",
        lat: 0,
        lng: 0,
        isApproved: true,
    });

    useEffect(() => {
        const params: any = { page: currentPage, limit: itemsPerPage };
        if (roleFilter !== "all") params.role = roleFilter;
        dispatch(fetchUsers(params));
    }, [dispatch, currentPage, roleFilter, itemsPerPage]);

    const resetForm = () => {
        setUserForm({
            name: "",
            phone: "",
            password: "",
            city: "",
            role: "user",
            lat: 21.4858,
            lng: 39.1925,
            isApproved: true,
        });
    };

    const handleClosePanel = () => {
        setPanelMode(null);
        setSelectedUser(null);
        resetForm();
    };

    const handleAdd = () => {
        setSelectedUser(null);
        resetForm();
        setPanelMode('add');
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setUserForm({
            name: user.name || "",
            phone: user.phone ? String(user.phone) : "",
            password: "",
            city: user.city || "",
            role: user.role || "user",
            lat: user.lat || (user.location?.coordinates?.[1]) || 21.4858,
            lng: user.lng || (user.location?.coordinates?.[0]) || 39.1925,
            isApproved: user.isApproved ?? true,
        });
        setPanelMode('edit');
    };

    const handleDelete = (id: string) => {
        setUserToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        const id = userToDelete;
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        try {
            await dispatch(deleteUser(id)).unwrap();
            toast({ title: "Success", description: "User deleted successfully" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to delete user" });
        }
    };

    const handleToggleApproval = async (user: User, approved: boolean) => {
        try {
            await dispatch(updateUser({ id: user._id, data: { isApproved: approved } })).unwrap();
            toast({
                title: approved ? "User Approved ✓" : "User Suspended",
                description: `${user.name} has been ${approved ? 'approved' : 'suspended'} successfully.`,
            });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Failed to update status" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload: any = {
            name: userForm.name,
            phone: Number(userForm.phone),
            city: userForm.city,
            role: userForm.role,
            lat: userForm.lat,
            lng: userForm.lng,
            isApproved: userForm.isApproved,
        };

        if (panelMode === 'add') {
            payload.password = userForm.password;
        }

        try {
            if (panelMode === 'edit' && selectedUser) {
                await dispatch(updateUser({ id: selectedUser._id, data: payload })).unwrap();
                toast({ title: "Success", description: "User updated successfully" });
            } else {
                await dispatch(createUser(payload)).unwrap();
                toast({ title: "Success", description: "User created successfully" });
            }
            handleClosePanel();
            const refetchParams: any = { page: currentPage, limit: itemsPerPage };
            if (roleFilter !== "all") refetchParams.role = roleFilter;
            dispatch(fetchUsers(refetchParams));
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error || "Operation failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter((u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(u.phone).includes(searchTerm)
    );

    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    const hasPrev = currentPage > 1;
    const hasNext = currentPage < totalPages;

    const renderFormFields = () => (
        <div className="space-y-6 mt-2">
            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <UsersIcon color="currentColor" size="16" className="text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Basic Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={userForm.name}
                            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                            required
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                        <Input
                            id="phone"
                            type="text"
                            value={userForm.phone}
                            onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                            required
                            placeholder="1234567890"
                        />
                    </div>
                </div>

                {panelMode === 'add' && (
                    <div className="space-y-2">
                        <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                        <Input
                            id="password"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            required={panelMode === 'add'}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                            id="city"
                            value={userForm.city}
                            onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                            placeholder="e.g. Baghdad, Riyadh..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={userForm.role}
                            onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                        >
                            <SelectTrigger id="role" className="w-full h-9">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="vendor">Vendor</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors group mt-2">
                    <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">Approval Status</p>
                        <p className="text-xs text-muted-foreground">Is the user approved to use the platform?</p>
                    </div>
                    <div
                        onClick={() => setUserForm({ ...userForm, isApproved: !userForm.isApproved })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${userForm.isApproved ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${userForm.isApproved ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <MapPin color="currentColor" size="16" className="text-primary" />
                    <span className="text-sm font-semibold tracking-wide">Location Assignment <span className="text-destructive">*</span></span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Click on the map to pin the user's location.</p>
                {panelMode !== null && (
                    <LocationMap
                        lat={userForm.lat}
                        lng={userForm.lng}
                        onChange={(lat, lng) => setUserForm((prev) => ({ ...prev, lat, lng }))}
                    />
                )}
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                    <div><span className="font-semibold text-foreground">Lat:</span> {userForm.lat?.toFixed(5)}</div>
                    <div><span className="font-semibold text-foreground">Lng:</span> {userForm.lng?.toFixed(5)}</div>
                </div>
            </section>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button type="button" variant="outline" onClick={handleClosePanel} className="min-w-[90px]">
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px] bg-primary hover:bg-primary/90 shadow-md">
                    {isSubmitting ? "Saving..." : panelMode === 'edit' ? "Update User" : "Save User"}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Users Directory</h1>
                    <p className="text-muted-foreground">Manage all registered users, admins and vendors.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search color="currentColor" size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="technician">Technician</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
                        <Plus color="currentColor" size="16" className="mr-2" />
                        <span className="font-medium">Add User</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="rounded-lg border shadow-sm bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Phone</TableHead>
                                <TableHead className="font-semibold">City</TableHead>
                                <TableHead className="font-semibold">Role</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading Data...</TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No users found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleEdit(user)}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>{user.city || "—"}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'vendor' ? 'default' : 'secondary'} className="capitalize">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <button className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer
                                                        ${user.isApproved
                                                            ? 'border-green-500/40 text-green-600 bg-green-50/60 hover:bg-green-100/80 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'border-orange-400/40 text-orange-600 bg-orange-50/60 hover:bg-orange-100/80 dark:bg-orange-900/20 dark:text-orange-400'
                                                        }`}>
                                                        {user.isApproved
                                                            ? <CheckCircle2 color="currentColor" size="12" />
                                                            : <Clock color="currentColor" size="12" />
                                                        }
                                                        {user.isApproved ? "Approved" : "Pending"}
                                                        <ChevronDown color="currentColor" size="12" className="opacity-60" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="center" className="w-48 shadow-xl">
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); handleToggleApproval(user, true); }}
                                                        className={`flex items-center gap-2 cursor-pointer ${user.isApproved ? 'bg-green-50/60 text-green-700 font-semibold' : ''}`}
                                                    >
                                                        <CheckCircle2 color="currentColor" size="16" className="text-green-500" />
                                                        <span>Approve</span>
                                                        {user.isApproved && <span className="ml-auto text-[10px] text-green-500">✓ Active</span>}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); handleToggleApproval(user, false); }}
                                                        className={`flex items-center gap-2 cursor-pointer ${!user.isApproved ? 'bg-orange-50/60 text-orange-700 font-semibold' : ''}`}
                                                    >
                                                        <XCircle color="currentColor" size="16" className="text-orange-500" />
                                                        <span>Suspend</span>
                                                        {!user.isApproved && <span className="ml-auto text-[10px] text-orange-500">✓ Active</span>}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(user); }}>
                                                    <Edit color="currentColor" size="16" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(user._id); }} className="hover:bg-destructive hover:text-destructive-foreground">
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
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={!hasPrev || loading}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={!hasNext || loading}>Next</Button>
                    </div>
                </div>
            </div>

            <FormPanel open={panelMode !== null} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
                <FormPanelContent>
                    <FormPanelHeader>
                        <FormPanelTitle>{panelMode === 'edit' ? 'Edit User' : 'Register New User'}</FormPanelTitle>
                        <FormPanelDescription>
                            {panelMode === 'edit' ? 'Update demographic and role information.' : 'Fill in comprehensive details to add a new account.'}
                        </FormPanelDescription>
                    </FormPanelHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {renderFormFields()}
                    </form>
                </FormPanelContent>
            </FormPanel>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="items-center text-center pb-2">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                            <AlertTriangle color="currentColor" size="32" className="text-destructive" />
                        </div>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to delete this user profile? This action is irreversible!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full">Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} className="w-full">Delete Now</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster />
        </div>
    );
}
