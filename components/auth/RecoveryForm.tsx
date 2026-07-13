import React from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, ChevronLeft } from 'lucide-react';
import PremiumInput from './PremiumInput';
import PremiumCodeInput from './PremiumCodeInput';
import { motion } from 'framer-motion';

interface RecoveryFormProps {
  mode: 'forgot_request' | 'forgot_code' | 'forgot_password';
  email: string;
  setEmail: (val: string) => void;
  code: string;
  setCode: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  loading: boolean;
  onSendCode: (e: React.FormEvent) => void;
  onVerifyCode: (e: React.FormEvent) => void;
  onSetPassword: (e: React.FormEvent) => void;
  onSwitch: () => void;
  errors: Record<string, string> | null;
}

const RecoveryForm: React.FC<RecoveryFormProps> = ({
  mode,
  email,
  setEmail,
  code,
  setCode,
  newPassword,
  setNewPassword,
  loading,
  onSendCode,
  onVerifyCode,
  onSetPassword,
  onSwitch,
  errors
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      {mode === 'forgot_request' && (
        <form onSubmit={onSendCode} className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-[280px] mx-auto">
              Lost your password? No problem. We'll send a code to your email.
            </p>
          </div>
          <PremiumInput
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            icon={<Mail size={16} />}
            error={errors?.email}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D42D41] disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-[10px] shadow-[0_8px_24px_rgba(245,158,11,0.2)] active:scale-[0.98]"
          >
            {loading ? (
               <div className="flex items-center justify-center gap-2">
                 <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                 <span>Sending...</span>
               </div>
            ) : (
              'Send code'
            )}
          </button>
        </form>
      )}

      {mode === 'forgot_code' && (
        <form onSubmit={onVerifyCode} className="space-y-8">
           <div className="text-center space-y-3">
             <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 mx-auto">
               <ShieldCheck className="text-[#F59E0B]" size={28} />
             </div>
             <p className="text-gray-500 text-xs font-medium max-w-[240px] mx-auto leading-relaxed">
               Sent to <span className="text-white/80 font-bold">{email}</span>.
             </p>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-700 text-center block">
               Enter code
             </label>
             
             <PremiumCodeInput 
               value={code} 
               onChange={setCode} 
               length={6} 
               error={!!errors?.code} 
             />

             {errors?.code && (
               <p className="text-[11px] text-[#F59E0B] mt-3 font-bold uppercase tracking-wider text-center">
                 {errors.code}
               </p>
             )}
           </div>

           <button
             type="submit"
             disabled={loading || code.length !== 6}
             className="w-full h-12 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D42D41] disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-[11px] shadow-[0_8px_24px_rgba(245,158,11,0.2)] active:scale-[0.98]"
           >
             {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </div>
             ) : (
                'Confirm'
             )}
           </button>
        </form>
      )}

      {mode === 'forgot_password' && (
        <form onSubmit={onSetPassword} className="space-y-6">
           <p className="text-gray-500 text-xs font-medium text-center leading-relaxed">
             Identity confirmed. Pick a new password.
           </p>
           <PremiumInput
             label="New password"
             type="password"
             required
             minLength={8}
             value={newPassword}
             onChange={(e) => setNewPassword(e.target.value)}
             placeholder="••••••••"
             icon={<Lock size={16} />}
             error={errors?.password}
           />
           <button
             type="submit"
             disabled={loading}
             className="w-full h-11 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D42D41] disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-[10px] shadow-[0_8px_24px_rgba(245,158,11,0.2)] active:scale-[0.98]"
           >
             {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Working...</span>
                </div>
             ) : (
               'Update password'
             )}
           </button>
        </form>
      )}

      <div className="text-center pt-2">
        <button
          onClick={(e) => { e.preventDefault(); onSwitch(); }}
          className="text-[10px] font-bold text-gray-700 hover:text-white transition-colors uppercase tracking-[0.1em] flex items-center justify-center gap-2 mx-auto group"
        >
          <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Go back</span>
        </button>
      </div>
    </motion.div>
  );
};

export default RecoveryForm;
