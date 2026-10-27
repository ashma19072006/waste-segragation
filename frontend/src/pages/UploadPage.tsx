import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, AlertCircle } from "lucide-react";
import { api, type Prediction } from "../lib/api";
import ResultCard from "../components/ResultCard";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setDims("");
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    setError(null);
    setResult(null);
    if (!ALLOWED.includes(f.type)) {
      setError("Unsupported file. Please upload a JPG, PNG or WEBP image.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image is larger than 8 MB. Please choose a smaller one.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => setDims(`${img.naturalWidth} x ${img.naturalHeight} px`);
    img.src = url;
    setFile(f);
    setPreview(url);
  };

  const classify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await api.predict(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload & Classify</h1>
        <p className="text-slate-500">Upload a photo of a waste item and let the AI model identify it.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {result ? (
        <ResultCard result={result} onAnother={reset} />
      ) : !file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed bg-white p-14 text-center transition ${
            dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400"
          }`}
        >
          <UploadCloud className="mx-auto mb-3 text-emerald-500" size={48} />
          <p className="font-medium">
            Drag and drop a waste image here, or <span className="text-emerald-600 underline">browse files</span>.
          </p>
          <p className="mt-1 text-sm text-slate-500">JPG, JPEG, PNG or WEBP, up to 8 MB</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <img src={preview!} alt="Preview" className="h-64 w-full rounded-xl border object-cover" />
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">File</div>
                <div className="break-all font-medium">{file.name}</div>
                {dims && <div className="mt-1 text-sm text-slate-500">{dims}</div>}
                <div className="text-sm text-slate-500">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={classify}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Analyzing your image...
                    </>
                  ) : (
                    "Classify Waste"
                  )}
                </button>
                <button
                  onClick={reset}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <X size={16} /> Remove Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}