import React from 'react';
import { Mail, Lock } from 'lucide-react';
import PremiumInput from './PremiumInput';
import SocialAuth from './SocialAuth';
import { motion } from 'framer-motion';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onLogin: (e: React.FormEvent) => void;
  onForgot: () => void;
  onSocial: (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_x') => void;
  onSwitch: () => void;
  errors: Record<string, string> | null;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onLogin,
  onForgot,
  onSocial,
  errors
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <form onSubmit={onLogin} className="space-y-5">
        <PremiumInput
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          error={errors?.email}
          icon={<Mail size={16} />}
        />
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
             <label className="text-[10px] font-bold text-gray-600 tracking-[0.1em] uppercase">Password</label>
             <button
               type="button"
               onClick={onForgot}
               className="text-[10px] font-bold text-[#F59E0B]/80 hover:text-[#F59E0B] transition-colors uppercase tracking-wider"
             >
               Forgot?
             </button>
          </div>
          <PremiumInput
            label=""
            hideLabel
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors?.password}
            icon={<Lock size={16} />}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D42D41] disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-[11px] shadow-[0_8px_24px_rgba(245,158,11,0.2)] active:scale-[0.98]"
        >
          {loading ? (
             <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Working...</span>
             </div>
          ) : 'Sign in'}
        </button>
      </form>

      <div className="relative flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-white/[0.04]"></div>
        <span className="text-[9px] uppercase tracking-[0.15em] text-gray-700 font-bold whitespace-nowrap">Or use</span>
        <div className="flex-1 h-px bg-white/[0.04]"></div>
      </div>

      <SocialAuth onStrategy={onSocial} loading={loading} disabled={loading} />
    </motion.div>
  );
};

export default LoginForm;
