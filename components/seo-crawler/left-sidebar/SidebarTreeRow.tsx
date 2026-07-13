import type { SidebarListItem, SidebarListSection } from '@seesby/modes';
import * as Icons from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { TONE_CLASSES } from './tokens';

export function SidebarTreeRow({ section, item, depth = 0 }: { section: SidebarListSection; item: SidebarListItem; depth?: number }) {
	const { pageFilter, toggleSelection, setSelection } = useSeoCrawler();
	const key = section.selectionKey ?? section.id;
	const selected = (pageFilter.selections[key] || []).includes(item.id);
	const Icon = item.icon ? (Icons as any)[item.icon] : null;
	const tone = item.tone ? TONE_CLASSES[item.tone] : null;
	const isAction = !!item.action;

	const onClick = () => {
		if (isAction) return;
		if ((section.selectionMode ?? 'single') === 'single') {
			setSelection(key, selected ? [] : [item.id]);
		} else {
			toggleSelection(key, item.id);
		}
	};

	return (
		<>
			<button
				onClick={onClick}
				aria-current={selected ? 'true' : undefined}
				style={{ paddingLeft: 12 + depth * 12 }}
				className={`w-full h-[26px] flex items-center gap-1 pr-3 rounded-sm text-[11px] font-medium transition-colors
					${selected ? 'bg-[#F59E0B]/10 text-white' : isAction ? 'text-[#66666E] hover:text-white' : 'text-[#A0A0A5] hover:bg-white/[0.03] hover:text-white'}`}
			>
				<div className="w-4 shrink-0 flex items-center justify-start">
					{item.children ? (
						<span className={`text-[14px] ${selected ? 'text-white' : 'text-[#55555A]'}`}>▸</span>
					) : Icon ? (
						<Icon size={12} className="shrink-0" />
					) : section.bullet === 'check' || section.bullet === 'square-check' ? (
						<div className={`w-3 h-3 shrink-0 border rounded-sm flex items-center justify-center transition-colors ${selected ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-[#2A2A2F] group-hover:border-[#44444A]'}`}>
							{selected && <Icons.Check size={10} strokeWidth={3} className="text-white" />}
						</div>
					) : section.bullet === 'bucket' ? (
						<span className={`text-[10px] ${selected ? 'text-white' : tone ? tone.text : 'text-[#55555A]'}`}>
							{item.bullet}
						</span>
					) : section.bullet === 'arrow' ? (
						<span className={`text-[14px] ${selected ? 'text-white' : tone ? tone.text : 'text-[#55555A]'}`}>▸</span>
					) : section.bullet === 'dot' ? (
						<span className={`text-[10px] ${selected ? 'text-white' : tone ? tone.text : 'text-[#55555A]'}`}>●</span>
					) : section.bullet === 'dot-filled' ? (
						<span className={`text-[12px] ${selected ? 'text-white' : tone ? tone.text : 'text-[#55555A]'}`}>⬤</span>
					) : section.bullet === 'diamond' ? (
						<span className={`text-[10px] ${selected ? 'text-white' : tone ? tone.text : 'text-[#55555A]'}`}>
							{selected ? '◆' : '◇'}
						</span>
					) : null}
				</div>
				<span className="flex-1 truncate text-left">{item.label}</span>
				{item.meta && (
					<span className={`text-[10px] font-mono tabular-nums ${isAction || item.metaStyle === 'badge' ? 'px-1 py-0.5 rounded-full bg-white/10 text-white' : item.meta.includes('●') || item.meta.includes('⬤') ? (tone ? tone.text : 'text-[#66666E]') : tone ? tone.text : 'text-[#66666E]'}`}>
						{item.meta}
					</span>
				)}
				{item.indicator === 'dot' && (
					<span className={`text-[10px] ml-1 ${tone ? tone.text : 'text-[#66666E]'}`}>●</span>
				)}
			</button>
			{item.children && selected && item.children.map(child => (
				<SidebarTreeRow key={child.id} section={section} item={child} depth={depth + 1} />
			))}
		</>
	);
}
