// Fan-related functionality (boilerplate based on Computer.js)
import { addStatic } from './utils.js';
import { createPaddle } from './Paddles.js';
import { getSmokeParticles } from './Computer.js';

let generalContext;
let phaserContext;
let shapes;

let fanSprite;
let blades;
let fanAngle = 0;
let rotationSpeed = 0;
let currentRotationBoost = 0;

const initialRotationBoost = 0.0001;
const maxRotationSpeed = 0.1;
const maxRotationBoost = 0.0015;
const rotationBoostFactor = 1.005;
const rotationDecay = 0.992;

let fanBounds = { x: 100, y: 238, r: 50 };

let debugGraphics;
let showFanDebug = false;

function setupFan() {
    // Fan
    const fanGroup = {
        origin: {x: 787, y: 414},
        visible: true
    };

    createPaddle(100, 120, 200, 10, 0, { group: fanGroup });
    addStatic(100, 210, 60, 20, { group: fanGroup, sprite: "fanBase", shape: shapes.fanBase });
    blades = addStatic(100, 238, 60, 60, { group: fanGroup, sprite: "fanBlades", shape: shapes.fanBlades, isRotating: true });

    // todo add to group
}

function initFan(context, shapesData) {
    generalContext = context;
    phaserContext = context.phaserContext;
    shapes = shapesData;
    setupFan();
    if (phaserContext && phaserContext.events) {
        if (!debugGraphics) {
            debugGraphics = phaserContext.add.graphics();
            debugGraphics.setDepth(1000);
        }
        phaserContext.events.on('update', () => {
            // Update fanBounds to current blade position
            if (blades && blades.x !== undefined && blades.y !== undefined) {
                fanBounds.x = blades.x;
                fanBounds.y = blades.y;
            }
            const isBoosting = checkSmokeCollisionAndBoost();


            if (!isBoosting) {
                rotationSpeed *= rotationDecay;
                if (rotationSpeed < 0.002) {
                    rotationSpeed = 0;
                    currentRotationBoost = 0;
                }
            }

            if (rotationSpeed > maxRotationSpeed) rotationSpeed = maxRotationSpeed;
            fanAngle += rotationSpeed;
            if (blades) blades.rotation = fanAngle;

            // DEBUG DRAW
            if (showFanDebug) {
                debugGraphics.clear();
                const cx = fanBounds.x;
                const cy = fanBounds.y;
                const r = fanBounds.r;
                debugGraphics.lineStyle(2, 0x00ff00, 0.7);
                debugGraphics.strokeCircle(cx, cy, r);
                const particles = getSmokeParticles();
                debugGraphics.fillStyle(0xff0000, 0.7);
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    const emitter = p.emitter;
                    const worldX = emitter ? emitter.x + p.x : p.x;
                    const worldY = emitter ? emitter.y + p.y : p.y;
                    debugGraphics.fillCircle(worldX, worldY, 3);
                }
            } else {
                debugGraphics.clear();
            }
        });
    }
}

function checkSmokeCollisionAndBoost() {
    const particles = getSmokeParticles();
    const cx = fanBounds.x;
    const cy = fanBounds.y;
    const r = fanBounds.r;
    let isBoosting = false;

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const emitter = p.emitter;
        const worldX = emitter ? emitter.x + p.x : p.x;
        const worldY = emitter ? emitter.y + p.y : p.y;
        const dx = worldX - cx;
        const dy = worldY - cy;
        const smokeHittingFan = dx * dx + dy * dy < r * r;

        if (smokeHittingFan) {
            isBoosting = true;
            if (currentRotationBoost === 0) {
                currentRotationBoost = initialRotationBoost;
            } else {
                currentRotationBoost = Math.min(currentRotationBoost * rotationBoostFactor, maxRotationBoost);
            }
            rotationSpeed += currentRotationBoost;
            if (rotationSpeed > maxRotationSpeed) rotationSpeed = maxRotationSpeed;
        }
    }
    return isBoosting;
}

export { initFan, maxRotationSpeed, showFanDebug };
