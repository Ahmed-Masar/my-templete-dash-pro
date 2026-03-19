"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { canAccessPath, getFirstAllowedPath, hasPermission, PATH_PERMISSION_MAP } from "@/lib/permissions";
import { filterTabsByAllowedPaths } from "@/store/slices/tabsSlice";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  // Once auth is ready, clean up any tabs that the user can't access
  useEffect(() => {
    if (!isInitialized || !user) return;
    const allowedPaths = Object.keys(PATH_PERMISSION_MAP).filter((path) =>
      hasPermission(user, PATH_PERMISSION_MAP[path])
    );
    dispatch(filterTabsByAllowedPaths(allowedPaths));
  }, [isInitialized, user, dispatch]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Silent redirect: if user lacks permission for this path, send to first allowed page
    if (!canAccessPath(user, pathname)) {
      const fallback = getFirstAllowedPath(user);
      router.replace(fallback ?? "/login");
    }
  }, [user, isInitialized, pathname, router]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Render nothing while a permission redirect is pending
  if (!canAccessPath(user, pathname)) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
