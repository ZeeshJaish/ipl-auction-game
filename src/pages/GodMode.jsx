import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Search, Shield, ArrowRight } from 'lucide-react';

const GodMode = () => {
  const { state, godModeDraft, autoSimulateAuction } = useContext(GameContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  if (state.auctionPhase !== 'AUCTION') {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2 style={{ color: 'var(--accent-red)' }}>Auction is not active.</h2>
        <button className="glass-btn" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>Go Home</button>
      </div>
    );
  }

  const userTeamData = state.teams.find(t => t.id === state.userTeam);

  let filteredPlayers = state.auctionQueue.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Also include currentPlayer if there is one
  if (state.currentPlayer) {
    const p = state.currentPlayer;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    if (matchesSearch && matchesRole) {
      filteredPlayers = [p, ...filteredPlayers];
    }
  }

  const handleDraft = (playerId, basePrice) => {
    if (userTeamData.purse < basePrice) {
      alert("Not enough purse money!");
      return;
    }
    if (userTeamData.squad.length >= 25) {
      alert("Squad is full!");
      return;
    }
    godModeDraft(playerId, state.userTeam);
  };

  const handleAutoSimulate = () => {
    if (window.confirm("Are you sure you want to exit God Mode and auto-simulate the rest of the auction? This will build AI squads and take you to the tournament.")) {
      autoSimulateAuction();
      navigate('/tournament');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Zap size={32} color="var(--accent-gold)" />
          <h1 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '2.5rem', textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}>GOD MODE</h1>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your Purse</div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{(userTeamData?.purse / 10000000).toFixed(2)} Cr</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Squad Size</div>
            <div style={{ color: userTeamData?.squad.length >= 25 ? 'var(--accent-red)' : 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{userTeamData?.squad.length}/25</div>
          </div>
          <button className="glass-btn primary" onClick={handleAutoSimulate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Auto-Complete Teams <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search players..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
          />
        </div>
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1rem', minWidth: '150px' }}
        >
          <option value="All">All Roles</option>
          <option value="Batsman">Batsmen</option>
          <option value="Bowler">Bowlers</option>
          <option value="All-Rounder">All-Rounders</option>
          <option value="Wicket-Keeper">Wicket-Keepers</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredPlayers.map(player => (
          <div key={player.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: player.realTeamId ? '3px solid var(--accent-gold)' : '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                {player.image ? <img src={player.image} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{player.name}</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{player.role} • {player.isOverseas ? 'OS' : 'IND'}</div>
                {player.realTeamId && <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginTop: '4px' }}>★ Real-World Favorite</div>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>BAT {player.battingRating}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>BOWL {player.bowlingRating}</div>
              <div style={{ fontWeight: 'bold' }}>₹{(player.basePrice / 10000000).toFixed(2)} Cr</div>
            </div>

            <button 
              className="glass-btn primary gold" 
              onClick={() => handleDraft(player.id, player.basePrice)}
              disabled={userTeamData?.purse < player.basePrice || userTeamData?.squad.length >= 25}
              style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Shield size={16} /> Draft to Squad
            </button>
          </div>
        ))}
      </div>
      
      {filteredPlayers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No players found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default GodMode;
