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
  CheckCircle2, X, AlertCircle, Phone, User,
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
  return Array.from(map.entries()).map(([key, slots]) => ({ date: new Date(slots[0].startTime), slots }));
}

function ConfirmModal({
  slot,
  onClose,
  onDone,
}: {
  slot: AvailableSlot;
  onClose: () => void;
  onDone: () => void;
}) {
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-800">Confirmer le RDV</p>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={slot.leader.image ?? ""} />
              <AvatarFallback className="bg-indigo-200 text-indigo-700 font-bold text-sm">
                {slot.leader.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-gray-800">{slot.leader.name}</p>
              <p className="text-xs text-gray-400 capitalize">{slot.leader.role.toLowerCase().replace("_", " ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-700 font-semibold">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(slot.startTime), "EEEE d MMMM", { locale: fr })} · {format(new Date(slot.startTime), "HH:mm")} – {format(new Date(slot.endTime), "HH:mm")}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Ce RDV sera d'une durée de 30 minutes. Un seul RDV actif à la fois.
        </p>

        <button
          onClick={handleBook}
          disabled={saving}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
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
    <div className={cn(
      "bg-white rounded-2xl shadow-sm overflow-hidden border-l-4",
      isConfirmed ? "border-l-indigo-500" : "border-l-gray-200"
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
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
          </div>
          <span className={cn(
            "text-[10px] font-semibold px-2.5 py-1 rounded-full",
            isConfirmed ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
          )}>
            {isConfirmed ? "Confirmé" : "Annulé"}
          </span>
        </div>

        {appt.cancelReason && (
          <p className="text-[10px] text-gray-400 italic px-1">"{appt.cancelReason}"</p>
        )}

        {isConfirmed && (
          <div className="flex items-center gap-2">
            {appt.leader.phone && (
              <a
                href={`tel:${appt.leader.phone}`}
                className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-2 rounded-xl"
              >
                <Phone className="h-3.5 w-3.5" /> Appeler
              </a>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs text-red-500 font-semibold bg-red-50 px-3 py-2 rounded-xl ml-auto"
            >
              <X className="h-3.5 w-3.5" /> Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserRdvPage() {
  const [tab, setTab] = useState<"book" | "mine">("mine");
  const [available, setAvailable] = useState<AvailableSlot[]>([]);
  const [myAppts, setMyAppts]     = useState<MyAppointment[]>([]);
  const [loading, setLoading]     = useState(true);
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
    <>
      {confirmSlot && (
        <ConfirmModal
          slot={confirmSlot}
          onClose={() => setConfirmSlot(null)}
          onDone={load}
        />
      )}

      <div className="min-h-screen bg-[#f4f6fb] pb-24">

        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-5 pt-6 pb-12 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <CalendarRange className="text-white/15 absolute bottom-3 right-5 h-14 w-14" />
          <h1 className="text-white text-xl font-bold relative">Rendez-vous</h1>
          <p className="text-violet-200 text-xs mt-0.5 relative">Prendre ou gérer un RDV</p>
        </div>

        <div className="px-4 -mt-4 space-y-4">

          {/* RDV actif */}
          {confirmedAppt && (
            <div className="bg-indigo-600 rounded-3xl p-4 text-white space-y-2 shadow">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-200">RDV confirmé</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/30">
                  <AvatarImage src={confirmedAppt.leader.image ?? ""} />
                  <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                    {confirmedAppt.leader.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold">{confirmedAppt.leader.name}</p>
                  <p className="text-xs text-indigo-200">
                    {format(new Date(confirmedAppt.slot.startTime), "EEEE d MMMM · HH:mm", { locale: fr })}
                  </p>
                </div>
                {confirmedAppt.leader.phone && (
                  <a href={`tel:${confirmedAppt.leader.phone}`} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden">
            {[
              { key: "mine", label: "Mes RDV" },
              { key: "book", label: "Prendre un RDV" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={cn(
                  "flex-1 py-3 text-xs font-bold transition-all",
                  tab === key ? "bg-indigo-600 text-white" : "text-gray-500"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
          ) : tab === "mine" ? (
            myAppts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <CalendarRange className="h-8 w-8 text-gray-300 mx-auto mb-2" />
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
            /* Prendre un RDV */
            groups.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun créneau disponible pour l'instant</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map(({ date, slots }) => (
                  <div key={date.toISOString()} className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide capitalize px-1">
                      {format(date, "EEEE d MMMM", { locale: fr })}
                    </p>
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setConfirmSlot(slot)}
                        className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left group hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-extrabold text-indigo-700">{format(new Date(slot.startTime), "HH:mm")}</span>
                          <span className="text-[9px] text-indigo-400">30 min</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">Avec {slot.leader.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">
                            {slot.leader.role.toLowerCase().replace("_", " ")}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gray-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 transition-all">
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </>
  );
}
