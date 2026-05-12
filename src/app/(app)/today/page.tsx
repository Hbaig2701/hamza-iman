import { toDateKey } from "@/lib/utils";
import { DayView } from "@/components/day/DayView";
import { FlashbackCard } from "@/components/today/FlashbackCard";
import { PromptCard } from "@/components/today/PromptCard";
import { CountdownCards } from "@/components/today/CountdownCards";

export const dynamic = "force-dynamic";

export default function TodayPage() {
  const today = toDateKey(new Date());
  return (
    <div className="space-y-4">
      <FlashbackCard />
      <CountdownCards />
      <PromptCard />
      <DayView date={today} />
    </div>
  );
}
