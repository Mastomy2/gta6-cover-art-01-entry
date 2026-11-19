// Wires the page: photo slots, layout and size pickers, panel crop controls, caption fields and
// export. Clicking a panel in the preview selects it; dragging pans its photo. A `?shot=` query
// sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCover, defaultState, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
let selected = 0;

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg'];

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state, selected);
}

function syncPanelControls() {
  const slot = state.panels[selected] ?? { photo: 0, zoom: 1, x: 0, y: 0 };
  document.getElementById('zoom').value = slot.zoom;
  document.getElementById('panX').value = slot.x;
  document.getElementById('panY').value = slot.y;
  document.getElementById('panelPhoto').value = String(slot.photo);
  const layout = LAYOUTS[state.layout];
  document.getElementById('panelHint').textContent =
    `Panel ${selected + 1} of ${layout.panels.length} (${layout.label}) — drag it in the preview to move its photo.`;
}

/** Builds the three photo-slot rows: thumbnail, file picker and sample button. */
function buildSlots() {
  const host = document.getElementById('slots');
  for (let i = 0; i < 3; i++) {
    const row = document.createElement('div');
    row.className = 'slot';
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.alt = `Photo ${i + 1}`;
    thumb.id = `thumb${i}`;
    const label = document.createElement('label');
    label.textContent = `Photo ${i + 1}`;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.photos[i] = await loadImage(URL.createObjectURL(file));
      thumb.src = URL.createObjectURL(file);
      status.textContent = `Photo ${i + 1} loaded.`;
      redraw();
    });
    label.appendChild(input);
    row.append(thumb, label);
    host.appendChild(row);
  }
}

/** Builds the layout picker buttons. */
function buildLayouts() {
  const host = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([key, layout]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = layout.label;
    b.setAttribute('aria-pressed', String(key === state.layout));
    b.addEventListener('click', () => {
      state.layout = key;
      selected = 0;
      host.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      syncPanelControls();
      redraw();
    });
    host.appendChild(b);
  });
}

/** Builds the per-panel photo selector. */
function buildPanelPhotoSelect() {
  const select = document.getElementById('panelPhoto');
  for (let i = 0; i < 3; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Photo ${i + 1}`;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    state.panels[selected].photo = Number(select.value);
    redraw();
  });
}

function bindControls() {
  document.getElementById('size').addEventListener('change', (e) => {
    state.size = e.target.value;
    const [w, h] = SIZES[state.size];
    canvas.width = w;
    canvas.height = h;
    redraw();
  });
  const bindRange = (id, key) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state[key] = Number(e.target.value);
      redraw();
    });
  };
  bindRange('grade', 'grade');
  bindRange('neon', 'neon');
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('panX').addEventListener('input', (e) => {
    state.panels[selected].x = Number(e.target.value);
    redraw();
  });
  document.getElementById('panY').addEventListener('input', (e) => {
    state.panels[selected].y = Number(e.target.value);
    redraw();
  });
  const bindText = (id, key) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      redraw();
    });
  };
  bindText('kicker', 'kicker');
  bindText('title', 'title');
  bindText('subtitle', 'subtitle');
  document.getElementById('fillAll').addEventListener('click', () => {
    state.panels.forEach((p) => { p.photo = 0; });
    syncPanelControls();
    redraw();
    status.textContent = 'Every panel now shows photo 1.';
  });
  document.getElementById('samplePhotos').addEventListener('click', async () => {
    await loadSamples();
    status.textContent = 'Sample photos loaded.';
  });
  document.getElementById('export').addEventListener('click', exportCover);
}

/** Loads the two bundled sample photos into slots 1 and 2. */
async function loadSamples() {
  const [a, b] = await Promise.all(SAMPLES.map((s) => loadImage(s)));
  state.photos[0] = a;
  state.photos[1] = b;
  document.getElementById('thumb0').src = SAMPLES[0];
  document.getElementById('thumb1').src = SAMPLES[1];
  redraw();
}

/** Exports the cover at the chosen post size as a PNG download. */
function exportCover() {
  const [w, h] = SIZES[state.size];
  const out = renderCover(state, w, h);
  out.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-sunset-${w}x${h}.png`;
  }, 'image/png');
}

/** Exposed for the screenshot driver: renders the export and returns a PNG data URL. */
window.__exportPNG = async (sizeKey) => {
  await document.fonts.ready;
  const [w, h] = SIZES[sizeKey] ?? SIZES[state.size];
  return renderCover(state, w, h).toDataURL('image/png');
};
/** Exposed for the screenshot driver: loads the samples into the state. */
window.__loadSamples = loadSamples;
/** The live state, for the screenshot driver to configure a scene. */
window.__coverState = state;

/** Picks the panel under a click on the preview canvas (canvas coordinates). */
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) / r.width;
  const y = (clientY - r.top) / r.height;
  const layout = LAYOUTS[state.layout];
  return layout.panels.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
}

function bindCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    selected = i;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    syncPanelControls();
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const slot = state.panels[selected];
    slot.x = Math.max(-0.5, Math.min(0.5, slot.x + (e.clientX - lastX) / r.width));
    slot.y = Math.max(-0.5, Math.min(0.5, slot.y + (e.clientY - lastY) / r.height));
    lastX = e.clientX;
    lastY = e.clientY;
    syncPanelControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
}

buildSlots();
buildLayouts();
buildPanelPhotoSelect();
bindControls();
bindCanvas();
syncPanelControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, loadImage, redraw);
} else {
  document.fonts.ready.then(redraw);
  redraw();
}
