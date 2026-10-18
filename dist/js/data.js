// All schools, teams, results and news in this module are invented demo fixtures.
export const sports = [
  { id: 'football', name: 'Football', short: 'FOOTBALL', icon: 'football', gender: 'boys', unit: 'points', baseline: 28, range: 10 },
  { id: 'basketball', name: 'Basketball', short: 'BASKETBALL', icon: 'basketball', gender: 'boys', unit: 'points', baseline: 64, range: 14 },
  { id: 'volleyball', name: 'Volleyball', short: 'VOLLEYBALL', icon: 'volleyball', gender: 'girls', unit: 'sets', baseline: 3, range: 1 },
  { id: 'soccer', name: 'Soccer', short: 'SOCCER', icon: 'soccer', gender: 'girls', unit: 'goals', baseline: 2, range: 1.5 },
];
export const schools = [
  { id: 'mesa', name: 'Lone Mesa', mascot: 'WOLVES', city: 'Austin', region: 'Central', classification: '6A', color: '#9e382f', initials: 'LM' },
  { id: 'prairie', name: 'Prairie Summit', mascot: 'EAGLES', city: 'Dallas', region: 'North', classification: '6A', color: '#b48a22', initials: 'PS' },
  { id: 'trinity', name: 'Trinity Harbor', mascot: 'TITANS', city: 'Fort Worth', region: 'North', classification: '6A', color: '#42566c', initials: 'TH' },
  { id: 'rio', name: 'Rio Ember', mascot: 'HAWKS', city: 'San Antonio', region: 'South', classification: '6A', color: '#366e5b', initials: 'RE' },
  { id: 'copper', name: 'Copper Valley', mascot: 'MUSTANGS', city: 'Houston', region: 'East', classification: '6A', color: '#b76a35', initials: 'CV' },
  { id: 'highland', name: 'Highland Crest', mascot: 'PANTHERS', city: 'Plano', region: 'North', classification: '6A', color: '#74608d', initials: 'HC' },
  { id: 'canyon', name: 'Canyon Forge', mascot: 'BULLDOGS', city: 'El Paso', region: 'West', classification: '5A', color: '#3c717c', initials: 'CF' },
  { id: 'bluebonnet', name: 'Bluebonnet Ridge', mascot: 'BOBCATS', city: 'Round Rock', region: 'Central', classification: '5A', color: '#56633c', initials: 'BR' },
  { id: 'gulf', name: 'Gulf Horizon', mascot: 'SHARKS', city: 'Corpus Christi', region: 'South', classification: '5A', color: '#2b7c86', initials: 'GH' },
  { id: 'redrock', name: 'Redrock Union', mascot: 'FALCONS', city: 'Lubbock', region: 'West', classification: '5A', color: '#8b463d', initials: 'RU' },
  { id: 'pine', name: 'Pine Lantern', mascot: 'BEARS', city: 'Tyler', region: 'East', classification: '4A', color: '#3d6553', initials: 'PL' },
  { id: 'pecos', name: 'Pecos Summit', mascot: 'COYOTES', city: 'Midland', region: 'West', classification: '4A', color: '#8e6838', initials: 'PC' },
];
export const teams = sports.flatMap((sport, si) => schools.map((school, i) => {
  const order = (i + si * 3) % schools.length;
  const wins = Math.max(2, 8 - Math.floor(order / 2));
  const losses = 8 - wins;
  return { ...school, schoolId: school.id, id: `${school.id}-${sport.id}`, sport: sport.id, gender: sport.gender,
    rating: Math.round((98.4 - order * 2.17 + si * .12) * 10) / 10, wins, losses,
    previousRank: Math.max(1, order + 1 + [0, 2, -1, 1, -2, 0][order % 6]),
    form: Array.from({ length: 5 }, (_, n) => (n + order) % (order < 4 ? 5 : 3) === 1 ? 'L' : 'W'),
    history: Array.from({ length: 8 }, (_, n) => +(83 - order * 1.5 + n * 1.8 + Math.sin(n + i) * 2).toFixed(1)),
  };
}));
export function createGames() {
  return sports.flatMap((sport, si) => {
    const ids = schools.map(s => `${s.id}-${sport.id}`);
    const fixtures = si === 0 ? [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11]] : [[3,4],[5,6],[7,8],[9,10],[11,0],[1,2]];
    return fixtures.map(([a,b], i) => {
      const status = i < 2 ? 'live' : i < 4 ? 'final' : 'upcoming';
      const values = { football: [[21,14],[10,17],[35,21],[28,14]], basketball: [[52,48],[41,43],[72,65],[58,66]], volleyball: [[1,1],[2,1],[3,1],[2,3]], soccer: [[1,0],[0,2],[3,1],[1,2]] }[sport.id];
      return { id: `${sport.id}-${i}`, sport: sport.id, homeId: ids[a], awayId: ids[b], status,
        homeScore: status === 'upcoming' ? null : values[i][0], awayScore: status === 'upcoming' ? null : values[i][1],
        stage: sport.id === 'volleyball' ? 'Set 3' : sport.id === 'soccer' ? '2nd half · 62′' : 'Q3 · 6:42',
        date: i < 4 ? 'Oct 16' : 'Oct 23', time: i % 2 ? '7:30 PM' : '7:00 PM', venue: `${schools[a].name} Field`, tick: 0,
      };
    });
  });
}
export const news = [
  { id:'n1', sport:'football', tag:'Game of the week', title:'Friday night. The top spot on the line.', summary:'Lone Mesa meets Prairie Summit in a fictional showdown between two of the demo’s highest-rated teams.', body:'This is a fictional game preview created for the Texas High School Sports demo. It shows how a matchup story can connect readers to team profiles, recent form, and game details. The full app will include sourced reporting and original article links. No real game or school is represented.', schoolId:'mesa', type:'feature', time:'Demo story · Oct 16, 2026', art:'field' },
  { id:'n2', sport:'basketball', tag:'Season outlook', title:'A new season starts with the next possession.', summary:'Explore the schedules, recent records, and rating trends that give every team a season-long story.', body:'This fictional basketball outlook demonstrates how team performance and schedules can be presented alongside editorial coverage. All teams, records, and events in this article are demo fixtures. A future version will link to verified reporting and real team data.', schoolId:'copper', time:'Demo story · Oct 16, 2026', art:'court' },
  { id:'n3', sport:'volleyball', tag:'Team spotlight', title:'Every set is a chance to turn it around.', summary:'Follow a fictional girls volleyball team through the momentum swings that make every match matter.', body:'This fictional volleyball story demonstrates the team-news experience. Volleyball scores are displayed as sets, with their own sport-specific format. A future version can connect match reports with set-by-set results and sourced team updates. This article does not describe a real team or match.', schoolId:'rio', time:'Demo story · Oct 15, 2026', art:'net' },
  { id:'n4', sport:'soccer', tag:'Match preview', title:'The next big moment is on the pitch.', summary:'Recent form and a sample matchup forecast offer a starting point for exploring the next game.', body:'This fictional soccer preview demonstrates how a matchup forecast can sit alongside team coverage. Forecasts in this demo use an illustrative formula and are not backtested. A full prediction model will need real historical results, home-field factors, and support for draws. No real match is represented.', schoolId:'trinity', time:'Demo story · Oct 15, 2026', art:'pitch' },
];
export const regions = { North:'North Texas', Central:'Central Texas', South:'South Texas', West:'West Texas', East:'East Texas' };
