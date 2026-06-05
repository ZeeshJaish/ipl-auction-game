import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { additionalPlayers } from './realPlayersList.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teams = [
  { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', color: '#FFFF3C', secondaryColor: '#0081E9', purse: 1000000000 },
  { id: 'mi', name: 'Mumbai Indians', shortName: 'MI', color: '#004BA0', secondaryColor: '#D1AB3E', purse: 1000000000 },
  { id: 'rcb', name: 'Royal Challengers Bengaluru', shortName: 'RCB', color: '#EC1C24', secondaryColor: '#000000', purse: 1000000000 },
  { id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', color: '#2E0854', secondaryColor: '#B3A123', purse: 1000000000 },
  { id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', color: '#FF822A', secondaryColor: '#000000', purse: 1000000000 },
  { id: 'dc', name: 'Delhi Capitals', shortName: 'DC', color: '#00008B', secondaryColor: '#EF1B23', purse: 1000000000 },
  { id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', color: '#EA1B85', secondaryColor: '#000000', purse: 1000000000 },
  { id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', color: '#ED1B24', secondaryColor: '#D7C15C', purse: 1000000000 },
  { id: 'gt', name: 'Gujarat Titans', shortName: 'GT', color: '#1B2133', secondaryColor: '#B3A123', purse: 1000000000 },
  { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', color: '#005087', secondaryColor: '#FF9900', purse: 1000000000 },
];

const topPlayers = [
  { name: 'Virat Kohli', role: 'Batsman', country: 'India', basePrice: 20000000, battingRating: 95, bowlingRating: 10 },
  { name: 'MS Dhoni', role: 'Wicket-Keeper', country: 'India', basePrice: 20000000, battingRating: 88, bowlingRating: 5 },
  { name: 'Rohit Sharma', role: 'Batsman', country: 'India', basePrice: 20000000, battingRating: 92, bowlingRating: 10 },
  { name: 'Jasprit Bumrah', role: 'Bowler', country: 'India', basePrice: 20000000, battingRating: 15, bowlingRating: 97 },
  { name: 'Rashid Khan', role: 'Bowler', country: 'Afghanistan', basePrice: 20000000, battingRating: 55, bowlingRating: 96 },
  { name: 'Hardik Pandya', role: 'All-Rounder', country: 'India', basePrice: 20000000, battingRating: 85, bowlingRating: 82 },
  { name: 'Suryakumar Yadav', role: 'Batsman', country: 'India', basePrice: 20000000, battingRating: 96, bowlingRating: 5 },
  { name: 'Ben Stokes', role: 'All-Rounder', country: 'England', basePrice: 20000000, battingRating: 88, bowlingRating: 80 },
  { name: 'Pat Cummins', role: 'All-Rounder', country: 'Australia', basePrice: 20000000, battingRating: 65, bowlingRating: 90 },
  { name: 'Glenn Maxwell', role: 'All-Rounder', country: 'Australia', basePrice: 20000000, battingRating: 90, bowlingRating: 70 },
  { name: 'Trent Boult', role: 'Bowler', country: 'New Zealand', basePrice: 20000000, battingRating: 10, bowlingRating: 91 },
  { name: 'KL Rahul', role: 'Wicket-Keeper', country: 'India', basePrice: 20000000, battingRating: 89, bowlingRating: 5 },
  { name: 'Rishabh Pant', role: 'Wicket-Keeper', country: 'India', basePrice: 20000000, battingRating: 91, bowlingRating: 5 },
  { name: 'Ravindra Jadeja', role: 'All-Rounder', country: 'India', basePrice: 20000000, battingRating: 80, bowlingRating: 88 },
  { name: 'Jos Buttler', role: 'Wicket-Keeper', country: 'England', basePrice: 20000000, battingRating: 94, bowlingRating: 5 },
  { name: 'David Warner', role: 'Batsman', country: 'Australia', basePrice: 15000000, battingRating: 89, bowlingRating: 5 },
  { name: 'Shubman Gill', role: 'Batsman', country: 'India', basePrice: 20000000, battingRating: 93, bowlingRating: 5 },
  { name: 'Mitchell Starc', role: 'Bowler', country: 'Australia', basePrice: 20000000, battingRating: 25, bowlingRating: 93 },
  { name: 'Sam Curran', role: 'All-Rounder', country: 'England', basePrice: 20000000, battingRating: 75, bowlingRating: 82 },
  { name: 'Kagiso Rabada', role: 'Bowler', country: 'South Africa', basePrice: 20000000, battingRating: 20, bowlingRating: 90 },
  { name: 'Faf du Plessis', role: 'Batsman', country: 'South Africa', basePrice: 15000000, battingRating: 88, bowlingRating: 5 },
  { name: 'Quinton de Kock', role: 'Wicket-Keeper', country: 'South Africa', basePrice: 20000000, battingRating: 89, bowlingRating: 5 },
  { name: 'Sunil Narine', role: 'All-Rounder', country: 'West Indies', basePrice: 15000000, battingRating: 75, bowlingRating: 89 },
  { name: 'Andre Russell', role: 'All-Rounder', country: 'West Indies', basePrice: 20000000, battingRating: 92, bowlingRating: 78 },
  { name: 'Yuzvendra Chahal', role: 'Bowler', country: 'India', basePrice: 15000000, battingRating: 10, bowlingRating: 88 },
  { name: 'Mohammed Shami', role: 'Bowler', country: 'India', basePrice: 20000000, battingRating: 15, bowlingRating: 90 },
  { name: 'Heinrich Klaasen', role: 'Wicket-Keeper', country: 'South Africa', basePrice: 20000000, battingRating: 92, bowlingRating: 5 },
  { name: 'Nicholas Pooran', role: 'Wicket-Keeper', country: 'West Indies', basePrice: 20000000, battingRating: 90, bowlingRating: 5 },
  { name: 'Jofra Archer', role: 'Bowler', country: 'England', basePrice: 15000000, battingRating: 30, bowlingRating: 89 },
  { name: 'Sanju Samson', role: 'Wicket-Keeper', country: 'India', basePrice: 20000000, battingRating: 88, bowlingRating: 5 },
];

const fetchWikiImage = async (name) => {
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
    const data = await response.json();
    if (data.thumbnail && data.thumbnail.source) {
      return data.thumbnail.source;
    }
  } catch (err) {
    console.log(`Failed to fetch image for ${name}`);
  }
  return null;
};

const generatePlayers = async () => {
  let players = [];
  let idCounter = 1;

  for (let p of topPlayers) {
    const isOverseas = p.country !== 'India';
    console.log(`Fetching image for ${p.name}...`);
    const image = await fetchWikiImage(p.name);
    players.push({ ...p, id: idCounter++, isOverseas, image });
  }

  const basePrices = [2000000, 5000000, 7500000, 10000000, 15000000, 20000000];

  for (let p of additionalPlayers) {
    const role = p.role;
    const isOverseas = p.country !== 'India';
    const basePrice = basePrices[Math.floor(Math.random() * (basePrices.length - (Math.random() > 0.8 ? 0 : 2)))]; 
    
    let battingRating = 10 + Math.floor(Math.random() * 30);
    let bowlingRating = 10 + Math.floor(Math.random() * 30);
    
    if (role === 'Batsman' || role === 'Wicket-Keeper') {
      battingRating = 60 + Math.floor(Math.random() * 25);
      bowlingRating = 5 + Math.floor(Math.random() * 20);
    } else if (role === 'Bowler') {
      battingRating = 5 + Math.floor(Math.random() * 30);
      bowlingRating = 60 + Math.floor(Math.random() * 25);
    } else if (role === 'All-Rounder') {
      battingRating = 50 + Math.floor(Math.random() * 30);
      bowlingRating = 50 + Math.floor(Math.random() * 30);
    }

    console.log(`Fetching image for ${p.name}...`);
    const image = await fetchWikiImage(p.name);

    players.push({
      id: idCounter++,
      name: p.name,
      role,
      country: p.country,
      isOverseas,
      basePrice,
      battingRating,
      bowlingRating,
      image
    });
  }
  
  return players;
};

const run = async () => {
  const dataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)){
      fs.mkdirSync(dataDir, { recursive: true });
  }

  const players = await generatePlayers();

  fs.writeFileSync(path.join(dataDir, 'teams.json'), JSON.stringify(teams, null, 2));
  fs.writeFileSync(path.join(dataDir, 'players.json'), JSON.stringify(players, null, 2));

  console.log('Mock data generated successfully in src/data!');
};

run();
