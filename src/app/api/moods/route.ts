import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  badRequest,
  getCurrentUser,
  getOrCreateDay,
  unauthorized,
} from "@/lib/api";
import { endOfMonthUTC, startOfMonthUTC } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) {
    const moods = await prisma.mood.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { day: { select: { date: true } } },
    });
    return NextResponse.json({ moods });
  }
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return badRequest("invalid month");
  const moods = await prisma.mood.findMany({
    where: { day: { date: { gte: startOfMonthUTC(y, m), lte: endOfMonthUTC(y, m) } } },
    include: { day: { select: { date: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ moods });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const date = body?.date as string;
  const value = Number(body?.value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");
  if (!(value >= 1 && value <= 5)) return badRequest("value must be 1-5");
  const day = await getOrCreateDay(date);
  const mood = await prisma.mood.upsert({
    where: { dayId_author: { dayId: day.id, author: user } },
    create: { dayId: day.id, author: user, value },
    update: { value },
  });
  return NextResponse.json({ mood });
}
