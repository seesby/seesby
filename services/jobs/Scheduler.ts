// services/jobs/Scheduler.ts
// ── Background Job Scheduler ───────────────────────────────────────
//
// Cron-like job scheduler with persistence. Runs on both client
// (localStorage) and server (in-memory). Uses setTimeout to avoid
// interval drift. Supports cron expressions, fixed intervals, and
// one-shot jobs with retry logic and timeout enforcement.
//
// Cron format: minute hour dayOfMonth month dayOfWeek
//   Fields:    *     *    *          *     *
// Examples:    "0 2 * * *"    = daily at 02:00
//              "0 */6 * * *"  = every 6 hours
//              "30 1 * * 1"   = Monday at 01:30
//              "0 0 1 * *"    = first of each month at midnight

// ── Types ─────────────────────────────────────────────────────────

export interface JobConfig {
  /** Unique identifier for this job. */
  id: string;
  /** Human-readable job name. */
  name: string;
  /** Schedule configuration. */
  schedule: {
    type: 'cron' | 'interval' | 'once';
    /** Cron expression (5 fields: min hour dom month dow). */
    cron?: string;
    /** Interval in milliseconds (for type 'interval'). */
    intervalMs?: number;
  };
  /** The function to execute when the job runs. */
  handler: () => Promise<void>;
  /** Whether the job is enabled. Defaults to true. */
  enabled?: boolean;
  /** ISO timestamp of the last completed run. */
  lastRun?: string;
  /** ISO timestamp of the next scheduled run. */
  nextRun?: string;
  /** Maximum number of retries on failure. Defaults to 3. */
  retryCount?: number;
  /** Maximum execution time before timeout. Defaults to 300000 (5 min). */
  timeoutMs?: number;
}

export interface JobResult {
  jobId: string;
  status: 'success' | 'failed' | 'timeout' | 'skipped';
  durationMs: number;
  error?: string;
  timestamp: string;
}

/** Serializable job state (excludes handler function). */
interface SerializableJobState {
  id: string;
  name: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  retryCount: number;
  timeoutMs: number;
}

// ── Storage Abstraction ───────────────────────────────────────────

/** Adapter for persisting scheduler state. Works with localStorage or any key-value store. */
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Creates a storage adapter from the environment.
 * On the server side we use an in-memory adapter; on the client we use localStorage.
 */
function createDefaultStorage(): StorageAdapter {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  // In-memory fallback for server / Node environments
  const mem = new Map<string, string>();
  return {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => { mem.set(key, value); },
  };
}

// ── Scheduler ─────────────────────────────────────────────────────

export class Scheduler {
  private jobs: Map<string, JobConfig> = new Map();
  private running: Set<string> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private storageKey: string;
  private storage: StorageAdapter;
  private onJobComplete?: (result: JobResult) => void;

  constructor(storageKey: string = 'seesby:job-scheduler', storage?: StorageAdapter) {
    this.storageKey = storageKey;
    this.storage = storage ?? createDefaultStorage();
    this.load();
  }

  /** Register a callback that fires after every job execution. */
  setOnComplete(callback: (result: JobResult) => void): void {
    this.onJobComplete = callback;
  }

  /**
   * Register a new job.
   * If a job with the same ID already exists, it is replaced (timer is cleared first).
   */
  register(config: JobConfig): void {
    const existing = this.jobs.get(config.id);
    if (existing) {
      this.clearTimer(config.id);
    }

    const job: JobConfig = {
      enabled: config.enabled !== false,
      retryCount: config.retryCount ?? 3,
      timeoutMs: config.timeoutMs ?? 300_000,
      ...config,
    };

    this.jobs.set(job.id, job);
    this.save();

    if (job.enabled) {
      this.scheduleNext(job);
    }
  }

  /** Remove a job entirely (stops its timer). */
  unregister(jobId: string): void {
    this.clearTimer(jobId);
    this.jobs.delete(jobId);
    this.save();
  }

  /** Enable a previously disabled job. */
  enable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.enabled = true;
    this.save();
    this.scheduleNext(job);
  }

  /** Disable a job (cancels its pending timer). */
  disable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    this.clearTimer(jobId);
    job.enabled = false;
    this.save();
  }

  /**
   * Start the scheduler — schedules all enabled jobs.
   * Safe to call multiple times (idempotent).
   */
  start(): void {
    for (const job of this.jobs.values()) {
      if (job.enabled && !this.running.has(job.id)) {
        this.scheduleNext(job);
      }
    }
  }

  /** Stop the scheduler — cancels all pending timers. Jobs remain registered. */
  stop(): void {
    for (const job of this.jobs.values()) {
      this.clearTimer(job.id);
    }
  }

  /**
   * Manually trigger a job immediately, bypassing the schedule.
   * Returns the result of the execution.
   */
  async trigger(jobId: string): Promise<JobResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return {
        jobId,
        status: 'skipped',
        durationMs: 0,
        error: `Job "${jobId}" not registered`,
        timestamp: new Date().toISOString(),
      };
    }
    return this.runJob(job);
  }

  /** Get the current status of all registered jobs. */
  getStatus(): Array<{
    id: string;
    name: string;
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
    running: boolean;
  }> {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      name: job.name,
      enabled: job.enabled !== false,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      running: this.running.has(job.id),
    }));
  }

  // ── Internal: Scheduling Logic ──────────────────────────────────

  /** Compute the next run time for a job and set its timer. */
  private scheduleNext(job: JobConfig): void {
    this.clearTimer(job.id);

    let nextMs: number;

    if (job.schedule.type === 'interval' && job.schedule.intervalMs) {
      // For intervals, fire after the interval from now
      nextMs = job.schedule.intervalMs;
    } else if (job.schedule.type === 'cron' && job.schedule.cron) {
      const nextDate = this.computeNextCronDate(job.schedule.cron);
      if (!nextDate) {
        console.warn(`[Scheduler] Invalid cron expression for job "${job.id}": ${job.schedule.cron}`);
        return;
      }
      nextMs = nextDate.getTime() - Date.now();
      // Ensure non-negative (cron is in the past — schedule for next period)
      if (nextMs < 0) nextMs = 0;
    } else if (job.schedule.type === 'once') {
      // One-shot: if never run, schedule immediately; otherwise skip
      if (job.lastRun) return;
      nextMs = 0;
    } else {
      return;
    }

    job.nextRun = new Date(Date.now() + nextMs).toISOString();
    this.save();

    const timer = setTimeout(async () => {
      this.timers.delete(job.id);
      const result = await this.runJob(job);

      // Reschedule completed jobs (except one-shots)
      if (job.schedule.type !== 'once') {
        this.scheduleNext(job);
      }

      this.onJobComplete?.(result);
    }, nextMs);

    this.timers.set(job.id, timer);
  }

  /**
   * Execute a job with timeout and retry logic.
   * On failure, retries up to `retryCount` times before recording a final failure.
   */
  private async runJob(job: JobConfig): Promise<JobResult> {
    const maxRetries = job.retryCount ?? 3;
    const timeoutMs = job.timeoutMs ?? 300_000;

    // Prevent overlapping runs of the same job
    if (this.running.has(job.id)) {
      return {
        jobId: job.id,
        status: 'skipped',
        durationMs: 0,
        error: 'Job is already running',
        timestamp: new Date().toISOString(),
      };
    }

    this.running.add(job.id);
    const startTime = performance.now();
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.withTimeout(job.handler(), timeoutMs);

        const durationMs = Math.round(performance.now() - startTime);
        job.lastRun = new Date().toISOString();
        this.save();

        this.running.delete(job.id);

        return {
          jobId: job.id,
          status: 'success',
          durationMs,
          timestamp: job.lastRun,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);

        // Check if it was a timeout
        if (lastError.includes('SCHEDULER_TIMEOUT')) {
          const durationMs = Math.round(performance.now() - startTime);
          // Don't retry on timeout — it's likely a systemic issue
          this.running.delete(job.id);
          return {
            jobId: job.id,
            status: 'timeout',
            durationMs,
            error: `Timed out after ${timeoutMs}ms (attempt ${attempt + 1})`,
            timestamp: new Date().toISOString(),
          };
        }

        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30_000);
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries exhausted
    const durationMs = Math.round(performance.now() - startTime);
    this.running.delete(job.id);

    return {
      jobId: job.id,
      status: 'failed',
      durationMs,
      error: `Failed after ${maxRetries + 1} attempts: ${lastError}`,
      timestamp: new Date().toISOString(),
    };
  }

  /** Race a promise against a timeout. */
  private withTimeout<T>(promise: T | Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('SCHEDULER_TIMEOUT: Job exceeded maximum execution time'));
      }, ms);

      Promise.resolve(promise).then(
        (val) => { clearTimeout(timer); resolve(val); },
        (err) => { clearTimeout(timer); reject(err); },
      );
    });
  }

  private clearTimer(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Internal: Persistence ───────────────────────────────────────

  private save(): void {
    try {
      const states: [string, SerializableJobState][] = [];
      for (const [id, job] of this.jobs) {
        states.push([
          id,
          {
            id: job.id,
            name: job.name,
            enabled: job.enabled !== false,
            lastRun: job.lastRun,
            nextRun: job.nextRun,
            retryCount: job.retryCount ?? 3,
            timeoutMs: job.timeoutMs ?? 300_000,
          },
        ]);
      }
      this.storage.setItem(this.storageKey, JSON.stringify(states));
    } catch {
      // Storage quota exceeded or unavailable — degrade silently
    }
  }

  private load(): void {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as [string, SerializableJobState][];
      for (const [, state] of data) {
        // Restore metadata into the jobs map (handler is not persisted)
        this.jobs.set(state.id, {
          id: state.id,
          name: state.name,
          schedule: { type: 'interval' }, // placeholder, overwritten by register()
          handler: async () => {},
          enabled: state.enabled,
          lastRun: state.lastRun,
          nextRun: state.nextRun,
          retryCount: state.retryCount,
          timeoutMs: state.timeoutMs,
        });
      }
    } catch {
      // Corrupt data — start fresh
    }
  }

  // ── Internal: Cron Parser ───────────────────────────────────────

  /**
   * Parse a 5-field cron expression and return the next matching Date.
   *
   * Supports:
   *   star       — any value (wildcard)
   *   N          — exact value
   *   N/M        — every M starting at N (e.g. star/15 = every 15 min)
   *   N-L        — range from N to L (e.g. 1-5 = Mon-Fri)
   *   N,L,M      — list of values
   */
  private computeNextCronDate(expression: string): Date | null {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return null;

    const [minExpr, hourExpr, domExpr, monthExpr, dowExpr] = parts;

    // Try the next 366 days to find a match
    const now = new Date();
    const start = new Date(now);
    start.setSeconds(0);
    start.setMilliseconds(0);
    // Start checking from the next minute
    start.setMinutes(start.getMinutes() + 1);

    const maxIterations = 366 * 24 * 60; // worst case: check every minute for a year
    const candidate = new Date(start);

    for (let i = 0; i < maxIterations; i++) {
      if (
        this.matchesField(candidate.getMinutes(), minExpr, 0, 59) &&
        this.matchesField(candidate.getHours(), hourExpr, 0, 23) &&
        this.matchesField(candidate.getDate(), domExpr, 1, 31) &&
        this.matchesField(candidate.getMonth() + 1, monthExpr, 1, 12) &&
        this.matchesField(candidate.getDay(), dowExpr, 0, 6)
      ) {
        return candidate;
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    return null;
  }

  /** Check if a numeric value matches a cron field expression. */
  private matchesField(value: number, expr: string, min: number, max: number): boolean {
    // Handle comma-separated values
    if (expr.includes(',')) {
      return expr.split(',').some((part) => this.matchesSingleField(value, part.trim(), min, max));
    }
    return this.matchesSingleField(value, expr, min, max);
  }

  /** Check a value against a single (non-comma) field expression. */
  private matchesSingleField(value: number, expr: string, min: number, max: number): boolean {
    // Wildcard
    if (expr === '*') return true;

    // Step: */N or N/M
    const stepMatch = expr.match(/^(\*|\d+)\/(\d+)$/);
    if (stepMatch) {
      const start = stepMatch[1] === '*' ? min : parseInt(stepMatch[1], 10);
      const step = parseInt(stepMatch[2], 10);
      if (step <= 0) return false;
      // Value must be >= start and the difference must be a multiple of step
      return value >= start && value <= max && (value - start) % step === 0;
    }

    // Range: N-L
    const rangeMatch = expr.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const lo = parseInt(rangeMatch[1], 10);
      const hi = parseInt(rangeMatch[2], 10);
      return value >= lo && value <= hi;
    }

    // Exact value
    const num = parseInt(expr, 10);
    if (!isNaN(num)) return value === num;

    return false;
  }
}
