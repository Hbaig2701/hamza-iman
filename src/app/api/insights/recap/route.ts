import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, endOfMonthUTC, toDateKey } from "@/lib/utils";
import { openai } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let start: Date;
  let end: Date;
  let label: string;

  if (month) {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return NextResponse.json({ error: "invalid month" }, { status: 400 });
    start = startOfMonthUTC(y, m);
    end = endOfMonthUTC(y, m);
    label = start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } else if (year) {
    const y = Number(year);
    if (!y) return NextResponse.json({ error: "invalid year" }, { status: 400 });
    start = new Date(Date.UTC(y, 0, 1));
    end = new Date(Date.UTC(y, 11, 31));
    label = String(y);
  } else {
    const now = new Date();
    start = startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth() + 1);
    end = endOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth() + 1);
    label = start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const days = await prisma.day.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      entries: true,
      labels: true,
      milestone: true,
      moods: true,
    },
    orderBy: { date: "asc" },
  });

  const totalEntries = days.reduce((acc, d) => acc + d.entries.length, 0);
  const daysJournaled = days.filter((d) => d.entries.length > 0).length;
  const totalPhotos = days.reduce(
    (acc, d) => acc + d.entries.reduce((s, e) => s + (e.mediaUrls?.length || 0), 0),
    0
  );
  const milestones = days.filter((d) => d.milestone).length;

  const byAuthor = { hamza: 0, iman: 0 };
  for (const d of days) for (const e of d.entries) (byAuthor as any)[e.author] += 1;

  const labelCounts: Record<string, { name: string; color: string; count: number }> = {};
  for (const d of days)
    for (const l of d.labels) {
      const key = l.id;
      labelCounts[key] ||= { name: l.name, color: l.color, count: 0 };
      labelCounts[key].count += 1;
    }
  const topLabels = Object.values(labelCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const moodAvg = { hamza: 0, iman: 0 };
  const moodCounts = { hamza: 0, iman: 0 };
  for (const d of days)
    for (const m of d.moods) {
      (moodAvg as any)[m.author] += m.value;
      (moodCounts as any)[m.author] += 1;
    }
  if (moodCounts.hamza) moodAvg.hamza = Number((moodAvg.hamza / moodCounts.hamza).toFixed(2));
  if (moodCounts.iman) moodAvg.iman = Number((moodAvg.iman / moodCounts.iman).toFixed(2));

  // Best day = highest mood-sum, fallback to most entries
  let bestDay: { date: Date; score: number } | null = null;
  for (const d of days) {
    const moodSum = d.moods.reduce((s, m) => s + m.value, 0);
    const score = moodSum * 100 + d.entries.length;
    if (!bestDay || score > bestDay.score) bestDay = { date: d.date, score };
  }

  let aiSummary: string | null = null;
  if (process.env.OPENAI_RECAP_ENABLED === "true" && process.env.OPENAI_API_KEY) {
    try {
      const samples = days
        .filter((d) => d.entries.length > 0)
        .slice(0, 30)
        .map((d) => {
          const text = d.entries
            .map((e) => e.textContent || e.transcription || "")
            .filter(Boolean)
            .join(" ");
          return `${toDateKey(d.date)}: ${text.slice(0, 200)}`;
        })
        .join("\n");
      const completion = await openai().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You write a warm 2-3 sentence recap for a couple's private journal. Focus on themes and feelings, not specifics. Address them as 'you both'.",
          },
          { role: "user", content: `Period: ${label}\n\nEntries:\n${samples}` },
        ],
        max_tokens: 160,
      });
      aiSummary = completion.choices[0]?.message?.content?.trim() || null;
    } catch {
      aiSummary = null;
    }
  }

  return NextResponse.json({
    label,
    range: { start, end },
    daysJournaled,
    totalEntries,
    totalPhotos,
    milestones,
    byAuthor,
    topLabels,
    moodAvg,
    bestDay,
    aiSummary,
  });
}
