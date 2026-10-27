import { Link } from "react-router-dom";
import { Trash2, RotateCcw, History as HistoryIcon, Info } from "lucide-react";
import { CLASSES, imageSrc, type Category, type Prediction } from "../lib/api";

export const CAT_COLORS: Record<Category, string> = {
  plastic: "#f59e0b",
  paper: "#3b82f6",
  glass: "#06b6d4",
  metal: "#64748b",
  organic: "#10b981",
  trash: "#ef4444",
};

export const CAT_LABELS: Record<Category, string> = {
  plastic: "Plastic",
  paper: "Paper & Cardboard",
  glass: "Glass",
  metal: "Metal",
  organic: "Organic",
  trash: "Trash",
};

interface Props {
  result: Prediction;
  onAnother: () => void;
}

export default function ResultCard({ result, onAnother }: Props) {
  const color = CAT_COLORS[result.category];
  const rec = result.recommendation;
  const sorted = [...CLASSES].sort((a, b) => result.probabilities[b] - result.probabilities[a]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="h-1.5" style={{ background: color }} />
      <div className="grid gap-6 p-6 md:grid-cols-[200px_1fr]">
        <img
          src={imageSrc(result.image_url)}
          alt="Classified waste"
          className="h-48 w-full rounded-xl border object-cover md:h-full"
        />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Predicted category</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h3 className="text-3xl font-bold" style={{ color }}>
              {CAT_LABELS[result.category]}
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
              {(result.confidence * 100).toFixed(1)}% confidence
            </span>
          </div>
          <p className="mt-3 text-slate-600">{rec.description}</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-900">
            <Trash2 size={18} />
            <div>
              <div className="text-xs font-semibold uppercase">Recommended bin</div>
              <div className="font-semibold">{rec.bin}</div>
            </div>
            <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold">{rec.recyclable}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-t p-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-semibold">Disposal & handling tips</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            {rec.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 flex gap-1.5 text-xs text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" /> {rec.note}
          </p>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">All class probabilities</h4>
          <div className="space-y-2">
            {sorted.map((c) => {
              const pct = result.probabilities[c] * 100;
              return (
                <div key={c}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span>{CAT_LABELS[c]}</span>
                    <span className="font-semibold">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: CAT_COLORS[c] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t bg-slate-50 p-4">
        <button
          onClick={onAnother}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <RotateCcw size={16} /> Classify another image
        </button>
        <Link
          to="/history"
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold transition hover:bg-slate-100"
        >
          <HistoryIcon size={16} /> View history
        </Link>
      </div>
    </div>
  );
}