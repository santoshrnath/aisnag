// Re-index every snag in the default tenant into the vector store.
// Used after a fresh deploy to populate the RAG corpus, and any time the
// embedding model or chunker changes.

import { prisma } from "../src/lib/prisma";
import { indexSnag } from "../src/lib/rag/index-snag";

async function main() {
  const ids = await prisma.snag.findMany({ select: { id: true } });
  console.log(`→ Indexing ${ids.length} snags`);
  let ok = 0;
  let fail = 0;
  for (const { id } of ids) {
    try {
      await indexSnag(id);
      ok += 1;
      if (ok % 5 === 0) console.log(`  • ${ok}/${ids.length}`);
    } catch (e: any) {
      fail += 1;
      console.warn(`  ! ${id}: ${e?.message ?? e}`);
    }
  }
  console.log(`Done: ${ok} ok, ${fail} fail`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
