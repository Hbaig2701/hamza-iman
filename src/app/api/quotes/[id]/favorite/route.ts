import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.quote.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  const quote = await prisma.quote.update({
    where: { id: params.id },
    data: { isFavorite: !existing.isFavorite },
  });
  return NextResponse.json({ quote });
}
