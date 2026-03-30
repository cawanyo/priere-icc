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
  ChevronRight, Clock, UserCheck, Phone, X,
  CheckCircle2, AlertCircle, CalendarRange,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Slot = Awaited<ReturnType<typeof getMySlots>>[0];

function timeStr(d: Date) {
  return format(new Date(d), "HH:mm");
}

function DatePicker({
  selected,
  onChange,
}: {
  selected: Date;
  onChange: (d: Date) => void;
}) {
  const [month, setMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = month.getFullYear();
  const mo   = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();

  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(year, mo - 1, 1))} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-800 capitalize">
          {format(month, "MMMM yyyy", { locale: fr })}
        </span>
        <button onClick={() => setMonth(new Date(year, mo + 1, 1))} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["L","M","M","J","V","S","D"].map((d, i) => (
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
                "h-8 w-full rounded-xl text-xs font-semibold transition-all",
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

function AddSlotsPanel({ onDone }: { onDone: () => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [date, setDate] = useState(new Date());
  const [startH, setStartH] = useState("09");
  const [startM, setStartM] = useState("00");
  const [endH,   setEndH]   = useState("11");
  const [endM,   setEndM]   = useState("00");
  const [saving, setSaving] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins  = ["00", "30"];

  async function handleSave() {
    setSaving(true);
    try {
      const start = new Date(date);
      start.setHours(Number(startH), Number(startM), 0, 0);
      const end   = new Date(date);
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
    <div className="space-y-4">
      <DatePicker selected={date} onChange={setDate} />

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plage horaire</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Début</label>
            <div className="flex gap-1 mt-1">
              <select value={startH} onChange={(e) => setStartH(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-xl p-2 border-0 outline-none">
                {hours.map((h) => <option key={h}>{h}</option>)}
              </select>
              <select value={startM} onChange={(e) => setStartM(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-xl p-2 border-0 outline-none">
                {mins.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Fin</label>
            <div className="flex gap-1 mt-1">
              <select value={endH} onChange={(e) => setEndH(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-xl p-2 border-0 outline-none">
                {hours.map((h) => <option key={h}>{h}</option>)}
              </select>
              <select value={endM} onChange={(e) => setEndM(e.target.value)}
                className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-xl p-2 border-0 outline-none">
                {mins.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">
          Les créneaux de 30 min seront générés automatiquement.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-semibold disabled:opacity-60"
      >
        {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
        Générer les créneaux
      </button>
    </div>
  );
}

function CancelModal({
  appointmentId,
  userName,
  onClose,
  onDone,
}: {
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-800">Annuler le RDV</p>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500">RDV avec <strong>{userName}</strong></p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Raison de l'annulation…"
          rows={3}
          className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none border border-gray-200"
        />
        <button
          onClick={handleCancel}
          disabled={saving}
          className="w-full py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Annulation…" : "Confirmer l'annulation"}
        </button>
      </div>
    </div>
  );
}

function SlotCard({ slot, onDelete, onCancelAppt, onRefresh }: {
  slot: Slot;
  onDelete: (id: string) => void;
  onCancelAppt: (apptId: string, userName: string) => void;
  onRefresh: () => void;
}) {
  const appt = slot.appointment;
  const isBooked = !!appt && appt.status === "CONFIRMED";
  const isCancelled = !!appt && appt.status === "CANCELLED";

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm overflow-hidden border-l-4",
      isBooked ? "border-l-indigo-500" : isCancelled ? "border-l-gray-300" : "border-l-emerald-400"
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
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
            <p className="text-[10px] text-gray-400 capitalize">
              {format(new Date(slot.startTime), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <span className={cn(
            "text-[10px] font-semibold px-2.5 py-1 rounded-full",
            isBooked ? "bg-indigo-100 text-indigo-700" :
            isCancelled ? "bg-gray-100 text-gray-500" :
            "bg-emerald-100 text-emerald-700"
          )}>
            {isBooked ? "Réservé" : isCancelled ? "Annulé" : "Libre"}
          </span>
        </div>

        {isBooked && appt?.user && (
          <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={appt.user.image ?? ""} />
              <AvatarFallback className="bg-indigo-200 text-indigo-700 font-bold text-xs">
                {appt.user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">{appt.user.name}</p>
            </div>
            {appt.user.phone && (
              <a href={`tel:${appt.user.phone}`} className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Phone className="h-3.5 w-3.5 text-indigo-500" />
              </a>
            )}
            <button
              onClick={() => onCancelAppt(appt.id, appt.user?.name ?? "")}
              className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm"
            >
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        {isCancelled && appt?.cancelReason && (
          <p className="text-[10px] text-gray-400 italic px-1">"{appt.cancelReason}"</p>
        )}

        {!isBooked && !isCancelled && (
          <button
            onClick={() => onDelete(slot.id)}
            className="flex items-center gap-1.5 text-[11px] text-red-400 font-semibold px-1"
          >
            <Trash2 className="h-3.5 w-3.5" /> Supprimer ce créneau
          </button>
        )}
      </div>
    </div>
  );
}

export default function LeaderRdvPage() {
  const [view, setView] = useState<"list" | "add">("list");
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
  const past     = slots.filter((s) => new Date(s.startTime) <  now);
  const displayed = tab === "upcoming" ? upcoming : slots;

  const bookedCount = upcoming.filter((s) => s.appointment?.status === "CONFIRMED").length;
  const freeCount   = upcoming.filter((s) => !s.appointment).length;

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

      <div className="min-h-screen bg-[#f4f6fb] pb-24">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 px-5 pt-6 pb-12 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <CalendarRange className="text-white/15 absolute bottom-3 right-5 h-14 w-14" />

          {view === "add" ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setView("list")} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <h1 className="text-white text-xl font-bold">Ajouter des créneaux</h1>
            </div>
          ) : (
            <>
              <h1 className="text-white text-xl font-bold relative">Mes Rendez-vous</h1>
              <p className="text-violet-200 text-xs mt-0.5 relative">Gérer mes disponibilités</p>
              <div className="grid grid-cols-3 gap-2 mt-5 relative">
                {[
                  { value: upcoming.length, label: "Créneaux" },
                  { value: bookedCount,     label: "Réservés" },
                  { value: freeCount,       label: "Libres" },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-white/15 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-extrabold text-white">{value}</div>
                    <div className="text-[10px] text-violet-200 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-4 -mt-4 space-y-4">

          {view === "add" ? (
            <AddSlotsPanel onDone={() => { setView("list"); load(); }} />
          ) : (
            <>
              {/* CTA ajout */}
              <button
                onClick={() => setView("add")}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white rounded-2xl text-sm font-semibold shadow"
              >
                <CalendarPlus className="h-4 w-4" /> Ajouter des disponibilités
              </button>

              {/* Tabs */}
              <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden">
                {[
                  { key: "upcoming", label: "À venir" },
                  { key: "all",      label: "Tous" },
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

              {/* Liste */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
                </div>
              ) : displayed.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <CalendarRange className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun créneau pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayed.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onDelete={handleDelete}
                      onCancelAppt={(id, name) => setCancelTarget({ id, name })}
                      onRefresh={load}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
