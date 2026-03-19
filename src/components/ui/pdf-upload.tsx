"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { uploadsAPI } from "@/lib/api";

type UploadStatus = "uploading" | "success" | "error";

export interface PdfUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  maxSizeInMB?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function PdfUpload({
  value,
  onChange,
  maxSizeInMB = 20,
  className,
  disabled = false,
  label,
}: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus | null>(value ? "success" : null);
  const [fileName, setFileName] = useState<string | null>(
    value ? decodeURIComponent(value.split("/").pop() ?? "File") : null
  );
  const [error, setError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > maxSizeInMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeInMB} MB limit`);
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setFileName(file.name);
    setError(null);

    try {
      const res = await uploadsAPI.uploadProductPdf(file);
      const url: string = (res as any).data?.url ?? (res as any).url;
      setStatus("success");
      onChangeRef.current?.(url);
    } catch {
      setStatus("error");
      setError("Upload failed. Please try again.");
    }
  }, [maxSizeInMB]);

  const processFile = useCallback(
    (file: File) => {
      if (disabled) return;
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        setStatus("error");
        return;
      }
      uploadFile(file);
    },
    [disabled, uploadFile]
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const removePdf = useCallback(() => {
    setStatus(null);
    setFileName(null);
    setError(null);
    onChangeRef.current?.(null);
  }, []);

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const hasFile = status === "success" || status === "uploading" || status === "error";

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {!hasFile && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload PDF – click or drag and drop"
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
          className={cn(
            "relative flex flex-col items-center justify-center",
            "min-h-[120px] rounded-xl border-2 border-dashed",
            "cursor-pointer select-none outline-none overflow-hidden group",
            "transition-all duration-300 ease-out",
            !isDragging && [
              "border-border bg-muted/20",
              "hover:border-primary/50 hover:bg-primary/[0.03]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            ],
            isDragging && [
              "border-primary bg-primary/[0.07]",
              "scale-[1.01] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]",
            ],
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-500",
              isDragging ? "opacity-100" : "opacity-0"
            )}
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-6 text-center">
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl",
                "transition-all duration-300 ease-out",
                isDragging
                  ? "bg-primary text-primary-foreground shadow-lg scale-110"
                  : [
                    "bg-muted text-muted-foreground",
                    "group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105",
                  ]
              )}
            >
              {isDragging ? (
                <FileText className="w-6 h-6" />
              ) : (
                <Upload className="w-6 h-6 transition-transform duration-300 group-hover:-translate-y-0.5" />
              )}
            </div>

            <div className="space-y-1">
              <p
                className={cn(
                  "text-sm font-semibold transition-colors duration-200",
                  isDragging ? "text-primary" : "text-foreground"
                )}
              >
                {isDragging ? "Release to upload PDF" : "Drag & drop PDF here"}
              </p>
              <p className="text-xs text-muted-foreground">
                or{" "}
                <span className="font-medium underline underline-offset-2 decoration-dotted text-foreground group-hover:text-primary transition-colors">
                  click to browse
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Max {maxSizeInMB} MB · PDF only
              </p>
            </div>
          </div>
        </div>
      )}

      {hasFile && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border",
            "transition-all duration-300",
            status === "error"
              ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-muted/20"
          )}
        >
          <div
            className={cn(
              "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg",
              status === "error"
                ? "bg-destructive/10 text-destructive"
                : status === "uploading"
                  ? "bg-primary/10 text-primary"
                  : "bg-emerald-500/10 text-emerald-600"
            )}
          >
            {status === "uploading" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === "error" ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {fileName ?? "PDF File"}
            </p>
            {status === "uploading" && (
              <p className="text-xs text-muted-foreground mt-0.5">Uploading…</p>
            )}
            {status === "success" && value && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 mt-0.5 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Uploaded — View PDF
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            )}
            {status === "error" && (
              <p className="text-xs text-destructive mt-0.5">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {status === "error" && (
              <button
                type="button"
                onClick={openPicker}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                  "bg-destructive/10 text-destructive border border-destructive/20",
                  "hover:bg-destructive hover:text-white transition-colors duration-200"
                )}
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
            {status !== "uploading" && (
              <button
                type="button"
                onClick={removePdf}
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg",
                  "text-muted-foreground border border-border/60 bg-background",
                  "hover:bg-destructive hover:text-white hover:border-destructive/70 transition-all duration-200"
                )}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={onInputChange}
      />
    </div>
  );
}
