import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { days: true } } },
  });
  return NextResponse.json({
    labels: labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      isDefault: l.isDefault,
      dayCount: l._count.days,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = (body.name as string)?.trim().toLowerCase();
  const color = (body.color as string) || "#888780";
  if (!name) return badRequest("name required");
  const existing = await prisma.label.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ label: existing });
  const label = await prisma.label.create({ data: { name, color } });
  return NextResponse.json({ label });
}
