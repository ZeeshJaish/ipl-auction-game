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

const initialState = {
  userTeam: null, // Team ID chosen by user
  teams: initialTeams.map(t => ({ ...t, squad: [] })), // Attach empty squad
  auctionQueue: shuffleArray(initialPlayers),
  currentPlayer: null,
  biddingState: {
    currentBid: 0,
    currentBidder: null, // Team ID
    biddingActive: false,
    log: [] // Array of string messages
  },
  auctionPhase: 'SETUP', // SETUP, AUCTION, TOURNAMENT
  tournamentStats: {} // { playerId: { runs, wickets, highestScore, matchesPlayed, name, team, image } }
};

export const GameContext = createContext();

const gameReducer = (state, action) => {
  switch (action.type) {
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
      
      // If no bidder, player is unsold
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

      // Add to squad and deduct purse
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
      const { playerPerformances } = action.payload; // Array of { player, runs, wickets }
      
      playerPerformances.forEach(perf => {
        const id = perf.player.id;
        if (!newStats[id]) {
          newStats[id] = {
            runs: 0, wickets: 0, highestScore: 0, matchesPlayed: 0,
            name: perf.player.name,
            team: perf.player.teamName, // Will pass teamName down
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

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Expose helpful actions
  const selectTeam = (teamId) => dispatch({ type: 'SELECT_TEAM', payload: teamId });
  const nextPlayer = () => dispatch({ type: 'NEXT_PLAYER' });
  const placeBid = (teamId, amount) => dispatch({ type: 'PLACE_BID', payload: { teamId, amount } });
  const sellPlayer = () => dispatch({ type: 'SELL_PLAYER' });
  const setPurse = (teamId, amount) => dispatch({ type: 'SET_PURSE', payload: { teamId, amount } });
  const updateStats = (playerPerformances) => dispatch({ type: 'UPDATE_STATS', payload: { playerPerformances } });

  return (
    <GameContext.Provider value={{ state, selectTeam, nextPlayer, placeBid, sellPlayer, setPurse, updateStats }}>
      {children}
    </GameContext.Provider>
  );
};
