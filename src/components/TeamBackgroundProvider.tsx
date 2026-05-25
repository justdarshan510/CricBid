'use client';

import React, { useEffect, useState } from 'react';
import { getTeamBackgroundUrl, FALLBACK_BACKGROUND, OVERLAY_GRADIENT } from '../data/teamBackgrounds';

interface TeamBackgroundProviderProps {
  teamId: string | null | undefined;
  children: React.ReactNode;
}

/**
 * TeamBackgroundProvider
 * Renders the dynamic team background for bidding pages
 * Includes:
 * - Fixed background container with team image
 * - Dark overlay for readability
 * - Blur effect behind content
 * - Smooth transitions when team changes
 * - Fallback gradient when image is unavailable
 */
export const TeamBackgroundProvider: React.FC<TeamBackgroundProviderProps> = ({
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
    <div className="relative w-full min-h-screen">
      <div className="team-bg-container team-bg-fade-in">
        {!imageError && backgroundUrl ? (
          <img src={backgroundUrl} alt="Team Background" className="team-bg-image" />
        ) : (
          <div className="team-bg-fallback" />
        )}
      </div>

      {/* Dark overlay for readability */}
      <div
        className="team-bg-overlay"
        style={{
          background: OVERLAY_GRADIENT,
        }}
      />

      {/* Blur effect */}
      <div className="team-bg-blur" />

      {/* Content wrapper */}
      <div className="team-bg-content">
        {children}
      </div>
    </div>
  );
};

export default TeamBackgroundProvider;
