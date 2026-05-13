"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { daysInMonth, todayKey } from "@/lib/utils";
import { moodEmoji } from "@/components/ui/MoodSelector";

export default function MoodHistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [moods, setMoods] = useState<Record<string, { hamza?: number; iman?: number }>>({});

  useEffect(() => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    fetch(`/api/moods?month=${key}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, { hamza?: number; iman?: number }> = {};
        for (const m of d.moods || []) {
          const k = new Date(m.day.date).toISOString().slice(0, 10);
          map[k] ||= {};
          (map[k] as any)[m.author] = m.value;
        }
        setMoods(map);
      });
  }, [year, month]);

  const total = daysInMonth(year, month);
  const todayK = todayKey();

  return (
    <div className="space-y-4">
      <Link href="/insights" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="w-3 h-3" />
        Insights
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="heading-serif text-2xl">Mood history</h1>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => {
              let m = month - 1;
              let y = year;
              if (m < 1) {
                m = 12;
                y -= 1;
              }
              setMonth(m);
              setYear(y);
            }}
            className="btn-ghost"
          >
            ‹
          </button>
          <span className="heading-serif">
            {new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
          <button
            onClick={() => {
              let m = month + 1;
              let y = year;
              if (m > 12) {
                m = 1;
                y += 1;
              }
              setMonth(m);
              setYear(y);
            }}
            className="btn-ghost"
          >
            ›
          </button>
        </div>
      </div>

      <p className="text-[11px] text-neutral-500">
        Each cell shows two halves — Hamza on the left, Iman on the right. Darker = stronger mood.
      </p>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const d = i + 1;
          const k = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const m = moods[k] || {};
          return (
            <div
              key={k}
              className="aspect-square rounded-lg overflow-hidden bg-neutral-100 relative flex"
            >
              <div className="flex-1" style={{ background: shadeFor("hamza", m.hamza) }} />
              <div className="flex-1" style={{ background: shadeFor("iman", m.iman) }} />
              <span className="absolute top-0.5 left-0.5 text-[9px] font-medium text-neutral-700">
                {d}
              </span>
              {k === todayK && (
                <span className="absolute inset-0 ring-2 ring-coral-300 rounded-lg pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-neutral-600">
        <span>1</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((v) => (
            <span key={v} className="text-base">
              {moodEmoji(v)}
            </span>
          ))}
        </div>
        <span>5</span>
      </div>
    </div>
  );
}

function shadeFor(author: "hamza" | "iman", v?: number) {
  if (!v) return "transparent";
  const base = author === "hamza" ? "216, 90, 48" : "127, 119, 221";
  const alpha = 0.15 + (v / 5) * 0.65;
  return `rgba(${base}, ${alpha})`;
}
