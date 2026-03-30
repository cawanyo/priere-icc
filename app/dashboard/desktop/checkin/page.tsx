"use client";

import { useEffect, useState } from "react";
import { getMyCheckInByMonth, getMyCheckInHistory } from "@/app/actions/checkin";
import { CheckInForm } from "@/components/checkin/CheckInForm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Activity, CheckCircle2, ChevronLeft, ChevronRight,
  Heart, RefreshCcw, TrendingUp, AlertCircle,
  MessageCircle, ShieldCheck, Calendar, HeartPulse,
} from "lucide-react";

type CheckInData = Awaited<ReturnType<typeof getMyCheckInByMonth>>;
type History = Awaited<ReturnType<typeof getMyCheckInHistory>>;

const STATUS_CONFIG = {
  GREEN:  { label: "Bonne santé",           bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-400", dot: "bg-emerald-400", bar: "bg-emerald-500" },
  ORANGE: { label: "À surveiller",          bg: "bg-orange-100",  text: "text-orange-700",  ring: "ring-orange-400",  dot: "bg-orange-400",  bar: "bg-orange-500"  },
  RED:    { label: "Entretien recommandé",  bg: "bg-red-100",     text: "text-red-700",     ring: "ring-red-400",     dot: "bg-red-400",     bar: "bg-red-500"     },
};

const SUPPORT_LABELS: Record<string, string> = {
  prayer:    "🙏 Soutien dans la prière",
  interview: "💬 Entretien (30 min)",
  followup:  "📅 Suivi sur 2 semaines",
  share:     "🤝 Juste partager",
};

const ALERT_LABELS: Record<string, string> = {
  anxiety:      "Anxiété / peur",
  sadness:      "Tristesse prolongée",
  irritability: "Irritabilité / colère",
  quit:         "Tentation d'abandonner",
  loneliness:   "Solitude",
  conflict:     "Conflit relationnel",
  sleep:        "Difficultés de sommeil",
  health:       "Problème de santé",
  finance:      "Pression financière",
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

function ScoreGauge({ score, status }: { score: number; status: "GREEN" | "ORANGE" | "RED" }) {
  const cfg = STATUS_CONFIG[status];
  const pct = Math.round((score / 100) * 100);
  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-32 h-32 rounded-full ${cfg.bg} ${cfg.ring} ring-4 flex items-center justify-center`}>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={status === "GREEN" ? "#10b981" : status === "ORANGE" ? "#f97316" : "#ef4444"}
            strokeWidth="10"
            strokeDasharray={`${pct * 3.14} 314`}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center z-10">
          <div className={`text-4xl font-extrabold ${cfg.text}`}>{score}</div>
          <div className="text-[10px] text-gray-400 font-medium">/100</div>
        </div>
      </div>
      <span className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    </div>
  );
}

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

function MonthPicker({ year, month, onChange }: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function prev() {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  }
  function next() {
    if (isCurrentMonth) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  }

  const label = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: fr });

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
      <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-indigo-600 transition-colors">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-indigo-400" />
        <span className="text-sm font-bold text-gray-800 capitalize">{label}</span>
      </div>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", isCurrentMonth ? "text-gray-200" : "bg-white shadow-sm text-gray-600 hover:text-indigo-600")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function CheckInReadView({ checkIn }: { checkIn: NonNullable<CheckInData> }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-6">
        <ScoreGauge score={checkIn.healthScore} status={checkIn.healthStatus as "GREEN" | "ORANGE" | "RED"} />
        <div className="flex-1 space-y-4">
          {checkIn.isContacted && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700">
                L'équipe t'a contacté{checkIn.contactedAt ? ` le ${format(new Date(checkIn.contactedAt), "d MMMM yyyy", { locale: fr })}` : ""}.
              </p>
            </div>
          )}
          {checkIn.needsScheduleAdjust && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
              <p className="text-sm text-orange-700 font-medium">Ajustement de planning demandé</p>
            </div>
          )}
          {checkIn.supportNeeds.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Accompagnement souhaité</p>
              <div className="flex flex-wrap gap-2">
                {checkIn.supportNeeds.map((k) => (
                  <span key={k} className="text-xs bg-white text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-medium">
                    {SUPPORT_LABELS[k] ?? k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">État global</p>
        {SCORE_LABELS.map(({ key, label, invert }) => (
          <ScoreRow key={key} label={label} value={(checkIn as any)[key]} invert={invert} />
        ))}
      </div>

      {(checkIn.alerts.length > 0 || checkIn.alertOther) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Signaux identifiés</p>
          <div className="flex flex-wrap gap-2">
            {checkIn.alerts.map((k) => (
              <span key={k} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-full">
                {ALERT_LABELS[k] ?? k}
              </span>
            ))}
          </div>
          {checkIn.alertOther && (
            <p className="text-sm text-gray-500 italic">"{checkIn.alertOther}"</p>
          )}
        </div>
      )}

      {checkIn.hadDifficultMoment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Moment difficile</p>
          {checkIn.difficultMomentText
            ? <p className="text-sm text-gray-700 leading-relaxed">"{checkIn.difficultMomentText}"</p>
            : <p className="text-sm text-gray-400 italic">Signalé sans détail.</p>
          }
        </div>
      )}

      {(checkIn as any).comment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-indigo-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Commentaire</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">"{(checkIn as any).comment}"</p>
        </div>
      )}

      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
        <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500">
          {checkIn.visibility === "PASTOR_ONLY" ? "Visible Pasteur uniquement" : "Visible Admin + Pasteur"}
        </p>
      </div>
    </div>
  );
}

export default function DesktopCheckInPage() {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [current, setCurrent] = useState<CheckInData>();
  const [history, setHistory] = useState<History>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<{ score: number; status: string } | null>(null);

  async function loadMonth(y: number, m: number) {
    setLoading(true);
    const c = await getMyCheckInByMonth(y, m);
    setCurrent(c);
    setLoading(false);
  }

  async function loadHistory() {
    const { getMyCheckInHistory } = await import("@/app/actions/checkin");
    const h = await getMyCheckInHistory();
    setHistory(h);
  }

  useEffect(() => {
    loadMonth(selYear, selMonth);
    loadHistory();
  }, []);

  function handleMonthChange(y: number, m: number) {
    setSelYear(y);
    setSelMonth(m);
    setShowForm(false);
    setResult(null);
    loadMonth(y, m);
  }

  function handleDone(score: number, status: string) {
    setResult({ score, status });
    setShowForm(false);
    loadMonth(selYear, selMonth);
    loadHistory();
  }

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth() + 1;
  const monthLabel = format(new Date(selYear, selMonth - 1, 1), "MMMM yyyy", { locale: fr });

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Check-in</h1>
            <p className="text-sm text-gray-500">Suivi de ton bien-être spirituel</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* Colonne gauche — historique */}
          <div className="col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sélection du mois</p>
              <MonthPicker year={selYear} month={selMonth} onChange={handleMonthChange} />
            </div>

            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Historique</p>
                </div>
                <div className="space-y-2">
                  {history.map((h) => {
                    const cfg = STATUS_CONFIG[h.healthStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;
                    const isSelected = selYear === new Date(h.periodMonth).getFullYear() && selMonth === new Date(h.periodMonth).getMonth() + 1;
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleMonthChange(new Date(h.periodMonth).getFullYear(), new Date(h.periodMonth).getMonth() + 1)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all",
                          isSelected ? "bg-indigo-50 ring-2 ring-indigo-200" : "hover:bg-gray-50"
                        )}
                      >
                        <div className={`w-1.5 h-8 rounded-full ${cfg.bar}`} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 capitalize">
                            {format(new Date(h.periodMonth), "MMMM yyyy", { locale: fr })}
                          </p>
                          <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                        </div>
                        <span className={`text-sm font-bold ${cfg.text}`}>{h.healthScore}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — contenu principal */}
          <div className="col-span-8">
            {result && (
              <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
                <div className={`w-16 h-16 ${STATUS_CONFIG[result.status as keyof typeof STATUS_CONFIG]?.bg} rounded-2xl flex items-center justify-center`}>
                  <CheckCircle2 className={`h-8 w-8 ${STATUS_CONFIG[result.status as keyof typeof STATUS_CONFIG]?.text}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Merci pour ton partage</h2>
                  <p className="text-sm text-gray-500">On t'accompagne dans ce chemin.</p>
                </div>
                <div className="ml-auto">
                  <button onClick={() => setResult(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">Fermer</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-24">
                <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
              </div>
            ) : showForm ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-800 capitalize">Check-in de {monthLabel}</h2>
                    <p className="text-xs text-gray-400">2 minutes pour partager comment tu vas.</p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Annuler
                  </button>
                </div>
                <CheckInForm onDone={handleDone} />
              </div>
            ) : current ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-800 capitalize">Check-in — {monthLabel}</h2>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_CONFIG[current.healthStatus as keyof typeof STATUS_CONFIG]?.bg} ${STATUS_CONFIG[current.healthStatus as keyof typeof STATUS_CONFIG]?.text}`}>
                    {STATUS_CONFIG[current.healthStatus as keyof typeof STATUS_CONFIG]?.label}
                  </span>
                </div>
                <CheckInReadView checkIn={current} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center space-y-5">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto">
                  <Heart className="h-10 w-10 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 capitalize">
                    {isCurrentMonth ? `Check-in de ${monthLabel}` : `Aucun check-in — ${monthLabel}`}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
                    {isCurrentMonth
                      ? "2 minutes pour partager comment tu vas. Confidentiel, bienveillant, actionnable."
                      : "Tu n'as pas rempli de check-in pour ce mois."}
                  </p>
                </div>
                {isCurrentMonth && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Commencer mon check-in <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
