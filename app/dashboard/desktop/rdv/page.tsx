"use client";

import { useEffect, useState } from "react";
import {
  getAvailableSlots,
  bookSlot,
  getMyAppointments,
  cancelAppointmentUser,
} from "@/app/actions/appointment";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  CalendarRange, Clock, RefreshCcw, ChevronRight,
  CheckCircle2, X, AlertCircle, Phone, CalendarCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type AvailableSlot = Awaited<ReturnType<typeof getAvailableSlots>>[0];
type MyAppointment = Awaited<ReturnType<typeof getMyAppointments>>[0];

function groupByDay(slots: AvailableSlot[]) {
  const map = new Map<string, AvailableSlot[]>();
  for (const slot of slots) {
    const key = format(new Date(slot.startTime), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  return Array.from(map.entries()).map(([, slots]) => ({ date: new Date(slots[0].startTime), slots }));
}

function ConfirmPanel({ slot, onClose, onDone }: { slot: AvailableSlot; onClose: () => void; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  async function handleBook() {
    setSaving(true);
    try {
      await bookSlot(slot.id);
      toast.success("RDV confirmé !");
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-800">Confirmer le rendez-vous</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="bg-indigo-50 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={slot.leader.image ?? ""} />
            <AvatarFallback className="bg-indigo-200 text-indigo-700 font-bold">
              {slot.leader.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-bold text-gray-800">{slot.leader.name}</p>
            <p className="text-sm text-gray-500 capitalize">{slot.leader.role.toLowerCase().replace("_", " ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-700 font-semibold">
          <Clock className="h-4 w-4" />
          <span>
            {format(new Date(slot.startTime), "EEEE d MMMM yyyy", { locale: fr })} · {format(new Date(slot.startTime), "HH:mm")} – {format(new Date(slot.endTime), "HH:mm")}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400">Ce RDV sera d'une durée de 30 minutes. Un seul RDV actif à la fois.</p>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
          Annuler
        </button>
        <button
          onClick={handleBook}
          disabled={saving}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-indigo-700 transition-colors"
        >
          {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirmer
        </button>
      </div>
    </div>
  );
}

function MyAppointmentCard({ appt, onCancel }: { appt: MyAppointment; onCancel: () => void }) {
  const isConfirmed = appt.status === "CONFIRMED";
  return (
    <div className={cn("bg-white rounded-xl border-l-4 overflow-hidden", isConfirmed ? "border-l-indigo-500" : "border-l-gray-200")}>
      <div className="p-4 flex items-center gap-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={appt.leader.image ?? ""} />
          <AvatarFallback className="bg-violet-100 text-violet-700 font-bold text-sm">
            {appt.leader.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">{appt.leader.name}</p>
          <p className="text-xs text-gray-400">
            {format(new Date(appt.slot.startTime), "EEEE d MMMM", { locale: fr })} · {format(new Date(appt.slot.startTime), "HH:mm")} – {format(new Date(appt.slot.endTime), "HH:mm")}
          </p>
          {appt.cancelReason && <p className="text-xs text-gray-400 italic mt-1">"{appt.cancelReason}"</p>}
        </div>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", isConfirmed ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500")}>
          {isConfirmed ? "Confirmé" : "Annulé"}
        </span>
        {isConfirmed && (
          <div className="flex items-center gap-2">
            {appt.leader.phone && (
              <a href={`tel:${appt.leader.phone}`} className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                <Phone className="h-3.5 w-3.5" /> Appeler
              </a>
            )}
            <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
              <X className="h-3.5 w-3.5" /> Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DesktopRdvPage() {
  const [tab, setTab] = useState<"book" | "mine">("mine");
  const [available, setAvailable] = useState<AvailableSlot[]>([]);
  const [myAppts, setMyAppts] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmSlot, setConfirmSlot] = useState<AvailableSlot | null>(null);

  async function load() {
    setLoading(true);
    const [avail, mine] = await Promise.all([getAvailableSlots(), getMyAppointments()]);
    setAvailable(avail);
    setMyAppts(mine);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(apptId: string) {
    try {
      await cancelAppointmentUser(apptId);
      toast.success("RDV annulé");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  }

  const groups = groupByDay(available);
  const confirmedAppt = myAppts.find((a) => a.status === "CONFIRMED");

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center">
            <CalendarRange className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
            <p className="text-sm text-gray-500">Prendre ou gérer un RDV</p>
          </div>
        </div>

        {/* RDV confirmé en haut si existant */}
        {confirmedAppt && (
          <div className="bg-indigo-600 rounded-2xl p-5 text-white flex items-center gap-4">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white/30">
              <AvatarImage src={confirmedAppt.leader.image ?? ""} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {confirmedAppt.leader.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-200 mb-0.5">RDV confirmé</p>
              <p className="text-base font-bold">{confirmedAppt.leader.name}</p>
              <p className="text-sm text-indigo-200">
                {format(new Date(confirmedAppt.slot.startTime), "EEEE d MMMM yyyy · HH:mm", { locale: fr })}
              </p>
            </div>
            {confirmedAppt.leader.phone && (
              <a href={`tel:${confirmedAppt.leader.phone}`} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Phone className="h-4 w-4" /> Appeler
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">

          {/* Colonne gauche — tabs + contenu */}
          <div className={cn("space-y-4", confirmSlot ? "col-span-8" : "col-span-12")}>
            <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
              {[{ key: "mine", label: "Mes RDV" }, { key: "book", label: "Prendre un RDV" }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setTab(key as any); setConfirmSlot(null); }}
                  className={cn(
                    "flex-1 py-3 text-sm font-bold transition-all",
                    tab === key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
                <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
              </div>
            ) : tab === "mine" ? (
              myAppts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <CalendarRange className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aucun rendez-vous pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myAppts.map((a) => (
                    <MyAppointmentCard key={a.id} appt={a} onCancel={() => handleCancel(a.id)} />
                  ))}
                </div>
              )
            ) : (
              groups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <AlertCircle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aucun créneau disponible pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groups.map(({ date, slots }) => (
                    <div key={date.toISOString()} className="space-y-2">
                      <p className="text-sm font-bold text-gray-500 capitalize px-1">
                        {format(date, "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setConfirmSlot(slot)}
                            className={cn(
                              "bg-white rounded-xl border p-4 flex items-center gap-4 text-left transition-all hover:shadow-md",
                              confirmSlot?.id === slot.id ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-100"
                            )}
                          >
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                              <span className="text-xs font-extrabold text-indigo-700">{format(new Date(slot.startTime), "HH:mm")}</span>
                              <span className="text-[9px] text-indigo-400">30 min</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800">Avec {slot.leader.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5 capitalize">{slot.leader.role.toLowerCase().replace("_", " ")}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Colonne droite — panneau de confirmation */}
          {confirmSlot && (
            <div className="col-span-4">
              <ConfirmPanel
                slot={confirmSlot}
                onClose={() => setConfirmSlot(null)}
                onDone={load}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
