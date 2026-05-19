"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Map, Camera, Sparkles } from "lucide-react";
import { UploadDrawingDialog } from "@/components/drawing/UploadDrawingDialog";

interface Props {
  projectId: string;
  projectName: string;
}

// Shown on the dashboard / drawings list when the current project has
// zero drawings yet. The one obvious next action is "upload a drawing".
export function EmptyDrawings({ projectId, projectName }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6 shadow-card lg:p-8 animate-fade-in">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-100/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              <Sparkles className="h-3 w-3" />
              Get started
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-ink-900">
              Upload your first drawing
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Drop a floor plan (PNG, JPG, WebP or SVG) and you'll be able to tap to
              place snags, attach photos, and let Claude draft each one for you.
            </p>

            <ol className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <li className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">1</span>
                <Map className="h-3.5 w-3.5 text-slate-400" /> Upload a drawing
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">2</span>
                Tap to drop a pin
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">3</span>
                <Camera className="h-3.5 w-3.5 text-slate-400" /> Photo → Claude drafts
              </li>
            </ol>
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700"
          >
            <Upload className="h-4 w-4" />
            Upload drawing
          </button>
        </div>
      </div>

      {showUpload && (
        <UploadDrawingDialog
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowUpload(false)}
          onUploaded={() => router.refresh()}
        />
      )}
    </>
  );
}
