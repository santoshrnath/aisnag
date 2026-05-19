// Vector-DB abstraction for SnagPin's semantic snag search.
// Backends:
//   - "qdrant"   : Qdrant (production / Hetzner)
//   - "pgvector" : Postgres pgvector fallback (single-DB dev)
//
// Each vector is a chunk of snag content (title+description, comment,
// transcript) carrying rich payload so the search can answer queries like
// "paint defects in Tower B floor 5 — only the open ones".

import { env } from "@/lib/env";

export interface VectorRecord {
  id: string;
  vector: number[];
  payload: VectorPayload;
}

export interface VectorPayload {
  tenantId: string;
  projectId: string;
  drawingId?: string | null;
  snagId: string;
  chunkId: string;

  // Denormalised filters
  status?: string | null;       // SnagStatus
  severity?: string | null;     // SnagSeverity
  trade?: string | null;        // trade name
  room?: string | null;
  area?: string | null;
  code?: string | null;         // SN-128

  textPreview?: string;
  source?: string;              // chunk source label
}

export interface VectorSearchHit {
  id: string;
  score: number;
  payload: VectorPayload;
}

export interface VectorSearchFilter {
  tenantId?: string;
  projectIds?: string[];
  drawingIds?: string[];
  snagIds?: string[];
  statuses?: string[];
  severities?: string[];
  trades?: string[];
}

export interface VectorService {
  ensureCollection(dimensions: number): Promise<void>;
  upsert(records: VectorRecord[]): Promise<void>;
  search(opts: {
    vector: number[];
    limit: number;
    filter: VectorSearchFilter;
  }): Promise<VectorSearchHit[]>;
  deleteBySnag(tenantId: string, snagId: string): Promise<void>;
}

let _svc: VectorService | null = null;

export async function getVectorService(): Promise<VectorService> {
  if (_svc) return _svc;
  const provider = env.vector.provider();
  if (provider === "qdrant") {
    const { QdrantVectorService } = await import("./qdrant");
    _svc = new QdrantVectorService();
  } else {
    const { PgVectorService } = await import("./pgvector");
    _svc = new PgVectorService();
  }
  return _svc;
}
