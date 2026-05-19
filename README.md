# SnagPin

**The snagging app that doesn't feel like construction software.**

> Tap the drawing. Drop a pin. Snap a photo. Done in 30 seconds — on a phone, in sunlight, with gloves on. Claude Sonnet 4.6 reads the photo and drafts the snag for you. Search the project in plain English. All on your own infrastructure.

A mobile-first web app for marking defects on construction drawings — designed for site engineers, QA/QC inspectors, finishing trades, and clients on handover walks. The bar is consumer-grade UX over an enterprise-class data spine.

Part of the **OnePlace / OneDataLens** ecosystem of AI products. Sister projects: [CV Intelligence Agent](https://github.com/santoshrnath/cvai), [OpenKPI Studio](https://openstudio.oneplaceplatform.com).

---

## Why this exists

Snagging is the most-used construction workflow that is consistently the worst-designed.

- **Paper still wins on many sites.** Printed A3 plans, coloured-dot defects, photos shared in WhatsApp. This is 2026.
- **Existing digital tools feel like enterprise software from a decade ago.** PlanGrid, Procore, Fieldwire, Dalux work — but they're dense, training-required, and never break the 30-second-per-snag barrier.
- **The drawing interaction is bad.** Pinching to zoom a 50MB PDF on a phone, dropping a precise pin, tagging the right room — all of it takes far longer than it should.
- **Handover walks are chaos.** Clients point, reps scribble, half the items get lost.
- **WhatsApp + Excel is what 60% of GCC sites actually use** — because it's the only thing that feels easy enough.

The opening isn't features. **The opening is how it feels in the first 30 seconds.** Snagging is the perfect wedge — high-volume, daily-use, every stakeholder touches it, and the bar set by incumbents is low.

---

## What's built (POC)

A working end-to-end product. Everything you see is real — no Figma, no mock data, no smoke-and-mirrors.

| Screen | What it does |
|---|---|
| **Dashboard** (`/`) | Stat cards, status donut, by-trade bars, recent activity, my tasks, drawings preview — matches the reference design, responsive from 380px up. |
| **Drawings** (`/drawings`) | Floor plans with snag counts at a glance. |
| **Drawing canvas** (`/drawings/[id]`) | The heart of the product. Pinch / wheel zoom, pan, tap-to-drop pin, status-coloured pins, status filters, side panel on desktop, full-sheet on mobile. |
| **Snags list / detail** (`/snags`, `/snags/[id]`) | Full history, comments, photos, voice transcripts, status switcher, drawing thumbnail with the pin highlighted. |
| **New Snag** (`/snags/new`) | Pick a drawing, tap to drop, then the bottom-sheet form: photo → AI inspect → confirm. |
| **My Tasks** (`/tasks`) | Due / today / overdue tabs, priority chips. |
| **Reports** (`/reports`) | Status donut, by-trade bars, 7-day sparkline. |
| **Team** (`/team`) | Project members. |
| **Search (global)** | Type "paint defects near windows" — Claude reads chunks, ranks snags, explains why each matches. |

And a real processing pipeline:

```
Drop a snag → photo upload → Hetzner Storage Box (originals)
                            → Claude Vision (photo-to-snag draft)
                            → Snag row + status event in Postgres
                            → CV-style snag chunker (title+desc, comments, transcripts, AI summary)
                            → Embedding provider (local Xenova / Voyage / OpenAI — swappable)
                            → Qdrant (vectors with rich payload: project, drawing, trade, severity, status)
                            → Indexed for semantic search
```

Every snag's vectors are re-indexed on edit, new comment, or new transcript. Search hits the vector store, groups chunks back to parent snags, and Claude annotates each hit with a one-line "why it matches" — never inventing facts not in the evidence.

---

## Where AI earns its place

The product works fully without AI. AI sits on top as an enhancement layer, not the spine. This matters because snagging is liability-bearing data — many GCC contractors are (rightly) cautious about AI-driven decisions.

That said, AI earns its place in three spots:

1. **Photo-to-snag** (`POST /api/ai/photo-to-snag`) — Claude vision drafts title, description, trade, severity from a single photo. If no defect is visible, it says so rather than invent one. Cuts entry time from ~40s to ~10s. This is the wow moment in the first 30 seconds of using the app.
2. **Voice-to-snag** (`POST /api/ai/voice-to-snag`) — transcription runs in the browser (Web Speech API, free, offline-capable in Chrome). The transcript is sent to Claude to structure into title, description, trade, severity, room.
3. **Semantic search** (`POST /api/search`) — embed the query, retrieve top chunks from Qdrant, group back to snags, ask Claude for a one-line annotation per result. Retrieval is the truth; Claude only annotates.

A duplicate-detection prompt and pattern-surfacing analytics are deliberately deferred — the data is there, the prompts can ship in v2.

---

## Architecture

```
┌────────────────────┐        ┌──────────────────────────────────────────────┐
│   Site engineer    │        │     SnagPin (Next.js 14, App Router)         │
│   walks the floor  │───────▶│                                              │
│   on a phone       │        │   ┌─────────────────────────────────────┐   │
└────────────────────┘        │   │  Drawing canvas — pinch/zoom, pin   │   │
                              │   │  drop, status filters, RAF transform │   │
                              │   └─────────────────────────────────────┘   │
                              │   ┌─────────────────────────────────────┐   │
┌────────────────────┐  ◀────▶│   │  AI layer (Claude Sonnet 4.6)       │   │
│ Anthropic Claude   │        │   │  - Photo-to-snag (vision)           │   │
└────────────────────┘        │   │  - Voice-to-snag (structure)        │   │
                              │   │  - Semantic search (annotate)       │   │
                              │   └─────────────────────────────────────┘   │
                              │   ┌─────────────────────────────────────┐   │
                              │   │  Snag-aware chunker + RAG pipeline  │   │
                              │   │  - title+desc, comments, transcripts │   │
                              │   │  - rich payload per chunk           │   │
                              │   └─────────────────────────────────────┘   │
                              │   ┌─────────────────────────────────────┐   │
                              │   │  Storage abstraction                │   │
                              │   │  - S3 (Hetzner Storage Box)         │   │
                              │   │  - Local fallback (dev)             │   │
                              │   └─────────────────────────────────────┘   │
                              │   ┌─────────────────────────────────────┐   │
                              │   │  Vector abstraction                 │   │
                              │   │  - Qdrant (primary)                 │   │
                              │   │  - pgvector (fallback)              │   │
                              │   └─────────────────────────────────────┘   │
                              └──────────────────────────────────────────────┘
                                      │             │              │
                                      ▼             ▼              ▼
                              ┌──────────────┐ ┌────────┐ ┌────────────────┐
                              │  Postgres 17 │ │ Qdrant │ │ Hetzner Storage│
                              │  (pgvector)  │ │  vDB   │ │ Box (S3 compat)│
                              └──────────────┘ └────────┘ └────────────────┘
                              all hosted on your own Hetzner Cloud network
```

---

## Tech stack

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind, Lucide icons. Mobile-first throughout: every screen is designed at 380px first, desktop expands from there.

**Backend** — Next.js Route Handlers, Prisma ORM, Postgres 17 with pgvector. Anthropic SDK.

**AI** — Claude Sonnet 4.6 for *all* reasoning. Strict-JSON outputs with explicit anti-hallucination instructions in every prompt.

**Embeddings** — provider abstraction with three backends:
- **Local** — `@xenova/transformers` `Xenova/all-MiniLM-L6-v2` (no API key, downloads on first run). Default — so the repo clones-and-runs.
- **Voyage AI** — `voyage-3-lite`. Anthropic's officially recommended embedding partner.
- **OpenAI** — `text-embedding-3-small`. Optional fallback.

> Anthropic's Claude doesn't expose an embedding endpoint — it's a text-generation model. Voyage AI is the recommended partner; this project keeps Claude as the reasoning layer (where it's exceptional) and isolates embeddings behind a provider interface.

**Storage** — S3-compatible (Hetzner Storage Box) for drawings, photos, voice notes. Local-filesystem fallback for dev.

**Deployment** — Docker Compose. Same `git pull + scp .env + docker compose up` pattern as the rest of the OnePlace ecosystem.

---

## Run it locally

```bash
git clone https://github.com/santoshrnath/aisnag.git
cd aisnag

# 1. Configure
cp .env.example .env.local
# Open .env.local and set ANTHROPIC_API_KEY at minimum.

# 2. Spin up Postgres + Qdrant + the app
docker compose up -d --build

# 3. Apply the Prisma schema
docker compose exec snagpin-app npx prisma db push

# 4. Seed the Skyline Residences demo project (3 floor plans, ~30 snags)
docker compose exec snagpin-app node node_modules/.bin/tsx prisma/seed.ts

# 5. Open the dashboard
open http://localhost:3080
```

That's it. Tap a drawing, drop a pin, snap a photo. Watch Claude inspect it.

### Pure-Node dev (no Docker)

```bash
npm install --ignore-scripts
npm run prisma:generate
# Start Postgres + Qdrant separately (or use STORAGE_PROVIDER=local + VECTOR_DB_PROVIDER=pgvector for a one-DB setup).
npm run dev
# Optional: npm run seed
```

---

## Deploy to Hetzner

```bash
SNAGPIN_SSH_HOST=root@<your-hetzner-ip> ./deploy/hetzner/deploy.sh
```

The script `git clone`s (or pulls) the project on the server, `scp`s your local `.env.local` to the server as `.env`, runs `docker compose up -d --build`, and pushes the Prisma schema. Set `SEED=1` to also run the seed.

```bash
SNAGPIN_SSH_HOST=root@<your-hetzner-ip> SEED=1 ./deploy/hetzner/deploy.sh
```

The container labels assume a shared Coolify-managed Traefik network and target `aisnag.oneplaceplatform.com` by default — adjust `PUBLIC_HOSTNAME` if you use a different host or reverse proxy.

---

## Security and privacy

Snags end up in disputes — over retention, over DLP claims, over performance assessments. The audit trail is real:

- **Immutable status history.** Every status change is timestamped, user-attributed, and stored as a `SnagStatusEvent`. Closure photos are first-class.
- **Tenant-scoped everywhere.** Every row, vector and storage key carries a `tenantId` — single-tenant today, multi-tenant tomorrow with no schema migration.
- **Signed storage URLs** (or proxied through `/api/storage/*` in local mode) — no public snag/photo links.
- **AI never invents.** Every prompt is strict JSON with explicit anti-hallucination instructions ("if the photo doesn't show a defect, say so").
- **Data ownership.** Your project's data is yours. Postgres + Qdrant + Hetzner Storage are all on your infrastructure. No platform lock-in.
- **Data residency.** Use Hetzner Nuremberg (`nbg1`) or Helsinki (`hel1`) for EU residency; UAE/KSA on request.
- **Offline-first capture** (roadmap) — pins, photos, voice notes captured offline queue and sync silently. The architecture is ready; the service worker ships next.

---

## What's intentionally NOT built (yet)

This is a focused MVP for the most demoable surface. Deferred for v2:

- **Handover-walk mode** — guided "walk the flat with the client" flow.
- **Inspection templates** — checklist-driven inspections that auto-create snags on fail.
- **DLP / FM mode** — residents log issues against their unit drawing after handover.
- **PDF report export** — the stats are all there; the renderer is the next add.
- **Multi-tenant auth** — the data model is tenant-scoped; auth wires in over the existing `tenantId` column without migration.
- **WhatsApp push** — daily summary auto-posted to a project group.
- **Pattern surfacing AI** — "this subcontractor's snags are 60% MEP-related and concentrated on floors 3–5."

Every one of these is a small lift on top of what's here, not a rewrite.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx                      Dashboard
│   ├── drawings/page.tsx             Drawings list
│   ├── drawings/[id]/page.tsx        Drawing canvas (the heart)
│   ├── snags/page.tsx                Snags list
│   ├── snags/[id]/page.tsx           Snag detail (full page)
│   ├── snags/new/page.tsx            New snag (pick drawing)
│   ├── tasks/page.tsx                My tasks
│   ├── reports/page.tsx              Reports
│   ├── team/page.tsx                 Team
│   └── api/
│       ├── projects                  GET / POST
│       ├── projects/[id]             GET
│       ├── projects/[id]/stats       GET
│       ├── drawings                  GET / POST (multipart upload)
│       ├── drawings/[id]             GET (with signed image URL)
│       ├── snags                     GET / POST
│       ├── snags/[id]                GET / PATCH / DELETE
│       ├── snags/[id]/photos         POST (multipart)
│       ├── snags/[id]/comments       POST
│       ├── trades                    GET (per project)
│       ├── users                     GET
│       ├── ai/photo-to-snag          POST — Claude Vision draft
│       ├── ai/voice-to-snag          POST — Claude text structure
│       ├── search                    POST — semantic snag search
│       └── storage/[bucket]          GET — local-storage proxy
├── components/
│   ├── shell/AppShell.tsx            Top nav + sidebar + mobile drawer + bottom tabs
│   ├── dashboard/                    StatCard, StatusDonut, TradeBars, ActivityFeed, MyTasksStrip, DashboardSearch
│   ├── drawing/                      DrawingCanvas, SnagSidePanel, NewSnagSheet
│   └── ...
├── lib/
│   ├── ai/                           photo-to-snag, voice-to-snag, semantic-search
│   ├── rag/                          chunker, index-snag
│   ├── embeddings/                   provider abstraction (local / voyage / openai)
│   ├── storage/                      provider abstraction (S3 / local)
│   ├── vector/                       provider abstraction (Qdrant / pgvector)
│   ├── anthropic.ts                  Claude client + JSON helpers
│   ├── prisma.ts                     Singleton
│   ├── env.ts                        Centralised env access
│   ├── tenant.ts                     Tenant resolution
│   └── utils.ts                      cn, time/date, status/severity colours
└── prisma/
    ├── schema.prisma                 Project, Drawing, Snag, Photo, Comment, StatusEvent, Chunk, ...
    ├── seed.ts                       Skyline Residences demo
    └── sample-drawings/              level-5.svg, level-6.svg, level-8.svg
```

---

## License

MIT.

---

Built by Santosh Raghunath as part of the [OnePlace / OneDataLens](https://oneplaceplatform.com) ecosystem.
