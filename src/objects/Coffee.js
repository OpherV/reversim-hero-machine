import { Math as PhaserMath, Geom as PhaserGeom } from "phaser";
import {createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";
import {addCollisionHandler} from "../logic/collisionManager.js";

const coffeeConfig =
    {
        "id": "coffeeGroup",
        "origin": {
            "x": 75.625,
            "y": 418
        },
        "showHandle": false,
        "objects": [
            {
                "type": "static",
                "id": "coffeeMachine",
                "x": 112.375,
                "y": 138,
                "sprite": "coffeeMachine",
                "shapeName": "coffeeMachine"
            },
            {
                "type": "sprite",
                "id": "coffeeMachineCover",
                "sprite": "coffeeMachineCover",
                "x": 86.375,
                "y": 168,
                "depth": 200
            },
            {
                "type": "conveyor",
                "id": "coffeeConveyor",
                "x": 242,
                "y": 204,
                "w": 370,
                "h": 37,
                "depth": 10
            },
            {
                "type": "paddle",
                "id": "coffeeBase",
                "x": 204.07513442353257,
                "y": 233.36520854331684,
                "w": 450,
                "h": 10
            },
            {
                "type": "dashedLineGraphic",
                "id": "coffeeMachine_dashedLineGraphic1",
                "x": 10,
                "y": 228,
                "dashedLineConfig": {
                    lineLength: 200,
                    circleColor: 0xf5854b
                }
            },
            {
                "type": "dashedLineGraphic",
                "id": "coffeeMachine_dashedLineGraphic2",
                "x": 100,
                "y": 228,
                "dashedLineConfig": {
                    lineLength: 300,
                    circleColor: 0xf26c7f
                }
            },
        ]
    }

let phaserContext;
let shapes;

let coffeeMachineGroup;

// Tilt threshold in radians (e.g. 30deg = 0.52rad)
const COFFEE_SPLASH_TILT_THRESHOLD = 0.72;

function createCoffeeCup() {
    const coffeeMachine = getMachineObjectById('coffeeMachine')
    const coffeeMachineBodyPosition = coffeeMachine.body.position;

    const coffeeCup = phaserContext.matter.add.sprite(
        coffeeMachineBodyPosition.x,
        coffeeMachineBodyPosition.y + 30,
        'coffeeCup',
        null, {
        label: 'coffeeCup',
        shape: shapes.Cup
    });

    coffeeCup.setDepth(150)

    // Add properties to track cup state
    coffeeCup.hasCoffee = false;
    coffeeCup.lastAngle = 0;
    coffeeCup.creationTime = Date.now();

    return coffeeCup;
}

function createCoffeeSplash(coffeeCup, splashNormal, splashSpeed = { min: 160, max: 200 }) {
    const x = coffeeCup.position.x;
    const y = coffeeCup.position.y;

    // Calculate the splash direction (opposite to the collision normal)
    let splashAngle;
    if (splashNormal) {
        splashAngle = PhaserMath.RadToDeg(Math.atan2(splashNormal.y, splashNormal.x)) + coffeeCup.angle;
    } else {
        splashAngle = PhaserMath.RadToDeg(coffeeCup.angle) - 90;
    }

    // console.log(`Splash angle: ${splashAngle} degrees`);

    const emitter = phaserContext.add.particles(x, y, 'coffeeParticle', {
        speed: splashSpeed,
        angle: {
            min: splashAngle - 30,
            max: splashAngle + 30
        }, // Spray in the direction opposite to collision
        scale: { start: 0.6, end: 0.1 },
        lifespan: { min: 600, max: 1000 },
        quantity: 30,
        frequency: 20, // Emit particles more frequently for a more liquid-like effect
        tint: [0x5c3a21, 0x4a2e1b, 0x6e4a31], // Multiple brown shades for more realistic coffee
        gravityY: 400,
        alpha: { start: 0.8, end: 0 }, // Fade out for more liquid-like appearance
        blendMode: 'SCREEN', // Add blend mode for a more liquid-like glow
        emitZone: {
            type: 'edge',
            source: new PhaserGeom.Circle(0, -5, 5),
            quantity: 30,
            yoyo: false
        }
    });
    emitter.setDepth(-1); // Set the emitter's depth behind the coffee cup

    // Stop emitting after a short time (one-time splash)
    phaserContext.time.delayedCall(150, () => {
        emitter.stop();
    });
}

function createCoffeeMachine() {
    coffeeMachineGroup = createGroupFromConfig(coffeeConfig)
}

function setupCoffeeCollisionDetection() {

    addCollisionHandler({
        firstValidator: (body) => {
            return body.parent?.label === 'coffeeCup' && body.gameObject?.hasCoffee
        },
        secondValidator: (body) => body, //todo make nicer
        collisionstart: (bodyA, bodyB) => {
            let coffeeCup = bodyA.parent ?? bodyA;
            // Check if the coffee cup is old enough to produce a splash effect (2000ms = 2 seconds)
            const minCupAge = 2000; // milliseconds
            const cupAge = Date.now() - coffeeCup.gameObject.creationTime;

            if (cupAge >= minCupAge) {
                // const collisionPoint = collision.supports[0] || coffeeCup.position;
                createCoffeeSplash(coffeeCup, null);

                coffeeCup.gameObject.hasCoffee = false;
            }
        },

    })
}

function jiggleCoffeeMachine() {
    const coffeeMachine = getMachineObjectById('coffeeMachine');
    if (!coffeeMachine || !coffeeMachine.body) return;
    const body = coffeeMachine.body;
    const sprite = coffeeMachine;
    const wasStatic = body.isStatic;
    const jiggleAmount = PhaserMath.DegToRad(1);
    phaserContext.tweens.add({
        targets: body,
        angle: { from: -jiggleAmount, to: jiggleAmount },
        yoyo: true,
        repeat: 2,
        duration: 20,
        onUpdate: () => {
            sprite.rotation = body.angle;
        },
        onComplete: () => {
            body.angle = 0;
            sprite.rotation = 0;
        }
    });
}

function isCupSwinging(cup) {
    if (!phaserContext || !phaserContext.matter || !phaserContext.matter.world) return false;
    const constraints = phaserContext.matter.world.engine.world.constraints;
    // Check if any constraint is currently attached to this cup's body
    return constraints.some(constraint => constraint.bodyB === cup.body || constraint.bodyA === cup.body);
}

function setupCoffeeTiltSplash() {
    phaserContext.events.on('update', () => {
        phaserContext.matter.world.engine.world.bodies.forEach(body => {
            if (body.label === 'coffeeCup' && body.gameObject && body.gameObject.hasCoffee) {
                const cup = body.gameObject;
                // Only trigger if swinging
                if (isCupSwinging(cup)) {
                    const angle = Math.abs(cup.body.angle || 0);
                    if (!cup._hasSplashedFromTilt && angle > COFFEE_SPLASH_TILT_THRESHOLD) {
                        // Splash direction: always 'down' from the open end of the cup, relative to tilt
                        const cupAngle = cup.body.angle || 0;
                        const splashMagnitude = 0.5; // Tweak for splash strength
                        const splashNormal = {
                            x: Math.sin(cupAngle) * splashMagnitude,
                            y: Math.cos(cupAngle) * splashMagnitude
                        };

                        createCoffeeSplash(cup.body, splashNormal, { min: 10, max: 50 });
                        cup.hasCoffee = false;
                        cup._hasSplashedFromTilt = true;
                    }
                } else {
                    // Reset flag when not swinging
                    cup._hasSplashedFromTilt = false;
                }
            }
        });
    });
}

function pourShot(targetCup) {
    const coffeeMachine = getMachineObjectById('coffeeMachine')
    const coffeeMachineBodyPosition = coffeeMachine.body.position;

    const spoutX = coffeeMachineBodyPosition.x + 63;
    const spoutY = coffeeMachineBodyPosition.y + 3;

    // Only pour if the cup is present and doesn't already have coffee
    if (!targetCup || targetCup.hasCoffee) return;

    // Particle emitter for the pour effect
    const emitter = phaserContext.add.particles(spoutX, spoutY, 'coffeeParticle', {
        speed: { min: 120, max: 180 },
        angle: { min: 85, max: 95 }, // Downward
        scale: { start: 0.5, end: 0.1 },
        lifespan: { min: 200, max: 350 },
        quantity: 15,
        frequency: 10,
        tint: [0x5c3a21, 0x4a2e1b, 0x6e4a31],
        gravityY: 500,
        alpha: { start: 0.9, end: 0 },
        blendMode: 'SCREEN',
    });
    emitter.setDepth(100);

    // Stop emitting after a short time
    phaserContext.time.delayedCall(600, () => {
        emitter.stop();
    });

    // Mark cup as filled
    targetCup.hasCoffee = true;
}

function setupCoffeePourTrigger() {
    const coffeeMachine = getMachineObjectById('coffeeMachine')
    const coffeeMachineBodyPosition = coffeeMachine.body.position;

    // Define the X range under the spout (adjust as needed)
    const POUR_X_MIN = 50;
    const POUR_X_MAX = 80;
    phaserContext.events.on('update', () => {
        phaserContext.matter.world.engine.world.bodies.forEach(body => {
            if (body.label === 'coffeeCup' && body.gameObject) {
                const cup = body.gameObject;
                if (cup.hasCoffee !== true && cup._hasBeenPouredOn !== true) {
                    const cupX = cup.x - coffeeMachineBodyPosition.x;
                    // Check if cup is under the spout
                    if (cupX >= POUR_X_MIN && cupX <= POUR_X_MAX) {
                        pourShot(cup);
                        cup._hasBeenPouredOn = true; // Prevent multiple pours
                    }
                }
                // Reset flag if cup leaves the spout area (so new cups can be poured)
                if (cup._hasBeenPouredOn && (cup.x < POUR_X_MIN || cup.x > POUR_X_MAX)) {
                    cup._hasBeenPouredOn = false;
                }
            }
        });
    });
}

function setupBallCoffeeMachineCollision() {
    addCollisionHandler({
        firstValidator: 'ball',
        secondValidator: body => body.parent?.label === 'coffeeMachine',
        collisionstart: () => {
            jiggleCoffeeMachine();
            createCoffeeCup();
        }
    });
}

export function initCoffee(context, shapesData) {
    phaserContext = context;
    shapes = shapesData;

    createCoffeeMachine();
    setupCoffeeCollisionDetection();
    setupCoffeeTiltSplash();
    setupCoffeePourTrigger();
    setupBallCoffeeMachineCollision();
}