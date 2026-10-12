import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import queueCache from "@opennextjs/cloudflare/overrides/queue/queue-cache";

/**
 * Cloudflare adapter config.
 *
 * ISR pages persist to R2. Without an incremental cache they were re-rendered
 * in the Worker on every request, which made `export const revalidate` on the
 * detail pages decorative — the pages were correct but nothing was reused.
 *
 * R2 rather than KV: KV is eventually consistent and the adapter's docs advise
 * against it for caching. The static-assets cache is read-only, so it cannot
 * hold pages rendered on demand, and `generateStaticParams` returns [] — none
 * of the detail pages are prerendered at build time.
 *
 * The regional cache sits in front of R2 so a hit is served from the colo
 * rather than a bucket round trip. `long-lived` is the documented mode for an
 * app that revalidates: ISR responses are reused for up to 30 minutes and
 * refreshed in the background.
 *
 * `enableCacheInterception` serves a cached ISR page without invoking
 * NextServer at all, which is most of the work a cached hit was still doing.
 * Two constraints, both fine here: it does not support PPR, which this app does
 * not use, and it consults the tag cache to decide whether a path is stale.
 *
 * The queue is what makes time-based revalidation work, and it is not
 * optional. When a cached page goes stale, the adapter hands its path to the
 * queue to re-render in the background. Left unset, the queue defaults to
 * OpenNext's "dummy" queue, which throws by design — so every detail page
 * served fine until its first revalidation, then returned a bare
 * "Internal Server Error" ("FatalError: Dummy queue is not implemented" in the
 * Worker logs) for as long as its stale entry sat in R2. The Durable Object
 * queue is the one the adapter recommends for production; it de-dupes across
 * isolates and re-renders through WORKER_SELF_REFERENCE. Its binding and
 * migration live in wrangler.jsonc. queueCache skips re-sending a path the
 * colo has queued in the last few seconds, so a burst of requests for one
 * stale page queues a single revalidation.
 *
 * There is no tag cache, deliberately — along with `cachePurge`, it serves
 * on-demand revalidation, and the only `revalidatePath` calls here target
 * /profile and /watchlist, which are dynamic and never cached. Nothing
 * invalidates the detail pages by tag; they revalidate on a timer through the
 * queue above. Add a tag cache before introducing revalidateTag, or the
 * intercepted responses will not know they are stale.
 *
 * Middleware is unaffected: it matches only /watchlist, /profile and
 * /auth/callback, all dynamic, so interception never has a cached response to
 * return ahead of it.
 */
export default defineCloudflareConfig({
  enableCacheInterception: true,
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),
  queue: queueCache(doQueue),
});
