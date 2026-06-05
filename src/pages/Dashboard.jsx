import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { Trophy } from 'lucide-react';

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
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Trophy size={40} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.5))' }} />
        <h1 className="dashboard-hero-title" style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '2px' }}>
          IPL Mega Auction
        </h1>
      </div>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
        Step into the war room. Select your franchise to begin building the ultimate cricket squad and battle for glory.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        perspective: '1000px'
      }}>
        {state.teams.map((team, index) => (
          <div 
            key={team.id}
            className={`glass-panel-3d animate-fade-in stagger-${(index % 4) + 1}`}
            style={{ cursor: 'pointer' }}
            onClick={() => handleSelectTeam(team.id)}
          >
            <div 
              className="glass-panel glass-panel-3d-inner"
              style={{ 
                padding: '2.5rem 2rem', 
                borderTop: `4px solid ${team.color}`,
                background: `linear-gradient(to bottom, rgba(15,20,30,0.6), rgba(15,20,30,0.8))`,
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 20px 40px -10px ${team.color}66, inset 0 1px 0 0 rgba(255,255,255,0.2)`;
                e.currentTarget.style.borderColor = team.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '50%', 
                background: `linear-gradient(135deg, ${team.color}, ${team.secondaryColor})`,
                margin: '0 auto 1.5rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: '800',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                boxShadow: `0 10px 20px -5px ${team.color}80`
              }}>
                {team.shortName}
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', letterSpacing: '1px' }}>{team.name}</h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', marginTop: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Purse</span>
                <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.2rem' }}>₹100.00 Cr</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
