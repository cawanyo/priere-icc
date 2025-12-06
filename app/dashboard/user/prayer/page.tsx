// app/dashboard/user/prayer/page.tsx
import { UserPrayerBoard } from "@/components/dashboard/prayer/UserPrayerBoard";

export default function UserPrayersPage() {
  return (
    <div className="flex-1 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <UserPrayerBoard />
    </div>
  );
}