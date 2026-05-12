"use client";

import { useEffect, useState } from "react";
import { CalendarHeart } from "lucide-react";
import { toDateKey } from "@/lib/utils";

type Countdown = {
  id: string;
  title: string;
  emoji: string | null;
  targetDate: string;
};

export function CountdownCards() {
  const [items, setItems] = useState<Countdown[]>([]);

  useEffect(() => {
    fetch("/api/countdowns")
      .then((r) => r.json())
      .then((d) => setItems(d.countdowns || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const today = toDateKey(new Date());
  const todayDate = new Date(today + "T00:00:00Z");

  return (
    <div className="scroll-x flex gap-2 -mx-4 px-4">
      {items.map((c) => {
        const target = new Date(toDateKey(new Date(c.targetDate)) + "T00:00:00Z");
        const days = Math.round((target.getTime() - todayDate.getTime()) / 86400000);
        const past = days < 0;
        return (
          <div
            key={c.id}
            className="card shrink-0 w-44 p-3 bg-gradient-to-br from-pink-50 to-white border-pink-100"
          >
            <div className="flex items-center gap-1.5 text-pink-700 text-[11px] font-medium">
              {c.emoji ? <span>{c.emoji}</span> : <CalendarHeart className="w-3 h-3" />}
              {c.title}
            </div>
            <div className="mt-1">
              {days === 0 ? (
                <div className="heading-serif text-2xl text-pink-700">Today!</div>
              ) : (
                <>
                  <div className="heading-serif text-3xl text-pink-700 leading-none">
                    {Math.abs(days)}
                  </div>
                  <div className="text-[11px] text-pink-600">
                    {past ? "days ago" : "days away"}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
