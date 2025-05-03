import Phaser from "phaser";
import { initConveyorBelt } from "./ConveyorBelt.js";
import { initCoffee } from "./Coffee.js";
import {createPaddle, initPaddles} from "./Paddles.js";
import {initBookStack} from "./BookStack.js";
import { addStatic, initUtils } from "./utils.js";
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
            this.load.image('paddle', '/images/paddle.png');
            this.load.json('shapes', 'assets/shapes.json');
            this.load.image('coffeeParticle', '/images/coffeeParticle.png');
            // Load book images
            this.load.image('book1', '/images/book1.png');
            this.load.image('book2', '/images/book2.png');
            this.load.image('book3', '/images/book3.png');
            this.load.image('book4', '/images/book4.png');
            this.load.image('book5', '/images/book5.png');
            this.load.image('book6', '/images/book6.png');
            this.load.image('book7', '/images/book7.png');
        },

        create() {
            phaserContext = generalContext.phaserContext =  this;
            phaserContext.matter.add.mouseSpring();
            registerStaticItemDrag();

            initUtils(generalContext);

            shapes = this.cache.json.get('shapes');

            initPaddles(phaserContext, shapes);

            // Create conveyor belt
            const conveyor = this.matter.add.rectangle(380, 615, 330, 20, {
                isStatic: true,
                label: 'conveyor'
            });

            initConveyorBelt(this)

            // Initialize coffee-related functionality
            initCoffee(this, shapes)

            initBookStack(phaserContext, shapes);

            // Computer
            const computerGroup = {
                origin: {x: 665, y: 825},
                visible: true
            }

            createPaddle(149, 141, 300, 10, 0, { group: computerGroup });
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

        }
    }
};

new Phaser.Game(config);
