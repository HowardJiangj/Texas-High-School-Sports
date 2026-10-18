// Official data is the default. Demo fixtures only load after explicit selection.
const demo = new URLSearchParams(location.search).get('mode') === 'demo';
try {
  if (demo) {
    await import('./demo-app.js');
  } else {
    const { startOfficialApp } = await import('./official-app.js');
    const response = await fetch(new URL('../data/official.json', import.meta.url));
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);
    await startOfficialApp(await response.json());
  }
} catch (error) {
  console.error('Unable to start the application:', error);
  const content = document.querySelector('#content');
  content.replaceChildren();
  const panel = document.createElement('section'); panel.className = 'empty';
  const heading = document.createElement('h2'); heading.textContent = 'Data could not be loaded';
  const text = document.createElement('p'); text.textContent = 'Reload to try again. Official records have not been replaced with simulated data.';
  const reload = document.createElement('button'); reload.className = 'primary-button'; reload.textContent = 'Reload page'; reload.onclick = () => location.reload();
  panel.append(heading, text, reload); content.append(panel);
}
