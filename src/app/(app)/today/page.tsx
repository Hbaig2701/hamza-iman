"use client";

import { useEffect, useState } from "react";
import { todayKey } from "@/lib/utils";
import { DayView } from "@/components/day/DayView";
import { FlashbackCard } from "@/components/today/FlashbackCard";
import { PromptCard } from "@/components/today/PromptCard";
import { CountdownCards } from "@/components/today/CountdownCards";

export default function TodayPage() {
  // Compute "today" client-side in the user's local timezone so evening
  // journaling doesn't roll over to the next UTC day.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(todayKey());
  }, []);

  if (!today) {
    return <div className="h-32" aria-hidden />;
  }

  return (
    <div className="space-y-4">
      <FlashbackCard />
      <CountdownCards />
      <PromptCard />
      <DayView date={today} />
    </div>
  );
}
