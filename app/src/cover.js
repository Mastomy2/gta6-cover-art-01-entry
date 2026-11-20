// Draws the multi-panel poster cover: photos in framed panels, a Vice City sunset grade, silhouetted
// palms and skyline, and bold caption lettering. All art is drawn with canvas primitives — no
// borrowed artwork, no Rockstar logo or font. `state` carries the layout, the photos, each panel's
// crop, the caption and the grade strengths; the cover is drawn at the canvas's own size.
//
// Poster layout: the panels fill the top 76% of the cover, and the bottom 24% is a dedicated
// sunset caption band (kicker, big gradient title, subtitle) with a thin skyline strip along the
// very bottom edge and one palm silhouette at the right edge, behind the text. Panels are
// separated by a white comic gutter and a dark keyline, and the whole poster wears a double
// neon frame: a pink glow with a white line inside it.

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

/** Share of the cover height the panels occupy; the rest is the caption band. */
export const PANEL_AREA = 0.76;

/** The white comic gutter between panels, in canvas pixels. */
export function panelGap(w) {
  return Math.max(4, Math.round(w * 0.008));
}

/** The on-canvas rectangle of panel `i` of `layout` (a layout object from LAYOUTS). */
export function panelRectFor(layout, w, h, i, gap) {
  const p = layout.panels[i];
  const areaH = h * PANEL_AREA;
  return {
    x: Math.round(p.x * w) + gap,
    y: Math.round(p.y * areaH) + gap,
    w: Math.round(p.w * w) - gap * 2,
    h: Math.round(p.h * areaH) - gap * 2,
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

/** A 10px tile with one dark print dot, cached; tiled over a panel for a halftone print feel. */
let halftoneTile = null;
function halftonePattern(ctx) {
  if (!halftoneTile) {
    halftoneTile = document.createElement('canvas');
    halftoneTile.width = 10;
    halftoneTile.height = 10;
    const t = halftoneTile.getContext('2d');
    t.fillStyle = '#14061f';
    t.beginPath();
    t.arc(5, 5, 2.0, 0, Math.PI * 2);
    t.fill();
  }
  return ctx.createPattern(halftoneTile, 'repeat');
}

/** The sunset grade over one panel: warm wash, pink at the foot, soft-light sun glow,
 *  a duotone wash, a halftone print dot and a vignette — the comic-poster treatment. */
function gradePanel(ctx, rect, strength) {
  if (strength <= 0) return;
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
  // Duotone wash: warm orange from the top, violet from the foot, blended over the photo.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const duo = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  duo.addColorStop(0, `rgba(255, 122, 24, ${0.12 * strength})`);
  duo.addColorStop(1, `rgba(123, 47, 247, ${0.16 * strength})`);
  ctx.fillStyle = duo;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Halftone print dots, faint, multiplied over the panel.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = halftonePattern(ctx);
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Vignette: the panel's edges fall off into the dark.
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

/** A skyline silhouette with a few lit windows, inside the strip (x, y, w, h). */
function drawSkyline(ctx, x, y, w, h, color) {
  const base = y + h;
  const heights = [0.5, 0.8, 0.6, 1, 0.7, 0.9, 0.5, 0.75, 1, 0.6, 0.85, 0.55];
  const bw = w / heights.length;
  ctx.fillStyle = color;
  heights.forEach((hh, i) => {
    const bh = h * hh;
    ctx.fillRect(x + i * bw + 1, base - bh, bw - 2, bh);
    if (i % 3 === 0) ctx.fillRect(x + i * bw + bw / 2 - 1, base - bh - h * 0.25, 2, h * 0.25);
  });
  ctx.fillStyle = 'rgba(255, 214, 120, 0.9)';
  for (let i = 0; i < 26; i++) {
    const wx = x + ((i * 137) % 100) / 100 * w;
    const wy = base - ((i * 53) % 70) / 100 * h - 2;
    ctx.fillRect(wx, wy, 2, 3);
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

/** Draws the caption band: its own sunset gradient, a gold divider, the thin skyline strip
 *  along the bottom edge, one palm at the right edge behind the text, then kicker with a gold
 *  bar, gradient title with dark outline and offset shadow, and subtitle. */
function drawCaption(ctx, w, h, state) {
  const bandTop = h * PANEL_AREA;
  const bandH = h - bandTop;
  const pad = w * 0.045;

  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, '#5b2a86');
  band.addColorStop(0.45, '#ff2e88');
  band.addColorStop(1, '#ff7a18');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, bandH);

  // Gold divider between the panels and the band.
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(0, bandTop, w, Math.max(2, h * 0.003));

  // Thin skyline strip along the very bottom edge, and one palm at the right edge.
  const stripH = h * 0.03;
  drawSkyline(ctx, 0, h - stripH, w, stripH, 'rgba(16, 6, 28, 0.95)');
  drawPalm(ctx, w * 0.94, h * 0.995, h / 800, 'rgba(16, 6, 28, 0.9)');

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const kicker = state.kicker.trim().toUpperCase();
  if (kicker) {
    const kSize = Math.round(h * 0.028);
    const kY = bandTop + bandH * 0.22;
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(pad, kY - kSize - h * 0.02, w * 0.055, Math.max(3, h * 0.006));
    ctx.font = `800 ${kSize}px Inter, sans-serif`;
    ctx.fillText(kicker.split('').join('  '), pad, kY);
  }

  const title = state.title.trim().toUpperCase();
  if (title) {
    const maxWidth = Math.min(w - pad * 2, w * 0.88);
    const size = fitTitle(ctx, title, maxWidth, h * 0.11);
    const ty = bandTop + bandH * 0.64;
    const grad = ctx.createLinearGradient(0, ty - size, 0, ty);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.45, '#ffb347');
    grad.addColorStop(1, '#ff2e88');
    // Offset dark shadow, lifting the title off the band.
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.fillStyle = '#1c0b2e';
    ctx.fillText(title, pad + size * 0.04, ty + size * 0.055);
    ctx.save();
    ctx.shadowColor = 'rgba(255, 46, 136, 0.85)';
    ctx.shadowBlur = h * 0.012 * state.neon + 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1c0b2e';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, pad, ty);
    ctx.restore();
  }

  const sub = state.subtitle.trim();
  if (sub) {
    ctx.save();
    ctx.font = `600 ${Math.round(h * 0.024)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(20, 6, 31, 0.65)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillText(sub, pad, bandTop + bandH * 0.84);
    ctx.restore();
  }
}

/**
 * Draws the whole cover onto `canvas` at its own size, from `state`.
 * `selected` (panel index or -1) draws a highlight ring around that panel in the preview.
 */
export function drawCover(canvas, state, selected = -1) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS['vice-grid'];
  const gap = panelGap(w);

  // White comic gutter behind the panels.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((p, i) => {
    const rect = panelRectFor(layout, w, h, i, gap);
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
    // Dark keyline around every panel.
    ctx.save();
    ctx.strokeStyle = '#14061f';
    ctx.lineWidth = Math.max(2, w * 0.003);
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

  drawCaption(ctx, w, h, state);

  // Double neon frame around the whole poster: pink glow, then a white line inside it.
  if (state.neon > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 46, 136, ${0.55 * state.neon})`;
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 22 * state.neon;
    ctx.strokeRect(gap / 2, gap / 2, w - gap, h - gap);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * state.neon})`;
    ctx.lineWidth = Math.max(2, w * 0.002);
    const inset = gap / 2 + Math.max(3, w * 0.004) + Math.max(2, w * 0.002);
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
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
