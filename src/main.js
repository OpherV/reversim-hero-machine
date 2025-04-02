import Phaser from "phaser";
import {initConveyorBelt} from "./ConveyorBelt.js";
const Matter = Phaser.Physics.Matter.Matter

let phaserContext;
const groups = []

function createBall() {
    const ball = phaserContext.matter.add.circle(100, 50, 10, {
        restitution: 0.9,
        friction: 0.005
    });
}

function createCoffeeCup() {
    const coffeeCup = phaserContext.matter.add.rectangle(250, 595, 40, 25, {
        friction: 0,
        label: 'coffeeCup'
    });
}

function createBook(x, y, w, h){
    const book = phaserContext.matter.add.rectangle(x, y, w, h, {
        // isStatic: true,
        label: 'book',
    });
}

function addStaticRect(x, y, w, h, options = {}){
    const origin = options.group?.origin || {x: 0, y: 0};

    const rect = phaserContext.matter.add.rectangle(origin.x + x, origin.y + y, w, h, {
        isStatic: true,
        mass: Infinity,
        inertia: Infinity,
    });

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


        rect.relativePosition = {x: x, y: y};
        rect.group = group;
    }

}

function registerStaticItemDrag(){
    let draggableObject;
    let pointerOffset;

    phaserContext.input.on('pointerdown', (pointer) => {
        const pointerPosition = {x: pointer.worldX, y: pointer.worldY};
        const bodiesUnderPointer = phaserContext.matter.intersectPoint(pointerPosition.x, pointerPosition.y); // Retrieve all bodies under pointer
        draggableObject = bodiesUnderPointer.find(body => body.isStatic); // Pick the static one
        pointerOffset = {
            x: pointer.x - draggableObject.position.x,
            y: pointer.y - draggableObject.position.y
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
    physics: {
        default: "matter",
        matter: {
            debug: {
                // showCollisions: true,
            }
        }
    },
    scene: {
        preload() {
            // this.load.image('ball', '/images/ball.png');
            },
        
        create() {
            phaserContext = this
            phaserContext.matter.add.mouseSpring();
            registerStaticItemDrag();

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
            addStaticRect(180, 500, 200, 50);
            addStaticRect(180, 650, 200, 50);
            addStaticRect(140, 575, 120, 200);

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
            addStaticRect(149, 141, 300, 10, { group: computerGroup }); // surface
            addStaticRect(227, 54, 140, 150, { group: computerGroup }); // computer
            addStaticRect(48, 119, 100, 20, { group: computerGroup }); // keyboard

            this.time.addEvent({
                delay: 1500,
                callback: createBall,
                loop: true
            });
        },

        update() {
            this.matter.world.engine.world.bodies.forEach((body) => {
                const {x, y} = body.position;

                if (x < 0 || x > phaserContext.game.config.width || y < 0 || y > phaserContext.game.config.height) {
                    phaserContext.matter.world.remove(body);
                }
            });
        }
    }
};

new Phaser.Game(config);
