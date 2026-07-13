import React from 'react';
import { Mail, ArrowRight, ShieldCheck, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import PremiumCodeInput from './PremiumCodeInput';

interface VerifyFormProps {
  email: string;
  code: string;
  setCode: (val: string) => void;
  loading: boolean;
  onVerify: (e: React.FormEvent) => void;
  onResend: () => void;
  errors?: Record<string, string> | null;
}

const VerifyForm: React.FC<VerifyFormProps> = ({
  email,
  code,
  setCode,
  loading,
  onVerify,
  onResend,
  errors
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 backdrop-blur-sm mx-auto shadow-sm">
          <ShieldCheck className="text-[#F59E0B]" size={28} />
        </div>
        <div className="space-y-1 px-4">
          <p className="text-gray-500 text-xs font-medium">Please enter your code</p>
          <p className="text-white text-sm font-semibold truncate max-w-full">{email}</p>
        </div>
      </div>

      <form onSubmit={onVerify} className="space-y-10">
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-700 text-center block">
            Verification Code
          </label>
          
          <PremiumCodeInput 
            value={code} 
            onChange={setCode} 
            length={6} 
            error={!!errors?.code} 
          />

          {errors?.code && (
            <p className="text-[11px] text-[#F59E0B] mt-4 font-bold uppercase tracking-wider px-1 animate-in fade-in slide-in-from-top-1 text-center">
              {errors.code}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full h-12 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D42D41] disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-[11px] shadow-[0_8px_24px_rgba(245,158,11,0.2)] active:scale-[0.98]"
          >
            {loading ? (
               <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="opacity-80">Working...</span>
               </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Verify code</span>
                <ArrowRight size={14} />
              </div>
            )}
          </button>

          <div className="text-center">
             <button 
                type="button" 
                onClick={onResend}
                disabled={loading}
                className="text-[10px] items-center gap-2 inline-flex font-bold text-gray-700 hover:text-white transition-colors uppercase tracking-[0.1em] group"
             >
                <RefreshCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Resend code</span>
             </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default VerifyForm;
