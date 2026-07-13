import React from 'react';
import { Circle, Orbit, Grid3X3 } from 'lucide-react';

export type GraphLayout = 'force' | 'radial' | 'grid';
export type SizeBy = 'quality' | 'inLinks' | 'outLinks';

const LAYOUT_OPTIONS: { id: GraphLayout; label: string; icon: React.ReactNode }[] = [
  { id: 'force', label: 'Force', icon: <Circle className="w-3 h-3" /> },
  { id: 'radial', label: 'Radial', icon: <Orbit className="w-3 h-3" /> },
  { id: 'grid', label: 'Grid', icon: <Grid3X3 className="w-3 h-3" /> },
];

const SIZE_OPTIONS: { id: SizeBy; label: string }[] = [
  { id: 'quality', label: 'Quality' },
  { id: 'inLinks', label: 'In-links' },
  { id: 'outLinks', label: 'Out-links' },
];

type Props = {
  layout: GraphLayout;
  onLayoutChange: (layout: GraphLayout) => void;
  sizeBy: SizeBy;
  onSizeByChange: (sizeBy: SizeBy) => void;
};

export function GraphControls({ layout, onLayoutChange, sizeBy, onSizeByChange }: Props) {
  return (
    <>
      {/* Layout selector - left side, below main controls bar */}
      <div className="absolute top-14 left-3 z-10 flex flex-col gap-1 bg-[#0a0a0acc] backdrop-blur p-1.5 rounded border border-[#1a1a1a]">
        <div className="text-[9px] text-[#555] uppercase tracking-wider px-1 mb-0.5">Layer</div>
        {LAYOUT_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => onLayoutChange(opt.id)}
            className={`flex items-center gap-1.5 h-6 px-2 text-[10px] rounded transition-colors ${
              layout === opt.id
                ? 'bg-[#1a1a1a] text-white'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Controls bar - bottom left */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-[#0a0a0acc] backdrop-blur p-1.5 rounded border border-[#1a1a1a]">
        <span className="text-[10px] text-[#888]">Size:</span>
        <select
          value={sizeBy}
          onChange={e => onSizeByChange(e.target.value as SizeBy)}
          className="h-6 px-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded text-[10px] text-[#ccc] focus:outline-none"
        >
          {SIZE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <div className="w-px h-4 bg-[#1a1a1a]" />

        <span className="text-[10px] text-[#555]">Edge: internal links</span>
      </div>
    </>
  );
}
