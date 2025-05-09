// Utility functions for the game

let generalContext;
let phaserContext;

export function initUtils(context) {
    generalContext = context;
    phaserContext = context.phaserContext;
}

/**
 * Attaches a display object to a physics body, keeping them in sync
 * @param {Phaser.Physics.Matter.Sprite|MatterJS.Body} physicsBody - The physics body to attach to
 * @param {Phaser.GameObjects.GameObject} displayObject - The display object to attach (sprite, text, etc.)
 * @param {Object} options - Additional options
 * @param {boolean} options.matchRotation - Whether to match the rotation of the physics body
 * @returns {Object} An object containing both the physics body and display object
 */
export function attachToPhysics(physicsBody, displayObject, options = { matchRotation: true }) {
    // If the physics body is a sprite, we need to get its underlying body
    const body = physicsBody.body || physicsBody;
    
    // Set the initial position to match
    displayObject.x = body.position.x;
    displayObject.y = body.position.y;
    
    // Set initial rotation if needed
    if (options.matchRotation) {
        displayObject.rotation = body.angle;
    }
    
    // Set up an event listener to keep them in sync
    phaserContext.matter.world.on('afterupdate', () => {
        displayObject.x = body.position.x;
        displayObject.y = body.position.y;
        
        if (options.matchRotation) {
            displayObject.rotation = body.angle;
        }
    });
    
    // Return both objects for reference
    return { 
        body: body, 
        displayObject: displayObject 
    };
}

/**
 * Creates a static physics object in the game world
 * @param {number} x - X position relative to origin
 * @param {number} y - Y position relative to origin
 * @param {number} w - Width of the object
 * @param {number} h - Height of the object
 * @param {Object} options - Additional options
 * @param {Object} options.group - Group information for the object
 * @param {string} options.sprite - Sprite key to use (if any)
 * @param {Object} options.shape - Custom shape configuration
 * @returns {Phaser.Physics.Matter.Sprite|MatterJS.Body} The created static object
 */
export function addStatic(x, y, options = {}) {
    const origin = options.group?.origin || {x: 0, y: 0};
    const defaultRectWidth = 100;
    const defaultRectHeight = 20;

    let obj;
    if (options.sprite) {
        obj = phaserContext.matter.add.sprite(origin.x + x, origin.y + y, options.sprite, null, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
            shape: options.shape ?? {
                type: 'rectangle',
                width: defaultRectWidth,
                height: defaultRectHeight
            }
        });
    } else {
        if (options.shape?.type === 'rect') {
            const w = options.shape.width ?? defaultRectWidth;
            const h = options.shape.height ?? defaultRectHeight;
            obj = phaserContext.matter.add.rectangle(origin.x + x, origin.y + y, w, h, {
                isStatic: true,
                mass: Infinity,
                inertia: Infinity,
            });
        }
    }

    if (options.group) {
        addToGroup(options.group, obj, x, y);
    }

    return obj;
}


export function addToGroup(group, obj, x, y) {

    if (!generalContext.groups.includes(group)){
        generalContext.groups.push(group);
        const groupHandle = phaserContext.matter.add.circle(group.origin.x, group.origin.y, 10, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
            isSensor: true,
            label: "groupOrigin",
            render: {
                visible: group.visible,
                lineColor: 0xffff00
            }
        });
        groupHandle.group = group;
    }


    let body = obj.body ?? obj;
    body.relativePosition = {x: x, y: y};
    body.group = group;
}