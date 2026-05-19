"use client";

import {
  MouseEvent as RME,
  PointerEvent as RPE,
  TouchEvent as RTE,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Minus,
  Maximize,
  Filter,
  Layers,
  Download,
  MoreHorizontal,
  Locate,
  X,
} from "lucide-react";
import { cn, statusColor, statusLabel } from "@/lib/utils";
import { SnagSidePanel } from "@/components/drawing/SnagSidePanel";
import { NewSnagSheet } from "@/components/drawing/NewSnagSheet";
import { toast } from "@/components/ui/toast";

interface Pin {
  id: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  pinX: number;
  pinY: number;
  trade?: { name: string } | null;
  assignedTo?: { id: string; name: string; avatarUrl: string | null } | null;
}

interface Props {
  drawingId: string;
  projectId: string;
  drawingName: string;
  drawingVersion?: string;
  imageUrl: string;
  initialPins: Pin[];
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 5;

export function DrawingCanvas({
  drawingId,
  projectId,
  drawingName,
  drawingVersion,
  imageUrl,
  initialPins,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);
  const [filters, setFilters] = useState<{ statuses: string[] }>({
    statuses: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pan state
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const movedRef = useRef(false);
  const pinchRef = useRef<{ d: number; zoom: number } | null>(null);

  const visiblePins = useMemo(() => {
    if (filters.statuses.length === 0) return pins;
    return pins.filter((p) => filters.statuses.includes(p.status));
  }, [pins, filters.statuses]);

  // Center the image when it first loads.
  useEffect(() => {
    if (!imgSize || !wrapperRef.current) return;
    fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize]);

  const fitToScreen = useCallback(() => {
    if (!wrapperRef.current || !imgSize) return;
    const w = wrapperRef.current.clientWidth;
    const h = wrapperRef.current.clientHeight;
    const z = Math.min(w / imgSize.w, h / imgSize.h, 1);
    setZoom(z);
    setTx((w - imgSize.w * z) / 2);
    setTy((h - imgSize.h * z) / 2);
  }, [imgSize]);

  // Convert image-relative coords (normalized 0..1) to screen
  function toScreen(p: { pinX: number; pinY: number }) {
    if (!imgSize) return { left: 0, top: 0 };
    return {
      left: tx + p.pinX * imgSize.w * zoom,
      top: ty + p.pinY * imgSize.h * zoom,
    };
  }

  function onPointerDown(e: RPE<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    movedRef.current = false;
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: RPE<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    setTx(dragRef.current.tx + dx);
    setTy(dragRef.current.ty + dy);
  }

  function onPointerUp(e: RPE<HTMLDivElement>) {
    if (dragRef.current) (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  // Click on the canvas (not a pin, not after dragging) → start placing a new snag.
  function onCanvasClick(e: RME<HTMLDivElement>) {
    if (movedRef.current) return;
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    if (!imgSize) return;
    const rect = wrapperRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const ix = (cx - tx) / (imgSize.w * zoom);
    const iy = (cy - ty) / (imgSize.h * zoom);
    if (ix < 0 || ix > 1 || iy < 0 || iy > 1) return;
    setSelectedPinId(null);
    setPlacingAt({ x: ix, y: iy });
    toast({
      kind: "info",
      title: "Pin dropped",
      body: "Add a photo and Claude will draft the snag for you.",
      durationMs: 2200,
    });
  }

  // Wheel zoom around the cursor.
  function onWheel(e: WheelEvent) {
    if (!imgSize || !wrapperRef.current) return;
    e.preventDefault();
    const rect = wrapperRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.002);
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    // Keep the point under the cursor stable.
    const ratio = newZoom / zoom;
    setTx(cx - (cx - tx) * ratio);
    setTy(cy - (cy - ty) * ratio);
    setZoom(newZoom);
  }

  // Pinch zoom on touch
  function onTouchStart(e: RTE<HTMLDivElement>) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { d: Math.hypot(dx, dy), zoom };
    }
  }
  function onTouchMove(e: RTE<HTMLDivElement>) {
    if (e.touches.length === 2 && pinchRef.current && imgSize && wrapperRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      const ratio = d / pinchRef.current.d;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.zoom * ratio));
      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const r = newZoom / zoom;
      setTx(cx - (cx - tx) * r);
      setTy(cy - (cy - ty) * r);
      setZoom(newZoom);
    }
  }
  function onTouchEnd() {
    pinchRef.current = null;
  }

  // Attach non-passive wheel listener so we can preventDefault.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => onWheel(e);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, tx, ty, imgSize]);

  function refreshPins() {
    fetch(`/api/snags?drawingId=${drawingId}&limit=200`)
      .then((r) => r.json())
      .then((j) => setPins(j.snags));
  }

  function toggleStatus(s: string) {
    setFilters((f) => ({
      statuses: f.statuses.includes(s)
        ? f.statuses.filter((x) => x !== s)
        : [...f.statuses, s],
    }));
  }

  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-slate-100 lg:relative lg:inset-auto lg:min-h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 lg:px-5 pt-safe">
        <Link
          href="/drawings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 text-center">
          <div className="truncate text-sm font-semibold text-ink-900">{drawingName}</div>
          {drawingVersion && (
            <div className="truncate text-[11px] text-slate-500">{drawingVersion}</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium",
              showFilters || filters.statuses.length > 0
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {filters.statuses.length > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                {filters.statuses.length}
              </span>
            )}
          </button>
          <button
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:flex"
            aria-label="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:flex"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="border-b border-slate-200 bg-white px-3 py-2.5 lg:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            {(["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION", "CLOSED"] as const).map(
              (s) => {
                const on = filters.statuses.includes(s);
                const sc = statusColor(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={cn(
                      "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition",
                      on
                        ? "border-transparent text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                    style={on ? { backgroundColor: sc.pin } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: on ? "white" : sc.pin }}
                    />
                    {statusLabel(s)}
                  </button>
                );
              },
            )}
            {filters.statuses.length > 0 && (
              <button
                onClick={() => setFilters({ statuses: [] })}
                className="ml-1 text-xs text-slate-500 underline hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Canvas + side panel */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          ref={wrapperRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onCanvasClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative flex-1 cursor-crosshair touch-none select-none overflow-hidden bg-dotted"
        >
          {imgSize && (
            <div
              className="absolute origin-top-left"
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
                width: imgSize.w,
                height: imgSize.h,
                willChange: "transform",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt={drawingName}
                draggable={false}
                className="block h-full w-full"
              />
            </div>
          )}

          {/* Hidden image to measure intrinsic size */}
          {!imgSize && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="absolute opacity-0"
              onLoad={(e) =>
                setImgSize({
                  w: (e.target as HTMLImageElement).naturalWidth,
                  h: (e.target as HTMLImageElement).naturalHeight,
                })
              }
            />
          )}

          {/* Pins */}
          {imgSize &&
            visiblePins.map((p) => {
              const s = toScreen(p);
              const sc = statusColor(p.status);
              const isSelected = selectedPinId === p.id;
              return (
                <button
                  key={p.id}
                  data-pin
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlacingAt(null);
                    setSelectedPinId(p.id);
                  }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-full transform transition-transform",
                    isSelected ? "z-30 scale-110" : "z-20 hover:scale-110",
                  )}
                  style={{ left: s.left, top: s.top }}
                >
                  <PinMarker color={sc.pin} code={p.code} highlight={isSelected} />
                </button>
              );
            })}

          {/* Placing pin preview */}
          {imgSize && placingAt && (
            <div
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
              style={{
                left: tx + placingAt.x * imgSize.w * zoom,
                top: ty + placingAt.y * imgSize.h * zoom,
              }}
            >
              <PinMarker color="#7c3aed" code="NEW" highlight pulse />
            </div>
          )}
        </div>

        {/* Right side panel on desktop */}
        {selectedPinId && (
          <SnagSidePanel
            snagId={selectedPinId}
            onClose={() => setSelectedPinId(null)}
            onStatusChange={refreshPins}
          />
        )}
      </div>

      {/* Zoom controls — bottom-left, never in the corner of the thumb */}
      <div className="pointer-events-none absolute bottom-24 left-3 z-30 flex flex-col items-center gap-1 lg:bottom-5">
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card">
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-slate-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-slate-200" />
          <button
            onClick={fitToScreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50"
            aria-label="Fit to screen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Placement sheet */}
      {placingAt && (
        <NewSnagSheet
          projectId={projectId}
          drawingId={drawingId}
          pinX={placingAt.x}
          pinY={placingAt.y}
          onCancel={() => setPlacingAt(null)}
          onCreated={(snag) => {
            setPlacingAt(null);
            setPins((ps) => [...ps, snag as any]);
            setSelectedPinId(snag.id);
          }}
        />
      )}
    </div>
  );
}

function PinMarker({
  color,
  code,
  highlight,
  pulse,
}: {
  color: string;
  code: string;
  highlight?: boolean;
  pulse?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md ring-2 ring-white transition",
          highlight && "ring-4 ring-white shadow-pop",
          pulse && "pin-pulse",
        )}
        style={{ backgroundColor: color, color: "white" }}
      >
        {code.replace(/^SN-?/, "").slice(0, 3) || "•"}
      </div>
      <div
        className="absolute left-1/2 top-full -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `8px solid ${color}`,
        }}
      />
    </div>
  );
}
