/**
 * Team Background Mapping
 * Maps IPL team short names and IDs to their corresponding background images
 * Images located in: public/team-backgrounds/
 */

// 1. Create team mapping exactly as requested:
export const teamBackgrounds = {
  CSK: "/team-backgrounds/csk-background.png",
  MI: "/team-backgrounds/mi-background.png",
  RCB: "/team-backgrounds/rcb-background.png",
  KKR: "/team-backgrounds/kkr-background.png",
  SRH: "/team-backgrounds/srh-background.png",
  DC: "/team-backgrounds/dc-background.png",
  RR: "/team-backgrounds/rr-background.png",
  PBKS: "/team-backgrounds/pbks-background.png",
  GT: "/team-backgrounds/gt-background.png",
  LSG: "/team-backgrounds/lsg-background.png"
};

// Mapping using full team IDs for consistency with database
const teamIdToBackground: Record<string, string> = {
  'team_csk': '/team-backgrounds/csk-background.png',
  'team_mi': '/team-backgrounds/mi-background.png',
  'team_rcb': '/team-backgrounds/rcb-background.png',
  'team_kkr': '/team-backgrounds/kkr-background.png',
  'team_srh': '/team-backgrounds/srh-background.png',
  'team_dc': '/team-backgrounds/dc-background.png',
  'team_rr': '/team-backgrounds/rr-background.png',
  'team_pbks': '/team-backgrounds/pbks-background.png',
  'team_lsg': '/team-backgrounds/lsg-background.png',
  'team_gt': '/team-backgrounds/gt-background.png'
};

/**
 * Get background image URL for a team
 * Supports both team IDs (e.g., "team_csk") and short names (e.g., "CSK")
 * @param teamId - Team ID or short name
 * @returns Background image URL or undefined if not found
 */
export const getTeamBackgroundUrl = (teamId: string | null | undefined): string | undefined => {
  if (!teamId) return undefined;
  
  // Try direct ID lookup first
  if (teamIdToBackground[teamId]) {
    return teamIdToBackground[teamId];
  }
  
  // Try short name lookup (using the requested teamBackgrounds map)
  const upperTeamId = teamId.toUpperCase();
  if (teamBackgrounds[upperTeamId as keyof typeof teamBackgrounds]) {
    return teamBackgrounds[upperTeamId as keyof typeof teamBackgrounds];
  }
  
  return undefined;
};

/**
 * Fallback gradient background
 * Used when team background image is not available or fails to load
 */
export const FALLBACK_BACKGROUND = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';

/**
 * Overlay gradient for readability
 * Medium dark overlay to ensure UI elements are readable over background
 */
export const OVERLAY_GRADIENT = 'linear-gradient(180deg, rgba(245,240,232,0.18) 0%, rgba(235,228,218,0.22) 100%)';
