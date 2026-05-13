import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DayView } from "@/components/day/DayView";
import { DayNavigator } from "@/components/day/DayNavigator";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function DayPage({ params }: { params: { date: string } }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) notFound();
  const today = toDateKey(new Date());
  const isFuture = params.date > today;
  return (
    <div className="space-y-3">
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to calendar
      </Link>
      <DayNavigator date={params.date} />
      <DayView date={params.date} allowCompose={!isFuture} />
    </div>
  );
}
