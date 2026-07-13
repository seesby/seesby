import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, formatDate,
} from '../../shared';

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  // Lifecycle
  const discovered = page?.linkDiscovered || page?.firstSeen || '—';
  const aliveSince = page?.linkAliveSince || page?.firstSeen || '—';
  const lastChecked = page?.linkLastChecked || page?.lastSeen || '—';
  const isLost = page?.linkLost ?? page?.linkIsLost;
  const lostDate = page?.linkLostDate || '—';

  // Changes detected
  const anchorChanges = Array.isArray(page?.linkAnchorChanges) ? page.linkAnchorChanges : [];
  const relChanges = Array.isArray(page?.linkRelChanges) ? page.linkRelChanges : [];
  const targetUrlChanges = Array.isArray(page?.linkTargetUrlChanges) ? page.linkTargetUrlChanges : [];

  const anchorChanged = anchorChanges.length > 0;
  const relChanged = relChanges.length > 0;
  const targetChanged = targetUrlChanges.length > 0;
  const hasChanges = anchorChanged || relChanged || targetChanged;

  // Source publishing cadence
  const mentionsCount = Number(page?.linkSourceMentionsCount || page?.sourceMentionsCount || 0);
  const mentionsPeriod = page?.linkSourceMentionsPeriod || '90d';
  const cadenceTrend = page?.linkSourceCadenceTrend || '—';

  // Aggregate crawl history (fallback)
  const history = Array.isArray(page?.crawlSessions) ? page.crawlSessions : [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Discovered" value={formatDate(discovered)} />
        <MetricPill label="Last Checked" value={formatDate(lastChecked)} />
        <MetricPill label="Status" value={isLost === true ? 'Lost' : 'Alive'} good={isLost !== true} />
        <MetricPill label="Mentions" value={mentionsCount > 0 ? `${formatNumber(mentionsCount)} in ${mentionsPeriod}` : '—'} />
      </div>

      {/* Wireframe layout: Lifecycle + Changes detected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Lifecycle">
          <DataRow label="Discovered" value={formatDate(discovered)} />
          <DataRow label="Alive since" value={formatDate(aliveSince)} />
          <DataRow label="Last checked" value={formatDate(lastChecked)} />
          <DataRow label="Lost?" value={isLost === true ? `Yes (${formatDate(lostDate)})` : 'No'} status={isLost === true ? 'fail' : 'pass'} />
        </Card>

        <Card title="Changes detected">
          {!hasChanges && anchorChanges.length === 0 && relChanges.length === 0 && targetUrlChanges.length === 0 ? (
            <div className="text-[12px] text-[var(--brand-text-faint)] italic">No changes detected.</div>
          ) : (
            <>
              {anchorChanged && (
                <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium mb-1">Anchor changed {anchorChanges.length} time{anchorChanges.length > 1 ? 's' : ''}</div>
                  {anchorChanges.slice(0, 3).map((change: any, i: number) => {
                    const from = typeof change === 'string' ? change : change?.from || '—';
                    const to = typeof change === 'object' ? change?.to || '—' : '—';
                    const date = typeof change === 'object' ? change?.date || change?.changedAt : '—';
                    return (
                      <div key={i} className="text-[10px] text-[var(--brand-text-mid)] font-mono">
                        "{from}" → "{to}" {date ? formatDate(date) : ''}
                      </div>
                    );
                  })}
                </div>
              )}
              <DataRow label="Rel" value={relChanged ? `Changed: ${relChanges.map((c: any) => typeof c === 'string' ? c : c?.to || '—').join(', ')}` : `Unchanged (${page?.anchorRel || page?.linkRel || '—'})`} status={relChanged ? 'warn' : 'pass'} />
              <DataRow label="Target URL" value={targetChanged ? 'Changed' : 'Unchanged'} status={targetChanged ? 'warn' : 'pass'} />
            </>
          )}
        </Card>
      </div>

      {/* Source publishing cadence */}
      <Card title="Source publishing cadence">
        {mentionsCount === 0 ? (
          <div className="text-[12px] text-[var(--brand-text-faint)] italic">No publishing cadence data available.</div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-mid)]">
            {formatNumber(mentionsCount)} mentions of us in {mentionsPeriod}
            {cadenceTrend === 'growing' && <span className="text-green-400 ml-2">— growing relationship</span>}
            {cadenceTrend === 'declining' && <span className="text-red-400 ml-2">— declining</span>}
            {cadenceTrend === 'stable' && <span className="text-[var(--brand-text-mid)] ml-2">— stable</span>}
          </div>
        )}
      </Card>

      {/* Aggregate crawl history (fallback when no per-link data) */}
      {history.length > 0 && (
        <Card title="Crawl history">
          <div className="space-y-2">
            {history.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--brand-surface-2)] last:border-b-0 text-[11px]">
                <span className="text-[var(--brand-text-mid)]">{formatDate(s.date)}</span>
                <div className="flex items-center gap-4">
                  {s.inlinks != null && <span className="font-mono">{formatNumber(s.inlinks)} inlinks</span>}
                  {s.referringDomains != null && <span className="font-mono text-[var(--brand-text-faint)]">{formatNumber(s.referringDomains)} ref domains</span>}
                  {s.backlinks != null && <span className="font-mono text-[var(--brand-text-faint)]">{formatNumber(s.backlinks)} backlinks</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
