const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
let projectId = 'cricbid-demo';
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const match = envContent.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID\s*=\s*([^\s#]+)/);
  if (match) {
    projectId = match[1].trim();
  }
}
if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

console.log('Connecting to Firebase project ID:', projectId);

// Initialize Firebase Admin
admin.initializeApp({
  projectId: projectId
});

const db = admin.firestore();

// Load players from src/data/players.ts
const tsPath = path.join(__dirname, '..', 'src', 'data', 'players.ts');
const tsContent = fs.readFileSync(tsPath, 'utf8');
const arrayMatch = tsContent.match(/export const initialPlayers: Player\[\] = (\[[\s\S]*?\]);/);
if (!arrayMatch) {
  console.error('Failed to parse players.ts');
  process.exit(1);
}

const players = JSON.parse(arrayMatch[1]);

async function seed() {
  console.log(`Starting Firestore sync of ${players.length} players...`);
  let count = 0;
  
  for (let i = 0; i < players.length; i += 100) {
    const chunk = players.slice(i, i + 100);
    const batch = db.batch();
    
    chunk.forEach(player => {
      const docRef = db.collection('players').doc(player.id);
      batch.set(docRef, {
        ...player,
        age: 25 // default age
      }, { merge: true });
      count++;
    });
    
    await batch.commit();
    console.log(`Synced ${count}/${players.length} players...`);
  }
  
  console.log('Sync complete!');
}

seed().catch(err => {
  console.error('Sync error:', err);
});
