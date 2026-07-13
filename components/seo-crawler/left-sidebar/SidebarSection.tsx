import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SidebarSection as Section, SidebarFacetSection, SidebarListSection } from '@seesby/modes';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { SidebarFacetRow } from './SidebarFacetRow';
import { SidebarTreeRow } from './SidebarTreeRow';

export function SidebarSection({ section, counts }: { section: Exclude<Section, { kind: 'kpi' | 'saved-views' }>; counts?: Record<string, number> }) {
	const { pageFilter, sidebarState, toggleSection } = useSeoCrawler();
	const key = `${pageFilter.mode}.${section.id}`;
	const stored = sidebarState.collapsedSections[key];
	const isOpen = stored === undefined ? (section.defaultOpen ?? true) : !stored;

	return (
		<section className="py-2 border-b border-[var(--brand-border-2)]">
			<button
				onClick={() => toggleSection(pageFilter.mode, section.id)}
				className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)]"
			>
				<span>{section.label}</span>
				{isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
			</button>
			{isOpen && (section.kind === 'facet'
				? (section.display === 'histogram' ? <HistogramBody section={section} counts={counts} /> : <FacetBody section={section} counts={counts} />)
				: <ListBody  section={section as SidebarListSection} />)}
		</section>
	);
}

function FacetBody({ section, counts }: { section: SidebarFacetSection; counts?: Record<string, number> }) {
	const c = counts || {};
	const rows = section.buckets
		? section.buckets.map(b => ({ ...b, count: c[b.value] ?? 0 }))
		: Object.entries(c)
				.sort((a, b) => b[1] - a[1])
				.map(([value, count]) => ({ value, label: value, count }));

	const visible = rows.filter(r => !(r.hidden ? r.hidden(r.count) : r.count === 0 && section.hideWhenEmpty));
	const max = section.maxVisible ?? 8;
	return (
		<div>
			{visible.slice(0, max).map(r => (
				<SidebarFacetRow key={r.value} section={section} bucket={r} count={r.count} />
			))}
			{visible.length > max && (
				<button className="w-full text-left px-3 py-1 text-[11px] text-[#44444A] hover:text-[var(--brand-text-strong)]">Show all ({visible.length})</button>
			)}
		</div>
	);
}

function ListBody({ section }: { section: SidebarListSection }) {
	const { filteredPages, pageFilter } = useSeoCrawler();
	const items = section.resolveItems ? section.resolveItems({ pages: filteredPages, mode: pageFilter.mode }) : section.items;
	return (
		<div>
			{items.map(item => <SidebarTreeRow key={item.id} section={section} item={item} />)}
		</div>
	);
}

function HistogramBody({ section, counts }: { section: SidebarFacetSection; counts?: Record<string, number> }) {
	const c = counts || {};
	const rows = section.buckets
		? section.buckets.map(b => ({ ...b, count: c[b.value] ?? 0 }))
		: Object.entries(c)
				.sort((a, b) => b[1] - a[1])
				.map(([value, count]) => ({ value, label: value, count }));

	const maxCount = Math.max(1, ...rows.map(r => r.count));
	const { pageFilter, toggleSelection } = useSeoCrawler();
	const key = section.selectionKey ?? section.countKey;

	return (
		<div className="px-3 pt-2 pb-2 flex flex-col gap-1">
			{rows.map(r => {
				const w = r.count === 0 ? 0 : Math.max(2, Math.round((r.count / maxCount) * 100));
				const selected = (pageFilter.selections[key] || []).includes(r.value);
				return (
					<button
						key={r.value}
						onClick={() => toggleSelection(key, r.value)}
						className={`relative group w-full h-[24px] flex items-center justify-between px-2 text-[11px] font-medium transition-colors outline-none rounded-sm border ${selected ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5' : 'border-transparent hover:bg-[var(--brand-surface-3)]/[0.02]'}`}
					>
						{/* Horizontal Bar Fill */}
						<div 
							className={`absolute left-0 top-0 bottom-0 rounded-sm transition-all duration-500 ease-out ${selected ? 'bg-[#F59E0B]/20' : 'bg-[var(--brand-surface-4)]/60 group-hover:bg-[#44444A]/80'}`}
							style={{ width: `${w}%` }}
						/>
						
						{/* Label Content */}
						<div className="relative z-10 flex items-center gap-3">
							<span className={`${selected ? 'text-[var(--brand-text-strong)]' : 'text-[#A0A0A5] group-hover:text-[var(--brand-text-strong)]'} ${r.count === 0 ? 'opacity-50' : ''}`}>
								Depth {r.label}
							</span>
						</div>
						
						{/* Count Content */}
						<div className="relative z-10 flex items-center gap-1.5">
							<span className={`font-mono tabular-nums ${selected ? 'text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)] group-hover:text-[var(--brand-text-mid)]'} ${r.count === 0 ? 'opacity-50' : ''}`}>
								{r.count}
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}
