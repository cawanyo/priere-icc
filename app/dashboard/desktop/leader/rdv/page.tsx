"use client";

import { useEffect, useState } from "react";
import {
  addAvailabilityRange,
  deleteSlot,
  getMySlots,
  cancelAppointmentLeader,
} from "@/app/actions/appointment";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  CalendarPlus, Trash2, RefreshCcw, ChevronLeft,
  ChevronRight, Clock, Phone, X,
  CheckCircle2, AlertCircle, CalendarRange,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Slot = Awaited<ReturnType<typeof getMySlots>>[0];

function timeStr(d: Date) {
  return format(new Date(d), "HH:mm");
}

function DatePicker({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const [month, setMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(year, mo - 1, 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-indigo-50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-800 capitalize">
          {format(month, "MMMM yyyy", { locale: fr })}
        </span>
        <button onClick={() => setMonth(new Date(year, mo + 1, 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-indigo-50 transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-[10px] text-gray-400 font-semibold py-1">{d}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(year, mo, i + 1);
          const isPast = d < today;
          const isSel = isSameDay(d, selected);
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onChange(d)}
              className={cn(
                "h-8 w-full rounded-lg text-xs font-semibold transition-all",
                isSel ? "bg-indigo-600 text-white" :
                isPast ? "text-gray-300 cursor-not-allowed" :
                "text-gray-700 hover:bg-indigo-50"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddSlotsPanel({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [date, setDate] = useState(new Date());
  const [startH, setStartH] = useState("09");
  const [startM, setStartM] = useState("00");
  const [endH, setEndH] = useState("11");
  const [endM, setEndM] = useState("00");
  const [saving, setSaving] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins = ["00", "30"];

  async function handleSave() {
    setSaving(true);
    try {
      const start = new Date(date);
      start.setHours(Number(startH), Number(startM), 0, 0);
      const end = new Date(date);
      end.setHours(Number(endH), Number(endM), 0, 0);
      if (end <= start) { toast.error("L'heure de fin doit être après le début."); setSaving(false); return; }
      const { count } = await addAvailabilityRange(start.toISOString(), end.toISOString());
      toast.success(`${count} créneau${count > 1 ? "x" : ""} ajouté${count > 1 ? "s" : ""}`);
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-800">Ajouter des disponibilités</h3>
        <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <DatePicker selected={date} onChange={setDate} />

      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Plage horaire</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase block mb-1.5">Début</label>
            <div className="flex gap-2">
              <select value={startH} onChange={(e) => setStartH(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none">
                {hours.map((h) => <option key={h}>{h}</option>)}
              </select>
              <select value={startM} onChange={(e) => setStartM(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none">
                {mins.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold uppercase block mb-1.5">Fin</label>
            <div className="flex gap-2">
              <select value={endH} onChange={(e) => setEndH(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none">
                {hours.map((h) => <option key={h}>{h}</option>)}
              </select>
              <select value={endM} onChange={(e) => setEndM(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none">
                {mins.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">Les créneaux de 30 min seront générés automatiquement.</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-indigo-700 transition-colors"
      >
        {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
        Générer les créneaux
      </button>
    </div>
  );
}

function CancelModal({ appointmentId, userName, onClose, onDone }: {
  appointmentId: string;
  userName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCancel() {
    if (!reason.trim()) { toast.error("Merci d'indiquer une raison."); return; }
    setSaving(true);
    try {
      await cancelAppointmentLeader(appointmentId, reason);
      toast.success("RDV annulé");
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-800">Annuler le RDV</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500">RDV avec <strong>{userName}</strong></p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Raison de l'annulation…"
          rows={3}
          className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none border border-gray-200 focus:border-red-300 transition-colors"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            Fermer
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-red-600 transition-colors"
          >
            {saving ? "Annulation…" : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotCard({ slot, onDelete, onCancelAppt }: {
  slot: Slot;
  onDelete: (id: string) => void;
  onCancelAppt: (apptId: string, userName: string) => void;
}) {
  const appt = slot.appointment;
  const isBooked = !!appt && appt.status === "CONFIRMED";
  const isCancelled = !!appt && appt.status === "CANCELLED";

  return (
    <div className={cn(
      "bg-white rounded-xl border-l-4 overflow-hidden",
      isBooked ? "border-l-indigo-500" : isCancelled ? "border-l-gray-200" : "border-l-emerald-400"
    )}>
      <div className="p-4 flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isBooked ? "bg-indigo-100" : isCancelled ? "bg-gray-100" : "bg-emerald-100"
        )}>
          <Clock className={cn("h-5 w-5", isBooked ? "text-indigo-600" : isCancelled ? "text-gray-400" : "text-emerald-600")} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">
            {timeStr(slot.startTime)} – {timeStr(slot.endTime)}
          </p>
          <p className="text-xs text-gray-400 capitalize">
            {format(new Date(slot.startTime), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          isBooked ? "bg-indigo-100 text-indigo-700" :
          isCancelled ? "bg-gray-100 text-gray-500" :
          "bg-emerald-100 text-emerald-700"
        )}>
          {isBooked ? "Réservé" : isCancelled ? "Annulé" : "Libre"}
        </span>
        {isBooked && appt?.user && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={appt.user.image ?? ""} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                {appt.user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-semibold text-gray-700">{appt.user.name}</p>
            {appt.user.phone && (
              <a href={`tel:${appt.user.phone}`} className="w-8 h-8 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors">
                <Phone className="h-3.5 w-3.5 text-indigo-500" />
              </a>
            )}
            <button
              onClick={() => onCancelAppt(appt.id, appt.user?.name ?? "")}
              className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}
        {isCancelled && appt?.cancelReason && (
          <p className="text-xs text-gray-400 italic max-w-32 truncate">"{appt.cancelReason}"</p>
        )}
        {!isBooked && !isCancelled && (
          <button
            onClick={() => onDelete(slot.id)}
            className="flex items-center gap-1.5 text-xs text-red-400 font-semibold hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

export default function DesktopLeaderRdvPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; name: string } | null>(null);
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");

  async function load() {
    setLoading(true);
    const data = await getMySlots();
    setSlots(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(slotId: string) {
    try {
      await deleteSlot(slotId);
      toast.success("Créneau supprimé");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    }
  }

  const now = new Date();
  const upcoming = slots.filter((s) => new Date(s.startTime) >= now);
  const displayed = tab === "upcoming" ? upcoming : slots;

  const bookedCount = upcoming.filter((s) => s.appointment?.status === "CONFIRMED").length;
  const freeCount = upcoming.filter((s) => !s.appointment).length;

  return (
    <>
      {cancelTarget && (
        <CancelModal
          appointmentId={cancelTarget.id}
          userName={cancelTarget.name}
          onClose={() => setCancelTarget(null)}
          onDone={load}
        />
      )}

      <div className="min-h-screen bg-[#f4f6fb] p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center">
                <CalendarRange className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes Rendez-vous</h1>
                <p className="text-sm text-gray-500">Gérer mes disponibilités</p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                showAdd ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              )}
            >
              {showAdd ? <X className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {showAdd ? "Annuler" : "Ajouter des disponibilités"}
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: upcoming.length, label: "Créneaux à venir", color: "bg-violet-50 text-violet-700" },
              { value: bookedCount,     label: "RDV confirmés",    color: "bg-indigo-50 text-indigo-700" },
              { value: freeCount,       label: "Créneaux libres",  color: "bg-emerald-50 text-emerald-700" },
            ].map(({ value, label, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg font-extrabold`}>
                  {value}
                </div>
                <p className="text-sm font-semibold text-gray-600">{label}</p>
              </div>
            ))}
          </div>

          <div className={cn("grid gap-6", showAdd ? "grid-cols-12" : "grid-cols-1")}>

            {/* Panneau ajout */}
            {showAdd && (
              <div className="col-span-4">
                <AddSlotsPanel
                  onDone={() => { setShowAdd(false); load(); }}
                  onCancel={() => setShowAdd(false)}
                />
              </div>
            )}

            {/* Liste créneaux */}
            <div className={showAdd ? "col-span-8" : "col-span-1"}>
              <div className="space-y-4">
                <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {[
                    { key: "upcoming", label: "À venir" },
                    { key: "all",      label: "Tous" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key as any)}
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
                ) : displayed.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <CalendarRange className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Aucun créneau pour le moment</p>
                    <button
                      onClick={() => setShowAdd(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                    >
                      <CalendarPlus className="h-4 w-4" /> Ajouter des disponibilités
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayed.map((slot) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        onDelete={handleDelete}
                        onCancelAppt={(id, name) => setCancelTarget({ id, name })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
