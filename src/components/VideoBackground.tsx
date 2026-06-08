'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const VideoBackground: React.FC = () => {
  const pathname = usePathname();

  // Only render on the homepage (home menu) route
  if (pathname !== '/') {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: -10 }}>
      {/* Radial vignette layer for a premium cinematic sports feel */}
      <div 
        className="absolute inset-0 z-10" 
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(103, 79, 45, 0.05) 0%, rgba(26, 20, 12, 0.55) 70%, rgba(12, 9, 6, 0.88) 100%)',
        }}
      />
      
      {/* Ambient glassmorphic glow effect */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#674F2D]/5 to-[#121214]/40" />

      {/* Subtle tech grid mesh */}
      <div 
        className="absolute inset-0 z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <video
        src="/background_video.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover opacity-[0.20]"
        style={{
          mixBlendMode: 'screen',
          filter: 'contrast(1.25) brightness(0.85) saturate(1.05)',
        }}
      />
    </div>
  );
};

export default VideoBackground;
