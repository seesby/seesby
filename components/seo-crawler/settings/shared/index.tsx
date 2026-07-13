import React from 'react';

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-4">
        <h3 className="text-[13px] font-bold text-[var(--brand-text-strong)] uppercase tracking-wider">{title}</h3>
        {description && <p className="text-[11px] text-[var(--brand-text-faint)]] mt-1">{description}</p>}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

export function SettingsToggle({ label, description, checked, onChange }: { 
  label: string; description?: string; checked: boolean; onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded-lg cursor-pointer hover:border-[var(--brand-surface-4)]] transition-colors"
      onClick={() => onChange(!checked)}>
      <div>
        <div className="text-[12px] text-[var(--brand-text-strong)] font-medium">{label}</div>
        {description && <div className="text-[10px] text-[var(--brand-text-faint)]] mt-0.5">{description}</div>}
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-[#F59E0B]' : 'bg-[var(--brand-surface-4)]]'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-[var(--brand-surface-3)] rounded-full transition-all ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

export function SettingsInput({ label, description, value, onChange, type = 'text', placeholder }: {
  label: string; description?: string; value: string | number; onChange: (val: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[var(--brand-text-mid)]]">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded-md text-[12px] text-[var(--brand-text-strong)] focus:border-[#F59E0B] outline-none transition-colors placeholder:text-[var(--brand-surface-4)]]"
      />
      {description && <p className="text-[10px] text-[var(--brand-text-faint)]]">{description}</p>}
    </div>
  );
}

export function SettingsSelect({ label, description, value, onChange, options }: {
  label: string; description?: string; value: string; onChange: (val: any) => void; options: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[var(--brand-text-mid)]]">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded-md text-[12px] text-[var(--brand-text-strong)] focus:border-[#F59E0B] outline-none transition-colors appearance-none cursor-pointer"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {description && <p className="text-[10px] text-[var(--brand-text-faint)]]">{description}</p>}
    </div>
  );
}

export function SettingsTextarea({ label, description, value, onChange, placeholder, rows = 3 }: {
  label: string; description?: string; value: string; onChange: (val: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[var(--brand-text-mid)]]">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded-md text-[12px] text-[var(--brand-text-strong)] focus:border-[#F59E0B] outline-none transition-colors placeholder:text-[var(--brand-surface-4)]] resize-none font-mono"
      />
      {description && <p className="text-[10px] text-[var(--brand-text-faint)]]">{description}</p>}
    </div>
  );
}

export function SettingsSlider({ label, min, max, step, value, onChange, unit = '' }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (val: number) => void; unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <label className="text-[11px] font-medium text-[var(--brand-text-mid)]]">{label}</label>
        <span className="text-[11px] font-bold text-[#F59E0B]">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-[var(--brand-border-2)]] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
      />
    </div>
  );
}
