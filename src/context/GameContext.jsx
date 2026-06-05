import React, { createContext, useReducer, useEffect } from 'react';
import initialTeams from '../data/teams.json';
import initialPlayers from '../data/players.json';

// Shuffle function for players
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateAuctionQueue = (players) => {
  let marquee = [];
  let batsmen = [];
  let allrounders = [];
  let wicketkeepers = [];
  let bowlers = [];
  let uncapped = [];

  const teamIds = initialTeams.map(t => t.id);

  players.forEach(p => {
    // Give ~30% of players a historical home team for RTM drama
    const homeTeamId = Math.random() < 0.3 ? teamIds[Math.floor(Math.random() * teamIds.length)] : null;
    const playerWithHome = { ...p, homeTeamId };

    if (p.basePrice < 5000000) {
      uncapped.push({ ...playerWithHome, poolName: 'Uncapped Players' });
    } else if (p.basePrice >= 15000000) {
      marquee.push({ ...playerWithHome, poolName: 'Marquee Players' });
    } else {
      if (p.role === 'Batsman') batsmen.push({ ...playerWithHome, poolName: 'Capped Batsmen' });
      else if (p.role === 'All-Rounder') allrounders.push({ ...playerWithHome, poolName: 'Capped All-Rounders' });
      else if (p.role === 'Wicket-Keeper') wicketkeepers.push({ ...playerWithHome, poolName: 'Capped Wicket-Keepers' });
      else bowlers.push({ ...playerWithHome, poolName: 'Capped Bowlers' });
    }
  });

  return [
    ...shuffleArray(marquee),
    ...shuffleArray(batsmen),
    ...shuffleArray(allrounders),
    ...shuffleArray(wicketkeepers),
    ...shuffleArray(bowlers),
    ...shuffleArray(uncapped)
  ];
};

const getInitialState = () => ({
  activeSlot: null,
  userTeam: null,
  teams: initialTeams.map(t => ({ ...t, squad: [], rtmCards: 2 })),
  auctionQueue: generateAuctionQueue([...initialPlayers]),
  currentPlayer: null,
  biddingState: {
    currentBid: 0,
    currentBidder: null,
    biddingActive: false,
    log: []
  },
  auctionPhase: 'SETUP',
  tournamentStats: {},
  schedule: [],
  currentMatchIndex: 0,
  pointsTable: {},
  tradeOffers: [],
  newsItems: [],
  season: 2026,
  isMegaAuction: false,
  legacyStats: [],
  availablePlayers: [...initialPlayers]
});

export const GameContext = createContext();

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_GAME':
      return {
        ...action.payload.savedState,
        activeSlot: action.payload.slotId
      };
      
    case 'NEW_GAME':
      return {
        ...getInitialState(),
        activeSlot: action.payload.slotId
      };

    case 'SELECT_TEAM':
      return {
        ...state,
        userTeam: action.payload,
        auctionPhase: 'AUCTION'
      };

    case 'CREATE_CUSTOM_TEAM': {
      const newTeam = {
        id: `custom_${Date.now()}`,
        name: action.payload.name,
        shortName: action.payload.shortName,
        color: action.payload.color,
        secondaryColor: action.payload.secondaryColor,
        purse: 1000000000,
        squad: [],
        rtmCards: 2
      };
      
      // Replace the last team in the list with the custom team to keep it at 10 teams
      const updatedTeams = [...state.teams];
      updatedTeams[updatedTeams.length - 1] = newTeam;

      return {
        ...state,
        teams: updatedTeams,
        userTeam: newTeam.id,
        auctionPhase: 'AUCTION'
      };
    }
    
    case 'NEXT_PLAYER':
      if (state.auctionQueue.length === 0) {
        return { ...state, auctionPhase: 'TOURNAMENT' };
      }
      const nextPlayer = state.auctionQueue[0];
      return {
        ...state,
        auctionQueue: state.auctionQueue.slice(1),
        currentPlayer: nextPlayer,
        biddingState: {
          currentBid: nextPlayer.basePrice,
          currentBidder: null,
          biddingActive: true,
          log: [`${nextPlayer.name} is on the block! Base price: ₹${(nextPlayer.basePrice / 10000000).toFixed(2)} Cr`]
        }
      };

    case 'PLACE_BID':
      const { teamId, amount } = action.payload;
      return {
        ...state,
        biddingState: {
          ...state.biddingState,
          currentBid: amount,
          currentBidder: teamId,
          log: [`${state.teams.find(t => t.id === teamId).shortName} bids ₹${(amount / 10000000).toFixed(2)} Cr`, ...state.biddingState.log]
        }
      };

    case 'SELL_PLAYER': {
      const { currentBidder, currentBid } = state.biddingState;
      const { rtmTeamId } = action.payload || {};
      
      if (!currentBidder) {
        return {
          ...state,
          biddingState: {
            ...state.biddingState,
            biddingActive: false,
            log: [`${state.currentPlayer.name} goes UNSOLD.`, ...state.biddingState.log]
          }
        };
      }

      // If RTM was used, sell to the home team instead and deduct their RTM card
      const finalBidderId = rtmTeamId || currentBidder;

      const updatedTeams = state.teams.map(t => {
        if (t.id === finalBidderId) {
          return {
            ...t,
            purse: t.purse - currentBid,
            squad: [...t.squad, { ...state.currentPlayer, boughtFor: currentBid }],
            rtmCards: rtmTeamId === t.id ? t.rtmCards - 1 : t.rtmCards
          };
        }
        return t;
      });

      return {
        ...state,
        teams: updatedTeams,
        biddingState: {
          ...state.biddingState,
          biddingActive: false,
          log: [rtmTeamId ? `🚨 RTM EXERCISED! ${state.currentPlayer.name} stolen back by ${state.teams.find(t => t.id === finalBidderId).shortName} at ₹${(currentBid / 10000000).toFixed(2)} Cr!` : `SOLD! ${state.currentPlayer.name} to ${state.teams.find(t => t.id === finalBidderId).shortName} for ₹${(currentBid / 10000000).toFixed(2)} Cr`, ...state.biddingState.log]
        }
      };
    }

    case 'FORCE_SELL': {
      const { teamId, amount } = action.payload;
      
      const updatedTeams2 = state.teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            purse: t.purse - amount,
            squad: [...t.squad, { ...state.currentPlayer, boughtFor: amount }]
          };
        }
        return t;
      });

      return {
        ...state,
        teams: updatedTeams2,
        biddingState: {
          ...state.biddingState,
          biddingActive: false,
          currentBid: amount,
          currentBidder: teamId,
          log: [`SUPER BID! ${state.currentPlayer.name} secured by ${state.teams.find(t => t.id === teamId).shortName} for ₹${(amount / 10000000).toFixed(2)} Cr`, ...state.biddingState.log]
        }
      };
    }

    case 'SET_PURSE':
      return {
        ...state,
        teams: state.teams.map(t => 
          t.id === action.payload.teamId 
            ? { ...t, purse: action.payload.amount }
            : t
        )
      };

    case 'UPDATE_STATS': {
      const newStats = { ...state.tournamentStats };
      const { playerPerformances } = action.payload;
      let newNews = [...(state.newsItems || [])];
      
      // Deep copy teams to update form and injuries
      const updatedTeams = state.teams.map(t => ({ ...t, squad: [...t.squad] }));
      
      playerPerformances.forEach(perf => {
        const id = perf.player.id;
        if (!newStats[id]) {
          newStats[id] = {
            runs: 0, wickets: 0, highestScore: 0, matchesPlayed: 0,
            name: perf.player.name,
            team: perf.player.teamName,
            image: perf.player.image
          };
        }
        newStats[id].matchesPlayed += 1;
        newStats[id].runs += perf.runs;
        newStats[id].wickets += perf.wickets;
        if (perf.runs > newStats[id].highestScore) {
          newStats[id].highestScore = perf.runs;
        }

        // Apply Form and Injuries to squad members
        updatedTeams.forEach(t => {
           const pIdx = t.squad.findIndex(p => p.id === id);
           if (pIdx !== -1) {
              const p = t.squad[pIdx];
              let newForm = p.form || 'NORMAL';
              
              if (perf.runs > 50 || perf.wickets >= 3) {
                 newForm = 'HOT';
                 if (Math.random() > 0.5) newNews.unshift(`🔥 ${p.name} is on fire! Phenomenal performance for ${t.shortName}.`);
              } else if (perf.runs === 0 || perf.runsConceded > 45) {
                 newForm = 'COLD';
              } else {
                 newForm = 'NORMAL';
              }
              
              let newInjuredMatches = p.injuredMatches || 0;
              
              // 2% chance of injury per match played
              if (Math.random() < 0.02 && newInjuredMatches === 0) {
                 newInjuredMatches = Math.floor(Math.random() * 3) + 1;
                 newNews.unshift(`🚑 BREAKING: ${p.name} (${t.shortName}) suffers an injury during play! Out for ${newInjuredMatches} matches.`);
              }

              t.squad[pIdx] = { ...p, form: newForm, injuredMatches: newInjuredMatches };
           }
        });
      });

      // Heal non-playing injured players
      updatedTeams.forEach(t => {
         t.squad.forEach((p, pIdx) => {
            const played = playerPerformances.find(perf => perf.player.id === p.id);
            if (!played && p.injuredMatches > 0) {
               const newInjuredMatches = p.injuredMatches - 1;
               t.squad[pIdx] = { ...p, injuredMatches: newInjuredMatches };
               if (newInjuredMatches === 0) {
                  newNews.unshift(`💪 GOOD NEWS: ${p.name} has recovered from injury and is available for selection.`);
               }
            }
         });
      });

      if (newNews.length > 30) newNews = newNews.slice(0, 30);

      return {
        ...state,
        tournamentStats: newStats,
        teams: updatedTeams,
        newsItems: newNews
      };
    }

    case 'GENERATE_SCHEDULE': {
      let matches = [];
      const t = state.teams.map(team => team.id);
      for (let i = 0; i < t.length; i++) {
        for (let j = i + 1; j < t.length; j++) {
          matches.push({ team1: t[i], team2: t[j], completed: false, resultStr: null });
        }
      }
      matches = shuffleArray(matches);
      
      let pTable = {};
      state.teams.forEach(team => {
        pTable[team.id] = { played: 0, won: 0, lost: 0, tied: 0, points: 0, nrr: 0, runDiff: 0 };
      });

      return {
        ...state,
        schedule: matches,
        pointsTable: pTable,
        currentMatchIndex: 0
      };
    }

    case 'PROCESS_MATCH_RESULT': {
      const { winnerId, loserId, isTie, resultStr } = action.payload;
      
      const newPts = { ...state.pointsTable };
      [winnerId, loserId].forEach(id => {
        if (!newPts[id]) newPts[id] = { played: 0, won: 0, lost: 0, tied: 0, points: 0, nrr: 0 };
        newPts[id].played += 1;
      });

      if (isTie) {
        newPts[winnerId].tied += 1;
        newPts[loserId].tied += 1;
        newPts[winnerId].points += 1;
        newPts[loserId].points += 1;
      } else {
        newPts[winnerId].won += 1;
        newPts[loserId].lost += 1;
        newPts[winnerId].points += 2;
        // Simple NRR mock
        newPts[winnerId].nrr += 0.5;
        newPts[loserId].nrr -= 0.5;
      }

      const newSchedule = [...state.schedule];
      newSchedule[state.currentMatchIndex] = {
        ...newSchedule[state.currentMatchIndex],
        resultStr
      };

      // Randomly generate a trade offer every 2 matches (30% chance)
      let newTradeOffers = [...(state.tradeOffers || [])];
      if (state.userTeam && Math.random() < 0.3) {
        const userSquad = state.teams.find(t => t.id === state.userTeam).squad;
        const aiTeams = state.teams.filter(t => t.id !== state.userTeam);
        const randomAiTeam = aiTeams[Math.floor(Math.random() * aiTeams.length)];
        
        if (userSquad.length > 0 && randomAiTeam.squad.length > 0) {
          const userPlayer = userSquad[Math.floor(Math.random() * userSquad.length)];
          const aiPlayer = randomAiTeam.squad[Math.floor(Math.random() * randomAiTeam.squad.length)];
          
          // AI wants a highly rated player, offers a bench player + cash
          const cashOffered = Math.floor(Math.random() * 500) * 100000; // Random cash between 0 and 5 Cr
          
          newTradeOffers.push({
            id: `trade_${Date.now()}`,
            fromTeamId: randomAiTeam.id,
            toTeamId: state.userTeam,
            playerOffered: aiPlayer.id,
            playerRequested: userPlayer.id,
            cashOffered: cashOffered
          });
        }
      }

      return {
        ...state,
        pointsTable: newPts,
        schedule: newSchedule,
        currentMatchIndex: state.currentMatchIndex + 1,
        tradeOffers: newTradeOffers
      };
    }

    case 'ACCEPT_TRADE': {
      const tradeId = action.payload;
      const trade = state.tradeOffers.find(t => t.id === tradeId);
      if (!trade) return state;

      const updatedTeams = state.teams.map(team => {
        if (team.id === trade.toTeamId) { // User Team
          return {
            ...team,
            purse: team.purse + trade.cashOffered,
            squad: [...team.squad.filter(p => p.id !== trade.playerRequested), state.teams.find(t => t.id === trade.fromTeamId).squad.find(p => p.id === trade.playerOffered)]
          };
        } else if (team.id === trade.fromTeamId) { // AI Team
          return {
            ...team,
            purse: team.purse - trade.cashOffered,
            squad: [...team.squad.filter(p => p.id !== trade.playerOffered), state.teams.find(t => t.id === trade.toTeamId).squad.find(p => p.id === trade.playerRequested)]
          };
        }
        return team;
      });

      return {
        ...state,
        teams: updatedTeams,
        tradeOffers: state.tradeOffers.filter(t => t.id !== tradeId)
      };
    }

    case 'REJECT_TRADE': {
      return {
        ...state,
        tradeOffers: state.tradeOffers.filter(t => t.id !== action.payload)
      };
    }

    case 'APPEND_MATCHES': {
      return {
        ...state,
        schedule: [...state.schedule, ...action.payload]
      };
    }

    case 'END_SEASON': {
      // 1. Log legacy stats
      const championId = action.payload.championId; // Passed from Tournament component
      const orangeCapPlayer = Object.values(state.tournamentStats).sort((a,b) => b.runs - a.runs)[0];
      const purpleCapPlayer = Object.values(state.tournamentStats).sort((a,b) => b.wickets - a.wickets)[0];

      const newLegacyStats = [...state.legacyStats, {
        season: state.season,
        champion: state.teams.find(t => t.id === championId)?.name,
        orangeCap: orangeCapPlayer ? `${orangeCapPlayer.name} (${orangeCapPlayer.runs} runs)` : null,
        purpleCap: purpleCapPlayer ? `${purpleCapPlayer.name} (${purpleCapPlayer.wickets} wkts)` : null
      }];

      // 2. Reset form/injuries (Aging and retirement removed per user request)
      let currentAvailablePlayers = [...state.availablePlayers];
      
      const updatePlayerStats = (player) => {
        let p = { ...player };
        p.form = 'NORMAL';
        p.injuredMatches = 0;
        return p;
      };

      currentAvailablePlayers = currentAvailablePlayers.map(updatePlayerStats);

      // Generate 3-5 Wonderkids
      const numWonderkids = Math.floor(Math.random() * 3) + 3;
      const firstNames = ["Aarav", "Vihaan", "Arjun", "Sai", "Kabir", "Aryan", "Dhruv", "Ishaan", "Rohan", "Dev"];
      const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Rao", "Joshi", "Iyer", "Yadav", "Verma"];
      const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
      
      for (let i = 0; i < numWonderkids; i++) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        const isOverseas = Math.random() < 0.2;
        currentAvailablePlayers.push({
          id: `wonderkid_${Date.now()}_${i}`,
          name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          role: role,
          basePrice: 2000000,
          isOverseas: isOverseas,
          battingRating: role === 'Batsman' || role === 'Wicket-Keeper' ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 20) + 50,
          bowlingRating: role === 'Bowler' ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 20) + 50,
          poolName: 'Uncapped Players',
          age: 18 + Math.floor(Math.random() * 2),
          form: 'NORMAL',
          injuredMatches: 0,
          isWonderkid: true
        });
      }

      const updatedTeams = state.teams.map(t => {
        const agedSquad = t.squad.map(updatePlayerStats);

        // AI Retentions: Handled in FINALIZE_RETENTIONS now
        return { ...t, squad: agedSquad };
      });

      const isMegaAuction = (state.season % 3 === 0);

      return {
        ...state,
        season: state.season + 1,
        isMegaAuction,
        legacyStats: newLegacyStats,
        auctionPhase: 'RETENTIONS',
        teams: updatedTeams,
        availablePlayers: currentAvailablePlayers
      };
    }

    case 'FINALIZE_RETENTIONS': {
      const { userRetentions } = action.payload; // array of player IDs
      const retentionLimit = state.isMegaAuction ? 2 : 4;
      
      let allAvailablePlayers = [...state.availablePlayers];

      const finalizedTeams = state.teams.map(t => {
        let retained = [];
        let released = [];
        
        if (t.id === state.userTeam) {
          retained = t.squad.filter(p => userRetentions.includes(p.id));
          released = t.squad.filter(p => !userRetentions.includes(p.id));
        } else {
          // AI Retains top players up to the limit
          const sortedSquad = [...t.squad].sort((a,b) => (b.battingRating + b.bowlingRating) - (a.battingRating + a.bowlingRating));
          retained = sortedSquad.slice(0, retentionLimit);
          released = sortedSquad.slice(retentionLimit);
        }

        // Deduct purse for retentions (e.g., 15Cr, 12Cr, 8Cr, 5Cr)
        const retentionCosts = [150000000, 120000000, 80000000, 50000000];
        let totalCost = 0;
        retained.forEach((p, index) => {
           totalCost += retentionCosts[index] || 50000000; // fallback 5Cr
           // Reset boughtFor price
           p.boughtFor = retentionCosts[index] || 50000000;
        });

        // Add released players back to pool
        released.forEach(p => {
          // Reset base price slightly based on rating? Let's just use original or random
          p.basePrice = p.basePrice || 5000000;
          allAvailablePlayers.push(p);
        });

        return { 
          ...t, 
          squad: retained, 
          purse: 1000000000 - totalCost, // Reset purse to 100Cr minus retention cost
          rtmCards: 2 // Reset RTM cards
        };
      });

      return {
        ...state,
        teams: finalizedTeams,
        availablePlayers: allAvailablePlayers,
        auctionQueue: generateAuctionQueue(allAvailablePlayers),
        auctionPhase: 'AUCTION',
        tournamentStats: {},
        schedule: [],
        currentMatchIndex: 0,
        pointsTable: {},
        tradeOffers: [],
        newsItems: []
      };
    }

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());

  // Autosave Effect
  useEffect(() => {
    if (state.activeSlot) {
      const saveTimer = setTimeout(() => {
        localStorage.setItem(state.activeSlot, JSON.stringify(state));
      }, 500); // 500ms debounce
      return () => clearTimeout(saveTimer);
    }
  }, [state]);

  const loadGame = (slotId, savedState) => dispatch({ type: 'LOAD_GAME', payload: { slotId, savedState } });
  const startNewGame = (slotId) => dispatch({ type: 'NEW_GAME', payload: { slotId } });
  const selectTeam = (teamId) => dispatch({ type: 'SELECT_TEAM', payload: teamId });
  const createCustomTeam = (payload) => dispatch({ type: 'CREATE_CUSTOM_TEAM', payload });
  const nextPlayer = () => dispatch({ type: 'NEXT_PLAYER' });
  const placeBid = (teamId, amount) => dispatch({ type: 'PLACE_BID', payload: { teamId, amount } });
  const sellPlayer = (rtmTeamId = null) => dispatch({ type: 'SELL_PLAYER', payload: { rtmTeamId } });
  const setPurse = (teamId, amount) => dispatch({ type: 'SET_PURSE', payload: { teamId, amount } });
  const updateStats = (playerPerformances) => dispatch({ type: 'UPDATE_STATS', payload: { playerPerformances } });
  const generateSchedule = () => dispatch({ type: 'GENERATE_SCHEDULE' });
  const processMatchResult = (payload) => dispatch({ type: 'PROCESS_MATCH_RESULT', payload });
  const appendMatches = (matches) => dispatch({ type: 'APPEND_MATCHES', payload: matches });
  const forceSell = (teamId, amount) => dispatch({ type: 'FORCE_SELL', payload: { teamId, amount } });
  const acceptTrade = (tradeId) => dispatch({ type: 'ACCEPT_TRADE', payload: tradeId });
  const rejectTrade = (tradeId) => dispatch({ type: 'REJECT_TRADE', payload: tradeId });
  const endSeason = (championId) => dispatch({ type: 'END_SEASON', payload: { championId } });
  const finalizeRetentions = (userRetentions) => dispatch({ type: 'FINALIZE_RETENTIONS', payload: { userRetentions } });

  return (
    <GameContext.Provider value={{ 
      state, 
      loadGame,
      startNewGame,
      selectTeam, 
      createCustomTeam,
      nextPlayer, 
      placeBid, 
      sellPlayer, 
      setPurse, 
      updateStats, 
      generateSchedule, 
      processMatchResult, 
      appendMatches, 
      forceSell,
      acceptTrade,
      rejectTrade,
      endSeason,
      finalizeRetentions
    }}>
      {children}
    </GameContext.Provider>
  );
};

