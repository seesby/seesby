import { useEffect, useState } from 'react';
import { Star, Plus, X } from 'lucide-react';
import type { SidebarSavedViewsSection, SavedView } from '@seesby/modes';
import { SavedViewsStore } from '../../../services/SavedViewsStore';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

export function SidebarSavedViews({ section }: { section: SidebarSavedViewsSection }) {
	const { pageFilter, setPageFilter, sidebarState, setSidebarState } = useSeoCrawler();
	const [views, setViews] = useState<SavedView[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (section.defaultViews) await SavedViewsStore.seedIfEmpty(pageFilter.mode, section.defaultViews);
			const list = await SavedViewsStore.list(pageFilter.mode);
			if (!cancelled) setViews(list);
		})();
		return () => { cancelled = true; };
	}, [pageFilter.mode, section.defaultViews]);

	const onSave = async () => {
		const name = window.prompt('Name this view');
		if (!name?.trim()) return;
		const sv = await SavedViewsStore.create({ name: name.trim(), mode: pageFilter.mode, selections: pageFilter.selections });
		setViews(prev => [sv, ...prev]);
		setSidebarState(p => ({ ...p, activeSavedViewId: sv.id }));
	};

	const onApply = (sv: SavedView) => {
		setPageFilter(prev => ({ ...prev, selections: { ...sv.selections } }));
		setSidebarState(p => ({ ...p, activeSavedViewId: sv.id }));
	};

	const onDelete = async (e: React.MouseEvent, sv: SavedView) => {
		e.stopPropagation();
		if (!window.confirm(`Delete saved view "${sv.name}"?`)) return;
		await SavedViewsStore.remove(sv.id);
		setViews(prev => prev.filter(v => v.id !== sv.id));
	};

	return (
		<section className="pt-2 pb-2 border-t border-[#222] bg-[#0A0A0B]">
			<div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#66666E]">
				<span className="flex items-center gap-1.5"><Star size={11} fill="currentColor" /> Saved views</span>
				<button onClick={onSave} className="flex items-center gap-1 text-[11px] text-[#66666E] hover:text-white transition-colors"><Plus size={11} /> New</button>
			</div>
			<div className="">
				{views.map(sv => {
					const active = sidebarState.activeSavedViewId === sv.id;
					return (
						<button
							key={sv.id}
							onClick={() => onApply(sv)}
							className={`group w-full h-[26px] flex items-center gap-1 px-3 rounded-sm text-[11px] font-medium transition-colors
								${active ? 'bg-[#F59E0B]/10 text-white' : 'text-[#A0A0A5] hover:bg-white/[0.03] hover:text-white'}`}
						>
							<span className="flex-1 truncate text-left">{sv.name}</span>
							{sv.count !== undefined && <span className="text-[11px] font-mono text-[#66666E]">{sv.count}</span>}
							<span onClick={e => onDelete(e, sv)} className="opacity-0 group-hover:opacity-100 text-[#44444A] hover:text-[#ef4444] ml-1"><X size={11} /></span>
						</button>
					);
				})}
				{views.length === 0 && <div className="px-3 py-1 text-[11px] text-[#66666E]">No saved views yet</div>}
			</div>
		</section>
	);
}
