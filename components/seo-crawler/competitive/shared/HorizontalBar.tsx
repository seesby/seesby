interface HorizontalBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  isOwn?: boolean;
  suffix?: string;
}

export default function HorizontalBar({
  label,
  value,
  maxValue,
  color = '#F59E0B',
  isOwn = false,
  suffix = '',
}: HorizontalBarProps) {
  const pct = maxValue > 0 ? Math.min(100, Math.round((value / maxValue) * 100)) : 0;

  return (
    <div className="flex items-center gap-3 py-1">
      <span className={`w-[100px] truncate text-[11px] ${isOwn ? 'font-bold text-[#F59E0B]' : 'text-[#888]'}`}>
        {isOwn ? 'Your Site' : label}
      </span>
      <div className="h-[14px] flex-1 overflow-hidden rounded-full bg-[#111]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isOwn ? '#F59E0B' : color }}
        />
      </div>
      <span className={`w-[60px] text-right font-mono text-[11px] font-bold ${isOwn ? 'text-[#F59E0B]' : 'text-white'}`}>
        {value.toLocaleString()}
        {suffix}
      </span>
    </div>
  );
}
