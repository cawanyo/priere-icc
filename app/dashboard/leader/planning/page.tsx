import { PlanningCalendar } from "@/components/dashboard/planning/PlanningCalendar";
import { redirect } from "next/navigation";
import { checkLeaderAccess } from "@/app/actions/leader";
import { CalendarRange } from "lucide-react";

export default async function PlanningPage() {
  try {
    await checkLeaderAccess();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 space-y-6 bg-[#f8fafc] min-h-screen">
      <div className="flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Planning de Prière
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordination et assignation des créneaux d&apos;intercession.
          </p>
        </div>
      </div>

      <PlanningCalendar />
    </div>
  );
}
