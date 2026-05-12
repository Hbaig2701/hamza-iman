import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, getOrCreateDay, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const milestones = await prisma.milestone.findMany({
    include: { day: { select: { date: true } } },
    orderBy: { day: { date: "desc" } },
  });
  return NextResponse.json({ milestones });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const date = body.date as string;
  const title = (body.title as string)?.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");
  if (!title) return badRequest("title required");
  const day = await getOrCreateDay(date);
  const milestone = await prisma.milestone.upsert({
    where: { dayId: day.id },
    create: { dayId: day.id, title, description: body.description || null, author: user },
    update: { title, description: body.description || null },
  });
  return NextResponse.json({ milestone });
}
