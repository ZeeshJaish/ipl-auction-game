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

  players.forEach(p => {
    if (p.basePrice < 5000000) {
      uncapped.push({ ...p, poolName: 'Uncapped Players' });
    } else if (p.basePrice >= 15000000) {
      marquee.push({ ...p, poolName: 'Marquee Players' });
    } else {
      if (p.role === 'Batsman') batsmen.push({ ...p, poolName: 'Capped Batsmen' });
      else if (p.role === 'All-Rounder') allrounders.push({ ...p, poolName: 'Capped All-Rounders' });
      else if (p.role === 'Wicket-Keeper') wicketkeepers.push({ ...p, poolName: 'Capped Wicket-Keepers' });
      else bowlers.push({ ...p, poolName: 'Capped Bowlers' });
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
  teams: initialTeams.map(t => ({ ...t, squad: [] })),
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
  pointsTable: {}
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

    case 'SELL_PLAYER':
      const { currentBidder, currentBid } = state.biddingState;
      
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

      const updatedTeams = state.teams.map(t => {
        if (t.id === currentBidder) {
          return {
            ...t,
            purse: t.purse - currentBid,
            squad: [...t.squad, { ...state.currentPlayer, boughtFor: currentBid }]
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
          log: [`SOLD! ${state.currentPlayer.name} to ${state.teams.find(t => t.id === currentBidder).shortName} for ₹${(currentBid / 10000000).toFixed(2)} Cr`, ...state.biddingState.log]
        }
      };

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
      });

      return {
        ...state,
        tournamentStats: newStats
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
      const { winnerId, loserId, isTie, team1Runs, team2Runs } = action.payload;
      const newPoints = { ...state.pointsTable };
      
      const updateTeam = (id, won, lost, tied, runsScored, runsConceded) => {
        const p = newPoints[id];
        p.played += 1;
        p.won += won;
        p.lost += lost;
        p.tied += tied;
        p.points += (won * 2) + (tied * 1);
        p.runDiff += (runsScored - runsConceded);
        p.nrr = (p.runDiff / (p.played * 20)).toFixed(3);
      };

      if (isTie) {
        updateTeam(winnerId, 0, 0, 1, team1Runs, team2Runs);
        updateTeam(loserId, 0, 0, 1, team2Runs, team1Runs);
      } else {
        updateTeam(winnerId, 1, 0, 0, Math.max(team1Runs, team2Runs), Math.min(team1Runs, team2Runs));
        updateTeam(loserId, 0, 1, 0, Math.min(team1Runs, team2Runs), Math.max(team1Runs, team2Runs));
      }

      const newSchedule = [...state.schedule];
      newSchedule[state.currentMatchIndex] = {
        ...newSchedule[state.currentMatchIndex],
        completed: true,
        resultStr: action.payload.resultStr
      };

      return {
        ...state,
        pointsTable: newPoints,
        schedule: newSchedule,
        currentMatchIndex: state.currentMatchIndex + 1
      };
    }

    case 'APPEND_MATCHES': {
      return {
        ...state,
        schedule: [...state.schedule, ...action.payload]
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
  const nextPlayer = () => dispatch({ type: 'NEXT_PLAYER' });
  const placeBid = (teamId, amount) => dispatch({ type: 'PLACE_BID', payload: { teamId, amount } });
  const sellPlayer = () => dispatch({ type: 'SELL_PLAYER' });
  const setPurse = (teamId, amount) => dispatch({ type: 'SET_PURSE', payload: { teamId, amount } });
  const updateStats = (playerPerformances) => dispatch({ type: 'UPDATE_STATS', payload: { playerPerformances } });
  const generateSchedule = () => dispatch({ type: 'GENERATE_SCHEDULE' });
  const processMatchResult = (payload) => dispatch({ type: 'PROCESS_MATCH_RESULT', payload });
  const appendMatches = (matches) => dispatch({ type: 'APPEND_MATCHES', payload: matches });
  const forceSell = (teamId, amount) => dispatch({ type: 'FORCE_SELL', payload: { teamId, amount } });

  return (
    <GameContext.Provider value={{ 
      state, 
      loadGame,
      startNewGame,
      selectTeam, 
      nextPlayer, 
      placeBid, 
      sellPlayer, 
      setPurse, 
      updateStats, 
      generateSchedule, 
      processMatchResult, 
      appendMatches, 
      forceSell 
    }}>
      {children}
    </GameContext.Provider>
  );
};

