import { getAuthInstance, getDb, getStorageInstance } from './firebase';
import { db as localDb, isCompleteScan, normalizeScan, type Scan } from './db';

/**
 * Connectivity probes written by firestore-diagnostic.js. They are deliberately
 * partial documents, and the listener sees them before the script deletes them -
 * they are not scans and must never reach history.
 */
const isDiagnostic = (id: string) => id.startsWith('__diagnostic__');

/**
 * Best-effort mirror to users/{uid}/scans/{id}, the same path ScanRepository.kt writes to,
 * so a scan taken on the phone and one taken in the browser land in the same collection.
 *
 * imageDataUrl is stripped: base64 images blow past the 1 MB Firestore document limit.
 * Images stay on-device; the cloud copy holds the diagnosis only.
 */
/**
 * Firestore failures are almost always one of two setup problems, and a bare
 * "permission-denied" tells the developer nothing. Name the likely fix.
 */
function explain(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('permission-denied')) {
    return 'permission-denied - publish Firestore security rules allowing ' +
      'users/{uid}/scans for the signed-in user.';
  }
  if (code.includes('unavailable') || code.includes('not-found')) {
    return 'database unreachable - create the Cloud Firestore database in the Firebase console.';
  }
  if (code.includes('failed-precondition')) {
    return 'failed-precondition - Cloud Firestore may not be enabled for this project.';
  }
  return (e as Error)?.message ?? String(e);
}

/** Longest edge of the synced thumbnail, and the JPEG quality used for it. */
const THUMB_DIM = 480;
const THUMB_QUALITY = 0.7;
/**
 * Hard ceiling on the encoded thumbnail. Firestore rejects any document over 1 MB, and a
 * rejected write loses the whole diagnosis, not just the picture - so the image is dropped
 * long before it can threaten the document.
 */
const THUMB_MAX_BYTES = 200_000;

/**
 * Shrinks a scan image to a thumbnail small enough to live inside its Firestore document.
 *
 * This is how pictures cross between devices without Cloud Storage, which Firebase now
 * gates behind the paid Blaze plan. Roughly 20-50 KB at 480px, against a 1 MB document
 * limit; the full-resolution copy never leaves the device that took it.
 *
 * Returns '' if anything fails - the diagnosis must sync regardless.
 */
async function makeThumb(dataUrl: string): Promise<string> {
  if (!dataUrl) return '';
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();

    const scale = Math.min(1, THUMB_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);

    let thumb = canvas.toDataURL('image/jpeg', THUMB_QUALITY);
    // One retry at lower quality before giving up, so an unusually busy photo still syncs.
    if (thumb.length > THUMB_MAX_BYTES) thumb = canvas.toDataURL('image/jpeg', 0.45);
    if (thumb.length > THUMB_MAX_BYTES) {
      console.warn('[AgroVision sync] Thumbnail too large to embed, syncing without image');
      return '';
    }
    return thumb;
  } catch (e) {
    console.warn('[AgroVision sync] Could not build thumbnail:', e);
    return '';
  }
}

/**
 * Uploads a scan's picture to scan-images/{uid}/{scanId}.jpg and returns its download URL.
 *
 * Mirrors ScanRepository.uploadImage on Android - same bucket path, so a scan taken on
 * either platform resolves to the same object and both can display it.
 *
 * Returns '' on any failure. Callers must not let this abort the Firestore write: losing
 * the picture is a far smaller failure than losing the diagnosis.
 */
async function uploadImage(uid: string, scan: Scan): Promise<string> {
  if (!scan.imageDataUrl) return '';
  try {
    const storage = await getStorageInstance();
    if (!storage) return '';
    const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
    const target = ref(storage, `scan-images/${uid}/${scan.id}.jpg`);
    // The thumbnail is already a data URL, so upload it in that form rather than
    // round-tripping through a Blob.
    await uploadString(target, scan.imageDataUrl, 'data_url');
    return await getDownloadURL(target);
  } catch (e) {
    console.error(
      '[AgroVision sync] Image upload failed:', explain(e),
      '- check Firebase Storage is enabled and its rules allow scan-images/{uid}.', e,
    );
    return '';
  }
}

export async function syncScan(scan: Scan): Promise<void> {
  const auth = await getAuthInstance();
  const db = await getDb();
  if (!auth?.currentUser || !db) return;
  const uid = auth.currentUser.uid;
  const { doc, setDoc, updateDoc } = await import('firebase/firestore');
  const ref = doc(db, 'users', uid, 'scans', scan.id);

  /*
   * The diagnosis goes first, on its own.
   *
   * This used to await the image upload before writing anything. When Firebase Storage is
   * not enabled the SDK retries for up to maxUploadRetryTime (10 minutes by default), so
   * the write sat behind a stalled upload - and because callers invoke this as
   * `void syncScan(...)`, closing the tab in the meantime meant the scan never reached
   * Firestore and never appeared on the phone.
   *
   * Ordering it this way costs nothing: a document that briefly has no imageUrl is exactly
   * what a scan taken before image sync looks like, and the UI already falls back to a
   * placeholder for it.
   */
  try {
    // The full-resolution imageDataUrl is stripped - it would blow past Firestore's 1 MB
    // document limit. A ~480px thumbnail travels in its place, which is what lets the
    // other device show the picture without Cloud Storage.
    const { imageDataUrl, ...rest } = scan;
    const imageThumb = scan.imageThumb || (await makeThumb(scan.imageDataUrl));
    await setDoc(ref, {
      ...rest,
      id: scan.id,
      imageUrl: scan.imageUrl ?? '',
      imageThumb,
    });
    if (imageThumb && imageThumb !== scan.imageThumb) {
      await localDb.scans.update(scan.id, { imageThumb });
    }
  } catch (e) {
    console.error('[AgroVision sync] Upload failed:', explain(e), e);
    return;   // no document to attach an image to
  }

  // Then the picture, best-effort. A failure here leaves a scan without an image, which
  // is recoverable; it must never take the diagnosis down with it.
  if (scan.imageUrl || !scan.imageDataUrl) return;
  const imageUrl = await uploadImage(uid, scan);
  if (!imageUrl) return;
  try {
    await updateDoc(ref, { imageUrl });
    // Remember it locally so a later sync does not re-upload the same picture.
    await localDb.scans.update(scan.id, { imageUrl });
  } catch (e) {
    console.error('[AgroVision sync] Could not attach image URL:', explain(e), e);
  }
}

export async function unsyncScan(id: string): Promise<void> {
  const auth = await getAuthInstance();
  const db = await getDb();
  if (!auth?.currentUser || !db) return;
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'scans', id));
  } catch (e) {
    console.error('[AgroVision sync] Delete failed:', explain(e), e);
  }
}

/**
 * Data migration for the per-user scan filter.
 *
 * Scans taken before signing in are stored under userId 'anonymous'. Because `useScans()`
 * filters by the signed-in uid, those rows would silently disappear from history once the
 * user logs in. On sign-in we re-tag them and upload them - they were never synced,
 * because there was no account to sync them to at the time.
 */
export async function claimAnonymousScans(uid: string): Promise<void> {
  if (uid === 'anonymous') return;
  const orphans = await localDb.scans.where('userId').equals('anonymous').toArray();
  if (orphans.length === 0) return;

  const claimed = orphans.map((s) => ({ ...s, userId: uid }));
  await localDb.scans.bulkPut(claimed);
  console.info(`[AgroVision sync] Claimed ${claimed.length} scan(s) taken before sign-in`);

  for (const scan of claimed) await syncScan(scan);
}

/**
 * One-off pass that uploads images for scans that synced before Storage existed.
 *
 * Enabling Firebase Storage does not retroactively fill in anything: syncScan() only
 * uploads at the moment a scan is written, so every scan taken beforehand has an empty
 * imageUrl and shows a placeholder on other devices forever. This walks local history and
 * attaches the missing pictures.
 *
 * Only rows that still hold a local image can be recovered - a scan pulled down from
 * another device never had one here, and there is nothing to upload.
 *
 * Bails out on the first failure rather than grinding through the whole list. If Storage
 * is still disabled every attempt costs the full retry timeout, so a 50-scan history would
 * otherwise stall for minutes on every sign-in for no benefit.
 */
export async function backfillScanImages(uid: string): Promise<void> {
  const auth = await getAuthInstance();
  const db = await getDb();
  if (!auth?.currentUser || !db) return;

  const rows = await localDb.scans.where('userId').equals(uid).toArray();
  // Only rows that still hold a local image can be recovered - a scan pulled from another
  // device never had one here, so there is nothing to build a thumbnail from.
  const pending = rows.filter((s) => !s.imageThumb && s.imageDataUrl);
  if (!pending.length) return;

  const { doc, updateDoc } = await import('firebase/firestore');
  let done = 0;

  for (const scan of pending) {
    const imageThumb = await makeThumb(scan.imageDataUrl);
    if (!imageThumb) continue;    // unusable photo; skip it, don't abandon the rest
    try {
      await updateDoc(doc(db, 'users', uid, 'scans', scan.id), { imageThumb });
      await localDb.scans.update(scan.id, { imageThumb });
      done += 1;
    } catch (e) {
      // A write failure is systemic (rules, quota, offline), so stop rather than repeat it
      // for every remaining scan.
      console.error('[AgroVision sync] Backfill stopped:', explain(e), e);
      break;
    }
  }
  if (done) console.info(`[AgroVision sync] Backfilled ${done} scan image(s)`);
}

/**
 * Repair rows written by the earlier build, which cast remote documents to Scan without
 * checking them. Those rows can hold undefined numerics and take a page down the moment
 * it renders one (`scan.driScore.toFixed(1)` -> TypeError).
 *
 * Nothing here is destructive to real data: incomplete rows are filled in rather than
 * dropped, so a scan that synced from another device keeps whatever it did carry. Only
 * diagnostic probes are deleted outright, because they were never scans.
 */
export async function healLocalScans(uid: string): Promise<void> {
  const rows = await localDb.scans.where('userId').equals(uid).toArray();

  const probes = rows.filter((r) => isDiagnostic(r.id));
  const broken = rows.filter((r) => !isDiagnostic(r.id) && !isCompleteScan(r));
  if (!probes.length && !broken.length) return;

  if (probes.length) await localDb.scans.bulkDelete(probes.map((r) => r.id));
  if (broken.length) {
    await localDb.scans.bulkPut(
      broken.map((r) =>
        normalizeScan(r as unknown as Record<string, unknown>, r.id, r.userId, r.imageDataUrl ?? '')),
    );
  }
  console.info(
    `[AgroVision sync] Repaired local store: ${broken.length} incomplete row(s), ` +
    `${probes.length} diagnostic probe(s) removed`,
  );
}

/**
 * The pull half of sync: subscribe to users/{uid}/scans and mirror every remote
 * change into local IndexedDB in real time. This is what makes a scan taken on
 * the phone appear on the website (and vice versa).
 *
 * Merge rules:
 *  - The cloud copy never carries the image (it's stripped on upload), so when a
 *    remote doc lands we KEEP any local imageDataUrl and only fall back to '' for
 *    scans this device has never seen. That empty string is what ScanThumb renders
 *    a placeholder for.
 *  - A remote deletion removes the local row too.
 *
 * Returns an unsubscribe function; returns a no-op if Firestore isn't available.
 * Now async because getDb() is async with dynamic imports.
 */
export function subscribeToScans(uid: string): () => void {
  let unsubscribe: (() => void) | undefined;

  (async () => {
    const db = await getDb();
    if (!db) return;

    const { collection, query, onSnapshot } = await import('firebase/firestore');
    const q = query(collection(db, 'users', uid, 'scans'));
    unsubscribe = onSnapshot(
      q,
      async (snap) => {
        for (const change of snap.docChanges()) {
          const id = change.doc.id;
          if (change.type === 'removed') {
            await localDb.scans.delete(id);
            continue;
          }
          if (isDiagnostic(id)) continue;
          const remote = change.doc.data() as Record<string, unknown>;
          const existing = await localDb.scans.get(id);
          // Never trust the remote shape: another client may be on an older schema.
          await localDb.scans.put(normalizeScan(remote, id, uid, existing?.imageDataUrl ?? ''));
        }
      },
      (err) => console.error('[AgroVision sync] Listener failed:', explain(err), err),
    );
  })();

  return () => unsubscribe?.();
}
