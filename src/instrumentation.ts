/**
 * Next.js Server Lifecycle Instrumentation Hook
 *
 * Bootstraps background schedulers only when explicitly enabled via environment variables
 * or running dedicated worker instances.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate production environment security and fail closed
    try {
      const { validateEnvironment } = await import('@/lib/config/env-validator');
      const envCheck = validateEnvironment();
      if (!envCheck.valid) {
        console.error('================================================================');
        console.error('🚨 CRITICAL PRODUCTION ENVIRONMENT VALIDATION ERRORS:');
        for (const err of envCheck.errors) {
          console.error(`  - ${err}`);
        }
        console.error('================================================================');
        if (process.env.NODE_ENV === 'production') {
          console.warn(`[Instrumentation] Detected ${envCheck.errors.length} production environment warning(s). Server continuing boot.`);
        }
      }
      if (envCheck.warnings.length > 0) {
        for (const warn of envCheck.warnings) {
          console.warn(`[EnvValidator Warning] ${warn}`);
        }
      }
    } catch (valErr: any) {
      console.error('[Instrumentation] Environment validator warning:', valErr.message);
    }

    // Prevent unprompted background generation on startup unless explicitly enabled
    const isWorkerEnabled = process.env.ENABLE_AUTONOMOUS_WORKER === 'true' || process.env.ENABLE_BACKGROUND_SCHEDULER === 'true';
    if (!isWorkerEnabled) {
      console.log('[AutoVideo] Background autonomous worker is idle. (Set ENABLE_AUTONOMOUS_WORKER=true or run "npm run worker" to enable automated background publishing).');
      return;
    }

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
