const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'premium_player_map.json');
let mapData = {};
try {
  mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
} catch (e) {
  console.log("No map found");
  process.exit(1);
}

const tsPath = path.join(__dirname, 'src', 'data', 'players.ts');
let tsData = fs.readFileSync(tsPath, 'utf8');

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const manualMappings = {
  "cris gayle": "/assets/player-avatars/Chris_Gayle.png",
  "k l rahul": "/assets/player-avatars/Kl_Rahul.png",
  "shikhar dhawan": "/assets/player-avatars/Shikar_Dhawan.png",
  "heinrich  klaasen": "/assets/player-avatars/Heinrich_Klaasen.png",
  "bhuvneshwar kumar": "/assets/player-avatars/Bhuvneswar_Kumar.png",
  "varun chakaravarthy": "/assets/player-avatars/Varun_Chakaravarty.png",
  "josh hazlewood": "/assets/player-avatars/Josh_Hazlewood.png",
  "quinton de kock": "/assets/player-avatars/Quinton_De_Kock.png",
  "tilak  varma": "/assets/player-avatars/Tilak_Varma.png",
  "mohammed siraj": "/assets/player-avatars/Mohammad_Siraj.png",
  "ambati raydu": "/assets/player-avatars/Ambati_Rayudu.png",
  "virender sehwag": "/assets/player-avatars/Virander_Sehwag.png",
  "kane  willamson": "/assets/player-avatars/Kane_Williamson.png",
  "nithish rana": "/assets/player-avatars/Nitish_Rana.png",
  "brendon mccullum": "/assets/player-avatars/Brendon_mccullum.png",
  "dwayne bravo": "/assets/player-avatars/Dwyane_Bravo.png",
  "mitchell marsh": "/assets/player-avatars/Mitchell_Marsh.png",
  "riygan parag": "/assets/player-avatars/Riyan_Parag.png",
  "harbhajan singh": "/assets/player-avatars/Harbajan_Singh.png",
  "prithvi shaw": "/assets/player-avatars/Prithivi_Shaw.png",
  "shakib al hasan": "/assets/player-avatars/Shakib_Al_Hassan.png",
  "piyush chawla": "/assets/player-avatars/Piyush_Chawala.png",
  "marcus stoinis": "/assets/player-avatars/Marcus_Stonis.png",
  "krishnappa gowtham": "/assets/player-avatars/Krrishnappa_Gowtam.png",
  "mohammed nabi": "/assets/player-avatars/Mohammad_Nabi.png",
  "eoin morgan": "/assets/player-avatars/Eion_Morgan.png",
  "sarfraz khan": "/assets/player-avatars/Sarfaraz_Khan.png",
  "shahbaz ahmed": "/assets/player-avatars/Shabaz_Ahamad.png",
  "wanindu hasaranga": "/assets/player-avatars/Wanindhu_Hasranga.png",
  "tillakaratne dilshan": "/assets/player-avatars/Tilakaratne_Dilshan.png"
};

// We want to replace the empty image string with the mapped one
let newTsData = tsData.replace(/(\{\s*"id":\s*"[^"]+",\s*"name":\s*"([^"]+)",[\s\S]*?"image":\s*")([^"]*)(")/g, (match, p1, name, p3, p4) => {
    const key = name.toLowerCase().trim();
    let mappedImage = p3;
    
    const normalizedKey = normalize(key);
    
    if (manualMappings[key]) {
        mappedImage = manualMappings[key];
    } else if (mapData[key]) {
        mappedImage = mapData[key];
    } else {
        // Try normalized key lookup
        let found = false;
        for (const [mapName, mapImage] of Object.entries(mapData)) {
            if (normalize(mapName) === normalizedKey) {
                mappedImage = mapImage;
                found = true;
                break;
            }
        }
        
        if (!found) {
            // Try partial match
            for (const [mapName, mapImage] of Object.entries(mapData)) {
                if (key.includes(mapName) || mapName.includes(key)) {
                    mappedImage = mapImage;
                    break;
                }
            }
        }
    }
    
    return p1 + mappedImage + p4;
});

fs.writeFileSync(tsPath, newTsData, 'utf8');
console.log('Updated players.ts');

