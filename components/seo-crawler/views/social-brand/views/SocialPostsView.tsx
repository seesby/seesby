import React, { useMemo, useState, useCallback } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { usePosts } from '../selectors/usePosts.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { fmtCompact, fmtDate, fmtPct } from '../../_shared/formatters';
import { STATUS } from '../../_shared/tokens';
import type { ColumnDef } from '@tanstack/react-table';

type ViewMode = 'table' | 'calendar';
type CalendarView = 'month' | 'week' | 'day';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SocialPostsView() {
  const list = usePosts();
  const [density] = useDensity();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date('2026-05-21'));
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const platforms = useMemo(() => [...new Set(list.map((p: any) => p.network))].sort(), [list]);
  const types = useMemo(() => [...new Set(list.map((p: any) => p.type))].sort(), [list]);

  const filteredList = useMemo(() => {
    return list.filter((p: any) => {
      if (platformFilter && p.network !== platformFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      return true;
    });
  }, [list, platformFilter, typeFilter]);

  const { rows, columns } = useMemo(() => {
    const rows = filteredList.map((p: any) => ({
      id: p.id,
      text: p.text ?? '',
      network: p.network ?? '',
      publishedAt: p.postedAt ?? p.publishedAt ?? '',
      type: p.type ?? 'text',
      impressions: p.impressions ?? p.reach ?? 0,
      engagement: (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0),
      engRate: p.engagementRate ?? 0,
      shares: p.shares ?? 0,
      saves: p.saves ?? 0,
      ctr: p.ctr ?? 0,
      sentiment: p.sentiment ?? '',
      score: p.score ?? 0,
      status: p.status ?? 'live',
    }));

    const columns: ColumnDef<typeof rows[number]>[] = [
      { accessorKey: 'text', header: 'Post', size: 280, cell: c => <span className="text-[#ddd] text-[11px] line-clamp-1">{String(c.getValue()).slice(0, 60)}</span> },
      { accessorKey: 'network', header: 'Platform', size: 90, cell: c => <span className="text-[10px] uppercase text-[#888]">{String(c.getValue())}</span> },
      { accessorKey: 'publishedAt', header: 'Published', size: 100, cell: c => <span className="text-[11px] text-[#888]">{fmtDate(c.getValue() as string)}</span> },
      { accessorKey: 'type', header: 'Type', size: 80, cell: c => <span className="text-[10px] text-[#888]">{String(c.getValue())}</span> },
      { accessorKey: 'impressions', header: 'Impressions', size: 80, cell: c => <span className="font-mono text-white text-[11px]">{fmtCompact(c.getValue() as number)}</span> },
      { accessorKey: 'engagement', header: 'Engagement', size: 80, cell: c => <span className="font-mono text-white text-[11px]">{fmtCompact(c.getValue() as number)}</span> },
      { accessorKey: 'engRate', header: 'Eng. Rate', size: 70, cell: c => { const v = c.getValue() as number; return <span className="font-mono text-[11px]" style={{ color: v > 0.05 ? STATUS.good : v > 0.02 ? '#888' : '#666' }}>{fmtPct(v)}</span>; } },
      { accessorKey: 'shares', header: 'Shares', size: 60, cell: c => <span className="font-mono text-[#888] text-[11px]">{fmtCompact(c.getValue() as number)}</span> },
      { accessorKey: 'saves', header: 'Saves', size: 60, cell: c => <span className="font-mono text-[#888] text-[11px]">{fmtCompact(c.getValue() as number)}</span> },
      { accessorKey: 'ctr', header: 'CTR', size: 55, cell: c => <span className="font-mono text-[#888] text-[11px]">{fmtPct(c.getValue() as number)}</span> },
      { accessorKey: 'sentiment', header: 'Sentiment', size: 70, cell: c => { const v = String(c.getValue()).toLowerCase(); const color = v === 'positive' ? STATUS.good : v === 'negative' ? STATUS.bad : '#888'; return <span style={{ color }} className="text-[10px]">{v ? v[0].toUpperCase() : '—'}</span>; } },
      { accessorKey: 'score', header: 'Score', size: 55, cell: c => { const v = c.getValue() as number; if (!v) return <span className="text-[#666]">—</span>; return <span className="font-mono text-[11px]" style={{ color: v >= 90 ? STATUS.good : v >= 70 ? '#888' : STATUS.bad }}>✓{v}</span>; } },
      { accessorKey: 'status', header: 'Status', size: 70, cell: c => { const v = String(c.getValue()); const color = v === 'live' ? STATUS.good : v === 'sched' ? '#3b82f6' : v === 'draft' ? '#888' : v === 'pending' ? '#f59e0b' : v === 'failed' ? STATUS.bad : '#888'; return <span className="text-[10px]" style={{ color }}>{v}</span>; } },
    ];
    return { rows, columns };
  }, [filteredList]);

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey as string, label: String((c as any).header) }))
  );

  const navigate = useCallback((direction: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (calendarView === 'month') d.setMonth(d.getMonth() + direction);
      else if (calendarView === 'week') d.setDate(d.getDate() + direction * 7);
      else d.setDate(d.getDate() + direction);
      return d;
    });
  }, [calendarView]);

  const goToToday = useCallback(() => setCurrentDate(new Date('2026-05-21')), []);

  const headerLabel = useMemo(() => {
    if (calendarView === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (calendarView === 'week') {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }, [currentDate, calendarView]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="shrink-0 px-3 py-2 flex items-center gap-3 border-b border-[#1a1a1a]">
        <span className="text-[10px] uppercase text-[#666]">view:</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode('table')} className={`px-2 py-1 text-[10px] rounded ${viewMode === 'table' ? 'bg-[#171717] text-white' : 'text-[#666] hover:text-[#888]'}`}>☰ Table</button>
          <button onClick={() => setViewMode('calendar')} className={`px-2 py-1 text-[10px] rounded ${viewMode === 'calendar' ? 'bg-[#171717] text-white' : 'text-[#666] hover:text-[#888]'}`}>◉ Calendar</button>
        </div>
        {viewMode === 'calendar' && (
          <>
            <span className="text-[#333]">|</span>
            <div className="flex items-center gap-1">
              {(['month', 'week', 'day'] as CalendarView[]).map(v => (
                <button key={v} onClick={() => setCalendarView(v)} className={`px-2 py-1 text-[10px] rounded capitalize ${calendarView === v ? 'bg-[#171717] text-white' : 'text-[#666] hover:text-[#888]'}`}>{v}</button>
              ))}
            </div>
            <span className="text-[#333]">|</span>
            <button onClick={() => navigate(-1)} className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white rounded hover:bg-[#171717]">‹</button>
            <button onClick={goToToday} className="px-2 py-1 text-[10px] text-[#888] hover:text-white rounded hover:bg-[#171717]">Today</button>
            <button onClick={() => navigate(1)} className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white rounded hover:bg-[#171717]">›</button>
            <span className="text-[12px] text-white font-medium">{headerLabel}</span>
          </>
        )}
        <span className="text-[#333]">|</span>
        {platformFilter && (
          <button onClick={() => setPlatformFilter(null)} className="px-2 py-1 text-[10px] rounded bg-[#6366f1]/10 text-[#6366f1] flex items-center gap-1">platform:{platformFilter} ×</button>
        )}
        {typeFilter && (
          <button onClick={() => setTypeFilter(null)} className="px-2 py-1 text-[10px] rounded bg-[#6366f1]/10 text-[#6366f1] flex items-center gap-1">type:{typeFilter} ×</button>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-[#666]">{rows.length} posts</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'table' ? (
          <DataTable key={density} rows={rows} columns={columns} getRowId={r => r.id} density={density} emptyText="No posts synced yet." />
        ) : (
          <div className="flex-1 h-full flex flex-col">
            {calendarView === 'month' && <MonthView currentDate={currentDate} posts={filteredList} selectedPost={selectedPost} onSelectPost={setSelectedPost} />}
            {calendarView === 'week' && <WeekView currentDate={currentDate} posts={filteredList} selectedPost={selectedPost} onSelectPost={setSelectedPost} />}
            {calendarView === 'day' && <DayView currentDate={currentDate} posts={filteredList} selectedPost={selectedPost} onSelectPost={setSelectedPost} />}
          </div>
        )}
      </div>

      {/* Selected post detail */}
      {selectedPost && (
        <div className="shrink-0 border-t border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase" style={{ color: NETWORK_COLORS[selectedPost.network] ?? '#6366f1' }}>{selectedPost.network}</span>
                <span className="text-[10px] text-[#666]">{selectedPost.type}</span>
                <span className="text-[10px]" style={{ color: STATUS[selectedPost.status as keyof typeof STATUS] ?? '#888' }}>{selectedPost.status}</span>
              </div>
              <p className="text-[12px] text-[#ccc] line-clamp-2">{selectedPost.text}</p>
            </div>
            <button onClick={() => setSelectedPost(null)} className="text-[#666] hover:text-white ml-2">✕</button>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-[10px]">
            <span className="text-[#888]">❤ {fmtCompact(selectedPost.likes ?? 0)}</span>
            <span className="text-[#888]">💬 {fmtCompact(selectedPost.comments ?? 0)}</span>
            <span className="text-[#888]">↗ {fmtCompact(selectedPost.shares ?? 0)}</span>
            <span className="text-[#888]">📊 {fmtCompact(selectedPost.impressions ?? 0)}</span>
            {selectedPost.score > 0 && <span className="text-[#888]">✓{selectedPost.score}</span>}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Month View ──────────────────────────────────────────────────────────── */

function MonthView({ currentDate, posts, selectedPost, onSelectPost }: { currentDate: Date; posts: any[]; selectedPost: any; onSelectPost: (p: any) => void }) {
  const today = new Date('2026-05-21');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
  const totalDays = lastDay.getDate();

  const cells = useMemo(() => {
    const result: { date: Date; day: number; isCurrentMonth: boolean; posts: any[] }[] = [];
    // Previous month fill
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLast - i);
      result.push({ date: d, day: prevMonthLast - i, isCurrentMonth: false, posts: getPostsForDate(posts, d) });
    }
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      result.push({ date: d, day: i, isCurrentMonth: true, posts: getPostsForDate(posts, d) });
    }
    // Next month fill
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      result.push({ date: d, day: i, isCurrentMonth: false, posts: getPostsForDate(posts, d) });
    }
    return result;
  }, [year, month, startOffset, totalDays, posts]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#1a1a1a]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="py-1.5 text-center text-[10px] uppercase text-[#666] font-medium">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
        {cells.map((cell, i) => {
          const isToday = cell.date.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className={`border-b border-r border-[#111] p-1 flex flex-col ${
                !cell.isCurrentMonth ? 'bg-[#060606]' : 'bg-[#0a0a0a]'
              } ${isToday ? 'ring-1 ring-inset ring-[#6366f1]/40' : ''}`}
            >
              <div className={`text-[10px] mb-1 ${isToday ? 'text-[#6366f1] font-bold' : cell.isCurrentMonth ? 'text-[#888]' : 'text-[#444]'}`}>
                {cell.day}
              </div>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {cell.posts.slice(0, 3).map((p: any) => (
                  <PostChip key={p.id} post={p} selected={selectedPost?.id === p.id} onClick={() => onSelectPost(p)} />
                ))}
                {cell.posts.length > 3 && (
                  <div className="text-[9px] text-[#666] px-1">+{cell.posts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week View ───────────────────────────────────────────────────────────── */

function WeekView({ currentDate, posts, selectedPost, onSelectPost }: { currentDate: Date; posts: any[]; selectedPost: any; onSelectPost: (p: any) => void }) {
  const today = new Date('2026-05-21');
  const weekStart = getWeekStart(currentDate);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return { date: d, day: DAYS[d.getDay()], posts: getPostsForDate(posts, d) };
    });
  }, [weekStart, posts]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto custom-scrollbar">
      {/* Day headers */}
      <div className="flex sticky top-0 z-10 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="w-12 shrink-0" />
        {weekDays.map(d => {
          const isToday = d.date.toDateString() === today.toDateString();
          return (
            <div key={d.day} className={`flex-1 py-1.5 text-center border-l border-[#111] ${isToday ? 'text-[#6366f1]' : ''}`}>
              <div className="text-[10px] uppercase text-[#666]">{d.day}</div>
              <div className={`text-[14px] font-mono ${isToday ? 'text-[#6366f1] font-bold' : 'text-white'}`}>{d.date.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Time grid */}
      <div className="flex-1 flex min-h-0">
        {/* Time labels */}
        <div className="w-12 shrink-0">
          {hours.map(h => (
            <div key={h} className="h-14 border-b border-[#111] text-[9px] text-[#666] pr-2 text-right leading-[14px]">
              {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
            </div>
          ))}
        </div>
        {/* Day columns */}
        {weekDays.map(d => {
          const isToday = d.date.toDateString() === today.toDateString();
          return (
            <div key={d.day} className={`flex-1 border-l border-[#111] ${isToday ? 'bg-[#6366f1]/[0.02]' : ''}`}>
              {hours.map(h => (
                <div key={h} className="h-14 border-b border-[#111] relative">
                  {d.posts.filter((p: any) => {
                    const pd = new Date(p.postedAt ?? p.publishedAt);
                    return pd.getHours() === h;
                  }).map((p: any) => (
                    <PostChip key={p.id} post={p} selected={selectedPost?.id === p.id} onClick={() => onSelectPost(p)} compact />
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Day View ────────────────────────────────────────────────────────────── */

function DayView({ currentDate, posts, selectedPost, onSelectPost }: { currentDate: Date; posts: any[]; selectedPost: any; onSelectPost: (p: any) => void }) {
  const today = new Date('2026-05-21');
  const isToday = currentDate.toDateString() === today.toDateString();
  const dayPosts = useMemo(() => getPostsForDate(posts, currentDate), [posts, currentDate]);
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6am - 9pm

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dayPosts.forEach((p: any) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
    return counts;
  }, [dayPosts]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day header */}
      <div className="shrink-0 px-3 py-2 border-b border-[#1a1a1a] flex items-center gap-4">
        <div>
          <div className={`text-[14px] font-medium ${isToday ? 'text-[#6366f1]' : 'text-white'}`}>
            {DAYS[currentDate.getDay()]}, {MONTHS[currentDate.getMonth()]} {currentDate.getDate()}
          </div>
          <div className="text-[10px] text-[#666]">{dayPosts.length} posts</div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          {Object.entries(statusCounts).map(([status, count]) => {
            const color = status === 'live' ? STATUS.good : status === 'sched' ? '#3b82f6' : status === 'draft' ? '#888' : status === 'pending' ? '#f59e0b' : status === 'failed' ? STATUS.bad : '#888';
            return (
              <span key={status} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span style={{ color }}>{count} {status}</span>
              </span>
            );
          })}
        </div>
      </div>
      {/* Time grid */}
      <div className="flex-1 flex min-h-0 overflow-auto custom-scrollbar">
        <div className="w-12 shrink-0">
          {hours.map(h => (
            <div key={h} className="h-16 border-b border-[#111] text-[9px] text-[#666] pr-2 text-right leading-[16px]">
              {h === 12 ? '12:00' : h > 12 ? `${h - 12}:00` : `${h}:00`}
            </div>
          ))}
        </div>
        <div className="flex-1 border-l border-[#111]">
          {hours.map(h => {
            const hourPosts = dayPosts.filter((p: any) => {
              const pd = new Date(p.postedAt ?? p.publishedAt);
              return pd.getHours() === h;
            });
            return (
              <div key={h} className={`h-16 border-b border-[#111] relative ${hourPosts.length > 0 ? 'bg-[#6366f1]/[0.02]' : ''}`}>
                {hourPosts.map((p: any) => (
                  <PostChip key={p.id} post={p} selected={selectedPost?.id === p.id} onClick={() => onSelectPost(p)} expanded />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Shared Components ───────────────────────────────────────────────────── */

function PostChip({ post, selected, onClick, compact, expanded }: { post: any; selected: boolean; onClick: () => void; compact?: boolean; expanded?: boolean }) {
  const color = NETWORK_COLORS[post.network] ?? '#6366f1';
  const statusColor = post.status === 'live' ? STATUS.good : post.status === 'sched' ? '#3b82f6' : post.status === 'draft' ? '#888' : post.status === 'pending' ? '#f59e0b' : post.status === 'failed' ? STATUS.bad : '#888';

  if (expanded) {
    return (
      <button
        onClick={onClick}
        className={`absolute inset-x-1 top-0.5 rounded px-1.5 py-1 text-left border transition-colors ${
          selected ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-transparent hover:bg-[#171717]'
        }`}
        style={{ minHeight: '56px' }}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-[9px] uppercase" style={{ color }}>{post.network.slice(0, 2)}</span>
          <span className="text-[9px] text-[#666]">{post.type}</span>
          <span className="ml-auto text-[9px]" style={{ color: statusColor }}>{post.status}</span>
        </div>
        <p className="text-[10px] text-[#ccc] line-clamp-2 leading-tight">{post.text?.slice(0, 50)}</p>
        {post.engRate > 0 && (
          <div className="text-[9px] text-[#888] mt-0.5">eng {fmtPct(post.engRate)}</div>
        )}
      </button>
    );
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`absolute inset-x-0.5 top-0.5 h-5 rounded px-1 flex items-center gap-1 text-left border transition-colors ${
          selected ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-transparent hover:bg-[#171717]'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[9px] truncate" style={{ color }}>{post.network.slice(0, 2)}</span>
        <span className="text-[9px] text-[#ccc] truncate flex-1">{post.text?.slice(0, 20)}</span>
        {post.status !== 'live' && <span className="text-[8px]" style={{ color: statusColor }}>●</span>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded px-1 py-0.5 text-left border transition-colors mb-0.5 ${
        selected ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-transparent hover:bg-[#171717]'
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[9px] truncate" style={{ color }}>{post.network.slice(0, 8)}</span>
        {post.status !== 'live' && <span className="text-[8px] ml-auto" style={{ color: statusColor }}>●</span>}
      </div>
      <p className="text-[9px] text-[#ccc] line-clamp-1 leading-tight">{post.text?.slice(0, 25)}</p>
    </button>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getWeekStart(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  result.setDate(result.getDate() + diff);
  return result;
}

function getPostsForDate(posts: any[], date: Date): any[] {
  const dateStr = date.toISOString().slice(0, 10);
  return posts.filter((p: any) => {
    const pDate = (p.postedAt ?? p.publishedAt ?? '').slice(0, 10);
    return pDate === dateStr;
  });
}

const NETWORK_COLORS: Record<string, string> = {
  LinkedIn: '#0a66c2',
  'X (Twitter)': '#1d9bf0',
  Instagram: '#e4405f',
  Meta: '#1877f2',
  Facebook: '#1877f2',
  TikTok: '#000',
  YouTube: '#ff0000',
  Pinterest: '#bd081c',
  Threads: '#000',
  Bluesky: '#0085ff',
};
