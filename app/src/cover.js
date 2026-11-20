// Draws the multi-panel poster cover: photos in framed panels, a Vice City sunset grade, silhouetted
// palms and skyline, and bold caption lettering. All art is drawn with canvas primitives — no
// borrowed artwork, no Rockstar logo or font. `state` carries the layout, the photos, each panel's
// crop, the caption and the grade strengths; the cover is drawn at the canvas's own size.

export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 0.58, photo: 0 },
      { x: 0.62, y: 0, w: 0.38, h: 0.58, photo: 1 },
      { x: 0, y: 0.58, w: 0.38, h: 0.42, photo: 2 },
      { x: 0.38, y: 0.58, w: 0.62, h: 0.42, photo: 0 },
    ],
  },
  'hero-split': {
    label: 'Hero Split',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1, photo: 0 },
      { x: 0.58, y: 0, w: 0.42, h: 0.5, photo: 1 },
      { x: 0.58, y: 0.5, w: 0.42, h: 0.5, photo: 2 },
    ],
  },
  triptych: {
    label: 'Triptych',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1, photo: 0 },
      { x: 0.34, y: 0, w: 0.33, h: 1, photo: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1, photo: 2 },
    ],
  },
};

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

/** The caption band's share of the cover height; the panels fill the rest above it. */
export const CAPTION_FRACTION = 0.24;

/**
 * The pixel rectangle of one layout panel on a `w` x `h` cover, inside the
 * panels area above the caption band. The preview's click and drag mapping
 * uses the same rectangles, so the panel you click is the panel you move.
 */
export function panelRectFor(w, h, layout, index) {
  const panel = layout.panels[index];
  const panelsH = h * (1 - CAPTION_FRACTION);
  const gap = Math.max(4, Math.round(w * 0.008));
  return {
    x: Math.round(panel.x * w) + gap,
    y: Math.round(panel.y * panelsH) + gap,
    w: Math.round(panel.w * w) - gap * 2,
    h: Math.round(panel.h * panelsH) - gap * 2,
  };
}

/** A fresh default state: no photos yet, every panel at 1x zoom, centred. */
export function defaultState() {
  return {
    layout: 'vice-grid',
    size: '1080x1080',
    photos: [null, null, null],
    panels: [
      { photo: 0, zoom: 1, x: 0, y: 0 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
      { photo: 2, zoom: 1, x: 0, y: 0 },
      { photo: 0, zoom: 1, x: 0, y: 0 },
    ],
    title: 'Sunset Heist',
    kicker: 'VICE SUNSET',
    subtitle: 'One last score before sunrise',
    grade: 0.8,
    neon: 0.6,
  };
}

/** Draws `img` to fill `rect`, cover-fit, scaled by `zoom` and shifted by `pan` (-0.5..0.5). */
function drawPhoto(ctx, img, rect, zoom, panX, panY) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) / 2 + panX * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + panY * rect.h;
  ctx.save();
  ctx.filter = 'contrast(1.18) saturate(1.32) brightness(1.03)';
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** One halftone dot tile, built lazily and reused for every panel. */
let halftoneTileCache = null;
function halftoneTile() {
  if (halftoneTileCache) return halftoneTileCache;
  const tile = document.createElement('canvas');
  tile.width = 10;
  tile.height = 10;
  const t = tile.getContext('2d');
  t.fillStyle = 'rgba(24, 6, 32, 0.9)';
  t.beginPath();
  t.arc(5, 5, 2.1, 0, Math.PI * 2);
  t.fill();
  halftoneTileCache = tile;
  return tile;
}

/** Placeholder panel when no photo is loaded yet: a sunset gradient with a sun disc. */
function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#ff9a3d');
  g.addColorStop(0.55, '#ff2e88');
  g.addColorStop(1, '#5b2a86');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.78);
}

/**
 * The comic treatment over one panel: a halftone dot screen, a warm sunset
 * wash, a soft-light sun glow and a vignette, so a plain photo reads as
 * printed poster art instead of a flat snapshot.
 */
function gradePanel(ctx, rect, strength) {
  if (strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.16 * strength;
  ctx.fillStyle = ctx.createPattern(halftoneTile(), 'repeat');
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.25, rect.y + rect.h);
  wash.addColorStop(0, `rgba(255, 122, 24, ${0.22 * strength})`);
  wash.addColorStop(0.6, `rgba(255, 46, 136, ${0.10 * strength})`);
  wash.addColorStop(1, `rgba(123, 47, 247, ${0.28 * strength})`);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const glow = ctx.createRadialGradient(
    rect.x + rect.w * 0.7, rect.y + rect.h * 0.25, 0,
    rect.x + rect.w * 0.7, rect.y + rect.h * 0.25, Math.max(rect.w, rect.h) * 0.7,
  );
  glow.addColorStop(0, `rgba(255, 200, 90, ${0.55 * strength})`);
  glow.addColorStop(1, 'rgba(255, 200, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10, 4, 18, 0)');
  vig.addColorStop(1, `rgba(10, 4, 18, ${0.30 * strength})`);
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** A palm silhouette: curved trunk and seven fronds, drawn from paths. */
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -52, 22, -88);
  ctx.stroke();
  // Seven fronds fanning from -15° to -165° (up and out), each drooping at its tip.
  for (let i = 0; i < 7; i++) {
    const a = (-15 - i * 25) * Math.PI / 180;
    const tipX = 22 + Math.cos(a) * 56;
    const tipY = -88 + Math.sin(a) * 30 + 26;
    const ctrlX = 22 + Math.cos(a) * 32;
    const ctrlY = -88 + Math.sin(a) * 46;
    ctx.beginPath();
    ctx.moveTo(22, -88);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A skyline silhouette with a few lit windows, filling the strip
 * `top`..`top + stripH` (defaults to a band along the cover's foot).
 */
function drawSkyline(ctx, w, h, color, top = h * 0.88, stripH = h * 0.12) {
  const base = top + stripH;
  const heights = [0.35, 0.6, 0.42, 0.85, 0.5, 0.7, 0.38, 0.55, 0.95, 0.45, 0.62, 0.36];
  const bw = w / heights.length;
  ctx.fillStyle = color;
  heights.forEach((hh, i) => {
    const bh = stripH * hh;
    ctx.fillRect(i * bw + 2, base - bh, bw - 4, bh);
    if (i % 3 === 0) {
      const cap = Math.max(2, stripH * 0.12);
      ctx.fillRect(i * bw + bw / 2 - 3, base - bh - cap, 6, cap);
    }
  });
  ctx.fillStyle = 'rgba(255, 214, 120, 0.85)';
  for (let i = 0; i < 26; i++) {
    const wx = ((i * 137) % 100) / 100 * w;
    const wy = base - ((i * 53) % 70) / 100 * stripH * 0.7 - 3;
    ctx.fillRect(wx, wy, 3, 4);
  }
}

/** Fits `text` in Anton capitals across `maxWidth`, returns the font size used. */
function fitTitle(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 20) {
    size -= 4;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

/**
 * Draws the caption band across the foot of the cover: a sunset gradient,
 * one palm framing the right edge, and a thin skyline strip along the very
 * bottom — all behind the lettering, on a clean field, so no building ever
 * cuts through the title or the subtitle.
 */
function drawCaptionBand(ctx, w, h, state) {
  const bandTop = h * (1 - CAPTION_FRACTION);
  const bandH = h * CAPTION_FRACTION;
  const pad = w * 0.045;

  const sky = ctx.createLinearGradient(0, bandTop, 0, h);
  sky.addColorStop(0, '#7b2ff7');
  sky.addColorStop(0.45, '#ff2e88');
  sky.addColorStop(0.8, '#ff7a18');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, bandTop, w, bandH);

  // A thin skyline strip along the very bottom edge, under the lettering.
  drawSkyline(ctx, w, h, 'rgba(16, 6, 28, 0.95)', h - h * 0.03, h * 0.03);
  // One palm framing the right edge, behind the lettering.
  drawPalm(ctx, w * 0.965, h * 0.995, bandH / 160, 'rgba(16, 6, 28, 0.9)');
  // Hairline keyline where the panels meet the band.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(0, bandTop, w, Math.max(2, h * 0.002));

  const kicker = state.kicker.trim().toUpperCase();
  if (kicker) {
    const ky = bandTop + bandH * 0.2;
    ctx.font = `800 ${Math.round(h * 0.026)}px Inter, sans-serif`;
    ctx.fillStyle = '#ffd76a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const spaced = kicker.split('').join('  ');
    ctx.fillText(spaced, pad, ky);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(pad, ky + h * 0.012, w * 0.1, Math.max(3, h * 0.004));
  }

  const title = state.title.trim().toUpperCase();
  if (title) {
    const size = fitTitle(ctx, title, w - pad * 2, h * 0.105);
    const ty = bandTop + bandH * 0.66;
    const grad = ctx.createLinearGradient(0, ty - size, 0, ty);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.45, '#ffb347');
    grad.addColorStop(1, '#ff2e88');
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.85)';
    ctx.shadowBlur = h * 0.012 * state.neon + 2;
    // A dark drop copy first, so the letters lift off the sunset behind them.
    ctx.fillStyle = '#2a0a3e';
    ctx.fillText(title, pad + size * 0.02, ty + size * 0.035);
    ctx.strokeStyle = '#1c0b2e';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, pad, ty);
    ctx.restore();
  }

  const sub = state.subtitle.trim();
  if (sub) {
    ctx.font = `600 ${Math.round(h * 0.024)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(sub, pad, bandTop + bandH * 0.86);
  }
}

/**
 * Draws the whole cover onto `canvas` at its own size, from `state`.
 * The panels fill the top of the poster on crisp white gutters; the caption
 * band carries the lettering on its own clean sunset field below them.
 * `selected` (panel index or -1) draws a highlight ring around that panel in the preview.
 */
export function drawCover(canvas, state, selected = -1) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['vice-grid'];
  const gap = Math.max(4, Math.round(w * 0.008));

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((p, i) => {
    const rect = panelRectFor(w, h, layout, i);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const slot = state.panels[i] ?? { photo: p.photo, zoom: 1, x: 0, y: 0 };
    const img = state.photos[slot.photo];
    if (img) drawPhoto(ctx, img, rect, slot.zoom, slot.x, slot.y);
    else drawEmptyPanel(ctx, rect);
    gradePanel(ctx, rect, state.grade);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 6, 28, 0.9)';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    if (i === selected) {
      ctx.save();
      ctx.strokeStyle = '#ff2e88';
      ctx.lineWidth = Math.max(4, w * 0.006);
      ctx.shadowColor = '#ff2e88';
      ctx.shadowBlur = 18;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  });

  drawCaptionBand(ctx, w, h, state);

  // Neon double frame around the whole poster.
  if (state.neon > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 46, 136, ${0.55 * state.neon})`;
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 22 * state.neon;
    ctx.strokeRect(gap / 2, gap / 2, w - gap, h - gap);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.5, w * 0.0012);
    ctx.shadowBlur = 0;
    const inset = Math.max(5, w * 0.006);
    ctx.strokeRect(gap / 2 + inset, gap / 2 + inset, w - gap - inset * 2, h - gap - inset * 2);
    ctx.restore();
  }
}

/** Renders the cover at export size and returns the canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state, -1);
  return canvas;
}
