import React, { useContext, useEffect, useRef } from 'react';
import { GameContext } from '../context/GameContext';
import { useAIBidding } from '../hooks/useAIBidding';
import { Gavel, User, DollarSign, TrendingUp, TrendingDown, Star } from 'lucide-react';

const AuctionRoom = () => {
  const { state, placeBid, sellPlayer, nextPlayer, forceSell } = useContext(GameContext);
  useAIBidding(state, placeBid);

  if (!state.userTeam) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please select a team from the Dashboard first.</div>;
  }

  const { currentPlayer, biddingState, teams, userTeam } = state;
  const { currentBid, currentBidder, biddingActive, log } = biddingState;

  const myTeam = teams.find(t => t.id === userTeam);

  const handleUserBid = () => {
    if (!biddingActive || !currentPlayer) return;
    const nextBid = currentBid === currentPlayer.basePrice && currentBidder === null ? currentBid : currentBid + 2500000;
    if (nextBid <= myTeam.purse) {
      placeBid(userTeam, nextBid);
    }
  };

  const handleSuperBid = () => {
    if (!biddingActive || !currentPlayer) return;

    let maxAIBid = currentPlayer.basePrice;
    teams.forEach(team => {
      if (team.id === userTeam) return;
      
      let baseValuation = (currentPlayer.battingRating + currentPlayer.bowlingRating) * 500000;
      baseValuation *= 1.4; // Pessimistic max valuation
      
      const roleCount = team.squad.filter(p => p.role === currentPlayer.role).length;
      if (roleCount > 4) baseValuation *= 0.5;
      if (roleCount < 2) baseValuation *= 1.5;

      const overseasCount = team.squad.filter(p => p.isOverseas).length;
      if (currentPlayer.isOverseas && overseasCount >= 8) return; 

      if (baseValuation > team.purse) baseValuation = team.purse;
      if (baseValuation > maxAIBid) maxAIBid = baseValuation;
    });

    maxAIBid = Math.floor(maxAIBid / 2500000) * 2500000;
    const finalPrice = Math.max(currentBid, maxAIBid + 2500000);

    if (myTeam.purse >= finalPrice) {
      forceSell(userTeam, finalPrice);
    } else {
      alert(`Insufficient funds! AI is willing to bid up to ₹${(maxAIBid/10000000).toFixed(2)} Cr, you need at least ₹${(finalPrice/10000000).toFixed(2)} Cr to Super Bid.`);
    }
  };

  return (
    <div className="auction-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
      {/* Left Column: Player Card & Bidding */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {currentPlayer ? (
          <div className="glass-panel-3d" style={{ perspective: '1000px' }}>
            <div className="glass-panel glass-panel-3d-inner player-card-content" style={{ padding: '3rem', display: 'flex', gap: '3rem', alignItems: 'center', background: 'linear-gradient(145deg, rgba(20,25,40,0.8), rgba(15,20,30,0.9))' }}>
              <div style={{ 
                width: '240px', 
                height: '300px', 
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {currentPlayer.image ? (
                  <img src={currentPlayer.image} alt={currentPlayer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={100} color="var(--text-secondary)" />
                )}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '1rem', 
                  background: currentPlayer.isOverseas ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)', 
                  padding: '6px 16px', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem', 
                  fontWeight: '800',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(4px)'
                }}>
                  {currentPlayer.isOverseas ? 'OVERSEAS' : 'INDIAN'}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '3rem', margin: 0, background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>
                      {currentPlayer.name}
                    </h2>
                    <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{currentPlayer.role} • {currentPlayer.country}</p>
                  </div>
                  <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Base Price</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{(currentPlayer.basePrice / 10000000).toFixed(2)} Cr</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
                    <div style={{ color: 'var(--accent-green)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem' }}>Batting Rating</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '2rem', fontWeight: '800' }}>
                      <TrendingUp color="var(--accent-green)" size={32} /> {currentPlayer.battingRating}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '12px', flex: 1 }}>
                    <div style={{ color: 'var(--accent-blue)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem' }}>Bowling Rating</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '2rem', fontWeight: '800' }}>
                      <TrendingDown color="var(--accent-blue)" size={32} /> {currentPlayer.bowlingRating}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2>Auction Finished or No Player on Block</h2>
          </div>
        )}

        {/* Bidding Console */}
        <div className="bidding-console-wrapper" style={{ marginTop: 'auto' }}>
          <div className="glass-panel bidding-console" style={{ padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(20,25,40,0.8), rgba(15,20,30,0.95))', borderTop: '4px solid var(--accent-gold)' }}>
            <div className="bidding-console-info">
              <div style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Current Bid</div>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', color: currentBidder === userTeam ? 'var(--accent-green)' : 'white', textShadow: currentBidder === userTeam ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none' }}>
                ₹{(currentBid / 10000000).toFixed(2)} <span style={{ fontSize: '2rem' }}>Cr</span>
              </div>
              {currentBidder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                  <Star size={18} color="var(--accent-gold)" /> Highest Bidder: <strong style={{ color: 'white' }}>{teams.find(t => t.id === currentBidder)?.name}</strong>
                </div>
              )}
            </div>
            
            <div className="bidding-console-buttons" style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="glass-btn primary" 
                style={{ fontSize: '1.2rem', padding: '15px 30px' }}
                onClick={handleUserBid}
                disabled={!biddingActive || currentBidder === userTeam || (currentBid + 2500000) > myTeam.purse}
              >
                <Gavel style={{ marginRight: '8px' }} size={20} /> Place Bid
              </button>
              <button 
                className="glass-btn" 
                style={{ fontSize: '1rem', padding: '15px 20px', background: 'rgba(16, 185, 129, 0.2)', borderColor: 'var(--accent-green)' }}
                onClick={handleSuperBid}
                disabled={!biddingActive || currentBidder === userTeam}
                title="Instantly simulates all AI bids and buys player for you"
              >
                Super Bid
              </button>
              <button 
                className="glass-btn" 
                style={{ fontSize: '1.2rem', padding: '15px 30px', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--accent-red)' }}
                onClick={sellPlayer}
                disabled={!biddingActive}
              >
                Sell / Pass
              </button>
              {!biddingActive && (
                <button 
                  className="glass-btn gold" 
                  style={{ fontSize: '1.2rem', padding: '15px 30px' }}
                  onClick={nextPlayer}
                >
                  Next Player
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Log & Franchises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Live Activity</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {log.map((entry, i) => (
              <div key={i} style={{ 
                padding: '0.8rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                fontSize: '0.9rem',
                borderLeft: entry.includes('SOLD') ? '4px solid var(--accent-green)' : entry.includes('UNSOLD') ? '4px solid var(--accent-red)' : '4px solid var(--accent-blue)'
              }}>
                {entry}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Franchise Purses</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {teams.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: t.id === userTeam ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color }}></div>
                  <span style={{ fontWeight: t.id === userTeam ? 'bold' : 'normal' }}>{t.shortName}</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem' }}>₹{(t.purse / 10000000).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuctionRoom;
