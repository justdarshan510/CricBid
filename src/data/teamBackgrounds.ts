/**
 * Team Background Mapping
 * Maps IPL team short names and IDs to their corresponding background images
 * Images located in: public/team-backgrounds/
 */

// 1. Create team mapping exactly as requested:
export const teamBackgrounds = {
  CSK: "/team-backgrounds/csk-background.png",
  MI: "/team-backgrounds/mi-background.jpg",
  RCB: "/team-backgrounds/rcb-background.jpg",
  KKR: "/team-backgrounds/kkr-background.jpg",
  SRH: "/team-backgrounds/srh-background.jpg",
  DC: "/team-backgrounds/dc-background.jpg",
  RR: "/team-backgrounds/rr-background.jpg",
  PBKS: "/team-backgrounds/pbks-background.jpg",
  GT: "/team-backgrounds/gt-background.jpg",
  LSG: "/team-backgrounds/lsg-background.jpg"
};

// Mapping using full team IDs for consistency with database
const teamIdToBackground: Record<string, string> = {
  'team_csk': '/team-backgrounds/csk-background.png',
  'team_mi': '/team-backgrounds/mi-background.jpg',
  'team_rcb': '/team-backgrounds/rcb-background.jpg',
  'team_kkr': '/team-backgrounds/kkr-background.jpg',
  'team_srh': '/team-backgrounds/srh-background.jpg',
  'team_dc': '/team-backgrounds/dc-background.jpg',
  'team_rr': '/team-backgrounds/rr-background.jpg',
  'team_pbks': '/team-backgrounds/pbks-background.jpg',
  'team_lsg': '/team-backgrounds/lsg-background.jpg',
  'team_gt': '/team-backgrounds/gt-background.jpg'
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
export const FALLBACK_BACKGROUND = 'linear-gradient(135deg, #4E3B1F 0%, #2E2214 100%)';

/**
 * Overlay gradient for readability
 * Medium dark overlay to ensure UI elements are readable over background
 */
export const OVERLAY_GRADIENT = 'linear-gradient(180deg, rgba(245,240,232,0.18) 0%, rgba(235,228,218,0.22) 100%)';
