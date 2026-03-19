"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { LoginForm } from "@/components/auth/LoginForm";

export function LoginPageClient() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
      return;
    }
    setInitialCheckDone(true);
  }, []);

  if (!initialCheckDone && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <LoginForm />;
}
