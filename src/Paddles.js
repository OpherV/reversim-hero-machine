// Paddle-related functionality
import { attachToPhysics } from './utils.js';

let phaserContext;
let shapes;

export function createPaddle(x, y, width, height, angle = 0) {
    // Create the physics body for the paddle
    const paddle = phaserContext.matter.add.rectangle(x, y, width, height, {
        isStatic: true,
        mass: Infinity,
        inertia: Infinity,
        angle: angle,
        // chamfer: { radius: 10 },
        label: 'paddle',
    });

    // Create a 3-slice sprite for the paddle
    // The sprite will be positioned at the same coordinates as the physics body
    const sprite = phaserContext.add.nineslice(
        x, y,           // position
        'paddle',       // key of the image
        null,           // frame (null for the default frame)
        width, height,  // dimensions of the resulting sprite
        10, 10,         // left and right slice points (for 3-slice, we use equal values)
        0, 0            // top and bottom slice points (0 for no vertical slicing)
    );

    // Attach the sprite to the physics body
    return attachToPhysics(paddle, sprite, { matchRotation: true });
}

function createGamePaddles() {
    // Create the angled paddles used in the game
    createPaddle(100, 200, 150, 10, Phaser.Math.DegToRad(30));
    createPaddle(300, 300, 150, 10, Phaser.Math.DegToRad(-30));
}

export function initPaddles(context, shapesData) {
    phaserContext = context;
    shapes = shapesData;

    // Create the game paddles
    createGamePaddles();
}
