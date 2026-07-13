// DiffViewer.tsx — left/right HTML or text diff using a tiny line-based diff.
// For richer diffs, swap the body for `diff` package later.
import React from 'react';
import clsx from 'clsx';

export function DiffViewer({
  left, right, leftLabel = 'Static (bot)', rightLabel = 'Rendered (user)',
}: {
  left: string;
  right: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Pane label={leftLabel} content={left} />
      <Pane label={rightLabel} content={right} />
    </div>
  );
}

function Pane({ label, content }: { label: string; content: string }) {
  return (
    <div className="border border-[#1a1a1a] rounded bg-[#0a0a0a]">
      <div className="h-7 px-2 flex items-center text-[10px] uppercase tracking-wider text-[#666] border-b border-[#1a1a1a]">{label}</div>
      <pre className="p-2 text-[11px] font-mono text-[#bbb] whitespace-pre-wrap break-all overflow-auto max-h-[480px] custom-scrollbar">{content}</pre>
    </div>
  );
}
