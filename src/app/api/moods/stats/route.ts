import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const moods = await prisma.mood.findMany({
    include: { day: { select: { date: true } } },
    orderBy: { day: { date: "asc" } },
  });

  const byAuthor: Record<string, number[]> = { hamza: [], iman: [] };
  for (const m of moods) {
    byAuthor[m.author]?.push(m.value);
  }

  const avg = (xs: number[]) =>
    xs.length === 0 ? 0 : Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2));

  // Best day: highest combined mood
  const dayBuckets: Record<string, { date: Date; sum: number; count: number }> = {};
  for (const m of moods) {
    const key = m.day.date.toISOString().slice(0, 10);
    if (!dayBuckets[key])
      dayBuckets[key] = { date: m.day.date, sum: 0, count: 0 };
    dayBuckets[key].sum += m.value;
    dayBuckets[key].count += 1;
  }
  let bestDay: { date: Date; score: number } | null = null;
  for (const k of Object.keys(dayBuckets)) {
    const b = dayBuckets[k];
    const score = b.sum;
    if (!bestDay || score > bestDay.score) bestDay = { date: b.date, score };
  }

  return NextResponse.json({
    averages: { hamza: avg(byAuthor.hamza), iman: avg(byAuthor.iman) },
    counts: { hamza: byAuthor.hamza.length, iman: byAuthor.iman.length },
    bestDay,
  });
}
