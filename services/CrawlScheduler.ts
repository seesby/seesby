// services/CrawlScheduler.ts
import { CrawlerConfig } from './CrawlerConfigTypes';

const SCHEDULE_CHECK_KEY = 'seesby:schedule-last-check';
const SCHEDULE_INTERVAL = 60 * 1000; // Check every 60 seconds

let intervalId: ReturnType<typeof setInterval> | null = null;

export interface ScheduleCheckResult {
  shouldRun: boolean;
  reason?: string;
}

function getNextRunTime(config: CrawlerConfig): Date | null {
  if (!config.scheduleEnabled) return null;
  
  const now = new Date();
  const [hours, minutes] = (config.scheduleTime || '02:00').split(':').map(Number);
  
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  
  switch (config.scheduleFrequency) {
    case 'daily':
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case 'weekly': {
      const dayMap: Record<string, number> = { 
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
        thursday: 4, friday: 5, saturday: 6 
      };
      const targetDay = dayMap[config.scheduleDay || 'monday'] || 1;
      while (next.getDay() !== targetDay || next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case 'monthly':
      next.setDate(1);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
    default:
      return null;
  }
  return next;
}

function shouldRunNow(config: CrawlerConfig): ScheduleCheckResult {
  if (!config.scheduleEnabled) return { shouldRun: false };
  
  const lastCheck = localStorage.getItem(SCHEDULE_CHECK_KEY);
  const lastRunDate = lastCheck ? new Date(lastCheck) : null;
  const now = new Date();
  const [targetHours, targetMinutes] = (config.scheduleTime || '02:00').split(':').map(Number);
  
  // Check if we're within the target hour (±30 min window)
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetTotalMinutes = targetHours * 60 + targetMinutes;
  
  // Ensure we are around the time, within 30 minutes of target
  if (Math.abs(nowMinutes - targetTotalMinutes) > 30) return { shouldRun: false };
  
  // Check if already ran today/session
  if (lastRunDate && lastRunDate.toDateString() === now.toDateString()) {
    return { shouldRun: false };
  }
  
  // Check day-of-week for weekly
  if (config.scheduleFrequency === 'weekly') {
    const dayMap: Record<string, number> = { 
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
      thursday: 4, friday: 5, saturday: 6 
    };
    const targetDay = dayMap[config.scheduleDay || 'monday'] || 1;
    if (now.getDay() !== targetDay) return { shouldRun: false };
  }
  
  // Check day-of-month for monthly
  if (config.scheduleFrequency === 'monthly' && now.getDate() !== 1) {
    return { shouldRun: false };
  }
  
  return { shouldRun: true, reason: `Scheduled ${config.scheduleFrequency} crawl` };
}

export function startScheduler(
  getConfig: () => CrawlerConfig,
  onTrigger: (reason: string) => void
) {
  if (intervalId) clearInterval(intervalId);
  
  intervalId = setInterval(() => {
    const config = getConfig();
    const result = shouldRunNow(config);
    if (result.shouldRun) {
      localStorage.setItem(SCHEDULE_CHECK_KEY, new Date().toISOString());
      onTrigger(result.reason || 'Scheduled crawl');
    }
  }, SCHEDULE_INTERVAL);
  
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}

export function getNextScheduledRun(config: CrawlerConfig): string | null {
  const next = getNextRunTime(config);
  return next ? next.toISOString() : null;
}
