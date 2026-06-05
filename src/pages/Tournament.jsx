import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { Play, Trophy, Award, User } from 'lucide-react';

const Tournament = () => {
  const { state, updateStats } = useContext(GameContext);
  const [opponentId, setOpponentId] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  
  if (!state.userTeam) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please select a team from the Dashboard first.</div>;
  }

  const myTeam = state.teams.find(t => t.id === state.userTeam);

  const autoPick11 = (squad) => {
    let wks = squad.filter(p => p.role === 'Wicket-Keeper').sort((a,b) => b.battingRating - a.battingRating);
    let bats = squad.filter(p => p.role === 'Batsman').sort((a,b) => b.battingRating - a.battingRating);
    let bowls = squad.filter(p => p.role === 'Bowler').sort((a,b) => b.bowlingRating - a.bowlingRating);
    let alls = squad.filter(p => p.role === 'All-Rounder').sort((a,b) => (b.battingRating+b.bowlingRating) - (a.battingRating+a.bowlingRating));

    let selected = [
      ...(wks.slice(0,1)),
      ...(bats.slice(0,4)),
      ...(bowls.slice(0,4)),
      ...(alls.slice(0,2))
    ];
    
    if (selected.length < 11) {
      const remaining = squad.filter(p => !selected.find(s => s.id === p.id)).sort((a,b) => (b.battingRating + b.bowlingRating) - (a.battingRating + a.bowlingRating));
      selected = [...selected, ...remaining.slice(0, 11 - selected.length)];
    }
    return selected;
  };

  const simulateInnings = (batting11, bowling11) => {
    const teamBatRatingAvg = batting11.slice(0, 7).reduce((acc, p) => acc + p.battingRating, 0) / 7 || 1;
    const teamBowlRatingAvg = bowling11.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder').slice(0, 5).reduce((acc, p) => acc + p.bowlingRating, 0) / 5 || 1;

    const runMultiplier = (teamBatRatingAvg / teamBowlRatingAvg) * 1.5; 
    const totalRuns = Math.floor((120 + Math.random() * 40) * runMultiplier);
    const totalWickets = Math.min(10, Math.floor(10 / (teamBatRatingAvg / teamBowlRatingAvg) + Math.random() * 3));

    const battingPerformances = batting11.map(p => ({ player: p, runs: 0, out: false }));
    const bowlingPerformances = bowling11.map(p => ({ player: p, wickets: 0, runsConceded: 0 }));

    let runsLeft = totalRuns;
    for (let i = 0; i < 7 && runsLeft > 0; i++) {
      const maxPoss = Math.floor((battingPerformances[i].player.battingRating / 100) * 80);
      const scored = Math.min(runsLeft, Math.floor(Math.random() * maxPoss) + 10);
      battingPerformances[i].runs = scored;
      runsLeft -= scored;
      if (i < totalWickets) battingPerformances[i].out = true;
    }
    if (runsLeft > 0 && battingPerformances.length > 0) battingPerformances[0].runs += runsLeft; 

    let wktsLeft = totalWickets;
    const mainBowlers = bowlingPerformances.filter(p => p.player.role === 'Bowler' || p.player.role === 'All-Rounder').slice(0, 5);
    for (let b of mainBowlers) {
      if (wktsLeft > 0) {
        const w = Math.min(wktsLeft, Math.floor(Math.random() * 3) + (b.player.bowlingRating > 80 ? 1 : 0));
        b.wickets = w;
        wktsLeft -= w;
      }
      b.runsConceded = Math.floor(totalRuns / (mainBowlers.length || 1));
    }
    if (wktsLeft > 0 && mainBowlers.length > 0) mainBowlers[0].wickets += wktsLeft;

    return { totalRuns, totalWickets, battingPerformances, bowlingPerformances };
  };

  const startMatch = () => {
    if (!opponentId) return;
    const opponent = state.teams.find(t => t.id === opponentId);

    const my11 = autoPick11(myTeam.squad);
    const opp11 = autoPick11(opponent.squad);

    if (my11.length < 5 || opp11.length < 5) {
      alert("Both teams need at least 5 players to simulate realistically!");
      return;
    }

    // Assign teamName to players for stats
    const my11WithTeam = my11.map(p => ({ ...p, teamName: myTeam.shortName }));
    const opp11WithTeam = opp11.map(p => ({ ...p, teamName: opponent.shortName }));

    const inn1 = simulateInnings(my11WithTeam, opp11WithTeam);
    const inn2 = simulateInnings(opp11WithTeam, my11WithTeam);

    let resultStr = "";
    if (inn1.totalRuns > inn2.totalRuns) {
      resultStr = `${myTeam.name} won by ${inn1.totalRuns - inn2.totalRuns} runs!`;
    } else if (inn2.totalRuns > inn1.totalRuns) {
      resultStr = `${opponent.name} won by ${10 - inn2.totalWickets} wickets!`;
    } else {
      resultStr = "Match Tied!";
    }

    setMatchResult({
      inn1: { team: myTeam.shortName, ...inn1 },
      inn2: { team: opponent.shortName, ...inn2 },
      resultStr
    });

    // Update Global Stats
    let allPerformances = [];
    inn1.battingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: bp.runs, wickets: 0 }));
    inn1.bowlingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: 0, wickets: bp.wickets }));
    inn2.battingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: bp.runs, wickets: 0 }));
    inn2.bowlingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: 0, wickets: bp.wickets }));

    updateStats(allPerformances);
  };

  const getTopRunScorers = () => {
    const players = Object.values(state.tournamentStats);
    return players.sort((a,b) => b.runs - a.runs).slice(0, 5);
  };

  const getTopWicketTakers = () => {
    const players = Object.values(state.tournamentStats);
    return players.sort((a,b) => b.wickets - a.wickets).slice(0, 5);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Tournament & Leaderboards</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Match Setup */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Play a Match</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>The engine will auto-pick the best 11 players from your squad and the opponent's squad to simulate a match.</p>
            </div>
            <select 
              value={opponentId} 
              onChange={(e) => setOpponentId(e.target.value)}
              style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', width: '200px' }}
            >
              <option value="">-- Choose Opponent --</option>
              {state.teams.filter(t => t.id !== state.userTeam).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button className="glass-btn primary" onClick={startMatch} disabled={!opponentId}>
              <Play size={18} style={{ marginRight: '8px' }} /> Sim Match
            </button>
          </div>

          {/* Match Scorecard */}
          {matchResult && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', color: matchResult.resultStr.includes(myTeam.name) ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
                  {matchResult.resultStr}
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Innings 1 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{matchResult.inn1.team} Innings</span>
                    <span>{matchResult.inn1.totalRuns}/{matchResult.inn1.totalWickets}</span>
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Top Batsmen</div>
                  {matchResult.inn1.battingPerformances.filter(p => p.runs > 0).sort((a,b) => b.runs - a.runs).slice(0, 3).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                      <span>{p.player.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{p.runs} {p.out ? '' : '*'}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '1rem 0 0.5rem 0' }}>Top Bowlers (Opponent)</div>
                  {matchResult.inn1.bowlingPerformances.filter(p => p.wickets > 0).sort((a,b) => b.wickets - a.wickets).slice(0, 3).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                      <span>{p.player.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{p.wickets}/{p.runsConceded}</span>
                    </div>
                  ))}
                </div>

                {/* Innings 2 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{matchResult.inn2.team} Innings</span>
                    <span>{matchResult.inn2.totalRuns}/{matchResult.inn2.totalWickets}</span>
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Top Batsmen</div>
                  {matchResult.inn2.battingPerformances.filter(p => p.runs > 0).sort((a,b) => b.runs - a.runs).slice(0, 3).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                      <span>{p.player.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{p.runs} {p.out ? '' : '*'}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '1rem 0 0.5rem 0' }}>Top Bowlers (Opponent)</div>
                  {matchResult.inn2.bowlingPerformances.filter(p => p.wickets > 0).sort((a,b) => b.wickets - a.wickets).slice(0, 3).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                      <span>{p.player.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{p.wickets}/{p.runsConceded}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboards Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Orange Cap */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #f97316' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f97316' }}>
              <Trophy size={20} /> Orange Cap
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {getTopRunScorers().length === 0 ? <div style={{ color: 'var(--text-secondary)' }}>No matches played yet.</div> : null}
              {getTopRunScorers().map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="#666" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.team}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#f97316', fontSize: '1.2rem' }}>{p.runs}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Purple Cap */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #a855f7' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#a855f7' }}>
              <Award size={20} /> Purple Cap
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {getTopWicketTakers().length === 0 ? <div style={{ color: 'var(--text-secondary)' }}>No matches played yet.</div> : null}
              {getTopWicketTakers().map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="#666" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.team}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#a855f7', fontSize: '1.2rem' }}>{p.wickets}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Tournament;
