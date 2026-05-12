"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Notebook,
  Camera,
  Diamond,
  Heart,
  MapPin,
  Quote as QuoteIcon,
  Mic,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  daysJournaled: number;
  totalEntries: number;
  totalQuotes: number;
  totalMilestones: number;
  totalPhotos: number;
  voiceNotes: number;
  bucket: { total: number; completed: number };
  entriesByAuthor: Record<string, number>;
};

type Recap = {
  label: string;
  daysJournaled: number;
  totalEntries: number;
  totalPhotos: number;
  milestones: number;
  byAuthor: { hamza: number; iman: number };
  topLabels: { name: string; color: string; count: number }[];
  moodAvg: { hamza: number; iman: number };
  bestDay: { date: string; score: number } | null;
  aiSummary: string | null;
};

export function InsightsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [recap, setRecap] = useState<Recap | null>(null);

  useEffect(() => {
    fetch("/api/insights/stats").then((r) => r.json()).then(setStats);
    fetch("/api/insights/streak").then((r) => r.json()).then((d) => setStreak(d.streak || 0));
    fetch("/api/insights/recap").then((r) => r.json()).then(setRecap);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">
          Insights
        </div>
        <h1 className="heading-serif text-2xl">Your story so far</h1>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          tone="amber"
        />
        <StatCard
          icon={<Notebook className="w-4 h-4" />}
          label="Days journaled"
          value={stats?.daysJournaled ?? "—"}
        />
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="Total entries"
          value={stats?.totalEntries ?? "—"}
        />
        <StatCard
          icon={<Camera className="w-4 h-4" />}
          label="Photos shared"
          value={stats?.totalPhotos ?? "—"}
        />
        <StatCard
          icon={<Mic className="w-4 h-4" />}
          label="Voice notes"
          value={stats?.voiceNotes ?? "—"}
        />
        <StatCard
          icon={<Diamond className="w-4 h-4" />}
          label="Milestones"
          value={stats?.totalMilestones ?? "—"}
          tone="amber"
        />
        <StatCard
          icon={<QuoteIcon className="w-4 h-4" />}
          label="Quotes"
          value={stats?.totalQuotes ?? "—"}
        />
        <StatCard
          icon={<Sparkles className="w-4 h-4" />}
          label="Bucket"
          value={
            stats
              ? `${stats.bucket.completed} of ${stats.bucket.total}`
              : "—"
          }
        />
      </div>

      {stats && (
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">Who journals more</div>
          <div className="flex items-center mt-2 h-2 rounded-full overflow-hidden bg-neutral-100">
            <div
              className="h-full bg-coral-400"
              style={{
                width: `${pct(stats.entriesByAuthor.hamza, stats.totalEntries)}%`,
              }}
            />
            <div
              className="h-full bg-purple-400"
              style={{
                width: `${pct(stats.entriesByAuthor.iman, stats.totalEntries)}%`,
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-coral-600">
              Hamza · {stats.entriesByAuthor.hamza || 0}
            </span>
            <span className="text-purple-600">
              Iman · {stats.entriesByAuthor.iman || 0}
            </span>
          </div>
        </div>
      )}

      {recap && (
        <div className="card p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">Recap</div>
            <div className="heading-serif text-base text-neutral-700">{recap.label}</div>
          </div>
          {recap.aiSummary && (
            <p className="text-[14px] italic text-neutral-700 border-l-2 border-coral-200 pl-3">
              {recap.aiSummary}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat n={recap.daysJournaled} l="days" />
            <MiniStat n={recap.totalEntries} l="entries" />
            <MiniStat n={recap.totalPhotos} l="photos" />
          </div>
          {recap.topLabels?.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                Top labels
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recap.topLabels.map((l) => (
                  <span
                    key={l.name}
                    className="pill border"
                    style={{
                      backgroundColor: hexA(l.color, 0.12),
                      color: darken(l.color),
                      borderColor: hexA(l.color, 0.2),
                    }}
                  >
                    {l.name} · {l.count}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(recap.moodAvg.hamza > 0 || recap.moodAvg.iman > 0) && (
            <div className="text-[12px] text-neutral-600 flex items-center gap-4">
              <span>
                Hamza avg mood:{" "}
                <strong className="text-coral-600">{recap.moodAvg.hamza}/5</strong>
              </span>
              <span>
                Iman avg mood:{" "}
                <strong className="text-purple-600">{recap.moodAvg.iman}/5</strong>
              </span>
            </div>
          )}
          {recap.bestDay && (
            <div className="text-[12px] text-neutral-600">
              ✨ Best day:{" "}
              <Link
                href={`/day/${new Date(recap.bestDay.date).toISOString().slice(0, 10)}`}
                className="underline"
              >
                {new Date(recap.bestDay.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </Link>
            </div>
          )}
        </div>
      )}

      <MoodChart />

      <nav className="card divide-y divide-black/[0.05] overflow-hidden">
        <SubLink href="/insights/favorites" label="Favorites" />
        <SubLink href="/insights/milestones" label="Milestones timeline" />
        <SubLink href="/insights/map" label="Memory map" icon={<MapPin className="w-4 h-4" />} />
        <SubLink href="/insights/mood" label="Mood history" />
        <SubLink href="/insights/prompts" label="Prompt history" />
      </nav>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: any;
  tone?: "amber";
}) {
  return (
    <div
      className={cn(
        "card p-3",
        tone === "amber" && "bg-amber-50 border-amber-100"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] uppercase tracking-wide",
          tone === "amber" ? "text-amber-700" : "text-neutral-500"
        )}
      >
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "heading-serif text-xl mt-1",
          tone === "amber" ? "text-amber-800" : "text-neutral-800"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({ n, l }: { n: any; l: string }) {
  return (
    <div className="bg-neutral-100/60 rounded-lg py-2">
      <div className="heading-serif text-lg text-neutral-800">{n}</div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{l}</div>
    </div>
  );
}

function SubLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition"
    >
      <span className="flex items-center gap-2 text-[14px] text-neutral-700">
        {icon}
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-neutral-400" />
    </Link>
  );
}

function MoodChart() {
  const [data, setData] = useState<{ moods: { author: string; value: number; day: { date: string } }[] } | null>(
    null
  );
  useEffect(() => {
    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    fetch(`/api/moods?month=${month}`).then((r) => r.json()).then(setData);
  }, []);

  if (!data || data.moods.length === 0) return null;

  // Group by day
  const byDay: Record<string, { hamza?: number; iman?: number }> = {};
  for (const m of data.moods) {
    const k = new Date(m.day.date).toISOString().slice(0, 10);
    byDay[k] ||= {};
    (byDay[k] as any)[m.author] = m.value;
  }
  const days = Object.keys(byDay).sort();
  const last = days.slice(-14);

  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">
        Mood — last 14 days
      </div>
      <div className="flex items-end gap-1 h-24">
        {last.map((d) => {
          const h = byDay[d].hamza || 0;
          const i = byDay[d].iman || 0;
          return (
            <div key={d} className="flex-1 flex items-end gap-[2px]">
              <div
                className="flex-1 bg-coral-300 rounded-t"
                style={{ height: `${(h / 5) * 100}%` }}
                title={`Hamza ${h}/5`}
              />
              <div
                className="flex-1 bg-purple-300 rounded-t"
                style={{ height: `${(i / 5) * 100}%` }}
                title={`Iman ${i}/5`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-coral-300" />
          Hamza
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-300" />
          Iman
        </span>
      </div>
    </div>
  );
}

function pct(n: number | undefined, total: number) {
  if (!total) return 0;
  return Math.round(((n || 0) / total) * 100);
}

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function darken(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 60);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 60);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 60);
  return `rgb(${r}, ${g}, ${b})`;
}
