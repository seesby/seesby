import React from 'react';
import { Search, Filter, AlertTriangle, Layers, Tag } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

export default function WqaFilterSidebar() {
  const { wqaFilter, setWqaFilter, wqaFacets } = useSeoCrawler();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWqaFilter(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleCategoryChange = (cat: string) => {
    setWqaFilter(prev => ({ ...prev, pageCategory: cat }));
  };

  const handleActionChange = (action: string) => {
    setWqaFilter(prev => ({ ...prev, technicalAction: action }));
  };

  const handleReset = () => {
    setWqaFilter({
      searchTerm:      '',
      pageCategory:    'all',
      technicalAction: 'all',
      contentAction:   'all',
      priorityLevel:   0,
      valueTier:       'all',
      trafficStatus:   'all',
      searchStatus:    'all',
      contentAge:      'all',
      indexability:    'all',
      funnelStage:     'all',
      industryFilter:  'all',
    });
  };

  const handlePriorityChange = (level: number) => {
    setWqaFilter(prev => ({ ...prev, priorityLevel: level }));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--brand-surface-2)] border-r border-[var(--brand-border-2)] w-full">
      <div className="p-3 border-b border-[var(--brand-border-2)]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--brand-text-faint)]" size={14} />
          <input
            type="text"
            placeholder="Search pages..."
            value={wqaFilter.searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded py-1.5 pl-8 pr-3 text-[12px] text-[var(--brand-text-strong)] focus:outline-none focus:border-[#F59E0B]"
          />
        </div>
      </div>

      <div className="px-3 pt-3 flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-border-2)]">Active Filters</h3>
        <button 
          onClick={handleReset}
          className="text-[9px] font-bold text-[#F59E0B] hover:text-[#ff6070] transition-colors uppercase tracking-widest"
        >
          Reset All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {/* Priority Filter */}
        <div>
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--brand-border-2)] mb-3">
            <AlertTriangle size={12} />
            Priority
          </h4>
          <div className="space-y-1">
            <FilterButton 
              label="All Priorities" 
              active={wqaFilter.priorityLevel === 0} 
              onClick={() => handlePriorityChange(0)} 
            />
            <FilterButton 
              label="High Priority" 
              active={wqaFilter.priorityLevel === 1} 
              count={wqaFacets.priorities['1']}
              onClick={() => handlePriorityChange(1)} 
              color="#ef4444"
            />
            <FilterButton 
              label="Medium Priority" 
              active={wqaFilter.priorityLevel === 2} 
              count={wqaFacets.priorities['2']}
              onClick={() => handlePriorityChange(2)} 
              color="#f59e0b"
            />
            <FilterButton 
              label="Low Priority" 
              active={wqaFilter.priorityLevel === 3} 
              count={wqaFacets.priorities['3']}
              onClick={() => handlePriorityChange(3)} 
              color="#3b82f6"
            />
          </div>
        </div>

        {/* Page Category Filter */}
        <div>
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--brand-border-2)] mb-3">
            <Layers size={12} />
            Categories
          </h4>
          <div className="space-y-1">
            <FilterButton 
              label="All Categories" 
              active={wqaFilter.pageCategory === 'all'} 
              onClick={() => handleCategoryChange('all')} 
            />
            {Object.entries(wqaFacets.categories).map(([cat, count]) => (
              <FilterButton
                key={cat}
                label={cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                active={wqaFilter.pageCategory === cat}
                count={count}
                onClick={() => handleCategoryChange(cat)}
              />
            ))}
          </div>
        </div>

        {/* Action Type Filter */}
        <div>
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--brand-border-2)] mb-3">
            <Tag size={12} />
            Action Type
          </h4>
          <div className="space-y-1">
            <FilterButton 
              label="All Actions" 
              active={wqaFilter.technicalAction === 'all'} 
              onClick={() => handleActionChange('all')} 
            />
            {Object.entries(wqaFacets.technicalActions).map(([action, count]) => (
              <FilterButton
                key={action}
                label={action}
                active={wqaFilter.technicalAction === action}
                count={count}
                onClick={() => handleActionChange(action)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  color?: string;
}

function FilterButton({ label, active, count, onClick, color }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] transition-all ${
        active 
          ? 'bg-[#F59E0B] text-[var(--brand-text-strong)] shadow-lg' 
          : 'text-[var(--brand-text-mid)] hover:bg-[var(--brand-surface-3)] hover:text-[var(--brand-text-mid)]'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {color && !active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
        <span className="truncate">{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-[9px] font-mono px-1 rounded ${active ? 'bg-[var(--brand-surface-4)] text-[var(--brand-text-strong)]' : 'bg-[var(--brand-border-2)] text-[var(--brand-text-faint)]'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
