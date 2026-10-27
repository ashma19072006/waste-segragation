import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BarChart3, Layers, Gauge, AlertCircle } from "lucide-react";
import { api, CLASSES, imageSrc, type Analytics } from "../lib/api";
import { CAT_COLORS, CAT_LABELS } from "../components/ResultCard";

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const load = useCallback(() => {
    setError(null);
    api
      .analytics(start || undefined, end || undefined)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics."));
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const hasFilter = start || end;

  const stat = (label: string, value: string | number, color: string, Icon: typeof Layers) => (
    <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
        <Icon size={14} className="ml-auto text-slate-400" />
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );

  const pieData = data ? CLASSES.map((c) => ({ key: c, name: CAT_LABELS[c], value: data.counts[c] })) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-slate-500">Understand your waste classification activity and category distribution.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border bg-white px-3 py-1.5" />
          <span className="text-slate-400">to</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border bg-white px-3 py-1.5" />
          {hasFilter && (
            <button onClick={() => { setStart(""); setEnd(""); }} className="rounded-lg border bg-white px-3 py-1.5 hover:bg-slate-100">
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {!data && !error && <p className="text-slate-500">Loading...</p>}

      {data && data.total === 0 && (
        <div className="flex flex-col items-center rounded-2xl border bg-white px-6 py-16 text-center shadow-sm">
          <BarChart3 size={48} className="text-emerald-500" />
          <h2 className="mt-4 text-2xl font-bold">No data yet</h2>
          <p className="mt-1 max-w-md text-slate-500">
            {hasFilter
              ? "No classifications in this date range."
              : "Classify a few waste items to see your analytics dashboard come to life."}
          </p>
          <Link to="/upload" className="mt-6 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-600">
            Classify an Image
          </Link>
        </div>
      )}

      {data && data.total > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stat("Total Items Classified", data.total, "#10b981", Layers)}
            {CLASSES.map((c) => stat(`${CAT_LABELS[c]} Items`, data.counts[c], CAT_COLORS[c], Layers))}
            {stat("Avg. Confidence", `${(data.average_confidence * 100).toFixed(1)}%`, "#06b6d4", Gauge)}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold">Category distribution</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {pieData.filter((d) => d.value > 0).map((d) => (
                        <Cell key={d.key} fill={CAT_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold">Items per category</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={pieData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {pieData.map((d) => (
                        <Cell key={d.key} fill={CAT_COLORS[d.key]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold">Daily classification activity</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Items" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold">Category percentage breakdown</h3>
              <div className="space-y-3">
                {CLASSES.map((c) => (
                  <div key={c}>
                    <div className="mb-0.5 flex justify-between text-sm">
                      <span>{CAT_LABELS[c]}</span>
                      <span className="font-semibold">{data.percentages[c]}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${data.percentages[c]}%`, background: CAT_COLORS[c] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <h3 className="p-5 pb-2 font-semibold">Recent activity</h3>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-2">Image</th>
                  <th className="px-5 py-2">Category</th>
                  <th className="px-5 py-2">Confidence</th>
                  <th className="px-5 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-5 py-2">
                      <img src={imageSrc(r.image_url)} alt="" className="h-12 w-12 rounded-lg border object-cover" />
                    </td>
                    <td className="px-5 py-2">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: CAT_COLORS[r.category] }}>
                        {CAT_LABELS[r.category]}
                      </span>
                    </td>
                    <td className="px-5 py-2">{(r.confidence * 100).toFixed(1)}%</td>
                    <td className="px-5 py-2 text-slate-500">{r.created_at} UTC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}