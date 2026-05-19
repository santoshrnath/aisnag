"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { UploadDrawingDialog } from "@/components/drawing/UploadDrawingDialog";

// Header strip for /drawings — title + "Upload drawing" CTA. Pulled out
// of the page so we can mount the upload dialog as client state.
export function DrawingsHeader({
  projectId,
  projectName,
  count,
}: {
  projectId: string;
  projectName: string;
  count: number;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <div className="border-b border-slate-200 bg-white px-4 py-5 lg:flex lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Drawings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {count} {count === 1 ? "drawing" : "drawings"} · {projectName}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 lg:mt-0"
        >
          <Upload className="h-4 w-4" />
          Upload drawing
        </button>
      </div>

      {showUpload && (
        <UploadDrawingDialog
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
}
