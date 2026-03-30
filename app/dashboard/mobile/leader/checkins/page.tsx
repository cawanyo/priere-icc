"use client";

import { useEffect, useState, useRef } from "react";
import { getAllCheckIns, getCheckInDetail, markAsContacted } from "@/app/actions/checkin";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Activity, CheckCircle2, RefreshCcw,
  Filter, MessageSquare, UserCheck, AlertCircle,
  Search, X, ChevronLeft, ChevronRight,
  MessageCircle, ShieldCheck, Calendar, Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type CheckIn = Awaited<ReturnType<typeof getAllCheckIns>>[0];
type CheckInDetail = Awaited<ReturnType<typeof getCheckInDetail>>;

const STATUS_CONFIG = {
  GREEN:  { label: "OK",                    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-l-emerald-400", ring: "ring-emerald-400" },
  ORANGE: { label: "À surveiller",          bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-400",  border: "border-l-orange-400",  ring: "ring-orange-400" },
  RED:    { label: "Entretien recommandé",  bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-400",     border: "border-l-red-400",     ring: "ring-red-400" },
};

const ALERT_LABELS: Record<string, string> = {
  anxiety:     "Anxiété / peur",
  sadness:     "Tristesse prolongée",
  irritability:"Irritabilité / colère",
  quit:        "Abandon envisagé",
  loneliness:  "Solitude",
  conflict:    "Conflit relationnel",
  sleep:       "Difficultés de sommeil",
  health:      "Problème de santé",
  finance:     "Pression financière",
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

const ALERT_FILTERS = [
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

function ScoreBar({ score, status }: { score: number; status: string }) {
  const color = status === "GREEN" ? "bg-emerald-500" : status === "ORANGE" ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.text}`}>{score}</span>
    </div>
  );
}

function ScoreRow({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const display = invert ? 10 - value : value;
  const color = display >= 7 ? "bg-emerald-500" : display >= 4 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${display * 10}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

function DetailModal({
  checkIn,
  onClose,
  onContact,
}: {
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f6fb]">
      {/* Barre supérieure */}
      <div className={`bg-gradient-to-r ${checkIn.healthStatus === "RED" ? "from-red-600 to-rose-600" : checkIn.healthStatus === "ORANGE" ? "from-orange-500 to-amber-500" : "from-emerald-600 to-teal-600"} px-4 pt-5 pb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <span className="text-white text-sm font-semibold">Détail du check-in</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white/40">
            <AvatarImage src={checkIn.user?.image ?? ""} />
            <AvatarFallback className="bg-white/20 text-white font-bold">
              {checkIn.user?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-bold text-base">{checkIn.user?.name}</p>
            <p className="text-white/70 text-xs capitalize mt-0.5">
              {checkIn.user?.role.toLowerCase().replace("_", " ")} · {format(new Date(checkIn.periodMonth), "MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {(checkIn.user as any)?.phone ? (
              <a
                href={`tel:${(checkIn.user as any).phone}`}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center"
              >
                <Phone className="h-4 w-4 text-white" />
              </a>
            ) : null}
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white">
              {checkIn.healthScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">

        {/* Scores */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">État global</p>
          {SCORE_LABELS.map(({ key, label, invert }) => (
            <ScoreRow key={key} label={label} value={(checkIn as any)[key]} invert={invert} />
          ))}
        </div>

        {/* Alertes */}
        {(checkIn.alerts.length > 0 || checkIn.alertOther) && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Signaux identifiés</p>
            <div className="flex flex-wrap gap-2">
              {checkIn.alerts.map((k) => (
                <span key={k} className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">
                  {ALERT_LABELS[k] ?? k}
                </span>
              ))}
            </div>
            {checkIn.alertOther && <p className="text-xs text-gray-500 italic">"{checkIn.alertOther}"</p>}
          </div>
        )}

        {/* Moment difficile */}
        {checkIn.hadDifficultMoment && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Moment difficile</p>
            {checkIn.difficultMomentText
              ? <p className="text-sm text-gray-700 leading-relaxed">"{checkIn.difficultMomentText}"</p>
              : <p className="text-xs text-gray-400 italic">Signalé sans détail.</p>
            }
          </div>
        )}

        {/* Ajustement planning */}
        {checkIn.needsScheduleAdjust && (
          <div className="bg-orange-50 rounded-2xl p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="text-xs text-orange-700 font-medium">Ajustement de planning demandé</p>
          </div>
        )}

        {/* Support */}
        {checkIn.supportNeeds.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Accompagnement souhaité</p>
            <div className="flex flex-wrap gap-2">
              {checkIn.supportNeeds.map((k) => (
                <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                  {SUPPORT_LABELS[k] ?? k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Commentaire */}
        {(checkIn as any).comment && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Commentaire</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">"{(checkIn as any).comment}"</p>
          </div>
        )}

        {/* Confidentialité */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
          <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500">
            {checkIn.visibility === "PASTOR_ONLY" ? "Visible Pasteur uniquement" : "Visible Admin + Pasteur"}
          </p>
        </div>

        {/* Note leader */}
        {checkIn.leaderNote && (
          <div className="bg-indigo-50 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Note leader</p>
            <p className="text-sm text-indigo-700">"{checkIn.leaderNote}"</p>
          </div>
        )}



        {/* Footer actions */}
      <div className=" bg-white border-t border-gray-100 px-4 py-4 pb-6 space-y-2">
        {checkIn.isContacted ? (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3">
            <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700">
              Contacté{checkIn.contactedAt ? ` le ${format(new Date(checkIn.contactedAt), "d MMM", { locale: fr })}` : ""}
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note interne (optionnelle)…"
              rows={2}
              className="w-full text-xs text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none border border-gray-200"
            />
            <button
              type="button"
              onClick={handleContact}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-semibold disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "Enregistrement…" : "Marquer comme contacté"}
            </button>
          </>
        )}
      </div>
      </div>

      
    </div>
  );
}

function CheckInCard({ checkIn, onOpen }: { checkIn: CheckIn; onOpen: () => void }) {
  const cfg = STATUS_CONFIG[checkIn.healthStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left bg-white rounded-2xl shadow-sm border-l-4 ${cfg.border} overflow-hidden`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={checkIn.user.image ?? ""} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
              {checkIn.user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{checkIn.user.name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{checkIn.user.role.toLowerCase().replace("_", " ")}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        </div>
        <ScoreBar score={checkIn.healthScore} status={checkIn.healthStatus} />
        {checkIn.alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {checkIn.alerts.slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                {ALERT_LABELS[a] ?? a}
              </span>
            ))}
            {checkIn.alerts.length > 3 && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                +{checkIn.alerts.length - 3}
              </span>
            )}
          </div>
        )}
        {checkIn.isContacted && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
            <UserCheck className="h-3 w-3" /> Contacté
          </div>
        )}
      </div>
    </button>
  );
}

export default function LeaderCheckInsPage() {
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

  return (
    <>
      {selectedDetail && (
        <DetailModal
          checkIn={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onContact={handleContact}
        />
      )}

      <div className="min-h-screen bg-[#f4f6fb] pb-24">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-700 to-violet-700 px-5 pt-6 pb-12 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <Activity className="text-white/20 absolute bottom-3 right-5 h-14 w-14" />
          <h1 className="text-white text-xl font-bold relative">Suivi des Stars</h1>
          <p className="text-indigo-200 text-xs mt-0.5 relative capitalize">
            {format(new Date(), "MMMM yyyy", { locale: fr })}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-5 relative">
            {[
              { value: checkIns.length, label: "Check-ins" },
              { value: reds,            label: "🔴 Urgents" },
              { value: oranges,         label: "🟠 Attention" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/15 rounded-2xl p-3 text-center">
                <div className="text-2xl font-extrabold text-white">{value}</div>
                <div className="text-[10px] text-indigo-200 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 -mt-4 space-y-4">

          {/* Recherche par utilisateur */}
          <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un membre…"
              className="w-full pl-10 pr-10 py-3.5 text-sm text-gray-700 outline-none placeholder:text-gray-300"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filtres statut */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {ALERT_FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={cn(
                  "shrink-0 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all",
                  statusFilter === key ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 shadow-sm"
                )}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtres thème */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setAlertFilter(null)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all",
                alertFilter === null ? "bg-indigo-100 text-indigo-700" : "bg-white text-gray-500 shadow-sm"
              )}>
              <Filter className="h-3 w-3 inline mr-1" />Tous
            </button>
            {ALERT_TOPIC_FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setAlertFilter(alertFilter === key ? null : key)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all",
                  alertFilter === key ? "bg-orange-100 text-orange-700" : "bg-white text-gray-500 shadow-sm"
                )}>
                {label}
              </button>
            ))}
          </div>

          {/* Liste */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
          ) : checkIns.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {search ? `Aucun résultat pour "${search}"` : "Aucun check-in ce mois-ci"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkIns.map((c) => (
                <CheckInCard key={c.id} checkIn={c} onOpen={() => openDetail(c.id)} />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
