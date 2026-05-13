"use client";

import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Video,
  Camera,
  MapPin,
  X,
  Loader2,
  Sparkles,
  Mic,
  Send,
} from "lucide-react";
import { cn, toDateKey } from "@/lib/utils";
import { useUser } from "@/components/UserContext";
import { MoodSelector } from "@/components/ui/MoodSelector";
import { Pill } from "@/components/ui/Pill";
import { VoiceRecorder } from "./VoiceRecorder";

type Label = { id: string; name: string; color: string };

export function EntryComposer({
  open,
  onClose,
  date,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  onPosted?: () => void;
}) {
  const me = useUser();
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<{ blob: Blob; sec: number } | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<number | null>(null);
  const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [milestone, setMilestone] = useState<{ title: string; description?: string } | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const screenshotInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/labels")
      .then((r) => r.json())
      .then((d) => setLabels(d.labels || []))
      .catch(() => {});
    fetch(`/api/days/${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.labels) setSelectedLabels(new Set(d.labels.map((l: Label) => l.id)));
        const myMood = d?.moods?.find((m: any) => m.author === me);
        if (myMood) setMood(myMood.value);
      })
      .catch(() => {});
  }, [open, date, me]);

  const reset = () => {
    setText("");
    setPhotos([]);
    setVideos([]);
    setScreenshots([]);
    setVoiceBlob(null);
    setTranscription("");
    setLocation(null);
    setMilestone(null);
    setMilestoneTitle("");
    setError(null);
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let name = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            { headers: { "Accept-Language": "en" } }
          );
          if (r.ok) {
            const j = await r.json();
            name =
              j.address?.neighbourhood ||
              j.address?.suburb ||
              j.address?.city ||
              j.address?.town ||
              j.address?.village ||
              j.display_name ||
              name;
          }
        } catch {}
        setLocation({ name, lat: latitude, lng: longitude });
      },
      (err) => setError(err.message)
    );
  };

  const submit = async () => {
    if (
      !text.trim() &&
      !transcription.trim() &&
      photos.length === 0 &&
      videos.length === 0 &&
      screenshots.length === 0 &&
      !voiceBlob
    ) {
      setError("Add something first ✨");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1) Build manifest of files to upload directly to Supabase (bypasses Vercel's 4.5 MB limit)
      type Slot = { kind: "photo" | "video" | "screenshot" | "voice"; blob: Blob; name: string; type: string };
      const slots: Slot[] = [];
      for (const p of photos) slots.push({ kind: "photo", blob: p, name: p.name, type: p.type });
      for (const s of screenshots) slots.push({ kind: "screenshot", blob: s, name: s.name, type: s.type });
      for (const v of videos) slots.push({ kind: "video", blob: v, name: v.name, type: v.type });
      if (voiceBlob) slots.push({ kind: "voice", blob: voiceBlob.blob, name: "voice.webm", type: "audio/webm" });

      const photoUrls: string[] = [];
      const screenshotUrls: string[] = [];
      const videoUrls: string[] = [];
      let voiceNoteUrl: string | null = null;

      if (slots.length > 0) {
        setUploadProgress({ done: 0, total: slots.length });
        const signRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            files: slots.map((s) => ({
              kind: s.kind,
              name: s.name,
              type: s.type,
              size: s.blob.size,
            })),
          }),
        });
        if (!signRes.ok) {
          const d = await signRes.json().catch(() => ({}));
          throw new Error(d.error || "Could not prepare upload");
        }
        const { uploads } = (await signRes.json()) as {
          uploads: Array<{
            kind: string;
            signedUrl: string;
            publicUrl: string;
            contentType: string;
          }>;
        };
        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          const target = uploads[i];
          const put = await fetch(target.signedUrl, {
            method: "PUT",
            body: slot.blob,
            headers: { "Content-Type": slot.type || "application/octet-stream" },
          });
          if (!put.ok) {
            const msg = await put.text().catch(() => "");
            throw new Error(
              `Upload failed (${put.status})${msg ? ": " + msg.slice(0, 120) : ""}`
            );
          }
          if (slot.kind === "photo") photoUrls.push(target.publicUrl);
          else if (slot.kind === "screenshot") screenshotUrls.push(target.publicUrl);
          else if (slot.kind === "video") videoUrls.push(target.publicUrl);
          else if (slot.kind === "voice") voiceNoteUrl = target.publicUrl;
          setUploadProgress({ done: i + 1, total: slots.length });
        }
      }

      // 2) Create the entry row with just the URLs (tiny JSON payload, well under Vercel limits)
      const mediaUrls = [...photoUrls, ...screenshotUrls, ...videoUrls];
      const inferredType =
        voiceNoteUrl && !text.trim() && !transcription.trim()
          ? "VOICE_NOTE"
          : voiceNoteUrl
          ? "MIXED"
          : videoUrls.length > 0
          ? "VIDEO"
          : screenshotUrls.length > 0 && photoUrls.length === 0
          ? "SCREENSHOT"
          : photoUrls.length > 0 && text.trim()
          ? "MIXED"
          : photoUrls.length > 0
          ? "PHOTO"
          : "TEXT";

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          type: inferredType,
          textContent: text.trim() || null,
          transcription: transcription.trim() || null,
          mediaUrls,
          thumbnailUrls: mediaUrls, // no transform pipeline yet
          voiceNoteUrl,
          voiceDurationSec: voiceBlob?.sec ?? null,
          locationName: location?.name ?? null,
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post");
      }

      // Persist day-level fields if present
      if (selectedLabels.size > 0) {
        await fetch(`/api/days/${date}/labels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelIds: Array.from(selectedLabels) }),
        });
      }
      if (mood !== null) {
        await fetch(`/api/moods`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, value: mood }),
        });
      }
      if (milestoneTitle.trim()) {
        await fetch(`/api/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, title: milestoneTitle.trim() }),
        });
      }

      reset();
      onPosted?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-50 w-full sm:max-w-[600px] sm:rounded-2xl max-h-[92dvh] overflow-y-auto rounded-t-2xl">
        <header className="sticky top-0 bg-neutral-50 z-10 flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
          <div>
            <div className="text-[11px] text-neutral-500">New entry</div>
            <div className="heading-serif text-lg">{niceDate(date)}</div>
          </div>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What happened?  How did it feel?"
            className="w-full min-h-[110px] rounded-lg border border-neutral-200 bg-white p-3 text-[15px] outline-none focus:border-neutral-400 resize-none"
          />

          {transcription && (
            <div className="text-[12px] italic text-neutral-600 border-l-2 border-purple-300 pl-2">
              Transcription: {transcription}
              <button
                onClick={() => {
                  setText((t) => (t ? t + "\n\n" + transcription : transcription));
                  setTranscription("");
                }}
                className="ml-2 text-purple-600 underline"
              >
                use as text
              </button>
            </div>
          )}

          {(photos.length > 0 || videos.length > 0 || screenshots.length > 0) && (
            <div className="grid grid-cols-3 gap-1.5">
              {[...photos, ...screenshots, ...videos].map((f, i) => (
                <FilePreview
                  key={i}
                  file={f}
                  onRemove={() => {
                    if (i < photos.length) setPhotos(photos.filter((_, j) => j !== i));
                    else if (i < photos.length + screenshots.length)
                      setScreenshots(screenshots.filter((_, j) => j !== i - photos.length));
                    else
                      setVideos(
                        videos.filter((_, j) => j !== i - photos.length - screenshots.length)
                      );
                  }}
                />
              ))}
            </div>
          )}

          {voiceBlob && (
            <div className="flex items-center justify-between bg-coral-50 rounded-lg px-3 py-2 text-sm text-coral-700">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice note attached ({voiceBlob.sec}s)
              </div>
              <button
                onClick={() => setVoiceBlob(null)}
                className="text-coral-600 hover:text-coral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {location && (
            <div className="flex items-center justify-between bg-teal-50 rounded-lg px-3 py-2 text-sm text-teal-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {location.name}
              </div>
              <button onClick={() => setLocation(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              className="btn-secondary"
            >
              <ImageIcon className="w-4 h-4" />
              Photo
            </button>
            <button
              type="button"
              onClick={() => videoInput.current?.click()}
              className="btn-secondary"
            >
              <Video className="w-4 h-4" />
              Video
            </button>
            <button
              type="button"
              onClick={() => screenshotInput.current?.click()}
              className="btn-secondary"
            >
              <Camera className="w-4 h-4" />
              Screenshot
            </button>
            <button type="button" onClick={captureLocation} className="btn-secondary">
              <MapPin className="w-4 h-4" />
              Location
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <VoiceRecorder
              mode="voice-note"
              onResult={({ blob, durationSec }) =>
                setVoiceBlob({ blob, sec: durationSec })
              }
            />
            <VoiceRecorder
              mode="voice-to-text"
              onResult={({ transcription: t }) => t && setTranscription(t)}
            />
          </div>

          <input
            ref={photoInput}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files) setPhotos([...photos, ...Array.from(e.target.files)]);
              e.target.value = "";
            }}
          />
          <input
            ref={videoInput}
            type="file"
            multiple
            accept="video/*"
            hidden
            onChange={(e) => {
              if (e.target.files) setVideos([...videos, ...Array.from(e.target.files)]);
              e.target.value = "";
            }}
          />
          <input
            ref={screenshotInput}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files) setScreenshots([...screenshots, ...Array.from(e.target.files)]);
              e.target.value = "";
            }}
          />

          {labels.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                Labels for this day
              </div>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <Pill
                    key={l.id}
                    color={l.color}
                    selected={selectedLabels.has(l.id)}
                    onClick={() => {
                      const next = new Set(selectedLabels);
                      if (next.has(l.id)) next.delete(l.id);
                      else next.add(l.id);
                      setSelectedLabels(next);
                    }}
                  >
                    {l.name}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">
              Your mood today
            </div>
            <MoodSelector value={mood} onChange={setMood} />
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setMilestone(milestone ? null : { title: "" })}
              className="flex items-center gap-1.5 text-[12px] text-amber-700"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {milestoneTitle || milestone ? "Mark as milestone" : "Mark as milestone"}
            </button>
            {milestone && (
              <input
                placeholder="Milestone title (e.g. First trip together)"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                className="input-base"
              />
            )}
          </div>

          {error && (
            <div className="text-sm text-coral-600 bg-coral-50 px-3 py-2 rounded-lg">{error}</div>
          )}
        </div>

        <footer className="sticky bottom-0 bg-neutral-50 border-t border-black/[0.06] px-4 py-3 flex items-center justify-between gap-2">
          <button onClick={onClose} className="btn-ghost" disabled={submitting}>
            Cancel
          </button>
          {uploadProgress && uploadProgress.total > 0 && (
            <div className="flex-1 text-[12px] text-neutral-600">
              Uploading {uploadProgress.done} / {uploadProgress.total}…
              <div className="h-1 bg-neutral-200 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-coral-400 transition-all"
                  style={{
                    width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {uploadProgress ? "Uploading…" : "Post"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function niceDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
      {file.type.startsWith("video/") ? (
        <video src={url} className="w-full h-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
