import { Math as PhaserMath } from "phaser"
import { attachToPhysics } from '../logic/utils.js';
import { addObjectBuilder, createGroupFromConfig } from "../logic/groupManager.js";

const paddleGroupConfig = {
    id: "paddles",
    origin: {x: 50, y: 50},
    showHandle: false,
    objects: [
        {
            id: "paddle1",
            type: "paddle",
            x: 50,
            y: 150,
            w: 150,
            h: 10,
            angle: PhaserMath.DegToRad(30),
        },
        {
            id: "paddle2",
            type: "paddle",
            x: 250,
            y: 250,
            w: 150,
            h: 10,
            angle: PhaserMath.DegToRad(-30),
        },
    ]
}

let phaserContext;

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

    return {
        ...attachToPhysics(paddle, sprite, { matchRotation: true })
    }
}

export function initPaddles(context) {
    phaserContext = context;
    addObjectBuilder('paddle', (group, itemConfig) => {
        return createPaddle(
            itemConfig.x,
            itemConfig.y,
            itemConfig.w,
            itemConfig.h,
            itemConfig.angle,
        );
    });

    createGroupFromConfig(paddleGroupConfig)
}
