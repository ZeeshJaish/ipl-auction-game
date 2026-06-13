import React, { useContext, useState, useEffect } from 'react';
import { GameContext } from '../context/GameContext';
import { Play, Trophy, Award, User, Calendar, Table, FastForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tournament = () => {
  const { state, updateStats, generateSchedule, processMatchResult, appendMatches, acceptTrade, rejectTrade, endSeason } = useContext(GameContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('STANDINGS');
  const [matchResult, setMatchResult] = useState(null);
  
  // Tactical Pause State
  const [tacticalPause, setTacticalPause] = useState(null);

  // Playing 11 Selection State
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selected11, setSelected11] = useState([]);
  const [captainId, setCaptainId] = useState(null);

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
  
  // STANDINGS, FIXTURES, STATS, TRADE
  const myTeam = state.teams.find(t => t.id === state.userTeam);
  const nextMatch = state.schedule[state.currentMatchIndex];
  const isPlayoffs = state.currentMatchIndex >= 45; // Assuming 45 group matches

  const autoPick11 = (squad) => {
    let availableSquad = squad.filter(p => !p.injuredMatches || p.injuredMatches <= 0);
    if (availableSquad.length < 11) availableSquad = [...squad]; // fallback if too many injured
    let wks = availableSquad.filter(p => p.role === 'Wicket-Keeper').sort((a,b) => b.battingRating - a.battingRating);
    let bats = availableSquad.filter(p => p.role === 'Batsman').sort((a,b) => b.battingRating - a.battingRating);
    let bowls = availableSquad.filter(p => p.role === 'Bowler').sort((a,b) => b.bowlingRating - a.bowlingRating);
    let alls = availableSquad.filter(p => p.role === 'All-Rounder').sort((a,b) => (b.battingRating+b.bowlingRating) - (a.battingRating+a.bowlingRating));

    let selected = [
      ...(wks.slice(0,1)),
      ...(bats.slice(0,4)),
      ...(bowls.slice(0,4)),
      ...(alls.slice(0,2))
    ];

    if (selected.length < 11) {
      const remaining = availableSquad.filter(p => !selected.find(s => s.id === p.id)).sort((a,b) => (b.battingRating + b.bowlingRating) - (a.battingRating + a.bowlingRating));
      selected = [...selected, ...remaining.slice(0, 11 - selected.length)];
    }

    // Enforce max 4 overseas in playing XI
    let overseasCount = selected.filter(p => p.isOverseas).length;
    if (overseasCount > 4) {
      const domesticBench = availableSquad
        .filter(p => !p.isOverseas && !selected.find(s => s.id === p.id))
        .sort((a,b) => (b.battingRating + b.bowlingRating) - (a.battingRating + a.bowlingRating));
      let di = 0;
      for (let i = selected.length - 1; i >= 0 && overseasCount > 4 && di < domesticBench.length; i--) {
        if (selected[i].isOverseas) {
          selected[i] = domesticBench[di++];
          overseasCount--;
        }
      }
    }

    return selected.slice(0, 11);
  };

  const simulateInnings = (batting11, bowling11, battingCaptainId, bowlingCaptainId) => {
    const getBatRating = (p) => {
      let rating = p.battingRating;
      if (p.form === 'HOT') rating *= 1.1;
      if (p.form === 'COLD') rating *= 0.9;
      if (p.id === battingCaptainId) rating *= 1.05;
      return Math.min(100, Math.floor(rating));
    };
    const getBowlRating = (p) => {
      let rating = p.bowlingRating;
      if (p.form === 'HOT') rating *= 1.1;
      if (p.form === 'COLD') rating *= 0.9;
      if (p.id === bowlingCaptainId) rating *= 1.05;
      return Math.min(100, Math.floor(rating));
    };

    const teamBatRatingAvg = batting11.slice(0, 7).reduce((acc, p) => acc + getBatRating(p), 0) / 7 || 1;
    const teamBowlRatingAvg = bowling11.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder').slice(0, 5).reduce((acc, p) => acc + getBowlRating(p), 0) / 5 || 1;

    const runMultiplier = (teamBatRatingAvg / teamBowlRatingAvg) * 1.5; 
    const totalRuns = Math.floor((120 + Math.random() * 40) * runMultiplier);
    const totalWickets = Math.min(10, Math.floor(10 / (teamBatRatingAvg / teamBowlRatingAvg) + Math.random() * 3));

    const battingPerformances = batting11.map(p => ({ player: p, runs: 0, out: false }));
    const bowlingPerformances = bowling11.map(p => ({ player: p, wickets: 0, runsConceded: 0 }));
    
    const mainBowlers = bowlingPerformances.filter(p => p.player.role === 'Bowler' || p.player.role === 'All-Rounder').slice(0, 5);

    let runsLeft = totalRuns;
    let highlights = [];

    for (let i = 0; i < 7 && runsLeft > 0; i++) {
      if (!battingPerformances[i]) break;
      const maxPoss = Math.floor((battingPerformances[i].player.battingRating / 100) * 80);
      const scored = Math.min(runsLeft, Math.floor(Math.random() * maxPoss) + 10);
      battingPerformances[i].runs = scored;
      runsLeft -= scored;
      
      if (scored > 40 && Math.random() > 0.3) {
        highlights.push(`💥 Explosive hitting! ${battingPerformances[i].player.name} smashes it into the crowd!`);
      } else if (scored > 25 && Math.random() > 0.5) {
        highlights.push(`🏏 Beautiful timing by ${battingPerformances[i].player.name} to find the boundary.`);
      }

      if (i < totalWickets) {
        battingPerformances[i].out = true;
        const randomBowler = mainBowlers[Math.floor(Math.random() * mainBowlers.length)]?.player || bowling11[0];
        const randomFielder = bowling11[Math.floor(Math.random() * bowling11.length)];
        
        if (Math.random() > 0.5 && randomFielder.id !== randomBowler.id) {
          highlights.push(`🧤 Super catch by ${randomFielder.name} off ${randomBowler.name} to dismiss ${battingPerformances[i].player.name}!`);
        } else if (Math.random() > 0.5) {
          highlights.push(`🎯 Clean bowled! ${randomBowler.name} knocks over ${battingPerformances[i].player.name}'s stumps.`);
        } else {
          highlights.push(`☝️ Plumb LBW! ${randomBowler.name} traps ${battingPerformances[i].player.name} right in front.`);
        }
      }
    }
    if (runsLeft > 0 && battingPerformances.length > 0) battingPerformances[0].runs += runsLeft; 

    let wktsLeft = totalWickets;
    for (let b of mainBowlers) {
      if (wktsLeft > 0) {
        const w = Math.min(wktsLeft, Math.floor(Math.random() * 3) + (b.player.bowlingRating > 80 ? 1 : 0));
        b.wickets = w;
        wktsLeft -= w;
      }
      b.runsConceded = Math.floor(totalRuns / (mainBowlers.length || 1));
    }
    if (wktsLeft > 0 && mainBowlers.length > 0) mainBowlers[0].wickets += wktsLeft;

    return { totalRuns, totalWickets, battingPerformances, bowlingPerformances, highlights };
  };

  const executeMatch = (t1_11, t2_11, team1, team2, t1_captain = null, t2_captain = null) => {
    const t1_11WithTeam = t1_11.map(p => ({ ...p, teamName: team1.shortName }));
    const t2_11WithTeam = t2_11.map(p => ({ ...p, teamName: team2.shortName }));

    // AI automatically picks the highest rated player as captain if none provided
    const aiT1Cap = t1_captain || t1_11WithTeam.sort((a,b) => (b.battingRating+b.bowlingRating) - (a.battingRating+a.bowlingRating))[0]?.id;
    const aiT2Cap = t2_captain || t2_11WithTeam.sort((a,b) => (b.battingRating+b.bowlingRating) - (a.battingRating+a.bowlingRating))[0]?.id;

    const inn1 = simulateInnings(t1_11WithTeam, t2_11WithTeam, aiT1Cap, aiT2Cap);

    // If user match, pause for Tactical Intervention
    const isUserMatch = team1.id === state.userTeam || team2.id === state.userTeam;
    if (isUserMatch) {
      setTacticalPause({
        inn1, t1_11WithTeam, t2_11WithTeam, aiT1Cap, aiT2Cap, team1, team2
      });
      return; // Stop execution here, wait for user input
    }

    // If not user match, continue automatically
    finishMatchExecution(inn1, t2_11WithTeam, t1_11WithTeam, aiT2Cap, aiT1Cap, team1, team2);
  };

  const handleTacticalChoice = (tactic) => {
    const { inn1, t1_11WithTeam, t2_11WithTeam, aiT1Cap, aiT2Cap, team1, team2 } = tacticalPause;

    // Apply tactic to user's team for Innings 2
    const userIsTeam1 = team1.id === state.userTeam;
    const modifiedT1 = t1_11WithTeam.map(p => ({...p}));
    const modifiedT2 = t2_11WithTeam.map(p => ({...p}));

    const userTeamRoster = userIsTeam1 ? modifiedT1 : modifiedT2;

    userTeamRoster.forEach(p => {
      if (tactic === 'AGGRESSIVE') {
         p.battingRating = Math.min(100, p.battingRating * 1.2);
         p.bowlingRating = p.bowlingRating * 0.8; // Risky bowling
      } else if (tactic === 'DEFENSIVE') {
         p.battingRating = p.battingRating * 0.8; // Cautious batting
         p.bowlingRating = Math.min(100, p.bowlingRating * 1.2); // Tight bowling
      }
    });

    setTacticalPause(null);
    finishMatchExecution(inn1, modifiedT2, modifiedT1, aiT2Cap, aiT1Cap, team1, team2);
  };

  const finishMatchExecution = (inn1, t2_11WithTeam, t1_11WithTeam, aiT2Cap, aiT1Cap, team1, team2) => {
    const inn2 = simulateInnings(t2_11WithTeam, t1_11WithTeam, aiT2Cap, aiT1Cap);

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
      resultStr,
      highlights: [...inn1.highlights, ...inn2.highlights]
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
    if (selected11.length !== 11) {
      alert("Please select exactly 11 players.");
      return;
    }
    
    if (!captainId) {
      alert("Please select a Captain by clicking the 'C' badge next to a selected player.");
      return;
    }

    const wkCount = selected11.filter(p => p.role === 'Wicket-Keeper').length;
    if (wkCount < 1) {
      alert("You must select at least 1 Wicket-Keeper in your Playing 11.");
      return;
    }

    const overseasCount = selected11.filter(p => p.isOverseas).length;
    if (overseasCount > 4) {
      alert(`You can only have a maximum of 4 Overseas players. You selected ${overseasCount}.`);
      return;
    }

    const isTeam1 = nextMatch.team1 === myTeam.id;
    const t1 = isTeam1 ? myTeam : state.teams.find(t => t.id === nextMatch.team1);
    const t2 = isTeam1 ? state.teams.find(t => t.id === nextMatch.team2) : myTeam;
    
    const t1_11 = isTeam1 ? selected11 : autoPick11(t1.squad);
    const t2_11 = isTeam1 ? autoPick11(t2.squad) : selected11;
    
    const t1_cap = isTeam1 ? captainId : null;
    const t2_cap = isTeam1 ? null : captainId;

    executeMatch(t1_11, t2_11, t1, t2, t1_cap, t2_cap);
    setShowSelectionModal(false);
    setSelected11([]);
    setCaptainId(null);
  };

  const togglePlayerSelection = (player) => {
    if (selected11.find(p => p.id === player.id)) {
      setSelected11(selected11.filter(p => p.id !== player.id));
      if (captainId === player.id) setCaptainId(null);
    } else {
      if (selected11.length < 11) {
        setSelected11([...selected11, player]);
      }
    }
  };

  const getTopRunScorers = () => Object.values(state.tournamentStats).sort((a,b) => b.runs - a.runs).slice(0, 5);
  const getTopWicketTakers = () => Object.values(state.tournamentStats).sort((a,b) => b.wickets - a.wickets).slice(0, 5);

  const handleEndSeason = () => {
    // Find champion
    const finalMatch = state.schedule[state.schedule.length - 1];
    let championId = null;
    if (finalMatch && finalMatch.matchName === 'GRAND FINAL' && finalMatch.completed) {
       const t1 = state.teams.find(t => t.id === finalMatch.team1);
       const t2 = state.teams.find(t => t.id === finalMatch.team2);
       championId = finalMatch.resultStr.includes(t1.name) || finalMatch.resultStr.includes(t1.shortName) ? t1.id : t2.id;
    }
    
    endSeason(championId);
    navigate('/retentions');
  };
  
  if (state.schedule.length === 0) return <div style={{textAlign:'center', padding:'5rem'}}>Generating Tournament Schedule...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Daily Buzz News Ticker */}
      {state.newsItems && state.newsItems.length > 0 && (
        <div style={{ background: 'var(--accent-gold)', color: 'black', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '2rem', borderRadius: '4px' }}>
          <span style={{ marginRight: '1rem', background: 'black', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Daily Buzz</span>
          <div style={{ display: 'inline-block', animation: 'marquee 30s linear infinite' }}>
            {state.newsItems.join(' ••• ')}
          </div>
        </div>
      )}

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
          <h2 style={{ color: 'var(--accent-green)', marginBottom: '1.5rem', fontSize: '2.5rem' }}>Tournament Completed!</h2>
          <button className="glass-btn primary gold" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={handleEndSeason}>
            Proceed to Next Season 🚀
          </button>
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
        <button className={`glass-btn ${activeTab === 'TRADE' ? 'primary gold' : ''}`} onClick={() => setActiveTab('TRADE')} style={{ padding: '8px 16px', fontSize: '0.9rem', position: 'relative' }}>
          Trade Hub
          {state.tradeOffers?.length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent-red)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>
              {state.tradeOffers.length}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Tab Content */}
        {activeTab === 'STANDINGS' && (
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', minWidth: '200px' }}>Team</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>P</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>W</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>L</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>T</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Pts</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {getStandings().map((row, i) => (
                    <tr key={row.team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i < 4 ? 'rgba(251, 191, 36, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 'bold', width: '20px', color: i < 4 ? 'var(--accent-gold)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>{i + 1}</span>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: row.team.color, flexShrink: 0 }}></div>
                          <span style={{ fontWeight: row.team.id === userTeam ? 'bold' : 'normal' }}>{row.team.name}</span>
                          {i < 4 && <span style={{ fontSize: '0.7rem', background: 'rgba(251,191,36,0.2)', color: 'var(--accent-gold)', padding: '2px 6px', borderRadius: '4px' }}>Q</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{row.played}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--accent-green)' }}>{row.won}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--accent-red)' }}>{row.lost}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{row.tied}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{row.points}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: row.nrr >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

        {activeTab === 'TRADE' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>Mid-Season Trade Offers</h3>
            {(!state.tradeOffers || state.tradeOffers.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                No active trade offers from other franchises at the moment. Keep playing matches!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {state.tradeOffers.map(trade => {
                  const fromTeam = state.teams.find(t => t.id === trade.fromTeamId);
                  const playerOffered = fromTeam.squad.find(p => p.id === trade.playerOffered);
                  const playerRequested = myTeam.squad.find(p => p.id === trade.playerRequested);
                  
                  if (!playerOffered || !playerRequested) return null; // Safety check
                  
                  return (
                    <div key={trade.id} className="animate-fade-in" style={{ border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: fromTeam.color }}></div>
                          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{fromTeam.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}> proposes a trade</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Trade ID: {trade.id.substring(0, 10)}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        {/* They Give */}
                        <div style={{ flex: 1, minWidth: '250px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                          <div style={{ color: 'var(--accent-green)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>You Receive</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{playerOffered.name}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{playerOffered.role} • {playerOffered.battingRating} BAT | {playerOffered.bowlingRating} BOWL</div>
                          {trade.cashOffered > 0 && (
                            <div style={{ marginTop: '1rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>+ ₹{(trade.cashOffered / 10000000).toFixed(2)} Cr</div>
                          )}
                        </div>

                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.5)', borderRadius: '50%' }}>
                          ⇄
                        </div>

                        {/* They Want */}
                        <div style={{ flex: 1, minWidth: '250px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                          <div style={{ color: 'var(--accent-red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>You Send</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{playerRequested.name}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{playerRequested.role} • {playerRequested.battingRating} BAT | {playerRequested.bowlingRating} BOWL</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="glass-btn" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => rejectTrade(trade.id)}>Reject Offer</button>
                        <button className="glass-btn primary" style={{ background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }} onClick={() => acceptTrade(trade.id)}>Accept Trade</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Latest Match Scorecard */}
        {matchResult && (
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Latest Result: <span style={{ color: 'var(--accent-gold)' }}>{matchResult.resultStr}</span></h3>
            <div className="tournament-scorecard" style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between' }}>
              {/* Innings 1 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', flex: 1 }}>
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
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', flex: 1 }}>
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

            {/* Match Highlights */}
            {matchResult.highlights && matchResult.highlights.length > 0 && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Key Moments</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {matchResult.highlights.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Tactical Pause Modal */}
      {tacticalPause && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', textAlign: 'center', border: '2px solid var(--accent-gold)' }}>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '2rem', textTransform: 'uppercase' }}>Tactical Timeout</h2>
            <div style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Innings 1 Completed</p>
              <p style={{ fontWeight: 'bold', fontSize: '1.5rem', marginTop: '0.5rem' }}>
                {tacticalPause.team1.shortName}: {tacticalPause.inn1.totalRuns}/{tacticalPause.inn1.totalWickets}
              </p>
            </div>

            <p style={{ marginBottom: '2rem', color: 'white', fontSize: '1.1rem' }}>Choose your tactic for Innings 2:</p>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button 
                className="glass-btn primary" 
                style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--accent-red)', padding: '1.5rem' }}
                onClick={() => handleTacticalChoice('AGGRESSIVE')}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-red)', marginBottom: '0.5rem' }}>🔥 Aggressive Mode</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>+20% Batting Rating | -20% Bowling Rating. Smash boundaries, but risk losing quick wickets.</div>
              </button>

              <button 
                className="glass-btn primary" 
                style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', padding: '1.5rem' }}
                onClick={() => handleTacticalChoice('DEFENSIVE')}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#3b82f6', marginBottom: '0.5rem' }}>🛡️ Defensive Mode</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>+20% Bowling Rating | -20% Batting Rating. Bowl tight lines and preserve wickets.</div>
              </button>
              
              <button 
                className="glass-btn" 
                style={{ padding: '1rem', marginTop: '1rem' }}
                onClick={() => handleTacticalChoice('BALANCED')}
              >
                <div style={{ fontWeight: 'bold' }}>⚖️ Balanced Approach</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Play standard cricket with normal ratings.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playing 11 Selection Modal (The Locker Room) */}
      {showSelectionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-gold)' }}>The Locker Room</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}>Select exactly 11 players. Tap a selected player's 'C' badge to make them Captain.</div>
              <div style={{ display: 'flex', gap: '1rem', fontWeight: 'bold' }}>
                <span style={{ color: selected11.length === 11 ? 'var(--accent-green)' : 'white' }}>Players: {selected11.length}/11</span>
                <span style={{ color: selected11.filter(p => p.isOverseas).length > 4 ? 'var(--accent-red)' : 'white' }}>Overseas: {selected11.filter(p => p.isOverseas).length}/4</span>
                <span style={{ color: selected11.filter(p => p.role === 'Wicket-Keeper').length === 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>WK: {selected11.filter(p => p.role === 'Wicket-Keeper').length}</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {myTeam.squad.map(player => {
                const isSelected = !!selected11.find(p => p.id === player.id);
                const isCaptain = captainId === player.id;
                return (
                  <div 
                    key={player.id} 
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      background: player.injuredMatches > 0 ? 'rgba(239, 68, 68, 0.1)' : isSelected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: isCaptain ? '2px solid var(--accent-gold)' : isSelected ? '2px solid var(--accent-green)' : '2px solid transparent',
                      cursor: player.injuredMatches > 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      opacity: player.injuredMatches > 0 ? 0.6 : 1
                    }}
                  >
                    <div onClick={() => player.injuredMatches > 0 ? null : togglePlayerSelection(player)}>
                      <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {player.name}
                          {player.form === 'HOT' && <span title="Hot Form" style={{marginLeft:'4px'}}>🔥</span>}
                          {player.form === 'COLD' && <span title="Cold Form" style={{marginLeft:'4px'}}>❄️</span>}
                          {player.injuredMatches > 0 && <span title={`Injured for ${player.injuredMatches} matches`} style={{marginLeft:'4px'}}>🚑</span>}
                        </span>
                        {player.isOverseas && <span style={{ fontSize: '0.7rem', background: 'var(--accent-red)', padding: '2px 4px', borderRadius: '4px' }}>OS</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{player.role} • {player.battingRating} BAT | {player.bowlingRating} BOWL</div>
                    </div>
                    
                    {isSelected && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCaptainId(player.id); }}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCaptain ? 'var(--accent-gold)' : '#444',
                          color: isCaptain ? 'black' : 'white',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                        }}
                        title="Set as Captain"
                      >
                        C
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="glass-btn" onClick={() => { setShowSelectionModal(false); setSelected11([]); setCaptainId(null); }}>Cancel</button>
              <button 
                className="glass-btn primary gold" 
                disabled={selected11.length !== 11 || !captainId || selected11.filter(p => p.role === 'Wicket-Keeper').length < 1 || selected11.filter(p => p.isOverseas).length > 4} 
                onClick={handleUserPlayMatch}
              >
                Start Match
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tournament;
