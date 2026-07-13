import { useEffect } from 'react';
import type { ModeDescriptor, SidebarFacetSection } from '@seesby/modes';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import type { FacetCounts } from './useFacetCounts';

export function useSidebarKeyboard(desc: ModeDescriptor, counts: FacetCounts) {
	const { sidebarState, setSidebarCollapsed, toggleSelection, setSelection, pageFilter } = useSeoCrawler();

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			
			if (e.key === '[') { setSidebarCollapsed(true); return; }
			if (e.key === ']') { setSidebarCollapsed(false); return; }

			// Mode shortcut check (1-9) for first active facet section
			if (/^[1-9]$/.test(e.key)) {
				// Find first open facet section that matches search query
				const query = sidebarState.query.trim().toLowerCase();
				const activeFacetSection = desc.lsSections.find(s => {
					if (s.kind !== 'facet') return false;
					if (query && !s.label.toLowerCase().includes(query)) return false;
					const key = `${pageFilter.mode}.${s.id}`;
					const stored = sidebarState.collapsedSections[key];
					const isOpen = stored === undefined ? (s.defaultOpen ?? true) : !stored;
					return isOpen;
				}) as SidebarFacetSection | undefined;

				if (activeFacetSection) {
					const c = counts[activeFacetSection.countKey] || {};
					const rows = activeFacetSection.buckets.map(b => ({ ...b, count: c[b.value] ?? 0 }));
					const visible = rows.filter(r => !(r.hidden ? r.hidden(r.count) : r.count === 0 && activeFacetSection.hideWhenEmpty));
					const max = activeFacetSection.maxVisible ?? 8;
					const rendered = visible.slice(0, max);
					
					const targetBucket = rendered.find((b, idx) => {
						const shortcut = (b as any).shortcut ?? String(idx + 1);
						return shortcut === e.key;
					});

					if (targetBucket) {
						e.preventDefault();
						const key = activeFacetSection.selectionKey || activeFacetSection.countKey;
						if ((activeFacetSection.selectionMode ?? 'multi') === 'single') {
							const selected = (pageFilter.selections[key] || []).includes(targetBucket.value);
							setSelection(key, selected ? [] : [targetBucket.value]);
						} else {
							toggleSelection(key, targetBucket.value);
						}
					}
				}
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [sidebarState.collapsed, sidebarState.query, sidebarState.collapsedSections, setSidebarCollapsed, desc, counts, toggleSelection, setSelection, pageFilter.mode, pageFilter.selections]);
}
