import Phaser from "phaser";
const Matter = Phaser.Physics.Matter.Matter

export function initConveyorBelt(phaserContext) {

    // Event listener for objects on the belt
    phaserContext.matter.world.on('collisionstart', (event) => {
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

    phaserContext.matter.world.on('collisionend', (event) => {
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
                // this.phaserContext.matter.body.applyForce(object, object.position, { x: 1, y: 0 });
                object.friction = 0.5;
            }
        });
    });

    phaserContext.matter.world.on('collisionactive', (event) => {
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
}