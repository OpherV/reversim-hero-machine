import { attachToPhysics } from '../logic/utils.js';
import { addObjectBuilder, createGroupFromConfig } from "../logic/groupManager.js";
let phaserContext;

export function createPaddle(x, y, width, height, angle = 0, color = null, strokeColor = null, strokeWidth = null) {
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
    const radius = height / 2;

    const hasFill = color !== undefined && color !== null;
    const hasStroke = strokeWidth > 0 && strokeColor !== undefined && strokeColor !== null;


    hasFill && graphics.fillStyle(color, 1);
    hasStroke && graphics.lineStyle(strokeWidth, strokeColor, 1);

    // Draw central rectangle (without the caps)
    hasFill && graphics.fillRect(-width/2 + radius, -height/2, width - height, height);
    hasStroke && graphics.strokeRect(-width/2 + radius, -height/2, width - height, height);
    // Draw left cap
    hasFill && graphics.fillCircle(-width/2 + radius, 0, radius);
    hasStroke && graphics.strokeCircle(-width/2 + radius, 0, radius);
    // Draw right cap
    hasFill && graphics.fillCircle(width/2 - radius, 0, radius);
    hasStroke && graphics.strokeCircle(width/2 - radius, 0, radius);

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
        const draggableDesign = {
            color: null,
            strokeColor: 0x232849,
            strokeWidth: 2
        }

        const nonDraggableDesign = {
            color: 0x232849,
            strokeColor: null,
            strokeWidth: 0
        }

        const design = itemConfig.userDraggable ? draggableDesign : nonDraggableDesign;

        return createPaddle(
            itemConfig.x,
            itemConfig.y,
            itemConfig.w,
            itemConfig.h,
            itemConfig.angle,
            design.color,
            design.strokeColor,
            design.strokeWidth
        );
    });
}
