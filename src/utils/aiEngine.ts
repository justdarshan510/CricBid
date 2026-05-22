import { Player } from '../data/players';

// Solver for generating the strongest Playing XI
// Constraints: Max 4 overseas, Min 1 Wicketkeeper (if available)
export function solvePlayingXI(squad: Player[]): { playingXI: Player[]; warnings: string[] } {
  const warnings: string[] = [];
  
  if (squad.length < 11) {
    return {
      playingXI: squad,
      warnings: ['Need at least 11 players in the squad to form a playing XI.']
    };
  }

  // Find all wicketkeepers in squad
  const keepersInSquad = squad.filter(p => p.is_wicketkeeper);
  if (keepersInSquad.length === 0) {
    warnings.push('No Wicketkeeper in squad. Playing XI will lack a designated keeper.');
  }

  // 1. Start by taking the top 11 players sorted by rating descending
  let selected = [...squad]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 11);

  // 2. Ensure Wicketkeeper constraint
  // If there's no keeper in the current 11, but there is one in the squad, swap the keeper in
  const hasKeeperInSelected = selected.some(p => p.is_wicketkeeper);
  if (!hasKeeperInSelected && keepersInSquad.length > 0) {
    // Sort keepers by rating, get the best one
    const bestKeeper = [...keepersInSquad].sort((a, b) => b.rating - a.rating)[0];
    
    // Replace the lowest-rated player in our selected 11 that isn't essential
    selected.sort((a, b) => a.rating - b.rating);
    // Find index of first non-wicketkeeper (since they are all non-wicketkeepers, just the lowest rated)
    selected[0] = bestKeeper;
  }

  // 3. Ensure Overseas constraint (max 4 overseas)
  // Re-sort selected by rating descending
  selected.sort((a, b) => b.rating - a.rating);

  let overseasCount = selected.filter(p => p.overseas).length;
  let iterations = 0;

  // While we have too many overseas players, substitute the lowest-rated overseas player
  // with the highest-rated Indian player from the bench.
  while (overseasCount > 4 && iterations < 15) {
    iterations++;
    const selectedOverseas = selected.filter(p => p.overseas).sort((a, b) => a.rating - b.rating);
    
    // Find bench Indian players (not in selected)
    const benchIndians = squad
      .filter(p => !p.overseas && !selected.some(sel => sel.id === p.id))
      .sort((a, b) => b.rating - a.rating);

    if (benchIndians.length === 0) {
      warnings.push('Not enough Indian players in squad to satisfy the 4-overseas limit.');
      break; // Cannot solve
    }

    // Attempt to swap the lowest rated overseas player in 'selected'
    // but check: if we are swapping out a keeper, make sure we still have a keeper!
    let swapped = false;
    for (let oIdx = 0; oIdx < selectedOverseas.length; oIdx++) {
      const overseasPlayer = selectedOverseas[oIdx];
      
      // Check if removing this player leaves us with 0 keepers (when squad has keepers)
      const isKeeper = overseasPlayer.is_wicketkeeper;
      const otherKeepersSelected = selected.filter(p => p.id !== overseasPlayer.id && p.is_wicketkeeper).length;
      
      if (isKeeper && otherKeepersSelected === 0 && keepersInSquad.length > 0) {
        // Can we swap with an Indian keeper?
        const indianKeepersOnBench = benchIndians.filter(p => p.is_wicketkeeper);
        if (indianKeepersOnBench.length > 0) {
          const replacement = indianKeepersOnBench[0];
          const sIdx = selected.findIndex(p => p.id === overseasPlayer.id);
          selected[sIdx] = replacement;
          swapped = true;
          break;
        }
        // If no Indian keepers on bench, skipping this overseas player for swap if possible
        continue;
      }

      // Perform swap with best Indian bench player
      const replacement = benchIndians[0];
      const sIdx = selected.findIndex(p => p.id === overseasPlayer.id);
      selected[sIdx] = replacement;
      swapped = true;
      break;
    }

    if (!swapped) {
      // If we couldn't swap without violating the keeper rule, force-swap the lowest rated overseas player
      const replacement = benchIndians[0];
      const lowestOverseas = selectedOverseas[0];
      const sIdx = selected.findIndex(p => p.id === lowestOverseas.id);
      selected[sIdx] = replacement;
    }

    overseasCount = selected.filter(p => p.overseas).length;
  }

  // Final check: count overseas
  const finalOverseas = selected.filter(p => p.overseas).length;
  if (finalOverseas > 4) {
    warnings.push(`Playing XI exceeds overseas limit: contains ${finalOverseas} overseas players.`);
  }

  // Sort selected playing XI by cricket order: openers, middle_order/all_rounders, spinner/bowler
  const rolePriority = {
    opener: 1,
    middle_order: 2,
    finisher: 3,
    all_rounder: 4,
    powerplay_bowler: 5,
    death_bowler: 6,
    spinner: 7
  };

  selected.sort((a, b) => (rolePriority[a.role] || 9) - (rolePriority[b.role] || 9));

  return {
    playingXI: selected,
    warnings
  };
}

export interface SquadReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  roleCounts: Record<string, number>;
  overseasCount: number;
}

// Analyze squad composition
export function analyzeSquad(squad: Player[], currentPurse: number): SquadReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const roleCounts = {
    opener: 0,
    middle_order: 0,
    finisher: 0,
    all_rounder: 0,
    spinner: 0,
    death_bowler: 0,
    powerplay_bowler: 0
  };

  squad.forEach(p => {
    if (roleCounts[p.role] !== undefined) {
      roleCounts[p.role]++;
    }
  });

  const overseasCount = squad.filter(p => p.overseas).length;

  // Rule constraints
  if (squad.length > 25) {
    errors.push(`Squad size (${squad.length}) exceeds maximum limit of 25 players.`);
  }
  if (overseasCount > 8) {
    errors.push(`Overseas players (${overseasCount}) exceed maximum limit of 8.`);
  }
  if (currentPurse < 0) {
    errors.push(`Purse limit exceeded: negative balance (${currentPurse.toFixed(2)} Cr).`);
  }

  // Warnings
  if (squad.length < 12) {
    warnings.push(`Squad size (${squad.length}) is below the minimum required 12 players.`);
  }

  // Wicketkeeper warning
  const hasKeeper = squad.some(p => p.is_wicketkeeper);
  if (!hasKeeper && squad.length > 0) {
    warnings.push('No Wicketkeeper in squad. You need a designated keeper in the Playing XI.');
  }

  // Role balance alerts
  if (roleCounts.opener < 2) {
    warnings.push(`Lacking Openers (have ${roleCounts.opener}, recommend at least 2).`);
  }
  if (roleCounts.spinner < 1) {
    warnings.push('Lacking specialist Spinners (recommend at least 1).');
  }
  if (roleCounts.death_bowler < 1) {
    warnings.push('Lacking specialist Death Bowlers (recommend at least 1).');
  }
  if (roleCounts.powerplay_bowler < 1) {
    warnings.push('Lacking Powerplay Bowlers (recommend at least 1).');
  }
  if (roleCounts.finisher < 1) {
    warnings.push('Lacking specialist Finishers (recommend at least 1).');
  }

  // Budget warning
  const slotsLeft = Math.max(0, 12 - squad.length);
  if (slotsLeft > 0 && currentPurse < slotsLeft * 0.5) {
    warnings.push(`Purse warning: Only ${currentPurse.toFixed(2)} Cr left to fill ${slotsLeft} more required squad slots. Save budget for base price bids!`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    roleCounts,
    overseasCount
  };
}

// Generate bidding suggestions for the user
export function getBiddingRecommendations(
  squad: Player[],
  purse: number,
  upcomingPool: Player[]
): {
  recommendedId?: string;
  roleWanted?: string;
  reason?: string;
  alternatives: { id: string; name: string; base_price: number; rating: number; role: string }[];
} {
  const report = analyzeSquad(squad, purse);
  const pool = upcomingPool.filter(p => p.status === 'pool');
  
  if (pool.length === 0) {
    return { alternatives: [] };
  }

  // Identify most critical role gap
  let criticalRole: string | undefined;
  let reason = '';

  const hasKeeper = squad.some(p => p.is_wicketkeeper);
  if (!hasKeeper && pool.some(p => p.is_wicketkeeper)) {
    criticalRole = 'wicketkeeper';
    reason = 'You need a Wicketkeeper to complete your squad composition.';
  } else if (report.roleCounts.death_bowler === 0 && pool.some(p => p.role === 'death_bowler')) {
    criticalRole = 'death_bowler';
    reason = 'Your squad lacks a specialist Death Bowler to bowl critical final overs.';
  } else if (report.roleCounts.spinner === 0 && pool.some(p => p.role === 'spinner')) {
    criticalRole = 'spinner';
    reason = 'Your squad lacks a specialist Spinner to control the middle overs.';
  } else if (report.roleCounts.opener < 2 && pool.some(p => p.role === 'opener')) {
    criticalRole = 'opener';
    reason = 'You have fewer than 2 specialist Openers in your roster.';
  } else if (report.roleCounts.powerplay_bowler === 0 && pool.some(p => p.role === 'powerplay_bowler')) {
    criticalRole = 'powerplay_bowler';
    reason = 'You lack a Powerplay Bowler to take early wickets in the initial overs.';
  } else if (report.roleCounts.finisher === 0 && pool.some(p => p.role === 'finisher')) {
    criticalRole = 'finisher';
    reason = 'You need a designated Finisher to close out run-chases.';
  }

  // Filter candidates matching role and budget
  let candidates = pool;
  if (criticalRole) {
    if (criticalRole === 'wicketkeeper') {
      candidates = pool.filter(p => p.is_wicketkeeper);
    } else {
      candidates = pool.filter(p => p.role === criticalRole);
    }
  }

  // Exclude overseas players if user has 8 overseas players
  const overseasCount = squad.filter(p => p.overseas).length;
  if (overseasCount >= 8) {
    candidates = candidates.filter(p => !p.overseas);
  }

  // Filter candidates we can afford
  candidates = candidates.filter(p => p.base_price <= purse);

  if (candidates.length === 0) {
    // If no candidates in critical role, fallback to any affordable player in the pool
    candidates = pool.filter(p => p.base_price <= purse && (overseasCount < 8 || !p.overseas));
    criticalRole = undefined;
    reason = 'Suggestions based on rating and budget efficiency.';
  }

  // Sort candidates by rating descending
  candidates.sort((a, b) => b.rating - a.rating);

  const recommended = candidates[0];
  
  // Find budget alternatives (cheaper candidates)
  let alternatives = candidates
    .filter(p => recommended ? p.id !== recommended.id : true)
    .sort((a, b) => a.base_price - b.base_price || b.rating - a.rating)
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      name: p.name,
      base_price: p.base_price,
      rating: p.rating,
      role: p.role
    }));

  return {
    recommendedId: recommended?.id,
    roleWanted: criticalRole || recommended?.role,
    reason: recommended ? reason : 'Your squad is balanced. Consider picking high-value marquee players.',
    alternatives
  };
}
