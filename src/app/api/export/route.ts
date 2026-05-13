import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Allow either an authenticated browser session OR a backup token in the Authorization header.
  const auth = req.headers.get("authorization") || "";
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);
  const backupToken = process.env.BACKUP_TOKEN;
  const tokenOk =
    backupToken && tokenMatch && tokenMatch[1] === backupToken;
  if (!tokenOk) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
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
