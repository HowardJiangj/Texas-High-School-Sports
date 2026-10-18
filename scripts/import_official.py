#!/usr/bin/env python3
"""Import public UIL facts. No commercial feeds, athlete details, or inferred ratings."""
from __future__ import annotations
import argparse, hashlib, io, json, logging, re, unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SCHOOL_URL = 'https://realignment.uiltexas.org/alignments/2026/Alpha_26-28.pdf'
RESULTS_URL = 'https://www.uiltexas.org/football/archives'


def school_id(name):
    text = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return 'uil-' + re.sub(r'[^a-z0-9]+', '-', text).strip('-')


def parse_schools(raw):
    schools = []
    with pdfplumber.open(io.BytesIO(raw)) as document:
      for page_number, page in enumerate(document.pages, 1):
        all_words = page.extract_words(x_tolerance=1.5, y_tolerance=2)
        anchors = [w for w in all_words if re.fullmatch(r'[1-6]A', w['text']) and 190 < w['x0'] < 225]
        for anchor in sorted(anchors, key=lambda w:w['top']):
            words = sorted([w for w in all_words if abs(w['top'] - anchor['top']) < 2.5], key=lambda w:w['x0'])
            conference_words = [anchor]
            conference = conference_words[0]
            cells = [''] * 8
            cells[0] = ' '.join(w['text'] for w in words if w['x0'] < conference['x0'])
            cells[1] = conference['text']
            for word in words:
                if word['x0'] <= conference['x0']: continue
                col = 2 + sum(word['x0'] >= boundary for boundary in [285,355,425,490,530])
                cells[col] += word['text']
            name, classification, enrollment, vb, bb, fb, division, form = cells
            if not re.fullmatch(r'[1-6]A', classification):
                if any(cells) and any(re.fullmatch(r'[1-6]A', c) for c in cells):
                    raise ValueError(f'Unexpected PDF columns on page {page_number}: {cells}')
                continue
            if not name or not re.fullmatch(r'\d+(?:\.\d+)?', enrollment):
                raise ValueError(f'Invalid school row: {cells}')
            def district(value):
                if not value: return None
                if not value.isdigit() or not 1 <= int(value) <= 32:
                    raise ValueError(f'Invalid district: {cells}')
                return int(value)
            if form not in ('11-Man', '6-Man', 'None'):
                raise ValueError(f'Unknown football format: {cells}')
            if division not in ('', '1', '2'):
                raise ValueError(f'Invalid division: {cells}')
            programs = {k: v for k, v in {
                'football': district(fb), 'basketball': district(bb), 'volleyball': district(vb)
            }.items() if v is not None}
            if fb and form == 'None':
                raise ValueError(f'Contradictory football row: {cells}')
            schools.append({
                'id': school_id(name), 'name': name, 'classification': classification,
                'enrollment': float(enrollment), 'districts': programs,
                'footballDivision': int(division) if division else None,
                'footballFormat': None if form == 'None' else form,
                'alignmentPeriod': '2026-2028', 'sourceId': 'uil-alignment-2026',
                'sourcePage': page_number,
                'rating': None, 'rank': None, 'seasonWins': None, 'seasonLosses': None,
                'city': None, 'mascot': None,
            })
    ids = [s['id'] for s in schools]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate school IDs; resolve aliases before publishing')
    if len(schools) < 1000:
        raise ValueError(f'Incomplete school import ({len(schools)} rows)')
    return sorted(schools, key=lambda s: s['name'].casefold())


class ArchiveParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows = []; self.row = None; self.cell = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'tr': self.row = []
        elif tag == 'td' and self.row is not None: self.cell = {'text': '', 'links': []}
        elif tag == 'a' and self.cell is not None:
            url = attrs.get('href', '')
            if url.startswith('https://www.uiltexas.org/'):
                self.cell['links'].append(url)
    def handle_data(self, data):
        if self.cell is not None: self.cell['text'] += data
    def handle_endtag(self, tag):
        if tag == 'td' and self.cell is not None:
            self.cell['text'] = ' '.join(self.cell['text'].split())
            self.row.append(self.cell); self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.rows.append(self.row); self.row = None


def parse_results(html, schools):
    parser = ArchiveParser(); parser.feed(html)
    by_name = {s['name'].casefold(): s['id'] for s in schools}
    # Explicit spelling aliases, never fuzzy matching different schools.
    aliases = {'desoto': 'De Soto'}
    def resolve(name):
        mapped = aliases.get(name.casefold(), name).casefold()
        if mapped not in by_name:
            raise ValueError(f'Unmatched championship school: {name} (mapped to {mapped})')
        return by_name[mapped]
    results = []
    for cells in parser.rows:
        if len(cells) < 5: continue
        season, conference, champion, runner_up, score = [c['text'] for c in cells[:5]]
        if season not in ('2025-2026', '2024-2025'): continue
        match = re.fullmatch(r'([1-6]A)(?: Six-Man)? Division ([12])', conference)
        scores = re.match(r'^(\d+)[-–](\d+)', score)
        if not match or not scores:
            raise ValueError(f'Unexpected championship row: {[c["text"] for c in cells]}')
        results.append({
            'id': f'uil-football-{season}-{match[1].lower()}-d{match[2]}',
            'sport': 'football', 'season': season, 'classification': match[1],
            'division': int(match[2]), 'conference': conference,
            'footballFormat': '6-Man' if 'Six-Man' in conference else '11-Man',
            'teamAId': resolve(champion), 'teamBId': resolve(runner_up),
            'teamAName': champion, 'teamBName': runner_up,
            'teamAScore': int(scores[1]), 'teamBScore': int(scores[2]),
            'winnerId': resolve(champion), 'status': 'final', 'stage': 'State championship',
            'gameDate': None, 'venue': None, 'neutralSite': None,
            'notes': score[scores.end():].strip(' :-'),
            'sourceId': 'uil-football-archives',
            'boxScoreUrl': cells[4]['links'][0] if cells[4]['links'] else None,
            'teamASourceUrl': cells[2]['links'][0] if cells[2]['links'] else None,
            'teamBSourceUrl': cells[3]['links'][0] if cells[3]['links'] else None,
        })
    for season in ('2025-2026', '2024-2025'):
        records = [g for g in results if g['season'] == season]
        if len(records) != 12 or len({g['id'] for g in records}) != 12:
            raise ValueError(f'Expected 12 distinct finals for {season}, got {len(records)}')
    return results


def build(school_bytes, archive_bytes, fetched_at, source_times=None):
    source_times = source_times or {}
    schools = parse_schools(school_bytes)
    games = parse_results(archive_bytes.decode('utf-8'), schools)
    return {
        'schemaVersion': 1, 'fetchedAt': fetched_at,
        'coverage': {
            'schools': 'Schools listed in the UIL 2026–28 realignment document. This is not a directory of every Texas high school.',
            'programs': 'Football, basketball, and volleyball district listings; not verified varsity rosters or gender-specific participation.',
            'results': 'Only the 12 football championship finals in each of 2025–26 and 2024–25. Regular-season games and live scores are not included.',
            'ratings': 'Unavailable. Championship-only results are insufficient for statewide power ratings, full-season records, or predictions.',
        },
        'sources': [
            {'id':'uil-alignment-2026', 'publisher':'University Interscholastic League',
             'title':'2026–28 Realignment Alphabetical Listing', 'url':SCHOOL_URL,
             'fetchedAt':source_times.get('uil-alignment-2026', fetched_at), 'sha256':hashlib.sha256(school_bytes).hexdigest(),
             'period':'2026–2028', 'kind':'school-directory'},
            {'id':'uil-football-archives', 'publisher':'University Interscholastic League',
             'title':'Football State Archives', 'url':RESULTS_URL,
             'fetchedAt':source_times.get('uil-football-archives', fetched_at), 'sha256':hashlib.sha256(archive_bytes).hexdigest(),
             'period':'2025–26 and 2024–25 championship finals', 'kind':'historical-results'},
        ],
        'schools': schools, 'games': games,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--cache-dir', type=Path, default=ROOT/'.cache/official')
    ap.add_argument('--offline', action='store_true', help='Use previously downloaded source documents')
    ap.add_argument('--output', type=Path, default=ROOT/'dist/data/official.json')
    args = ap.parse_args(); args.cache_dir.mkdir(parents=True, exist_ok=True)
    def get(url, filename):
        path = args.cache_dir/filename
        if not args.offline:
            request = Request(url, headers={'User-Agent':'TexasHighSchoolSports/0.2 (+public UIL facts; manual refresh)'})
            with urlopen(request, timeout=60) as response: raw = response.read()
            path.write_bytes(raw)
        return path.read_bytes()
    school_bytes = get(SCHOOL_URL, 'uil-schools-2026.pdf')
    archive_bytes = get(RESULTS_URL, 'football-archives.html')
    source_times = {key: datetime.fromtimestamp((args.cache_dir/name).stat().st_mtime, timezone.utc).isoformat() for key, name in [('uil-alignment-2026','uil-schools-2026.pdf'), ('uil-football-archives','football-archives.html')]}
    result = build(school_bytes, archive_bytes, max(source_times.values()), source_times)
    # Validate completely before replacing the previous good public snapshot.
    args.output.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.output.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')
    tmp.replace(args.output)
    counts = {sport:sum(sport in s['districts'] for s in result['schools']) for sport in ['football','basketball','volleyball']}
    print(json.dumps({'schools':len(result['schools']),'programs':counts,'finals':len(result['games']),'output':str(args.output)}))

if __name__ == '__main__': main()
