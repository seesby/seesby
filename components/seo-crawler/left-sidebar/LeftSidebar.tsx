import React, { useRef } from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { getMode, type ModeDescriptor } from '@seesby/modes';
import { SidebarSection } from './SidebarSection';
import { SidebarSavedViews } from './SidebarSavedViews';
import { useFacetCounts } from './hooks/useFacetCounts';
import { useSidebarKeyboard } from './hooks/useSidebarKeyboard';
import { usePersistedSidebar } from './hooks/usePersistedSidebar';

export function LeftSidebar({ embedded = false }: { embedded?: boolean }) {
	const { pageFilter, sidebarState, leftSidebarWidth, setIsDraggingLeftSidebar } = useSeoCrawler();
	let desc: ModeDescriptor;
	try {
		desc = getMode(pageFilter.mode);
	} catch (e) {
		console.warn('LeftSidebar: Mode not found, falling back to empty state', pageFilter.mode);
		return <aside className={`flex flex-col shrink-0 ${embedded ? 'w-full h-full' : 'h-full border-r border-[var(--brand-border-2)]'}`} style={{ width: leftSidebarWidth }} />;
	}

	console.log(`LeftSidebar: Rendering mode "${pageFilter.mode}" with ${desc.lsSections.length} sections`);
	const counts = useFacetCounts();

	usePersistedSidebar();
	useSidebarKeyboard(desc, counts);

	if (sidebarState.collapsed && !embedded) {
		return null;
	}

	return (
		<aside
			style={embedded ? undefined : { width: leftSidebarWidth }}
			aria-label={`${desc.label} sidebar`}
			className={`flex flex-col relative shrink-0 ${embedded ? 'w-full h-full overflow-hidden rounded-2xl border border-[var(--brand-border-2)] bg-[var(--brand-sidebar)]' : 'h-full overflow-hidden bg-[var(--brand-sidebar)] border-r border-[var(--brand-border-2)]'}`}
		>
			{!embedded && (
				<div
					onMouseDown={() => setIsDraggingLeftSidebar(true)}
					className="absolute top-0 bottom-0 right-0 w-1.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F59E0B]/40"
					role="separator"
					aria-orientation="vertical"
				/>
			)}
			
			{/* Fixed Sections (Pinned at top) */}
			{desc.lsSections
				.filter(s => s.pinned)
				.map(section => {
					return <SidebarSection key={section.id} section={section as any} />;
				})
			}

			<div className="flex-1 overflow-y-auto custom-scrollbar">
				{desc.lsSections
					.filter(s => !s.pinned && s.kind !== 'saved-views')
					.map(section => {
					switch (section.kind) {
						case 'list':
							return <SidebarSection key={section.id} section={section} />;
						case 'facet':
							return <SidebarSection key={section.id} section={section} counts={counts[section.countKey]} />;
					}
					return null;
				})}

			</div>
			
			{/* Fixed Bottom Sections (Saved Views) */}
			{desc.lsSections
				.filter(s => s.kind === 'saved-views')
				.map(section => {
					return <SidebarSavedViews key={section.id} section={section} />;
				})
			}
		</aside>
	);
}
