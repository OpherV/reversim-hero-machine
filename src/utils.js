// Utility functions for the game

/**
 * Attaches a display object to a physics body, keeping them in sync
 * @param {Phaser.Scene} phaserContext - The Phaser scene context
 * @param {Phaser.Physics.Matter.Sprite|MatterJS.Body} physicsBody - The physics body to attach to
 * @param {Phaser.GameObjects.GameObject} displayObject - The display object to attach (sprite, text, etc.)
 * @param {Object} options - Additional options
 * @param {boolean} options.matchRotation - Whether to match the rotation of the physics body
 * @returns {Object} An object containing both the physics body and display object
 */
export function attachToPhysics(phaserContext, physicsBody, displayObject, options = { matchRotation: true }) {
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
