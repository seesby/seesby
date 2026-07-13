import React, { useState } from 'react';
import { Mail, Lock, Check } from 'lucide-react';
import PremiumInput from './PremiumInput';
import SocialAuth from './SocialAuth';
import { motion } from 'framer-motion';

interface SignupFormProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSignup: (e: React.FormEvent) => void;
  onSocial: (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_x') => void;
  onSwitch: () => void;
  errors: Record<string, string> | null;
}

const SignupForm: React.FC<SignupFormProps> = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSignup,
  onSocial,
  errors
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <form onSubmit={onSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <PremiumInput
            label="First Name"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            error={errors?.firstName}
          />
          <PremiumInput
            label="Last Name"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            error={errors?.lastName}
          />
        </div>
        <PremiumInput
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          error={errors?.email}
          icon={<Mail size={16} />}
        />
        <PremiumInput
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          error={errors?.password}
          icon={<Lock size={16} />}
        />

        <div 
          className="flex items-start gap-2.5 px-1 group cursor-pointer" 
          onClick={() => setAgreed(!agreed)}
        >
          <div className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-md border transition-all flex items-center justify-center ${agreed ? 'bg-[#F59E0B] border-[#F59E0B]' : 'bg-transparent border-white/10 group-hover:border-white/40'}`}>
            {agreed && <Check size={10} className="text-white stroke-[3]" />}
          </div>
          <p className="text-[10px] text-gray-600 leading-tight select-none pt-0.5 font-medium">
            I agree to the <span className="text-white/60 hover:text-white transition-colors cursor-pointer border-b border-white/10">Terms of Service</span>.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !agreed}
          className="w-full h-11 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D42D41] disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-[10px] mt-2 shadow-[0_8px_24px_rgba(245,158,11,0.2)] active:scale-[0.98]"
        >
          {loading ? (
             <div className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Working...</span>
             </div>
          ) : 'Create account'}
        </button>
      </form>

      <div className="relative flex items-center gap-4 py-1">
        <div className="flex-1 h-px bg-white/[0.04]"></div>
        <span className="text-[9px] uppercase tracking-[0.15em] text-gray-700 font-bold whitespace-nowrap">Or use</span>
        <div className="flex-1 h-px bg-white/[0.04]"></div>
      </div>

      <SocialAuth onStrategy={onSocial} loading={loading} disabled={loading} />
    </motion.div>
  );
};

export default SignupForm;
