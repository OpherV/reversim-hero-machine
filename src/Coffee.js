import { addStatic } from './utils.js';

let phaserContext;
let shapes;

// Tilt threshold in radians (e.g. 30deg = 0.52rad)
const COFFEE_SPLASH_TILT_THRESHOLD = 0.72;

function createCoffeeCup() {
    const coffeeCup = phaserContext.matter.add.sprite(190, 590, 'coffeeCup', null, {
        label: 'coffeeCup',
        shape: shapes.Cup
    });

    // Add properties to track cup state
    coffeeCup.hasCoffee = true;
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
        splashAngle = Phaser.Math.RadToDeg(Math.atan2(splashNormal.y, splashNormal.x)) + coffeeCup.angle;
    } else {
        splashAngle = Phaser.Math.RadToDeg(coffeeCup.angle) - 90;
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
            source: new Phaser.Geom.Circle(0, -5, 5),
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
    const coffeeMachineGroup = {
        origin: {x: 100, y: 500},
        visible: true
    };

    const coffeeMachine = addStatic(88, 56, { group: coffeeMachineGroup, sprite: "coffeeMachine", shape: shapes.coffeeMachine });
    // const coffeeMachineCover = addStatic(88, 56, { group: coffeeMachineGroup, sprite: "coffeeMachineCover"});
    phaserContext.add.sprite(
        coffeeMachineGroup.origin.x + 62,
        coffeeMachineGroup.origin.y + 86, 'coffeeMachineCover').setDepth(1);
}

function setupCoffeeCollisionDetection() {
    // Add collision detection for coffee cups
    phaserContext.matter.world.on('collisionstart', (event) => {
        event.pairs.forEach(({ bodyA, bodyB, collision }) => {
            let coffeeCup, otherBody;
            bodyA = bodyA.parent ?? bodyA;
            bodyB = bodyB.parent ?? bodyB;

            if (bodyA.label === 'coffeeCup' && bodyA.gameObject && bodyA.gameObject.hasCoffee) {
                coffeeCup = bodyA;
                otherBody = bodyB;
            } else if (bodyB.label === 'coffeeCup' && bodyB.gameObject && bodyB.gameObject.hasCoffee) {
                coffeeCup = bodyB;
                otherBody = bodyA;
            }

            // If a coffee cup with coffee collided with something
            if (coffeeCup && otherBody) {
                // Check if the coffee cup is old enough to produce a splash effect (2000ms = 2 seconds)
                const minCupAge = 2000; // milliseconds
                const cupAge = Date.now() - coffeeCup.gameObject.creationTime;

                if (cupAge >= minCupAge) {
                    // Calculate collision normal (direction from coffee cup to other body)
                    const collisionNormal = {
                        x: coffeeCup.velocity.x,
                        y: coffeeCup.velocity.y
                    };

                    // const collisionPoint = collision.supports[0] || coffeeCup.position;
                    createCoffeeSplash(coffeeCup, null);

                    coffeeCup.gameObject.hasCoffee = false;
                }
            }
        });
    });
}

function setupCoffeeCupTimer() {
    phaserContext.time.addEvent({
        delay: 2200,
        callback: createCoffeeCup,
        loop: true
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

export function initCoffee(context, shapesData) {
    phaserContext = context;
    shapes = shapesData;

    // Setup coffee-related functionality
    createCoffeeMachine();
    setupCoffeeCollisionDetection();
    setupCoffeeCupTimer();
    setupCoffeeTiltSplash();
}