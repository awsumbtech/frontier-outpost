/**
 * spriteGen.js
 *
 * Generates 32×32 pixel-art player sprite sheet textures at runtime using
 * Phaser's Graphics API. No external image assets required.
 *
 * Sheet layout: 3 columns × 4 rows (96×128 px total)
 *   Row 0 (y=  0): DOWN  — frame 0=stand, 1=walk-L, 2=walk-R
 *   Row 1 (y= 32): LEFT  — frame 3=stand, 4=walk-L, 5=walk-R
 *   Row 2 (y= 64): RIGHT — frame 6=stand, 7=walk-L, 8=walk-R
 *   Row 3 (y= 96): UP    — frame 9=stand, 10=walk-L, 11=walk-R
 */

const FRAME_W = 32;
const FRAME_H = 32;
const COLS = 3;
const ROWS = 4;
const SHEET_W = FRAME_W * COLS; // 96
const SHEET_H = FRAME_H * ROWS; // 128

// ─── Class palettes ───────────────────────────────────────────────────────────

const PALETTES = {
  vanguard: {
    primary:   0x4a90d9, // blue
    secondary: 0xc0c0c0, // silver
    skin:      0xd4a57c,
    visor:     0x00d4ff,
  },
  recon: {
    primary:   0x2d8a6e, // teal
    secondary: 0x1a1a2e, // dark navy
    skin:      0xd4a57c,
    visor:     0x00ffcc,
  },
  engineer: {
    primary:   0xd4a030, // amber
    secondary: 0x8b6914, // brown
    skin:      0xd4a57c,
    visor:     0xffcc44,
  },
  medic: {
    primary:   0xe8e8e8, // white
    secondary: 0xcc0000, // red
    skin:      0xd4a57c,
    visor:     0xff6699,
  },
};

// ─── Shape templates per class ───────────────────────────────────────────────
//
// Each template describes proportions relative to a 32×32 frame.
// Values are pixel offsets from the top-left corner of the frame.
//
// shoulder_w: total shoulder width in pixels (centered on x=16)
// hip_w:      total hip/leg width (centered on x=16)
// torso_h:    torso height in pixels

const SHAPES = {
  vanguard: { shoulder_w: 18, hip_w: 14, torso_h: 14 }, // heavy/broad
  recon:    { shoulder_w: 12, hip_w:  8, torso_h: 12 }, // slim/agile
  engineer: { shoulder_w: 14, hip_w: 12, torso_h: 13 }, // medium + belt
  medic:    { shoulder_w: 14, hip_w: 12, torso_h: 13 }, // medium + cross
};

// ─── Drawing helpers ─────────────────────────────────────────────────────────

/**
 * Draw a single character frame into the graphics object.
 *
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} ox  Left edge of this frame in sheet pixels
 * @param {number} oy  Top edge of this frame in sheet pixels
 * @param {string} classId
 * @param {'down'|'left'|'right'|'up'} dir
 * @param {'stand'|'walk-l'|'walk-r'} anim
 */
function drawFrame(g, ox, oy, classId, dir, anim) {
  const pal = PALETTES[classId];
  const shape = SHAPES[classId];

  // ── Walk offsets ──────────────────────────────────────────────────────────
  // Legs shift left or right; arms mirror opposite to legs for natural gait.
  let legOffsetL = 0; // left-leg horizontal nudge from center
  let legOffsetR = 0; // right-leg horizontal nudge from center
  let armOffsetL = 0;
  let armOffsetR = 0;
  let bodyBob    = 0; // vertical bob for walk frames

  if (anim === "walk-l") {
    legOffsetL = -2;
    legOffsetR =  1;
    armOffsetL =  1;
    armOffsetR = -2;
    bodyBob    =  1;
  } else if (anim === "walk-r") {
    legOffsetL =  1;
    legOffsetR = -2;
    armOffsetL = -2;
    armOffsetR =  1;
    bodyBob    =  1;
  }

  // ── Layout constants ──────────────────────────────────────────────────────
  const cx  = ox + 16;               // frame horizontal center
  const sw  = shape.shoulder_w;
  const hw  = shape.hip_w;
  const th  = shape.torso_h;

  // Head region:  y 2..9  (8 px tall, centered)
  const headY    = oy + 2 + bodyBob;
  const headSize = 8;
  const headX    = cx - headSize / 2;

  // Torso region: y 10..(10+th)
  const torsoY   = oy + 10 + bodyBob;
  const torsoX   = cx - sw / 2;

  // Leg region:   below torso
  const legW     = 4;
  const legH     = 7;
  const legTopY  = torsoY + th;
  const legLeftX = cx - hw / 2;       // left leg left edge (before offset)
  const legRightX= cx + hw / 2 - legW; // right leg left edge (before offset)

  // Arms alongside torso
  const armW     = 3;
  const armH     = th - 2;
  const armTopY  = torsoY + 1;
  const armLeftX = torsoX - armW;     // outside left shoulder
  const armRightX= torsoX + sw;       // outside right shoulder

  // ── Clamp helper — keep draws inside the frame ───────────────────────────
  // (Phaser Graphics won't error, but clamping prevents bleeding into adjacent
  // frames on the sheet.)
  const clampX = (x) => Math.max(ox, Math.min(ox + FRAME_W - 1, x));
  const clampY = (y) => Math.max(oy, Math.min(oy + FRAME_H - 1, y));

  // ── For UP direction: flip head/body by drawing back of head (darker) ─────
  const isBack = dir === "up";
  const headColor = isBack ? pal.secondary : pal.skin;
  const visorShow = !isBack;

  // ── Head ─────────────────────────────────────────────────────────────────
  g.fillStyle(headColor, 1);
  g.fillRect(headX, headY, headSize, headSize);

  // Visor / face detail (front-facing only)
  if (visorShow) {
    const visorW = headSize - 4;
    const visorH = 3;
    const visorX = headX + 2;
    const visorY = headY + 2;
    g.fillStyle(pal.visor, 1);
    g.fillRect(visorX, visorY, visorW, visorH);
  } else {
    // Back of helmet — small neck seam
    g.fillStyle(pal.secondary, 0.6);
    g.fillRect(headX + 2, headY + headSize - 2, headSize - 4, 2);
  }

  // ── Torso ────────────────────────────────────────────────────────────────
  g.fillStyle(pal.primary, 1);
  g.fillRect(torsoX, torsoY, sw, th);

  // Secondary color detail on torso (chest plate or stripe)
  g.fillStyle(pal.secondary, 1);
  if (classId === "vanguard") {
    // Chest-plate band
    g.fillRect(torsoX + 2, torsoY + 2, sw - 4, 4);
  } else if (classId === "engineer") {
    // Utility belt across lower torso
    g.fillRect(torsoX + 1, torsoY + th - 4, sw - 2, 3);
  } else if (classId === "medic" && !isBack) {
    // Red cross on chest
    const crossCx = cx - 2;
    const crossCy = torsoY + 3;
    g.fillStyle(pal.secondary, 1);
    g.fillRect(crossCx, crossCy,      4, 6); // vertical bar
    g.fillRect(crossCx - 2, crossCy + 2, 8, 2); // horizontal bar
  } else if (classId === "recon") {
    // Diagonal stripe — two thin lines
    g.fillRect(torsoX + 2, torsoY + 2, sw - 4, 2);
  }

  // ── Arms ─────────────────────────────────────────────────────────────────
  // For left/right facing we show one arm prominently, other less so.
  const showBothArms = (dir === "down" || dir === "up");

  g.fillStyle(pal.primary, 1);

  if (showBothArms) {
    g.fillRect(armLeftX  + armOffsetL, armTopY, armW, armH);
    g.fillRect(armRightX + armOffsetR, armTopY, armW, armH);
  } else if (dir === "left") {
    // Near arm (right of body when facing left = back arm visible)
    g.fillRect(armRightX + armOffsetR, armTopY, armW, armH);
  } else if (dir === "right") {
    // Near arm
    g.fillRect(armLeftX + armOffsetL, armTopY, armW, armH);
  }

  // ── Legs ─────────────────────────────────────────────────────────────────
  g.fillStyle(pal.secondary, 1);
  g.fillRect(legLeftX  + legOffsetL, legTopY, legW, legH);
  g.fillRect(legRightX + legOffsetR, legTopY, legW, legH);

  // Boot accent (darker toe area)
  g.fillStyle(pal.primary, 0.7);
  g.fillRect(legLeftX  + legOffsetL, legTopY + legH - 2, legW, 2);
  g.fillRect(legRightX + legOffsetR, legTopY + legH - 2, legW, 2);

  // ── Outline (subtle 1px border around body for readability) ──────────────
  g.lineStyle(1, 0x000000, 0.4);
  g.strokeRect(torsoX,    torsoY,   sw,      th);
  g.strokeRect(headX,     headY,    headSize, headSize);
}

// ─── Frame layout table ──────────────────────────────────────────────────────

const FRAME_DEFS = [
  // Row 0 – DOWN
  { col: 0, row: 0, dir: "down",  anim: "stand"  },
  { col: 1, row: 0, dir: "down",  anim: "walk-l" },
  { col: 2, row: 0, dir: "down",  anim: "walk-r" },
  // Row 1 – LEFT
  { col: 0, row: 1, dir: "left",  anim: "stand"  },
  { col: 1, row: 1, dir: "left",  anim: "walk-l" },
  { col: 2, row: 1, dir: "left",  anim: "walk-r" },
  // Row 2 – RIGHT
  { col: 0, row: 2, dir: "right", anim: "stand"  },
  { col: 1, row: 2, dir: "right", anim: "walk-l" },
  { col: 2, row: 2, dir: "right", anim: "walk-r" },
  // Row 3 – UP
  { col: 0, row: 3, dir: "up",    anim: "stand"  },
  { col: 1, row: 3, dir: "up",    anim: "walk-l" },
  { col: 2, row: 3, dir: "up",    anim: "walk-r" },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a 32×32 pixel-art sprite sheet texture for a player class and
 * register it in Phaser's texture manager under the key `player-{classId}`.
 *
 * The sheet contains 12 frames (3 cols × 4 rows):
 *   Rows: down, left, right, up
 *   Cols: stand, walk-left-foot, walk-right-foot
 *
 * Frame indices 0–11 map left-to-right, top-to-bottom.
 *
 * If the texture already exists this function returns immediately without
 * redrawing (safe to call on every scene create).
 *
 * @param {Phaser.Scene} scene    - The Phaser scene to create the texture in.
 * @param {string}       classId  - One of: 'vanguard', 'recon', 'engineer', 'medic'.
 * @returns {void}
 */
export function generatePlayerSprite(scene, classId) {
  const key = `player-${classId}`;

  // Guard: don't regenerate if already registered
  if (scene.textures.exists(key)) return;

  if (!PALETTES[classId]) {
    console.warn(`[spriteGen] Unknown classId "${classId}" — skipping.`);
    return;
  }

  // Create an off-screen graphics object (not added to display list)
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // Draw all 12 frames onto the single graphics object
  for (let i = 0; i < FRAME_DEFS.length; i++) {
    const { col, row, dir, anim } = FRAME_DEFS[i];
    const ox = col * FRAME_W;
    const oy = row * FRAME_H;
    drawFrame(g, ox, oy, classId, dir, anim);
  }

  // Bake into a texture stored in the texture manager
  g.generateTexture(key, SHEET_W, SHEET_H);
  g.destroy();

  // Register individual frame definitions so Phaser knows where each frame is
  const texture = scene.textures.get(key);
  for (let i = 0; i < FRAME_DEFS.length; i++) {
    const { col, row } = FRAME_DEFS[i];
    texture.add(i, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
  }
}
