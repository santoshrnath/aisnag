"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Upload, FileImage, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onUploaded?: (drawing: { id: string; name: string }) => void;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 25 * 1024 * 1024; // matches MAX_UPLOAD_SIZE_MB default

export function UploadDrawingDialog({
  projectId,
  projectName,
  onClose,
  onUploaded,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [version, setVersion] = useState("V1");
  const [type, setType] = useState<"FLOOR_PLAN" | "MEP" | "CEILING" | "SECTION" | "SITE" | "OTHER">("FLOOR_PLAN");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFiles(files: FileList | File[] | null) {
    const f = files && files[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast({ kind: "error", title: "File too large", body: `Max 25MB — that one is ${Math.round(f.size / 1024 / 1024)}MB.` });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!name) {
      // Derive a friendly default name from the filename.
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      setName(base.charAt(0).toUpperCase() + base.slice(1));
    }
  }

  async function submit() {
    if (!file || !name.trim()) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("name", name.trim());
      form.append("level", level.trim());
      form.append("version", version.trim() || "V1");
      form.append("type", type);
      const res = await fetch("/api/drawings", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { drawing } = await res.json();
      toast({
        kind: "success",
        title: "Drawing uploaded",
        body: `${drawing.name} — tap to start dropping snags.`,
      });
      onUploaded?.(drawing);
      router.refresh();
      onClose();
    } catch (e: any) {
      toast({ kind: "error", title: "Upload failed", body: e?.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-pop animate-slide-up",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-none sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 pt-safe">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-semibold text-ink-900">Upload drawing</div>
              <div className="text-[11px] text-slate-500">to {projectName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!file && (
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer?.files ?? null);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 transition",
                dragOver
                  ? "border-brand-400 bg-brand-50"
                  : "border-slate-300 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/40",
              )}
            >
              <FileImage className="h-8 w-8 text-brand-500" />
              <div className="text-sm font-semibold text-ink-900">
                Drop floor plan or tap to browse
              </div>
              <div className="text-xs text-slate-500">
                PNG, JPG, WebP, SVG · up to 25MB
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Export from your BIM / CAD tool as an image.
              </div>
            </button>
          )}

          {file && preview && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 bg-dotted">
                <div className="relative flex aspect-video items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-ink-900/70 px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-ink-900/90"
                >
                  Replace
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="mt-5 space-y-3">
            <Field label="Drawing name *" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tower A — Level 5"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Level / floor">
                <input
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. Level 5"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </Field>
              <Field label="Version">
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="V1"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </Field>
            </div>
            <Field label="Type">
              <div className="grid grid-cols-3 gap-1.5">
                {(["FLOOR_PLAN", "MEP", "CEILING", "SECTION", "SITE", "OTHER"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[11px] font-medium",
                        type === t
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {t.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>
            </Field>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-100 px-5 py-3 pb-safe">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={uploading || !file || !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              Upload
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
