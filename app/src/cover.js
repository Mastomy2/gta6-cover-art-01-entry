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
  ctx.drawImage(img, dx, dy, pw, ph);
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

/** The sunset grade over one panel: warm wash, pink at the foot, soft-light sun glow. */
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

/** A skyline silhouette with a few lit windows, along the bottom of the cover. */
function drawSkyline(ctx, w, h, color) {
  const base = h * 0.94;
  const heights = [0.05, 0.09, 0.06, 0.12, 0.07, 0.10, 0.05, 0.08, 0.13, 0.06, 0.09, 0.05];
  const bw = w / heights.length;
  ctx.fillStyle = color;
  heights.forEach((hh, i) => {
    const bh = h * hh;
    ctx.fillRect(i * bw + 2, base - bh, bw - 4, bh + h * 0.06);
    if (i % 3 === 0) ctx.fillRect(i * bw + bw / 2 - 3, base - bh - h * 0.02, 6, h * 0.02);
  });
  ctx.fillStyle = 'rgba(255, 214, 120, 0.85)';
  for (let i = 0; i < 26; i++) {
    const wx = ((i * 137) % 100) / 100 * w;
    const wy = base - ((i * 53) % 70) / 100 * h * 0.12 - 4;
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

/** Draws the caption block: kicker, gradient title with outline, subtitle. */
function drawCaption(ctx, w, h, state) {
  const pad = w * 0.045;
  const bottom = h * 0.965;
  const scrim = ctx.createLinearGradient(0, h * 0.6, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  const kicker = state.kicker.trim().toUpperCase();
  if (kicker) {
    ctx.font = `800 ${Math.round(h * 0.028)}px Inter, sans-serif`;
    ctx.fillStyle = '#ffd76a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const spaced = kicker.split('').join('  ');
    ctx.fillText(spaced, pad, bottom - h * 0.155);
  }

  const title = state.title.trim().toUpperCase();
  if (title) {
    const size = fitTitle(ctx, title, w - pad * 2, h * 0.115);
    const ty = bottom - h * 0.035;
    const grad = ctx.createLinearGradient(0, ty - size, 0, ty);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.45, '#ffb347');
    grad.addColorStop(1, '#ff2e88');
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
    ctx.font = `600 ${Math.round(h * 0.024)}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'left';
    ctx.fillText(sub, pad, bottom + h * 0.012);
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
  const gap = Math.max(4, Math.round(w * 0.008));

  ctx.fillStyle = '#f8f2fa';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((p, i) => {
    const rect = {
      x: Math.round(p.x * w) + gap,
      y: Math.round(p.y * h) + gap,
      w: Math.round(p.w * w) - gap * 2,
      h: Math.round(p.h * h) - gap * 2,
    };
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

  // Neon frame around the whole poster.
  if (state.neon > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 46, 136, ${0.55 * state.neon})`;
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 22 * state.neon;
    ctx.strokeRect(gap / 2, gap / 2, w - gap, h - gap);
    ctx.restore();
  }

  drawSkyline(ctx, w, h, 'rgba(16, 6, 28, 0.92)');
  drawPalm(ctx, w * 0.06, h * 0.99, h / 900, 'rgba(16, 6, 28, 0.95)');
  drawCaption(ctx, w, h, state);
}

/** Renders the cover at export size and returns the canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state, -1);
  return canvas;
}
