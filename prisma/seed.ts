// SnagPin — seed script
// ============================================================================
// Creates the Skyline Residences demo project: 6 users, 9 trades, 3 floor
// plans (committed as SVG so this runs offline), and 32 snags with photos,
// comments, voice transcripts and status history. Re-runnable: wipes the
// existing tenant first.
//
// Run with: npm run seed
// ============================================================================

import { PrismaClient, SnagStatus, SnagSeverity, SnagPriority, UserRole } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

const TENANT = "default";

interface SnagSeed {
  drawingKey: "level-5" | "level-6" | "level-8";
  pinX: number; // 0..1
  pinY: number;
  room: string;
  title: string;
  description: string;
  trade: string;
  severity: SnagSeverity;
  priority: SnagPriority;
  status: SnagStatus;
  assignee: string;
  raisedBy: string;
  dueOffsetDays?: number;
  voice?: string;
  aiGenerated?: boolean;
  comments?: { author: string; text: string; daysAgo: number }[];
}

// Map snag-title keywords → sample defect photos (in prisma/sample-photos).
// Snags with no keyword hit get the generic "paint-uneven" photo as a
// fallback so every defect has at least one image to show.
const PHOTO_RULES: { match: RegExp; files: string[] }[] = [
  { match: /paint|painted|grout/i, files: ["paint-uneven.svg"] },
  { match: /tile|crack|chip/i, files: ["tile-chipped.svg"] },
  { match: /socket|outlet|switch|wire|electric|exit sign|light/i, files: ["socket.svg"] },
  { match: /door|handle|hinge|window catch|wardrobe/i, files: ["door-handle.svg"] },
  { match: /damp|ceiling|stain|leak from above/i, files: ["damp-patch.svg"] },
  { match: /skirting|gap|trim/i, files: ["skirting-gap.svg"] },
  { match: /tap|leak|drain|plumbing|sink|drip|water/i, files: ["tap-leak.svg"] },
];

function photosForTitle(title: string): string[] {
  for (const r of PHOTO_RULES) {
    if (r.match.test(title)) return r.files;
  }
  return ["paint-uneven.svg"];
}

const USERS = [
  { name: "Arjun Sharma", email: "arjun@snagpin.demo", role: UserRole.ENGINEER },
  { name: "Riya Kapoor", email: "riya@snagpin.demo", role: UserRole.ENGINEER },
  { name: "Imran Khan", email: "imran@snagpin.demo", role: UserRole.INSPECTOR },
  { name: "Suresh Kumar", email: "suresh@snagpin.demo", role: UserRole.SUBCONTRACTOR },
  { name: "Neha Patel", email: "neha@snagpin.demo", role: UserRole.MANAGER },
  { name: "Fatima Al-Mansoori", email: "fatima@snagpin.demo", role: UserRole.CLIENT },
];

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

const SNAGS: SnagSeed[] = [
  // ---- Level 5 ------------------------------------------------------------
  {
    drawingKey: "level-5",
    pinX: 0.25,
    pinY: 0.36,
    room: "Apt 501 — Bedroom",
    title: "Wall paint uneven near window",
    description:
      "Uneven paint finish on the wall near the window. Putty required and second coat to be applied. Visible from natural light.",
    trade: "Painting",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Riya Kapoor",
    dueOffsetDays: 5,
    aiGenerated: true,
    voice: "Wall paint uneven near the window in 501 bedroom, needs putty and second coat",
  },
  {
    drawingKey: "level-5",
    pinX: 0.42,
    pinY: 0.55,
    room: "Apt 502 — Bath 1",
    title: "Tile chipped near skirting",
    description: "Floor tile chipped at the corner near the door. Likely impact damage during fit-out.",
    trade: "Flooring",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.IN_PROGRESS,
    assignee: "Suresh Kumar",
    raisedBy: "Arjun Sharma",
    dueOffsetDays: 3,
    comments: [
      { author: "Suresh Kumar", text: "Replacement tile arriving tomorrow, will fix on site.", daysAgo: 1 },
    ],
  },
  {
    drawingKey: "level-5",
    pinX: 0.62,
    pinY: 0.35,
    room: "Apt 503 — Master Bed",
    title: "Socket alignment issue",
    description: "Electrical socket is misaligned with the wall — protrudes by ~5mm. Cover plate doesn't sit flush.",
    trade: "Electrical",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 1,
  },
  {
    drawingKey: "level-5",
    pinX: 0.18,
    pinY: 0.74,
    room: "Apt 504 — Studio",
    title: "Door handle loose",
    description: "Main entry door handle is loose. Screws need to be re-tightened, hinge may need adjustment.",
    trade: "Joinery",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.READY_FOR_INSPECTION,
    assignee: "Suresh Kumar",
    raisedBy: "Neha Patel",
    dueOffsetDays: -1,
    comments: [
      { author: "Suresh Kumar", text: "Tightened all four screws and adjusted top hinge. Ready for inspection.", daysAgo: 1 },
    ],
  },
  {
    drawingKey: "level-5",
    pinX: 0.45,
    pinY: 0.74,
    room: "Apt 505 — Living",
    title: "Skirting board gap",
    description: "Visible gap between skirting board and wall, runs ~80cm along the south wall. Needs re-fixing and caulking.",
    trade: "Joinery",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Arjun Sharma",
    dueOffsetDays: 7,
  },
  {
    drawingKey: "level-5",
    pinX: 0.72,
    pinY: 0.75,
    room: "Apt 506 — Bath",
    title: "Slow drain in shower",
    description: "Shower drain is slow — water pools for ~30s before clearing. Suspect partial blockage or incorrect fall.",
    trade: "Plumbing",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: 2,
  },
  {
    drawingKey: "level-5",
    pinX: 0.55,
    pinY: 0.50,
    room: "Corridor",
    title: "Ceiling light flickering",
    description: "Recessed downlight in the corridor near apt 502 is flickering. Driver or bulb needs replacement.",
    trade: "MEP",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.CLOSED,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: -3,
    comments: [
      { author: "Suresh Kumar", text: "Replaced driver. Tested for 10 mins, no flicker.", daysAgo: 3 },
      { author: "Imran Khan", text: "Verified. Closed.", daysAgo: 2 },
    ],
  },
  {
    drawingKey: "level-5",
    pinX: 0.30,
    pinY: 0.30,
    room: "Apt 501 — Living",
    title: "Window glass smudged",
    description: "Internal face of living-room window has installation smudges. Needs cleaning before handover.",
    trade: "Finishing",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.READY_FOR_INSPECTION,
    assignee: "Suresh Kumar",
    raisedBy: "Riya Kapoor",
    dueOffsetDays: 4,
  },
  {
    drawingKey: "level-5",
    pinX: 0.68,
    pinY: 0.30,
    room: "Apt 503 — Living",
    title: "AC vent rattle",
    description: "Air-con supply vent rattles when fan runs at high speed. Likely loose mounting bracket.",
    trade: "MEP",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.IN_PROGRESS,
    assignee: "Suresh Kumar",
    raisedBy: "Arjun Sharma",
    dueOffsetDays: 3,
  },
  {
    drawingKey: "level-5",
    pinX: 0.50,
    pinY: 0.30,
    room: "Apt 502 — Living",
    title: "Floor finish scratch",
    description: "Long scratch on the engineered wood floor, ~40cm, near the kitchen island. Looks like furniture drag.",
    trade: "Flooring",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: 5,
  },

  // ---- Level 6 ------------------------------------------------------------
  {
    drawingKey: "level-6",
    pinX: 0.20,
    pinY: 0.30,
    room: "Apt 601 — Living",
    title: "Paint touch-up at corner",
    description: "Paint missing at the wall-ceiling corner. Roller didn't fully reach. Touch up required.",
    trade: "Painting",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.CLOSED,
    assignee: "Suresh Kumar",
    raisedBy: "Riya Kapoor",
    dueOffsetDays: -2,
  },
  {
    drawingKey: "level-6",
    pinX: 0.48,
    pinY: 0.30,
    room: "Apt 602 — Master",
    title: "Wardrobe door alignment",
    description: "Wardrobe sliding door catches on the bottom track. Needs realignment and lubrication.",
    trade: "Joinery",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 2,
  },
  {
    drawingKey: "level-6",
    pinX: 0.50,
    pinY: 0.60,
    room: "Apt 602 — Bath 1",
    title: "Tap leak under sink",
    description: "Visible drip from the cold supply joint under the basin. Needs sealing or new washer.",
    trade: "Plumbing",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.IN_PROGRESS,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: 0,
    voice: "Tap leak under the sink in apartment 602 master bath, needs sealing immediately",
  },
  {
    drawingKey: "level-6",
    pinX: 0.78,
    pinY: 0.32,
    room: "Apt 603 — Master",
    title: "Power outlet upside down",
    description: "Bedside power outlet installed inverted (earth pin at top instead of bottom). Cosmetic only but client noticed.",
    trade: "Electrical",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Neha Patel",
    dueOffsetDays: 6,
  },
  {
    drawingKey: "level-6",
    pinX: 0.20,
    pinY: 0.74,
    room: "Apt 604 — Bedroom",
    title: "Window catch missing",
    description: "Inner catch handle on the master bedroom window has not been installed. Hardware kit needed.",
    trade: "Joinery",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.READY_FOR_INSPECTION,
    assignee: "Suresh Kumar",
    raisedBy: "Arjun Sharma",
    dueOffsetDays: -1,
  },
  {
    drawingKey: "level-6",
    pinX: 0.48,
    pinY: 0.78,
    room: "Apt 605 — Studio",
    title: "Cracked wall tile",
    description: "Hairline crack across one wall tile next to the bath. Likely impact during install.",
    trade: "Finishing",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 4,
  },
  {
    drawingKey: "level-6",
    pinX: 0.75,
    pinY: 0.72,
    room: "Apt 606 — Living",
    title: "Light switch not working",
    description: "Living room overhead light switch dead. No response. Bulb confirmed working in test fitting.",
    trade: "Electrical",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: 1,
  },
  {
    drawingKey: "level-6",
    pinX: 0.50,
    pinY: 0.50,
    room: "Corridor",
    title: "Floor finish transition gap",
    description: "Gap between corridor carpet and apartment door threshold. Trip hazard for elderly residents.",
    trade: "Flooring",
    severity: SnagSeverity.SAFETY,
    priority: SnagPriority.HIGH,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 1,
  },
  {
    drawingKey: "level-6",
    pinX: 0.35,
    pinY: 0.20,
    room: "Apt 601 — Bedroom",
    title: "Curtain rail loose",
    description: "Right end of curtain rail bracket is pulling out of the wall. Needs heavier fixing.",
    trade: "Joinery",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.IN_PROGRESS,
    assignee: "Suresh Kumar",
    raisedBy: "Neha Patel",
    dueOffsetDays: 3,
  },
  {
    drawingKey: "level-6",
    pinX: 0.65,
    pinY: 0.20,
    room: "Apt 603 — Living",
    title: "Skirting paint splash",
    description: "Paint splash from ceiling work has landed on white skirting. Needs solvent clean and touch-up.",
    trade: "Painting",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.CLOSED,
    assignee: "Suresh Kumar",
    raisedBy: "Riya Kapoor",
    dueOffsetDays: -4,
  },

  // ---- Level 8 ------------------------------------------------------------
  {
    drawingKey: "level-8",
    pinX: 0.20,
    pinY: 0.35,
    room: "Apt 801 — Living",
    title: "Floor finish scratch near entry",
    description: "Long scratch on the engineered wood floor near the entrance. Likely from delivery trolley wheels.",
    trade: "Flooring",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: 5,
  },
  {
    drawingKey: "level-8",
    pinX: 0.20,
    pinY: 0.60,
    room: "Apt 801 — Walk-in",
    title: "Tile broken near window",
    description: "Floor tile cracked diagonally near the window edge. Possibly fell during cladding install.",
    trade: "Finishing",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Arjun Sharma",
    dueOffsetDays: 0,
    aiGenerated: true,
  },
  {
    drawingKey: "level-8",
    pinX: 0.50,
    pinY: 0.30,
    room: "Apt 802 — Open Plan",
    title: "Hot water tap reversed",
    description: "Hot/cold supplies appear swapped at the island sink. Hot tap delivers cold water.",
    trade: "Plumbing",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.HIGH,
    status: SnagStatus.READY_FOR_INSPECTION,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: -1,
  },
  {
    drawingKey: "level-8",
    pinX: 0.80,
    pinY: 0.30,
    room: "Apt 803 — Bedroom",
    title: "Wardrobe handle missing",
    description: "Wardrobe door handle hasn't been installed on the right-hand door. Hardware kit needed.",
    trade: "Joinery",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Neha Patel",
    dueOffsetDays: 3,
  },
  {
    drawingKey: "level-8",
    pinX: 0.18,
    pinY: 0.78,
    room: "Apt 804 — Bedroom",
    title: "Damp patch on ceiling",
    description: "Yellow staining on bedroom ceiling, ~30cm diameter. Suspect leak from level 9 plumbing — escalate.",
    trade: "MEP",
    severity: SnagSeverity.SAFETY,
    priority: SnagPriority.HIGH,
    status: SnagStatus.IN_PROGRESS,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 0,
    comments: [
      { author: "Imran Khan", text: "Escalated to MEP lead. Need plumber to inspect floor above today.", daysAgo: 1 },
    ],
  },
  {
    drawingKey: "level-8",
    pinX: 0.50,
    pinY: 0.78,
    room: "Apt 805 — Bath",
    title: "Mirror not level",
    description: "Bathroom mirror is mounted at ~2° off horizontal. Needs re-fixing.",
    trade: "Joinery",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: 7,
  },
  {
    drawingKey: "level-8",
    pinX: 0.80,
    pinY: 0.78,
    room: "Apt 806 — Bath",
    title: "Grout discoloration",
    description: "Grout in the shower has a yellow tinge in patches. Likely incorrect curing or contamination.",
    trade: "Finishing",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Neha Patel",
    dueOffsetDays: 8,
  },
  {
    drawingKey: "level-8",
    pinX: 0.30,
    pinY: 0.20,
    room: "Apt 801 — Master",
    title: "Master bath fan noisy",
    description: "Extract fan in master bath is unusually loud. Bearing or mounting issue.",
    trade: "MEP",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.OPEN,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 4,
  },
  {
    drawingKey: "level-8",
    pinX: 0.50,
    pinY: 0.50,
    room: "Corridor",
    title: "Exit sign not illuminated",
    description: "Emergency exit sign at the south stair core is not illuminated. Compliance failure.",
    trade: "Electrical",
    severity: SnagSeverity.SAFETY,
    priority: SnagPriority.HIGH,
    status: SnagStatus.IN_PROGRESS,
    assignee: "Suresh Kumar",
    raisedBy: "Imran Khan",
    dueOffsetDays: 0,
  },
  {
    drawingKey: "level-8",
    pinX: 0.62,
    pinY: 0.30,
    room: "Apt 802 — Bath",
    title: "Towel rail screws missing",
    description: "Towel rail bracket has two screws missing. Currently held by one fixing only.",
    trade: "Joinery",
    severity: SnagSeverity.FUNCTIONAL,
    priority: SnagPriority.MEDIUM,
    status: SnagStatus.CLOSED,
    assignee: "Suresh Kumar",
    raisedBy: "Riya Kapoor",
    dueOffsetDays: -5,
  },
  {
    drawingKey: "level-8",
    pinX: 0.85,
    pinY: 0.55,
    room: "Apt 803 — Bath",
    title: "Shower glass smudged",
    description: "Internal face of shower screen has visible smudges. Needs deep clean before handover.",
    trade: "Finishing",
    severity: SnagSeverity.COSMETIC,
    priority: SnagPriority.LOW,
    status: SnagStatus.READY_FOR_INSPECTION,
    assignee: "Suresh Kumar",
    raisedBy: "Fatima Al-Mansoori",
    dueOffsetDays: -1,
  },
];

async function main() {
  console.log("→ Wiping existing default-tenant data");
  await prisma.snagChunk.deleteMany({ where: { tenantId: TENANT } });
  await prisma.snagStatusEvent.deleteMany({ where: { tenantId: TENANT } });
  await prisma.snagComment.deleteMany({ where: { tenantId: TENANT } });
  await prisma.snagVoiceNote.deleteMany({ where: { tenantId: TENANT } });
  await prisma.snagPhoto.deleteMany({ where: { tenantId: TENANT } });
  await prisma.snag.deleteMany({ where: { tenantId: TENANT } });
  await prisma.drawing.deleteMany({ where: { tenantId: TENANT } });
  await prisma.trade.deleteMany({ where: { tenantId: TENANT } });
  await prisma.projectMember.deleteMany({ where: { tenantId: TENANT } });
  await prisma.project.deleteMany({ where: { tenantId: TENANT } });
  await prisma.user.deleteMany({ where: { tenantId: TENANT } });

  // Try to delete any vectors. Best-effort — vector store may not exist yet.
  try {
    const { getVectorService } = await import("../src/lib/vector");
    const v = await getVectorService();
    // ensureCollection requires dimensions; skip cleanup if not initialized.
    void v;
  } catch {}

  console.log("→ Creating users");
  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.create({
        data: {
          tenantId: TENANT,
          name: u.name,
          email: u.email,
          role: u.role,
        },
      }),
    ),
  );
  const userByName = new Map(users.map((u) => [u.name, u]));

  console.log("→ Creating project");
  const project = await prisma.project.create({
    data: {
      tenantId: TENANT,
      name: "Skyline Residences",
      client: "Skyline Holdings",
      developer: "Aurora Developments",
      contractor: "Crestline Constructions",
      location: "Dubai Marina",
      status: "active",
      coverColor: "#7c3aed",
      members: {
        create: users.map((u) => ({ tenantId: TENANT, userId: u.id, role: u.role })),
      },
    },
  });

  console.log("→ Creating trades");
  const trades = await Promise.all(
    TRADES.map((name) =>
      prisma.trade.create({
        data: { tenantId: TENANT, projectId: project.id, name },
      }),
    ),
  );
  const tradeByName = new Map(trades.map((t) => [t.name, t]));

  console.log("→ Uploading sample drawings");
  // Lazy-import the storage layer so seed works even when the env-derived
  // provider config changes between envs.
  const { getStorage, drawingKey } = await import("../src/lib/storage");
  const storage = getStorage();

  const drawingFiles: Record<string, string> = {
    "level-5": "Tower A — Level 5",
    "level-6": "Tower A — Level 6",
    "level-8": "Tower A — Level 8",
  };

  const drawings: Record<string, { id: string }> = {};
  for (const [slug, name] of Object.entries(drawingFiles)) {
    const filePath = path.resolve(process.cwd(), "prisma", "sample-drawings", `${slug}.svg`);
    const buf = await fs.readFile(filePath);
    const fileName = `${slug}.svg`;
    // Create the drawing row first so we have an id for the key.
    const created = await prisma.drawing.create({
      data: {
        tenantId: TENANT,
        projectId: project.id,
        name,
        level: name.split("—")[1]?.trim() ?? slug,
        type: "FLOOR_PLAN",
        version: "V2",
        storageKey: "", // patched below
        mimeType: "image/svg+xml",
        width: 1200,
        height: 800,
        sizeBytes: buf.length,
      },
    });
    const key = drawingKey({
      tenantId: TENANT,
      projectId: project.id,
      drawingId: created.id,
      fileName,
    });
    await storage.put({
      bucket: "drawings",
      key,
      body: buf,
      contentType: "image/svg+xml",
    });
    await prisma.drawing.update({ where: { id: created.id }, data: { storageKey: key } });
    drawings[slug] = { id: created.id };
    console.log(`  • ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log("→ Pre-loading sample defect photos");
  const { photoKey } = await import("../src/lib/storage");
  const photosDir = path.resolve(process.cwd(), "prisma", "sample-photos");
  const photoCache: Record<string, Buffer> = {};
  for (const fname of [
    "paint-uneven.svg",
    "tile-chipped.svg",
    "socket.svg",
    "door-handle.svg",
    "damp-patch.svg",
    "skirting-gap.svg",
    "tap-leak.svg",
    "closure-fixed.svg",
  ]) {
    try {
      photoCache[fname] = await fs.readFile(path.join(photosDir, fname));
    } catch {
      console.warn(`  ! missing sample photo ${fname}`);
    }
  }

  console.log("→ Creating snags");
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let n = 0;
  const createdSnagIds: string[] = [];
  for (const s of SNAGS) {
    n += 1;
    const code = `SN-${String(n).padStart(3, "0")}`;
    const drawingId = drawings[s.drawingKey].id;
    const snag = await prisma.snag.create({
      data: {
        tenantId: TENANT,
        projectId: project.id,
        drawingId,
        code,
        pinX: s.pinX,
        pinY: s.pinY,
        room: s.room,
        title: s.title,
        description: s.description,
        severity: s.severity,
        priority: s.priority,
        status: s.status,
        tradeId: tradeByName.get(s.trade)?.id ?? null,
        raisedById: userByName.get(s.raisedBy)?.id ?? null,
        assignedToId: userByName.get(s.assignee)?.id ?? null,
        dueDate: s.dueOffsetDays != null ? new Date(now + s.dueOffsetDays * day) : null,
        aiGenerated: !!s.aiGenerated,
        aiSummary: s.aiGenerated ? s.description : null,
        closedAt: s.status === "CLOSED" ? new Date(now - 2 * day) : null,
        closedById: s.status === "CLOSED" ? userByName.get(s.raisedBy)?.id ?? null : null,
      },
    });
    createdSnagIds.push(snag.id);

    // Status event
    await prisma.snagStatusEvent.create({
      data: {
        tenantId: TENANT,
        snagId: snag.id,
        actorId: userByName.get(s.raisedBy)?.id ?? null,
        toStatus: "OPEN",
        note: "Snag raised",
        createdAt: new Date(now - 3 * day),
      },
    });
    if (s.status !== "OPEN") {
      await prisma.snagStatusEvent.create({
        data: {
          tenantId: TENANT,
          snagId: snag.id,
          actorId: userByName.get(s.assignee)?.id ?? null,
          fromStatus: "OPEN",
          toStatus: s.status,
          createdAt: new Date(now - 1 * day),
        },
      });
    }

    // Comments
    for (const c of s.comments ?? []) {
      await prisma.snagComment.create({
        data: {
          tenantId: TENANT,
          snagId: snag.id,
          authorId: userByName.get(c.author)?.id ?? null,
          text: c.text,
          createdAt: new Date(now - c.daysAgo * day),
        },
      });
    }

    // Voice transcripts — store transcript only, no audio file (the seed
    // doesn't have real audio). We store a non-empty storage key so the UI
    // doesn't render a broken audio player; the SnagDetail component shows
    // the transcript as a quote when there's no playable URL.
    if (s.voice) {
      await prisma.snagVoiceNote.create({
        data: {
          tenantId: TENANT,
          snagId: snag.id,
          storageKey: "__seed_transcript_only__",
          mimeType: "audio/webm",
          transcript: s.voice,
        },
      });
    }

    // Sample photos
    const photoFiles = photosForTitle(s.title);
    for (let pi = 0; pi < photoFiles.length; pi += 1) {
      const fname = photoFiles[pi];
      const buf = photoCache[fname];
      if (!buf) continue;
      const key = photoKey({
        tenantId: TENANT,
        projectId: project.id,
        snagId: snag.id,
        fileName: `evidence-${pi + 1}-${fname}`,
      });
      await storage.put({
        bucket: "photos",
        key,
        body: buf,
        contentType: "image/svg+xml",
      });
      await prisma.snagPhoto.create({
        data: {
          tenantId: TENANT,
          snagId: snag.id,
          storageKey: key,
          mimeType: "image/svg+xml",
          sizeBytes: buf.length,
          kind: "evidence",
        },
      });
    }
    // Closure photo for snags that are closed or ready
    if (s.status === "CLOSED" || s.status === "READY_FOR_INSPECTION") {
      const buf = photoCache["closure-fixed.svg"];
      if (buf) {
        const key = photoKey({
          tenantId: TENANT,
          projectId: project.id,
          snagId: snag.id,
          fileName: `closure-closure-fixed.svg`,
        });
        await storage.put({
          bucket: "photos",
          key,
          body: buf,
          contentType: "image/svg+xml",
        });
        await prisma.snagPhoto.create({
          data: {
            tenantId: TENANT,
            snagId: snag.id,
            storageKey: key,
            mimeType: "image/svg+xml",
            sizeBytes: buf.length,
            kind: "closure",
          },
        });
      }
    }
  }

  console.log(`✓ Created ${n} snags`);

  // Index for RAG (best-effort — skip if embedding model not ready in seed env).
  console.log("→ Indexing snags for semantic search (may download ~30MB on first run)");
  try {
    const { indexSnag } = await import("../src/lib/rag/index-snag");
    let idx = 0;
    for (const id of createdSnagIds) {
      try {
        await indexSnag(id);
        idx += 1;
        if (idx % 5 === 0) console.log(`  • indexed ${idx}/${createdSnagIds.length}`);
      } catch (e: any) {
        console.warn(`  ! indexSnag ${id} failed: ${e?.message ?? e}`);
      }
    }
    console.log(`✓ Indexed ${idx} snags`);
  } catch (e: any) {
    console.warn(`✗ Index step skipped — ${e?.message ?? e}`);
    console.warn("  Search will fall back to DB-only matching until you run the indexer.");
  }

  console.log("\nDone.\n  Open http://localhost:3080");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
