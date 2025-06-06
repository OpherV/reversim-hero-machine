import { Math as PhaserMath, GameObjects } from 'phaser';

// Simple 1D noise for smooth randomness
function pseudoNoise(seed) {
  return Math.sin(seed * 12.9898) * 43758.5453 % 1;
}

export default class GaugesGraphic extends GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} options
   *   - numGauges: number of vertical gauges
   *   - gaugeWidth: width of each gauge
   *   - gaugeHeight: height of each gauge
   *   - gaugeGap: space between gauges
   *   - bgColor: background color (vertical line)
   *   - fgColor: foreground color (filling line)
   *   - borderRadius: border radius for lines
   *   - speed: animation speed
   *   - noise: noise/randomness factor (0-1)
   *   - minPercentValue: minimum fill value (0-1)
   *   - parent: gameObject to follow (optional)
   */
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);
    this.numGauges = options.numGauges || 3;
    this.gaugeWidth = options.gaugeWidth || 6;
    this.gaugeHeight = options.gaugeHeight || 50;
    this.gaugeGap = options.gaugeGap || 10;
    this.bgColor = options.bgColor || 0x2d375b;
    this.fgColor = options.fgColor || 0xf47d8a;
    this.borderRadius = options.borderRadius || 3;
    this.speed = options.speed || 3.5;
    this.noise = options.noise || 0.4;
    this.minPercentValue = options.minPercentValue !== undefined ? options.minPercentValue : 0.3;
    this._offsetX = x;
    this._offsetY = y;
    this.parent = options.parent || null;
    this.time = 0;
    this._sceneEvents = scene.events;

    // Each gauge has a fill value [0,1]
    this.fills = Array(this.numGauges).fill(0);
    // Target fill values for oscillation
    this._targets = Array(this.numGauges).fill(0);
    // Internal phase for smooth oscillation
    this._phases = Array(this.numGauges).fill(0).map((_, i) => Math.random() * 1000 + i * 100);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.setSize(
      (this.numGauges - 1) * this.gaugeGap + this.numGauges * this.gaugeWidth,
      this.gaugeHeight
    );

    scene.events.on('update', this.update, this);
    this._animTween = null;
    this._animating = false;
  }

  update(time, delta) {
    if (this.parent) {
      const parentObj = this.parent;
      const angle = parentObj.rotation || 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Use offset from construction
      const ox = this._offsetX;
      const oy = this._offsetY;
      // Rotate offset
      const rx = ox * cos - oy * sin;
      const ry = ox * sin + oy * cos;
      this.x = parentObj.x + rx;
      this.y = parentObj.y + ry;
      this.rotation = angle;
    }
    if (!this._animating) return;
    this.time += (delta || 16) * 0.001 * this.speed;
    // Animate each gauge fill smoothly toward its target
    for (let i = 0; i < this.numGauges; i++) {
      // Oscillate target with noise
      const phase = this._phases[i] + this.time * (0.8 + pseudoNoise(i * 17.3) * this.noise);
      let target = 0.5 + 0.45 * Math.sin(phase + i * 0.8 + pseudoNoise(phase) * this.noise);
      // Clamp to minPercentValue
      this._targets[i] = Math.max(this.minPercentValue, target);
      // Smoothly lerp fill toward target
      this.fills[i] = PhaserMath.Linear(this.fills[i], this._targets[i], 0.08 + this.noise * 0.06);
    }
    this.drawGauges();
  }

  drawGauges() {
    this.graphics.clear();
    for (let i = 0; i < this.numGauges; i++) {
      const x = i * (this.gaugeWidth + this.gaugeGap);
      // Draw background (full height)
      this.graphics.fillStyle(this.bgColor, 1);
      this.graphics.fillRoundedRect(
        x,
        0,
        this.gaugeWidth,
        this.gaugeHeight,
        this.borderRadius
      );
      // Draw foreground (fill)
      const fillHeight = this.fills[i] * this.gaugeHeight;
      this.graphics.fillStyle(this.fgColor, 1);
      this.graphics.fillRoundedRect(
        x,
        this.gaugeHeight - fillHeight,
        this.gaugeWidth,
        fillHeight,
        this.borderRadius
      );
    }
  }

  setParams(params = {}) {
    Object.assign(this, params);
    // If number of gauges changes, resize arrays
    if (params.numGauges && params.numGauges !== this.fills.length) {
      this.fills = Array(this.numGauges).fill(0);
      this._targets = Array(this.numGauges).fill(0);
      this._phases = Array(this.numGauges).fill(0).map((_, i) => Math.random() * 1000 + i * 100);
    }
    if (params.minPercentValue !== undefined) {
      this.minPercentValue = params.minPercentValue;
    }
    if (params.parent !== undefined) {
      this.parent = params.parent;
    }
    this.setSize(
      (this.numGauges - 1) * this.gaugeGap + this.numGauges * this.gaugeWidth,
      this.gaugeHeight
    );
    this.drawGauges();
  }

  /**
   * Fills all gauges from 0 to random value, then starts oscillation
   * @param {number} animationTime ms
   */
  startAnimation(animationTime = 900) {
    if (this._animTween) this._animTween.remove();
    this._animating = false;
    // Start by filling up from 0 to random values
    const targetFills = Array(this.numGauges).fill(0).map(() => {
      return PhaserMath.FloatBetween(Math.max(this.minPercentValue, 0), 1);
    });
    // Use a temp object for tweening
    const tweenObj = {};
    for (let i = 0; i < this.numGauges; i++) {
      tweenObj['f' + i] = this.fills[i];
    }
    const props = {};
    for (let i = 0; i < this.numGauges; i++) {
      props['f' + i] = {
        value: targetFills[i],
        duration: animationTime,
        ease: 'Sine.easeInOut',
      };
    }
    this._animTween = this.scene.tweens.add({
      targets: tweenObj,
      props: props,
      onUpdate: () => {
        for (let i = 0; i < this.numGauges; i++) {
          this.fills[i] = tweenObj['f' + i];
        }
        this.drawGauges();
      },
      onComplete: () => {
        this._animating = true;
        this._animTween = null;
      },
    });
  }

  destroy(fromScene) {
    if (this._sceneEvents) {
      this._sceneEvents.off('update', this.update, this);
      this._sceneEvents = null;
    }
    super.destroy(fromScene);
  }
}
