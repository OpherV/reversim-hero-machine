// Coffee-related functionality

let phaserContext;
let shapes;

function createCoffeeCup() {
    const coffeeCup = phaserContext.matter.add.sprite(230, 590, 'coffeeCup', null, {
        label: 'coffeeCup',
        shape: shapes.Cup
    });

    // Add properties to track cup state
    coffeeCup.hasCoffee = true;
    coffeeCup.lastAngle = 0;
    coffeeCup.creationTime = Date.now();

    return coffeeCup;
}

function createCoffeeSplash(coffeeCup, collisionNormal) {
    const x = coffeeCup.position.x;
    const y = coffeeCup.position.y;
    const magnitude = Math.sqrt(collisionNormal.x * collisionNormal.x + collisionNormal.y * collisionNormal.y);
    // console.log(`createCoffeeSplash called at position (${x}, ${y}) with normal (${collisionNormal.x}, ${collisionNormal.y}) magnitude: ${magnitude}`);

    // Calculate the splash direction (opposite to the collision normal)
    // const splashAngle = Phaser.Math.RadToDeg(Math.atan2(collisionNormal.y, collisionNormal.x)) + coffeeCup.angle + 180;
    const splashAngle = Phaser.Math.RadToDeg(coffeeCup.angle) - 90;
    // console.log(`Splash angle: ${splashAngle} degrees`);

    const emitter = phaserContext.add.particles(x, y, 'coffeeParticle', {
        speed: { min: 160, max: 200 },
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
    // Coffee Machine
    addStatic(180, 500, 200, 50);
    addStatic(180, 650, 200, 50);
    addStatic(140, 575, 120, 200);
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
                    createCoffeeSplash(coffeeCup, collisionNormal);

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

// Helper function for creating static objects (copied from main.js)
function addStatic(x, y, w, h, options = {}) {
    const origin = options.group?.origin || {x: 0, y: 0};

    let obj;
    if (options.sprite) {
        obj = phaserContext.matter.add.sprite(origin.x + x, origin.y + y, options.sprite, null, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
            shape: options.shape ?? {
                type: 'rectangle',
                width: w,
                height: h
            }
        });
    } else {
        obj = phaserContext.matter.add.rectangle(origin.x + x, origin.y + y, w, h, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
        });
    }

    if (options.group) {
        const group = options.group;

        if (!phaserContext.groups.includes(group)) {
            phaserContext.groups.push(group);
            const groupHandle = phaserContext.matter.add.circle(group.origin.x, group.origin.y, 10, {
                isStatic: true,
                mass: Infinity,
                inertia: Infinity,
                isSensor: true,
                label: "groupOrigin",
                render: {
                    visible: options.group.visible,
                    lineColor: 0xffff00
                }
            });
            groupHandle.group = group;
        }

        let body = obj.body ?? obj;
        body.relativePosition = {x: x, y: y};
        body.group = group;
    }
}

export function initCoffee(context, shapesData) {
    phaserContext = context;
    shapes = shapesData;

    // Setup coffee-related functionality
    createCoffeeMachine();
    setupCoffeeCollisionDetection();
    setupCoffeeCupTimer();
}