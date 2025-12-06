// app/dashboard/leader/prayer/page.tsx
import { LeaderPrayerBoard } from "@/components/dashboard/leader/LeaderPrayerBoard";

export default function LeaderPrayerPage() {
  return (
    <div className="flex-1 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <LeaderPrayerBoard />
    </div>
  );
}