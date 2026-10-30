import { getLeaderStats } from "@/app/actions/dashboard-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Moon, ArrowRight, ShieldCheck, ShieldAlert, CalendarDays, CalendarRange } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default async function LeaderDashboardPage() {
  const { nextEvent, nightWatch, stats } = await getLeaderStats();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* En-tête sobre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Espace Leader
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision générale de l&apos;intercession et des programmes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs rounded-xl bg-white shadow-xs">
            <Link href="/dashboard/leader/planning">
              <CalendarRange className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
              Planning
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
            <Link href="/dashboard/leader/events">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              Événements
            </Link>
          </Button>
        </div>
      </div>

      {/* Indicateurs clés sobres */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Membres Actifs
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {stats.activeIntercessors}
            </span>
            <span className="text-[11px] text-slate-500">Conducteurs et intercesseurs</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Maisons de Prière
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {stats.totalFamilies}
            </span>
            <span className="text-[11px] text-slate-500">Familles de sentinelles</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Moon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Temps Forts
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {nextEvent ? 1 : 0}
            </span>
            <span className="text-[11px] text-slate-500">Événement spécial actif</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Garde de Nuit
            </span>
            <span className="text-xs font-bold text-slate-900 mt-1 block truncate max-w-[140px]">
              {nightWatch ? nightWatch.prayerFamily.name : "Non assignée"}
            </span>
            <span className="text-[11px] text-slate-500">00h - 04h prochaine</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-7 items-start">
        {/* Prochain Événement Spécial */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-amber-500" />
              Prochain Événement Spécial
            </span>
            {nextEvent && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700">
                <Link href={`/dashboard/leader/events/${nextEvent.id}`}>
                  Planning <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {nextEvent ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">{nextEvent.title}</h2>
              {nextEvent.description && (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {nextEvent.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>
                  Du {format(new Date(nextEvent.startDate), "d MMMM", { locale: fr })} au {format(new Date(nextEvent.endDate), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Aucun événement spécial n&apos;est programmé prochainement.
            </div>
          )}
        </div>

        {/* Nuit des sentinelles */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Moon className="h-4 w-4 text-indigo-600" />
              Garde du {format(tomorrow, "d MMMM", { locale: fr })}
            </span>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:text-indigo-700">
              <Link href="/dashboard/leader/prayer-house">
                Gérer <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>

          {!nightWatch ? (
            <div className="text-center py-6 space-y-2">
              <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Aucune famille assignée pour demain</p>
              <Button asChild size="sm" variant="outline" className="text-xs rounded-xl h-8">
                <Link href="/dashboard/leader/prayer-house">Attribuer une maison</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                <span className="text-slate-600 font-medium">Famille de garde :</span>
                <span className="font-bold text-indigo-950">{nightWatch.prayerFamily.name}</span>
              </div>

              <div className="space-y-1.5">
                {["00:00", "01:00", "02:00", "03:00"].map((hour) => {
                  const schedule = nightWatch.schedules.find((s) => s.startTime === hour);
                  return (
                    <div
                      key={hour}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-mono text-slate-400 font-medium">{hour}</span>
                      {schedule?.user ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{schedule.user.name}</span>
                          <Avatar className="h-5 w-5 border border-white">
                            <AvatarImage src={schedule.user.image ?? undefined} />
                            <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700 font-bold">
                              {schedule.user.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Non pourvu</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
