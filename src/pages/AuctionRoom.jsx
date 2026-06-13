import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { useAIBidding } from '../hooks/useAIBidding';
import { Gavel, User, DollarSign, TrendingUp, TrendingDown, Star, Zap } from 'lucide-react';

const AuctionRoom = () => {
  const navigate = useNavigate();
  const { state, placeBid, sellPlayer, nextPlayer, forceSell } = useContext(GameContext);
  useAIBidding(state, placeBid);

  // Auto-navigate when auction finishes
  useEffect(() => {
    if (state.auctionPhase === 'TOURNAMENT') {
      navigate('/tournament', { replace: true });
    }
  }, [state.auctionPhase]);

  if (!state.userTeam) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please select a team from the Dashboard first.</div>;
  }

  const { currentPlayer, biddingState, teams, userTeam, auctionQueue } = state;
  const { currentBid, currentBidder, biddingActive, log } = biddingState;

  const myTeam = teams.find(t => t.id === userTeam);

  const [showRtmModal, setShowRtmModal] = useState(false);
  const [rtmData, setRtmData] = useState(null);

  const handleSellPlayer = () => {
    if (!biddingActive || !currentPlayer) return;

    const homeTeamId = currentPlayer.homeTeamId;
    const isHomeTeamHighestBidder = currentBidder === homeTeamId;
    const homeTeam = homeTeamId ? teams.find(t => t.id === homeTeamId) : null;

    if (homeTeam && !isHomeTeamHighestBidder && currentBidder && homeTeam.rtmCards > 0 && homeTeam.purse >= currentBid) {
      if (homeTeamId === userTeam) {
        // Show RTM Modal for User
        setRtmData({ homeTeamId });
        setShowRtmModal(true);
      } else {
        // AI Decision: 50% chance if they have funds
        if (Math.random() > 0.5) {
          sellPlayer(homeTeamId); // AI uses RTM
        } else {
          sellPlayer(); // AI passes
        }
      }
    } else {
      sellPlayer();
    }
  };

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

      // Add Real Team Bias
      if (currentPlayer.realTeamId === team.id) {
        baseValuation *= 4.0;
      }

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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1rem' }}>
          <button 
            className="glass-btn gold" 
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            onClick={() => navigate('/godmode')}
          >
            <Zap size={16} /> Enter God Mode
          </button>
        </div>

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
                    <div style={{ display: 'inline-block', marginTop: '0.5rem', background: 'rgba(251, 191, 36, 0.2)', color: 'var(--accent-gold)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--accent-gold)', marginRight: '10px' }}>
                      Set: {currentPlayer.poolName}
                    </div>
                    {currentPlayer.homeTeamId && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #8b5cf6' }}>
                        <Zap size={14} /> Ex-Franchise: {teams.find(t => t.id === currentPlayer.homeTeamId)?.shortName}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Base Price</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{(currentPlayer.basePrice / 10000000).toFixed(2)} Cr</div>
                  </div>
                </div>

                <div className="rating-container" style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
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
            {state.auctionQueue.length === 0 ? (
              <>
                <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>Auction Complete!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>All players have been auctioned. Time to play!</p>
                <button className="glass-btn primary gold" style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }} onClick={() => navigate('/tournament')}>
                  Start Season →
                </button>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: '1rem' }}>Ready to Begin</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Click <strong>Next Player</strong> below to put the first player on the block.</p>
              </>
            )}
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
                onClick={handleSellPlayer}
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

      {/* Right Column: Log & Franchises & Upcoming */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {currentPlayer && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Upcoming in Set</span>
              <span style={{ color: 'var(--accent-gold)' }}>{currentPlayer.poolName}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {auctionQueue.filter(p => p.poolName === currentPlayer.poolName).slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.role}</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', color: 'var(--accent-gold)' }}>₹{(p.basePrice / 10000000).toFixed(2)} Cr</div>
                </div>
              ))}
              {auctionQueue.filter(p => p.poolName === currentPlayer.poolName).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem' }}>Last player in this set!</div>
              )}
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '300px' }}>
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {t.rtmCards > 0 && <span style={{ fontSize: '0.8rem', color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>RTM: {t.rtmCards}</span>}
                  <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>₹{(t.purse / 10000000).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RTM Modal */}
      {showRtmModal && rtmData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '3rem', position: 'relative', border: '2px solid #8b5cf6', background: 'linear-gradient(to bottom, rgba(30, 20, 50, 0.9), rgba(15, 10, 30, 0.95))', boxShadow: '0 0 50px rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Zap size={40} color="#c4b5fd" />
              <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '2px' }}>RTM Opportunity!</h2>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{ fontSize: '1.3rem', color: 'white', marginBottom: '1rem' }}>
                <strong style={{ color: 'var(--accent-gold)' }}>{currentPlayer.name}</strong> was just sold to <strong>{teams.find(t => t.id === currentBidder)?.name}</strong> for <strong style={{ color: 'var(--accent-green)' }}>₹{(currentBid / 10000000).toFixed(2)} Cr</strong>.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                As their former franchise, you can exercise your Right to Match (RTM) card to instantly buy them back at this exact price.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'inline-block', background: 'rgba(0,0,0,0.4)', padding: '1rem 2rem', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Your RTM Cards Remaining: </span>
                <strong style={{ color: '#c4b5fd', fontSize: '1.5rem', marginLeft: '0.5rem' }}>{myTeam.rtmCards}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="glass-btn" 
                style={{ fontSize: '1.2rem', padding: '15px 30px', flex: 1 }}
                onClick={() => {
                  setShowRtmModal(false);
                  sellPlayer(); // Finalize to the highest bidder
                }}
              >
                Pass (Let them go)
              </button>
              <button 
                className="glass-btn primary" 
                style={{ fontSize: '1.2rem', padding: '15px 30px', flex: 1, background: 'linear-gradient(to right, #8b5cf6, #6d28d9)', borderColor: '#8b5cf6', color: 'white' }}
                onClick={() => {
                  setShowRtmModal(false);
                  sellPlayer(userTeam); // Steal them back
                }}
              >
                <Zap size={20} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                Use RTM Card
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuctionRoom;
