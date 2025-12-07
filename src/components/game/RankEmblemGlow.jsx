import React from 'react';
import { motion } from 'framer-motion';

export default function RankEmblemGlow({ rank, color, glow, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl',
    xl: 'w-40 h-40 text-7xl'
  };
  
  const glowIntensity = rank >= 10 ? 3 : rank >= 7 ? 2.5 : rank >= 4 ? 2 : 1.5;
  
  return (
    <div className="relative">
      {/* Rotating outer glow rings */}
      {rank >= 4 && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle, transparent 60%, ${color}40 80%, transparent 100%)`,
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, transparent 50%, ${color}60 70%, transparent 90%)`,
            }}
            animate={{
              rotate: -360,
              scale: [1, 1.15, 1]
            }}
            transition={{
              rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }
            }}
          />
        </>
      )}
      
      {/* Main emblem */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black relative z-10`}
        style={{
          background: `radial-gradient(circle, ${color}, ${color}aa)`,
          border: `${rank >= 7 ? '5px' : rank >= 4 ? '4px' : '3px'} solid ${color}`,
          boxShadow: `
            0 0 ${20 * glowIntensity}px ${glow},
            inset 0 0 ${15 * glowIntensity}px ${glow}
          `
        }}
        animate={{
          scale: rank >= 10 ? [1, 1.08, 1] : [1, 1.05, 1],
          boxShadow: [
            `0 0 ${20 * glowIntensity}px ${glow}, inset 0 0 ${15 * glowIntensity}px ${glow}`,
            `0 0 ${30 * glowIntensity}px ${glow}, inset 0 0 ${25 * glowIntensity}px ${glow}`,
            `0 0 ${20 * glowIntensity}px ${glow}, inset 0 0 ${15 * glowIntensity}px ${glow}`
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {rank}
        
        {/* Shimmer effect for high ranks */}
        {rank >= 7 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(45deg, transparent 30%, ${color}60 50%, transparent 70%)`,
            }}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </motion.div>
      
      {/* Pulsing aura for Eternal rank */}
      {rank >= 10 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}40, transparent 70%)`,
            filter: 'blur(10px)'
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  );
}