import React, { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { Play, Trophy, Award, User, Calendar, Table, FastForward } from 'lucide-react';

const Tournament = () => {
  const { state, updateStats, generateSchedule, processMatchResult, appendMatches } = useContext(GameContext);
  const [activeTab, setActiveTab] = useState('STANDINGS');
  const [matchResult, setMatchResult] = useState(null);
  
  // Playing 11 Selection State
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selected11, setSelected11] = useState([]);

  const getStandings = () => Object.entries(state.pointsTable).map(([id, stats]) => ({ team: state.teams.find(t => t.id === id), ...stats })).sort((a,b) => b.points - a.points || b.nrr - a.nrr);

  useEffect(() => {
    if (state.schedule.length === 0 && state.userTeam) {
      generateSchedule();
    }
  }, [state.schedule, state.userTeam, generateSchedule]);

  // Playoff Generator Effect
  useEffect(() => {
    if (state.schedule.length === 45 && state.currentMatchIndex === 45) {
      // Group Stage just ended. Schedule Q1 and Eliminator
      const standings = getStandings();
      appendMatches([
        { team1: standings[0].team.id, team2: standings[1].team.id, completed: false, resultStr: null, matchName: 'Qualifier 1' },
        { team1: standings[2].team.id, team2: standings[3].team.id, completed: false, resultStr: null, matchName: 'Eliminator' }
      ]);
    } else if (state.schedule.length === 47 && state.currentMatchIndex === 47) {
      // Q1 and Eliminator just ended. Schedule Q2
      const q1 = state.schedule[45];
      const elim = state.schedule[46];
      // Need to find loser of Q1 and winner of Elim.
      // We can infer from resultStr, but it's easier to store winnerId in the state.
      // Wait, processMatchResult stores winnerId inside the action but doesn't save it to the schedule object.
      // Let's parse resultStr: `${teamName} won...`
      const getWinnerId = (matchObj) => {
        const t1 = state.teams.find(t => t.id === matchObj.team1);
        const t2 = state.teams.find(t => t.id === matchObj.team2);
        if (matchObj.resultStr.includes(t1.name) || matchObj.resultStr.includes(t1.shortName)) return t1.id;
        return t2.id;
      };
      const getLoserId = (matchObj) => {
        return getWinnerId(matchObj) === matchObj.team1 ? matchObj.team2 : matchObj.team1;
      };

      const loserQ1 = getLoserId(q1);
      const winnerElim = getWinnerId(elim);

      appendMatches([
        { team1: loserQ1, team2: winnerElim, completed: false, resultStr: null, matchName: 'Qualifier 2' }
      ]);
    } else if (state.schedule.length === 48 && state.currentMatchIndex === 48) {
      // Q2 ended. Schedule Final
      const q1 = state.schedule[45];
      const q2 = state.schedule[47];
      
      const getWinnerId = (matchObj) => {
        const t1 = state.teams.find(t => t.id === matchObj.team1);
        const t2 = state.teams.find(t => t.id === matchObj.team2);
        if (matchObj.resultStr.includes(t1.name) || matchObj.resultStr.includes(t1.shortName)) return t1.id;
        return t2.id;
      };

      const winnerQ1 = getWinnerId(q1);
      const winnerQ2 = getWinnerId(q2);

      appendMatches([
        { team1: winnerQ1, team2: winnerQ2, completed: false, resultStr: null, matchName: 'GRAND FINAL' }
      ]);
    }
  }, [state.schedule.length, state.currentMatchIndex]);

  if (!state.userTeam) {
    return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Please select a team from the Dashboard first.</div>;
  }

  const myTeam = state.teams.find(t => t.id === state.userTeam);
  const nextMatch = state.schedule[state.currentMatchIndex];
  const isPlayoffs = state.currentMatchIndex >= 45; // Assuming 45 group matches

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
      if (!battingPerformances[i]) break;
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

  const executeMatch = (t1_11, t2_11, team1, team2) => {
    const t1_11WithTeam = t1_11.map(p => ({ ...p, teamName: team1.shortName }));
    const t2_11WithTeam = t2_11.map(p => ({ ...p, teamName: team2.shortName }));

    const inn1 = simulateInnings(t1_11WithTeam, t2_11WithTeam);
    const inn2 = simulateInnings(t2_11WithTeam, t1_11WithTeam);

    let resultStr = "";
    let winnerId = null;
    let loserId = null;
    let isTie = false;

    if (inn1.totalRuns > inn2.totalRuns) {
      resultStr = `${team1.name} won by ${inn1.totalRuns - inn2.totalRuns} runs`;
      winnerId = team1.id;
      loserId = team2.id;
    } else if (inn2.totalRuns > inn1.totalRuns) {
      resultStr = `${team2.name} won by ${10 - inn2.totalWickets} wickets`;
      winnerId = team2.id;
      loserId = team1.id;
    } else {
      resultStr = "Match Tied";
      isTie = true;
      winnerId = team1.id; // Arbitrary, but handles tied logic
      loserId = team2.id;
    }

    setMatchResult({
      inn1: { team: team1.shortName, ...inn1 },
      inn2: { team: team2.shortName, ...inn2 },
      resultStr
    });

    let allPerformances = [];
    inn1.battingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: bp.runs, wickets: 0 }));
    inn1.bowlingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: 0, wickets: bp.wickets }));
    inn2.battingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: bp.runs, wickets: 0 }));
    inn2.bowlingPerformances.forEach(bp => allPerformances.push({ player: bp.player, runs: 0, wickets: bp.wickets }));

    updateStats(allPerformances);
    processMatchResult({ winnerId, loserId, isTie, team1Runs: inn1.totalRuns, team2Runs: inn2.totalRuns, resultStr });
  };

  const handleSimulateCPU = () => {
    const t1 = state.teams.find(t => t.id === nextMatch.team1);
    const t2 = state.teams.find(t => t.id === nextMatch.team2);
    executeMatch(autoPick11(t1.squad), autoPick11(t2.squad), t1, t2);
  };

  const handleUserPlayMatch = () => {
    // If playing 11 selected, execute
    if (selected11.length === 11) {
      const isTeam1 = nextMatch.team1 === myTeam.id;
      const t1 = isTeam1 ? myTeam : state.teams.find(t => t.id === nextMatch.team1);
      const t2 = isTeam1 ? state.teams.find(t => t.id === nextMatch.team2) : myTeam;
      
      const t1_11 = isTeam1 ? selected11 : autoPick11(t1.squad);
      const t2_11 = isTeam1 ? autoPick11(t2.squad) : selected11;
      
      executeMatch(t1_11, t2_11, t1, t2);
      setShowSelectionModal(false);
      setSelected11([]);
    } else {
      alert("Please select exactly 11 players.");
    }
  };

  const togglePlayerSelection = (player) => {
    if (selected11.find(p => p.id === player.id)) {
      setSelected11(selected11.filter(p => p.id !== player.id));
    } else {
      if (selected11.length < 11) {
        setSelected11([...selected11, player]);
      }
    }
  };

  const getTopRunScorers = () => Object.values(state.tournamentStats).sort((a,b) => b.runs - a.runs).slice(0, 5);
  const getTopWicketTakers = () => Object.values(state.tournamentStats).sort((a,b) => b.wickets - a.wickets).slice(0, 5);
  
  if (state.schedule.length === 0) return <div style={{textAlign:'center', padding:'5rem'}}>Generating Tournament Schedule...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Next Match Banner */}
      {nextMatch ? (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(20,20,30,0.8), rgba(10,10,15,0.9))' }}>
          <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {nextMatch.matchName || `Match ${state.currentMatchIndex + 1}`}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
            <span style={{ color: state.teams.find(t=>t.id === nextMatch.team1).color }}>{state.teams.find(t=>t.id === nextMatch.team1).shortName}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>VS</span>
            <span style={{ color: state.teams.find(t=>t.id === nextMatch.team2).color }}>{state.teams.find(t=>t.id === nextMatch.team2).shortName}</span>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            {(nextMatch.team1 === userTeam || nextMatch.team2 === userTeam) ? (
              <button className="glass-btn primary" onClick={() => setShowSelectionModal(true)}>
                <Play size={18} style={{ marginRight: '8px' }} /> Pick Playing 11 & Play Match
              </button>
            ) : (
              <button className="glass-btn" onClick={handleSimulateCPU}>
                <FastForward size={18} style={{ marginRight: '8px' }} /> Simulate Match (CPU)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-green)' }}>Tournament Completed!</h2>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button className={`glass-btn ${activeTab === 'STANDINGS' ? 'primary' : ''}`} onClick={() => setActiveTab('STANDINGS')} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Table size={16} style={{ marginRight: '8px' }} /> Points Table
        </button>
        <button className={`glass-btn ${activeTab === 'FIXTURES' ? 'primary' : ''}`} onClick={() => setActiveTab('FIXTURES')} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Calendar size={16} style={{ marginRight: '8px' }} /> Fixtures
        </button>
        <button className={`glass-btn ${activeTab === 'STATS' ? 'primary' : ''}`} onClick={() => setActiveTab('STATS')} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Award size={16} style={{ marginRight: '8px' }} /> Top Performers
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Tab Content */}
        {activeTab === 'STANDINGS' && (
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>Team</th>
                  <th style={{ padding: '1rem' }}>P</th>
                  <th style={{ padding: '1rem' }}>W</th>
                  <th style={{ padding: '1rem' }}>L</th>
                  <th style={{ padding: '1rem' }}>T</th>
                  <th style={{ padding: '1rem' }}>NRR</th>
                  <th style={{ padding: '1rem' }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {getStandings().map((row, i) => (
                  <tr key={row.team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i < 4 ? 'rgba(251, 191, 36, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 'bold', width: '20px' }}>{i + 1}</span>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: row.team.color }}></div>
                      <span style={{ fontWeight: row.team.id === userTeam ? 'bold' : 'normal' }}>{row.team.name}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{row.played}</td>
                    <td style={{ padding: '1rem' }}>{row.won}</td>
                    <td style={{ padding: '1rem' }}>{row.lost}</td>
                    <td style={{ padding: '1rem' }}>{row.tied}</td>
                    <td style={{ padding: '1rem' }}>{row.nrr > 0 ? `+${row.nrr}` : row.nrr}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-gold)' }}>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'FIXTURES' && (
          <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
            {state.schedule.map((match, i) => {
              const t1 = state.teams.find(t => t.id === match.team1);
              const t2 = state.teams.find(t => t.id === match.team2);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: i === state.currentMatchIndex ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                  <div style={{ width: '100px', color: 'var(--text-secondary)' }}>{match.matchName || `M${i + 1}`}</div>
                  <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                    <span style={{ fontWeight: match.team1 === userTeam ? 'bold' : 'normal', width: '50px', textAlign: 'right' }}>{t1.shortName}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>vs</span>
                    <span style={{ fontWeight: match.team2 === userTeam ? 'bold' : 'normal', width: '50px' }}>{t2.shortName}</span>
                  </div>
                  <div style={{ width: '250px', textAlign: 'right', fontSize: '0.9rem', color: match.resultStr ? 'white' : 'var(--text-secondary)' }}>
                    {match.resultStr || 'Upcoming'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'STATS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #f97316' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f97316' }}><Trophy size={20} /> Orange Cap</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

            <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #a855f7' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#a855f7' }}><Award size={20} /> Purple Cap</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
        )}

        {/* Latest Match Scorecard */}
        {matchResult && (
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Latest Result: <span style={{ color: 'var(--accent-gold)' }}>{matchResult.resultStr}</span></h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {/* Innings 1 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold' }}>
                  <span>{matchResult.inn1.team}</span>
                  <span>{matchResult.inn1.totalRuns}/{matchResult.inn1.totalWickets}</span>
                </div>
                {matchResult.inn1.battingPerformances.filter(p=>p.runs > 0).sort((a,b)=>b.runs-a.runs).slice(0,3).map((p,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem' }}><span>{p.player.name}</span><span>{p.runs} {p.out ? '' : '*'}</span></div>)}
                <div style={{ marginTop: '1rem' }}>
                  {matchResult.inn1.bowlingPerformances.filter(p=>p.wickets > 0).sort((a,b)=>b.wickets-a.wickets).slice(0,3).map((p,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'var(--text-secondary)' }}><span>{p.player.name}</span><span>{p.wickets}/{p.runsConceded}</span></div>)}
                </div>
              </div>
              {/* Innings 2 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold' }}>
                  <span>{matchResult.inn2.team}</span>
                  <span>{matchResult.inn2.totalRuns}/{matchResult.inn2.totalWickets}</span>
                </div>
                {matchResult.inn2.battingPerformances.filter(p=>p.runs > 0).sort((a,b)=>b.runs-a.runs).slice(0,3).map((p,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem' }}><span>{p.player.name}</span><span>{p.runs} {p.out ? '' : '*'}</span></div>)}
                <div style={{ marginTop: '1rem' }}>
                  {matchResult.inn2.bowlingPerformances.filter(p=>p.wickets > 0).sort((a,b)=>b.wickets-a.wickets).slice(0,3).map((p,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'var(--text-secondary)' }}><span>{p.player.name}</span><span>{p.wickets}/{p.runsConceded}</span></div>)}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Playing 11 Selection Modal */}
      {showSelectionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Select Playing 11</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select exactly 11 players from your squad to take the field. Currently selected: <strong style={{ color: selected11.length === 11 ? 'var(--accent-green)' : 'white' }}>{selected11.length}/11</strong></p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {myTeam.squad.map(player => {
                const isSelected = !!selected11.find(p => p.id === player.id);
                return (
                  <div 
                    key={player.id} 
                    onClick={() => togglePlayerSelection(player)}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      background: isSelected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: isSelected ? '1px solid var(--accent-green)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{player.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{player.role} • {player.country}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="glass-btn" onClick={() => setShowSelectionModal(false)}>Cancel</button>
              <button className="glass-btn primary" disabled={selected11.length !== 11} onClick={handleUserPlayMatch}>Start Match</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tournament;
