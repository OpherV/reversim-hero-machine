import Phaser from "phaser";
import { initConveyorBelt } from "./ConveyorBelt.js";
import { initCoffee } from "./Coffee.js";
import { initPaddles} from "./Paddles.js";
import { initBookStack} from "./BookStack.js";
import { initUtils } from "./utils.js";
import { initComputer } from "./Computer.js";
import {initFan} from "./Fan.js";
const Matter = Phaser.Physics.Matter.Matter

const debug = true;

let phaserContext;
let generalContext = {
    phaserContext: null,
    groups: []
}
let shapes;

function createBall() {
    const ball = phaserContext.matter.add.sprite(100, 50, 'ball', null, {
        restitution: 0.9,
        friction: 0.002,
        circleRadius: 15,
    });
    ball.scale = 2/3;
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

function registerPhysicsItemDrag(){
    let grabbedBody = null;
    let grabConstraint = null;
    let grabOffset = null;

    // Ratio (0 to 1): how much of the center is 'no swing'. 0 = only center, 1 = whole shape
    const centerNoSwingRatio = 0.4; // Tweak this value as needed

    phaserContext.input.on('pointerdown', (pointer) => {
        const pointerPosition = {x: pointer.worldX, y: pointer.worldY};
        const bodiesUnderPointer = phaserContext.matter.intersectPoint(pointerPosition.x, pointerPosition.y);
        // Only grab dynamic (not static) bodies
        grabbedBody = bodiesUnderPointer.find(body => !body.isStatic);
        if (grabbedBody) {
            // Calculate offset from body center to grab point
            grabOffset = {
                x: pointer.worldX - grabbedBody.position.x,
                y: pointer.worldY - grabbedBody.position.y
            };

            // Center of the body
            const centerX = grabbedBody.position.x;
            const centerY = grabbedBody.position.y;
            // Distance from pointer to center
            const dx = pointer.worldX - centerX;
            const dy = pointer.worldY - centerY;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);
            // Maximum possible radius (from center to farthest bound corner)
            const bounds = grabbedBody.bounds;
            const maxRadius = Math.max(
                Math.abs(bounds.max.x - centerX),
                Math.abs(bounds.min.x - centerX),
                Math.abs(bounds.max.y - centerY),
                Math.abs(bounds.min.y - centerY),
                Math.sqrt(Math.pow(bounds.max.x - centerX, 2) + Math.pow(bounds.max.y - centerY, 2)),
                Math.sqrt(Math.pow(bounds.min.x - centerX, 2) + Math.pow(bounds.min.y - centerY, 2)),
                Math.sqrt(Math.pow(bounds.max.x - centerX, 2) + Math.pow(bounds.min.y - centerY, 2)),
                Math.sqrt(Math.pow(bounds.min.x - centerX, 2) + Math.pow(bounds.max.y - centerY, 2))
            );
            const swingThreshold = centerNoSwingRatio * maxRadius;
            if (distToCenter >= swingThreshold) {
                // Only allow swing if grabbed outside the center circle
                grabConstraint = Matter.Constraint.create({
                    pointA: { x: pointer.worldX, y: pointer.worldY },
                    bodyB: grabbedBody,
                    pointB: { x: grabOffset.x, y: grabOffset.y },
                    length: 0,
                    stiffness: 0.2 // Feel free to tweak for more/less swing
                });
                phaserContext.matter.world.add(grabConstraint);
            } else {
                // No swing if grabbed from the center region
                grabbedBody = null;
                grabOffset = null;
            }
        }
    });

    phaserContext.input.on('pointermove', (pointer) => {
        if (grabConstraint) {
            // Move the constraint's anchor to follow the pointer
            grabConstraint.pointA.x = pointer.worldX;
            grabConstraint.pointA.y = pointer.worldY;
        }
    });

    phaserContext.input.on('pointerup', () => {
        if (grabConstraint) {
            phaserContext.matter.world.remove(grabConstraint);
            grabConstraint = null;
            grabbedBody = null;
            grabOffset = null;
        }
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
            ...(debug ? { debug: { showCollisions: false } } : {}),
        }
    },
    scene: {
        preload() {
            this.load.json('shapes', 'assets/shapes.json');
            this.load.image('ball', '/images/ball.png');

            this.load.image('coffeeCup', '/images/Cup.png');
            this.load.image('coffeeMachine', '/images/coffeeMachine.png');
            this.load.image('coffeeMachineCover', '/images/coffeeMachineCover.png');

            this.load.image('computer', '/images/Computer.png');
            this.load.image('keyboard', '/images/Keyboard.png');
            this.load.image('paddle', '/images/paddle.png');

            this.load.image('coffeeParticle', '/images/coffeeParticle.png');
            this.load.image('fanBase', '/images/fanBase.png');
            this.load.image('fanBlades', '/images/fanBlades.png');
            this.load.image('windMachine', '/images/windMachine.png');

            // Load book images
            this.load.image('book1', '/images/book1.png');
            this.load.image('book2', '/images/book2.png');
            this.load.image('book3', '/images/book3.png');
            this.load.image('book4', '/images/book4.png');
            this.load.image('book5', '/images/book5.png');
            this.load.image('book6', '/images/book6.png');
            this.load.image('book7', '/images/book7.png');

            this.load.image('smoke1', '/images/smoke1.png');
            this.load.image('smoke2', '/images/smoke2.png');
            this.load.image('smoke3', '/images/smoke3.png');
        },

        create() {
            phaserContext = generalContext.phaserContext =  this;
            phaserContext.matter.add.mouseSpring();
            registerStaticItemDrag();
            registerPhysicsItemDrag();

            initUtils(generalContext);

            shapes = this.cache.json.get('shapes');

            initPaddles(phaserContext, shapes);

            // Create conveyor belt
            const conveyor = this.matter.add.rectangle(320, 615, 370, 20, {
                isStatic: true,
                label: 'conveyor'
            });

            initConveyorBelt(this)

            initCoffee(this, shapes)
            initBookStack(phaserContext, shapes);
            initComputer(generalContext, shapes);
            initFan(generalContext, shapes);

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

        }
    }
};

new Phaser.Game(config);
