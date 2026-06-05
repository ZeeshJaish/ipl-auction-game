import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';

const Dashboard = () => {
  const { state, selectTeam, nextPlayer } = useContext(GameContext);
  const navigate = useNavigate();

  const handleSelectTeam = (teamId) => {
    selectTeam(teamId);
    if (!state.currentPlayer) {
      nextPlayer();
    }
    navigate('/auction');
  };

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome to IPL Mega Auction
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
        Select your franchise to begin building your ultimate squad.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {state.teams.map((team) => (
          <div 
            key={team.id}
            className="glass-panel"
            style={{ 
              padding: '2rem', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderTop: `4px solid ${team.color}`
            }}
            onClick={() => handleSelectTeam(team.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = `0 15px 30px ${team.color}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
            }}
          >
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: `linear-gradient(135deg, ${team.color}, ${team.secondaryColor})`,
              margin: '0 auto 1rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {team.shortName}
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{team.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Purse: ₹100.00 Cr
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
