import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Aperture, RotateCcw, Sparkles, Square, Loader2, AlertCircle } from "lucide-react";
import { api, type Prediction } from "../lib/api";
import ResultCard from "../components/ResultCard";

export default function WebcamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  // Stop the camera when leaving this page
  useEffect(() => () => stopStream(), []);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access. Try Chrome, Edge or Firefox.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError") setError("Camera permission was denied. Allow camera access in your browser and try again.");
      else if (name === "NotFoundError") setError("No camera was found on this device.");
      else if (name === "NotReadableError") setError("The camera is being used by another application.");
      else setError("Could not start the camera.");
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    canvas.toBlob(
      (b) => {
        if (!b) {
          setError("Could not capture the frame.");
          return;
        }
        setBlob(b);
        setShot(URL.createObjectURL(b));
        setResult(null);
        setError(null);
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    if (shot) URL.revokeObjectURL(shot);
    setShot(null);
    setBlob(null);
    setResult(null);
    setError(null);
  };

  const classify = async () => {
    if (!blob) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await api.predict(blob, "webcam-capture.jpg"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const btn = "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webcam Capture</h1>
        <p className="text-slate-500">Capture a waste item with your camera and classify it with the AI model.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-[#0b3b3f] to-[#0b1f33] p-5">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black/40">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${cameraOn && !shot ? "" : "hidden"}`}
            />
            {shot && <img src={shot} alt="Captured" className="h-full w-full object-cover" />}
            {!cameraOn && !shot && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-teal-100">
                <CameraOff size={48} />
                <p>Camera is off</p>
                <button onClick={start} className={`${btn} bg-emerald-500 text-white hover:bg-emerald-600`}>
                  <Camera size={16} /> Start Camera
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {cameraOn && !shot && (
              <button onClick={capture} className={`${btn} bg-emerald-500 text-white hover:bg-emerald-600`}>
                <Aperture size={16} /> Capture Frame
              </button>
            )}
            {shot && (
              <>
                <button onClick={retake} disabled={loading} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
                  <RotateCcw size={16} /> Retake Photo
                </button>
                <button onClick={classify} disabled={loading} className={`${btn} bg-emerald-500 text-white hover:bg-emerald-600`}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? "Analyzing your image..." : "Classify Captured Image"}
                </button>
              </>
            )}
            {cameraOn && (
              <button onClick={stopStream} disabled={loading} className={`${btn} ml-auto bg-red-500/80 text-white hover:bg-red-500`}>
                <Square size={16} /> Stop Camera
              </button>
            )}
            {!cameraOn && shot && (
              <button onClick={start} disabled={loading} className={`${btn} ml-auto bg-white/10 text-white hover:bg-white/20`}>
                <Camera size={16} /> Start Camera
              </button>
            )}
          </div>
        </div>

        <div>
          {result ? (
            <ResultCard result={result} onAnother={retake} />
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-8 text-center text-slate-500">
              <Sparkles className="mb-3 text-emerald-500" size={40} />
              <p className="font-medium text-slate-700">Prediction result</p>
              <p className="text-sm">Start the camera, capture a frame and click Classify to see the result here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}