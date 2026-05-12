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
      const fd = new FormData();
      fd.append("date", date);
      if (text.trim()) fd.append("textContent", text.trim());
      if (transcription.trim()) fd.append("transcription", transcription.trim());
      for (const p of photos) fd.append("photos", p, p.name);
      for (const v of videos) fd.append("videos", v, v.name);
      for (const s of screenshots) fd.append("screenshots", s, s.name);
      if (voiceBlob) {
        fd.append("voiceNote", voiceBlob.blob, "voice.webm");
        fd.append("voiceDurationSec", String(voiceBlob.sec));
      }
      if (location) {
        fd.append("locationName", location.name);
        fd.append("locationLat", String(location.lat));
        fd.append("locationLng", String(location.lng));
      }
      const res = await fetch("/api/entries", { method: "POST", body: fd });
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

        <footer className="sticky bottom-0 bg-neutral-50 border-t border-black/[0.06] px-4 py-3 flex items-center justify-between">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post
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
