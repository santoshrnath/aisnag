"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Camera,
  Mic,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface PhotoDraft {
  file: File;
  url: string;
}

interface Props {
  projectId: string;
  drawingId: string;
  pinX: number;
  pinY: number;
  onCancel: () => void;
  onCreated: (snag: any) => void;
}

const TRADES = [
  "MEP",
  "Civil",
  "Finishing",
  "Joinery",
  "Painting",
  "Flooring",
  "Plumbing",
  "Electrical",
  "Other",
];

const SEVERITIES = [
  { value: "COSMETIC", label: "Cosmetic" },
  { value: "FUNCTIONAL", label: "Functional" },
  { value: "SAFETY", label: "Safety" },
];

export function NewSnagSheet({
  projectId,
  drawingId,
  pinX,
  pinY,
  onCancel,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trade, setTrade] = useState<string>("Finishing");
  const [severity, setSeverity] = useState<string>("FUNCTIONAL");
  const [room, setRoom] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDraftApplied, setAiDraftApplied] = useState(false);
  const [trades, setTrades] = useState<{ id: string; name: string }[]>([]);

  // Voice
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recogRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load trades — we'll show names matching the project trades, but submit
  // a tradeId so the server can resolve and indexes can filter.
  useEffect(() => {
    fetch(`/api/trades?projectId=${projectId}`)
      .then((r) => r.json())
      .then((j) => setTrades(j.trades ?? []))
      .catch(() => {});
  }, [projectId]);

  // ----- Photos -----
  function addPhotos(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files);
    const next: PhotoDraft[] = arr.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...next]);
    setAiDraftApplied(false); // new photos = fresh AI inspection available
  }

  function removePhoto(idx: number) {
    setPhotos((ps) => {
      URL.revokeObjectURL(ps[idx].url);
      return ps.filter((_, i) => i !== idx);
    });
  }

  // ----- AI photo-to-snag -----
  async function runPhotoAI() {
    if (photos.length === 0) {
      setAiError("Add a photo first.");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      const form = new FormData();
      form.append("file", photos[0].file);
      if (room) form.append("hint", room);
      const res = await fetch("/api/ai/photo-to-snag", { method: "POST", body: form });
      if (res.status === 401) {
        setAiError("Sign in to use AI photo-to-snag — it uses Anthropic credits.");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const { draft } = await res.json();
      if (!draft.detected) {
        setAiError(
          draft.reasoning ??
            "Claude couldn't see a clear defect in this photo. You can still fill in the details manually.",
        );
        return;
      }
      if (draft.title) setTitle(draft.title);
      if (draft.description) setDescription(draft.description);
      if (draft.trade && TRADES.includes(draft.trade)) setTrade(draft.trade);
      if (draft.severity) setSeverity(draft.severity);
      setAiDraftApplied(true);
      toast({
        kind: "ai",
        title: "Claude drafted the snag",
        body: `${Math.round((draft.confidence ?? 0.8) * 100)}% confident — review & edit before saving.`,
      });
    } catch (e: any) {
      setAiError(e?.message ?? "AI failed");
    } finally {
      setAiBusy(false);
    }
  }

  // ----- Voice (Web Speech API) -----
  function startRecording() {
    const W: any = typeof window !== "undefined" ? window : {};
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice capture isn't supported in this browser. Try Chrome or Safari on iOS.");
      return;
    }
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    let final = "";
    recog.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setTranscript((final + interim).trim());
    };
    recog.onend = () => setRecording(false);
    recog.start();
    recogRef.current = recog;
    setRecording(true);
  }

  function stopRecording() {
    recogRef.current?.stop();
    setRecording(false);
  }

  async function applyVoiceAI() {
    if (!transcript.trim()) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/voice-to-snag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (res.status === 401) {
        setAiError("Sign in to use AI voice-to-snag — it uses Anthropic credits.");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const { draft } = await res.json();
      setTitle(draft.title || title);
      setDescription(draft.description || description);
      if (draft.trade && TRADES.includes(draft.trade)) setTrade(draft.trade);
      if (draft.severity) setSeverity(draft.severity);
      if (draft.room) setRoom(draft.room);
      setAiDraftApplied(true);
    } catch (e: any) {
      setAiError(e?.message ?? "AI failed");
    } finally {
      setAiBusy(false);
    }
  }

  // ----- Submit -----
  async function submit() {
    if (!title.trim()) {
      alert("Add a title.");
      return;
    }
    setSubmitting(true);
    try {
      // Resolve trade name → trade id (project-scoped). If missing, server stores null.
      const tradeId = trades.find((t) => t.name === trade)?.id ?? null;

      const res = await fetch(`/api/snags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          drawingId,
          pinX,
          pinY,
          title: title.trim(),
          description: description.trim() || null,
          severity,
          tradeId,
          room: room.trim() || null,
          aiGenerated: aiDraftApplied,
          aiSummary: aiDraftApplied && description ? description : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { snag } = await res.json();

      // Upload photos
      for (const p of photos) {
        const f = new FormData();
        f.append("file", p.file);
        f.append("kind", "evidence");
        await fetch(`/api/snags/${snag.id}/photos`, { method: "POST", body: f });
      }

      toast({
        kind: "success",
        title: `Snag ${snag.code} raised`,
        body: photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? "s" : ""} attached.` : undefined,
      });
      onCreated(snag);
    } catch (e: any) {
      toast({ kind: "error", title: "Couldn't save snag", body: e?.message ?? "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-pop animate-slide-up",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none",
        )}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 pt-safe">
          <button onClick={onCancel} className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Cancel
          </button>
          <div className="text-base font-semibold text-ink-900">New Snag</div>
          <button
            onClick={submit}
            disabled={submitting || !title.trim()}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-6">
          {/* Location pill */}
          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            📍 Pin placed at {(pinX * 100).toFixed(1)}%, {(pinY * 100).toFixed(1)}% of the drawing
          </div>

          {/* Photos */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Photos</label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/60 text-white"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[11px] font-medium">Add Photo</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                hidden
                onChange={(e) => addPhotos(e.target.files)}
              />
            </div>

            {photos.length > 0 && (
              <button
                onClick={runPhotoAI}
                disabled={aiBusy}
                className={cn(
                  "mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
                  aiDraftApplied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
                )}
              >
                {aiBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : aiDraftApplied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiBusy
                  ? "Claude is inspecting the photo…"
                  : aiDraftApplied
                  ? "AI draft applied — review & edit below"
                  : "Inspect with AI"}
              </button>
            )}
            {aiError && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tile chipped near skirting"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short, factual note. Mention where, what's affected, and the fix needed."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Voice note */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" /> Voice note (optional)
              </span>
              <button
                onClick={recording ? stopRecording : startRecording}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  recording
                    ? "bg-rose-600 text-white"
                    : "bg-brand-600 text-white",
                )}
              >
                {recording ? "Stop" : "Record"}
              </button>
            </div>
            {transcript && (
              <div className="space-y-2">
                <p className="text-xs italic text-slate-700">"{transcript}"</p>
                <button
                  onClick={applyVoiceAI}
                  disabled={aiBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Apply transcript with Claude
                </button>
              </div>
            )}
            {!transcript && !recording && (
              <p className="text-[11px] text-slate-500">
                Tap Record and dictate. Claude will tidy it into a snag draft.
              </p>
            )}
          </div>

          {/* Room */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Room / Area</label>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Living room, Master bath"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Trade */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Trade</label>
            <div className="flex flex-wrap gap-1.5">
              {TRADES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTrade(t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    trade === t
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="mb-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Severity</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-sm font-medium",
                    severity === s.value
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
