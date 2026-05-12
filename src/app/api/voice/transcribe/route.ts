import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { uploadFile } from "@/lib/storage";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  const keepAudio = form.get("keepAudio") === "true";
  const dateRaw = (form.get("date") as string) || "";

  if (!(file instanceof File) || file.size === 0) return badRequest("no audio");
  if (file.size > 25 * 1024 * 1024) return badRequest("audio too large (max 25MB)");

  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
    ? new Date(dateRaw + "T00:00:00Z")
    : new Date();

  // 1) Transcribe with Whisper
  let text = "";
  try {
    const transcription = await openai().audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });
    text = typeof transcription === "string" ? transcription : (transcription as any).text || "";
  } catch (e: any) {
    return NextResponse.json(
      { error: "Transcription failed", detail: e?.message || String(e) },
      { status: 500 }
    );
  }

  // 2) Optionally persist the audio so we can attach it to the entry
  let audioUrl: string | null = null;
  if (keepAudio) {
    try {
      const { url } = await uploadFile({
        kind: "voice",
        author: user,
        date,
        file,
        originalName: file.name || "voice.webm",
        contentType: file.type,
      });
      audioUrl = url;
    } catch (e) {
      // Don't fail the transcription if upload fails
      audioUrl = null;
    }
  }

  return NextResponse.json({ text: text.trim(), audioUrl });
}
