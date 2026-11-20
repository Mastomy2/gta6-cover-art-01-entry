// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone at export size. window.__shotReady is set once painted.
//
// Scene knobs, all read from the query string:
//   layout=vice-grid|hero-split|triptych   caption=...  kicker=...  subtitle=...
//   photos=0,1,0,1        one photo slot per panel (0, 1 or 2)
//   zoom=1.05,1.25,1.1,1.2   one zoom per panel, in panel order
//   pan=0,0.25;0,0.05;0,0.3;0,0.3   one "x,y" pair per panel, ";" separated
//   size=1080x1080|1080x1350|1920x1080 — or any WxH for the cover scene
import { SIZES, LAYOUTS } from './cover.js';

/** Mirrors the live state into the editor controls so a screenshot shows them in sync
 *  with the preview (layout pressed, size selected, caption fields, grade and the
 *  selected panel's zoom, pan and photo). */
function syncEditorControls(state) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['vice-grid'];
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.textContent === layout.label));
  });
  document.getElementById('size').value = state.size;
  document.getElementById('kicker').value = state.kicker;
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('grade').value = String(state.grade);
  document.getElementById('neon').value = String(state.neon);
  const slot = state.panels[0] ?? { photo: 0, zoom: 1, x: 0, y: 0 };
  document.getElementById('zoom').value = String(slot.zoom);
  document.getElementById('panX').value = String(slot.x);
  document.getElementById('panY').value = String(slot.y);
  document.getElementById('panelPhoto').value = String(slot.photo);
  document.getElementById('panelHint').textContent =
    `Panel 1 of ${layout.panels.length} (${layout.label}) — drag it in the preview to move its photo.`;
}

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

  // Per-panel framing from the query: photos, zooms and pans, each in panel order.
  const photos = query.get('photos') ? query.get('photos').split(',').map(Number) : [];
  const zooms = query.get('zoom') ? query.get('zoom').split(',').map(Number) : [];
  const pans = query.get('pan') ? query.get('pan').split(';').map((pair) => pair.split(',').map(Number)) : [];
  const defaultZooms = [1.15, 1.25, 1.1, 1.2];
  state.panels.forEach((slot, i) => {
    if (Number.isFinite(photos[i]) && photos[i] >= 0 && photos[i] <= 2) slot.photo = photos[i];
    slot.zoom = Number.isFinite(zooms[i]) ? zooms[i] : (defaultZooms[i] ?? 1.1);
    const pan = pans[i] ?? [];
    slot.x = Number.isFinite(pan[0]) ? pan[0] : 0;
    slot.y = Number.isFinite(pan[1]) ? pan[1] : 0;
  });

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const sizeKey = query.get('size') ?? '1080x1080';
    const custom = /^(\d+)x(\d+)$/.exec(sizeKey);
    const [w, h] = custom ? [Number(custom[1]), Number(custom[2])] : (SIZES[sizeKey] ?? SIZES['1080x1080']);
    const canvas = document.getElementById('cover');
    canvas.width = w;
    canvas.height = h;
    if (SIZES[sizeKey]) state.size = sizeKey;
  } else if (shot === 'editor') {
    const sizeKey = query.get('size');
    if (sizeKey && SIZES[sizeKey]) {
      const [w, h] = SIZES[sizeKey];
      const canvas = document.getElementById('cover');
      canvas.width = w;
      canvas.height = h;
      state.size = sizeKey;
    }
    syncEditorControls(state);
  }
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
