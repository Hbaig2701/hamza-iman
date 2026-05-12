import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [days, labels, quotes, bucket, countdowns, milestones, prompts] = await Promise.all([
    prisma.day.findMany({
      include: { entries: true, moods: true, milestone: true, labels: true },
      orderBy: { date: "asc" },
    }),
    prisma.label.findMany(),
    prisma.quote.findMany({ orderBy: { date: "asc" } }),
    prisma.bucketItem.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.countdown.findMany({ orderBy: { targetDate: "asc" } }),
    prisma.milestone.findMany(),
    prisma.prompt.findMany({ include: { responses: true } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    days,
    labels,
    quotes,
    bucket,
    countdowns,
    milestones,
    prompts,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ours-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
