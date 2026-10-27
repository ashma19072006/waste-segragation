import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Camera, ArrowRight, Sparkles, Inbox } from "lucide-react";
import { api, CLASSES, imageSrc, type Analytics } from "../lib/api";
import { CAT_COLORS, CAT_LABELS } from "../components/ResultCard";

const STEPS = [
  { n: "01", title: "Capture or upload", text: "Take a photo using your webcam or upload an image of a waste item." },
  { n: "02", title: "AI model inference", text: "The image is processed by a trained MobileNetV2 image classification model." },
  { n: "03", title: "Segregate correctly", text: "Get the predicted category, confidence score, recommended bin, and disposal tips." },
];

export default function HomePage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api.analytics().then(setData).catch(() => setData(null));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-[#0b3b3f] via-[#0b4a6b] to-[#0e7490] p-8 text-white shadow-lg sm:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider">
          <Sparkles size={14} /> AI-POWERED WASTE CLASSIFICATION
        </span>
        <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Sort waste in seconds with <span className="text-emerald-400">computer vision</span>
        </h1>
        <p className="mt-4 max-w-2xl text-teal-50/90">
          An AI-powered assistant that identifies waste from a photo and tells you which bin it belongs in — helping
          households and campuses improve recycling and reduce landfill waste.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/upload" className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400">
            <Upload size={18} /> Upload an Image
          </Link>
          <Link to="/webcam" className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/15">
            <Camera size={18} /> Use Webcam
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-2xl font-bold text-emerald-500">{s.n}</div>
                <div className="mt-1 font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">Six Waste Categories</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {CLASSES.map((c) => (
                <Link key={c} to="/categories" className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
                  <span className="h-3 w-3 rounded-full" style={{ background: CAT_COLORS[c] }} />
                  <span className="text-sm font-medium">{c === "organic" ? "Organic / Biodegradable" : CAT_LABELS[c]}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl bg-gradient-to-br from-[#0b3b3f] to-[#0f766e] p-6 text-white shadow-lg">
          <div className="text-sm font-semibold text-teal-100">Your Activity</div>
          <div className="mt-2 text-5xl font-bold">{data ? data.total : "–"}</div>
          <div className="text-sm text-teal-100">items classified</div>
          <Link to="/analytics" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/25">
            View Analytics <ArrowRight size={16} />
          </Link>
        </aside>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Recent classifications</h2>
        {data && data.recent.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {data.recent.slice(0, 5).map((r) => (
              <div key={r.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <img src={imageSrc(r.image_url)} alt="" className="h-28 w-full object-cover" />
                <div className="p-3">
                  <div className="text-sm font-semibold" style={{ color: CAT_COLORS[r.category] }}>{CAT_LABELS[r.category]}</div>
                  <div className="text-xs text-slate-500">{(r.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
            <Inbox size={36} className="text-emerald-500" />
            <p className="mt-2 font-medium">Nothing classified yet</p>
            <p className="text-sm text-slate-500">Classify your first item to see it here.</p>
            <Link to="/upload" className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
              Classify your first item
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}