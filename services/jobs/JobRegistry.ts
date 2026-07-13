// services/jobs/JobRegistry.ts
// ── Background Job Registry ──────────────────────────────────────
//
// Maps background metrics to their refresh jobs and wires them into
// the Scheduler. Each job corresponds to a `b.*` namespace metric
// and runs on its own schedule.
//
// Schedule overview:
//   Social mentions     — hourly      (b.social.mentions)
//   GSC daily pull      — daily 06:00 (b.gsc.daily)
//   GA4 daily pull      — daily 06:30 (b.ga4.daily)
//   Blacklist check     — daily 07:00 (b.blacklist)
//   Core update detect  — every 4h    (b.core.update.events)
//   Backlinks refresh   — weekly Sun  (b.backlinks.refresh)
//   SERP scrape         — weekly Mon  (b.serp.scrape)
//   AI citation harness — weekly Tue  (b.ai.harness)
//   CrUX monthly        — monthly 1st (b.crux.monthly)

import { Scheduler, type JobConfig } from './Scheduler';
import { BacklinksRefreshJob } from './jobs/BacklinksRefreshJob';
import { GscDailyPullJob } from './jobs/GscDailyPullJob';
import { Ga4DailyPullJob } from './jobs/Ga4DailyPullJob';
import { CruxMonthlyJob } from './jobs/CruxMonthlyJob';
import { SerpScrapeJob } from './jobs/SerpScrapeJob';
import { AiCitationHarnessJob } from './jobs/AiCitationHarnessJob';
import { SocialMentionsJob } from './jobs/SocialMentionsJob';
import { BlacklistCheckJob } from './jobs/BlacklistCheckJob';
import { CoreUpdateDetectorJob } from './jobs/CoreUpdateDetectorJob';

// ── Job Definitions ──────────────────────────────────────────────

interface JobDefinition {
  config: Omit<JobConfig, 'handler'>;
  createHandler: () => () => Promise<void>;
}

const JOB_DEFINITIONS: JobDefinition[] = [
  {
    config: {
      id: 'gsc-daily',
      name: 'GSC Daily Pull',
      schedule: { type: 'cron', cron: '0 6 * * *' },
      timeoutMs: 600_000,
    },
    createHandler: () => {
      const job = new GscDailyPullJob();
      return () => job.run();
    },
  },
  {
    config: {
      id: 'ga4-daily',
      name: 'GA4 Daily Pull',
      schedule: { type: 'cron', cron: '30 6 * * *' },
      timeoutMs: 600_000,
    },
    createHandler: () => {
      const job = new Ga4DailyPullJob();
      return () => job.run();
    },
  },
  {
    config: {
      id: 'blacklist-daily',
      name: 'Blacklist Check',
      schedule: { type: 'cron', cron: '0 7 * * *' },
      timeoutMs: 300_000,
    },
    createHandler: () => {
      const job = new BlacklistCheckJob();
      return () => job.run();
    },
  },
  {
    config: {
      id: 'core-update-detect',
      name: 'Core Update Detector',
      schedule: { type: 'cron', cron: '0 */4 * * *' },
      timeoutMs: 300_000,
    },
    createHandler: () => {
      const job = new CoreUpdateDetectorJob();
      return () => job.run();
    },
  },
  {
    config: {
      id: 'social-mentions-hourly',
      name: 'Social Mentions Monitor',
      schedule: { type: 'cron', cron: '0 * * * *' },
      timeoutMs: 300_000,
    },
    createHandler: () => {
      const job = new SocialMentionsJob();
      return () => job.run();
    },
  },
  {
    config: {
      id: 'backlinks-weekly',
      name: 'Backlinks Refresh',
      schedule: { type: 'cron', cron: '0 3 * * 0' },
      timeoutMs: 600_000,
    },
    createHandler: () => new BacklinksRefreshJob().run.bind(new BacklinksRefreshJob()),
  },
  {
    config: {
      id: 'serp-scrape-weekly',
      name: 'SERP Scrape',
      schedule: { type: 'cron', cron: '0 4 * * 1' },
      timeoutMs: 1_800_000,
    },
    createHandler: () => new SerpScrapeJob().run.bind(new SerpScrapeJob()),
  },
  {
    config: {
      id: 'ai-citation-weekly',
      name: 'AI Citation Harness',
      schedule: { type: 'cron', cron: '0 5 * * 2' },
      timeoutMs: 900_000,
    },
    createHandler: () => new AiCitationHarnessJob().run.bind(new AiCitationHarnessJob()),
  },
  {
    config: {
      id: 'crux-monthly',
      name: 'CrUX Monthly Refresh',
      schedule: { type: 'cron', cron: '0 2 1 * *' },
      timeoutMs: 600_000,
    },
    createHandler: () => new CruxMonthlyJob().run.bind(new CruxMonthlyJob()),
  },
];

// ── Registry ─────────────────────────────────────────────────────

export class JobRegistry {
  private scheduler: Scheduler;

  constructor() {
    this.scheduler = new Scheduler('seesby:job-scheduler');
  }

  /**
   * Initialize all jobs by registering them with the scheduler.
   * Does NOT start the scheduler — call `start()` separately.
   */
  init(): void {
    for (const def of JOB_DEFINITIONS) {
      const handler = def.createHandler();
      this.scheduler.register({
        ...def.config,
        handler,
        enabled: true,
      });
    }
  }

  /** Get the underlying scheduler instance. */
  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * List all registered jobs with their schedules.
   * Returns a read-only snapshot of the registry state.
   */
  listJobs(): Array<{ id: string; name: string; schedule: string; enabled: boolean }> {
    return this.scheduler.getStatus().map((s) => {
      const def = JOB_DEFINITIONS.find((d) => d.config.id === s.id);
      return {
        id: s.id,
        name: s.name,
        schedule: def?.config.schedule.cron ?? def?.config.schedule.type ?? 'unknown',
        enabled: s.enabled,
      };
    });
  }
}
