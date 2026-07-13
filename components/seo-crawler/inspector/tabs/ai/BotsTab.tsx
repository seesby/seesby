import React from 'react';
import { Card, StatusBadge } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

const KNOWN_BOTS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Perplexity-User',
  'ClaudeBot', 'Claude-Web', 'Google-Extended', 'GoogleOther',
  'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot',
];

function CellCheck({ val }: { val: boolean | string | undefined }) {
  if (val === true || val === 'pass' || val === '200') return <StatusBadge status="pass" label="Yes" />;
  if (val === false || val === 'fail' || val === '403') return <StatusBadge status="fail" label="No" />;
  if (val === 'warn') return <StatusBadge status="warn" label="No" />;
  return <span className="text-[var(--brand-text-faint)]] text-[11px]">&mdash;</span>;
}

export default function BotsTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const botMatrix = page?.botAccessMatrix || page?.aiBotMatrix || {};
  const robotsTxtRaw = page?.robotsTxt?.raw || page?.robotsTxtRaw || '';
  const aiBotRules = page?.robotsTxt?.aiBotRules || page?.aiBotRules || {};

  // Build bot entries
  const botEntries = KNOWN_BOTS.map(name => {
    const entry = botMatrix[name] || {};
    return {
      name,
      robotsTxt: aiBotRules[name] !== undefined ? !!aiBotRules[name] : checkRobotsForBot(robotsTxtRaw, name),
      meta: entry.meta !== undefined ? !!entry.meta : undefined,
      xRobots: entry.xRobots !== undefined ? entry.xRobots : undefined,
      uaTested: entry.uaTested !== undefined ? !!entry.uaTested : undefined,
      statusCode: entry.statusCode || entry.lastStatus || undefined,
      lastHit: entry.lastHit || entry.lastSeen || undefined,
    };
  });

  // Global signals
  const llmsTxt = page?.llmsTxtPresent ?? page?.robotsTxt?.hasLlmsTxt;
  const llmsFullTxt = page?.llmsFullTxtPresent ?? page?.robotsTxt?.hasLlmsFullTxt;
  const aiTxt = page?.aiTxtPresent ?? page?.robotsTxt?.hasAiTxt;
  const rssPresent = page?.rssPresent ?? page?.robotsTxt?.hasRss;

  // Rate limits
  const crawlDelay = page?.crawlDelay ?? page?.robotsTxt?.crawlDelay;
  const count429 = page?.count429 ?? page?.rateLimit429Count ?? 0;

  return (
    <div className="space-y-4">
      {/* Main panel: per-bot matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Matrix table (2 cols wide) */}
        <div className="lg:col-span-2">
          <Card title="Per-bot matrix">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--brand-surface-3)]]">
                    <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">Bot</th>
                    <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">robots.txt</th>
                    <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">meta</th>
                    <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">x-robots</th>
                    <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">UA tested</th>
                    <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">last hit</th>
                  </tr>
                </thead>
                <tbody>
                  {botEntries.map(bot => (
                    <tr key={bot.name} className="border-b border-[var(--brand-surface-2)]] hover:bg-[var(--brand-surface-2)]]">
                      <td className="px-2 py-1.5 text-[var(--brand-text-mid)]] font-mono whitespace-nowrap">{bot.name}</td>
                      <td className="px-2 py-1.5 text-center"><CellCheck val={bot.robotsTxt} /></td>
                      <td className="px-2 py-1.5 text-center"><CellCheck val={bot.meta} /></td>
                      <td className="px-2 py-1.5 text-center">
                        {bot.xRobots !== undefined ? <CellCheck val={bot.xRobots} /> : <span className="text-[var(--brand-text-faint)]]">&mdash;</span>}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {bot.uaTested !== undefined ? (
                          <span className={bot.statusCode === '200' ? 'text-[#22c55e]' : bot.statusCode ? 'text-[#ef4444]' : 'text-[var(--brand-text-mid)]]'}>
                            {bot.statusCode || '\u2014'}
                          </span>
                        ) : <span className="text-[var(--brand-text-faint)]]">&mdash;</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-mid)]] whitespace-nowrap">{bot.lastHit || '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right sidebar cards */}
        <div className="space-y-4">
          <Card title="Global signals">
            <div className="space-y-1">
              <SignalRow label="llms.txt" present={llmsTxt} />
              <SignalRow label="llms-full.txt" present={llmsFullTxt} />
              <SignalRow label="ai.txt" present={aiTxt} />
              <SignalRow label="RSS" present={rssPresent} />
            </div>
          </Card>

          {/* Rate limits */}
          <Card title="Rate limits">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-faint)]]">Crawl-delay</span>
                <span className="text-[var(--brand-text-strong)]">{crawlDelay || '\u2014'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-faint)]]">429 last 30d</span>
                <span className={count429 > 0 ? 'text-[#f59e0b]' : 'text-[var(--brand-text-strong)]'}>{count429}</span>
              </div>
            </div>
          </Card>

          {/* Bot access trend */}
          {hasTrend && (
            <Card title="Bot access trend">
              <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
                <Sparkline values={page?.botAccessTrend || []} tone="good" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SignalRow({ label, present }: { label: string; present: boolean | undefined }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--brand-text-faint)]]">{label}</span>
      {present === true ? (
        <StatusBadge status="pass" label="Yes" />
      ) : present === false ? (
        <StatusBadge status="fail" label="No" />
      ) : (
        <span className="text-[var(--brand-text-faint)]]">&mdash;</span>
      )}
    </div>
  );
}

function checkRobotsForBot(raw: string, botName: string): boolean | undefined {
  if (!raw) return undefined;
  const lines = raw.split('\n');
  let inAgent = false;
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith('user-agent:')) {
      const agent = trimmed.replace('user-agent:', '').trim();
      inAgent = agent === '*' || agent.toLowerCase() === botName.toLowerCase();
    } else if (inAgent && trimmed.startsWith('allow:')) {
      return true;
    } else if (inAgent && trimmed.startsWith('disallow:')) {
      return false;
    }
  }
  return undefined;
}
