import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every page is prerendered at build time, so the read-only static-assets cache is enough (no R2 bucket).
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
