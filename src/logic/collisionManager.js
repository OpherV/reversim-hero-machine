let phaserContext;
const collisionHandlers = {};
const handlersMarkedForRemoval = new Set();

// Store references to event handlers for cleanup
let collisionEventHandlers = {};
let afterUpdateHandler = null;

export function initCollisionManager(context) {
    phaserContext = context;

    collisionEventHandlers = {};
    ['collisionstart', 'collisionend', 'collisionactive'].forEach(eventName => {
        const handler = (event) => {
            event.pairs.forEach(({ bodyA, bodyB }) => {
                Object.values(collisionHandlers).forEach(handlerConfig => {
                    const validatedPair = getValidatedPair(handlerConfig, bodyA, bodyB);
                    if (validatedPair && handlerConfig[eventName]) {
                        handlerConfig[eventName](validatedPair[0], validatedPair[1]);
                    }
                });
            })
        };
        collisionEventHandlers[eventName] = handler;
        phaserContext.matter.world.on(eventName, handler);
    });

    afterUpdateHandler = () => {
        handlersMarkedForRemoval.forEach(handlerId => delete collisionHandlers[handlerId]);
        handlersMarkedForRemoval.clear();
    };
    phaserContext.matter.world.on('afterUpdate', afterUpdateHandler);
}

export function destroyCollisionManager() {
    if (phaserContext && phaserContext.matter && phaserContext.matter.world) {
        // Remove collision event handlers
        if (collisionEventHandlers) {
            Object.entries(collisionEventHandlers).forEach(([eventName, handler]) => {
                phaserContext.matter.world.off(eventName, handler);
            });
        }
        // Remove afterUpdate handler
        if (afterUpdateHandler) {
            phaserContext.matter.world.off('afterUpdate', afterUpdateHandler);
        }
    }
    phaserContext = null;
    Object.keys(collisionHandlers).forEach(key => delete collisionHandlers[key]);
    handlersMarkedForRemoval.clear();
    collisionEventHandlers = {};
    afterUpdateHandler = null;
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
    if (validator === true) {
        return true;
    } else if (typeof validator === 'string') {
        return body.label === validator || body.parent?.label === validator;
    } else if (typeof validator === 'function') {
        return validator(body);
    } else {
        console.warn(`Invalid validator for collision handler`);
    }
}