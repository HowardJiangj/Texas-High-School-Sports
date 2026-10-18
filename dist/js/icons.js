const paths = {
  overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  rankings:'<path d="M8 21V11H3v10m13 0V3h-5v18m13 0V8h-5v13"/>',
  games:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h2m3 0h2"/>',
  teams:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3a4 4 0 0 1 0 8"/>',
  news:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 8h10M7 12h4m-4 4h10m-3-4h3"/>',
  favorites:'<path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.6l6.3-.9Z"/>',
  football:'<path d="M20.7 3.3C23 12 12 23 3.3 20.7 1 12 12 1 20.7 3.3Z"/><path d="m8 16 8-8m-8 3 5 5m-2-8 5 5M4 16l4 4M16 4l4 4"/>',
  basketball:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.5 5.5c7 2 6 11 13 13m0-13c-7 2-6 11-13 13"/>',
  volleyball:'<circle cx="12" cy="12" r="9"/><path d="m12 12 8-5m-8 5V3m0 9-8 5M7 4c-2 6 0 10 5 13m9-6c-5-4-10-4-14-2m4 12c4-3 6-7 6-12"/>',
  soccer:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0 0V3m5 8 4-2m-6 8 3 3m-9-3-3 3m1-9L3 9"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
};
export const icon=(name,size=19)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.overview}</svg>`;
