"use client";

import { useState } from "react";
import { submitCheckIn } from "@/app/actions/checkin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Zap, Heart, Sun, Eye, Briefcase,
  AlertTriangle, Wrench, HandHeart,
  CheckCircle2, ChevronRight, ChevronLeft,
  Loader2, ShieldCheck, MessageCircle
} from "lucide-react";

const BLOC1_QUESTIONS = [
  { key: "scoreEnergy",      label: "Énergie",           sub: "Épuisé(e) → En forme",      icon: Zap,      color: "text-yellow-500", bg: "bg-yellow-50" },
  { key: "scorePeace",       label: "Paix intérieure",   sub: "Agitation → Paix profonde",  icon: Heart,    color: "text-rose-500",   bg: "bg-rose-50"   },
  { key: "scoreJoy",         label: "Joie",              sub: "Éteinte → Stable et vive",   icon: Sun,      color: "text-orange-500", bg: "bg-orange-50" },
  { key: "scoreClarity",     label: "Clarté spirituelle",sub: "Brouillard → Bien aligné(e)",icon: Eye,      color: "text-sky-500",    bg: "bg-sky-50"    },
  { key: "scoreServiceLoad", label: "Charge de service", sub: "Légère → Trop lourde",       icon: Briefcase,color: "text-indigo-500", bg: "bg-indigo-50" },
] as const;

const ALERTS = [
  { key: "anxiety",       label: "Anxiété / peur" },
  { key: "sadness",       label: "Tristesse prolongée" },
  { key: "irritability",  label: "Irritabilité / colère" },
  { key: "quit",          label: "Tentation d'abandonner le service" },
  { key: "loneliness",    label: "Solitude" },
  { key: "conflict",      label: "Conflit relationnel (église / équipe / famille)" },
  { key: "sleep",         label: "Difficultés de sommeil" },
  { key: "health",        label: "Problème de santé physique" },
  { key: "finance",       label: "Pression financière" },
];

const SUPPORT_NEEDS = [
  { key: "prayer",    label: "Soutien dans la prière",  icon: "🙏" },
  { key: "interview", label: "Un entretien (30 min)",   icon: "💬" },
  { key: "followup",  label: "Un suivi sur 2 semaines", icon: "📅" },
  { key: "share",     label: "Juste partager (confidentiel)", icon: "🤝" },
];

const TOTAL_BLOCS = 5;

function ScoreSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600 h-2 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className={cn("w-4 text-center", value === i && "text-indigo-600 font-bold")}>{i}</span>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "GREEN" | "ORANGE" | "RED" }) {
  const map = {
    GREEN:  { label: "Bonne santé",      bg: "bg-emerald-100 text-emerald-700" },
    ORANGE: { label: "À surveiller",     bg: "bg-orange-100 text-orange-700" },
    RED:    { label: "Entretien recommandé", bg: "bg-red-100 text-red-700" },
  };
  const { label, bg } = map[status];
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${bg}`}>{label}</span>;
}

export function CheckInForm({ onDone }: { onDone: (score: number, status: string) => void }) {
  const [bloc, setBloc] = useState(1);
  const [loading, setLoading] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>({
    scoreEnergy: 5, scorePeace: 5, scoreJoy: 5, scoreClarity: 5, scoreServiceLoad: 5,
    scoreOvergiving: 5, scoreSupportFelt: 5,
  });
  const [alerts, setAlerts] = useState<string[]>([]);
  const [alertOther, setAlertOther] = useState("");
  const [hadDifficultMoment, setHadDifficultMoment] = useState(false);
  const [difficultMomentText, setDifficultMomentText] = useState("");
  const [needsScheduleAdjust, setNeedsScheduleAdjust] = useState(false);
  const [supportNeeds, setSupportNeeds] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [visibility, setVisibility] = useState("TEAM");

  function toggleAlert(key: string) {
    setAlerts((prev) => prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]);
  }
  function toggleSupport(key: string) {
    setSupportNeeds((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
  }

  async function handleSubmit() {
    if (!consentGiven) { toast.error("Merci d'accepter le consentement."); return; }
    setLoading(true);
    try {
      const result = await submitCheckIn({
        scoreEnergy: scores.scoreEnergy,
        scorePeace: scores.scorePeace,
        scoreJoy: scores.scoreJoy,
        scoreClarity: scores.scoreClarity,
        scoreServiceLoad: scores.scoreServiceLoad,
        alerts,
        alertOther: alertOther || undefined,
        hadDifficultMoment,
        difficultMomentText: difficultMomentText || undefined,
        scoreOvergiving: scores.scoreOvergiving,
        scoreSupportFelt: scores.scoreSupportFelt,
        needsScheduleAdjust,
        supportNeeds,
        consentGiven,
        visibility,
        comment: comment || undefined,
      });
      onDone(result.score, result.status);
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_BLOCS }, (_, i) => (
          <div key={i} className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            i < bloc ? "bg-indigo-500" : "bg-gray-200"
          )} />
        ))}
      </div>

      {/* ── BLOC 1 : État global ── */}
      {bloc === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-800">État global</h2>
            <p className="text-xs text-gray-500 mt-0.5">Évalue chaque dimension de 0 à 10</p>
          </div>
          {BLOC1_QUESTIONS.map(({ key, label, sub, icon: Icon, color, bg }) => (
            <div key={key} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
                <span className="ml-auto text-xl font-bold text-indigo-600">{scores[key]}</span>
              </div>
              <ScoreSlider value={scores[key]} onChange={(v) => setScores((s) => ({ ...s, [key]: v }))} />
            </div>
          ))}
        </div>
      )}

      {/* ── BLOC 2 : Signaux d'alerte ── */}
      {bloc === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Signaux d'alerte</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ces derniers jours, j'ai ressenti…</p>
          </div>
          <div className="space-y-2">
            {ALERTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleAlert(key)}
                className={cn(
                  "w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm text-left transition-all",
                  alerts.includes(key) && "ring-2 ring-indigo-400 bg-indigo-50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  alerts.includes(key) ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                )}>
                  {alerts.includes(key) && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Autre (préciser)</label>
            <textarea
              value={alertOther}
              onChange={(e) => setAlertOther(e.target.value)}
              placeholder="Si tu veux ajouter quelque chose…"
              rows={2}
              className="mt-2 w-full text-sm text-gray-700 bg-transparent outline-none resize-none placeholder:text-gray-300"
            />
          </div>
        </div>
      )}

      {/* ── BLOC 3 : Service ── */}
      {bloc === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Diagnostic ministère</h2>
            <p className="text-xs text-gray-500 mt-0.5">Comment s'est passé ton service ce mois-ci ?</p>
          </div>

          {/* Moment difficile */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-gray-800">As-tu eu un moment difficile dans ton service ?</p>
            <div className="flex gap-3">
              {[{ v: true, l: "Oui" }, { v: false, l: "Non" }].map(({ v, l }) => (
                <button key={l} type="button" onClick={() => setHadDifficultMoment(v)}
                  className={cn("flex-1 py-2 rounded-xl text-sm font-semibold transition-all border",
                    hadDifficultMoment === v ? "bg-indigo-500 text-white border-indigo-500" : "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                  {l}
                </button>
              ))}
            </div>
            {hadDifficultMoment && (
              <textarea
                value={difficultMomentText}
                onChange={(e) => setDifficultMomentText(e.target.value)}
                placeholder="Décris brièvement ce moment…"
                rows={3}
                className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none placeholder:text-gray-300"
              />
            )}
          </div>

          {/* J'ai trop donné */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">J'ai l'impression d'avoir trop donné</p>
              <span className="text-xl font-bold text-indigo-600">{scores.scoreOvergiving}</span>
            </div>
            <ScoreSlider value={scores.scoreOvergiving} onChange={(v) => setScores((s) => ({ ...s, scoreOvergiving: v }))} />
          </div>

          {/* Soutien ressenti */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Je me sens soutenu(e) par l'équipe</p>
              <span className="text-xl font-bold text-indigo-600">{scores.scoreSupportFelt}</span>
            </div>
            <ScoreSlider value={scores.scoreSupportFelt} onChange={(v) => setScores((s) => ({ ...s, scoreSupportFelt: v }))} />
          </div>

          {/* Ajustement planning */}
          <button type="button" onClick={() => setNeedsScheduleAdjust(!needsScheduleAdjust)}
            className={cn("w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm text-left transition-all",
              needsScheduleAdjust && "ring-2 ring-indigo-400 bg-indigo-50"
            )}>
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              needsScheduleAdjust ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
            )}>
              {needsScheduleAdjust && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm text-gray-700">J'ai besoin d'un ajustement de planning</span>
          </button>
        </div>
      )}

      {/* ── BLOC 4 : Accompagnement ── */}
      {bloc === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Besoin d'accompagnement</h2>
            <p className="text-xs text-gray-500 mt-0.5">Souhaites-tu… (plusieurs choix possibles)</p>
          </div>

          <div className="space-y-2">
            {SUPPORT_NEEDS.map(({ key, label, icon }) => (
              <button key={key} type="button" onClick={() => toggleSupport(key)}
                className={cn("w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm text-left transition-all",
                  supportNeeds.includes(key) && "ring-2 ring-indigo-400 bg-indigo-50"
                )}>
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                {supportNeeds.includes(key) && <CheckCircle2 className="h-4 w-4 text-indigo-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── BLOC 5 : Commentaire + Consentement ── */}
      {bloc === 5 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Commentaire libre</h2>
            <p className="text-xs text-gray-500 mt-0.5">Un mot, une pensée, quelque chose à ajouter ?</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mon commentaire</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partage librement ce que tu voudrais dire à l'équipe…"
              rows={4}
              className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Confidentialité */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" /> Confidentialité
            </p>
            {[
              { v: "TEAM", l: "Visible Admin + Pasteur" },
              { v: "PASTOR_ONLY", l: "Visible Pasteur uniquement" },
            ].map(({ v, l }) => (
              <button key={v} type="button" onClick={() => setVisibility(v)}
                className={cn("w-full flex items-center gap-3 rounded-xl p-3 text-sm text-left transition-all border",
                  visibility === v ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold" : "bg-gray-50 border-gray-200 text-gray-500"
                )}>
                <div className={cn("w-4 h-4 rounded-full border-2 shrink-0",
                  visibility === v ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                )} />
                {l}
              </button>
            ))}
          </div>

          {/* Consentement */}
          <button type="button" onClick={() => setConsentGiven(!consentGiven)}
            className={cn("w-full flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm text-left transition-all",
              consentGiven && "ring-2 ring-emerald-400 bg-emerald-50"
            )}>
            <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
              consentGiven ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
            )}>
              {consentGiven && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            <span className="text-xs text-gray-600 leading-relaxed">
              J'accepte que mes réponses soient partagées avec l'équipe d'encadrement selon le niveau de confidentialité choisi.
            </span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {bloc > 1 && (
          <button type="button" onClick={() => setBloc(bloc - 1)}
            className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold">
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>
        )}
        {bloc < TOTAL_BLOCS ? (
          <button type="button" onClick={() => setBloc(bloc + 1)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-semibold">
            Suivant <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-semibold disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Soumettre mon check-in
          </button>
        )}
      </div>
    </div>
  );
}
