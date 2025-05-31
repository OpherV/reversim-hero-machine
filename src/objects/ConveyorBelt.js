import { Curves as PhaserCurves } from "phaser";
import {addObjectBuilder} from "../logic/groupManager.js";
import {addCollisionHandler} from "../logic/collisionManager.js";

const conveyorSpeed = 0.5;
const DASH_LENGTH = 10;
const GAP_LENGTH = 10;
const CIRCLE_RADIUS_RATIO = 0.6; // Ratio of circle radius to height of conveyor belt

let phaserContext = null;

export function initConveyorBelt(context) {
    phaserContext = context;
    addObjectBuilder('conveyor', (phaserContext,group, itemConfig) => {
        return createConveyorBelt(
            itemConfig.x,
            itemConfig.y,
            itemConfig.w,
            itemConfig.h,
            itemConfig.depth
        );
    })

    addCollisionHandler({
        firstValidator: 'conveyor',
        secondValidator: (body) => body.isStatic === false,
        collisionstart: (bodyA, bodyB) => {
            let objectToMove = bodyB.parent ?? bodyB;
            objectToMove.originalFriction = objectToMove.friction;
            objectToMove.friction = 0;
        },
        collisionend: (bodyA, bodyB) => {
            let objectToMove = bodyB.parent ?? bodyB;
            objectToMove.friction = objectToMove.originalFriction;
        },
        collisionactive: (bodyA, bodyB) => {
            let objectToMove = bodyB.parent ?? bodyB;
            phaserContext.matter.body.setVelocity(objectToMove, {
                x: Math.min(objectToMove.velocity.x + conveyorSpeed, conveyorSpeed),
                y: bodyB.velocity.y
            });
        }
    })
}


export function createConveyorBelt(x, y, w, h, depth) {
    let conveyorGraphics = null;
    let conveyorDashOffset = 0;
    let updateListenerAttached = false;
    let numCircles = 12;

    const body = phaserContext.matter.add.rectangle(x, y, w, h, {
        isStatic: true,
        label: 'conveyor'
    });

    conveyorGraphics = phaserContext.add.graphics();
    conveyorGraphics.setDepth(depth ?? 100);
    conveyorDashOffset = 0;

    // Attach update listener once
    if (!updateListenerAttached && phaserContext.events) {
        phaserContext.events.on('update', () => {
            conveyorDashOffset = (conveyorDashOffset + 0.35) % (DASH_LENGTH + GAP_LENGTH);
            conveyorGraphics.clear();
            drawConveyorBelt(
                conveyorGraphics,
                body.position.x - w / 2,
                body.position.y - h / 2,
                w,
                h,
                numCircles,
                DASH_LENGTH,
                GAP_LENGTH,
                conveyorDashOffset
            );
        });
        updateListenerAttached = true;
    }

    return {
        phaserObject: conveyorGraphics,
        body
    };
}

// Draws a procedural conveyor belt with circles and a dashed outline
function drawConveyorBelt(graphics, x, y, width, height, numCircles, dashLength, gapLength, dashOffset) {
    // Draw circles
    const circleRadius = (height / 2) * CIRCLE_RADIUS_RATIO;
    const spacing = (width - 2 * circleRadius) / (numCircles - 1);
    for (let i = 0; i < numCircles; i++) {
        const cx = x + circleRadius + i * spacing;
        const cy = y + height / 2;
        graphics.fillStyle(0x4a5a7a, 1);
        graphics.fillCircle(cx, cy, circleRadius);
    }

    // Draw dashed outline using ellipseTo for rounded corners
    graphics.lineStyle(4, 0x222222, 1);
    const r = height / 2;
    const path = new PhaserCurves.Path(x + r, y); // Start at top-left corner (after rounding)
    path.lineTo(x + width - r, y); // Top side
    path.ellipseTo(r, r, 270, 360, false, 0); // Top-right corner
    path.lineTo(x + width, y + height - r); // Right side
    path.ellipseTo(r, r, 0, 90, false, 0); // Bottom-right corner
    path.lineTo(x + r, y + height); // Bottom side
    path.ellipseTo(r, r, 90, 180, false, 0); // Bottom-left corner
    path.lineTo(x, y + r); // Left side
    path.ellipseTo(r, r, 180, 270, false, 0); // Top-left corner

    // Dashed path drawing
    const totalLength = path.getLength();
    let drawn = 0;
    let draw = true;
    let offset = dashOffset % (dashLength + gapLength);

    while (drawn < totalLength) {
        const segLen = draw ? dashLength : gapLength;
        const start = drawn + offset;
        const end = Math.min(start + segLen, totalLength);
        if (draw && start < totalLength) {
            const p1 = path.getPoint(start / totalLength);
            graphics.beginPath();
            graphics.moveTo(p1.x, p1.y);
            for (let t = start + 1; t < end; t += 2) {
                const pt = path.getPoint(t / totalLength);
                graphics.lineTo(pt.x, pt.y);
            }
            graphics.strokePath();
        }
        drawn = end;
        draw = !draw;
        offset = 0;
    }
}