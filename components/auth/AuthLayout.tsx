import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import AuthBackground from './AuthBackground';
import { BeeMark } from '../BeeMark';

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: string;
  onBack?: () => void;
  onSwitch?: () => void;
  showBack?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, mode, onBack, onSwitch, showBack }) => {
  const title =
    mode === 'login'
      ? 'Welcome Back'
      : mode === 'signup'
        ? 'Join Seesby'
        : mode === 'signup_verify'
          ? 'Check Your Email'
          : mode === 'sso_callback'
            ? 'One moment'
            : 'Reset Your Password';

  const subtitle =
    mode === 'login'
      ? "Don't have an account yet?"
      : mode === 'signup'
        ? 'Already have an account?'
        : mode === 'signup_verify'
          ? 'Enter the code we sent you.'
          : mode === 'sso_callback'
            ? 'Finishing things up...'
            : 'We\'ll help you get back in.';

  const toggleLink = mode === 'login' ? 'Sign up' : 'Log in';

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[#F59E0B] selection:text-white font-sans">
      {/* Decorative Strategic Background */}
      <AuthBackground />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-6">
           {/* Back Button - Moved Outside Card for zero overlap */}
           <div className="h-6 w-full flex items-center mb-4">
              {showBack && (
                <button 
                  onClick={onBack}
                  className="p-1 px-2 text-gray-600 hover:text-white transition-colors group flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Go Back</span>
                </button>
              )}
           </div>

           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="relative group p-3"
           >
              {/* Subtle brand glow behind mark */}
              <div className="absolute inset-0 bg-[#F59E0B]/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <BeeMark size={44} className="relative z-10" />
           </motion.div>

           <motion.div
             key={mode}
             initial={{ opacity: 0, y: 5 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center space-y-1 mt-3"
           >
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {title}
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                {subtitle} { (mode === 'login' || mode === 'signup') && (
                  <button onClick={onSwitch} className="text-[#F59E0B] hover:text-[#FBBF24] ml-1 cursor-pointer font-semibold transition-colors">{toggleLink}</button>
                )}
              </p>
           </motion.div>

           <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-[#F59E0B]/80">
              See clearly. Through craft.
           </p>
        </div>

        {/* Main Auth Card */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative bg-[#0A0A0A]/60 border border-white/[0.08] rounded-[28px] p-8 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
        >
          {/* Back button removed from inside card to fix overlap */}
          <div className="relative">
            {children}
          </div>
        </motion.div>

        {/* Footer / Trust Factors */}
        <div className="mt-8 flex flex-col items-center gap-5">
           <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] font-bold text-gray-700">
              <Shield size={9} className="text-gray-800" />
              <span>Secure & Encrypted</span>
           </div>
           <p className="text-gray-800 text-[9px] font-bold uppercase tracking-[0.1em] opacity-40">
              © 2026 Seesby — See clearly. Through craft.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
