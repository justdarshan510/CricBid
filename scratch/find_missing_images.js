const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, '..', 'src', 'data', 'players.ts');
const tsContent = fs.readFileSync(tsPath, 'utf8');

const arrayMatch = tsContent.match(/export const initialPlayers: Player\[\] = (\[[\s\S]*?\]);/);
if (!arrayMatch) {
  console.error('Could not find initialPlayers array in players.ts');
  process.exit(1);
}

const initialPlayers = JSON.parse(arrayMatch[1]);
const missing = initialPlayers.filter(p => !p.image);
console.log(`Found ${missing.length} players with missing images:`);
missing.forEach(p => {
  console.log(`- ${p.name} (Role: ${p.role}, Rating: ${p.rating})`);
});
