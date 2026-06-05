import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import { Save, Trash2, Plus, Play } from 'lucide-react';
import teamsData from '../data/teams.json';

const SLOTS = ['ipl_save_1', 'ipl_save_2', 'ipl_save_3'];

const SaveManager = () => {
  const [saves, setSaves] = useState({});
  const { loadGame, startNewGame } = useContext(GameContext);
  const navigate = useNavigate();

  // Load saves from localStorage on mount
  useEffect(() => {
    refreshSaves();
  }, []);

  const refreshSaves = () => {
    const loadedSaves = {};
    SLOTS.forEach(slot => {
      const data = localStorage.getItem(slot);
      if (data) {
        try {
          loadedSaves[slot] = JSON.parse(data);
        } catch (e) {
          loadedSaves[slot] = null;
        }
      } else {
        loadedSaves[slot] = null;
      }
    });
    setSaves(loadedSaves);
  };

  const handleStartNew = (slot) => {
    startNewGame(slot);
    navigate('/dashboard');
  };

  const handleLoadGame = (slot, state) => {
    loadGame(slot, state);
    if (state.auctionPhase === 'SETUP') navigate('/dashboard');
    else if (state.auctionPhase === 'AUCTION') navigate('/auction');
    else navigate('/tournament');
  };

  const handleDelete = (slot, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this save? All progress will be lost.')) {
      localStorage.removeItem(slot);
      refreshSaves();
    }
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="dashboard-hero-title">SELECT SAVE SLOT</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Choose an existing campaign or start a new journey.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px' }}>
        {SLOTS.map((slot, index) => {
          const saveState = saves[slot];
          
          if (!saveState) {
            // Empty Slot
            return (
              <div 
                key={slot} 
                className="glass-panel-3d" 
                style={{ 
                  height: '250px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  border: '2px dashed var(--glass-border)',
                  background: 'rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleStartNew(slot)}
              >
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                  <Plus size={32} color="var(--accent-gold)" />
                </div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Slot {index + 1}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Empty Slot - Start New Game</p>
              </div>
            );
          }

          // Populated Slot
          const userTeamData = teamsData.find(t => t.id === saveState.userTeam);
          const purse = userTeamData ? (saveState.teams.find(t => t.id === saveState.userTeam)?.purse / 10000000).toFixed(2) : '100.00';
          const phaseText = saveState.auctionPhase === 'SETUP' ? 'Team Selection' : saveState.auctionPhase === 'AUCTION' ? 'Auction Room' : 'Tournament';

          return (
            <div 
              key={slot} 
              className="glass-panel-3d" 
              style={{ 
                height: '250px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => handleLoadGame(slot, saveState)}
            >
              {/* Delete Button */}
              <button 
                onClick={(e) => handleDelete(slot, e)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 50, 50, 0.2)',
                  border: '1px solid rgba(255, 50, 50, 0.5)',
                  color: '#ff6b6b',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Delete Save"
              >
                <Trash2 size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%' }}>
                  <Save size={24} color="var(--accent-gold)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Slot {index + 1}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{phaseText}</p>
                </div>
              </div>

              {saveState.userTeam ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${userTeamData?.color || 'var(--accent-gold)'}` }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{userTeamData?.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Purse: ₹{purse} Cr</span>
                    <span>Squad: {saveState.teams.find(t => t.id === saveState.userTeam)?.squad.length}/25</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid var(--glass-border)` }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No Team Selected Yet</p>
                </div>
              )}

              <button className="glass-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <Play size={16} /> Continue
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SaveManager;
