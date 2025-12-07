import React from 'react';
import { motion } from 'framer-motion';

export default function RankEmblemParticles({ rank, color, size = 'md' }) {
  const particleCount = Math.min(rank * 3, 30);
  const radius = size === 'lg' ? 80 : size === 'md' ? 60 : 40;
  
  // Different particle patterns for different tiers
  const getTierPattern = () => {
    if (rank >= 10) return 'spiral'; // Eternal
    if (rank >= 7) return 'ring'; // Divine
    if (rank >= 4) return 'burst'; // Demi-God
    if (rank >= 1) return 'float'; // Ascendant
    return 'none'; // Mortal
  };
  
  const pattern = getTierPattern();
  
  if (pattern === 'none' || rank === 0) return null;
  
  // Spiral pattern for Eternal rank
  if (pattern === 'spiral') {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * Math.PI * 4;
          const spiralRadius = (i / particleCount) * radius;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '4px',
                height: '4px',
                background: color,
                boxShadow: `0 0 10px ${color}`,
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [
                  Math.cos(angle) * spiralRadius,
                  Math.cos(angle + Math.PI * 2) * spiralRadius,
                ],
                y: [
                  Math.sin(angle) * spiralRadius,
                  Math.sin(angle + Math.PI * 2) * spiralRadius,
                ],
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut'
              }}
            />
          );
        })}
      </div>
    );
  }
  
  // Ring pattern for Divine rank
  if (pattern === 'ring') {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * Math.PI * 2;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '3px',
                height: '3px',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.05,
                ease: 'easeInOut'
              }}
            />
          );
        })}
        
        {/* Pulsing rings */}
        {[0, 1, 2].map((ringIndex) => (
          <motion.div
            key={`ring-${ringIndex}`}
            className="absolute rounded-full border-2"
            style={{
              borderColor: color,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: [0, radius * 2, radius * 2.5],
              height: [0, radius * 2, radius * 2.5],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: ringIndex * 1,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>
    );
  }
  
  // Burst pattern for Demi-God rank
  if (pattern === 'burst') {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * Math.PI * 2;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '3px',
                height: '3px',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos(angle) * radius, Math.cos(angle) * radius * 1.2],
                y: [0, Math.sin(angle) * radius, Math.sin(angle) * radius * 1.2],
                opacity: [1, 0.5, 0],
                scale: [1, 1.2, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.03,
                ease: 'easeOut'
              }}
            />
          );
        })}
      </div>
    );
  }
  
  // Float pattern for Ascendant rank
  if (pattern === 'float') {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: Math.min(particleCount, 15) }).map((_, i) => {
          const randomX = (Math.random() - 0.5) * radius * 2;
          const randomY = (Math.random() - 0.5) * radius * 2;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '2px',
                height: '2px',
                background: color,
                boxShadow: `0 0 4px ${color}`,
                left: '50%',
                top: '50%',
              }}
              initial={{
                x: randomX,
                y: randomY,
                opacity: 0
              }}
              animate={{
                x: [randomX, randomX + (Math.random() - 0.5) * 20, randomX],
                y: [randomY, randomY - 30, randomY - 60],
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          );
        })}
      </div>
    );
  }
  
  return null;
}