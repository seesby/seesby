import React, { useMemo, useState } from 'react';
import { useEditorialCalendar } from '../selectors/useEditorialCalendar';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { MODE_ACCENT, STATUS } from '../../_shared/tokens';

type ViewMode = 'month' | 'week' | 'day';

const PANEL = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2 px-3 pt-2.5';
const ACCENT = MODE_ACCENT.content; // amber for content mode

const STATUS_DOT: Record<string, string> = {
  published: 'bg-[#22c55e]',
  draft: 'bg-[#f59e0b]',
  scheduled: 'bg-[#3b82f6]',
};

function qualityColor(avg: number): string {
  if (avg >= 75) return '#22c55e';
  if (avg >= 50) return '#f59e0b';
  if (avg >= 25) return '#ef4444';
  return 'bg-[var(--brand-surface-4)]';
}

export default function ContentCalendarView() {
  const entries = useEditorialCalendar();
  const { pages = [], setSelectedPageUrl, setInspectorOpen } = useSeoCrawler() as any;
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState('all');

  const html = useMemo(() => pages.filter((p: any) => p.isHtmlPage !== false), [pages]);

  // All sections (clusters/categories)
  const sections = useMemo(() => {
    const set = new Set<string>();
    html.forEach((p: any) => {
      const s = p.topicCluster ?? p.cluster ?? p.category ?? '';
      if (s) set.add(s);
    });
    return ['all', ...[...set].sort()];
  }, [html]);

  // Filter entries by section
  const filtered = useMemo(() => {
    if (sectionFilter === 'all') return entries;
    return entries.filter(e => {
      const page = html.find((p: any) => p.url === e.url);
      const s = page?.topicCluster ?? page?.cluster ?? page?.category ?? '';
      return s === sectionFilter;
    });
  }, [entries, html, sectionFilter]);

  // ─── Month grid data ──────────────────────────────────────────────────

  const monthData = useMemo(() => {
    const start = new Date(`${month}-01`);
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const weekdayOffset = start.getDay();
    const grid: Record<number, typeof filtered> = {};
    for (let i = 1; i <= daysInMonth; i++) grid[i] = [];
    for (const e of filtered) {
      const d = new Date(e.publishedAt);
      if (d.getFullYear() !== start.getFullYear() || d.getMonth() !== start.getMonth()) continue;
      grid[d.getDate()]!.push(e);
    }
    return { grid, daysInMonth, weekdayOffset, start };
  }, [filtered, month]);

  // ─── Week data ────────────────────────────────────────────────────────

  const weekData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const days: { date: Date; entries: typeof filtered }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        date: d,
        entries: filtered.filter(e => {
          const ed = new Date(e.publishedAt);
          return ed.toDateString() === d.toDateString();
        }),
      });
    }
    return days;
  }, [filtered]);

  // ─── Day data ─────────────────────────────────────────────────────────

  const dayData = useMemo(() => {
    const now = new Date();
    const today = selectedDay
      ? new Date(`${month}-${String(selectedDay).padStart(2, '0')}`)
      : now;
    return filtered.filter(e => {
      const ed = new Date(e.publishedAt);
      return ed.toDateString() === today.toDateString();
    });
  }, [filtered, month, selectedDay]);

  // ─── Publishing cadence per section ───────────────────────────────────

  const cadence = useMemo(() => {
    const sectionDays: Record<string, Set<string>> = {};
    const sectionCount: Record<string, number> = {};
    for (const e of entries) {
      const page = html.find((p: any) => p.url === e.url);
      const s = page?.topicCluster ?? page?.cluster ?? page?.category ?? 'other';
      if (!sectionDays[s]) sectionDays[s] = new Set();
      const day = new Date(e.publishedAt).toDateString();
      sectionDays[s].add(day);
      sectionCount[s] = (sectionCount[s] || 0) + 1;
    }
    return Object.entries(sectionCount)
      .map(([name, count]) => {
        const days = sectionDays[name]?.size ?? 1;
        const perDay = count / Math.max(days, 1);
        const total = entries.length;
        const pct = total > 0 ? (count / total) * 100 : 0;
        const underPublished = perDay < 1;
        return { name, count, perDay, pct, underPublished };
      })
      .sort((a, b) => b.perDay - a.perDay)
      .slice(0, 8);
  }, [entries, html]);

  // ─── News-specific checks ─────────────────────────────────────────────

  const newsChecks = useMemo(() => {
    const recent = html.filter((p: any) => {
      const d = p.lastModified ?? p.publishedAt;
      if (!d) return false;
      const age = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60);
      return age < 48;
    });
    const totalRecent = recent.length;
    const inNewsSitemap = recent.filter((p: any) => p.inNewsSitemap ?? p.isNewsArticle).length;
    const withSchema = recent.filter((p: any) =>
      p.schemaTypes?.includes('NewsArticle') || p.schemaTypes?.includes('Article')
    ).length;
    const withByline = html.filter((p: any) => p.hasByline || p.author).length;
    const withUpdatedDate = html.filter((p: any) => p.updatedDateVisible || p.lastModified).length;

    return {
      sitemap: totalRecent > 0 ? Math.round((inNewsSitemap / totalRecent) * 100) : 0,
      sitemapMissing: totalRecent - inNewsSitemap,
      schema: totalRecent > 0 ? Math.round((withSchema / totalRecent) * 100) : 0,
      byline: html.length > 0 ? Math.round((withByline / html.length) * 100) : 0,
      bylineMissing: html.length - withByline,
      updatedDate: html.length > 0 ? Math.round((withUpdatedDate / html.length) * 100) : 0,
      totalRecent,
    };
  }, [html]);

  const today = new Date();
  const isCurrentMonth = month === today.toISOString().slice(0, 7);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-4 grid grid-cols-12 gap-3 auto-rows-min">
      {/* Controls — full width */}
      <div className={`${PANEL} col-span-12`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-0.5 bg-[var(--brand-surface-2)] rounded p-0.5">
            {(['month', 'week', 'day'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`h-[26px] px-3.5 text-[11px] rounded transition-colors ${
                  viewMode === v ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)] hover:text-[var(--brand-text-mid)]'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {viewMode === 'month' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const d = new Date(`${month}-01`);
                    d.setMonth(d.getMonth() - 1);
                    setMonth(d.toISOString().slice(0, 7));
                  }}
                  className="text-[11px] text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] px-2 py-0.5 rounded hover:bg-[var(--brand-surface-3)]"
                >
                  &larr;
                </button>
                <span className="text-[12px] text-[var(--brand-text-strong)] font-medium w-[130px] text-center">
                  {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const d = new Date(`${month}-01`);
                    d.setMonth(d.getMonth() + 1);
                    setMonth(d.toISOString().slice(0, 7));
                  }}
                  className="text-[11px] text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] px-2 py-0.5 rounded hover:bg-[var(--brand-surface-3)]"
                >
                  &rarr;
                </button>
              </div>
            )}
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="h-[26px] px-2.5 text-[11px] bg-[var(--brand-surface-2)] text-[var(--brand-text-mid)] border border-[var(--brand-surface-3)] rounded outline-none cursor-pointer"
            >
              {sections.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All sections' : s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className={`${PANEL} col-span-12 lg:col-span-8`}>
        {viewMode === 'month' ? (
          <MonthGrid
            data={monthData}
            isCurrentMonth={isCurrentMonth}
            today={today}
            selectedDay={selectedDay}
            onSelectDay={d => setSelectedDay(selectedDay === d ? null : d)}
            onSelectPage={setSelectedPageUrl}
            onOpenInspector={setInspectorOpen}
          />
        ) : viewMode === 'week' ? (
          <WeekGrid
            days={weekData}
            today={today}
            onSelectPage={setSelectedPageUrl}
            onOpenInspector={setInspectorOpen}
          />
        ) : (
          <DayView
            entries={dayData}
            date={selectedDay ? new Date(`${month}-${String(selectedDay).padStart(2, '0')}`) : today}
            onSelectPage={setSelectedPageUrl}
            onOpenInspector={setInspectorOpen}
          />
        )}
        {/* Legend */}
        <div className="flex items-center gap-3 px-3 pb-2 pt-1">
          {Object.entries(STATUS_DOT).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
              <span className="text-[9px] text-[var(--brand-text-faint)] capitalize">{key}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS.good }} />
            <span className="text-[9px] text-[var(--brand-text-faint)]">75+</span>
            <span className="w-1.5 h-1.5 rounded-full ml-1" style={{ background: STATUS.warn }} />
            <span className="text-[9px] text-[var(--brand-text-faint)]">50-74</span>
            <span className="w-1.5 h-1.5 rounded-full ml-1" style={{ background: STATUS.bad }} />
            <span className="text-[9px] text-[var(--brand-text-faint)]">&lt;50</span>
          </div>
        </div>
      </div>

      {/* Publishing cadence */}
      <div className={`${PANEL} col-span-12 lg:col-span-4`}>
        <div className={LABEL}>Publishing cadence</div>
        <div className="space-y-2 px-3 pb-3">
          {cadence.map(s => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--brand-text-mid)] w-[90px] truncate shrink-0">{s.name}</span>
              <div className="flex-1 h-[7px] bg-[var(--brand-surface-3)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, s.pct)}%`,
                    background: s.underPublished ? STATUS.warn : STATUS.good,
                  }}
                />
              </div>
              <span className="text-[9px] text-[var(--brand-text-faint)] w-[48px] text-right shrink-0 tabular-nums">
                {s.perDay.toFixed(1)}/d
              </span>
              {s.underPublished && (
                <span className="text-[9px] text-[#f59e0b] shrink-0">low</span>
              )}
            </div>
          ))}
          {cadence.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-1">
              <div className="text-[11px] text-[var(--brand-text-faint)]">No sections found</div>
              <div className="text-[9px] text-[var(--brand-border-2)]">Assign topic clusters to pages to see cadence data</div>
            </div>
          )}
        </div>
      </div>

      {/* News-specific checks — full width */}
      <div className={`${PANEL} col-span-12`}>
        <div className={LABEL}>News-specific checks</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-3 pb-3 pt-1">
          <CheckRow
            label="In news sitemap"
            value={`${newsChecks.sitemap}%`}
            detail={`${newsChecks.sitemapMissing} missing`}
            ok={newsChecks.sitemap >= 90}
          />
          <CheckRow
            label="NewsArticle schema"
            value={`${newsChecks.schema}%`}
            ok={newsChecks.schema >= 90}
          />
          <CheckRow
            label="Byline + author"
            value={`${newsChecks.byline}%`}
            detail={`${newsChecks.bylineMissing} missing`}
            ok={newsChecks.byline >= 80}
          />
          <CheckRow
            label="Updated-date visible"
            value={`${newsChecks.updatedDate}%`}
            ok={newsChecks.updatedDate >= 80}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Month Grid ──────────────────────────────────────────────────────────

function MonthGrid({
  data, isCurrentMonth, today, selectedDay, onSelectDay, onSelectPage, onOpenInspector,
}: {
  data: { grid: Record<number, any[]>; daysInMonth: number; weekdayOffset: number; start: Date };
  isCurrentMonth: boolean;
  today: Date;
  selectedDay: number | null;
  onSelectDay: (d: number) => void;
  onSelectPage: (url: string) => void;
  onOpenInspector: (open: boolean) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[var(--brand-surface-3)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] text-center py-2 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-[var(--brand-surface-0)]">
        {Array.from({ length: data.weekdayOffset }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[72px] bg-[var(--brand-surface-1)] border border-[var(--brand-surface-2)] border-l-0 border-t-0 first:border-l first:border-t" />
        ))}
        {Array.from({ length: data.daysInMonth }).map((_, i) => {
          const day = i + 1;
          const posts = data.grid[day] ?? [];
          const isSelected = selectedDay === day;
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`relative min-h-[72px] p-2 text-left transition-colors border border-[var(--brand-surface-2)] border-l-0 border-t-0 ${
                isSelected ? 'bg-[var(--brand-surface-3)]' :
                isToday ? 'bg-[var(--brand-surface-2)]' :
                'hover:bg-[var(--brand-surface-1)]'
              }`}
            >
              <span className={`text-[11px] tabular-nums ${
                isToday ? 'text-[var(--brand-text-strong)] font-semibold' : 'text-[var(--brand-text-faint)]'
              }`}>{day}</span>
              {isToday && (
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              )}
              {posts.length > 0 && (
                <>
                  <div className="text-[9px] text-[var(--brand-text-mid)] mt-1">{posts.length} post{posts.length > 1 ? 's' : ''}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {posts.slice(0, 6).map((p: any) => (
                      <span
                        key={p.id}
                        className="w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform"
                        style={{ background: qualityColor(p.qualityScore ?? 50) }}
                        onClick={(e) => { e.stopPropagation(); onSelectPage(p.url); onOpenInspector(true); }}
                        title={p.title || p.url}
                      />
                    ))}
                    {posts.length > 6 && <span className="text-[8px] text-[var(--brand-text-faint)] leading-none pt-0.5">+{posts.length - 6}</span>}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week Grid ───────────────────────────────────────────────────────────

function WeekGrid({
  days, today, onSelectPage, onOpenInspector,
}: {
  days: { date: Date; entries: any[] }[];
  today: Date;
  onSelectPage: (url: string) => void;
  onOpenInspector: (open: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-2 p-3">
      {days.map(({ date, entries }) => {
        const isToday = date.toDateString() === today.toDateString();
        return (
          <div
            key={date.toDateString()}
            className={`rounded border min-h-[140px] p-2 ${
              isToday ? 'border-[#f59e0b]/30 bg-[var(--brand-surface-2)]' : 'border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] ${isToday ? 'text-[#f59e0b] font-semibold' : 'text-[var(--brand-text-faint)]'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-[11px] tabular-nums ${isToday ? 'text-[var(--brand-text-strong)] font-medium' : 'text-[var(--brand-text-faint)]'}`}>
                {date.getDate()}
              </span>
            </div>
            <div className="space-y-1">
              {entries.slice(0, 6).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => { onSelectPage(p.url); onOpenInspector(true); }}
                  className="w-full text-left px-1.5 py-1 rounded hover:bg-[var(--brand-surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: qualityColor(p.qualityScore ?? 50) }}
                    />
                    <span className="text-[9px] text-[var(--brand-text-mid)] truncate">{p.title || p.url.split('/').pop()}</span>
                  </div>
                </button>
              ))}
              {entries.length > 6 && (
                <span className="text-[8px] text-[var(--brand-text-faint)] pl-3">+{entries.length - 6} more</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────

function DayView({
  entries, date, onSelectPage, onOpenInspector,
}: {
  entries: any[];
  date: Date;
  onSelectPage: (url: string) => void;
  onOpenInspector: (open: boolean) => void;
}) {
  return (
    <div className="p-3">
      <div className="text-[12px] text-[var(--brand-text-mid)] mb-3 pb-2 border-b border-[var(--brand-surface-3)]">
        {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        <span className="ml-2 text-[10px] text-[var(--brand-text-faint)]">{entries.length} post{entries.length !== 1 ? 's' : ''}</span>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map((p: any) => (
            <button
              key={p.id}
              onClick={() => { onSelectPage(p.url); onOpenInspector(true); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-[var(--brand-surface-2)] transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: qualityColor(p.qualityScore ?? 50) }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[var(--brand-text-mid)] truncate">{p.title || p.url}</div>
                <div className="text-[9px] text-[var(--brand-text-faint)]">{p.cluster} · {p.author ?? '—'}</div>
              </div>
              <span className={`text-[10px] tabular-nums shrink-0 ${
                (p.qualityScore ?? 50) >= 75 ? 'text-[#22c55e]' : (p.qualityScore ?? 50) >= 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
              }`}>{p.qualityScore ?? '—'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[120px] gap-1">
          <div className="text-[11px] text-[var(--brand-text-faint)]">No posts on this day</div>
          <div className="text-[9px] text-[var(--brand-border-2)]">Select a day with published content</div>
        </div>
      )}
    </div>
  );
}

// ─── Check Row ───────────────────────────────────────────────────────────

function CheckRow({ label, value, detail, ok }: { label: string; value: string; detail?: string; ok: boolean }) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded bg-[var(--brand-surface-1)]">
      <span className="text-[10px] text-[var(--brand-text-faint)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[14px] text-[var(--brand-text-mid)] font-mono tabular-nums font-medium">{value}</span>
        <span className={`text-[11px] ${ok ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
          {ok ? '\u2713' : '\u26A0'}
        </span>
      </div>
      {detail && <span className="text-[9px] text-[var(--brand-text-faint)]">{detail}</span>}
    </div>
  );
}
