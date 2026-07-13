// components/seo-crawler/CategoryTreeContextMenu.tsx
import React, { useRef, useEffect } from 'react';
import { Download, ListTodo, Sparkles } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  category: { group: string; sub: string; count: number; condition?: (p: any) => boolean };
  onClose: () => void;
  onExportSubset: (category: any) => void;
  onCreateTaskForAll: (category: any) => void;
  onBulkAIAnalyze: (category: any) => void;
}

export default function CategoryTreeContextMenu({ 
  x, y, category, onClose, onExportSubset, onCreateTaskForAll, onBulkAIAnalyze 
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { icon: <Download size={13} />, label: `Export "${category.sub}" (${category.count})`, 
      action: () => { onExportSubset(category); onClose(); } },
    { icon: <ListTodo size={13} />, label: 'Create task for all affected', 
      action: () => { onCreateTaskForAll(category); onClose(); } },
    { icon: <Sparkles size={13} />, label: 'Bulk AI analyze', 
      action: () => { onBulkAIAnalyze(category); onClose(); } },
  ];

  return (
    <div ref={ref} style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
      className="bg-[var(--brand-surface-3)]] border border-[var(--brand-surface-4)]] rounded-lg shadow-2xl py-1 min-w-[220px]">
      {items.map((item, i) => (
        <button key={i} onClick={item.action}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-border-2)]] hover:text-[var(--brand-text-strong)] transition-colors">
          <span className="text-[var(--brand-text-mid)]]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
