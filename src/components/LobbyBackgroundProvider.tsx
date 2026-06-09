'use client';

import React, { useEffect, useState } from 'react';
import { getTeamBackgroundUrl, FALLBACK_BACKGROUND, OVERLAY_GRADIENT } from '../data/teamBackgrounds';

interface LobbyBackgroundProviderProps {
  teamId: string | null | undefined;
  children: React.ReactNode;
}

/**
 * LobbyBackgroundProvider
 * Renders the dynamic team background for the lobby waiting room
 * Only displays background when a team is selected
 * Includes:
 * - Fixed background container with team image
 * - Dark overlay (0.45 opacity) for readability
 * - Blur effect (5px) behind content
 * - Smooth transitions (0.6s) when team changes
 * - Fallback gradient for missing images
 * 
 * This component ONLY applies to the lobby waiting room page
 */
export const LobbyBackgroundProvider: React.FC<LobbyBackgroundProviderProps> = ({
  teamId,
  children
}) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const url = getTeamBackgroundUrl(teamId);
    setBackgroundUrl(url);
    setIsLoading(true);
    setImageError(false);

    if (url) {
      // Preload the image to check if it exists
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
      };
      img.onerror = () => {
        setImageError(true);
        setIsLoading(false);
      };
      img.src = url;
    } else {
      setIsLoading(false);
    }
  }, [teamId]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="lobby-bg-container lobby-bg-fade-in">
        {!imageError && backgroundUrl ? (
          <img 
            src={backgroundUrl} 
            alt="Team Background" 
            className="lobby-bg-image" 
            style={
              teamId === 'team_csk' || teamId === 'CSK' 
                ? { objectPosition: 'left top' } 
                : undefined
            } 
          />
        ) : (
          <div className="lobby-bg-fallback" />
        )}
      </div>

      {/* Liquid Glass Background Blobs - Warm glowing theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-5] opacity-80">
        <div className="absolute top-[10%] left-[20%] w-[380px] h-[380px] rounded-full bg-white/40 blur-[120px] animate-[float-blob-1_22s_infinite_alternate]" />
        <div className="absolute bottom-[20%] right-[10%] w-[520px] h-[520px] rounded-full bg-[rgba(255,225,180,0.35)] blur-[150px] animate-[float-blob-2_32s_infinite_alternate]" />
        <div className="absolute top-[45%] right-[30%] w-[420px] h-[420px] rounded-full bg-[rgba(255,250,215,0.35)] blur-[130px] animate-[float-blob-3_28s_infinite_alternate]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-blob-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(140px, 90px) scale(1.3); }
          100% { transform: translate(-30px, 160px) scale(0.95); }
        }
        @keyframes float-blob-2 {
          0% { transform: translate(0px, 0px) scale(1.15); }
          50% { transform: translate(-120px, -140px) scale(0.8); }
          100% { transform: translate(80px, -60px) scale(1.25); }
        }
        @keyframes float-blob-3 {
          0% { transform: translate(0px, 0px) scale(0.9); }
          50% { transform: translate(90px, -100px) scale(1.2); }
          100% { transform: translate(-120px, 70px) scale(0.85); }
        }
      `}} />

      {/* Dark overlay for readability */}
      <div
        className="lobby-bg-overlay"
        style={{
          background: OVERLAY_GRADIENT,
        }}
      />

      {/* Blur effect */}
      <div className="lobby-bg-blur" />

      {/* Content wrapper - ensures all UI elements are above background */}
      <div className="lobby-bg-content">
        {children}
      </div>

      {/* Dhoni signature for CSK background at right bottom */}
      {(teamId === 'team_csk' || teamId === 'CSK') && (
        <div className="fixed right-6 bottom-6 w-36 h-36 md:w-48 md:h-48 pointer-events-none z-[20] opacity-80 lobby-bg-fade-in">
          <img 
            src="/dhoni-signature.svg" 
            alt="MS Dhoni Signature" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default LobbyBackgroundProvider;
