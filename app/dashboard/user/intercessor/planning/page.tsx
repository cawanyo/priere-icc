// app/dashboard/user/intercessor/planning/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { IntercessorCalendar } from "@/components/dashboard/intercessor/IntercessorCalendar";
import { checkIntercessorAccess } from "@/app/actions/intercessor";

export default async function IntercessorPlanningPage() {
  const user = await checkIntercessorAccess()
  
  // Sécurité simple (la Server Action fait la vérification approfondie)
  // @ts-ignore
  if (!user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Calendar className="h-6 w-6" />
        </div>
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-indigo-900">
                Planning Général
            </h2>
            <p className="text-muted-foreground">
                Consultez les créneaux de prière et vos assignations.
            </p>
        </div>
      </div>

      <IntercessorCalendar />
    </div>
  );
}