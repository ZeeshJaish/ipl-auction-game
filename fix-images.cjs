const fs = require('fs');
const https = require('https');

const playersFile = './src/data/players.json';
const players = JSON.parse(fs.readFileSync(playersFile, 'utf8'));

async function fetchWikiImage(title) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=330`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pageId !== '-1' && pages[pageId].thumbnail) {
            resolve(pages[pageId].thumbnail.source);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function fixImages() {
  let updatedCount = 0;
  for (let p of players) {
    if (p.name === 'Shahrukh Khan') {
      p.image = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Shahrukh_Khan.jpg/330px-Shahrukh_Khan.jpg';
      updatedCount++;
      continue;
    }
    
    if (p.image === null) {
      // Try with (cricketer) first
      let img = await fetchWikiImage(`${p.name} (cricketer)`);
      if (!img) {
        // Try without (cricketer)
        img = await fetchWikiImage(p.name);
      }
      
      if (img) {
        p.image = img;
        updatedCount++;
        console.log(`Found image for ${p.name}`);
      } else {
        console.log(`No image found for ${p.name}`);
      }
    }
  }
  
  fs.writeFileSync(playersFile, JSON.stringify(players, null, 2));
  console.log(`Finished! Updated ${updatedCount} images.`);
}

fixImages();
