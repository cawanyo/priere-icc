"use client";

import { useEffect, useState } from "react";
import { getMyCheckInByMonth, getMyCheckInHistory } from "@/app/actions/checkin";
import { CheckInForm } from "@/components/checkin/CheckInForm";
import { format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Activity, CheckCircle2, ChevronLeft, ChevronRight,
  Heart, RefreshCcw, TrendingUp, AlertCircle,
  Zap, Eye, Briefcase, Sun, MessageCircle,
  ShieldCheck, Calendar,
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
  anxiety:     "Anxiété / peur",
  sadness:     "Tristesse prolongée",
  irritability:"Irritabilité / colère",
  quit:        "Tentation d'abandonner",
  loneliness:  "Solitude",
  conflict:    "Conflit relationnel",
  sleep:       "Difficultés de sommeil",
  health:      "Problème de santé",
  finance:     "Pression financière",
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
      <div className={`relative w-28 h-28 rounded-full ${cfg.bg} ${cfg.ring} ring-4 flex items-center justify-center`}>
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
          <div className={`text-3xl font-extrabold ${cfg.text}`}>{score}</div>
          <div className="text-[9px] text-gray-400 font-medium">/100</div>
        </div>
      </div>
      <span className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
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
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${display * 10}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

function MonthPicker({
  year, month, onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
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
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3">
      <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-indigo-400" />
        <span className="text-sm font-bold text-gray-800 capitalize">{label}</span>
      </div>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className={cn("w-9 h-9 flex items-center justify-center rounded-xl", isCurrentMonth ? "text-gray-200" : "bg-gray-100 text-gray-600")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function CheckInReadView({ checkIn }: { checkIn: NonNullable<CheckInData> }) {
  const cfg = STATUS_CONFIG[checkIn.healthStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="bg-white rounded-3xl shadow-sm p-5 flex flex-col items-center gap-3">
        <ScoreGauge score={checkIn.healthScore} status={checkIn.healthStatus as "GREEN" | "ORANGE" | "RED"} />
        {checkIn.isContacted && (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 w-full">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700">
              L'équipe t'a contacté{checkIn.contactedAt ? ` le ${format(new Date(checkIn.contactedAt), "d MMM", { locale: fr })}` : ""}.
            </p>
          </div>
        )}
      </div>

      {/* État global — scores */}
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
          {checkIn.alertOther && (
            <p className="text-xs text-gray-500 italic mt-1">"{checkIn.alertOther}"</p>
          )}
        </div>
      )}

      {/* Moment difficile */}
      {checkIn.hadDifficultMoment && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Moment difficile</p>
          {checkIn.difficultMomentText ? (
            <p className="text-sm text-gray-700 leading-relaxed">"{checkIn.difficultMomentText}"</p>
          ) : (
            <p className="text-xs text-gray-400 italic">Oui, mais sans détail ajouté.</p>
          )}
        </div>
      )}

      {/* Ajustement planning */}
      {checkIn.needsScheduleAdjust && (
        <div className="bg-orange-50 rounded-2xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
          <p className="text-xs text-orange-700 font-medium">Ajustement de planning demandé</p>
        </div>
      )}

      {/* Demandes d'accompagnement */}
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
    </div>
  );
}

export default function MobileCheckInPage() {
  const now = new Date();
  const [view, setView] = useState<"dashboard" | "form" | "result">("dashboard");
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [current, setCurrent] = useState<CheckInData>();
  const [history, setHistory] = useState<History>([]);
  const [result, setResult] = useState<{ score: number; status: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
    loadMonth(y, m);
  }

  function handleDone(score: number, status: string) {
    setResult({ score, status });
    setView("result");
    loadMonth(selYear, selMonth);
    loadHistory();
  }

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth() + 1;
  const monthLabel = format(new Date(selYear, selMonth - 1, 1), "MMMM yyyy", { locale: fr });

  if (loading && view === "dashboard") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCcw className="h-6 w-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // ── RÉSULTAT APRÈS SOUMISSION ──
  if (view === "result" && result) {
    const cfg = STATUS_CONFIG[result.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className={`w-20 h-20 ${cfg.bg} rounded-full flex items-center justify-center mb-4`}>
          <CheckCircle2 className={`h-10 w-10 ${cfg.text}`} />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Merci pour ton partage</h1>
        <p className="text-sm text-gray-500 mb-6">On t'accompagne dans ce chemin.</p>
        <ScoreGauge score={result.score} status={result.status as "GREEN" | "ORANGE" | "RED"} />
        {result.status === "RED" && (
          <div className="mt-6 bg-red-50 rounded-2xl p-4 text-sm text-red-700 text-left w-full max-w-xs">
            <AlertCircle className="h-4 w-4 inline mr-1.5" />
            Un entretien t'est recommandé. L'équipe te contactera prochainement.
          </div>
        )}
        {result.status === "ORANGE" && (
          <div className="mt-6 bg-orange-50 rounded-2xl p-4 text-sm text-orange-700 text-left w-full max-w-xs">
            <Heart className="h-4 w-4 inline mr-1.5" />
            L'équipe sera attentive à toi ce mois-ci.
          </div>
        )}
        <button
          onClick={() => setView("dashboard")}
          className="mt-8 w-full max-w-xs bg-indigo-600 text-white rounded-2xl py-3 text-sm font-semibold"
        >
          Voir mon tableau de bord
        </button>
      </div>
    );
  }

  // ── FORMULAIRE ──
  if (view === "form") {
    return (
      <div className="min-h-screen bg-[#f4f6fb] pb-24">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 pt-6 pb-8">
          <button onClick={() => setView("dashboard")} className="text-indigo-200 text-xs flex items-center gap-1 mb-3">
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold">Mon Check-in</h1>
          <p className="text-indigo-200 text-xs capitalize mt-0.5">{monthLabel}</p>
        </div>
        <div className="px-4 -mt-2 pt-4 space-y-4">
          <CheckInForm onDone={handleDone} />
        </div>
      </div>
    );
  }

  // ── DASHBOARD CHECK-IN ──
  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-24">

      {/* Header */}
      <div className=" bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-5 pt-6 pb-12 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute top-14 -right-4 w-20 h-20 bg-white/10 rounded-full" />
        <Activity className="text-white/20 absolute bottom-4 right-6 h-16 w-16" />
        <h1 className="text-white text-xl font-bold relative">Mon Check-in</h1>
        <p className="text-indigo-200 text-xs capitalize mt-0.5 relative">
          Suivi de ton bien-être spirituel
        </p>
      </div>

      <div className="px-4 -mt-6 space-y-4">

        {/* Sélecteur de mois */}
        <MonthPicker year={selYear} month={selMonth} onChange={handleMonthChange} />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCcw className="h-5 w-5 text-indigo-400 animate-spin" />
          </div>
        ) : current ? (
          /* Vue lecture seule */
          <CheckInReadView checkIn={current} />
        ) : (
          /* Pas de check-in pour ce mois */
          <div className="bg-white rounded-3xl shadow-sm p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 capitalize">
                {isCurrentMonth ? `Check-in de ${monthLabel}` : `Aucun check-in — ${monthLabel}`}
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isCurrentMonth
                  ? "2 minutes pour partager comment tu vas. Confidentiel, bienveillant, actionnable."
                  : "Tu n'as pas rempli de check-in pour ce mois."}
              </p>
            </div>
            {isCurrentMonth && (
              <button
                onClick={() => setView("form")}
                className="w-full bg-indigo-600 text-white rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                Commencer mon check-in <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Historique des 6 derniers mois */}
        {history.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-700">Historique</h2>
            </div>
            {history.map((h) => {
              const cfg = STATUS_CONFIG[h.healthStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.GREEN;
              const isSelected = selYear === new Date(h.periodMonth).getFullYear() && selMonth === new Date(h.periodMonth).getMonth() + 1;
              return (
                <button
                  key={h.id}
                  onClick={() => handleMonthChange(new Date(h.periodMonth).getFullYear(), new Date(h.periodMonth).getMonth() + 1)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-2xl p-3 shadow-sm text-left transition-all",
                    isSelected ? "bg-indigo-50 ring-2 ring-indigo-300" : "bg-white"
                  )}
                >
                  <div className={`w-2 h-8 rounded-full ${cfg.bar}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 capitalize">
                      {format(new Date(h.periodMonth), "MMMM yyyy", { locale: fr })}
                    </p>
                    <p className={`text-[10px] font-medium ${cfg.text}`}>{cfg.label}</p>
                  </div>
                  <span className={`text-sm font-bold ${cfg.text}`}>{h.healthScore}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
