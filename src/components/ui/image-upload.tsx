"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DocumentUpload as Upload,
  Add as X,
  TickCircle as CheckCircle2,
  Danger as AlertCircle,
  Refresh as Loader2,
  Image as ImageIcon,
  Add as Plus,
  Refresh as RefreshCw,
} from "iconsax-react";
import { uploadsAPI } from "@/lib/api";


type UploadStatus = "uploading" | "success" | "error";

interface ImageItem {
  id: string;
  url: string;
  previewUrl: string;
  status: UploadStatus;
  error?: string;
}

export interface ImageUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  maxSizeInMB?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  accept?: string;
  aspect?: "square" | "video" | "portrait";
}

let _seed = 0;
const uid = () => `iu-${Date.now()}-${_seed++}`;

const getImageName = (url: string): string | null => url.split('/').pop() ?? null;

const ASPECT: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
};

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxImages = 10,
  maxSizeInMB = 10,
  className,
  disabled = false,
  label,
  description,
  accept = "image/*",
  aspect = "square",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const [images, setImages] = useState<ImageItem[]>(() =>
    (value ?? []).map((url) => ({
      id: uid(),
      url,
      previewUrl: url,
      status: "success" as UploadStatus,
    }))
  );

  const prevValue = useRef(value);
  useEffect(() => {
    if (
      JSON.stringify(prevValue.current) !== JSON.stringify(value) &&
      (!value || value.length === 0)
    ) {
      setImages([]);
    }
    prevValue.current = value;
  }, [value]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const prevSuccessUrlsRef = useRef<string[]>(value ?? []);
  useEffect(() => {
    const hasUploading = images.some((i) => i.status === "uploading");
    if (hasUploading) return;

    const successUrls = images
      .filter((i) => i.status === "success")
      .map((i) => i.url);
    if (JSON.stringify(successUrls) !== JSON.stringify(prevSuccessUrlsRef.current)) {
      prevSuccessUrlsRef.current = successUrls;
      onChangeRef.current?.(successUrls);
    }
  }, [images]);

  const successCount = images.filter((i) => i.status !== "error").length;
  const canAddMore = multiple ? successCount < maxImages : images.length === 0;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const newImages: ImageItem[] = files.map((file) => ({
        id: uid(),
        url: "",
        previewUrl: URL.createObjectURL(file),
        status: "uploading",
      }));

      setImages((prev) => {
        if (!multiple && prev.length > 0) {
          const old = prev[0];
          if (old.status === "success" && old.url) {
            const name = getImageName(old.url);
            if (name) uploadsAPI.deleteImage(name).catch(console.error);
          }
        }
        return multiple ? [...prev, ...newImages] : [newImages[0]];
      });

      try {
        if (files.length === 1) {
          const file = files[0];
          const id = newImages[0].id;
          const res = await uploadsAPI.uploadImage(file);

          setImages((prev) =>
            prev.map((img) =>
              img.id === id
                ? { ...img, url: res.data.url, status: "success" as UploadStatus }
                : img
            )
          );
        } else {
          const res = await uploadsAPI.uploadImages(files);

          setImages((prev) =>
            prev.map((img) => {
              const batchIndex = newImages.findIndex((ni) => ni.id === img.id);
              if (batchIndex !== -1 && res.data.images[batchIndex]) {
                return {
                  ...img,
                  url: res.data.images[batchIndex].url,
                  status: "success" as UploadStatus,
                };
              }
              return img;
            })
          );
        }
      } catch (error) {
        const idsToFail = newImages.map((i) => i.id);
        setImages((prev) =>
          prev.map((img) =>
            idsToFail.includes(img.id)
              ? { ...img, status: "error", error: "Upload failed" }
              : img
          )
        );
        newImages.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      }
    },
    [multiple]
  );

  const processFiles = useCallback(
    (files: File[]) => {
      if (disabled || (multiple && !canAddMore)) return;

      const slots = multiple ? maxImages - successCount : 1;
      const filesToUpload = files
        .filter((f) => f.size <= maxSizeInMB * 1024 * 1024)
        .slice(0, slots);

      if (filesToUpload.length > 0) {
        uploadFiles(filesToUpload);
      }
    },
    [canAddMore, disabled, maxImages, maxSizeInMB, multiple, successCount, uploadFiles]
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
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      if (item?.status === "success" && item.url) {
        const name = getImageName(item.url);
        if (name) uploadsAPI.deleteImage(name).catch(console.error);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const retryImage = useCallback((id: string) => removeImage(id), [removeImage]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) processFiles(Array.from(e.target.files));
      e.target.value = "";
    },
    [processFiles]
  );

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  return (
    <div className={cn("space-y-3", className)}>
      {(label || description) && (
        <div className="space-y-0.5">
          {label && <p className="text-sm font-medium text-foreground">{label}</p>}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {canAddMore && (
        <DropZone
          isDragging={isDragging}
          disabled={disabled}
          multiple={multiple}
          maxImages={maxImages}
          maxSizeInMB={maxSizeInMB}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={openPicker}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={onInputChange}
      />

      {images.length > 0 && (
        <ImageGrid
          images={images}
          multiple={multiple}
          aspect={aspect}
          canAddMore={canAddMore && multiple && !disabled}
          onRemove={removeImage}
          onRetry={retryImage}
          onAddMore={openPicker}
        />
      )}

    </div>
  );
}

interface DropZoneProps {
  isDragging: boolean;
  disabled: boolean;
  multiple: boolean;
  maxImages: number;
  maxSizeInMB: number;
  onDragEnter: React.DragEventHandler;
  onDragLeave: React.DragEventHandler;
  onDragOver: React.DragEventHandler;
  onDrop: React.DragEventHandler;
  onClick: () => void;
}

function DropZone({
  isDragging,
  disabled,
  multiple,
  maxImages,
  maxSizeInMB,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
}: DropZoneProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload images – click or drag and drop"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "min-h-[180px] rounded-xl border-2 border-dashed",
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

      {isDragging &&
        (["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"] as const).map(
          (pos) => (
            <span
              key={pos}
              aria-hidden
              className={cn(
                "pointer-events-none absolute w-1.5 h-1.5 rounded-full bg-primary",
                "animate-pulse",
                pos
              )}
            />
          )
        )}

      {!isDragging && (
        <>
          <span aria-hidden className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-border/40 rounded-tl-sm transition-colors duration-300 group-hover:border-primary/40" />
          <span aria-hidden className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-border/40 rounded-tr-sm transition-colors duration-300 group-hover:border-primary/40" />
          <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-border/40 rounded-bl-sm transition-colors duration-300 group-hover:border-primary/40" />
          <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-border/40 rounded-br-sm transition-colors duration-300 group-hover:border-primary/40" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-2xl",
            "transition-all duration-300 ease-out",
            isDragging
              ? "bg-primary text-primary-foreground shadow-[0_8px_32px_rgba(0,0,0,0.15)] scale-110"
              : [
                "bg-muted text-muted-foreground",
                "group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105",
              ]
          )}
        >
          {isDragging ? (
            <ImageIcon color="currentColor" size="28" className="animate-bounce" />
          ) : (
            <Upload color="currentColor" size="28" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          )}
        </div>

        <div className="space-y-1.5">
          <p
            className={cn(
              "text-sm font-semibold transition-colors duration-200",
              isDragging ? "text-primary" : "text-foreground"
            )}
          >
            {isDragging ? "Release to upload" : "Drag & drop images here"}
          </p>
          <p className="text-xs text-muted-foreground">
            or{" "}
            <span
              className={cn(
                "font-medium underline underline-offset-2 decoration-dotted",
                isDragging
                  ? "text-primary decoration-primary"
                  : "text-foreground group-hover:text-primary group-hover:decoration-primary/60"
              )}
            >
              click to browse
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground/70 pt-0.5">
            {multiple
              ? `Up to ${maxImages} images · Max ${maxSizeInMB} MB each · PNG, JPG, WEBP`
              : `Max ${maxSizeInMB} MB · PNG, JPG, WEBP`}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SingleImagePreviewProps {
  image: ImageItem;
  onRemove: () => void;
  onRetry: () => void;
  onChangePicker: () => void;
}

function SingleImagePreview({
  image,
  onRemove,
  onRetry,
  onChangePicker,
}: SingleImagePreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border",
        "transition-all duration-500 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        image.status === "error"
          ? "border-destructive/50 bg-destructive/5"
          : "border-border/60"
      )}
    >
      <div className="relative flex items-center justify-center min-h-[180px] bg-muted/30">
        <img
          src={image.previewUrl}
          alt="Preview"
          draggable={false}
          className={cn(
            "max-w-full object-contain transition-all duration-500",
            "max-h-[420px]",
            image.status === "uploading" && "blur-sm brightness-75",
            image.status === "error" && "brightness-50"
          )}
        />

        {image.status === "uploading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-[3px]">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-primary/20" />
              <Loader2 color="currentColor" size="28" className="animate-spin" />
            </div>
            <p className="text-sm font-medium text-foreground">Uploading…</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-border/40">
              <div className="h-full w-1/2 bg-primary/70 animate-shimmer" />
            </div>
          </div>
        )}

        {image.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/10 backdrop-blur-[2px]">
            <AlertCircle color="currentColor" size="32" className="text-destructive" />
            <p className="text-sm font-semibold text-destructive">Upload Failed</p>
          </div>
        )}
      </div>

      {image.status !== "uploading" && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-t border-border/50">
          {image.status === "success" ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 color="currentColor" size="14" />
              Uploaded
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
              <AlertCircle color="currentColor" size="14" />
              Failed
            </span>
          )}

          <div className="flex items-center gap-2">
            {image.status === "error" ? (
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "bg-destructive/10 text-destructive border border-destructive/20",
                  "hover:bg-destructive hover:text-white transition-colors duration-200"
                )}
              >
                <RefreshCw color="currentColor" size="12" />
                Retry
              </button>
            ) : (
              <button
                type="button"
                onClick={onChangePicker}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "bg-background border border-border/60 text-foreground",
                  "hover:border-primary/50 hover:text-primary transition-colors duration-200"
                )}
              >
                <RefreshCw color="currentColor" size="12" />
                Change
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "bg-background border border-border/60 text-foreground",
                "hover:bg-destructive hover:text-white hover:border-destructive/70 transition-colors duration-200"
              )}
            >
              <X color="currentColor" size="12" className="rotate-45" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImageGridProps {
  images: ImageItem[];
  multiple: boolean;
  aspect: string;
  canAddMore: boolean;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onAddMore: () => void;
}

function ImageGrid({
  images,
  multiple,
  aspect,
  canAddMore,
  onRemove,
  onRetry,
  onAddMore,
}: ImageGridProps) {
  if (!multiple) {
    return (
      <SingleImagePreview
        image={images[0]}
        onRemove={() => onRemove(images[0].id)}
        onRetry={() => onRetry(images[0].id)}
        onChangePicker={onAddMore}
      />
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {images.map((img, i) => (
        <Thumbnail
          key={img.id}
          image={img}
          aspect={aspect}
          index={i}
          onRemove={() => onRemove(img.id)}
          onRetry={() => onRetry(img.id)}
        />
      ))}

      {canAddMore && (
        <button
          type="button"
          onClick={onAddMore}
          className={cn(
            ASPECT[aspect] ?? "aspect-square",
            "flex flex-col items-center justify-center gap-1.5 rounded-xl",
            "border-2 border-dashed border-border",
            "text-muted-foreground",
            "hover:border-primary/50 hover:text-primary hover:bg-primary/[0.03]",
            "transition-all duration-200 group"
          )}
        >
          <Plus color="currentColor" size="20" className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
          <span className="text-[10px] font-medium">Add</span>
        </button>
      )}
    </div>
  );
}

interface ThumbnailProps {
  image: ImageItem;
  aspect?: string;
  index?: number;
  fullWidth?: boolean;
  onRemove: () => void;
  onRetry: () => void;
}

function Thumbnail({
  image,
  aspect = "square",
  index = 0,
  fullWidth = false,
  onRemove,
  onRetry,
}: ThumbnailProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const delay = index * 60;
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-xl",
        "border border-border/60 bg-muted/20",
        "transition-all duration-500 ease-out",
        mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3",
        fullWidth ? "w-full h-52" : ASPECT[aspect] ?? "aspect-square",
        image.status === "error" && "border-destructive/50 bg-destructive/5"
      )}
    >
      <img
        src={image.previewUrl}
        alt="Preview"
        draggable={false}
        className={cn(
          "w-full h-full object-cover",
          "transition-all duration-500 ease-out",
          "group-hover:scale-[1.05]",
          image.status === "uploading" && "blur-[2px] brightness-75 scale-100",
          image.status === "error" && "brightness-50"
        )}
      />

      {image.status === "success" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
      {image.status === "uploading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-background/50 backdrop-blur-[3px]">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-10 h-10 rounded-full border-2 border-primary/20" />
            <Loader2 color="currentColor" size="24" className="animate-spin text-primary" />
          </div>
          {fullWidth && (
            <p className="text-xs font-medium text-foreground">Uploading…</p>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-border/40">
            <div className="h-full w-1/2 bg-primary/70 animate-shimmer" />
          </div>
        </div>
      )}

      {image.status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/15 backdrop-blur-[2px] p-2">
          <AlertCircle color="currentColor" size="20" className="text-destructive" />
          <p className="text-[10px] text-destructive font-semibold leading-none">
            Failed
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-1 text-[10px] text-destructive/80 hover:text-destructive transition-colors"
          >
            <RefreshCw color="currentColor" size="10" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {image.status !== "uploading" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute top-2 right-2 z-20",
            "flex items-center justify-center w-6 h-6 rounded-full",
            "bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm",
            "text-foreground",
            "hover:bg-destructive hover:text-white hover:border-destructive/70 hover:scale-110",
            "opacity-0 group-hover:opacity-100",
            "transition-all duration-200"
          )}
        >
          <X color="currentColor" size="12" className="rotate-45" />
        </button>
      )}

      {image.status === "success" && (
        <div
          className={cn(
            "absolute bottom-2 left-2 z-20",
            "flex items-center gap-1 px-1.5 py-0.5 rounded-md",
            "bg-black/50 backdrop-blur-sm",
            "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
            "transition-all duration-200"
          )}
        >
          <CheckCircle2 color="currentColor" size="10" className="text-emerald-400" />
          {fullWidth && (
            <span className="text-[10px] text-white font-medium">Uploaded</span>
          )}
        </div>
      )}
    </div>
  );
}
