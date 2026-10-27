import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Trash2, X, AlertCircle, History as HistoryIcon } from "lucide-react";
import { api, CLASSES, imageSrc, type HistoryPage as Page, type Record_ } from "../lib/api";
import { CAT_COLORS, CAT_LABELS } from "../components/ResultCard";

const PAGE_SIZE = 8;

type Confirm = { type: "one"; rec: Record_ } | { type: "all" } | null;

export default function HistoryPage() {
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Record_ | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api
      .history({ category, search, sort, page, page_size: PAGE_SIZE })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load history."));
  }, [category, search, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === "one") await api.deleteOne(confirm.rec.id);
      else await api.clearAll();
      setConfirm(null);
      setPage(1);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const filtered = category || search;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prediction History</h1>
          <p className="text-slate-500">Review previously classified waste items.</p>
        </div>
        {data && data.total > 0 && !filtered && (
          <button
            onClick={() => setConfirm({ type: "all" })}
            className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} /> Clear all history
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by filename"
            className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-xl border bg-white px-3 py-2 text-sm">
          <option value="">All categories</option>
          {CLASSES.map((c) => (
            <option key={c} value={c}>{CAT_LABELS[c]}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="rounded-xl border bg-white px-3 py-2 text-sm">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="confidence">Highest confidence</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {!data && !error && <p className="text-slate-500">Loading...</p>}

      {data && data.total === 0 && (
        <div className="flex flex-col items-center rounded-2xl border bg-white px-6 py-16 text-center shadow-sm">
          <HistoryIcon size={48} className="text-emerald-500" />
          <h2 className="mt-4 text-2xl font-bold">{filtered ? "No matching records" : "No history yet"}</h2>
          <p className="mt-1 text-slate-500">
            {filtered ? "Try a different search or filter." : "Classify your first waste item and it will appear here."}
          </p>
          {!filtered && (
            <Link to="/upload" className="mt-6 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white hover:bg-emerald-600">
              Classify an Image
            </Link>
          )}
        </div>
      )}

      {data && data.total > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Date & time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">
                      <img src={imageSrc(r.image_url)} alt="" className="h-12 w-12 rounded-lg border object-cover" />
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: CAT_COLORS[r.category] }}>
                        {CAT_LABELS[r.category]}
                      </span>
                    </td>
                    <td className="px-4 py-2">{(r.confidence * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-slate-500">{r.created_at} UTC</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Model prediction</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setDetail(r)} aria-label="View details" className="rounded-lg p-2 hover:bg-slate-100">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => setConfirm({ type: "one", rec: r })} aria-label="Delete" className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{data.total} record(s)</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Prediction details</h3>
              <button onClick={() => setDetail(null)} aria-label="Close"><X /></button>
            </div>
            <img src={imageSrc(detail.image_url)} alt="" className="mb-4 h-56 w-full rounded-xl border object-cover" />
            <div className="mb-1 text-2xl font-bold" style={{ color: CAT_COLORS[detail.category] }}>
              {CAT_LABELS[detail.category]}
            </div>
            <div className="mb-4 text-sm text-slate-500">
              {(detail.confidence * 100).toFixed(1)}% confidence · {detail.created_at} UTC · {detail.filename}
            </div>
            <div className="space-y-2">
              {[...CLASSES].sort((a, b) => detail.probabilities[b] - detail.probabilities[a]).map((c) => (
                <div key={c}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span>{CAT_LABELS[c]}</span>
                    <span className="font-semibold">{(detail.probabilities[c] * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${detail.probabilities[c] * 100}%`, background: CAT_COLORS[c] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold">{confirm.type === "all" ? "Clear all history?" : "Delete this record?"}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirm.type === "all"
                ? "All saved predictions and their images will be permanently deleted."
                : "This prediction and its stored image will be permanently deleted."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={doDelete} disabled={busy} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {busy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}