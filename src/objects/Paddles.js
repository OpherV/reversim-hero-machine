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
    height = 14; // todo change this back in the configs
    // Create the physics body for the paddle
    const paddle = phaserContext.matter.add.rectangle(x, y, width, height, {
        isStatic: true,
        mass: Infinity,
        inertia: Infinity,
        angle: angle,
        label: 'paddle',
    });

    // Create a graphics object for the paddle appearance (true capsule shape)
    const graphics = phaserContext.add.graphics();
    const color = 0x232849; // navy-like color
    const radius = height / 2;

    graphics.fillStyle(color, 1);
    // Draw central rectangle (without the caps)
    graphics.fillRect(-width/2 + radius, -height/2, width - height, height);
    // Draw left cap
    graphics.fillCircle(-width/2 + radius, 0, radius);
    // Draw right cap
    graphics.fillCircle(width/2 - radius, 0, radius);

    graphics.x = x;
    graphics.y = y;

    // Attach the graphics to the physics body
    return {
        ...attachToPhysics(paddle, graphics, { matchRotation: true })
    }
}

export function initPaddles(context) {
    phaserContext = context;
    addObjectBuilder('paddle', (phaserContext, group, itemConfig) => {
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
