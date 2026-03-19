"use client";

import Image from 'next/image';
import logo from '@/assets/Sahel Jeddah Logo 2.png';

export function MobileBlockScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center md:hidden bg-background">

      <div className="flex flex-col items-center text-center gap-8 px-12">

        {/* Logo */}
        <div className="relative w-14 h-14">
          <Image src={logo} alt="Sahel Jeddah" fill sizes="56px" className="object-contain" />
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-foreground/20" />

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            Desktop Required
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please open this dashboard<br />on a desktop or laptop.
          </p>
        </div>

        {/* Brand */}
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40 font-medium">
          Sahel Jeddah
        </p>

      </div>
    </div>
  );
}
