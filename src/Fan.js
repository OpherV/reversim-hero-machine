// Fan-related functionality (boilerplate based on Computer.js)
import { addStatic } from './utils.js';
import { createPaddle } from './Paddles.js';

let generalContext;
let phaserContext;
let shapes;

let fanSprite;
let blades;
let rotating = false;
let fanAngle = 0;
let rotationSpeed = 0;
let maxRotationSpeed = 0.1;

function setupFan() {
    // Fan
    const fanGroup = {
        origin: {x: 787, y: 414},
        visible: true
    };

    createPaddle(100, 120, 200, 10, 0, { group: fanGroup });
    addStatic(100, 210, 60, 20, { group: fanGroup, sprite: "fanBase", shape: shapes.fanBase });
    blades = addStatic(100, 238, 60, 60, { group: fanGroup, sprite: "fanBlades", shape: shapes.fanBlades, isRotating: true });

    // Add to the fan group for tracking
    if (fanGroup) {
        addToGroup(fanGroup, fanSprite, 100, 50);
    }

    // Add the base as static
}

// Helper function to add objects to a group
function addToGroup(group, obj, x, y) {
    if (!group.objects) {
        group.objects = [];
    }
    group.objects.push({ obj, x, y });
}

function initFan(context, shapesData) {
    generalContext = context;
    phaserContext = context.phaserContext;
    shapes = shapesData;
    setupFan();
}

function startRotating(maxSpeed = 0.2, rampUp = 0.0002) {
    if (rotating) return;
    rotating = true;
    if (!phaserContext) return;
    maxRotationSpeed = maxSpeed;
    phaserContext.events.on('update', () => {
        if (!rotating) return;
        if (rotationSpeed < maxRotationSpeed) {
            rotationSpeed += rampUp;
            if (rotationSpeed > maxRotationSpeed) rotationSpeed = maxRotationSpeed;
        }
        fanAngle += rotationSpeed;
        if (blades) blades.rotation = fanAngle;
    });
}

export { initFan, startRotating, maxRotationSpeed };
