let phaserContext;
const collisionHandlers = {};
const handlersMarkedForRemoval = new Set();

export function initCollisionManager(context) {
    phaserContext = context;

    ['collisionstart', 'collisionend', 'collisionactive'].forEach(eventName => {
        phaserContext.matter.world.on(eventName, (event) => {
            event.pairs.forEach(({ bodyA, bodyB }) => {
                Object.values(collisionHandlers).forEach(handlerConfig => {
                    const validatedPair = getValidatedPair(handlerConfig, bodyA, bodyB);
                    if (validatedPair && handlerConfig[eventName]) {
                        handlerConfig[eventName](validatedPair[0], validatedPair[1]);
                    }
                });
            })
        })
    });


    // todo there might be a bug in this logic since a collision might still be active
    phaserContext.matter.world.on('afterUpdate',  () => {
        handlersMarkedForRemoval.forEach(handlerId => delete collisionHandlers[handlerId]);
        handlersMarkedForRemoval.clear();
    })

}

export function addCollisionHandler(collisionHandlerConfig) {
  const handlerId = Math.random().toString().slice(2);
  collisionHandlers[handlerId] = collisionHandlerConfig;
}

export function removeCollisionHandler(handlerId) {
    const handlerConfig = collisionHandlers[handlerId];
    if (!handlerConfig) return;

    // Get current collision pairs from Matter.js
    const pairs = phaserContext?.matter?.world?.engine?.pairs?.list || [];
    let isPairActive = false;

    for (const pair of pairs) {
        if (getValidatedPair(handlerConfig, pair.bodyA, pair.bodyB) !== null) {
            isPairActive = true;
            break;
        }
    }

    if (isPairActive) {
        handlersMarkedForRemoval.add(handlerId);
    } else {
        delete collisionHandlers[handlerId];
    }
}

function getValidatedPair(handlerConfig, bodyA, bodyB) {
    let firstValidated, secondValidated;
    if (validateBody(bodyA, handlerConfig.firstValidator) && validateBody(bodyB, handlerConfig.secondValidator)) {
        firstValidated = bodyA;
        secondValidated = bodyB;
    } else if (validateBody(bodyA, handlerConfig.secondValidator) && validateBody(bodyB, handlerConfig.firstValidator)) {
        firstValidated = bodyB;
        secondValidated = bodyA;
    }

    if (firstValidated && secondValidated){
        return [firstValidated, secondValidated];
    } else {
        return null;
    }
}

function validateBody(body, validator) {
    if (typeof validator === 'string') {
        return body.label === validator;
    } else if (typeof validator === 'function') {
        return validator(body);
    } else {
        console.warn(`Invalid validator for collision handler`);
    }
}