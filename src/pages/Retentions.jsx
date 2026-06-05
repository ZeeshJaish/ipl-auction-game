import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, ShieldAlert, Award } from 'lucide-react';

const Retentions = () => {
  const { state, finalizeRetentions } = useContext(GameContext);
  const navigate = useNavigate();
  const [selectedRetentions, setSelectedRetentions] = useState([]);
  
  if (state.auctionPhase !== 'RETENTIONS' || !state.userTeam) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2 style={{ color: 'var(--accent-red)' }}>Not Retention Phase</h2>
        <button className="glass-btn" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>Go Home</button>
      </div>
    );
  }

  const myTeam = state.teams.find(t => t.id === state.userTeam);
  
  // Sorting squad by ratings for easier picking
  const squad = [...myTeam.squad].sort((a,b) => (b.battingRating + b.bowlingRating) - (a.battingRating + a.bowlingRating));

  const toggleRetention = (playerId) => {
    if (selectedRetentions.includes(playerId)) {
      setSelectedRetentions(selectedRetentions.filter(id => id !== playerId));
    } else {
      if (selectedRetentions.length < 4) {
        setSelectedRetentions([...selectedRetentions, playerId]);
      }
    }
  };

  const handleFinalize = () => {
    if (window.confirm(`Are you sure you want to retain ${selectedRetentions.length} players? All other players will be released into the auction pool.`)) {
      finalizeRetentions(selectedRetentions);
      navigate('/auction');
    }
  };

  const retentionCosts = [15, 12, 8, 5]; // in Cr
  const totalCost = selectedRetentions.reduce((acc, _, index) => acc + retentionCosts[index], 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Legacy Stats Banner */}
      {state.legacyStats && state.legacyStats.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(0,0,0,0.5))', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <h2 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Award size={24}/> Legacy Stats: Season {state.season - 1}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🏆 Champions</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{state.legacyStats[state.legacyStats.length - 1].champion || 'TBD'}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🏏 Orange Cap</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#f97316' }}>{state.legacyStats[state.legacyStats.length - 1].orangeCap || 'N/A'}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🎯 Purple Cap</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#a855f7' }}>{state.legacyStats[state.legacyStats.length - 1].purpleCap || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '2.5rem' }}>Season {state.season} Retentions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>Select up to 4 players to retain. Costs: 15Cr, 12Cr, 8Cr, 5Cr.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Squad Selection List */}
        <div className="glass-panel" style={{ flex: 2, minWidth: '300px', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Your Squad</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Retained: <span style={{ color: selectedRetentions.length > 0 ? 'var(--accent-green)' : 'inherit' }}>{selectedRetentions.length}/4</span></span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {squad.map(player => {
              const isSelected = selectedRetentions.includes(player.id);
              const order = selectedRetentions.indexOf(player.id);
              const cost = isSelected ? retentionCosts[order] : 0;

              return (
                <div 
                  key={player.id}
                  onClick={() => toggleRetention(player.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: isSelected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid var(--accent-green)' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!isSelected && selectedRetentions.length >= 4) ? 0.5 : 1,
                    pointerEvents: (!isSelected && selectedRetentions.length >= 4) ? 'none' : 'auto'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {player.image ? <img src={player.image} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="#666" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{player.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Age: {player.age || 25})</span></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{player.role} • BAT {player.battingRating} | BOWL {player.bowlingRating}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {isSelected ? (
                      <div>
                        <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.2rem' }}>Retained (#{order + 1})</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cost: ₹{cost} Cr</div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)' }}>Release</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '300px', padding: '1.5rem', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} /> Next Season Prep
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Starting Purse</span>
              <span style={{ fontWeight: 'bold' }}>₹100.00 Cr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'var(--accent-red)' }}>Retention Deductions</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-red)' }}>- ₹{totalCost.toFixed(2)} Cr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.2rem' }}>
              <span style={{ color: 'var(--accent-gold)' }}>Final Purse</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>₹{(100 - totalCost).toFixed(2)} Cr</span>
            </div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={18} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              All unselected players will be released into the auction pool. AI teams will automatically retain their top 4 players. Your RTM cards will be reset to 2.
            </div>
          </div>

          <button 
            className="glass-btn primary gold" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            onClick={handleFinalize}
          >
            Confirm Retentions & Start Auction
          </button>
        </div>

      </div>
    </div>
  );
};

export default Retentions;
