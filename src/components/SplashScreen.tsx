"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";
import logo from "@/assets/Sahel Jeddah Logo 2.png";

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function SplashScreen() {
  const router = useRouter();
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  const [progress, setProgress] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const DURATION = 2400;
    const TICK = 16;
    const STEPS = DURATION / TICK;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const raw = Math.min(step / STEPS, 1);
      setProgress(easeOutExpo(raw) * 100);

      if (raw >= 1) {
        clearInterval(timer);
        setTimeout(() => setAnimationDone(true), 220);
      }
    }, TICK);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!animationDone || !isInitialized) return;

    // Resolve target path before fading — navigate first so the page is ready behind the splash
    const target = (() => {
      if (!user) return "/login";
      try {
        const raw = localStorage.getItem("vodex_dashboard_tabs");
        if (raw) {
          const saved = JSON.parse(raw) as {
            tabs: { id: string; path: string }[];
            activeTabId: string | null;
          };
          if (Array.isArray(saved.tabs) && saved.activeTabId) {
            const activeTab = saved.tabs.find((t) => t.id === saved.activeTabId);
            if (activeTab?.path) return activeTab.path;
          }
        }
      } catch { /* ignore */ }
      return "/dashboard";
    })();

    // Navigate immediately so the target page loads behind the splash screen
    router.replace(target);
    // Then start the fade-out — page is already rendering underneath
    setFadingOut(true);
  }, [animationDone, isInitialized, user, router]);

  const logoEnter: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "scale(1) translateY(0)" : "scale(0.78) translateY(22px)",
    transition: "opacity 0.7s ease-out, transform 0.95s cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background select-none"
      style={{
        opacity: fadingOut ? 0 : 1,
        transition: fadingOut ? "opacity 0.56s cubic-bezier(0.4, 0, 1, 1)" : "opacity 0.3s ease-out",
        pointerEvents: fadingOut ? "none" : undefined,
      }}
    >
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 46%, hsl(var(--primary) / 0.06) 0%, transparent 100%)",
          opacity: visible ? 1 : 0,
          transition: "opacity 1.4s ease-out 0.2s",
        }}
      />

      <div className="relative flex flex-col items-center">

        {/* Logo */}
        <div style={logoEnter}>
          <div className="relative w-[108px] h-[108px] rounded-[28px] overflow-hidden">
            <Image
              src={logo}
              alt="Sahel Jeddah"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Loading label */}
        <p
          className="mt-10 font-medium tracking-widest uppercase"
          style={{
            fontSize: "10.5px",
            letterSpacing: "0.22em",
            color: "hsl(var(--muted-foreground))",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease-out 300ms",
          }}
        >
          Initializing System
        </p>

        {/* Progress bar */}
        <div
          className="mt-5"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease-out 400ms",
          }}
        >
          {/* Track */}
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              width: "280px",
              height: "5px",
              background: "hsl(var(--muted))",
            }}
          >
            {/* Fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: "hsl(var(--primary))",
                boxShadow:
                  progress > 2
                    ? "0 0 12px hsl(var(--primary) / 0.55), 0 0 5px hsl(var(--primary) / 0.35)"
                    : "none",
                transition: "box-shadow 0.3s ease",
              }}
            >
              {/* Shimmer */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, hsl(var(--background) / 0.5) 50%, transparent 100%)",
                  animation: "shimmerSweep 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* Percentage */}
          <p
            className="mt-3 text-center font-medium tabular-nums"
            style={{
              fontSize: "11px",
              letterSpacing: "0.12em",
              color: "hsl(var(--muted-foreground))",
              opacity: visible ? 0.65 : 0,
              transition: "opacity 0.5s ease-out 600ms",
            }}
          >
            {Math.round(easeOutCubic(progress / 100) * 100)}%
          </p>
        </div>

      </div>
    </div>
  );
}
