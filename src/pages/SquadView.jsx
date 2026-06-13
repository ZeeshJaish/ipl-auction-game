import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { User } from 'lucide-react';

const SquadView = () => {
  const { state } = useContext(GameContext);

  if (!state.userTeam) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please select a team from the Dashboard first.</div>;
  }

  const myTeam = state.teams.find(t => t.id === state.userTeam);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>My Squad</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{myTeam.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Players: {myTeam.squad.length}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Overseas: {myTeam.squad.filter(p => p.isOverseas).length} / 8</div>
        </div>
      </div>

      {myTeam.squad.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>No players bought yet.</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Head to the Auction Room to build your team.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {myTeam.squad.map((player) => (
            <div key={player.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {player.image
                  ? <img src={player.image} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={30} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</h3>
                  {player.isOverseas && <span style={{ fontSize: '0.65rem', background: 'var(--accent-red)', padding: '2px 5px', borderRadius: '4px', flexShrink: 0 }}>OS</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{player.role}</div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '6px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--accent-green)' }}>BAT {player.battingRating}</span>
                  <span style={{ color: 'var(--accent-blue)' }}>BOWL {player.bowlingRating}</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                  ₹{(player.boughtFor / 10000000).toFixed(2)} Cr
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SquadView;
