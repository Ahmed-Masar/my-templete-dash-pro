"use client";

import * as React from "react";
import { SidebarRight as PanelRight, Stop as Square } from "iconsax-react";
import { cn } from "@/lib/utils";
import { useFormPanelMode, type PanelMode } from "@/hooks/use-form-panel-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Context ──────────────────────────────────────────────────────────────────
// NEVER put `open` or `onOpenChange` in this context.
// Doing so causes every consumer to re-render on open/close, which re-attaches
// Radix refs and can trigger usePresence.setState → infinite loop.

interface FormPanelContextValue {
  mode: PanelMode;
  toggleMode: () => void;
}

const FormPanelContext = React.createContext<FormPanelContextValue | null>(null);

function useFormPanelContext() {
  const ctx = React.useContext(FormPanelContext);
  if (!ctx) throw new Error("FormPanel compound components must be used within <FormPanel>");
  return ctx;
}

// ─── FormPanel ────────────────────────────────────────────────────────────────

interface FormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function FormPanel({ open, onOpenChange, children }: FormPanelProps) {
  const [mode, setMode] = useFormPanelMode();

  // Stable callback via ref — never re-creates, so nothing downstream
  // sees a prop identity change that could kick off Radix's state machine.
  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const handleClose = React.useCallback(() => onOpenChangeRef.current(false), []);

  // Direct mode switch — no close/reopen animation needed.
  // The Sheet slides out / Dialog closes automatically when open becomes false,
  // and the new mode's component gets open=true immediately.
  const toggleMode = React.useCallback(() => {
    setMode(mode === "sheet" ? "dialog" : "sheet");
  }, [mode, setMode]);

  const contextValue = React.useMemo<FormPanelContextValue>(
    () => ({ mode, toggleMode }),
    [mode, toggleMode]
  );

  const toggleButton = (
    <button
      type="button"
      onClick={toggleMode}
      className="absolute right-11 top-4 rounded-sm opacity-50 transition-opacity hover:opacity-100 focus:outline-none"
      title={mode === "sheet" ? "Switch to dialog" : "Switch to panel"}
    >
      {mode === "sheet" ? <Square color="currentColor" size="16" /> : <PanelRight color="currentColor" size="16" />}
    </button>
  );

  return (
    <FormPanelContext.Provider value={contextValue}>
      {mode === "sheet" ? (
        /**
         * REAL RADIX SHEET — with forceMount to prevent the @radix-ui/react-presence loop.
         *
         * Root cause of previous loops: @radix-ui/react-presence.
         * Every Sheet mount/unmount detaches Radix's internal ref → usePresence fires
         * setState(false) → re-render → another detach → infinite loop.
         *
         * Fix: forceMount={true} keeps SheetContent always in the DOM.
         * No unmount = no ref detach = no usePresence setState = no loop.
         * data-[state=open/closed] CSS animations still work perfectly.
         * sheet.tsx adds data-[state=closed]:pointer-events-none to overlay
         * and content so a closed panel never blocks user interaction.
         */
        <Sheet open={open} onOpenChange={handleClose}>
          <SheetContent forceMount side="right" className="overflow-y-auto flex flex-col">
            {toggleButton}
            {children}
          </SheetContent>
        </Sheet>
      ) : (
        // Dialog mode: only render when open — Radix Dialog does not have
        // the same presence-loop issue as Sheet in this codebase.
        open ? (
          <Dialog open onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
              {toggleButton}
              {children}
            </DialogContent>
          </Dialog>
        ) : null
      )}
    </FormPanelContext.Provider>
  );
}

// ─── Compound sub-components ──────────────────────────────────────────────────

interface FormPanelContentProps {
  children: React.ReactNode;
  className?: string;
}

function FormPanelContent({ children, className }: FormPanelContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}

function FormPanelHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { mode } = useFormPanelContext();
  const Wrapper = mode === "sheet" ? SheetHeader : DialogHeader;
  return (
    <Wrapper className={className} {...props}>
      {children}
    </Wrapper>
  );
}

function FormPanelTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { mode } = useFormPanelContext();
  if (mode === "sheet") {
    return <SheetTitle className={cn(className)} {...(props as any)} />;
  }
  return <DialogTitle className={className} {...(props as any)} />;
}

function FormPanelDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { mode } = useFormPanelContext();
  if (mode === "sheet") {
    return <SheetDescription className={cn(className)} {...(props as any)} />;
  }
  return <DialogDescription className={className} {...(props as any)} />;
}

function FormPanelFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
}

export {
  FormPanel,
  FormPanelContent,
  FormPanelHeader,
  FormPanelTitle,
  FormPanelDescription,
  FormPanelFooter,
};
