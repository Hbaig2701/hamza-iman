"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { fromDateKey, toDateKey } from "@/lib/utils";

function shift(dateKey: string, days: number): string {
  const d = fromDateKey(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateKey(d);
}

export function DayNavigator({ date }: { date: string }) {
  const router = useRouter();
  const today = toDateKey(new Date());
  const prev = shift(date, -1);
  const next = shift(date, 1);
  const nextIsFuture = next > today;
  const isToday = date === today;

  return (
    <div className="flex items-center justify-between">
      <Link
        href={`/day/${prev}`}
        className="btn-ghost"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-xs">prev</span>
      </Link>

      <div className="flex items-center gap-1">
        {!isToday && (
          <Link href="/today" className="btn-ghost text-xs">
            today
          </Link>
        )}
        <label className="btn-ghost cursor-pointer relative">
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs">jump</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              if (e.target.value) router.push(`/day/${e.target.value}`);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Jump to date"
          />
        </label>
      </div>

      {nextIsFuture ? (
        <span
          aria-disabled
          className="inline-flex items-center gap-1 px-3 py-2 text-xs text-neutral-300"
        >
          <span className="text-xs">next</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      ) : (
        <Link
          href={`/day/${next}`}
          className="btn-ghost"
          aria-label="Next day"
        >
          <span className="text-xs">next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
