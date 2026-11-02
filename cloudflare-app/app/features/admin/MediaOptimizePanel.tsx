import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

type BackfillResponse = { processed: number; converted: number; remaining: number; failures: string[] };

type BatchResponse = {
  nextCursor: string;
  processed: number;
  created: number;
  skipped: number;
  failures: { mediaId: string; message: string }[];
  done: boolean;
};

export function MediaOptimizePanel({ csrf }: { csrf: string }) {
  const fetcher = useFetcher<BatchResponse>();
  const webpFetcher = useFetcher<BackfillResponse>();
  const [webpRunning, setWebpRunning] = useState(false);
  const [webpConverted, setWebpConverted] = useState(0);
  const [webpFailures, setWebpFailures] = useState<string[]>([]);
  const handledWebp = useRef<BackfillResponse | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [created, setCreated] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);
  const handled = useRef<BatchResponse | undefined>(undefined);
  const cursor = useRef("");

  const submitBatch = (next: string) => {
    const form = new FormData();
    form.set("csrf", csrf);
    form.set("cursor", next);
    fetcher.submit(form, { method: "post", action: "/admin/media/optimize/run" });
  };

  useEffect(() => {
    const result = fetcher.data;
    if (!running || fetcher.state !== "idle" || !result || handled.current === result) return;
    handled.current = result;
    setProcessed((count) => count + result.processed);
    setCreated((count) => count + result.created);
    if (result.failures.length) {
      setFailures((prev) => [...prev, ...result.failures.map(
        (item) => `${item.mediaId}: ${item.message}`
      )].slice(-20));
    }
    cursor.current = result.nextCursor;
    if (result.done || !result.processed) {
      setRunning(false);
    } else {
      submitBatch(result.nextCursor);
    }
  }, [fetcher.data, fetcher.state, running]);

  const nextWebpBatch = () => {
    const form = new FormData();
    form.set("csrf", csrf);
    form.set("operation", "backfill-webp");
    webpFetcher.submit(form, { method: "post", action: "/admin/media" });
  };

  useEffect(() => {
    const result = webpFetcher.data;
    if (!webpRunning || webpFetcher.state !== "idle" || !result || handledWebp.current === result) return;
    handledWebp.current = result;
    setWebpConverted((count) => count + result.converted);
    if (result.failures?.length) setWebpFailures((previous) => [
      ...previous, ...result.failures
    ].slice(-20));
    // Retry only while progress is made. Repeated failures need manual review.
    if (result.remaining > 0 && result.converted > 0) {
      nextWebpBatch();
    } else {
      setWebpRunning(false);
    }
  }, [webpFetcher.data, webpFetcher.state, webpRunning]);

  const startWebp = () => {
    handledWebp.current = undefined;
    setWebpConverted(0);
    setWebpFailures([]);
    setWebpRunning(true);
    nextWebpBatch();
  };

  const start = () => {
    handled.current = undefined;
    cursor.current = "";
    setProcessed(0);
    setCreated(0);
    setFailures([]);
    setRunning(true);
    submitBatch("");
  };

  return (
    <section className="card border-0 shadow-sm mb-4" aria-label="Optimize staging images">
      <div className="card-body">
        <h2 className="h5">Optimize staging R2 images for all screens</h2>
        <div className="border rounded p-3 mb-3">
          <p className="mb-2 small">
            Convert remaining JPEG, PNG and GIF originals to WebP in batches of four,
            keeping existing media IDs and legacy URLs. Safe to resume.
          </p>
          <button type="button" className="btn btn-outline-primary btn-sm"
            onClick={startWebp} disabled={webpRunning || webpFetcher.state !== "idle"}>
            {webpRunning ? "Converting older images…" : "Convert remaining originals to WebP"}
          </button>
          {webpFetcher.data && (
            <p className="small mt-2 mb-0" role="status">
              {webpConverted} converted this run · {webpFetcher.data.remaining} non-WebP media left.
            </p>
          )}
          {webpFailures.length > 0 && <details className="mt-2 small">
            <summary>{webpFailures.length} conversion errors (originals retained)</summary>
            <ul>{webpFailures.map((message, i) => <li key={i}>{message}</li>)}</ul>
          </details>}
        </div>
        <p className="small text-secondary mb-3">
          Generates persistent mobile (480px), tablet (960px), and desktop (1600px)
          WebP variants in R2, records them in D1, and preserves every original.
          The operation is resumable and only runs while this page is open.
        </p>
        <button type="button" className="btn btn-primary" onClick={start} disabled={running || fetcher.state !== "idle"}>
          {running ? "Optimizing…" : "Start / retry optimization"}
        </button>
        {running && (
          <button type="button" className="btn btn-outline-secondary ms-2"
            onClick={() => setRunning(false)}>Stop after current batch</button>
        )}
        <p className="small mt-3 mb-1" role="status">
          {processed} source images inspected · {created} new variants created.
          {running ? " Working through staging media…" : ""}
        </p>
        {failures.length > 0 && (
          <details className="small mt-2">
            <summary>{failures.length} recent transformation errors — originals remain available</summary>
            <ul className="mt-2">{failures.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </details>
        )}
        {fetcher.state === "idle" && !running && processed > 0 && (
          <p className="small text-secondary mb-0">
            Finished or paused. Re-running is safe: existing variants are skipped.
          </p>
        )}
      </div>
    </section>
  );
}
