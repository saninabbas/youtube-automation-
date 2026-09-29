/**
 * Next.js Server Lifecycle Instrumentation Hook
 *
 * Automatically bootstraps background schedulers and queue processors
 * when the production Node.js server starts up.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { publishingScheduler } = await import('@/lib/scheduler');
      const pollIntervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || '30000', 10);
      console.log(`[AutoVideo] 🚀 Initializing Autonomous Publishing Worker Daemon (${pollIntervalMs / 1000}s interval)...`);
      publishingScheduler.start(pollIntervalMs);
    } catch (err: any) {
      console.error('[AutoVideo] Failed to initialize background scheduler in instrumentation:', err.message);
    }
  }
}
