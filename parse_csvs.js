const fs = require('fs');
const path = require('path');

// Custom CSV line splitter that handles quotes
function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Cleans numbers from strings (e.g. "134.46" -> 134.46, "5\\10" -> "5/10", "-" -> null)
function parseFloatClean(val) {
  if (!val) return null;
  const cleaned = val.replace(/[^\d\.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function parseIntClean(val) {
  if (!val) return null;
  const cleaned = val.replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

function parseBasePrice(val) {
  if (!val) return null;
  const lower = val.toLowerCase().trim();
  let num = parseFloat(lower.replace(/[^\d\.]/g, ''));
  if (isNaN(num)) return null;
  
  if (lower.includes('cr') || lower.includes('crore')) {
    return num;
  } else if (lower.includes('l') || lower.includes('lakh')) {
    return num / 100.0; // convert lakhs to crores
  }
  
  // If it's just a raw number, assume it's already in Crores (e.g. "2" or "1.5")
  if (num > 10) {
    return num / 100.0; // If they wrote raw lakhs e.g. "50", convert to 0.5 Cr
  }
  return num;
}

const FILES = [
  { name: 'opener.csv', role: 'opener' },
  { name: 'middle order.csv', role: 'middle_order' },
  { name: 'finisher.csv', role: 'finisher' },
  { name: 'Spinner.csv', role: 'spinner' },
  { name: 'death bowler.csv', role: 'death_bowler' },
  { name: 'powerplay_bowlers.csv', role: 'powerplay_bowler' },
  { name: 'allrounder.csv', role: 'all_rounder' }
];

const playersMap = {};

FILES.forEach(fileInfo => {
  const filePath = path.join(__dirname, fileInfo.name);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${fileInfo.name}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 2) return;

  // Handle allrounder header specifically because of extra rows at top
  let headerIndex = 0;
  if (fileInfo.name === 'allrounder.csv') {
    // Look for the line containing "Name" and "matches played"
    headerIndex = lines.findIndex(l => l.toLowerCase().includes('matches played') && l.toLowerCase().includes('name'));
    if (headerIndex === -1) headerIndex = 0;
  }

  const headerLine = lines[headerIndex];
  const headers = splitCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Find column indices
  const nameIdx = headers.findIndex(h => h === 'name' || h === 'player');
  const countryIdx = headers.findIndex(h => h === 'country' || h === 'nationality');
  const matIdx = headers.findIndex(h => h === 'mat played' || h === 'mat no' || h === 'matches played' || h === 'mat');
  const runsIdx = headers.findIndex(h => h === 'runs');
  const wicketsIdx = headers.findIndex(h => h === 'wickets');
  const econIdx = headers.findIndex(h => h === 'economy' || h === 'econ');
  const bestIdx = headers.findIndex(h => h.startsWith('best'));
  const wkIdx = headers.findIndex(h => h.includes('wicket keeper') || h === 'wk');
  
  // For batting and bowling stats, handle dual avg/strike rate fields
  let avgIdx = headers.findIndex(h => h === 'avg' || h === 'average');
  let srIdx = headers.findIndex(h => h === 'str rate' || h === 'str  rate' || h === 'strike rate' || h === 'strike_rate');
  let basePriceIdx = headers.findIndex(h => h.includes('base price') || h === 'price');

  // Specific column mappings for dual-stat tables like allrounder.csv
  let bowlAvgIdx = -1;
  let bowlSrIdx = -1;
  if (fileInfo.name === 'allrounder.csv') {
    // In allrounder.csv, headers is:
    // S.NO, Name, Type, Bowling Style, Country, matches played, Runs, Hs, avg, ball faced, str rate, 100, 50, 4s, 6s, Runs conceded, Balls, Maidens, Wickets, Avg, Economy, Str rate, Best, 4w, 5w, Base price
    // Column 8 is batting avg, column 19 is bowling avg (Avg)
    // Column 10 is batting str rate, column 21 is bowling str rate (Str rate)
    avgIdx = 8;
    bowlAvgIdx = 19;
    srIdx = 10;
    bowlSrIdx = 21;
    basePriceIdx = 25;
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rowLine = lines[i];
    // Ignore rows that are mostly commas
    if (rowLine.replace(/,/g, '').trim().length === 0) continue;

    const cols = splitCSVLine(rowLine);
    if (cols.length < 2) continue;

    const name = cols[nameIdx]?.trim();
    if (!name || name.toLowerCase() === 'name') continue;

    const country = cols[countryIdx]?.trim() || 'India';
    const overseas = country.toLowerCase() !== 'india';
    
    // Parse stats
    const matches = parseIntClean(cols[matIdx]) || 0;
    const runs = runsIdx !== -1 ? parseIntClean(cols[runsIdx]) : 0;
    const wickets = wicketsIdx !== -1 ? parseIntClean(cols[wicketsIdx]) : 0;
    const economy = econIdx !== -1 ? parseFloatClean(cols[econIdx]) : null;
    const best = bestIdx !== -1 ? cols[bestIdx]?.trim() : null;
    const batting_average = avgIdx !== -1 ? parseFloatClean(cols[avgIdx]) : null;
    const strike_rate = srIdx !== -1 ? parseFloatClean(cols[srIdx]) : null;
    const base_price = basePriceIdx !== -1 ? parseBasePrice(cols[basePriceIdx]) : null;
    
    // Wicket keeper check
    const isWkStr = wkIdx !== -1 ? cols[wkIdx]?.toLowerCase().trim() : '';
    const is_wicketkeeper = isWkStr === 'yes' || isWkStr === 'y' || isWkStr === 'true' || isWkStr === 'keeper';

    const bowler_avg = bowlAvgIdx !== -1 ? parseFloatClean(cols[bowlAvgIdx]) : null;
    const bowler_sr = bowlSrIdx !== -1 ? parseFloatClean(cols[bowlSrIdx]) : null;

    // Check if player already exists
    const key = name.toLowerCase().replace(/\s+/g, '');
    let existing = playersMap[key];

    if (existing) {
      // Merge details
      existing.matches = Math.max(existing.matches, matches);
      if (runs > 0) existing.runs = runs;
      if (wickets > 0) existing.wickets = wickets;
      if (economy !== null) existing.economy = economy;
      if (best && best !== '-') existing.best = best;
      if (batting_average !== null) existing.batting_average = batting_average;
      if (strike_rate !== null) existing.strike_rate = strike_rate;
      if (base_price !== null) existing.base_price = base_price;
      if (is_wicketkeeper) existing.is_wicketkeeper = true;
      
      // If we find them in allrounder, promote role to all_rounder
      if (fileInfo.role === 'all_rounder') {
        existing.role = 'all_rounder';
      }
    } else {
      playersMap[key] = {
        name,
        country,
        overseas,
        role: fileInfo.role,
        matches,
        runs,
        wickets,
        economy,
        best,
        batting_average,
        strike_rate,
        base_price,
        is_wicketkeeper,
        bowler_avg,
        bowler_sr
      };
    }
  }
});

// Post-processing and fallback calculations
const finalPlayers = Object.values(playersMap).map((p, idx) => {
  // Generate ID
  const id = `player_${idx + 1}`;

  // Smart base price fallbacks
  let base_price = p.base_price;
  if (!base_price) {
    if (p.role === 'opener' || p.role === 'middle_order' || p.role === 'finisher') {
      if (p.runs > 4000) base_price = 2.0;
      else if (p.runs > 2500) base_price = 1.5;
      else if (p.runs > 1000) base_price = 1.0;
      else base_price = 0.5;
    } else if (p.role === 'spinner' || p.role === 'death_bowler' || p.role === 'powerplay_bowler') {
      if (p.wickets > 150) base_price = 2.0;
      else if (p.wickets > 100) base_price = 1.5;
      else if (p.wickets > 50) base_price = 1.0;
      else base_price = 0.5;
    } else {
      // All rounders
      if (p.runs > 2000 || p.wickets > 100) base_price = 2.0;
      else if (p.runs > 1000 || p.wickets > 50) base_price = 1.5;
      else base_price = 1.0;
    }
  }

  // Calculate rating
  let rating = 75; // Default average rating
  const matches = p.matches || 10;

  if (p.role === 'opener' || p.role === 'middle_order' || p.role === 'finisher') {
    const avg = p.batting_average || 25;
    const sr = p.strike_rate || 120;
    rating = 70 + (avg - 25) * 0.8 + (sr - 120) * 0.2 + (p.runs / 250);
  } else if (p.role === 'spinner' || p.role === 'death_bowler' || p.role === 'powerplay_bowler') {
    const wpm = p.wickets / matches;
    const econ = p.economy || 8.0;
    rating = 72 + wpm * 15 - (econ - 8.0) * 5 + (p.wickets / 15);
  } else if (p.role === 'all_rounder') {
    const avg = p.batting_average || 22;
    const sr = p.strike_rate || 125;
    const wpm = p.wickets / matches;
    const econ = p.economy || 8.2;
    
    const batRating = 70 + (avg - 22) * 0.8 + (sr - 120) * 0.2 + (p.runs / 300);
    const bowlRating = 70 + wpm * 15 - (econ - 8.0) * 5 + (p.wickets / 20);
    rating = (batRating + bowlRating) / 2;
  }

  // Round rating and constrain between 65 and 99
  rating = Math.min(99, Math.max(65, Math.round(rating)));

  // Generate playing details description
  let batting_style = 'Right-hand bat';
  if (p.name.toLowerCase().includes('rishabh') || p.name.toLowerCase().includes('dhawan') || p.name.toLowerCase().includes('gayle') || p.name.toLowerCase().includes('de kock') || p.name.toLowerCase().includes('ishan') || p.name.toLowerCase().includes('jaiswal') || p.name.toLowerCase().includes('conway') || p.name.toLowerCase().includes('rana')) {
    batting_style = 'Left-hand bat';
  }
  
  let bowling_style = 'Right-arm medium/pace';
  if (p.role === 'spinner') {
    bowling_style = p.name.toLowerCase().includes('chahal') || p.name.toLowerCase().includes('mishra') || p.name.toLowerCase().includes('warne') || p.name.toLowerCase().includes('chawla') || p.name.toLowerCase().includes('gopal') || p.name.toLowerCase().includes('markande') ? 'Legbreak' : 'Offbreak';
    if (p.name.toLowerCase().includes('jadeja') || p.name.toLowerCase().includes('ojha') || p.name.toLowerCase().includes('krunal') || p.name.toLowerCase().includes('axar') || p.name.toLowerCase().includes('santner')) {
      bowling_style = 'Slow left-arm orthodox';
    }
  } else if (p.name.toLowerCase().includes('starc') || p.name.toLowerCase().includes('arshdeep') || p.name.toLowerCase().includes('boult') || p.name.toLowerCase().includes('natarajan') || p.name.toLowerCase().includes('zaheer') || p.name.toLowerCase().includes('mustafizur') || p.name.toLowerCase().includes('behrendorff')) {
    bowling_style = 'Left-arm fast-medium';
  }

  return {
    id,
    name: p.name,
    role: p.role,
    batting_style,
    bowling_style,
    nationality: p.country,
    overseas: p.overseas,
    base_price: parseFloat(base_price.toFixed(2)),
    rating,
    strike_rate: p.strike_rate ? parseFloat(p.strike_rate.toFixed(2)) : undefined,
    batting_average: p.batting_average ? parseFloat(p.batting_average.toFixed(2)) : undefined,
    wickets: p.wickets || undefined,
    economy: p.economy ? parseFloat(p.economy.toFixed(2)) : undefined,
    image: '', // will be handled dynamically or generated via SVG/Canvas
    is_wicketkeeper: p.is_wicketkeeper || undefined,
    status: 'pool'
  };
});

// Sort players by rating descending
finalPlayers.sort((a, b) => b.rating - a.rating);

// Write to players.ts
const outputDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const fileContent = `// Auto-generated player database from CSV files
export interface Player {
  id: string;
  name: string;
  role: 'opener' | 'middle_order' | 'finisher' | 'spinner' | 'death_bowler' | 'powerplay_bowler' | 'all_rounder';
  batting_style: string;
  bowling_style: string;
  nationality: string;
  overseas: boolean;
  base_price: number; // in Crores
  rating: number; // 50 to 99 scale
  strike_rate?: number;
  batting_average?: number;
  wickets?: number;
  economy?: number;
  image?: string;
  is_wicketkeeper?: boolean;
  status: 'pool' | 'active' | 'sold' | 'unsold';
  sold_to?: string;
  sold_price?: number;
}

export const initialPlayers: Player[] = ${JSON.stringify(finalPlayers, null, 2)};
`;

fs.writeFileSync(path.join(outputDir, 'players.ts'), fileContent, 'utf8');
console.log(`Successfully parsed ${finalPlayers.length} unique players and wrote to src/data/players.ts`);
