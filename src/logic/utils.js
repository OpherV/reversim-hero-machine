let generalContext;
let phaserContext;

export function initUtils(context) {
    generalContext = context;
    phaserContext = context.phaserContext;
}

/**
 * Attaches a display object to a physics body, keeping them in sync
 * @param {Phaser.Physics.Matter.Sprite|MatterJS.Body} physicsBody - The physics body to attach to
 * @param {Phaser.GameObjects.GameObject} phaserObject - The display object to attach (sprite, text, etc.)
 * @param {Object} options - Additional options
 * @param {boolean} options.matchRotation - Whether to match the rotation of the physics body
 * @returns {Object} An object containing both the physics body and display object
 */
export function attachToPhysics(physicsBody, phaserObject, options = { matchRotation: true }) {
    // If the physics body is a sprite, we need to get its underlying body
    const body = physicsBody.body || physicsBody;
    
    // Set the initial position to match
    phaserObject.x = body.position.x;
    phaserObject.y = body.position.y;
    
    // Set initial rotation if needed
    if (options.matchRotation) {
        phaserObject.rotation = body.angle;
    }
    
    // Set up an event listener to keep them in sync
    phaserContext.matter.world.on('afterupdate', () => {
        phaserObject.x = body.position.x;
        phaserObject.y = body.position.y;
        
        if (options.matchRotation) {
            phaserObject.rotation = body.angle;
        }
    });
    
    // Return both objects for reference
    return { 
        body: body,
        phaserObject: phaserObject
    };
}

/**
 * Creates a static physics object in the game world
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - Additional options
 * @returns {MachineObj} The created static object
 */
export function addStatic(x, y, options = {}) {
    const defaultRectWidth = 100;
    const defaultRectHeight = 20;

    let phaserObj;
    if (options.sprite) {
        phaserObj = phaserContext.matter.add.sprite(x, y, options.sprite, null, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
            shape: options.shape ?? {
                type: 'rectangle',
                width: defaultRectWidth,
                height: defaultRectHeight
            }
        });
    } else if (options.shape?.type === 'rect')  {
        const w = options.shape.width ?? defaultRectWidth;
        const h = options.shape.height ?? defaultRectHeight;
        phaserObj = phaserContext.matter.add.rectangle(x, y, w, h, {
            isStatic: true,
            mass: Infinity,
            inertia: Infinity,
        });
    } else {
        console.warn(`No sprite or shape provided for static object at (${x}, ${y})`);
    }

    return {
        phaserObject: phaserObj,
        body: phaserObj.body
    };
}


