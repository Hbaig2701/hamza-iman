"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Diamond, LayoutGrid, Grid3X3 } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { cn, daysInMonth, toDateKey } from "@/lib/utils";

type Label = { id: string; name: string; color: string };
type DayDTO = {
  id: string;
  date: string;
  coverImage: string | null;
  labels: Label[];
  milestone: { id: string; title: string } | null;
  entryCount: number;
};

export function CalendarView({
  initialYear,
  initialMonth,
}: {
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [mode, setMode] = useState<"month" | "year">("month");
  const [days, setDays] = useState<Record<string, DayDTO>>({});
  const [filter, setFilter] = useState<"all" | "milestones">("all");

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  useEffect(() => {
    fetch(`/api/days?month=${monthKey}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, DayDTO> = {};
        for (const day of d.days as DayDTO[]) {
          map[toDateKey(new Date(day.date))] = day;
        }
        setDays(map);
      })
      .catch(() => {});
  }, [monthKey]);

  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const navigate = (delta: number) => {
    if (mode === "month") {
      let m = month + delta;
      let y = year;
      if (m > 12) {
        m = 1;
        y += 1;
      } else if (m < 1) {
        m = 12;
        y -= 1;
      }
      setMonth(m);
      setYear(y);
    } else {
      setYear((y) => y + delta);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="heading-serif text-xl text-neutral-800">
          {mode === "month" ? monthName : year}
        </h1>
        <button onClick={() => navigate(1)} className="btn-ghost">
          <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Pill
            selected={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </Pill>
          <Pill
            selected={filter === "milestones"}
            onClick={() => setFilter("milestones")}
          >
            <Diamond className="w-3 h-3" />
            Milestones
          </Pill>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode("month")}
            className={cn(
              "p-1.5 rounded transition",
              mode === "month"
                ? "bg-neutral-200 text-neutral-800"
                : "text-neutral-500 hover:bg-neutral-100"
            )}
            aria-label="Month view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode("year")}
            className={cn(
              "p-1.5 rounded transition",
              mode === "year"
                ? "bg-neutral-200 text-neutral-800"
                : "text-neutral-500 hover:bg-neutral-100"
            )}
            aria-label="Year view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {mode === "month" ? (
        <MonthGrid year={year} month={month} days={days} filter={filter} />
      ) : (
        <YearGrid year={year} onPickMonth={(m) => { setMonth(m); setMode("month"); }} />
      )}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  days,
  filter,
}: {
  year: number;
  month: number;
  days: Record<string, DayDTO>;
  filter: "all" | "milestones";
}) {
  const total = daysInMonth(year, month);
  const todayKey = toDateKey(new Date());
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const d = i + 1;
        const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const day = days[key];
        const isFuture = key > todayKey;
        const isToday = key === todayKey;
        const milestone = day?.milestone;
        const primaryLabel = day?.labels?.[0];

        if (filter === "milestones" && !milestone) {
          return (
            <Link
              key={key}
              href={`/day/${key}`}
              className="aspect-square rounded-card bg-neutral-100/40 flex flex-col items-center justify-center text-neutral-300 text-xs"
            >
              {d}
            </Link>
          );
        }

        return (
          <Link
            key={key}
            href={`/day/${key}`}
            className={cn(
              "relative aspect-square rounded-card overflow-hidden border transition group",
              isToday
                ? "border-coral-400 ring-2 ring-coral-200"
                : "border-black/[0.06]",
              isFuture ? "opacity-40" : "hover:shadow-card"
            )}
            style={
              day?.coverImage
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.4)), url(${day.coverImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : primaryLabel?.color
                ? { backgroundColor: hexA(primaryLabel.color, 0.15) }
                : undefined
            }
          >
            <div
              className={cn(
                "absolute top-1.5 left-1.5 text-[11px] font-semibold",
                day?.coverImage ? "text-white" : "text-neutral-700"
              )}
            >
              {d}
            </div>
            {milestone && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                <Diamond className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            {primaryLabel && (
              <div className="absolute bottom-1 left-1 right-1 flex">
                <span
                  className="pill"
                  style={{
                    backgroundColor: hexA(primaryLabel.color, day?.coverImage ? 0.9 : 0.18),
                    color: day?.coverImage ? "white" : darken(primaryLabel.color),
                  }}
                >
                  {primaryLabel.name}
                </span>
              </div>
            )}
            {!day?.coverImage && !primaryLabel && day && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-400">
                {day.entryCount} {day.entryCount === 1 ? "entry" : "entries"}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function YearGrid({
  year,
  onPickMonth,
}: {
  year: number;
  onPickMonth: (m: number) => void;
}) {
  const [previews, setPreviews] = useState<Record<number, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<number, string[]> = {};
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, "0")}`;
        const r = await fetch(`/api/days?month=${key}`);
        if (!r.ok) continue;
        const d = await r.json();
        const urls: string[] = [];
        for (const day of d.days || []) {
          if (day.coverImage) urls.push(day.coverImage);
        }
        next[m] = urls.slice(0, 4);
        if (cancelled) return;
        setPreviews({ ...next });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 12 }).map((_, i) => {
        const m = i + 1;
        const name = new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString(undefined, {
          month: "short",
          timeZone: "UTC",
        });
        const urls = previews[m] || [];
        return (
          <button
            key={m}
            onClick={() => onPickMonth(m)}
            className="rounded-card overflow-hidden border border-black/[0.06] bg-neutral-100 hover:shadow-card transition"
          >
            <div className="aspect-square grid grid-cols-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-neutral-200"
                  style={
                    urls[idx]
                      ? {
                          backgroundImage: `url(${urls[idx]})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            <div className="text-center text-xs text-neutral-700 py-1.5">{name}</div>
          </button>
        );
      })}
    </div>
  );
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
