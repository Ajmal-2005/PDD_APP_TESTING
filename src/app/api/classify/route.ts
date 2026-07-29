import { NextResponse } from 'next/server';

/**
 * Server-side inference proxy.
 *
 * The browser cannot run agrovision_model.tflite: its metadata requires TFLite runtime
 * >= 2.20, while @tensorflow/tfjs-tflite@0.0.1-alpha.10 (the newest published browser
 * runtime) bundles a much older WASM build and fails with "Can't initialize model".
 *
 * The model is fine outside the browser, so predict_server.py runs the exact file the
 * Android app loads from its assets and this route forwards to it. Same weights, same
 * graph, same preprocessing - the website and the phone agree on the same photo.
 *
 * Node runtime, not edge: this talks to a loopback address, which edge cannot reach.
 */
export const runtime = 'nodejs';

const INFERENCE_URL = process.env.INFERENCE_URL ?? 'http://127.0.0.1:8077';

/**
 * Health probe for the scan page.
 *
 * The workspace checks on mount whether inference is possible at all, so it can show the
 * "model not installed" banner and disable Analyse instead of letting someone upload a
 * photo and wait for a failure. Cheap: no image, no inference.
 */
export async function GET() {
  try {
    const res = await fetch(`${INFERENCE_URL}/health`, { signal: AbortSignal.timeout(4_000) });
    if (!res.ok) return NextResponse.json({ available: false }, { status: 503 });
    const data = await res.json();
    return NextResponse.json({ available: true, labels: data?.labels ?? 0 });
  } catch {
    return NextResponse.json({ available: false }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let image: string | undefined;
  try {
    ({ image } = await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'image (data URL) is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${INFERENCE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
      // A cold start pays for the TensorFlow import; inference itself is ~50 ms.
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `inference service returned ${res.status}`, detail: detail.slice(0, 400) },
        { status: 502 },
      );
    }

    const data = await res.json();
    if (!Array.isArray(data?.scores) || !Array.isArray(data?.labels)) {
      return NextResponse.json({ error: 'malformed response from inference service' }, { status: 502 });
    }
    // Labels travel with the scores: the list is positional, so letting the client assume
    // an order is how a new model silently renames every class.
    return NextResponse.json({ labels: data.labels, scores: data.scores });
  } catch (e) {
    /*
     * Deliberately an error, never a guess.
     *
     * The scan page turns this into the "AI model not installed" banner. Returning
     * invented scores here would be indistinguishable from a real diagnosis downstream -
     * it would be persisted, synced and printed into a PDF report.
     */
    const reason = (e as Error)?.name === 'TimeoutError'
      ? 'inference service timed out'
      : `inference service unreachable at ${INFERENCE_URL}`;
    return NextResponse.json(
      { error: reason, hint: 'Start it with: python predict_server.py' },
      { status: 503 },
    );
  }
}
