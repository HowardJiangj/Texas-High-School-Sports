export const ALIGNMENT = '2026-2028';
export const RESULT_SEASONS = ['2025-2026', '2024-2025'];
export const officialSports = [
  { id:'football', name:'Football', icon:'football' },
  { id:'basketball', name:'Basketball', icon:'basketball' },
  { id:'volleyball', name:'Volleyball', icon:'volleyball' },
  { id:'soccer', name:'Soccer', icon:'soccer' },
  { id:'all', name:'All schools', icon:'teams' },
];
export function trustedSource(url) {
  try { const u = new URL(url); return u.protocol === 'https:' && ['www.uiltexas.org','realignment.uiltexas.org'].includes(u.hostname); } catch { return false; }
}
export function validateSnapshot(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.schools) || !Array.isArray(data.games) || !Array.isArray(data.sources)) throw new Error('Unsupported data snapshot');
  if (!Number.isFinite(Date.parse(data.fetchedAt))) throw new Error('Missing retrieval timestamp');
  const sources = new Set(data.sources.map(s=>s.id));
  for (const source of data.sources) if (!trustedSource(source.url) || !Number.isFinite(Date.parse(source.fetchedAt))) throw new Error('Invalid source');
  const ids = new Set();
  for (const school of data.schools) {
    if (!school.id || ids.has(school.id) || typeof school.name !== 'string' || !school.name.trim() || !/^[1-6]A$/.test(school.classification)) throw new Error('Invalid school identity');
    if (school.alignmentPeriod !== ALIGNMENT || !sources.has(school.sourceId) || !Number.isFinite(school.enrollment) || school.enrollment < 0) throw new Error('Invalid school provenance');
    if (!school.districts || Object.entries(school.districts).some(([sport,n])=>!['football','basketball','volleyball'].includes(sport)||!Number.isInteger(n)||n<1||n>32)) throw new Error('Invalid program district');
    // The first official dataset has no full-season records or model output.
    for (const key of ['rating','rank','seasonWins','seasonLosses']) if (school[key] !== null) throw new Error('Unsupported inferred performance data');
    ids.add(school.id);
  }
  const games = new Set();
  for (const game of data.games) {
    if (games.has(game.id) || !game.id || !ids.has(game.teamAId) || !ids.has(game.teamBId) || game.teamAId === game.teamBId) throw new Error('Invalid game identity');
    if (game.status !== 'final' || game.sport !== 'football' || !RESULT_SEASONS.includes(game.season) || !/^[1-6]A$/.test(game.classification)) throw new Error('Invalid result coverage');
    if (![game.teamAScore,game.teamBScore].every(n=>Number.isInteger(n)&&n>=0) || game.teamAScore<=game.teamBScore || game.winnerId!==game.teamAId) throw new Error('Invalid final result');
    if (!sources.has(game.sourceId) || ![1,2].includes(game.division)) throw new Error('Invalid result provenance');
    for (const key of ['boxScoreUrl','teamASourceUrl','teamBSourceUrl']) if (game[key] && !trustedSource(game[key])) throw new Error('Invalid result link');
    games.add(game.id);
  }
  return data;
}
export function filterSchools(schools, filters={}) {
  const query=(filters.query||'').trim().toLocaleLowerCase('en-US');
  return schools.filter(s=>(!filters.sport || filters.sport==='all' || s.districts[filters.sport]!=null)
    && (!filters.classification || filters.classification==='all' || s.classification===filters.classification)
    && (!filters.district || filters.district==='all' || String(s.districts[filters.sport])===String(filters.district))
    && (!filters.format || filters.format==='all' || s.footballFormat===filters.format)
    && (!query || s.name.toLocaleLowerCase('en-US').includes(query)))
    .sort((a,b)=>a.name.localeCompare(b.name,'en-US'));
}
export function filterResults(games, filters={}) {
  const query=(filters.query||'').trim().toLocaleLowerCase('en-US');
  return games.filter(g=>(!filters.sport || filters.sport==='all' || g.sport===filters.sport)
    && (!filters.season || filters.season==='all' || g.season===filters.season)
    // Championship class is from the result season, never the current directory.
    && (!filters.classification || filters.classification==='all' || g.classification===filters.classification)
    && (!filters.format || filters.format==='all' || g.footballFormat===filters.format)
    && (!query || `${g.teamAName} ${g.teamBName}`.toLocaleLowerCase('en-US').includes(query)))
    .sort((a,b)=>b.classification.localeCompare(a.classification)||a.division-b.division);
}
export function pageItems(list, page=1, size=24) {
  const pages=Math.max(1,Math.ceil(list.length/size));
  const current=Math.min(pages,Math.max(1,Number.isInteger(page)?page:1));
  return {items:list.slice((current-1)*size,current*size),page:current,pages,total:list.length};
}
export function readOfficialFollows(storage, validIds) {
  try { const value=JSON.parse(storage.getItem('txhs:official-school-follows')||'[]'); return new Set(Array.isArray(value)?value.filter(id=>validIds.has(id)):[]); } catch { return new Set(); }
}
export function directoryCsv(schools,sourceUrl,fetchedAt) {
  const cell=value=>{let text=value==null?'':String(value);if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
  return '\ufeff'+[
    ['School ID','School','UIL class (2026–28)','Reported enrollment','Football district','Football division','Football format','Basketball district','Volleyball district','Alignment period','Source URL','Retrieved at (UTC)'],
    ...schools.map(s=>[s.id,s.name,s.classification,s.enrollment,s.districts.football,s.footballDivision,s.footballFormat,s.districts.basketball,s.districts.volleyball,s.alignmentPeriod,sourceUrl,fetchedAt])
  ].map(row=>row.map(cell).join(',')).join('\r\n');
}
