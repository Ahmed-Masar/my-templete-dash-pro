import { createSlice } from '@reduxjs/toolkit';

export type NotificationStatus = 'sent' | 'failed';
export type TargetType = 'all' | 'role' | 'user';
export type RoleType = 'user' | 'vendor' | 'technician';

export interface NotificationTarget {
    type: TargetType;
    role?: RoleType;
    userId?: string;
    userName?: string;
}

export interface AppNotification {
    _id: string;
    title: string;
    message: string;
    target: NotificationTarget;
    reach: number;
    status: NotificationStatus;
    sentAt?: string;
    createdAt: string;
}

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {},
    reducers: {},
});

export default notificationsSlice.reducer;
