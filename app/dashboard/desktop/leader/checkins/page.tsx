"use client";

import { useEffect, useState, useRef } from "react";
import { getAllCheckIns, getCheckInDetail, markAsContacted } from "@/app/actions/checkin";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Activity, CheckCircle2, RefreshCcw,
  Filter, UserCheck, AlertCircle,
  Search, X, MessageCircle, ShieldCheck, Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type CheckIn = Awaited<ReturnType<typeof getAllCheckIns>>[0];
type CheckInDetail = Awaited<ReturnType<typeof getCheckInDetail>>;

const STATUS_CONFIG = {
  GREEN:  { label: "OK",                    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-l-emerald-400" },
  ORANGE: { label: "À surveiller",          bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-400",  border: "border-l-orange-400" },
  RED:    { label: "Entretien recommandé",  bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-400",     border: "border-l-red-400" },
};

const ALERT_LABELS: Record<string, string> = {
  anxiety:      "Anxiété / peur",
  sadness:      "Tristesse prolongée",
  irritability: "Irritabilité / colère",
  quit:         "Abandon envisagé",
  loneliness:   "Solitude",
  conflict:     "Conflit relationnel",
  sleep:        "Difficultés de sommeil",
  health:       "Problème de santé",
  finance:      "Pression financière",
};

const SUPPORT_LABELS: Record<string, string> = {
  prayer:    "🙏 Soutien dans la prière",
  interview: "💬 Entretien (30 min)",
  followup:  "📅 Suivi sur 2 semaines",
  share:     "🤝 Juste partager",
};

const SCORE_LABELS: { key: string; label: string; invert?: boolean }[] = [
  { key: "scoreEnergy",      label: "Énergie" },
  { key: "scorePeace",       label: "Paix intérieure" },
  { key: "scoreJoy",         label: "Joie" },
  { key: "scoreClarity",     label: "Clarté spirituelle" },
  { key: "scoreServiceLoad", label: "Charge de service", invert: true },
  { key: "scoreOvergiving",  label: "J'ai trop donné", invert: true },
  { key: "scoreSupportFelt", label: "Soutien ressenti" },
];

const STATUS_FILTERS = [
  { key: "ALL",    label: "Tous" },
  { key: "RED",    label: "🔴 Urgents" },
  { key: "ORANGE", label: "🟠 Attention" },
  { key: "GREEN",  label: "🟢 OK" },
];

const ALERT_TOPIC_FILTERS = [
  { key: "conflict",   label: "Conflit" },
  { key: "quit",       label: "Abandon" },
  { key: "anxiety",    label: "Anxiété" },
  { key: "loneliness", label: "Solitude" },
  { key: "sleep",      label: "Sommeil" },
];

function ScoreRow({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const display = invert ? 10 - value : value;
  const color = display >= 7 ? "bg-emerald-500" : display >= 4 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-44 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${display * 10}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

function DetailPanel({ checkIn, onClose, onContact }: {
  checkIn: NonNullable<CheckInDetail>;
  onClose: () => void;
  onContact: (id: string, note?: string) => Promise<void>;
}) {
  const cfg = STATUS_CONFIG[checkIn.healthStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;
  const [note, setNote] = useState(checkIn.leaderNote ?? "");
  const [saving, setSaving] = useState(false);

  async function handleContact() {
    setSaving(true);
    await onContact(checkIn.id, note);
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-5 py-4",
        checkIn.healthStatus === "RED" ? "bg-gradient-to-r from-red-600 to-rose-600" :
        checkIn.healthStatus === "ORANGE" ? "bg-gradient-to-r from-orange-500 to-amber-500" :
        "bg-gradient-to-r from-emerald-600 to-teal-600"
      )}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onClose} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
          <span className="text-white text-xs font-semibold">Détail du check-in</span>
          <div className="ml-auto flex items-center gap-2">
            {(checkIn.user as any)?.phone && (
              <a
                href={`tel:${(checkIn.user as any).phone}`}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
              >
                <Phone className="h-3.5 w-3.5" /> Appeler
              </a>
            )}
            <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/20 text-white">
              {checkIn.healthScore}/100
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/30">
            <AvatarImage src={checkIn.user?.image ?? ""} />
            <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
              {checkIn.user?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-bold text-sm">{checkIn.user?.name}</p>
            <p className="text-white/70 text-xs capitalize">
              {checkIn.user?.role.toLowerCase().replace("_", " ")} · {format(new Date(checkIn.periodMonth), "MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">État global</p>
          {SCORE_LABELS.map(({ key, label, invert }) => (
            <ScoreRow key={key} label={label} value={(checkIn as any)[key]} invert={invert} />
          ))}
        </div>

        {(checkIn.alerts.length > 0 || checkIn.alertOther) && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Signaux identifiés</p>
            <div className="flex flex-wrap gap-2">
              {checkIn.alerts.map((k) => (
                <span key={k} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-full">
                  {ALERT_LABELS[k] ?? k}
                </span>
              ))}
            </div>
            {checkIn.alertOther && <p className="text-xs text-gray-500 italic">"{checkIn.alertOther}"</p>}
          </div>
        )}

        {checkIn.hadDifficultMoment && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Moment difficile</p>
            {checkIn.difficultMomentText
              ? <p className="text-sm text-gray-700 leading-relaxed">"{checkIn.difficultMomentText}"</p>
              : <p className="text-xs text-gray-400 italic">Signalé sans détail.</p>
            }
          </div>
        )}

        {checkIn.needsScheduleAdjust && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 font-medium">Ajustement de planning demandé</p>
          </div>
        )}

        {checkIn.supportNeeds.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Accompagnement souhaité</p>
            <div className="flex flex-wrap gap-2">
              {checkIn.supportNeeds.map((k) => (
                <span key={k} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full font-medium">
                  {SUPPORT_LABELS[k] ?? k}
                </span>
              ))}
            </div>
          </div>
        )}

        {(checkIn as any).comment && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Commentaire</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">"{(checkIn as any).comment}"</p>
          </div>
        )}

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
          <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500">
            {checkIn.visibility === "PASTOR_ONLY" ? "Visible Pasteur uniquement" : "Visible Admin + Pasteur"}
          </p>
        </div>

        {checkIn.leaderNote && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Note leader</p>
            <p className="text-sm text-indigo-700">"{checkIn.leaderNote}"</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-3">
        {checkIn.isContacted ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700">
              Contacté{checkIn.contactedAt ? ` le ${format(new Date(checkIn.contactedAt), "d MMM yyyy", { locale: fr })}` : ""}
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note interne (optionnelle)…"
              rows={2}
              className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none border border-gray-200 focus:border-indigo-300 transition-colors"
            />
            <button
              onClick={handleContact}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-indigo-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "Enregistrement…" : "Marquer comme contacté"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CheckInRow({ checkIn, isSelected, onOpen }: { checkIn: CheckIn; isSelected: boolean; onOpen: () => void }) {
  const cfg = STATUS_CONFIG[checkIn.healthStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full text-left rounded-xl border-l-4 bg-white transition-all hover:shadow-md",
        cfg.border,
        isSelected ? "ring-2 ring-indigo-200 shadow-md" : ""
      )}
    >
      <div className="p-4 flex items-center gap-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={checkIn.user.image ?? ""} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
            {checkIn.user.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">{checkIn.user.name}</p>
          <p className="text-xs text-gray-400 capitalize">{checkIn.user.role.toLowerCase().replace("_", " ")}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={checkIn.healthStatus === "GREEN" ? "h-full bg-emerald-500 rounded-full" : checkIn.healthStatus === "ORANGE" ? "h-full bg-orange-500 rounded-full" : "h-full bg-red-500 rounded-full"}
                style={{ width: `${checkIn.healthScore}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${cfg.text}`}>{checkIn.healthScore}</span>
          </div>
          {checkIn.alerts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {checkIn.alerts.slice(0, 2).map((a) => (
                <span key={a} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                  {ALERT_LABELS[a] ?? a}
                </span>
              ))}
              {checkIn.alerts.length > 2 && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{checkIn.alerts.length - 2}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          {checkIn.isContacted && (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Contacté
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function DesktopLeaderCheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [alertFilter, setAlertFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<NonNullable<CheckInDetail> | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  async function load(userName?: string) {
    setLoading(true);
    const data = await getAllCheckIns({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      alerts: alertFilter ? [alertFilter] : undefined,
      userName: userName || undefined,
    });
    setCheckIns(data);
    setLoading(false);
  }

  useEffect(() => { load(search); }, [statusFilter, alertFilter, search]);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 400);
  }

  async function openDetail(id: string) {
    const detail = await getCheckInDetail(id);
    if (detail) setSelectedDetail(detail);
  }

  async function handleContact(id: string, note?: string) {
    await markAsContacted(id, note);
    toast.success("Marqué comme contacté");
    await load(search);
    if (selectedDetail?.id === id) {
      const updated = await getCheckInDetail(id);
      if (updated) setSelectedDetail(updated);
    }
  }

  const reds = checkIns.filter((c) => c.healthStatus === "RED").length;
  const oranges = checkIns.filter((c) => c.healthStatus === "ORANGE").length;
  const contacted = checkIns.filter((c) => c.isContacted).length;

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-700 rounded-2xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suivi des Stars</h1>
              <p className="text-sm text-gray-500 capitalize">{format(new Date(), "MMMM yyyy", { locale: fr })}</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: checkIns.length, label: "Check-ins", color: "bg-indigo-50 text-indigo-700" },
            { value: reds,            label: "Urgents",   color: "bg-red-50 text-red-700" },
            { value: oranges,         label: "Attention", color: "bg-orange-50 text-orange-700" },
            { value: contacted,       label: "Contactés", color: "bg-emerald-50 text-emerald-700" },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg font-extrabold`}>
                {value}
              </div>
              <p className="text-sm font-semibold text-gray-600">{label}</p>
            </div>
          ))}
        </div>

        {/* Recherche + filtres */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-64 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un membre…"
              className="w-full pl-9 pr-9 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-300 transition-colors"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  statusFilter === key ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setAlertFilter(null)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                alertFilter === null ? "bg-indigo-100 text-indigo-700" : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300"
              )}
            >
              <Filter className="h-3 w-3 inline mr-1" />Tous
            </button>
            {ALERT_TOPIC_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAlertFilter(alertFilter === key ? null : key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  alertFilter === key ? "bg-orange-100 text-orange-700" : "bg-white text-gray-500 border border-gray-200 hover:border-orange-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("grid gap-6", selectedDetail ? "grid-cols-7" : "grid-cols-1")}>

          {/* Liste */}
          <div className={selectedDetail ? "col-span-4" : "col-span-1"}>
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
                <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
              </div>
            ) : checkIns.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <AlertCircle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {search ? `Aucun résultat pour "${search}"` : "Aucun check-in ce mois-ci"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkIns.map((c) => (
                  <CheckInRow
                    key={c.id}
                    checkIn={c}
                    isSelected={selectedDetail?.id === c.id}
                    onOpen={() => openDetail(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Panneau de détail */}
          {selectedDetail && (
            <div className="col-span-3 sticky top-8 self-start" style={{ maxHeight: "calc(100vh - 8rem)", display: "flex", flexDirection: "column" }}>
              <DetailPanel
                checkIn={selectedDetail}
                onClose={() => setSelectedDetail(null)}
                onContact={handleContact}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
