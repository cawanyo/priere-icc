"use client";

import { useState, useMemo } from "react";
import { Calendar, ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { convertKeepDate, cn } from "@/lib/utils";

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  _count?: { plannings?: number };
};

type EventStatus = "ONGOING" | "UPCOMING" | "PAST";

function getEventStatus(startDate: Date | string, endDate: Date | string): EventStatus {
  try {
    const start = convertKeepDate(new Date(startDate));
    const end = convertKeepDate(new Date(endDate));
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const eventEndDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    const eventStartDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);

    if (eventEndDay.getTime() < todayStart.getTime()) {
      return "PAST";
    }
    if (eventStartDay.getTime() <= todayStart.getTime()) {
      return "ONGOING";
    }
    return "UPCOMING";
  } catch {
    return "UPCOMING";
  }
}

function formatEventDates(startDate: Date | string, endDate: Date | string): string {
  try {
    const start = convertKeepDate(new Date(startDate));
    const end = convertKeepDate(new Date(endDate));
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      if (start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) {
        return format(start, "d MMMM yyyy", { locale: fr });
      }
      return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
    }
    return `${format(start, "d MMM yyyy", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
  } catch {
    return "";
  }
}

export function IntercessorEventList({ events }: { events: EventItem[] }) {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  const { activeEvents, pastEvents } = useMemo(() => {
    const active: EventItem[] = [];
    const past: EventItem[] = [];

    events.forEach((evt) => {
      const status = getEventStatus(evt.startDate, evt.endDate);
      if (status === "PAST") {
        past.push(evt);
      } else {
        active.push(evt);
      }
    });

    // Active : Ongoing first, then upcoming by start date ascending
    active.sort((a, b) => {
      const statusA = getEventStatus(a.startDate, a.endDate);
      const statusB = getEventStatus(b.startDate, b.endDate);
      if (statusA === "ONGOING" && statusB !== "ONGOING") return -1;
      if (statusB === "ONGOING" && statusA !== "ONGOING") return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Past : most recent end date first
    past.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    return { activeEvents: active, pastEvents: past };
  }, [events]);

  const displayedEvents = activeTab === "active" ? activeEvents : pastEvents;

  return (
    <div className="space-y-6">
      {/* Ligne d'options : Actif & Passé */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            activeTab === "active"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          )}
        >
          <span>Actif</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === "active"
                ? "bg-white/20 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            )}
          >
            {activeEvents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            activeTab === "past"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          )}
        >
          <span>Passé</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === "past"
                ? "bg-white/20 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            )}
          >
            {pastEvents.length}
          </span>
        </button>
      </div>

      {/* Grille des Cards */}
      {displayedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedEvents.map((evt) => {
            const status = getEventStatus(evt.startDate, evt.endDate);
            const dateRange = formatEventDates(evt.startDate, evt.endDate);
            const slotsCount = evt._count?.plannings;

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Ligne Date & Statut */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="capitalize">{dateRange}</span>
                    </span>

                    {status === "ONGOING" && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        En cours
                      </span>
                    )}

                    {status === "UPCOMING" && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full shrink-0">
                        À venir
                      </span>
                    )}

                    {status === "PAST" && (
                      <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shrink-0">
                        Terminé
                      </span>
                    )}
                  </div>

                  {/* Titre & Description */}
                  <div className="mt-3.5 mb-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {evt.title}
                    </h3>
                    {evt.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* Créneaux info */}
                  {slotsCount !== undefined && slotsCount > 0 && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      <span>{slotsCount} {slotsCount > 1 ? "créneaux au planning" : "créneau au planning"}</span>
                    </p>
                  )}
                </div>

                {/* Bouton d'action */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/dashboard/user/intercessor/events/${evt.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 transition-all"
                  >
                    Voir le planning
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {activeTab === "active"
              ? "Aucun événement actif pour le moment"
              : "Aucun événement passé"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === "active"
              ? "Tous les programmes en cours ou à venir apparaîtront ici."
              : "Les programmes terminés apparaîtront dans cet historique."}
          </p>
        </div>
      )}
    </div>
  );
}
