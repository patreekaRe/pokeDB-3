/* gif-frames.js  -  a GIF split into whole frames in plain JS, for browsers without ImageDecoder (iPhone Safari): WebGL
   plays no GIFs, so the ?3d pilot (js/base-3d.js) needs every frame as a canvas, with its delay. Handles local colour
   tables, transparency, interlacing and the three disposal methods the Gen 5 sprites use. */

function lzw(min, data, count) {
  const out = new Uint8Array(count), clear = 1 << min, eoi = clear + 1;
  const prefix = new Int16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) suffix[i] = i;
  let size = min + 1, next = eoi + 1, old = -1, first = 0, cur = 0, bits = 0, op = 0, i = 0;
  while (op < count) {
    while (bits < size && i < data.length) { cur |= data[i++] << bits; bits += 8; }
    if (bits < size) break;
    let code = cur & ((1 << size) - 1);
    cur >>>= size; bits -= size;
    if (code === clear) { size = min + 1; next = eoi + 1; old = -1; continue; }
    if (code === eoi) break;
    if (old < 0) { out[op++] = first = suffix[code]; old = code; continue; }
    const read = code;
    let sp = 0;
    if (code >= next) { stack[sp++] = first; code = old; }
    while (code > eoi) { stack[sp++] = suffix[code]; code = prefix[code]; }
    first = suffix[code];
    stack[sp++] = first;
    while (sp && op < count) out[op++] = stack[--sp];
    if (next < 4096) {
      prefix[next] = old; suffix[next] = first; next++;
      if (next === 1 << size && size < 12) size++;
    }
    old = read;
  }
  return out;
}

/** Every frame of the GIF at `buf` (an ArrayBuffer) as `{ bmp: canvas, ms }`, composed as a browser would show it. */
export function decodeGif(buf) {
  const b = new Uint8Array(buf);
  let p = 6;
  const u16 = () => { const v = b[p] | (b[p + 1] << 8); p += 2; return v; };
  const W = u16(), H = u16(), packed = b[p]; p += 3;
  const table = (n) => { const t = b.subarray(p, p + n * 3); p += n * 3; return t; };
  const global = packed & 0x80 ? table(1 << ((packed & 7) + 1)) : null;
  const subBlocks = () => {
    const parts = [];
    let len = 0;
    for (let n = b[p++]; n; n = b[p++]) { parts.push(b.subarray(p, p + n)); len += n; p += n; }
    const all = new Uint8Array(len);
    let o = 0;
    for (const s of parts) { all.set(s, o); o += s.length; }
    return all;
  };

  const screen = new Uint8ClampedArray(W * H * 4), frames = [];
  let gce = { dispose: 0, delay: 0, trans: -1 }, undo = null;
  while (p < b.length) {
    const kind = b[p++];
    if (kind === 0x3b) break;
    if (kind === 0x21) {
      const label = b[p++];
      if (label === 0xf9) {
        const f = b[p + 1];
        gce = { dispose: (f >> 2) & 7, delay: b[p + 2] | (b[p + 3] << 8), trans: f & 1 ? b[p + 4] : -1 };
        p += 6;
      } else subBlocks();
      continue;
    }
    if (kind !== 0x2c) break;
    const x = u16(), y = u16(), w = u16(), h = u16(), f = b[p++];
    const colours = f & 0x80 ? table(1 << ((f & 7) + 1)) : global;
    const min = b[p++], pixels = lzw(min, subBlocks(), w * h);
    const keep = gce.dispose === 3 ? screen.slice() : null;
    const rows = [];
    if (f & 0x40) for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let r = start; r < h; r += step) rows.push(r);
    else for (let r = 0; r < h; r++) rows.push(r);
    rows.forEach((row, n) => {
      const sy = y + row;
      if (sy >= H) return;
      for (let c = 0; c < w; c++) {
        const sx = x + c, ix = pixels[n * w + c];
        if (sx >= W || ix === gce.trans) continue;
        const o = (sy * W + sx) * 4;
        screen[o] = colours[ix * 3]; screen[o + 1] = colours[ix * 3 + 1]; screen[o + 2] = colours[ix * 3 + 2]; screen[o + 3] = 255;
      }
    });
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.getContext('2d').putImageData(new ImageData(screen.slice(), W, H), 0, 0);
    const ms = gce.delay * 10;
    frames.push({ bmp: c, ms: ms < 20 ? 100 : ms });
    if (gce.dispose === 2) for (let r = y; r < Math.min(H, y + h); r++) screen.fill(0, (r * W + x) * 4, (r * W + Math.min(W, x + w)) * 4);
    if (keep) screen.set(keep);
    gce = { dispose: 0, delay: 0, trans: -1 };
  }
  return frames;
}
