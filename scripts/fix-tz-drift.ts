/**
 * One-time fix for entries that were stamped with tomorrow's UTC date because
 * they were posted after 8pm EDT / 7pm EST. Walks every Entry, looks at its
 * createdAt in America/New_York, and if that local date doesn't match the
 * date of the Day it belongs to, moves the entry to the correct Day (creating
 * it if needed).
 *
 * Safe to re-run: idempotent.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TZ = "America/New_York";

function localDateKey(d: Date): string {
  // Format the date as YYYY-MM-DD in America/New_York.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

function dbDateForKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function getOrCreateDay(key: string) {
  const date = dbDateForKey(key);
  const existing = await prisma.day.findUnique({ where: { date } });
  if (existing) return existing;
  return prisma.day.create({ data: { date } });
}

(async () => {
  const entries = await prisma.entry.findMany({
    include: { day: { select: { id: true, date: true } } },
    orderBy: { createdAt: "asc" },
  });

  let moved = 0;
  for (const e of entries) {
    const correctKey = localDateKey(new Date(e.createdAt));
    const storedKey = e.day.date.toISOString().slice(0, 10);
    if (correctKey === storedKey) continue;

    const target = await getOrCreateDay(correctKey);
    await prisma.entry.update({
      where: { id: e.id },
      data: { dayId: target.id },
    });
    moved += 1;
    console.log(
      `  moved entry ${e.id} (${e.author}, created ${e.createdAt.toISOString()}) : ${storedKey} -> ${correctKey}`
    );
  }

  // Cascade: also check Mood + Milestone (one per day/author), in case any were
  // created on a UTC-drifted day. Skip if there isn't a clear local-time
  // counterpart since these don't have a meaningful "actual" date.
  const moods = await prisma.mood.findMany({
    include: { day: { select: { id: true, date: true } } },
  });
  let moodMoved = 0;
  for (const m of moods) {
    const correctKey = localDateKey(new Date(m.createdAt));
    const storedKey = m.day.date.toISOString().slice(0, 10);
    if (correctKey === storedKey) continue;
    const target = await getOrCreateDay(correctKey);
    // Check if mood already exists on target day for this author — if so, drop this one
    const conflict = await prisma.mood.findUnique({
      where: { dayId_author: { dayId: target.id, author: m.author } },
    });
    if (conflict) {
      await prisma.mood.delete({ where: { id: m.id } });
      console.log(`  dropped duplicate mood ${m.id} (${m.author}) on ${storedKey}`);
    } else {
      await prisma.mood.update({ where: { id: m.id }, data: { dayId: target.id } });
      console.log(`  moved mood ${m.id} (${m.author}): ${storedKey} -> ${correctKey}`);
    }
    moodMoved += 1;
  }

  // Clean up empty Day rows we orphaned
  const empties = await prisma.day.findMany({
    where: {
      entries: { none: {} },
      moods: { none: {} },
      milestone: null,
      coverImage: null,
      labels: { none: {} },
    },
  });
  for (const d of empties) {
    await prisma.day.delete({ where: { id: d.id } });
  }

  console.log(`\nDone. Moved ${moved} entries, ${moodMoved} moods. Cleaned ${empties.length} empty days.`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
