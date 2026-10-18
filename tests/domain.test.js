import test from 'node:test';
import assert from 'node:assert/strict';
import { teams, sports, createGames } from '../dist/js/data.js';
import { rankTeams, filterTeams, predict, advanceGames, loadFavorites, csvForTeams, escapeHtml } from '../dist/js/domain.js';
test('every fixture references two different teams in the correct sport',()=>{
  const ids=new Set(teams.map(t=>t.id));
  assert.equal(ids.size,48);
  for(const g of createGames()){
    assert.ok(ids.has(g.homeId)&&ids.has(g.awayId));
    assert.notEqual(g.homeId,g.awayId);
    assert.equal(teams.find(t=>t.id===g.homeId).sport,g.sport);
    assert.equal(teams.find(t=>t.id===g.awayId).sport,g.sport);
    assert.equal(g.homeScore===null,g.status==='upcoming');
  }
});
test('ranking never mutates original data and filters retain statewide positions',()=>{
  const source=teams.filter(t=>t.sport==='football');const snapshot=structuredClone(source);
  const ranked=rankTeams(source);
  assert.deepEqual(source,snapshot);
  assert.equal(ranked[0].rating,Math.max(...source.map(t=>t.rating)));
  assert.deepEqual(ranked.map(t=>t.rank),Array.from({length:12},(_,i)=>i+1));
  const filtered=filterTeams(ranked,{sport:'football',region:'West',classification:'5A',gender:'boys',query:'  CANYON  '});
  assert.equal(filtered.length,1);assert.equal(filtered[0].name,'Canyon Forge');assert.equal(filtered[0].rank,7);
  assert.equal(filterTeams(ranked,{gender:'girls'}).length,0);
});
test('all valid matchups yield probabilities adding to 100 and sport-specific scores',()=>{
  for(const s of sports){
    const list=teams.filter(t=>t.sport===s.id);
    for(const h of list)for(const a of list.filter(t=>t.id!==h.id)){
      const p=predict(h,a);assert.equal(p.homeWin+p.awayWin,100);
      assert.ok(p.homeWin>=0&&p.homeWin<=100);
      assert.ok(Number.isInteger(p.homeScore)&&p.homeScore>=0);
      assert.ok(Number.isInteger(p.awayScore)&&p.awayScore>=0);
      if(s.id==='volleyball'){assert.equal(Math.max(p.homeScore,p.awayScore),3);assert.ok(Math.min(p.homeScore,p.awayScore)<3);}
    }
  }
  assert.throws(()=>predict(teams[0],teams[0]));
  assert.throws(()=>predict(teams[0],teams.find(t=>t.sport==='soccer')));
});
test('simulation preserves final and upcoming results and original fixture state',()=>{
  const source=createGames();const original=structuredClone(source);let next=source;
  for(let i=0;i<20;i++)next=advanceGames(next);
  assert.deepEqual(source,original);
  for(let i=0;i<source.length;i++){
    if(source[i].status!=='live')assert.deepEqual(next[i],source[i]);
    else{assert.equal(next[i].tick,20);assert.ok(next[i].homeScore>=source[i].homeScore);assert.ok(next[i].awayScore>=source[i].awayScore);}
    if(source[i].sport==='volleyball'){assert.equal(next[i].homeScore,source[i].homeScore);assert.equal(next[i].awayScore,source[i].awayScore);}
  }
});
test('favorites recover safely from corrupt, unavailable or stale browser storage',()=>{
  const valid=new Set(['mesa-football']);
  assert.deepEqual([...loadFavorites({getItem:()=>JSON.stringify(['mesa-football','missing','mesa-football'])},valid)],['mesa-football']);
  for(const value of ['{','null','{}','7'])assert.equal(loadFavorites({getItem:()=>value},valid).size,0);
  assert.equal(loadFavorites({getItem:()=>{throw Error('blocked');}},valid).size,0);
});
test('CSV quotes data, escapes formulas and exported rank reflects filters',()=>{
  const sample={...teams[0],name:'=EVIL,"name"',rank:7};
  const csv=csvForTeams([sample]);assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('"7"'));assert.ok(csv.includes('"\'=EVIL,""name"""'));
  assert.equal(escapeHtml('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;');
});
