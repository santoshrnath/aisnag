import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "@/lib/env";
import type {
  VectorRecord,
  VectorSearchFilter,
  VectorSearchHit,
  VectorService,
} from "./index";

export class QdrantVectorService implements VectorService {
  private client: QdrantClient;
  private collection = env.vector.collection();
  private ensured = false;

  constructor() {
    this.client = new QdrantClient({
      url: env.vector.qdrantUrl(),
      apiKey: env.vector.qdrantApiKey(),
    });
  }

  async ensureCollection(dimensions: number): Promise<void> {
    if (this.ensured) return;
    try {
      await this.client.getCollection(this.collection);
    } catch {
      await this.client.createCollection(this.collection, {
        vectors: { size: dimensions, distance: "Cosine" },
      });
    }
    const indexes = [
      { field: "tenantId", schema: "keyword" as const },
      { field: "projectId", schema: "keyword" as const },
      { field: "drawingId", schema: "keyword" as const },
      { field: "snagId", schema: "keyword" as const },
      { field: "status", schema: "keyword" as const },
      { field: "severity", schema: "keyword" as const },
      { field: "trade", schema: "keyword" as const },
    ];
    for (const ix of indexes) {
      try {
        await this.client.createPayloadIndex(this.collection, {
          field_name: ix.field,
          field_schema: ix.schema,
        });
      } catch {
        // index probably already exists
      }
    }
    this.ensured = true;
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.client.upsert(this.collection, {
      points: records.map((r) => ({
        id: r.id,
        vector: r.vector,
        payload: r.payload as unknown as Record<string, unknown>,
      })),
    });
  }

  async search(opts: {
    vector: number[];
    limit: number;
    filter: VectorSearchFilter;
  }): Promise<VectorSearchHit[]> {
    const must: Record<string, unknown>[] = [];
    if (opts.filter.tenantId) {
      must.push({ key: "tenantId", match: { value: opts.filter.tenantId } });
    }
    if (opts.filter.projectIds?.length) {
      must.push({ key: "projectId", match: { any: opts.filter.projectIds } });
    }
    if (opts.filter.drawingIds?.length) {
      must.push({ key: "drawingId", match: { any: opts.filter.drawingIds } });
    }
    if (opts.filter.snagIds?.length) {
      must.push({ key: "snagId", match: { any: opts.filter.snagIds } });
    }
    if (opts.filter.statuses?.length) {
      must.push({ key: "status", match: { any: opts.filter.statuses } });
    }
    if (opts.filter.severities?.length) {
      must.push({ key: "severity", match: { any: opts.filter.severities } });
    }
    if (opts.filter.trades?.length) {
      must.push({ key: "trade", match: { any: opts.filter.trades } });
    }
    const res = await this.client.search(this.collection, {
      vector: opts.vector,
      limit: opts.limit,
      with_payload: true,
      filter: { must },
    });
    return res.map((r) => ({
      id: String(r.id),
      score: r.score ?? 0,
      payload: r.payload as unknown as VectorSearchHit["payload"],
    }));
  }

  async deleteBySnag(tenantId: string, snagId: string): Promise<void> {
    await this.client.delete(this.collection, {
      filter: {
        must: [
          { key: "tenantId", match: { value: tenantId } },
          { key: "snagId", match: { value: snagId } },
        ],
      },
    });
  }
}
