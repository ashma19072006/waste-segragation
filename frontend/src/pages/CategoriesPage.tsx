import { useEffect, useState } from "react";
import { Package, FileText, Wine, Wrench, Apple, Trash2, Clock, Info, AlertCircle } from "lucide-react";
import { api, CLASSES, type Category, type CategoryInfo } from "../lib/api";
import { CAT_COLORS } from "../components/ResultCard";

const ICONS: Record<Category, typeof Package> = {
  plastic: Package,
  paper: FileText,
  glass: Wine,
  metal: Wrench,
  organic: Apple,
  trash: Trash2,
};

export default function CategoriesPage() {
  const [data, setData] = useState<Record<Category, CategoryInfo> | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .categories()
      .then((r) => {
        setData(r.categories);
        setNote(r.note);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load categories."));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Waste Categories</h1>
        <p className="text-slate-500">How each of the six categories should be sorted and handled.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {!data && !error && <p className="text-slate-500">Loading...</p>}

      {data && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {CLASSES.map((key) => {
              const c = data[key];
              const Icon = ICONS[key];
              const color = CAT_COLORS[key];
              return (
                <div key={key} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  <div className="h-1.5" style={{ background: color }} />
                  <div className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: color }}>
                        <Icon size={22} />
                      </div>
                      <h2 className="text-xl font-bold">{c.name}</h2>
                      <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{c.recyclable}</span>
                    </div>

                    <p className="text-sm text-slate-600">{c.description}</p>

                    <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                      <span className="font-semibold">Recommended bin: </span>
                      {c.bin}
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Examples</div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.examples.map((e) => (
                          <span key={e} className="rounded-full border px-2.5 py-0.5 text-xs">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Handling tips</div>
                      <ul className="list-inside list-disc space-y-0.5 text-sm text-slate-600">
                        {c.tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={14} /> Approx. decomposition: {c.decomposition}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="flex items-start gap-1.5 text-sm text-slate-500">
            <Info size={16} className="mt-0.5 shrink-0" /> {note}
          </p>
        </>
      )}
    </div>
  );
}