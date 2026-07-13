import React from 'react';
import { Card, StatusBadge } from '../../shared';

function StatusCell({ ok }: { ok: boolean | undefined }) {
  if (ok === true) return <StatusBadge status="pass" label="Yes" />;
  if (ok === false) return <StatusBadge status="warn" label="No" />;
  return <span className="text-[var(--brand-text-faint)]] text-[11px]">&mdash;</span>;
}

export default function ExtractableTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  // Block inventory
  const blockInventory = page?.blockInventory || buildBlockInventory(page);

  // Extractability score
  const extractableBlocks = blockInventory
    .filter((b: any) => b.extractable != null)
    .reduce((sum: number, b: any) => sum + b.extractable, 0);
  const totalBlocks = blockInventory
    .filter((b: any) => b.extractable != null)
    .reduce((sum: number, b: any) => sum + b.count, 0);
  const extractScore = totalBlocks > 0 ? Math.round((extractableBlocks / totalBlocks) * 100) : 0;

  // Issues
  const issues = buildIssues(page);

  // Rendering
  const renderType = page?.renderType || (Number(page?.jsRenderDiff?.textDiffPercent || 0) > 10 ? 'CSR' : 'SSR');
  const isStatic = renderType === 'SSR' || renderType === 'static';
  const heavyJs = page?.heavyJsDependency ?? !isStatic;
  const paywallGate = page?.paywallOrAuthGate ?? false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Block inventory (2 cols) */}
        <div className="lg:col-span-2">
          <Card title="Block inventory">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--brand-surface-3)]]">
                    <th className="px-2 py-1.5 text-left text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">Block type</th>
                    <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">Count</th>
                    <th className="px-2 py-1.5 text-right text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">Extractable</th>
                    <th className="px-2 py-1.5 text-center text-[var(--brand-text-faint)]] uppercase tracking-widest font-bold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {blockInventory.map((block: any) => (
                    <tr key={block.type} className="border-b border-[var(--brand-surface-2)]] hover:bg-[var(--brand-surface-2)]]">
                      <td className="px-2 py-1.5 text-[var(--brand-text-mid)]]">{block.type}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-strong)]">{block.count}</td>
                      <td className="px-2 py-1.5 text-right text-[var(--brand-text-strong)]">
                        {block.extractable != null ? block.extractable : '\u2014'}
                      </td>
                      <td className="px-2 py-1.5 text-center"><StatusCell ok={block.score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card title="Extractability score">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={extractScore >= 70 ? '#22c55e' : extractScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${(extractScore / 100) * 94.25} 94.25`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-[var(--brand-text-strong)]">
                  {extractScore}%
                </span>
              </div>
              <div>
                <div className="text-[11px] text-[var(--brand-text-faint)]]">Overall</div>
              </div>
            </div>
          </Card>

          {/* Issues */}
          <Card title="Issues">
            {issues.length > 0 ? (
              <div className="space-y-1.5">
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                    <span className="text-[var(--brand-text-mid)]]">{issue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[var(--brand-text-faint)]]">No issues</div>
            )}
          </Card>

          {/* Rendering */}
          <Card title="Rendering">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-faint)]]">Pre-rendered HTML</span>
                <span className={isStatic ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>
                  {isStatic ? '\u2713' : '\u2717'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-faint)]]">Heavy JS dependency</span>
                <span className={heavyJs ? 'text-[#f59e0b]' : 'text-[#22c55e]'}>
                  {heavyJs ? 'yes' : 'no'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--brand-text-faint)]]">Paywall / auth gate</span>
                <span className={paywallGate ? 'text-[#f59e0b]' : 'text-[#22c55e]'}>
                  {paywallGate ? 'yes' : 'no'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function buildBlockInventory(page: any) {
  const wordCount = Number(page?.wordCount || 0);
  const headings = Number(page?.headings || page?.headingCount || 0);
  const lists = Number(page?.listCount || 0);
  const tables = Number(page?.tableCount || 0);
  const codeBlocks = Number(page?.codeBlockCount || 0);
  const images = Number(page?.imageCount || page?.imgCount || 0);
  const imagesNoAlt = Number(page?.imgMissingAlt || 0);
  const faqCount = Number(page?.faqCount || 0);
  const howtoSteps = Number(page?.howtoStepCount || 0);
  const defLists = Number(page?.definitionListCount || 0);

  const hasFaqSchema = !!page?.schemaTypes?.includes('FAQPage');
  const hasHowToSchema = !!page?.schemaTypes?.includes('HowTo');

  return [
    { type: 'Paragraphs', count: Math.round(wordCount / 50) || (wordCount > 0 ? 1 : 0), extractable: wordCount > 0 ? Math.round(wordCount / 50) || 1 : 0, score: wordCount > 50 },
    { type: 'Headings', count: headings, extractable: headings, score: headings > 0 },
    { type: 'Lists', count: lists, extractable: lists, score: lists > 0 },
    { type: 'Tables', count: tables, extractable: tables, score: tables > 0 || tables === 0 },
    { type: 'Code blocks', count: codeBlocks, extractable: null, score: undefined },
    { type: 'FAQ', count: faqCount, extractable: faqCount > 0 ? faqCount : null, score: faqCount > 0 || hasFaqSchema },
    { type: 'HowTo steps', count: howtoSteps, extractable: howtoSteps > 0 ? howtoSteps : null, score: howtoSteps > 0 || hasHowToSchema },
    { type: 'Definition list', count: defLists, extractable: null, score: undefined },
  ];
}

function buildIssues(page: any): string[] {
  const issues: string[] = [];
  const faqCount = Number(page?.faqCount || 0);
  const howtoSteps = Number(page?.howtoStepCount || 0);
  const images = Number(page?.imageCount || page?.imgCount || 0);
  const imagesNoAlt = Number(page?.imgMissingAlt || 0);
  const hasFaqSchema = !!page?.schemaTypes?.includes('FAQPage');
  const hasHowToSchema = !!page?.schemaTypes?.includes('HowTo');

  if (faqCount === 0 && !hasFaqSchema) issues.push('No Q/A block (blocks FAQPage)');
  if (howtoSteps === 0 && !hasHowToSchema) issues.push('No step list (blocks HowTo)');
  if (imagesNoAlt > 0) issues.push(`${imagesNoAlt} image${imagesNoAlt > 1 ? 's' : ''} w/o caption or alt`);

  return issues;
}
