import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { GameContext } from './context/GameContext';
import { Trophy, Users, Gavel, Edit3, Save } from 'lucide-react';
import SaveManager from './pages/SaveManager';
import Dashboard from './pages/Dashboard';
import AuctionRoom from './pages/AuctionRoom';
import SquadView from './pages/SquadView';
import Tournament from './pages/Tournament';
import Retentions from './pages/Retentions';

function App() {
  const { state, setPurse } = useContext(GameContext);
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          IPL SIMULATOR 2026
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Always show Save Manager link */}
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> Saves
          </Link>
          
          {state.userTeam && (
            <>
              <Link to="/auction" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gavel size={18} /> Auction
              </Link>
              <Link to="/squad" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> My Squad
              </Link>
              <Link to="/tournament" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} /> Tournament
              </Link>
              <div 
                style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => {
                  const currentPurseCr = (state.teams.find(t => t.id === state.userTeam)?.purse / 10000000).toFixed(2);
                  const newPurse = prompt(`Money Mod: Enter new purse amount in Crores (current: ${currentPurseCr} Cr)`, currentPurseCr);
                  if (newPurse && !isNaN(newPurse)) {
                    setPurse(state.userTeam, parseFloat(newPurse) * 10000000);
                  }
                }}
                title="Click to edit Purse (Money Mod)"
              >
                <span style={{ color: 'var(--accent-gold)' }}>Purse: </span>
                ₹{(state.teams.find(t => t.id === state.userTeam)?.purse / 10000000).toFixed(2)} Cr
                <Edit3 size={14} style={{ opacity: 0.5 }} />
              </div>
            </>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<SaveManager />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auction" element={<AuctionRoom />} />
          <Route path="/squad" element={<SquadView />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/retentions" element={<Retentions />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
