import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/api";
import { fromDateKey } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const saidBy = searchParams.get("saidBy");
  const favorites = searchParams.get("favorites");
  const search = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 30;

  const where: any = {};
  if (saidBy === "hamza" || saidBy === "iman") where.saidBy = saidBy;
  if (favorites === "true") where.isFavorite = true;
  if (search) where.text = { contains: search, mode: "insensitive" };

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.quote.count({ where }),
  ]);
  return NextResponse.json({ quotes, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const text = (body.text as string)?.trim();
  const saidBy = body.saidBy as string;
  const date = (body.date as string) || new Date().toISOString().slice(0, 10);
  if (!text) return badRequest("text required");
  if (saidBy !== "hamza" && saidBy !== "iman") return badRequest("invalid saidBy");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest("invalid date");
  const quote = await prisma.quote.create({
    data: { text, saidBy, addedBy: user, date: fromDateKey(date) },
  });
  return NextResponse.json({ quote });
}
