import { redirect } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { IntercessorCalendar } from "@/components/dashboard/intercessor/IntercessorCalendar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function IntercessorPlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* En-tête épuré et sobre */}
      <div className="flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Planning Général
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez les créneaux d&apos;intercession de la semaine et vos assignations.
          </p>
        </div>
      </div>

      <IntercessorCalendar />
    </div>
  );
}
