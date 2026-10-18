import { sports } from './data.js';
export function rankTeams(teams) {
  if (teams.some(t=>!Number.isFinite(t.rating))) throw new Error('Ratings are not available for this dataset.');
  return [...teams].sort((a,b) => b.rating - a.rating || b.wins - a.wins || a.name.localeCompare(b.name)).map((t,i)=>({...t,rank:i+1}));
}
export function filterTeams(teams, filters = {}) {
  const query = (filters.query || '').trim().toLocaleLowerCase();
  return teams.filter(t => (!filters.sport || t.sport === filters.sport)
    && (!filters.classification || filters.classification === 'all' || t.classification === filters.classification)
    && (!filters.region || filters.region === 'all' || t.region === filters.region)
    && (!filters.gender || filters.gender === 'all' || t.gender === filters.gender)
    && (!query || `${t.name} ${t.city} ${t.mascot}`.toLocaleLowerCase().includes(query)));
}
export function predict(home, away) {
  if (!home || !away || home.sport !== away.sport || home.id === away.id) throw new Error('Choose two different teams in the same sport.');
  if (!Number.isFinite(home.rating) || !Number.isFinite(away.rating)) throw new Error('Predictions require valid performance ratings.');
  const sport = sports.find(s=>s.id===home.sport);
  const diff = home.rating - away.rating;
  const homeWin = Math.round(100/(1+Math.exp(-(diff+1.5)/11)));
  let homeScore, awayScore;
  if (sport.id === 'volleyball') { homeScore = diff >= 0 ? 3 : Math.abs(diff) > 12 ? 1 : 2; awayScore = diff < 0 ? 3 : Math.abs(diff) > 12 ? 1 : 2; }
  else { homeScore = Math.max(0, Math.round(sport.baseline + diff / 30 * sport.range + .5)); awayScore = Math.max(0,Math.round(sport.baseline - diff / 30 * sport.range)); }
  return { homeWin, awayWin:100-homeWin, homeScore, awayScore, method:'Rating difference + fixed home advantage. Demo only; not backtested.' };
}
export function advanceGames(games) {
  return games.map(g=>{
    if(g.status !== 'live' || g.sourceId) return g;
    const tick = g.tick + 1;
    if(g.sport === 'volleyball') return {...g,tick,stage:`Set 3 · Demo rally ${tick+1}`};
    const frequency = g.sport === 'soccer' ? 7 : 2;
    const gain = g.sport === 'football' ? 3 : g.sport === 'basketball' ? 2 : 1;
    const addHome = tick % frequency === 0 && Math.floor(tick/frequency)%2===1;
    const addAway = tick % frequency === 0 && !addHome;
    return {...g,tick,homeScore:g.homeScore+(addHome?gain:0),awayScore:g.awayScore+(addAway?gain:0)};
  });
}
export function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function loadFavorites(storage, validIds) {
  try { const a = JSON.parse(storage.getItem('lonestar:favorites') || '[]'); return new Set(Array.isArray(a) ? a.filter(id=>validIds.has(id)) : []); } catch { return new Set(); }
}
export function csvForTeams(teams) {
  const cell = x => { let s = String(x); if(/^[=+@-]/.test(s)) s = "'"+s; return '"'+s.replaceAll('"','""')+'"'; };
  return '\ufeff'+[['Rank','Fictional team','City','Sport','Class','Wins','Losses','Demo rating'],...teams.map(t=>[t.rank,t.name,t.city,t.sport,t.classification,t.wins,t.losses,t.rating])].map(row=>row.map(cell).join(',')).join('\r\n');
}
