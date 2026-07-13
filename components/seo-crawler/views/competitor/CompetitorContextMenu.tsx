import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Trash2, Eye, Edit3, ExternalLink, Copy, MoreVertical } from 'lucide-react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';

interface Props {
  domain: string;
  triggerRef?: React.RefObject<HTMLElement>;
  onClose: () => void;
}

export default function CompetitorContextMenu({ domain, onClose }: Props) {
  const {
    addCompetitorAndCrawl,
    removeCompetitor,
    competitiveState,
  } = useSeoCrawler();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const profile = competitiveState.competitorProfiles.get(domain);
  const crawledAt = profile?._meta?.crawledAt;
  const lastCrawlLabel = crawledAt
    ? new Date(crawledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Never';

  const actions = [
    {
      icon: <RefreshCw size={13} />,
      label: 'Re-crawl',
      hint: `Last: ${lastCrawlLabel}`,
      action: () => { addCompetitorAndCrawl(domain); onClose(); },
    },
    {
      icon: <ExternalLink size={13} />,
      label: 'Visit Site',
      action: () => { window.open(`https://${domain}`, '_blank'); onClose(); },
    },
    {
      icon: <Copy size={13} />,
      label: 'Copy Domain',
      action: () => { navigator.clipboard.writeText(domain); onClose(); },
    },
    { divider: true },
    {
      icon: <Trash2 size={13} />,
      label: 'Remove',
      danger: true,
      action: () => { removeCompetitor(domain); onClose(); },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-[200px] rounded-xl border border-[var(--brand-border-2)]] bg-[#111113] shadow-2xl py-1 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e1e22]">
        <div className="text-[11px] font-bold text-[var(--brand-text-strong)] truncate">{domain}</div>
        <div className="text-[10px] text-[var(--brand-text-faint)]]">{profile?.businessName || 'Unknown business'}</div>
      </div>

      {/* Actions */}
      {actions.map((item, i) =>
        'divider' in item ? (
          <div key={i} className="my-1 h-px bg-[#1e1e22]" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition ${
              item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] hover:text-[var(--brand-text-strong)]'
            }`}
          >
            <span className={item.danger ? 'text-red-400' : 'text-[var(--brand-text-faint)]]'}>{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.hint && <span className="text-[10px] text-[var(--brand-text-faint)]]">{item.hint}</span>}
          </button>
        )
      )}
    </div>
  );
}
