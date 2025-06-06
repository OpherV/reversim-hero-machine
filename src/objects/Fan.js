import { Math as PhaserMath } from "phaser";
import { getSmokeParticles } from './Computer.js';
import {createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";
import AirGraphic from "./AirGraphic.js";
import GaugesGraphic from "./GaugesGraphic.js";

const fanConfig = {
    "id": "fanGroup",
    "showHandle": true,
    "origin": {
        "x": 794.75,
        "y": 383.625
    },
    "objects": [
        {
            "type": "paddle",
            "id": "fanPaddle",
            "x": 100,
            "y": 120,
            "w": 200,
            "h": 10
        },
        {
            "type": "static",
            "id": "fanBase",
            "sprite": "fanBase",
            "shapeName": "fanBase",
            "x": 100,
            "y": 210
        },
        {
            "type": "static",
            "id": "fanBlades",
            "sprite": "fanBlades",
            "shapeName": "fanBlades",
            "x": 100,
            "y": 238
        },
        {
            "type": "sprite",
            "id": "windMachine",
            "sprite": "windMachine",
            "shapeName": "windMachine",
            "x": 103.125,
            "y": 62
        }
    ]
}

let generalContext;
let phaserContext;
let blades;
let fanAngle = 0;
let rotationSpeed = 0;
let currentRotationBoost = 0;

let gaugesGraphic;
let airMachineStarted = false;

const initialRotationBoost = 0.0001;
const maxRotationSpeed = 0.1;
const maxRotationBoost = 0.0015;
const rotationBoostFactor = 1.005;
const rotationDecay = 0.992;

let fanBounds = { x: 100, y: 238, r: 50 };

let debugGraphics;
let showFanDebug = false;

function initFan(context, onMaxRotationCallback) {
    generalContext = context;
    phaserContext = context.phaserContext;

    createGroupFromConfig(fanConfig)
    blades = getMachineObjectById('fanBlades').phaserObject;
    const windMachine = getMachineObjectById('windMachine');
    const fanPaddle = getMachineObjectById('fanPaddle');

    if (phaserContext && phaserContext.events) {
        if (!debugGraphics) {
            debugGraphics = phaserContext.add.graphics();
            debugGraphics.setDepth(1000);
        }
        phaserContext.events.on('update', () => {
            const windMachineOnPaddle = phaserContext.matter.collision.collides(windMachine.body, fanPaddle.body) !== null;

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
            if (!airMachineStarted && windMachineOnPaddle) {
                const percent = PhaserMath.Clamp(rotationSpeed / maxRotationSpeed, 0, 1);
                gaugesGraphic.setParams({
                    fgColor: 0xffffff,
                });
                gaugesGraphic.fills[0] = percent;
                gaugesGraphic.fills[1] = percent;
                gaugesGraphic.fills[2] = percent;
                gaugesGraphic.drawGauges();
            }
            if (rotationSpeed > maxRotationSpeed) {
                rotationSpeed = maxRotationSpeed;
                if (!airMachineStarted && windMachineOnPaddle) {
                    onMaxRotation(onMaxRotationCallback)
                    airMachineStarted = true;
                }
            }
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

    gaugesGraphic = new GaugesGraphic(phaserContext, 18, -17, {
        parent: windMachine.phaserObject
    });
    phaserContext.add.existing(gaugesGraphic);
    gaugesGraphic.setDepth(windMachine.phaserObject.depth + 1);
    gaugesGraphic.drawGauges();

    windMachine.phaserObject.once('destroy', () => {
        gaugesGraphic.destroy();
    });
}

function onMaxRotation(onMaxRotationCallback) {
    const windMachine = getMachineObjectById('windMachine');

    const airGraphic = new AirGraphic(phaserContext, 90, -10,
        {parent: windMachine.phaserObject});
    phaserContext.add.existing(airGraphic);
    airGraphic.startAnimation();
    windMachine.phaserObject.once('destroy', () => {
        airGraphic.destroy();
    });

    gaugesGraphic.setParams({
        fgColor: 0xf47d8a
    })
    gaugesGraphic.startAnimation();

    if (typeof onMaxRotationCallback === 'function') {
        onMaxRotationCallback();
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
        }
    }
    return isBoosting;
}

export { initFan, maxRotationSpeed, showFanDebug };
