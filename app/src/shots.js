// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone at export size. window.__shotReady is set once painted.
import { SIZES, LAYOUTS } from './cover.js';

export async function runShot(shot, query, state, loadImage, redraw) {
  const photoA = query.get('photo') ?? 'boulevard';
  const photoB = query.get('photo2') ?? 'pier';
  const [a, b] = await Promise.all([
    loadImage(`samples/${photoA}.jpg`),
    loadImage(`samples/${photoB}.jpg`),
  ]);
  state.photos[0] = a;
  state.photos[1] = b;
  state.photos[2] = a;
  document.getElementById('thumb0').src = `samples/${photoA}.jpg`;
  document.getElementById('thumb1').src = `samples/${photoB}.jpg`;
  document.getElementById('thumb2').src = `samples/${photoA}.jpg`;
  state.title = query.get('caption') ?? 'Boulevard Queen';
  state.kicker = query.get('kicker') ?? 'VICE SUNSET';
  state.subtitle = query.get('subtitle') ?? 'One last score before sunrise';
  state.layout = query.get('layout') ?? 'vice-grid';
  state.panels[0].zoom = 1.15;
  state.panels[1].zoom = 1.25;
  state.panels[2].zoom = 1.1;
  state.panels[3].zoom = 1.2;
  // Per-panel zoom as `?zoom=z0,z1,...` to frame the shot scene.
  const zooms = (query.get('zoom') ?? '').split(',');
  state.panels.forEach((slot, i) => {
    const z = Number(zooms[i]);
    if (Number.isFinite(z) && z > 0) slot.zoom = z;
  });
  // Per-panel pan as `?pan=x0,y0;x1,y1;...` to frame faces in the shot scene.
  const pans = (query.get('pan') ?? '').split(';');
  state.panels.forEach((slot, i) => {
    const [px, py] = (pans[i] ?? '0,0').split(',').map(Number);
    if (Number.isFinite(px)) slot.x = px;
    if (Number.isFinite(py)) slot.y = py;
  });
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const sizeKey = query.get('size') ?? '1080x1080';
    const [w, h] = SIZES[sizeKey] ?? SIZES['1080x1080'];
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    state.size = sizeKey;
  }
  // Keep the editor's controls in step with the scene: layout buttons, size
  // picker and caption fields, so the editor screenshot shows the same cover.
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.textContent === (LAYOUTS[state.layout]?.label ?? '')));
  });
  document.getElementById('size').value = state.size;
  document.getElementById('kicker').value = state.kicker;
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
