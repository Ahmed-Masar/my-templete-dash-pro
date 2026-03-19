"use client";

import { useState, useEffect, useCallback } from "react";

export type PanelMode = "dialog" | "sheet";

const STORAGE_KEY = "form-panel-mode";
const DEFAULT_MODE: PanelMode = "sheet";

export function useFormPanelMode(): [PanelMode, (mode: PanelMode) => void] {
  const [mode, setModeState] = useState<PanelMode>(DEFAULT_MODE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PanelMode | null;
    if (saved === "dialog" || saved === "sheet") {
      setModeState(saved);
    }
  }, []);

  const setMode = useCallback((newMode: PanelMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  return [mode, setMode];
}
