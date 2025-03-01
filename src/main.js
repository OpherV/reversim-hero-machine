import Phaser from "phaser";
const Matter = Phaser.Physics.Matter.Matter

let phaserContext;
const balls = {};
const coffeeCups = {};

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

function registerStaticItemDrag(){
    let draggableObject;

    phaserContext.input.on('pointerdown', (pointer) => {
        const pointerPosition = {x: pointer.worldX, y: pointer.worldY};
        const bodiesUnderPointer = phaserContext.matter.intersectPoint(pointerPosition.x, pointerPosition.y); // Retrieve all bodies under pointer
        draggableObject = bodiesUnderPointer.find(body => body.isStatic); // Pick the static one
    });

    phaserContext.input.on('pointermove', (pointer) => {
        if (draggableObject) {
            Matter.Body.setPosition(draggableObject, { x: pointer.x, y: pointer.y });
        }
    });

    phaserContext.input.on('pointerup', (pointer) => {
        draggableObject = null;
    });


}

const config = {
    type: Phaser.AUTO,
    width: 1000,
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


            // Coffee Machine
            this.matter.add.rectangle(180, 500, 200, 50, {
                isStatic: true,
            });

            this.matter.add.rectangle(180, 650, 200, 50, {
                isStatic: true,
            });

            this.matter.add.rectangle(140, 575, 120, 200, {
                isStatic: true,
            });

            // Event listener for objects on the belt
            this.matter.world.on('collisionstart', (event) => {
                event.pairs.forEach(({ bodyA, bodyB }) => {
                    let object, belt;

                    if (bodyA.label === 'conveyor') {
                        object = bodyB;
                        belt = bodyA;
                    } else if (bodyB.label === 'conveyor') {
                        object = bodyA;
                        belt = bodyB;
                    }

                    if (object && object.isStatic === false) {
                        Matter.Body.setVelocity(object, {x: object.velocity.x + 2, y: object.velocity.y});
                    }
                });
            });

            this.matter.world.on('collisionend', (event) => {
                event.pairs.forEach(({ bodyA, bodyB }) => {
                    let object, belt;

                    if (bodyA.label === 'conveyor') {
                        object = bodyB;
                        belt = bodyA;
                    } else if (bodyB.label === 'conveyor') {
                        object = bodyA;
                        belt = bodyB;
                    }

                    if (object && object.isStatic === false) {
                        // this.matter.body.applyForce(object, object.position, { x: 1, y: 0 });
                        object.friction = 0.5;
                    }
                });
            });

            this.matter.world.on('collisionactive', (event) => {
                event.pairs.forEach(({ bodyA, bodyB }) => {
                    let object, belt;

                    if (bodyA.label === 'conveyor') {
                        object = bodyB;
                        belt = bodyA;
                    } else if (bodyB.label === 'conveyor') {
                        object = bodyA;
                        belt = bodyB;
                    }

                    if (object && object.isStatic === false) {
                        // this.matter.body.applyForce(object, object.position, { x: 1, y: 0 });
                        Matter.Body.setVelocity(object, {x: 1, y: object.velocity.y});
                    }
                });
            });


            this.time.addEvent({
                delay: 1500,
                callback: createBall,
                loop: true
            });

            this.time.addEvent({
                delay: 2200,
                callback: createCoffeeCup,
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
