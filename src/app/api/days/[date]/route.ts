import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromDateKey } from "@/lib/utils";
import { badRequest } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const dateKey = params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return badRequest("invalid date");
  const date = fromDateKey(dateKey);

  const day = await prisma.day.findUnique({
    where: { date },
    include: {
      labels: true,
      milestone: true,
      moods: true,
      entries: {
        orderBy: { createdAt: "asc" },
        include: { comments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!day) {
    return NextResponse.json({
      date,
      coverImage: null,
      labels: [],
      milestone: null,
      moods: [],
      entries: [],
    });
  }

  return NextResponse.json(day);
}
