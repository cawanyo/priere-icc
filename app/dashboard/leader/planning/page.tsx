// app/dashboard/leader/planning/page.tsx
import { PlanningCalendar } from "@/components/dashboard/planning/PlanningCalendar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { checkLeaderAccess } from "@/app/actions/leader";

export default async function PlanningPage() {
  const user = checkLeaderAccess()
  // @ts-ignore
  if (!user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
            Planning de Prière
          </h2>
          <p className="text-muted-foreground">
            Organisez la couverture spirituelle de la semaine.
          </p>
        </div>
      </div>

      <PlanningCalendar />
    </div>
  );
}