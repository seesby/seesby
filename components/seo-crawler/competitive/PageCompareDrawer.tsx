import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

interface Props {
  competitorUrl: string;
  competitorTitle: string;
  onClose: () => void;
}

function findClosestPage(pages: any[], targetTitle: string): any | null {
  if (!pages || pages.length === 0 || !targetTitle) return null;

  const targetWords = new Set(targetTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  let bestMatch: any = null;
  let bestScore = 0;

  for (const page of pages) {
    const pageTitle = (page.title || '').toLowerCase();
    const pageWords = new Set(pageTitle.split(/\s+/).filter((w: string) => w.length > 3));
    let overlap = 0;
    for (const word of targetWords) {
      if (pageWords.has(word)) overlap += 1;
    }
    const score = targetWords.size > 0 ? overlap / targetWords.size : 0;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = page;
    }
  }

  return bestScore > 0.2 ? bestMatch : pages[0];
}

export default function PageCompareDrawer({ competitorUrl, competitorTitle, onClose }: Props) {
  const { pages } = useSeoCrawler();

  const yourPage = useMemo(() => findClosestPage(pages, competitorTitle), [pages, competitorTitle]);

  const rows = [
    { label: 'URL', yours: yourPage?.url || '—', theirs: competitorUrl },
    { label: 'Title', yours: yourPage?.title || '—', theirs: competitorTitle },
    { label: 'Word Count', yours: yourPage?.wordCount, theirs: '—' },
    { label: 'H1', yours: yourPage?.h1_1 || '—', theirs: '—' },
    { label: 'Meta Description', yours: yourPage?.metaDesc?.substring(0, 80) || '—', theirs: '—' },
    { label: 'Schema Types', yours: yourPage?.schemaTypes?.join(', ') || 'None', theirs: '—' },
    { label: 'Internal Links', yours: yourPage?.inlinks, theirs: '—' },
    { label: 'Images', yours: yourPage?.totalImages, theirs: '—' },
    { label: 'Load Time', yours: yourPage?.loadTime ? `${yourPage.loadTime}ms` : '—', theirs: '—' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl rounded-2xl border border-[#222] bg-[#0d0d0f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#222] px-6 py-4">
          <h3 className="text-[14px] font-bold text-white">Page Comparison</h3>
          <button onClick={onClose} className="text-[#666] hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="w-[120px] pb-2 text-left text-[10px] font-bold uppercase text-[#666]">Metric</th>
                <th className="pb-2 text-left text-[10px] font-bold uppercase text-[#F59E0B]">Your Page</th>
                <th className="pb-2 text-left text-[10px] font-bold uppercase text-[#6366f1]">Their Page</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#111]">
                  <td className="py-2.5 text-[11px] text-[#666]">{row.label}</td>
                  <td className="max-w-[200px] truncate py-2.5 text-[11px] text-[#ccc]">{row.yours ?? '—'}</td>
                  <td className="max-w-[200px] truncate py-2.5 text-[11px] text-[#ccc]">{row.theirs ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
