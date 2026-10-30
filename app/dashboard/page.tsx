import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarRange, ClipboardList,
  Moon, Clock, ChevronRight,
  Church, Sparkles, ArrowRight,
} from "lucide-react";
import { checkUser } from "../actions/user";
import { getUserDashboard } from "../actions/dashboard-home";
import { format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  LEADER: "Responsable",
  PRAYER_LEADER: "Sentinelle",
  INTERCESSOR: "Intercesseur",
  USER: "Fidèle",
};

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const role = user.role;
  const userName = user?.name || "Bienvenue";
  const userImage = user?.image;
  const userRoleLabel = ROLE_LABELS[role] ?? "Membre";

  const dashboardData = await getUserDashboard();
  const daySchedules = dashboardData?.daySchedules || [];
  const nightSchedules = dashboardData?.nightSchedules || [];
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const currentNightWatch = dashboardData?.currentNightWatch;

  const upcomingSchedules = [...daySchedules, ...nightSchedules]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const today = new Date();
  const todayFormatted = format(today, "EEEE d MMMM yyyy", { locale: fr });
  const capitalizedToday = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const isLeaderOrAdmin = ["LEADER", "ADMIN"].includes(role);
  const eventsLink = isLeaderOrAdmin ? "/dashboard/leader/events" : "/dashboard/user/intercessor/events";

  function getScheduleDetails(schedule: any) {
    const isNight = "assignment" in schedule;
    const scheduleDate = new Date(schedule.date);
    const isToday = isSameDay(scheduleDate, today);
    const isTomorrow = isSameDay(scheduleDate, addDays(today, 1));

    let dateDisplay = format(scheduleDate, "EEEE d MMMM", { locale: fr });
    if (isToday) dateDisplay = "Aujourd'hui";
    else if (isTomorrow) dateDisplay = "Demain";
    else dateDisplay = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);

    if (isNight) {
      const familyName = schedule.assignment?.prayerFamily?.name;
      return {
        isNight: true,
        title: familyName ? `Maison ${familyName}` : "Veille de nuit",
        category: "Veille de nuit",
        time: `${schedule.startTime} – ${schedule.endTime}`,
        dateDisplay,
        isToday,
        isTomorrow,
      };
    } else {
      const title = schedule.eventTemplate?.name || schedule.title || "Créneau de prière";
      return {
        isNight: false,
        title,
        category: "Service de jour",
        time: `${schedule.startTime} – ${schedule.endTime}`,
        dateDisplay,
        isToday,
        isTomorrow,
      };
    }
  }

  return (
    <>
      {/* ── VERSION DESKTOP ── */}
      <div className="hidden md:block min-h-screen bg-[#f8fafc]">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border border-slate-200 shadow-xs">
              <AvatarImage src={userImage || ""} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Bonjour, {userName.split(" ")[0]}
                </h1>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  {userRoleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">
                {capitalizedToday}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-xs text-slate-600">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="italic">« La prière fervente du juste a une grande efficacité. »</span>
            <span className="font-semibold text-slate-500 not-italic">— Jacques 5:16</span>
          </div>
        </div>

        <div className="px-8 py-6 max-w-6xl">
          {/* Grille principale : Prochains services (2/3) + Garde de la semaine & Événements (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* 1. PROCHAINS SERVICES (2 colonnes sur large écran) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-800">
                      Prochains services
                    </h2>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {upcomingSchedules.length}
                    </span>
                  </div>
                  <Link
                    href="/dashboard/desktop/planning"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Planning complet <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {upcomingSchedules.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {upcomingSchedules.map((schedule, i) => {
                      const details = getScheduleDetails(schedule);
                      return (
                        <div
                          key={schedule.id || i}
                          className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                details.isNight
                                  ? "bg-violet-50 border-violet-100 text-violet-600"
                                  : "bg-indigo-50 border-indigo-100 text-indigo-600"
                              }`}
                            >
                              {details.isNight ? (
                                <Moon className="h-4.5 w-4.5" />
                              ) : (
                                <Clock className="h-4.5 w-4.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {details.title}
                                </p>
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                    details.isToday
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : details.isTomorrow
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {details.dateDisplay}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{details.category}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-600">{details.time}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Assigné
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <CalendarRange className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Aucun service planifié</p>
                    <p className="text-xs text-slate-400 mt-1">Vous n'avez aucun créneau assigné à venir.</p>
                    <Link
                      href="/dashboard/desktop/planning"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-3"
                    >
                      Consulter le planning <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 2 & 3. GARDE DE LA SEMAINE & ÉVÉNEMENTS À VENIR (1 colonne) */}
            <div className="space-y-6">
              
              {/* 2. GARDE DE LA SEMAINE */}
              {currentNightWatch && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                        <Church className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                          Garde de la semaine
                        </h2>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">
                          {currentNightWatch.prayerFamily.name}
                        </h3>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/desktop/prayer-house"
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      Voir <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium px-0.5">
                      Sentinelles de demain soir
                    </p>

                    {currentNightWatch.schedules.length > 0 ? (
                      <div className="space-y-1.5">
                        {currentNightWatch.schedules.slice(0, 4).map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Moon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                              <span className="font-medium text-slate-700 truncate">
                                {s.user?.name ?? (
                                  <span className="text-slate-400 italic">Non assigné</span>
                                )}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60 shrink-0">
                              {s.startTime} – {s.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
                        Aucun créneau planifié pour demain
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 3. ÉVÉNEMENTS À VENIR */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800">Événements à venir</h2>
                    {upcomingEvents.length > 0 && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        {upcomingEvents.length}
                      </span>
                    )}
                  </div>
                  <Link
                    href={eventsLink}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Voir tout <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {upcomingEvents.map((event) => {
                      const eventDetailLink = isLeaderOrAdmin
                        ? `/dashboard/leader/events/${event.id}`
                        : `/dashboard/user/intercessor/events/${event.id}`;
                      return (
                        <Link
                          key={event.id}
                          href={eventDetailLink}
                          className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                            <ClipboardList className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {event.title}
                            </p>
                            <p className="text-xs text-slate-400 capitalize mt-0.5">
                              {format(new Date(event.startDate), "EEEE d MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400">Aucun événement à venir pour le moment.</p>
                    <Link
                      href={eventsLink}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2"
                    >
                      Programmes spéciaux <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── VERSION MOBILE ── */}
      <div className="md:hidden min-h-screen bg-[#f8fafc] pb-28">
        {/* Mobile Header - Sober & Clean */}
        <div className="bg-white border-b border-slate-200/80 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-11 w-11 border border-slate-200 shadow-xs">
                  <AvatarImage src={userImage || ""} />
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white block" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    {userName.split(" ")[0]}
                  </h1>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {userRoleLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 capitalize mt-0.5">
                  {capitalizedToday}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          
          {/* 1. PROCHAINS SERVICES */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">Prochains services</h2>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-full">
                  {upcomingSchedules.length}
                </span>
              </div>
              <Link
                href="/dashboard/mobile/planning"
                className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5"
              >
                Planning <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingSchedules.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingSchedules.slice(0, 4).map((schedule, i) => {
                  const details = getScheduleDetails(schedule);
                  return (
                    <div
                      key={schedule.id || i}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          details.isNight
                            ? "bg-violet-50 border-violet-100 text-violet-600"
                            : "bg-indigo-50 border-indigo-100 text-indigo-600"
                        }`}
                      >
                        {details.isNight ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                          {details.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              details.isToday
                                ? "text-emerald-600"
                                : details.isTomorrow
                                ? "text-blue-600"
                                : "text-slate-600"
                            }`}
                          >
                            {details.dateDisplay}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{details.time}</span>
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarRange className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">Aucun service planifié</p>
                <Link
                  href="/dashboard/mobile/planning"
                  className="text-[11px] font-semibold text-indigo-600 mt-1.5 inline-block"
                >
                  Consulter le planning
                </Link>
              </div>
            )}
          </section>

          {/* 2. GARDE DE LA SEMAINE */}
          {currentNightWatch && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                    <Church className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                      Garde de la semaine
                    </h2>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">
                      {currentNightWatch.prayerFamily.name}
                    </h3>
                  </div>
                </div>
                <Link
                  href="/dashboard/mobile/prayer-house"
                  className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5"
                >
                  Voir <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400 font-medium px-1 mb-1">
                  Sentinelles de demain soir
                </p>
                {currentNightWatch.schedules.length > 0 ? (
                  currentNightWatch.schedules.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Moon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <span className="font-medium text-slate-700 truncate max-w-[140px]">
                          {s.user?.name ?? (
                            <span className="text-slate-400 italic">Non assigné</span>
                          )}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/60 shrink-0">
                        {s.startTime}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2.5 bg-slate-50 rounded-xl">
                    Aucun créneau pour demain
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 3. ÉVÉNEMENTS À VENIR */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">Événements à venir</h2>
                {upcomingEvents.length > 0 && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded-full">
                    {upcomingEvents.length}
                  </span>
                )}
              </div>
              <Link
                href={eventsLink}
                className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5"
              >
                Voir tout <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  const eventDetailLink = isLeaderOrAdmin
                    ? `/dashboard/leader/events/${event.id}`
                    : `/dashboard/user/intercessor/events/${event.id}`;
                  return (
                    <Link
                      key={event.id}
                      href={eventDetailLink}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{event.title}</p>
                        <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                          {format(new Date(event.startDate), "EEEE d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                Aucun événement à venir
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
