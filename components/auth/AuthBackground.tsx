import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const AuthBackground: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#050505]">
      {/* Subtle Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1)_0.4px,transparent_0.5px)] [background-size:4px_4px]" />

      {/* Strategic Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top Right Glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 0.06 } : {
            opacity: [0.05, 0.08, 0.05],
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: prefersReducedMotion ? 0 : Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#F59E0B]/20 blur-[120px]"
        />

        {/* Bottom Left Glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 0.04 } : {
            opacity: [0.03, 0.06, 0.03],
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ 
            duration: 20, 
            repeat: prefersReducedMotion ? 0 : Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#F59E0B]/10 blur-[140px]"
        />

        {/* Center Soft Field */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.02)_0%,transparent_70%)]"></div>
      </div>

      {/* Subtle Mesh Grid - Optimized */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Dynamic Light Sweep */}
      <motion.div
        animate={prefersReducedMotion ? { opacity: 0 } : {
          x: ['-100%', '200%'],
          opacity: [0, 0.03, 0]
        }}
        transition={{
          duration: 10,
          repeat: prefersReducedMotion ? 0 : Infinity,
          ease: "linear",
          delay: 5
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent w-1/2 h-full skew-x-12 blur-[100px]"
      />
    </div>
  );
};

export default AuthBackground;
