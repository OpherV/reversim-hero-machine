import { Math as PhaserMath } from "phaser";
import {createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";
import ComputerScreen from "./ComputerScreen.js";
import {addCollisionHandler} from "../logic/collisionManager.js";
import {debounce} from "../logic/utils.js";

const computerConfig = {
    "id": "computerGroup",
    "showHandle": true,
    "origin": {
        "x": 665,
        "y": 825
    },
    "objects": [
        {
            "type": "paddle",
            "id": "computerBase",
            "x": 149,
            "y": 141,
            "w": 300,
            "h": 10
        },
        {
            "type": "sprite",
            "id": "computer",
            "shapeName": "Computer",
            "sprite": "computer",
            "x": 227,
            "y": 60,
            "displayWidth": 157,
            "displayHeight": 151,
            "matterBodyConfig": {
                "restitution": 0.2,    // Bounciness
                "mass": 5,      // Mass of the computer
            }

        },
        {
            "type": "sprite",
            "sprite": "keyboard",
            "shapeName": "Keyboard",
            "id": "keyboard",
            "x": 48,
            "y": 123,
            "displayWidth": 83,
            "displayHeight": 31
        }
    ]
}

let generalContext;
let phaserContext;

let computerSprite;
let computerScreen;
let smokeEmitter1;
let smokeEmitter2;
let smokeEmitter3;

let smokeConfig = {
    amount: 1,      // Controls emission rate
    thickness: 2,   // Controls particle size
    distance: 150,  // Controls how far particles travel
    speedX: 0.5,    // Controls the horizontal speed of smoke particles
    speedY: 1,    // Controls the vertical speed of smoke particles
    rotation: 2,     // Controls how much the particles rotate
    emissionFrameInterval: 60,
};

export function initComputer(context) {
    generalContext = context
    phaserContext = context.phaserContext;

    createGroupFromConfig(computerConfig);
    computerSprite = getMachineObjectById("computer").phaserObject;
    computerSprite.once('destroy', () => {
        stopSmoke();
    });


   setupComputerScreen();
   let faultLevel = 0;
   const debouncedShowNoise= debounce(() => {
       faultLevel += 0.1;
       faultLevel = PhaserMath.Clamp(faultLevel, 0, 0.7);
       computerScreen.showNoise();
       computerScreen.setFaultAmount(faultLevel);

   //     const emitters = startSmoke();
   }, 500);

   // quick hack to prevent this from firing at start
   setTimeout(()=> {
       addCollisionHandler({
           firstValidator: 'keyboard',
           secondValidator: true,
           collisionstart: debouncedShowNoise
       })
   }, 2000);

}

function setupComputerScreen(){
    computerScreen = new ComputerScreen(phaserContext, 100, 100, 118, 116);
    computerScreen.setDepth(100);
    computerScreen.setScale(0.6)
    phaserContext.add.existing(computerScreen);

    const screenOffset = { x: -51, y: -55 };
    phaserContext.events.on('update', () => {
        const cos = Math.cos(computerSprite.rotation);
        const sin = Math.sin(computerSprite.rotation);
        const rotatedOffsetX = screenOffset.x * cos - screenOffset.y * sin;
        const rotatedOffsetY = screenOffset.x * sin + screenOffset.y * cos;
        computerScreen.setPosition(
            computerSprite.x + rotatedOffsetX,
            computerSprite.y + rotatedOffsetY
        );
        computerScreen.setRotation(computerSprite.rotation);
    });
}

/**
 * Starts emitting smoke particles from the top of the computer
 * @param {Object} options - Configuration options for smoke
 * @param {number} options.amount - Amount of smoke particles (emission rate)
 * @param {number} options.thickness - Thickness of smoke particles (size)
 * @param {number} options.distance - Distance smoke particles travel
 * @param {number} options.speedX - Horizontal speed of smoke particles
 * @param {number} options.speedY - Vertical speed of smoke particles
 * @param {number} options.rotation - Amount of rotation for smoke particles
 */
export function startSmoke(options = {}) {
    // Apply options if provided, otherwise use defaults
    if (options.amount !== undefined) smokeConfig.amount = options.amount;
    if (options.thickness !== undefined) smokeConfig.thickness = options.thickness;
    if (options.distance !== undefined) smokeConfig.distance = options.distance;
    if (options.speedX !== undefined) smokeConfig.speedX = options.speedX;
    if (options.speedY !== undefined) smokeConfig.speedY = options.speedY;
    if (options.rotation !== undefined) smokeConfig.rotation = options.rotation;

    // If emitters already exist, destroy them first
    if (smokeEmitter1) {
        smokeEmitter1.stop();
        smokeEmitter1.destroy();
    }
    if (smokeEmitter2) {
        smokeEmitter2.stop();
        smokeEmitter2.destroy();
    }
    if (smokeEmitter3) {
        smokeEmitter3.stop();
        smokeEmitter3.destroy();
    }

    // Create emitters (no frequency, only emitParticleAt will be used)
    smokeEmitter1 = phaserContext.add.particles(0, 0, 'smoke1', {
        speed: { min: 20 * smokeConfig.speedY, max: 40 * smokeConfig.speedY * smokeConfig.amount },
        scale: { start: 0.1 * smokeConfig.thickness, end: 0.5 * smokeConfig.thickness },
        alpha: { start: 0.5, end: 0 },
        angle: { min: 260, max: 280 },
        lifespan: { min: 2000, max: 3000 },
        gravityY: -50 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        frequency: 9999999,
        tint: 0x999999,
        emitCallback: (particle) => {
            particle.velocityX = Math.sin(Date.now() / 1000) * 10 * smokeConfig.speedX;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotateSpeed = (Math.random() * 0.02 + 0.01) * smokeConfig.rotation;
        },
    });
    smokeEmitter2 = phaserContext.add.particles(0, 0, 'smoke2', {
        speed: { min: 15 * smokeConfig.speedY, max: 36 * smokeConfig.speedY * smokeConfig.amount },
        scale: { start: 0.12 * smokeConfig.thickness, end: 0.55 * smokeConfig.thickness },
        alpha: { start: 0.4, end: 0 },
        angle: { min: 265, max: 275 },
        lifespan: { min: 2200, max: 3200 },
        gravityY: -45 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        tint: 0x888888,
        frequency: 9999999,        emitCallback: (particle) => {
            particle.velocityX = Math.cos(Date.now() / 1200) * 8 * smokeConfig.speedX;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotateSpeed = (Math.random() * -0.03 - 0.01) * smokeConfig.rotation;
        }
    });
    smokeEmitter3 = phaserContext.add.particles(0, 0, 'smoke3', {
        speed: { min: 18 * smokeConfig.speedY, max: 34 * smokeConfig.speedY * smokeConfig.amount },
        scale: { start: 0.08 * smokeConfig.thickness, end: 0.48 * smokeConfig.thickness },
        alpha: { start: 0.45, end: 0 },
        angle: { min: 262, max: 278 },
        lifespan: { min: 1800, max: 2800 },
        gravityY: -55 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        tint: 0x777777,
        frequency: 9999999,
        emitCallback: (particle) => {
            particle.velocityX = Math.sin(Date.now() / 900) * 12 * smokeConfig.speedX;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotateSpeed = (Math.random() * 0.04 + 0.02) * smokeConfig.rotation;
            particle.rotateDirection = 1;
            particle.rotateTimer = 0;
        },
    });

    // Add an update event to emit particles at the current computer position
    phaserContext.events.on('update', emitSmokeAtComputer);
    return [smokeEmitter1, smokeEmitter2, smokeEmitter3];
}

let smokeFrameCount = 0;

function emitSmokeAtComputer() {
    smokeFrameCount++;
    if (smokeFrameCount % smokeConfig.emissionFrameInterval !== 0) return;
    if (!computerSprite || !smokeEmitter1 || !smokeEmitter2 || !smokeEmitter3) return;
    const emitOffsetY = -(computerSprite.displayHeight / 2);
    smokeEmitter1.emitParticleAt(computerSprite.x, computerSprite.y + emitOffsetY, 1);
    smokeEmitter2.emitParticleAt(computerSprite.x + 5, computerSprite.y + emitOffsetY - 2, 1);
    smokeEmitter3.emitParticleAt(computerSprite.x - 5, computerSprite.y + emitOffsetY - 1, 1);
}

/**
 * Stops the smoke emission
 */
export function stopSmoke() {
    // Remove the update event when stopping smoke
    phaserContext.events.off('update', emitSmokeAtComputer);
    
    if (smokeEmitter1) smokeEmitter1.stop();
    if (smokeEmitter2) smokeEmitter2.stop();
    if (smokeEmitter3) smokeEmitter3.stop();
}

/**
 * Updates the smoke parameters
 * @param {Object} options - Configuration options for smoke
 * @param {number} options.amount - Amount of smoke particles (emission rate)
 * @param {number} options.thickness - Thickness of smoke particles (size)
 * @param {number} options.distance - Distance smoke particles travel
 * @param {number} options.speedX - Horizontal speed of smoke particles
 * @param {number} options.speedY - Vertical speed of smoke particles
 * @param {number} options.rotation - Amount of rotation for smoke particles
 */
export function updateSmokeParams(options = {}) {
    // Update config
    Object.assign(smokeConfig, options);

    // Restart smoke with new parameters
    startSmoke(smokeConfig);
}

/**
 * Returns all current active smoke particles from all emitters
 */
function getSmokeParticles() {
    let all = [];
    if (smokeEmitter1 && smokeEmitter1.alive) all = all.concat(smokeEmitter1.alive);
    if (smokeEmitter2 && smokeEmitter2.alive) all = all.concat(smokeEmitter2.alive);
    if (smokeEmitter3 && smokeEmitter3.alive) all = all.concat(smokeEmitter3.alive);
    return all;
}

export { getSmokeParticles };
