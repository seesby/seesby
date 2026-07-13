import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { Crosshair, Plus, Sparkles } from 'lucide-react';

export default function CompetitorEmptyState() {
  const { setShowAddCompetitorInput, analysisPages } = useSeoCrawler();
  const hasCrawlData = (analysisPages?.length || 0) > 0;

  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--brand-surface-0)]]">
      <div className="text-center max-w-lg">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center mb-5">
          <Crosshair size={28} className="text-[#F59E0B]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--brand-text-strong)] mb-2">Competitive Analysis</h2>
        <p className="text-[13px] text-[var(--brand-text-mid)]] leading-6 mb-6">
          {hasCrawlData
            ? 'Add competitor domains to start comparing. Seesby will micro-crawl each one and build a full competitive profile with AI analysis.'
            : 'Run a crawl first, then add competitors to compare against your site.'}
        </p>
        {hasCrawlData && (
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => setShowAddCompetitorInput(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#ff5b70] to-[#d62839] text-[13px] font-bold text-[var(--brand-text-strong)] shadow-[0_12px_30px_rgba(245,158,11,0.22)] hover:-translate-y-[1px] transition-transform"
            >
              <Plus size={14} /> Add Competitor
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-3)]] border border-[var(--brand-border-2)]] transition-all"
            >
              <Sparkles size={12} /> Auto-Discover Competitors
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
