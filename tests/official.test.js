import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSnapshot, filterSchools, filterResults, pageItems, readOfficialFollows, directoryCsv, trustedSource } from '../dist/js/official-domain.js';
import { predict, rankTeams, advanceGames } from '../dist/js/domain.js';
const data=JSON.parse(readFileSync(new URL('../dist/data/official.json',import.meta.url)));

test('official snapshot validates identities, provenance, null performance and independent seasons',()=>{
  assert.equal(validateSnapshot(data),data);
  assert.equal(data.schools.length,1566);
  assert.equal(data.games.length,24);
  for(const season of ['2025-2026','2024-2025'])assert.equal(data.games.filter(g=>g.season===season).length,12);
  assert.equal(data.schools.some(s=>s.name==='Lone Mesa'),false);
  assert.ok(data.schools.every(s=>s.rank===null&&s.rating===null&&s.seasonWins===null&&s.seasonLosses===null));
});
test('directory preserves blank cells and source classifications rather than inferring enrollment cutoffs',()=>{
  const get=name=>data.schools.find(s=>s.name===name);
  assert.deepEqual(get('Abbott').districts,{football:14,basketball:26,volleyball:18});
  assert.deepEqual(get('Ackerly Sands').districts,{football:5,basketball:6});
  assert.deepEqual(get('Abilene A.T.E.M.S.').districts,{});
  assert.equal(get('Alief Early College').classification,'6A'); // enrollment is 402; source classification is still 6A
  assert.equal(get('Brownsville Veterans Memorial').districts.football,32);
  assert.equal(get('Austin Westlake').districts.football,25);
  assert.ok(get('Austin Westlake').sourcePage>1);
  assert.equal(filterSchools(data.schools,{sport:'football'}).length,1268);
  assert.equal(filterSchools(data.schools,{sport:'basketball'}).length,1389);
  assert.equal(filterSchools(data.schools,{sport:'volleyball'}).length,1255);
  assert.equal(filterSchools(data.schools,{sport:'soccer'}).length,0);
  assert.equal(filterSchools(data.schools,{sport:'all'}).length,1566);
});
test('current school class stays independent from historical final class',()=>{
  const champ=data.games.find(g=>g.season==='2025-2026'&&g.teamAName==='Hamilton');
  const school=data.schools.find(s=>s.id===champ.teamAId);
  assert.equal(champ.classification,'2A');assert.equal(school.classification,'3A');
  assert.ok(filterResults(data.games,{classification:'2A',season:'2025-2026'}).some(g=>g.id===champ.id));
  assert.equal(filterSchools(data.schools,{classification:'2A',query:'Hamilton'}).length,0);
});
test('known official results match archive and explicit aliases resolve to the correct school',()=>{
  const ns=data.games.find(g=>g.season==='2025-2026'&&g.conference==='6A Division 1');
  assert.equal(ns.teamAName,'Galena Park North Shore');assert.equal(ns.teamAScore,10);assert.equal(ns.teamBName,'Duncanville');assert.equal(ns.teamBScore,7);
  const ds=data.games.find(g=>g.season==='2025-2026'&&g.conference==='6A Division 2');
  assert.equal(ds.teamAName,'DeSoto');assert.equal(data.schools.find(s=>s.id===ds.teamAId).name,'De Soto');
  assert.ok(ds.boxScoreUrl.startsWith('https://www.uiltexas.org/'));
});
test('snapshot rejects ambiguous, untrusted and unsupported records instead of fabricating a fallback',()=>{
  for(const mutate of [
    d=>d.schools.push(d.schools[0]),d=>d.games[0].teamAId='missing',d=>d.games[0].teamAScore=-1,
    d=>d.games[0].teamAScore=1,d=>d.schools[0].rating=97,d=>d.schools[0].seasonWins=0,
    d=>d.sources[0].url='javascript:alert(1)',d=>d.games[0].boxScoreUrl='https://example.com/data',
    d=>d.schools[0].districts.football=33,d=>d.games[0].season='2026-2027',
  ]){const changed=structuredClone(data);mutate(changed);assert.throws(()=>validateSnapshot(changed));}
  assert.equal(trustedSource('https://www.uiltexas.org.evil.test/'),false);
  assert.equal(trustedSource('http://www.uiltexas.org/'),false);
});
test('compound filters, pagination and no-current-season coverage remain explicit',()=>{
  const schools=filterSchools(data.schools,{sport:'football',classification:'6A',district:'17',query:' north shore ',format:'11-Man'});
  assert.equal(schools.length,1);assert.equal(schools[0].name,'Galena Park North Shore');
  assert.equal(filterResults(data.games,{sport:'football',season:'2026-2027'}).length,0);
  assert.equal(filterResults(data.games,{sport:'soccer'}).length,0);
  assert.equal(filterResults(data.games,{season:'2025-2026',classification:'1A',format:'6-Man'}).length,2);
  const first=pageItems(data.schools,1),second=pageItems(data.schools,2),last=pageItems(data.schools,99999);
  assert.equal(first.items.length,24);assert.equal(second.items.length,24);assert.notEqual(first.items[0].id,second.items[0].id);
  assert.equal(last.page,last.pages);assert.ok(last.items.length>0);assert.equal(pageItems([],8).page,1);
});
test('real records cannot pass through demo ratings, forecasts or score simulation',()=>{
  assert.throws(()=>rankTeams(data.schools));
  assert.throws(()=>predict({...data.schools[0],sport:'football'},{...data.schools[1],sport:'football'}));
  const final=advanceGames(data.games);assert.deepEqual(final,data.games);
  const futureLive={...data.games[0],status:'live',tick:5};assert.deepEqual(advanceGames([futureLive]),[futureLive]);
});
test('follow storage is separate from demo and exported directory carries provenance without fake stats',()=>{
  let key;const ids=new Set([data.schools[0].id]);
  const saved=readOfficialFollows({getItem:k=>{key=k;return JSON.stringify([data.schools[0].id,'mesa-football']);}},ids);
  assert.equal(key,'txhs:official-school-follows');assert.deepEqual([...saved],[data.schools[0].id]);
  assert.equal(readOfficialFollows({getItem:()=>'{bad'},ids).size,0);
  const csv=directoryCsv([data.schools[0]],data.sources[0].url,data.fetchedAt);
  assert.ok(csv.includes('Retrieved at (UTC)'));assert.ok(csv.includes(data.sources[0].url));assert.ok(!csv.includes('Wins'));assert.ok(!csv.includes('Rank'));
});
