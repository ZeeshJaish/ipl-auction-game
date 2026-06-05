import { useEffect, useRef } from 'react';

// A simple AI that evaluates player worth and places bids
export const useAIBidding = (state, placeBid) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!state.biddingState.biddingActive || !state.currentPlayer || state.auctionPhase !== 'AUCTION') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const { currentPlayer, biddingState, teams, userTeam } = state;
    const { currentBid, currentBidder } = biddingState;

    // Wait a random delay (1.5s to 3s) before an AI makes a move
    const delay = Math.floor(Math.random() * 1500) + 1500;

    timeoutRef.current = setTimeout(() => {
      // Find teams that want this player and can afford a bid
      let highestValuation = 0;
      let bestTeamId = null;
      let proposedBid = currentBid + 2500000; // Increment by 25L (simplified)

      // Calculate max budget per team (leaving 20L per remaining slot for 18 min players)
      // For simplicity, just cap at purse size
      
      teams.forEach(team => {
        if (team.id === userTeam) return; // User bids manually
        if (team.id === currentBidder) return; // Already highest bidder
        
        // Basic valuation logic based on rating and role need
        let baseValuation = (currentPlayer.battingRating + currentPlayer.bowlingRating) * 500000; // Rough baseline
        
        // Add random variance (AI personality)
        baseValuation *= (0.8 + Math.random() * 0.6); 

        // Role adjustment (if they already have many of this role, value goes down)
        const roleCount = team.squad.filter(p => p.role === currentPlayer.role).length;
        if (roleCount > 4) baseValuation *= 0.5;
        if (roleCount < 2) baseValuation *= 1.5;
        
        // Add Real Team Bias
        if (currentPlayer.realTeamId === team.id) {
          baseValuation *= 4.0; // Massive boost so they fight heavily for their real players
        }

        // Overseas limit check
        const overseasCount = team.squad.filter(p => p.isOverseas).length;
        if (currentPlayer.isOverseas && overseasCount >= 8) return; // Cannot buy

        // Purse check
        if (proposedBid > team.purse) return;

        if (baseValuation > proposedBid && baseValuation > highestValuation) {
          highestValuation = baseValuation;
          bestTeamId = team.id;
        }
      });

      if (bestTeamId) {
        placeBid(bestTeamId, proposedBid);
      }
      
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

  }, [state.biddingState.currentBid, state.biddingState.biddingActive, state.currentPlayer]);

};
