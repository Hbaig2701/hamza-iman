"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Diamond, Heart } from "lucide-react";
import { EntryCard, type EntryDTO } from "@/components/ui/EntryCard";
import { EntryComposer } from "@/components/composer/EntryComposer";
import { Pill } from "@/components/ui/Pill";
import { moodEmoji } from "@/components/ui/MoodSelector";
import { authorDisplay, cn, readableDate } from "@/lib/utils";

type Label = { id: string; name: string; color: string };
type Mood = { author: string; value: number };
type Milestone = { id: string; title: string; description: string | null; author: string };

type DayDTO = {
  date?: string;
  coverImage?: string | null;
  labels?: Label[];
  moods?: Mood[];
  milestone?: Milestone | null;
  entries?: EntryDTO[];
};

export function DayView({ date, allowCompose = true }: { date: string; allowCompose?: boolean }) {
  const [data, setData] = useState<DayDTO | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/days/${date}`);
    if (res.ok) setData(await res.json());
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onChangeEntry = (id: string, next: EntryDTO | null) => {
    if (!data?.entries) return;
    if (next === null) {
      setData({ ...data, entries: data.entries.filter((e) => e.id !== id) });
    } else {
      setData({
        ...data,
        entries: data.entries.map((e) => (e.id === id ? next : e)),
      });
    }
  };

  const entries = data?.entries || [];
  const labels = data?.labels || [];
  const moods = data?.moods || [];
  const milestone = data?.milestone;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">
          {date === new Date().toISOString().slice(0, 10) ? "Today" : "Journal"}
        </div>
        <h1 className="heading-serif text-2xl text-neutral-800">{readableDate(date)}</h1>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {milestone && (
            <span className="pill bg-amber-50 text-amber-700 border border-amber-100">
              <Diamond className="w-3 h-3" />
              {milestone.title}
            </span>
          )}
          {labels.map((l) => (
            <Pill key={l.id} color={l.color}>
              {l.name}
            </Pill>
          ))}
          {moods.map((m) => (
            <span
              key={m.author}
              className={cn(
                "pill border",
                m.author === "hamza"
                  ? "bg-coral-50 text-coral-700 border-coral-100"
                  : "bg-purple-50 text-purple-700 border-purple-100"
              )}
              title={`${authorDisplay(m.author)}: ${m.value}/5`}
            >
              {moodEmoji(m.value)} {authorDisplay(m.author)}
            </span>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card p-6 text-center text-neutral-500 text-sm space-y-3">
          <Heart className="w-5 h-5 mx-auto text-coral-300" />
          <p>
            Nothing here yet.
            {allowCompose && " Tap the + button to start."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onChange={(next) => onChangeEntry(e.id, next)}
            />
          ))}
        </div>
      )}

      {allowCompose && (
        <>
          <button
            className="fab right-4 bottom-20"
            onClick={() => setComposerOpen(true)}
            aria-label="Add entry"
          >
            <Plus className="w-6 h-6" />
          </button>
          <EntryComposer
            open={composerOpen}
            onClose={() => setComposerOpen(false)}
            date={date}
            onPosted={refresh}
          />
        </>
      )}
    </div>
  );
}
