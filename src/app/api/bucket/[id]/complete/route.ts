import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.bucketItem.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();
  const nowCompleted = !existing.isCompleted;
  const item = await prisma.bucketItem.update({
    where: { id: params.id },
    data: {
      isCompleted: nowCompleted,
      completedAt: nowCompleted ? new Date() : null,
    },
  });
  return NextResponse.json({ item });
}
