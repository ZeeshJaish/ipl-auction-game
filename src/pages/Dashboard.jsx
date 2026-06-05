import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { Trophy, Plus, X } from 'lucide-react';

const Dashboard = () => {
  const { state, selectTeam, createCustomTeam, nextPlayer } = useContext(GameContext);
  const navigate = useNavigate();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTeamData, setCustomTeamData] = useState({
    name: '',
    shortName: '',
    color: '#3b82f6',
    secondaryColor: '#1e3a8a'
  });

  const handleSelectTeam = (teamId) => {
    selectTeam(teamId);
    if (!state.currentPlayer) {
      nextPlayer();
    }
    navigate('/auction');
  };

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customTeamData.name || !customTeamData.shortName) return;
    createCustomTeam(customTeamData);
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

        {/* Create Custom Team Card */}
        <div 
          className={`glass-panel-3d animate-fade-in stagger-5`}
          style={{ cursor: 'pointer' }}
          onClick={() => setShowCustomModal(true)}
        >
          <div 
            className="glass-panel glass-panel-3d-inner"
            style={{ 
              padding: '2.5rem 2rem', 
              borderTop: `4px dashed var(--glass-border)`,
              background: `linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
              e.currentTarget.style.background = 'rgba(251,191,36,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.background = `linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`;
            }}
          >
            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)',
              margin: '0 auto 1.5rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Plus size={40} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>Custom Franchise</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>Build your own legacy</p>
          </div>
        </div>
      </div>

      {/* Custom Team Modal */}
      {showCustomModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setShowCustomModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '2rem', color: 'var(--accent-gold)' }}>Create Custom Franchise</h2>
            
            <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Franchise Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kerala Blasters"
                  required
                  style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1.1rem' }}
                  value={customTeamData.name}
                  onChange={e => setCustomTeamData({...customTeamData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Short Name (Acronym)</label>
                <input 
                  type="text" 
                  placeholder="e.g. KB"
                  required
                  maxLength={4}
                  style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '1.1rem' }}
                  value={customTeamData.shortName}
                  onChange={e => setCustomTeamData({...customTeamData, shortName: e.target.value.toUpperCase()})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Primary Color</label>
                  <input 
                    type="color" 
                    value={customTeamData.color}
                    onChange={e => setCustomTeamData({...customTeamData, color: e.target.value})}
                    style={{ width: '100%', height: '50px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Secondary Color</label>
                  <input 
                    type="color" 
                    value={customTeamData.secondaryColor}
                    onChange={e => setCustomTeamData({...customTeamData, secondaryColor: e.target.value})}
                    style={{ width: '100%', height: '50px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                  />
                </div>
              </div>

              <button type="submit" className="glass-btn primary gold" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.2rem' }}>
                Launch Franchise
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
