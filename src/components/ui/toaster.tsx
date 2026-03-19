import * as React from "react";
import { TickCircle as CheckCircle2, CloseCircle as XCircle, Danger as AlertTriangle, InfoCircle as Info } from "iconsax-react";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "warning" | "destructive";

const ICONS: Record<ToastVariant, React.ElementType> = {
  default:     Info,
  success:     CheckCircle2,
  warning:     AlertTriangle,
  destructive: XCircle,
};

const ICON_BADGE: Record<ToastVariant, string> = {
  default:     "bg-muted text-muted-foreground",
  success:     "bg-success/10 text-success",
  warning:     "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

const PROGRESS_COLOR: Record<ToastVariant, string> = {
  default:     "bg-foreground/20",
  success:     "bg-success/60",
  warning:     "bg-warning/60",
  destructive: "bg-destructive/60",
};

function ToastProgress({
  duration = 5000,
  variant = "default",
}: {
  duration?: number;
  variant?: ToastVariant;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.width = "0%";
      });
    });
  }, []);

  return (
    <div className="h-[2px] w-full bg-border/30">
      <div
        ref={ref}
        className={cn("h-full w-full", PROGRESS_COLOR[variant])}
        style={{ transition: `width ${duration}ms linear` }}
      />
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        const v: ToastVariant = (variant as ToastVariant) ?? "default";
        const Icon = ICONS[v];
        const toastDuration = typeof duration === "number" ? duration : 5000;

        return (
          <Toast key={id} variant={v} duration={toastDuration} {...props}>
            <div className="flex items-start gap-3.5 p-4">

              {/* Icon badge */}
              <div className={cn("shrink-0 rounded-lg p-2", ICON_BADGE[v])}>
                <Icon color="currentColor" size="16" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>

              {action}
              <ToastClose />
            </div>

            {/* Progress bar */}
            <ToastProgress duration={toastDuration} variant={v} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
