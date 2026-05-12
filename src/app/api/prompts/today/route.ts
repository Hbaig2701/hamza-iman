import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fromDateKey, toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = toDateKey(new Date());
  const todayDate = fromDateKey(today);

  // Already-used prompt for today?
  let prompt = await prisma.prompt.findFirst({
    where: { isUsed: true, usedOn: todayDate },
  });

  if (!prompt) {
    // Pick a random unused prompt
    const unused = await prisma.prompt.findMany({ where: { isUsed: false } });
    if (unused.length === 0) {
      // Reset: mark all as unused (cycle)
      await prisma.prompt.updateMany({ data: { isUsed: false, usedOn: null } });
      const fresh = await prisma.prompt.findMany({});
      if (fresh.length === 0) return NextResponse.json({ prompt: null });
      prompt = fresh[Math.floor(Math.random() * fresh.length)];
    } else {
      prompt = unused[Math.floor(Math.random() * unused.length)];
    }
    prompt = await prisma.prompt.update({
      where: { id: prompt.id },
      data: { isUsed: true, usedOn: todayDate },
    });
  }

  const responses = await prisma.promptResponse.findMany({
    where: { promptId: prompt.id, date: todayDate },
  });
  const byHamza = responses.find((r) => r.author === "hamza") || null;
  const byIman = responses.find((r) => r.author === "iman") || null;
  const revealed = !!byHamza && !!byIman;

  return NextResponse.json({
    prompt,
    responses: revealed
      ? { hamza: byHamza, iman: byIman }
      : {
          hamza: byHamza ? { author: "hamza", submitted: true } : null,
          iman: byIman ? { author: "iman", submitted: true } : null,
        },
    revealed,
  });
}
