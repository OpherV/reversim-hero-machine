// CoiledCord.js
// Procedural coiled cord (phone cord style) between two objects with spring physics and rip behavior

import { getMachineObjectById } from "../logic/groupManager.js";

let globalCord = null;
let matterConstraint = null;

const computerPointOffset = { x: -70, y: 55 };
const keyboardPointOffset = { x: 35, y: 5 };

// Utility to get correct position from a sprite (physics body or display)
function getSpritePosition(sprite) {
  if (sprite.body && sprite.body.position) {
    return { x: sprite.body.position.x, y: sprite.body.position.y };
  }
  return { x: sprite.x, y: sprite.y };
}

export function initCord(phaserContext, options = {}) {
  // Get sprites from groupManager
  const computerSprite = getMachineObjectById("computer").phaserObject;
  const keyboardSprite = getMachineObjectById("keyboard").phaserObject;
  if (!computerSprite || !keyboardSprite) {
    throw new Error("Computer or keyboard sprite not found");
  }
  globalCord = new CoiledCord({
    computer: computerSprite,
    keyboard: keyboardSprite,
    ...options
  });

  // Remove any previous constraint
  if (
    matterConstraint &&
    Array.isArray(phaserContext.matter.world.constraints) &&
    phaserContext.matter.world.constraints.includes(matterConstraint)
  ) {
    phaserContext.matter.world.removeConstraint(matterConstraint);
    matterConstraint = null;
  }

  // Add a Matter.js spring constraint between the two bodies
  const restLength = options.restLength || 80; // or use globalCord.cordRadius * globalCord.numCoils * 2
  const stiffness = options.stiffness || 0.004;
  const damping = options.damping || 0.05;
  matterConstraint = phaserContext.matter.add.constraint(
    computerSprite.body,
    keyboardSprite.body,
    restLength,
    stiffness,
    {
      pointA: computerPointOffset,
      pointB: keyboardPointOffset,
      damping
    }
  );

  // Optionally: register listeners for destruction or scene events
  if (computerSprite.once && typeof computerSprite.once === 'function') {
    computerSprite.once('destroy', () => {
      globalCord = null;
      if (
        matterConstraint &&
        Array.isArray(phaserContext.matter.world.constraints) &&
        phaserContext.matter.world.constraints.includes(matterConstraint)
      ) {
        phaserContext.matter.world.removeConstraint(matterConstraint);
        matterConstraint = null;
      }
    });
  }
  if (keyboardSprite.once && typeof keyboardSprite.once === 'function') {
    keyboardSprite.once('destroy', () => {
      globalCord = null;
      if (
        matterConstraint &&
        Array.isArray(phaserContext.matter.world.constraints) &&
        phaserContext.matter.world.constraints.includes(matterConstraint)
      ) {
        phaserContext.matter.world.removeConstraint(matterConstraint);
        matterConstraint = null;
      }
    });
  }
}

export function updateCord() {
  // No manual force needed; physics constraint handles springiness
}

export function drawCord(graphics) {
  if (globalCord) globalCord.drawPhaser(graphics);
}

export { globalCord };

export default class CoiledCord {
  /**
   * @param {Object} options
   * @param {Object} options.computer - Object with {x, y, vx, vy}
   * @param {Object} options.keyboard - Object with {x, y, vx, vy}
   * @param {number} [options.numCoils] - Number of coils
   * @param {string} [options.color="#2C3557"] - Cord color
   * @param {number} [options.maxLength=220] - Max stretch length before ripping
   * @param {number} [options.springConstant=0.04] - Springiness
   * @param {number} [options.damping=0.8] - Damping factor
   * @param {number} [options.cordRadius=10] - Radius of each coil
   */
  constructor({
    computer,
    keyboard,
    numCoils = 5,
    color = "#2C3557",
    maxLength = 400,
    springConstant = 0.04,
    damping = 0.8,
    cordRadius = 10
  }) {
    this.computer = computer;
    this.keyboard = keyboard;
    this.numCoils = numCoils;
    this.color = color;
    this.maxLength = maxLength;
    this.springConstant = springConstant;
    this.damping = damping;
    this.cordRadius = cordRadius;
    this.isRipped = false;
    this.ripImpulse = 20;
  }
  
  drawPhaser(graphics) {
    if (this.isRipped) return;
    // Apply offsets to the positions
    const { x: baseX1, y: baseY1 } = getSpritePosition(this.computer);
    const { x: baseX2, y: baseY2 } = getSpritePosition(this.keyboard);
    const x1 = baseX1 + computerPointOffset.x;
    const y1 = baseY1 + computerPointOffset.y;
    const x2 = baseX2 + keyboardPointOffset.x;
    const y2 = baseY2 + keyboardPointOffset.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const totalCoils = this.numCoils;
    const segments = totalCoils * 40; // more segments for smoother loops
    graphics.clear();
    let colorInt = 0x2C3557;
    try {
      colorInt = Phaser.Display.Color.HexStringToColor(this.color).color;
    } catch (e) {}
    graphics.lineStyle(4, colorInt);
    graphics.beginPath();
    graphics.moveTo(x1, y1);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      const theta = t * totalCoils * 2 * Math.PI;
      const localX = Math.cos(theta) * this.cordRadius;
      const localY = Math.sin(theta) * this.cordRadius;
      const coilX = px + Math.cos(angle) * localX - Math.sin(angle) * localY;
      const coilY = py + Math.sin(angle) * localX + Math.cos(angle) * localY;
      graphics.lineTo(coilX, coilY);
    }
    graphics.lineTo(x2, y2);
    graphics.strokePath();
  }

  reset() {
    this.isRipped = false;
  }
}
