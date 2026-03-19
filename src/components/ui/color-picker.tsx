"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


function hexToHsv(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [0, 0, 1];
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, v];
}

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${[f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}


const PRESETS = [
  "#000000", "#1a1a1a", "#404040", "#737373", "#d4d4d4", "#ffffff",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6",
  "#ec4899", "#06b6d4", "#10b981", "#84cc16",
];


interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);
  const safeHex = isValidHex ? value : "#000000";

  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(safeHex));
  const [hexInput, setHexInput] = useState(safeHex);
  const [open, setOpen] = useState(false);

  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingSV = useRef(false);
  const isDraggingHue = useRef(false);

  const [h, s, v] = hsv;

  useEffect(() => {
    if (isValidHex) {
      setHsv(hexToHsv(value));
      setHexInput(value);
    }
  }, [value, isValidHex]);

  const commitHex = useCallback((newHsv: [number, number, number]) => {
    const hex = hsvToHex(...newHsv);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  const pickSV = useCallback((clientX: number, clientY: number) => {
    if (!svAreaRef.current) return;
    const rect = svAreaRef.current.getBoundingClientRect();
    const newS = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newV = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    const updated: [number, number, number] = [h, newS, newV];
    setHsv(updated);
    commitHex(updated);
  }, [h, commitHex]);

  const onSVPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingSV.current = true;
    pickSV(e.clientX, e.clientY);
  };
  const onSVPointerMove = (e: React.PointerEvent) => {
    if (isDraggingSV.current) pickSV(e.clientX, e.clientY);
  };
  const onSVPointerUp = () => { isDraggingSV.current = false; };

  const pickHue = useCallback((clientX: number) => {
    if (!hueTrackRef.current) return;
    const rect = hueTrackRef.current.getBoundingClientRect();
    const newH = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    const updated: [number, number, number] = [newH, s, v];
    setHsv(updated);
    commitHex(updated);
  }, [s, v, commitHex]);

  const onHuePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingHue.current = true;
    pickHue(e.clientX);
  };
  const onHuePointerMove = (e: React.PointerEvent) => {
    if (isDraggingHue.current) pickHue(e.clientX);
  };
  const onHuePointerUp = () => { isDraggingHue.current = false; };

  const onHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("#")) val = "#" + val;
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const newHsv = hexToHsv(val);
      setHsv(newHsv);
      onChange(val);
    }
  };

  const hueOnlyColor = hsvToHex(h, 1, 1);
  const currentHex = hsvToHex(h, s, v);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-10 h-10 rounded-lg border-2 border-border hover:border-ring focus:border-ring",
            "transition-all duration-150 shadow-sm flex-shrink-0 outline-none",
            className
          )}
          style={{ backgroundColor: isValidHex ? value : "hsl(var(--muted))" }}
          aria-label="Pick color"
        />
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-4 space-y-3"
        align="start"
        sideOffset={8}
      >
        <div
          ref={svAreaRef}
          className="relative w-full rounded-lg select-none cursor-crosshair"
          style={{ height: 150 }}
          onPointerDown={onSVPointerDown}
          onPointerMove={onSVPointerMove}
          onPointerUp={onSVPointerUp}
        >
          <div
            className="absolute inset-0 rounded-lg"
            style={{ background: `linear-gradient(to right, #fff, ${hueOnlyColor})` }}
          />
          <div
            className="absolute inset-0 rounded-lg"
            style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
          />
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none"
            style={{
              left: `${s * 100}%`,
              top: `${(1 - v) * 100}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: currentHex,
              boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        <div
          ref={hueTrackRef}
          className="relative w-full rounded-full select-none cursor-pointer"
          style={{
            height: 14,
            background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
          }}
          onPointerDown={onHuePointerDown}
          onPointerMove={onHuePointerMove}
          onPointerUp={onHuePointerUp}
        >
          <div
            className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white pointer-events-none"
            style={{
              left: `${(h / 360) * 100}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: hueOnlyColor,
              boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg border border-border flex-shrink-0 shadow-sm"
            style={{ backgroundColor: currentHex }}
          />
          <Input
            value={hexInput}
            onChange={onHexInputChange}
            placeholder="#000000"
            className="flex-1 h-9 font-mono text-sm tracking-wide"
            maxLength={7}
            spellCheck={false}
          />
        </div>

        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Presets</p>
          <div className="grid grid-cols-8 gap-1.5">
            {PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                title={preset}
                className={cn(
                  "w-full aspect-square rounded-md border transition-all duration-100",
                  "hover:scale-110 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  currentHex === preset ? "border-ring ring-1 ring-ring scale-110" : "border-border/50"
                )}
                style={{ backgroundColor: preset }}
                onClick={() => {
                  const newHsv = hexToHsv(preset);
                  setHsv(newHsv);
                  setHexInput(preset);
                  onChange(preset);
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
