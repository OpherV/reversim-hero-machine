import { Math as PhaserMath } from "phaser";
import {createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";
import ComputerScreen from "./ComputerScreen.js";
import {addCollisionHandler} from "../logic/collisionManager.js";
import {debounce} from "../logic/utils.js";

import computerImg from '../images/Computer.png';
import keyboardImg from '../images/Keyboard.png';
import rubberDuckImg from '../images/rubberDuck.png';

const computerConfig = {
    "id": "computerGroup",
    "showHandle": true,
    "origin": {
        "x": 675,
        "y": 825
    },
    "objects": [
        {
            "type": "paddle",
            "id": "computerBase",
            "x": 149,
            "y": 141,
            "w": 300,
            "h": 10,
            "userDraggable": true,
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
            },
            "userDraggable": true,
        },
        {
            "type": "sprite",
            "sprite": "keyboard",
            "shapeName": "Keyboard",
            "id": "keyboard",
            "x": 48,
            "y": 123,
            "displayWidth": 83,
            "displayHeight": 31,
            "userDraggable": true,
        },
        {
            "type": "sprite",
            "sprite": "rubberDuck",
            "shapeName": "rubberduck",
            "id": "rubberDuck",
            "x": 180,
            "y": -30,
            "scale": 2,
            "userDraggable": true,
        },
        {
            type: "label",
            id: "computerLabel",
            x: 350,
            y: -60,
            labelConfig: {
                width: 170,
                text: "Cloud Provider"
            }
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
    rotation: 2     // Controls how much the particles rotate
};

let smokeFrameCount = 0;
let emissionFrameInterval = 60;

export function loadAssets(phaserContext) {
    phaserContext.load.image('computer', computerImg);
    phaserContext.load.image('keyboard', keyboardImg);
    phaserContext.load.image('rubberDuck', rubberDuckImg);
}

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
        const smokePercent = PhaserMath.Clamp((faultLevel - 0.2)  / 0.5, 0, 1);

        if (smokePercent > 0 && smokePercent < 1) {
            emissionFrameInterval = 60 - Math.round(smokePercent * 50);
            startSmoke({
                amount: smokePercent * 10,
                thickness: smokePercent * 3,
            });
        }

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

    const screenOffset = { x: -55, y: -57 };
    function onUpdate() {
        // computerSprite was destroyed
        if (!computerSprite.scene) {
            phaserContext.events.off('update', onUpdate);
            return;
        }
        const cos = Math.cos(computerSprite.rotation);
        const sin = Math.sin(computerSprite.rotation);
        const rotatedOffsetX = screenOffset.x * cos - screenOffset.y * sin;
        const rotatedOffsetY = screenOffset.x * sin + screenOffset.y * cos;
        computerScreen.setPosition(
            computerSprite.x + rotatedOffsetX,
            computerSprite.y + rotatedOffsetY
        );
        computerScreen.setRotation(computerSprite.rotation);
    };
    phaserContext.events.on('update', onUpdate);
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

    const emitter1Config = {
        speed: {min: 20 * smokeConfig.speedY, max: 60 * smokeConfig.speedY},
        scale: {start: 0.1 * smokeConfig.thickness, end: 0.5 * smokeConfig.thickness},
        alpha: {start: 0.5, end: 0},
        angle: {min: 260, max: 280},
        lifespan: {min: 2000, max: 2000},
        gravityY: -50 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        frequency: 9999999,
        tint: 0x999999,
        emitCallback: (particle) => {
            particle.velocityX = Math.sin(Date.now() / 1000) * 10 * smokeConfig.speedX;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotateSpeed = (Math.random() * 0.02 + 0.01) * smokeConfig.rotation;
        },
    };

    const emitter2Config = {
        speed: {min: 15 * smokeConfig.speedY, max: 44 * smokeConfig.speedY },
        scale: {start: 0.12 * smokeConfig.thickness, end: 0.55 * smokeConfig.thickness},
        alpha: {start: 0.4, end: 0},
        angle: {min: 265, max: 275},
        lifespan: {min: 1200, max: 1500},
        gravityY: -45 * smokeConfig.distance / 150 * smokeConfig.speedY,
        blendMode: 'NORMAL',
        tint: 0x888888,
        frequency: 9999999, emitCallback: (particle) => {
            particle.velocityX = Math.cos(Date.now() / 1200) * 8 * smokeConfig.speedX;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotateSpeed = (Math.random() * -0.03 - 0.01) * smokeConfig.rotation;
        }
    }

    const emitter3Config = {
        speed: {min: 18 * smokeConfig.speedY, max: 43 * smokeConfig.speedY },
        scale: {start: 0.08 * smokeConfig.thickness, end: 0.48 * smokeConfig.thickness},
        alpha: {start: 0.45, end: 0},
        angle: {min: 262, max: 278},
        lifespan: {min: 1500, max: 2000},
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
    }

    if (!smokeEmitter1 && !smokeEmitter2 && !smokeEmitter3) {
        // Create emitters (no frequency, only emitParticleAt will be used)
        smokeEmitter1 = phaserContext.add.particles(0, 0, 'smoke1', emitter1Config);
        smokeEmitter2 = phaserContext.add.particles(0, 0, 'smoke2', emitter2Config);
        smokeEmitter3 = phaserContext.add.particles(0, 0, 'smoke3', emitter3Config);
        // Reset frame count
        smokeFrameCount = 0;
        // Add an update event to emit particles at the current computer position
        phaserContext.events.on('update', emitSmokeAtComputer);
    } else {
        smokeEmitter1.setConfig(emitter1Config);
        smokeEmitter2.setConfig(emitter2Config);
        smokeEmitter3.setConfig(emitter3Config);
    }

    return [smokeEmitter1, smokeEmitter2, smokeEmitter3];
}

function emitSmokeAtComputer() {
    if (!computerSprite || !smokeEmitter1 || !smokeEmitter2 || !smokeEmitter3) return;
    const emitOffsetY = -(computerSprite.displayHeight / 2);
    smokeFrameCount++;
    if (smokeFrameCount % emissionFrameInterval === 0) {
        smokeEmitter1.emitParticleAt(computerSprite.x, computerSprite.y + emitOffsetY, 1);
        smokeEmitter2.emitParticleAt(computerSprite.x + 5, computerSprite.y + emitOffsetY - 2, 1);
        smokeEmitter3.emitParticleAt(computerSprite.x - 5, computerSprite.y + emitOffsetY - 1, 1);
    }
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
    // Reset frame count when stopped
    smokeFrameCount = 0;
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
