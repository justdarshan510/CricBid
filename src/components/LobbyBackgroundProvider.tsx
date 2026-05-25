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

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: imageError || !backgroundUrl 
      ? "url('/stadium_bg.png')" 
      : `url('${backgroundUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Background container - fixed behind all content */}
      <div
        className="lobby-bg-image lobby-bg-fade-in"
        style={backgroundStyle}
      />

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
    </div>
  );
};

export default LobbyBackgroundProvider;
