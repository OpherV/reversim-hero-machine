const conveyorSpeed = 0.5;

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
                let objectToMove = object.parent ?? object;
                objectToMove.originalFriction = objectToMove.friction;
                objectToMove.friction = 0;
                // Matter.Body.setVelocity(object, {x: object.velocity.x + 2, y: object.velocity.y});
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
                let objectToMove = object.parent ?? object;
                objectToMove.friction = objectToMove.originalFriction;
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
                let objectToMove = object.parent ?? object;

                phaserContext.matter.body.setVelocity(objectToMove, {
                    x: conveyorSpeed,
                    y: object.velocity.y
                });

            }
        });
    });

}