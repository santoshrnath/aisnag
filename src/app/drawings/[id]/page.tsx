import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { AppShell } from "@/components/shell/AppShell";
import { DrawingCanvas } from "@/components/drawing/DrawingCanvas";

export const dynamic = "force-dynamic";

export default async function DrawingPage({
  params,
}: {
  params: { id: string };
}) {
  const drawing = await prisma.drawing.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      snags: {
        orderBy: { createdAt: "asc" },
        include: {
          trade: { select: { name: true } },
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!drawing) notFound();

  const imageUrl = await getStorage().signedUrl(drawing.storageKey, "drawings", 3600);

  return (
    <AppShell
      projectId={drawing.project.id}
      projectName={drawing.project.name}
      projectClient={drawing.project.client}
      bareMobile
    >
      <DrawingCanvas
        drawingId={drawing.id}
        projectId={drawing.project.id}
        drawingName={drawing.name}
        drawingVersion={drawing.version}
        imageUrl={imageUrl}
        initialPins={drawing.snags as any}
      />
    </AppShell>
  );
}
