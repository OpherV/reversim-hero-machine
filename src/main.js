import Phaser from "phaser";
import {initConveyorBelt} from "./ConveyorBelt.js";
const Matter = Phaser.Physics.Matter.Matter

const debug = true;

let phaserContext;
const groups = []
let shapes;

function createBall() {
    const ball = phaserContext.matter.add.sprite(100, 50, 'ball', null, {
        restitution: 0.9,
        friction: 0.002,
        circleRadius: 15,
    });
    ball.scale = 2/3;
}

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

function createBook(x, y, w, h){
    const book = phaserContext.matter.add.rectangle(x, y, w, h, {
        // isStatic: true,
        label: 'book',
    });
}

function addStatic(x, y, w, h, options = {}){
    const origin = options.group?.origin || {x: 0, y: 0};

    let obj;
    if (options.sprite){
        obj = phaserContext.matter.add.sprite(origin.x + x, origin.y + y, options.sprite, null, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
            shape: options.shape ?? {
                type: 'rectangle',
                width: w,
                height: h
            }
        }
        )
    } else {
        obj = phaserContext.matter.add.rectangle(origin.x + x, origin.y + y, w, h, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
        });
    }


    if (options.group) {
        const group = options.group;

        if (!groups.includes(group)){
            groups.push(group);
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

function registerStaticItemDrag(){
    let draggableObject;
    let pointerOffset;

    phaserContext.input.on('pointerdown', (pointer) => {
        const pointerPosition = {x: pointer.worldX, y: pointer.worldY};
        const bodiesUnderPointer = phaserContext.matter.intersectPoint(pointerPosition.x, pointerPosition.y); // Retrieve all bodies under pointer
        draggableObject = bodiesUnderPointer.find(body => body.isStatic); // Pick the static one
        if (draggableObject) {
            pointerOffset = {
                x: pointer.x - draggableObject.position.x,
                y: pointer.y - draggableObject.position.y
            }
        }
    });

    phaserContext.input.on('pointermove', (pointer) => {
        const isCtrlPressed = pointer.event.ctrlKey || pointer.event.metaKey;

        if (draggableObject) {
            Matter.Body.setPosition(draggableObject, { x: pointer.x, y: pointer.y });

            if (draggableObject.label === 'groupOrigin') {
                draggableObject.group.origin = {x: pointer.x, y: pointer.y };

                if (isCtrlPressed) {
                    phaserContext.matter.world.engine.world.bodies.filter(body =>
                        body.group === draggableObject.group && body.label !== 'groupOrigin'
                    ).forEach(obj => {
                        obj.relativePosition.x = obj.position.x - draggableObject.group.origin.x;
                        obj.relativePosition.y = obj.position.y - draggableObject.group.origin.y;
                    });
                } else {
                    phaserContext.matter.world.engine.world.bodies.filter(body =>
                        body.group === draggableObject.group && body.label !== 'groupOrigin'
                    ).forEach(obj => {
                        const x = pointer.x + obj.relativePosition.x;
                        const y = pointer.y + obj.relativePosition.y;
                        Matter.Body.setPosition(obj, { x,y });
                    });
                }

                console.log(`${Math.round(pointer.x)}, ${Math.round(pointer.y)}`);
            } else {
                if (draggableObject.group) {
                    draggableObject.relativePosition.x = pointer.x - pointerOffset.x - draggableObject.group.origin.x;
                    draggableObject.relativePosition.y = pointer.y - pointerOffset.y - draggableObject.group.origin.y;
                    Matter.Body.setPosition(draggableObject, {
                        x: pointer.x - pointerOffset.x,
                        y: pointer.y - pointerOffset.y
                    });
                    console.log(`${Math.round(draggableObject.relativePosition.x)}, ${Math.round(draggableObject.relativePosition.y)}`);
                }
            }


        }
    });

    phaserContext.input.on('pointerup', (pointer) => {
        draggableObject = null;
        pointerOffset = null;
    });


}

const config = {
    type: Phaser.AUTO,
    width: 1100,
    height: 1100,
    transparent: true,
    physics: {
        default: "matter",
        matter: {
            debug: debug? {
                // showCollisions: true,
            } : null
        }
    },
    scene: {
        preload() {
                this.load.image('ball', '/images/ball.png');
                this.load.image('coffeeCup', '/images/Cup.png');
                this.load.image('coffeeMachine', '/images/CoffeeMachine.png');
                this.load.image('computer', '/images/Computer.png');
                this.load.image('keyboard', '/images/Keyboard.png');
                this.load.json('shapes', 'assets/shapes.json');

                // Add coffee splash particle
                this.load.image('coffeeParticle', '/images/coffeeParticle.png');
                // Note: You need to create a small brown circle image and save it as coffeeParticle.png in the public/images directory
        },

        create() {
            phaserContext = this
            phaserContext.matter.add.mouseSpring();
            registerStaticItemDrag();

            shapes = this.cache.json.get('shapes');


            // Add collision detection for coffee cups
            this.matter.world.on('collisionstart', (event) => {
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

            // paddles
            phaserContext.matter.add.rectangle(100, 200, 150, 10, {
                angle: Phaser.Math.DegToRad(30),
                isStatic: true,
                mass: Infinity,
                inertia: Infinity,
            });
            phaserContext.matter.add.rectangle(300, 300, 150, 10, {
                angle: Phaser.Math.DegToRad(-30),
                isStatic: true,
                mass: Infinity,
                inertia: Infinity,
            });

            const stackOrigin = {x: 540, y: 850 };
            phaserContext.matter.add.rectangle(stackOrigin.x, stackOrigin.y, 150, 10, {
                isStatic: true,
                mass: Infinity,
                inertia: Infinity,
            });

            [
                [0, 100, 15],
                [20, 100, 15],
                [-10, 100, 20],
                [10, 100, 30],
                [14, 100, 10],
                [20, 100, 20],
                [40, 100, 15],
            ].reduce((prevY, [xOffset, bookWidth, bookHeight]) => {
                const x = stackOrigin.x + xOffset;
                const y = prevY - (bookHeight / 2);
                createBook(x, y, bookWidth, bookHeight);
                return y - (bookHeight / 2);
            }, stackOrigin.y - 5); // should use paddle height


            // Create conveyor belt
            const conveyor = this.matter.add.rectangle(350, 615, 300, 20, {
                isStatic: true,
                label: 'conveyor'
            });

            initConveyorBelt(this)


            // Coffee Machine
            addStatic(180, 500, 200, 50);
            addStatic(180, 650, 200, 50);
            addStatic(140, 575, 120, 200);


            this.time.addEvent({
                delay: 2200,
                callback: createCoffeeCup,
                loop: true
            });

            // Computer
            const computerGroup = {
                origin: {x: 685, y: 825},
                visible: true
            }
            addStatic(149, 141, 300, 10, { group: computerGroup }); // surface
            addStatic(227, 60, 140, 150, { group: computerGroup, sprite: "computer", shape: shapes.Computer });
            addStatic(48, 123, 100, 20, { group: computerGroup, sprite: "keyboard", shape: shapes.Keyboard }); // keyboard

            this.time.addEvent({
                delay: 1500,
                callback: createBall,
                loop: true
            });
        },

        update() {
            this.matter.world.engine.world.bodies.forEach((body) => {
                const {x, y} = body.position;

                // Remove bodies that are out of bounds
                if (x < 0 || x > phaserContext.game.config.width || y < 0 || y > phaserContext.game.config.height) {
                    phaserContext.matter.world.remove(body);
                }
            });

            // Clean up particles when no longer needed
            // Note: We don't need to manually clean up particle emitters
            // Phaser handles this automatically when emitters are stopped
        }
    }
};

new Phaser.Game(config);
