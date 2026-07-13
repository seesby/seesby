import { AlertTriangle, Check } from 'lucide-react';
import type { SidebarFacetSection, SidebarFacetBucket } from '@seesby/modes';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { TONE_CLASSES } from './tokens';

export function SidebarFacetRow({ section, bucket, count }: { section: SidebarFacetSection; bucket: SidebarFacetBucket; count: number }) {
	const { pageFilter, toggleSelection, setSelection } = useSeoCrawler();
	const key = section.selectionKey ?? section.countKey;
	const selected = (pageFilter.selections[key] || []).includes(bucket.value);
	const dim = bucket.dim ? bucket.dim(count) : count === 0;
	const tone = bucket.tone ? TONE_CLASSES[bucket.tone] : null;

	const onClick = () => {
		if ((section.selectionMode ?? 'multi') === 'single') {
			setSelection(key, selected ? [] : [bucket.value]);
		} else {
			toggleSelection(key, bucket.value);
		}
	};

	const bullet = section.bullet ?? 'check';
	const bulletClass = bullet === 'branch' ? 'px-1' : 'px-3';

	return (
		<button
			onClick={onClick}
			aria-pressed={selected}
			className={`group w-full h-[26px] flex items-center gap-1 ${bulletClass} rounded-sm text-[11px] font-medium transition-colors
				${selected ? 'bg-[#F59E0B]/10 text-[var(--brand-text-strong)]' : 'text-[#A0A0A5] hover:bg-[var(--brand-surface-3)]/[0.03] hover:text-[var(--brand-text-strong)]'}
				${dim ? 'opacity-40' : ''}`}
		>
			<div className="w-4 shrink-0 flex items-center justify-start">
				{bullet === 'check' || bullet === 'square-check' ? (
					<div className={`w-3 h-3 border rounded-sm flex items-center justify-center transition-colors ${selected ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-[var(--brand-border-3)] group-hover:border-[#44444A]'}`}>
						{selected && <Check size={10} strokeWidth={3} className="text-[var(--brand-text-strong)]" />}
					</div>
				) : bullet === 'arrow' ? (
					<span className={`relative left-[2px] text-[14px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>▸</span>
				) : bullet === 'dot' ? (
					<span className={`relative left-[2px] text-[10px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>●</span>
				) : bullet === 'dot-filled' ? (
					<span className={`relative left-[2px] text-[12px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>⬤</span>
				) : bullet === 'dot-outline' ? (
					<span className={`relative left-[2px] text-[12px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>◉</span>
				) : bullet === 'diamond' ? (
					<span className={`relative left-[2px] text-[10px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>◆</span>
				) : bullet === 'win-loss' ? (
					<span className={`relative left-[2px] text-[12px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>
						{bucket.value === 'win' ? '▲' : bucket.value === 'loss' ? '▼' : '●'}
					</span>
				) : bullet === 'bucket' ? (
					<span className={`relative left-[2px] text-[12px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-text-faint)]'}`}>
						{bucket.bullet}
					</span>
				) : bullet === 'branch' ? (
					<span className={`text-[14px] ${selected ? 'text-[var(--brand-text-strong)]' : tone ? tone.text : 'text-[var(--brand-surface-4)]'}`}>┣</span>
				) : null}
			</div>
			<span className="flex-1 truncate text-left">{bucket.label}</span>
			<div className="flex items-center gap-1.5">
				<span className={`text-[11px] font-mono tabular-nums ${(count > 0 && tone) ? tone.text : 'text-[var(--brand-text-faint)]'}`}>{formatCount(count)}</span>
			</div>
		</button>
	);
}

function formatCount(n: number): string {
	if (n < 1000)     return String(n);
	if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
	return `${(n / 1_000_000).toFixed(1)}M`;
}
