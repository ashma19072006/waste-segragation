import { ArrowRight, Monitor, Brain, Server } from "lucide-react";

const TECH = [
  { icon: Monitor, title: "Frontend", text: "React, TypeScript, Tailwind CSS, Recharts" },
  { icon: Brain, title: "Model", text: "MobileNetV2 transfer learning with six waste classes" },
  { icon: Server, title: "Backend", text: "Python FastAPI, TensorFlow/Keras, and SQLite" },
];

const FLOW = [
  "Browser interface",
  "FastAPI API",
  "Image preprocessing",
  "MobileNetV2",
  "Prediction response",
  "SQLite database",
  "Analytics dashboard",
];

const SECTIONS: { title: string; body: string | string[] }[] = [
  {
    title: "Project overview",
    body: "This application classifies a photo of a waste item into one of six categories and recommends the correct bin. Every prediction is saved, so the analytics dashboard and history are built from real classification records.",
  },
  {
    title: "Problem statement",
    body: "Mixed waste is hard to recycle. People are often unsure which bin an item belongs in, and contamination sends recyclable material to landfill.",
  },
  {
    title: "Objectives",
    body: [
      "Classify waste images into plastic, paper, glass, metal, organic and trash.",
      "Show the confidence score, recommended bin and handling tips.",
      "Store every prediction and report real usage analytics.",
    ],
  },
  {
    title: "Key features",
    body: [
      "Image upload and webcam capture sent to the same real AI backend.",
      "Probabilities for all six classes with every prediction.",
      "Persistent history with search, filters, sorting and delete.",
      "Analytics dashboard computed from database records.",
    ],
  },
  {
    title: "Dataset information",
    body: "The model is trained on a dataset you provide, split into train, validation and test sets. The quality of the dataset determines the quality of the predictions. The cardboard label is a different class from organic and is never renamed to it.",
  },
  {
    title: "Limitations and future scope",
    body: [
      "Accuracy depends on the training data. Unusual lighting, cluttered backgrounds and multiple items in one photo can reduce it.",
      "The model assigns one label per image and cannot detect several items at once.",
      "Bin colours and rules differ by municipality, and decomposition times are approximate.",
      "Future work: object detection for multiple items, more categories, and region-specific disposal rules.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-3xl font-bold">About the AI Smart Waste Segregation System</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {TECH.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Icon size={20} />
            </div>
            <div className="font-semibold">{title}</div>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-[#0b3b3f] to-[#0b1f33] p-6 text-white">
        <h2 className="mb-4 text-lg font-bold">System architecture</h2>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm">{step}</span>
              {i < FLOW.length - 1 && <ArrowRight size={16} className="text-emerald-400" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-bold">{s.title}</h2>
            {Array.isArray(s.body) ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                {s.body.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">{s.body}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}