"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { relativeMonths, shortDate, toDateKey } from "@/lib/utils";

type Flashback = {
  date: string;
  preview: string | null;
  thumbnail: string | null;
};

export function FlashbackCard() {
  const [items, setItems] = useState<Flashback[]>([]);

  useEffect(() => {
    fetch("/api/insights/flashback")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setItems(d.flashbacks || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="card p-4 space-y-3 bg-gradient-to-br from-purple-50 to-coral-50/40 border-purple-100">
      <header className="flex items-center gap-2 text-purple-700 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        On this day
      </header>
      <div className="space-y-2">
        {items.map((f) => {
          const months = relativeMonths(new Date(f.date), new Date());
          const ago =
            months >= 12
              ? `${Math.floor(months / 12)} year${months >= 24 ? "s" : ""} ago`
              : months >= 1
              ? `${months} month${months > 1 ? "s" : ""} ago`
              : "earlier";
          return (
            <Link
              key={f.date}
              href={`/day/${toDateKey(new Date(f.date))}`}
              className="flex gap-3 items-center hover:opacity-80 transition"
            >
              {f.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.thumbnail}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover bg-neutral-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center text-purple-400 text-xs">
                  📖
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-purple-600">
                  {ago} · {shortDate(f.date)}
                </div>
                <div className="text-[13px] text-neutral-700 line-clamp-2">
                  {f.preview || "A memory from this day."}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
