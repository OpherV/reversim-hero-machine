import { Math as PhaserMath, GameObjects } from 'phaser';

// Simple 1D noise function for chaos (can swap for Perlin/simplex if you have a lib)
function pseudoNoise(seed) {
  return Math.sin(seed * 12.9898) * 43758.5453 % 1;
}

export default class AirGraphic extends GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} options
   *   - waveLength: length of the wave (px)
   *   - numLines: number of air lines
   *   - speed: animation speed
   *   - amplitude: max height of wave
   *   - chaos: randomness factor (0-1)
   *   - color: color of the air lines
   *   - lineGap: distance between lines
   */
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);
    this.waveLength = options.waveLength || 80;
    this.numLines = options.numLines || 3;
    this.speed = options.speed || 8;
    this.amplitude = options.amplitude || 8;
    this.chaos = options.chaos || 0.3;
    this.color = options.color || 0x1e2449;
    this.lineWidth = options.lineWidth || 3;
    this.segmentCount = options.segmentCount || 100;
    this.lineGap = options.lineGap !== undefined ? options.lineGap : this.amplitude * 3;
    this.time = 0;

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.setSize(this.waveLength, (this.numLines - 1) * this.lineGap + this.amplitude * 2);

    scene.events.on('update', this.update, this);
    this._sceneEvents = scene.events; // Store ref for cleanup

    // Store original values for animation
    this._targetSpeed = this.speed;
    this._targetAmplitude = this.amplitude;
    this._targetAlpha = 1;
    this.speed = 0;
    this.amplitude = 0;
    this.graphics.alpha = 0;
  }

  update(time, delta) {
    this.time += (delta || 16) * 0.001 * this.speed;
    this.drawWaves();
  }

  drawWaves() {
    this.graphics.clear();
    for (let l = 0; l < this.numLines; l++) {
      const yBase = l * this.lineGap;
      this.graphics.lineStyle(this.lineWidth, this.color, 0.8);
      this.graphics.beginPath();
      for (let i = 0; i <= this.segmentCount; i++) {
        const t = i / this.segmentCount;
        const x = t * this.waveLength;
        // Wave phase offset per line
        const phase = this.time + l * 0.8;
        // Add chaos/randomness
        const chaosSeed = phase * 0.7 + i * this.chaos * 2 + l * 13.37;
        const noise = pseudoNoise(chaosSeed) * this.chaos * this.amplitude;
        const y = yBase + Math.sin(phase + t * Math.PI * 2) * this.amplitude + noise;
        if (i === 0) {
          this.graphics.moveTo(x, y);
        } else {
          this.graphics.lineTo(x, y);
        }
      }
      this.graphics.strokePath();
    }
  }

  /**
   * Update parameters dynamically
   */
  setParams(params = {}) {
    Object.assign(this, params);
  }

  /**
   * Animates speed, amplitude, and opacity from 0 to their current settings over animationTime (ms)
   * @param {number} animationTime - duration in ms
   */
  startAnimation(animationTime = 1000) {
    // Kill any existing tweens on this.graphics
    if (this._animTween) {
      this._animTween.remove();
    }
    const scene = this.scene;
    // Animate speed, amplitude, and alpha
    this._animTween = scene.tweens.add({
      targets: this,
      speed: this._targetSpeed,
      amplitude: this._targetAmplitude,
      duration: animationTime,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        // alpha needs to be set on graphics
        this.graphics.alpha = PhaserMath.Linear(0, this._targetAlpha, this.amplitude / this._targetAmplitude);
      },
      onComplete: () => {
        this.graphics.alpha = this._targetAlpha;
        this._animTween = null;
      }
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
