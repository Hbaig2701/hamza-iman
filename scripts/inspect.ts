import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async () => {
  const entries = await prisma.entry.findMany({
    include: { day: { select: { date: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  console.log(`Total recent entries: ${entries.length}`);
  for (const e of entries) {
    const dayKey = e.day.date.toISOString().slice(0, 10);
    const createdLocal = new Date(e.createdAt).toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const preview = (e.textContent || e.transcription || "(media-only)").slice(0, 70).replace(/\n/g, " ");
    console.log(`  day=${dayKey}  by=${e.author}  created=${createdLocal} ET  | ${preview}`);
  }
  await prisma.$disconnect();
})();
