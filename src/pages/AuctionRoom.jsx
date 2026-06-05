import React, { useContext, useEffect, useRef } from 'react';
import { GameContext } from '../context/GameContext';
import { useAIBidding } from '../hooks/useAIBidding';
import { Gavel, User, DollarSign, TrendingUp, TrendingDown, Star } from 'lucide-react';

const AuctionRoom = () => {
  const { state, placeBid, sellPlayer, nextPlayer } = useContext(GameContext);
  useAIBidding(state, placeBid);

  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.biddingState.log]);

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

  return (
    <div className="auction-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
      {/* Left Column: Player Card & Bidding */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {currentPlayer ? (
          <div className="glass-panel player-card-content" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ 
              width: '200px', 
              height: '250px', 
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', 
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid var(--glass-border)',
              overflow: 'hidden'
            }}>
              {currentPlayer.image ? (
                <img src={currentPlayer.image} alt={currentPlayer.name} style={{ width: '100%', height: '80%', objectFit: 'cover' }} />
              ) : (
                <User size={80} color="var(--text-secondary)" />
              )}
              <div style={{ marginTop: currentPlayer.image ? '0.5rem' : '1rem', background: currentPlayer.isOverseas ? 'var(--accent-red)' : 'var(--accent-blue)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {currentPlayer.isOverseas ? 'OVERSEAS' : 'INDIAN'}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '2.5rem', margin: 0, background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {currentPlayer.name}
                  </h2>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{currentPlayer.role} • {currentPlayer.country}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Base Price</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{(currentPlayer.basePrice / 10000000).toFixed(2)} Cr</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', flex: 1 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Batting Rating</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    <TrendingUp color="var(--accent-green)" /> {currentPlayer.battingRating}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', flex: 1 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Bowling Rating</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    <TrendingDown color="var(--accent-blue)" /> {currentPlayer.bowlingRating}
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
        <div className="glass-panel bidding-console" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Bid</div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: currentBidder === userTeam ? 'var(--accent-green)' : 'white' }}>
              ₹{(currentBid / 10000000).toFixed(2)} Cr
            </div>
            {currentBidder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)' }}>
                <Star size={16} /> Highest Bidder: {teams.find(t => t.id === currentBidder)?.shortName}
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

      {/* Right Column: Log & Franchises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Live Activity</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '0.5rem' }}>
            <div ref={logEndRef} />
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
