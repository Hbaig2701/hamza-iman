import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/api";
import { fromDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const countdowns = await prisma.countdown.findMany({
    where: { isActive: true },
    orderBy: { targetDate: "asc" },
  });
  return NextResponse.json({ countdowns });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string)?.trim();
  const targetDate = body.targetDate as string;
  if (!title) return badRequest("title required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return badRequest("invalid targetDate");
  const countdown = await prisma.countdown.create({
    data: {
      title,
      emoji: body.emoji || null,
      targetDate: fromDateKey(targetDate),
      addedBy: user,
    },
  });
  return NextResponse.json({ countdown });
}
