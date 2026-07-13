// ExportMenu.tsx
import React, { useState } from 'react';
import { useExport } from '../_hooks/useExport';

export function ExportMenu() {
  const [open, setOpen] = useState(false);
  const { exportCsv, exportJson, copyAsTable } = useExport();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="h-7 px-2 text-[11px] text-[#999] hover:text-white border border-[#1a1a1a] rounded bg-[#0c0c0c]"
      >
        ⬇ Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-[#0c0c0c] border border-[#1a1a1a] rounded shadow-2xl z-50">
          <Item onClick={() => { exportCsv(); setOpen(false); }}>Export CSV</Item>
          <Item onClick={() => { exportJson(); setOpen(false); }}>Export JSON</Item>
          <Item onClick={() => { copyAsTable(); setOpen(false); }}>Copy as table</Item>
        </div>
      )}
    </div>
  );
}

function Item({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-1.5 text-[12px] text-white hover:bg-[#161616]">
      {children}
    </button>
  );
}
