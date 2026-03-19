"use client";

import { useEffect, useState } from 'react';

export function DashboardFooter() {
  const [version, setVersion] = useState('v1.0.0');

  useEffect(() => {
    fetch('/api/version')
      .then((res) => res.json())
      .then((data) => setVersion(data.version ?? 'v1.0.0'))
      .catch(() => {});
  }, []);

  return (
    <footer className="h-7 shrink-0 border-t border-border bg-surface/60 backdrop-blur-sm flex items-center justify-center gap-2">
      <span className="text-[11px] text-muted-foreground/70 font-medium tracking-wide">Vodex</span>
      <span className="text-muted-foreground/30 text-[11px]">·</span>
      <span className="text-[11px] font-mono text-muted-foreground/50">{version}</span>
    </footer>
  );
}
