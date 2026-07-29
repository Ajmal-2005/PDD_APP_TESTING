import type * as tfTypes from '@tensorflow/tfjs-core';
import { toDataUrl } from './utils';

/**
 * TensorFlow.js is loaded lazily - the static `import type` above costs nothing
 * at runtime; the real module (~1.5 MB parsed) is only fetched on first call to
 * `getTf()`, which happens inside `loadModel()` / `classify()`.
 */
let _tf: typeof tfTypes | null = null;

async function getTf(): Promise<typeof tfTypes> {
  if (!_tf) {
    const [core] = await Promise.all([
      import('@tensorflow/tfjs-core'),
      import('@tensorflow/tfjs-backend-webgl'),
      import('@tensorflow/tfjs-backend-cpu'),
    ]);
    _tf = core;
  }
  return _tf;
}

/**
 * The TFLite runtime is loaded as a script at runtime rather than imported.
 *
 * `@tensorflow/tfjs-tflite`'s ESM entry imports `./tflite_web_api_client`, a file that
 * only exists under the package's `wasm/` folder - webpack cannot resolve it and the
 * build fails. Its self-contained UMD bundle has no such problem, so we serve that (and
 * the WASM binaries) from /public/tflite and pick the API up off `window`.
 */
interface TFLiteModel {
  predict(input: tfTypes.Tensor): tfTypes.Tensor | tfTypes.Tensor[] | Record<string, tfTypes.Tensor>;
}
interface TFLiteRuntime {
  setWasmPath(path: string): void;
  loadTFLiteModel(url: string): Promise<TFLiteModel>;
}

declare global {
  interface Window { tflite?: TFLiteRuntime; tf?: typeof tfTypes }
}

let runtimePromise: Promise<TFLiteRuntime> | null = null;

async function loadTfliteRuntime(): Promise<TFLiteRuntime> {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      if (typeof window === 'undefined') throw new Error('TFLite requires a browser');
      if (window.tflite) return window.tflite;

      // The UMD bundle resolves tfjs-core off the global, so publish ours first -
      // otherwise it would pull a second, mismatched copy.
      const tf = await getTf();
      window.tf = tf;

      return new Promise<TFLiteRuntime>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${WASM_PATH}tf-tflite.min.js`;
        script.async = true;
        script.onload = () =>
          window.tflite
            ? resolve(window.tflite)
            : reject(new Error('TFLite runtime loaded but did not register'));
        script.onerror = () => reject(new Error(`Could not load ${script.src}`));
        document.head.appendChild(script);
      });
    })().catch((e) => {
      runtimePromise = null;      // allow a retry
      throw e;
    });
  }
  return runtimePromise;
}

export interface ClassificationResult {
  disease: string;
  confidence: number;
  severity: string;
  driScore: number;
  riskLevel: string;
  rawLabel: string;
  allScores: { label: string; score: number }[];
  /**
   * True when the image is not a usable tomato leaf. Callers MUST treat this as a
   * terminal error state: no diagnosis, no persistence, no report.
   */
  invalid: boolean;
  /** Why it was rejected - 'not_tomato' | 'low_confidence'. Undefined when valid. */
  invalidReason?: 'not_tomato' | 'low_confidence';
}

/**
 * Runs the same `agrovision_model.tflite` the Android app ships, via the TFLite WASM
 * runtime, so both platforms execute an identical graph with identical weights.
 *
 * This is the temporary bridge until the retrained model is exported to TF.js.
 */
const GRAPH_MODEL_URL = '/model/model.json';          // TF.js export (preferred)
const MODEL_URL = '/model/agrovision_model.tflite';   // Android asset (fallback)
const LABELS_JSON_URL = '/model/labels.json';
const LABELS_URL = '/model/labels.txt';
const WASM_PATH = '/tflite/';          // self-hosted; no CDN dependency at runtime
const INPUT_SIZE = 224;

/**
 * Confidence floor. Below this the prediction is treated as an INVALID image rather
 * than a diagnosis - an uncertain guess about someone's crop is worse than no answer.
 */
const MIN_CONFIDENCE = 0.55;

/** The negative class. In labels.txt this is index 0, not the last entry. */
const NOT_TOMATO = 'not_tomato';

/** Anything we can run inference on, regardless of source format. */
interface Runnable { predict(input: tfTypes.Tensor): tfTypes.Tensor | tfTypes.Tensor[] | Record<string, tfTypes.Tensor> }

let modelPromise: Promise<Runnable> | null = null;
let labels: string[] = [];

/**
 * `no-store` is load-bearing, not caution.
 *
 * A cached HEAD makes this answer a stale question: after a model file was removed the
 * probe still reported 200 from cache, so the loader took the branch for a model that was
 * no longer there. The reverse is worse - a cached 404 hides a model you just installed.
 */
const exists = async (url: string) => {
  try { return (await fetch(url, { method: 'HEAD', cache: 'no-store' })).ok; } catch { return false; }
};

/** labels.json (TF.js export) or labels.txt (Android assets) - accept either. */
async function loadLabels(): Promise<string[]> {
  // Never a cached copy: labels are positional, so pairing a new model with stale labels
  // renames every class silently rather than failing.
  const json = await fetch(LABELS_JSON_URL, { cache: 'no-store' }).catch(() => null);
  if (json?.ok) {
    const parsed = await json.json();
    if (Array.isArray(parsed) && parsed.length) return parsed.map(String);
  }
  const txt = await fetch(LABELS_URL);
  if (!txt.ok) throw new Error(`No labels file found (${LABELS_JSON_URL} or ${LABELS_URL})`);
  // labels.txt is indentation-padded in the Android assets - trim every line.
  const lines = (await txt.text()).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error('labels file is empty');
  return lines;
}

/**
 * Loads whichever model format is present.
 *
 * TF.js graph model is preferred - it is what the training notebook exports and what
 * runs fastest in a browser. The .tflite path exists so the Android asset can be used
 * directly, but note the runtime constraint: `@tensorflow/tfjs-tflite` (alpha.10, the
 * latest published) ships an old TFLite WASM build, so a model whose metadata demands a
 * newer `min_runtime_version` fails with "Can't initialize model". Export to TF.js in
 * that case rather than fighting the runtime.
 */
export async function loadModel(): Promise<Runnable> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [hasGraph, hasTflite] = await Promise.all([
        exists(GRAPH_MODEL_URL),
        exists(MODEL_URL),
      ]);

      if (!hasGraph && !hasTflite) {
        throw new Error(`No model found at ${GRAPH_MODEL_URL} or ${MODEL_URL}`);
      }

      const tf = await getTf();
      // Labels must load. They are positional, so guessing them renames every class:
      // a wrong list turns "Late Blight" into "Healthy" with no error anywhere.
      const [labelList] = await Promise.all([loadLabels(), tf.ready()]);
      labels = labelList;

      if (hasGraph) {
        const { loadGraphModel } = await import('@tensorflow/tfjs-converter');
        return (await loadGraphModel(GRAPH_MODEL_URL)) as unknown as Runnable;
      }

      const tflite = await loadTfliteRuntime();
      tflite.setWasmPath(WASM_PATH);
      return await tflite.loadTFLiteModel(MODEL_URL);
    })().catch((e) => {
      modelPromise = null;        // allow a retry instead of caching the failure
      labels = [];
      throw e;
    });
  }
  return modelPromise;
}

export const isModelLoaded = () => labels.length > 0;

/**
 * Server-side inference, for when the browser cannot run the model itself.
 *
 * `agrovision_model.tflite` requires TFLite runtime >= 2.20 and the only published browser
 * runtime is far older, so in-browser loading fails outright. `/api/classify` forwards to
 * predict_server.py, which runs the identical file the Android app ships - same weights,
 * same graph, same raw-0-255 preprocessing. The phone and the website therefore return the
 * same prediction for the same photo.
 *
 * This is real inference, not a stand-in: the scores come from the model. If the service
 * is unreachable this throws, and the scan page shows its "model not installed" banner -
 * it must never invent a result, because callers persist, sync and print what they get.
 */
/** Is server-side inference reachable? Cheap probe - no image, no inference. */
export async function serverInferenceAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/classify', { cache: 'no-store' });
    if (!res.ok) return false;
    return Boolean((await res.json())?.available);
  } catch {
    return false;
  }
}

async function classifyOnServer(dataUrl: string): Promise<number[]> {
  const res = await fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `inference request failed (${res.status})`);
  }
  const data = await res.json();
  if (!Array.isArray(data?.scores) || !data.scores.length) {
    throw new Error('inference service returned no scores');
  }
  // Adopt the server's label list so indices always line up with the scores it produced.
  if (Array.isArray(data.labels) && data.labels.length) labels = data.labels.map(String);
  return data.scores as number[];
}

/**
 * The model carries its own preprocessing (Rescaling 1/127.5, offset -1) inside the
 * graph, exactly as the Android build does - TFLiteClassifier.kt feeds raw 0-255 floats
 * into its ByteBuffer. So we feed raw 0-255 here too and must NOT normalize.
 */
export async function classify(
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
): Promise<ClassificationResult> {
  /*
   * In-browser first, server second.
   *
   * A local model (the TF.js export the training notebook produces) is preferred: it needs
   * no network and no second process. When none is installed - today's situation, since
   * the Android .tflite cannot initialise in any published browser runtime - inference
   * moves to /api/classify, which runs that same .tflite server-side.
   *
   * Both paths end at interpret(), so the argmax, the Not_Tomato gate, MIN_CONFIDENCE and
   * the DRI are identical either way, and identical to Android.
   */
  let localModel: Runnable | null = null;
  try {
    localModel = await loadModel();
  } catch (localErr) {
    console.info('[AgroVision] No in-browser model; using server inference.', localErr);
    // Re-encode at the model's own input size - sending a full-resolution photo would
    // upload megabytes for an image the server immediately downsamples to 224x224.
    return interpret(await classifyOnServer(toDataUrl(source, 640)));
  }

  const model = localModel;
  const tf = await getTf();

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);
    const resized = tf.image.resizeBilinear(img, [INPUT_SIZE, INPUT_SIZE], false);
    return tf.expandDims(tf.cast(resized, 'float32'), 0);
  });

  /*
   * If inference fails, the error propagates. There is deliberately no fallback that
   * invents scores.
   *
   * A previous revision substituted a colour-heuristic "classifier" here - average RGB
   * and dark/yellow pixel ratios mapped to real disease names at 0.83-0.95 confidence.
   * That clears MIN_CONFIDENCE, so the guess was persisted, synced and printed into a
   * PDF report, indistinguishable from a model output. A leaf photographed in shade came
   * back "Late Blight, 89%".
   *
   * The scan page already handles a thrown error by showing "AI model not installed" and
   * disabling Analyse. Telling a farmer nothing is recoverable; telling them the wrong
   * disease confidently is not.
   */
  let scores: number[];
  try {
    const out = model.predict(input) as tfTypes.Tensor;
    scores = Array.from(await out.data()) as number[];
    out.dispose();
  } finally {
    input.dispose();
  }

  return interpret(scores);
}

export function interpret(scores: number[]): ClassificationResult {
  const all = scores.map((score, i) => ({ label: labels[i] ?? `class_${i}`, score }));

  // Plain argmax. The Android version had an "Intelligent Healthy Prioritization"
  // override here that biased results toward Healthy; it was compensating for the
  // old model's disease bias and actively suppresses correct detections now.
  let maxIdx = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[maxIdx]) maxIdx = i;

  const confidence = scores[maxIdx];
  const rawLabel = labels[maxIdx] ?? 'Unknown';

  const rejected = (reason: 'not_tomato' | 'low_confidence'): ClassificationResult => ({
    disease: reason === 'not_tomato' ? 'No tomato leaf detected' : 'Unknown',
    confidence,
    severity: 'N/A',
    driScore: 0,
    riskLevel: 'UNKNOWN',
    rawLabel,
    allScores: all,
    invalid: true,
    invalidReason: reason,
  });

  // Not a tomato leaf at all -> hard stop, never a "successful" scan.
  if (rawLabel.toLowerCase() === NOT_TOMATO) return rejected('not_tomato');

  // Too uncertain to act on -> also an invalid image, not a diagnosis.
  if (confidence < MIN_CONFIDENCE) return rejected('low_confidence');

  const disease = rawLabel
    .replace('Tomato___', '')
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const driScore = calculateDRI(confidence, disease);
  const riskLevel = driScore >= 7 ? 'HIGH' : driScore >= 4 ? 'MEDIUM' : driScore >= 1 ? 'LOW' : 'SAFE';
  // Severity describes the disease, so a healthy leaf has none - being 95% sure a leaf is
  // healthy previously rendered as "Severity: High".
  const severity =
    disease.toLowerCase() === 'healthy'
      ? 'None'
      : confidence > 0.9 ? 'High' : confidence > 0.75 ? 'Medium' : confidence > 0.6 ? 'Low' : 'None';

  return { disease, confidence, severity, driScore, riskLevel, rawLabel, allScores: all, invalid: false };
}

/**
 * Disease Risk Index, kept in lockstep with TFLiteClassifier.calculateDRI.
 *
 * Two corrections applied to both platforms at once:
 *
 *  1. Healthy short-circuits to 0. Scaling confidence by 6 meant a 0.95-confidence
 *     "Healthy" scored 8.7 and tripped the >= 7 HIGH threshold - the app reported a
 *     confidently healthy leaf as high risk. Confidence is certainty ABOUT a class, not
 *     the severity OF one.
 *  2. Leaf Mold, Target Spot and Spider Mites previously fell through to 0, the same
 *     weight as a healthy plant. They now carry explicit criticality.
 */
export function calculateDRI(confidence: number, diseaseName: string): number {
  const d = diseaseName.toLowerCase();
  if (d === 'healthy') return 0;

  const severityScore = confidence > 0.9 ? 3 : confidence > 0.75 ? 2 : confidence > 0.6 ? 1 : 0;
  const criticality =
    // No chemical cure (viruses), or capable of destroying a crop in days.
    d.includes('late blight') || d.includes('yellow leaf curl') || d.includes('mosaic')
      ? 3
      // Aggressive defoliators that spread readily in wet or humid conditions.
      : d.includes('septoria') || d.includes('bacterial spot') || d.includes('target spot')
      ? 2
      // Manageable with prompt treatment, but still yield-limiting if ignored.
      : d.includes('early blight') || d.includes('leaf mold') || d.includes('spider mites')
      ? 1
      : 0;
  return Math.min(confidence * 6 + severityScore + criticality, 10);
}
