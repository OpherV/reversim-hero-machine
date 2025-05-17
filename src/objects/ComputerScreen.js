import { GameObjects, Math as PhaserMath } from 'phaser';

// Parameters for the abstract lines
const MIN_BAR_WIDTH = 60;
const MAX_BAR_WIDTH = 100;
const BAR_HEIGHT = 8;
const BAR_GAP = 8;
const X_SIZE = 24; // X square size
const X_GAP_BEFORE = 6;
const X_GAP_AFTER = 12;
const BAR_RADIUS = 4;
const SEGMENT_GAP = 12;
const TYPING_INTERVAL = 120; // ms between new segments
const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 4;
const X_LINE_WIDTH = 4;

// Color interpolation threshold
const COLOR_INTERPOLATION_MAX = 0.7;

// Configurable monitor background colors
const BG_COLOR_NORMAL = 0x23264a; // original blue
const BG_COLOR_FAULT = 0xff3a3a;  // red
// Configurable line and X colors
const LINE_COLOR_NORMAL = 0x7ed6de; // cyan
const LINE_COLOR_FAULT = 0xcfcfcf;  // white
const X_COLOR_NORMAL = 0xff5c5c;    // red
const X_COLOR_FAULT = 0x000000;     // gray

function lerpColor(a, b, t) {
  // a, b: 0xRRGGBB, t: 0..1
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}

function getColorLerpT(faultAmount) {
  return Math.min(faultAmount / COLOR_INTERPOLATION_MAX, 1);
}

export default class ComputerScreen extends GameObjects.Container {
  constructor(phaserContext, x, y, width = 180, height = 120, options = {}) {
    super(phaserContext, x, y);
    this.width = width;
    this.height = height;
    this.padding = 12;
    this.bgColor = BG_COLOR_NORMAL;
    this.cornerRadius = 12;
    this.minSegments = options.minSegments || MIN_SEGMENTS;
    this.maxSegments = options.maxSegments || MAX_SEGMENTS;
    this.faultAmount = options.faultAmount || 0;
    // Draw background
    this.bg = this.scene.add.graphics();
    this._drawBg();
    this.add(this.bg);

    // State for animation
    this.bars = []; // Each bar: {type: 'line'|'x', ...}
    this.barGraphics = [];
    this.lastSegmentTimestamp = 0;
    this._nextBarTimeout = null;
    this._pendingLine = null;

    // Pre-create enough graphics objects for the max possible rows (conservative estimate)
    for (let i = 0; i < 32; i++) {
      const g = phaserContext.add.graphics();
      this.barGraphics.push(g);
      this.add(g);
    }

    // Start with one line
    this._addNewBar();
    phaserContext.add.existing(this);

    phaserContext.events.on('update', this.update, this);
  }

  destroy(fromScene) {
    super.destroy(fromScene);
    this.scene.events.off('update', this.update, this);
  }

  setFaultAmount(val) {
    this.faultAmount = PhaserMath.Clamp(val, 0, 1);
  }

  _drawBg() {
    const t = getColorLerpT(this.faultAmount);
    const color = lerpColor(BG_COLOR_NORMAL, BG_COLOR_FAULT, t);
    this.bg.clear();
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(0, 0, this.width, this.height, this.cornerRadius);
  }

  _makeBarSegments() {
    // Decide number of segments
    const numSegments = PhaserMath.Between(this.minSegments, this.maxSegments);
    let totalWidth = PhaserMath.Between(MIN_BAR_WIDTH, MAX_BAR_WIDTH);
    // Generate random segment widths
    let remaining = totalWidth - SEGMENT_GAP * (numSegments - 1);
    let segments = [];
    for (let i = 0; i < numSegments; i++) {
      // Each segment gets at least 12px, rest is random
      let width = i === numSegments - 1 ? remaining : PhaserMath.Between(16, Math.max(20, Math.floor(remaining - (numSegments - i - 1) * 16)));
      segments.push({ width });
      remaining -= width;
    }
    // Calculate x positions
    let x = 0;
    for (let seg of segments) {
      seg.x = x;
      x += seg.width + SEGMENT_GAP;
    }
    return segments;
  }

  _shouldDrawX() {
    // Probability of X increases with faultAmount
    return Math.random() < this.faultAmount;
  }

  _addNewBar() {
    // Decide whether to draw a line or an X
    if (this._shouldDrawX()) {
      // Insert an X (occupies one slot, appears instantly)
      this.bars.push({ type: 'x' });
    } else {
      // Insert a line (to be animated segment by segment)
      const segments = this._makeBarSegments();
      this.bars.push({ type: 'line', segments, revealed: 0 });
    }
    // Trim bars so only those that fit vertically are kept
    this._trimBarsToFit();
  }

  _getBarHeight(bar) {
    if (bar.type === 'x') {
      return X_GAP_BEFORE + X_SIZE + X_GAP_AFTER;
    } else {
      return BAR_HEIGHT + BAR_GAP;
    }
  }

  _trimBarsToFit() {
    // Walk backwards from the newest bar, summing heights, until we fill the screen
    let total = 0;
    let count = 0;
    for (let i = this.bars.length - 1; i >= 0; i--) {
      total += this._getBarHeight(this.bars[i]);
      if (total > this.height - 2 * this.padding) break;
      count++;
    }
    // Only keep the last N bars that fit
    if (count < this.bars.length) {
      this.bars = this.bars.slice(this.bars.length - count);
    }
  }

  update(time, delta) {
    // Gradually update background color based on faultAmount
    this._drawBg();

    // Interpolate line and X colors based on faultAmount and COLOR_INTERPOLATION_MAX
    const t = getColorLerpT(this.faultAmount);
    const lineColor = lerpColor(LINE_COLOR_NORMAL, LINE_COLOR_FAULT, t);
    const xColor = lerpColor(X_COLOR_NORMAL, X_COLOR_FAULT, t);

    // If last bar is a line and not fully revealed, animate it
    const currentBar = this.bars[this.bars.length - 1];
    if (currentBar && currentBar.type === 'line' && currentBar.revealed < currentBar.segments.length) {
      if (!this.lastSegmentTimestamp || time - this.lastSegmentTimestamp > TYPING_INTERVAL) {
        currentBar.revealed++;
        this.lastSegmentTimestamp = time;
      }
    } else {
      // After a pause, add a new bar (line or X), always scroll by one slot
      if (!this._nextBarTimeout) {
        this._nextBarTimeout = time;
      }
      if (time - this._nextBarTimeout > 300) {
        this._addNewBar();
        this._nextBarTimeout = null;
        this.lastSegmentTimestamp = time;
      }
    }

    // Draw only bars that fit, from bottom up
    let y = this.height - this.padding;
    // Collect visible bars (from newest to oldest)
    let visible = [];
    for (let i = this.bars.length - 1; i >= 0; i--) {
      const bar = this.bars[i];
      const h = this._getBarHeight(bar);
      y -= h;
      if (y < this.padding) break;
      visible.unshift({ bar, y });
    }
    // Draw
    for (let i = 0; i < this.barGraphics.length; i++) {
      this.barGraphics[i].clear();
    }
    for (let i = 0; i < visible.length; i++) {
      const { bar, y } = visible[i];
      const g = this.barGraphics[i];
      if (bar.type === 'line') {
        for (let s = 0; s < bar.revealed; s++) {
          const seg = bar.segments[s];
          g.fillStyle(lineColor, 1);
          g.fillRoundedRect(this.padding + seg.x, y, seg.width, BAR_HEIGHT, BAR_RADIUS);
        }
      } else if (bar.type === 'x') {
        // Draw a square X left-aligned, with gap before and after
        const xLeft = this.padding;
        const yTop = y + X_GAP_BEFORE;
        g.lineStyle(X_LINE_WIDTH, xColor, 1);
        g.beginPath();
        g.moveTo(xLeft, yTop);
        g.lineTo(xLeft + X_SIZE, yTop + X_SIZE);
        g.moveTo(xLeft + X_SIZE, yTop);
        g.lineTo(xLeft, yTop + X_SIZE);
        g.strokePath();
      }
    }
  }
}