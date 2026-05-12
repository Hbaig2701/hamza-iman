"use client";

import { Star, MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn, authorDisplay, authorColor, formatTime } from "@/lib/utils";
import { MediaGrid } from "./MediaGrid";
import { VoicePlayer } from "./VoicePlayer";
import { useUser } from "@/components/UserContext";

export type EntryDTO = {
  id: string;
  author: string;
  type: string;
  textContent: string | null;
  mediaUrls: string[];
  thumbnailUrls: string[];
  voiceNoteUrl: string | null;
  voiceDurationSec: number | null;
  transcription: string | null;
  locationName: string | null;
  isFavorite: boolean;
  createdAt: string | Date;
};

export function EntryCard({
  entry,
  onChange,
}: {
  entry: EntryDTO;
  onChange?: (next: EntryDTO | null) => void;
}) {
  const me = useUser();
  const [busy, setBusy] = useState(false);
  const color = authorColor(entry.author);
  const isMine = entry.author === me;

  const toggleFavorite = async () => {
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}/favorite`, { method: "PUT" });
    if (res.ok) {
      const d = await res.json();
      onChange?.({ ...entry, isFavorite: d.entry.isFavorite });
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!confirm("Delete this entry?")) return;
    setBusy(true);
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) onChange?.(null);
    setBusy(false);
  };

  return (
    <article className="rounded-card bg-neutral-100/60 p-3 space-y-2 animate-fadeIn">
      <header className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", color.dot)} />
          <span className={cn("font-semibold", color.text)}>
            {authorDisplay(entry.author)}
          </span>
          <span className="text-neutral-500">{formatTime(entry.createdAt)}</span>
          {entry.locationName && (
            <span className="flex items-center gap-0.5 text-neutral-500">
              <MapPin className="w-3 h-3" />
              {entry.locationName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFavorite}
            disabled={busy}
            className={cn(
              "p-1 rounded hover:bg-white transition",
              entry.isFavorite ? "text-amber-500" : "text-neutral-400 hover:text-amber-500"
            )}
            aria-label="Favorite"
          >
            <Star className={cn("w-4 h-4", entry.isFavorite && "fill-current")} />
          </button>
          {isMine && (
            <button
              onClick={remove}
              disabled={busy}
              className="p-1 rounded hover:bg-white text-neutral-400 hover:text-coral-500 transition"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {entry.textContent && (
        <p className="text-[14px] leading-relaxed text-neutral-800 whitespace-pre-wrap">
          {entry.textContent}
        </p>
      )}

      {entry.mediaUrls && entry.mediaUrls.length > 0 && (
        <MediaGrid urls={entry.mediaUrls} />
      )}

      {entry.voiceNoteUrl && (
        <VoicePlayer
          url={entry.voiceNoteUrl}
          durationHint={entry.voiceDurationSec || undefined}
        />
      )}

      {entry.voiceNoteUrl && entry.transcription && (
        <p className="text-[12px] italic text-neutral-600 border-l-2 border-coral-200 pl-2">
          {entry.transcription}
        </p>
      )}
    </article>
  );
}
