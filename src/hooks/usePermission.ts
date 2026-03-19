'use client';

import { useAppSelector } from '@/store/hooks';
import { hasPermission, canAccessPath, getFirstAllowedPath } from '@/lib/permissions';

export function usePermission(key: string | null): boolean {
  const user = useAppSelector((state) => state.auth.user);
  return hasPermission(user, key);
}

export function useCanAccessPath(path: string): boolean {
  const user = useAppSelector((state) => state.auth.user);
  return canAccessPath(user, path);
}

export function useFirstAllowedPath(): string | null {
  const user = useAppSelector((state) => state.auth.user);
  return getFirstAllowedPath(user);
}
