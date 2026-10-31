import { getUserUnavailabilities } from "@/app/actions/availability";
import { AvailabilityForm } from "@/components/dashboard/availability/AvailabilityForm";
import { AvailabilityList } from "@/components/dashboard/availability/AvailabilityList";
import { CalendarClock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { data: items } = await getUserUnavailabilities();

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 space-y-5 bg-[#f8fafc] min-h-screen max-w-5xl mx-auto">
      {/* Lien retour mobile */}
      <Link
        href="/dashboard/mobile/espace"
        className="inline-flex md:hidden items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour à Toi
      </Link>

      {/* En-tête épuré et sobre */}
      <div className="flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Mes Disponibilités
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Déclarez vos périodes d&apos;indisponibilité pour faciliter l&apos;organisation des plannings de prière.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Formulaire (5/12) */}
        <div className="lg:col-span-5">
          <AvailabilityForm />
        </div>

        {/* Colonne Liste (7/12) */}
        <div className="lg:col-span-7">
          <AvailabilityList items={items || []} />
        </div>
      </div>
    </div>
  );
}
