"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { checkAuth, logout } from "@/store/slices/authSlice";
import { initializeTheme } from "@/store/slices/themeSlice";
import { setupAxiosInterceptors } from "@/lib/axios";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function InitStore({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    setupAxiosInterceptors(store, () => store.dispatch(logout()));
    dispatch(initializeTheme());
    dispatch(checkAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <InitStore>
            {children}
            <Toaster />
            <Sonner />
          </InitStore>
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}
