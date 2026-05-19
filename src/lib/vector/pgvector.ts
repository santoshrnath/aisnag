// pgvector fallback. Used when VECTOR_DB_PROVIDER=pgvector.
// Stores vectors in a side table so we never touch Prisma's migrations.

import { prisma } from "@/lib/prisma";
import type {
  VectorRecord,
  VectorSearchFilter,
  VectorSearchHit,
  VectorService,
} from "./index";

export class PgVectorService implements VectorService {
  private dim = 0;
  private ensured = false;

  async ensureCollection(dimensions: number): Promise<void> {
    if (this.ensured && this.dim === dimensions) return;
    this.dim = dimensions;
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "SnagChunkVector" (
         id TEXT PRIMARY KEY,
         tenant_id TEXT NOT NULL,
         project_id TEXT NOT NULL,
         snag_id TEXT NOT NULL,
         payload JSONB NOT NULL,
         embedding vector(${dimensions})
       )`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS snagchunkvector_tenant_idx ON "SnagChunkVector" (tenant_id)`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS snagchunkvector_project_idx ON "SnagChunkVector" (project_id)`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS snagchunkvector_snag_idx ON "SnagChunkVector" (snag_id)`,
    );
    this.ensured = true;
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      const vec = `[${r.vector.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "SnagChunkVector" (id, tenant_id, project_id, snag_id, payload, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, embedding = EXCLUDED.embedding`,
        r.id,
        r.payload.tenantId,
        r.payload.projectId,
        r.payload.snagId,
        JSON.stringify(r.payload),
        vec,
      );
    }
  }

  async search(opts: {
    vector: number[];
    limit: number;
    filter: VectorSearchFilter;
  }): Promise<VectorSearchHit[]> {
    const vec = `[${opts.vector.join(",")}]`;
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, payload, 1 - (embedding <=> $1::vector) AS score
         FROM "SnagChunkVector"
        WHERE tenant_id = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3`,
      vec,
      opts.filter.tenantId ?? "default",
      opts.limit,
    )) as { id: string; payload: unknown; score: number }[];
    return rows.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as VectorSearchHit["payload"],
    }));
  }

  async deleteBySnag(tenantId: string, snagId: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "SnagChunkVector" WHERE tenant_id = $1 AND snag_id = $2`,
      tenantId,
      snagId,
    );
  }
}
