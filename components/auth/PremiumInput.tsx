import React from 'react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  error?: string | null;
  icon?: React.ReactNode;
}

const PremiumInput: React.FC<PremiumInputProps> = ({ label, hideLabel, error, icon, ...props }) => {
  const fallbackId = React.useId();
  const inputId = props.id || fallbackId;
  
  const inputClass = `
    w-full h-12 bg-white/[0.02] border transition-all duration-300
    ${error ? 'border-[#F59E0B]/40 overflow-hidden' : 'border-white/[0.06] group-hover:border-white/10'} 
    rounded-xl px-4 text-sm text-white placeholder:text-gray-600 outline-none 
    focus:border-[#F59E0B]/40 focus:bg-white/[0.04] 
    focus:shadow-[0_0_20px_rgba(245,158,11,0.05)]
    ${icon ? 'pl-11' : ''}
  `;

  return (
    <div className="space-y-1.5 group">
      {!hideLabel && (
        <label htmlFor={inputId} className="block text-[9px] font-bold text-gray-700 tracking-[0.1em] uppercase px-1 pb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#F59E0B]/60 transition-colors duration-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          className={inputClass}
        />
      </div>
      {error && (
        <p className="text-[10px] text-[#F59E0B] mt-2 font-bold uppercase tracking-wider px-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default PremiumInput;


