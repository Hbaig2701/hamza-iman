import { CalendarView } from "@/components/calendar/CalendarView";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const now = new Date();
  return (
    <CalendarView
      initialYear={now.getUTCFullYear()}
      initialMonth={now.getUTCMonth() + 1}
    />
  );
}
