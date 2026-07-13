import React from 'react';
import type { StructureColorBy } from '../selectors/useWqaStructure';

const QUALITY_LEGEND: { color: string; label: string }[] = [
  { color: '#22c55e', label: 'Good (\u226580)' },
  { color: '#f59e0b', label: 'Needs work' },
  { color: '#ef4444', label: 'Poor (<60)' },
];

const DEPTH_LEGEND: { color: string; label: string }[] = [
  { color: '#22c55e', label: 'Shallow' },
  { color: '#f59e0b', label: 'Medium' },
  { color: '#ef4444', label: 'Deep' },
];

type Props = {
  colorBy: StructureColorBy;
};

export function GraphLegend({ colorBy }: Props) {
  return (
    <div className="absolute bottom-14 left-3 z-10 flex items-center gap-3 bg-[#0a0a0acc] backdrop-blur p-2 rounded border border-[#1a1a1a] text-[10px]">
      {/* Color legend */}
      {colorBy === 'quality' && QUALITY_LEGEND.map(item => (
        <span key={item.label} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
      {colorBy === 'depth' && DEPTH_LEGEND.map(item => (
        <span key={item.label} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
      {colorBy === 'cluster' && (
        <span className="text-[#888]">Colors = page categories</span>
      )}

      <div className="w-px h-3 bg-[#1a1a1a]" />

      {/* Size legend */}
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#888]" /> Small
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-[#888]" /> Large
      </span>
      <span className="text-[#555]">= in-link count</span>
    </div>
  );
}
