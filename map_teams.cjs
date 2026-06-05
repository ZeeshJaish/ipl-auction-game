const fs = require('fs');
const path = require('path');

const playersFile = path.join(__dirname, 'src', 'data', 'players.json');
let players = JSON.parse(fs.readFileSync(playersFile, 'utf8'));

const mappings = {
  'csk': ['MS Dhoni', 'Ravindra Jadeja', 'Ruturaj Gaikwad', 'Matheesha Pathirana', 'Shivam Dube', 'Deepak Chahar', 'Ajinkya Rahane', 'Devon Conway', 'Rachin Ravindra', 'Daryl Mitchell', 'Shardul Thakur'],
  'mi': ['Rohit Sharma', 'Hardik Pandya', 'Jasprit Bumrah', 'Suryakumar Yadav', 'Ishan Kishan', 'Tim David', 'Gerald Coetzee', 'Tilak Varma', 'Piyush Chawla', 'Romario Shepherd'],
  'rcb': ['Virat Kohli', 'Faf du Plessis', 'Glenn Maxwell', 'Mohammed Siraj', 'Rajat Patidar', 'Cameron Green', 'Dinesh Karthik', 'Will Jacks', 'Lockie Ferguson'],
  'kkr': ['Shreyas Iyer', 'Andre Russell', 'Sunil Narine', 'Rinku Singh', 'Mitchell Starc', 'Varun Chakaravarthy', 'Venkatesh Iyer', 'Nitish Rana', 'Phil Salt', 'Harshit Rana'],
  'srh': ['Pat Cummins', 'Travis Head', 'Abhishek Sharma', 'Heinrich Klaasen', 'Bhuvneshwar Kumar', 'Aiden Markram', 'T Natarajan', 'Washington Sundar'],
  'dc': ['Rishabh Pant', 'Axar Patel', 'Kuldeep Yadav', 'David Warner', 'Mitchell Marsh', 'Prithvi Shaw', 'Anrich Nortje', 'Tristan Stubbs', 'Jake Fraser-McGurk'],
  'rr': ['Sanju Samson', 'Jos Buttler', 'Yashasvi Jaiswal', 'Yuzvendra Chahal', 'Trent Boult', 'R Ashwin', 'Riyan Parag', 'Shimron Hetmyer', 'Avesh Khan', 'Sandeep Sharma'],
  'pbks': ['Sam Curran', 'Arshdeep Singh', 'Kagiso Rabada', 'Shikhar Dhawan', 'Liam Livingstone', 'Jonny Bairstow', 'Jitesh Sharma', 'Shashank Singh', 'Ashutosh Sharma', 'Harshal Patel'],
  'gt': ['Shubman Gill', 'Rashid Khan', 'Mohammed Shami', 'David Miller', 'Kane Williamson', 'Sai Sudharsan', 'Rahul Tewatia', 'Mohit Sharma', 'Noor Ahmad', 'Spencer Johnson'],
  'lsg': ['KL Rahul', 'Nicholas Pooran', 'Quinton de Kock', 'Ravi Bishnoi', 'Marcus Stoinis', 'Krunal Pandya', 'Mayank Yadav', 'Naveen-ul-Haq', 'Ayush Badoni']
};

let count = 0;
players = players.map(p => {
  let realTeamId = null;
  for (const [team, names] of Object.entries(mappings)) {
    if (names.includes(p.name)) {
      realTeamId = team;
      count++;
      break;
    }
  }
  return { ...p, realTeamId };
});

fs.writeFileSync(playersFile, JSON.stringify(players, null, 2));
console.log(`Updated ${count} players with realTeamId`);
