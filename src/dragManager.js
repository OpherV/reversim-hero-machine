import Phaser from "phaser";
const Matter = Phaser.Physics.Matter.Matter
import {getGroupById, getMachineObjectByBody} from "./groupManager.js";

let phaserContext;

export function initDragManager(context) {
    phaserContext = context.phaserContext;

    registerStaticItemDrag();
    registerPhysicsItemDrag();
}

function registerStaticItemDrag(){
    let draggableObject;
    let pointerOffset;

    function getGroupFromDraggableObject(draggableObject) {
        if (draggableObject.label === 'groupHandle'){
            // todo registry of handles
            return draggableObject.group;
        } else {
            return getMachineObjectByBody(draggableObject).group;
        }
    }

    phaserContext.input.on('pointerdown', (pointer) => {
        const isCtrlPressed = pointer.event.ctrlKey || pointer.event.metaKey;
        const pointerPosition = {x: pointer.worldX, y: pointer.worldY};
        const bodiesUnderPointer = phaserContext.matter.intersectPoint(pointerPosition.x, pointerPosition.y); // Retrieve all bodies under pointer

        draggableObject = bodiesUnderPointer.find(body => body.isStatic); // Pick the static one
        if (draggableObject) {
            pointerOffset = {
                x: pointer.x - draggableObject.position.x,
                y: pointer.y - draggableObject.position.y
            }
        }
    });

    phaserContext.input.on('pointermove', (pointer) => {
        const isCtrlPressed = pointer.event.ctrlKey || pointer.event.metaKey;

        if (draggableObject) {
            Matter.Body.setPosition(draggableObject, { x: pointer.x, y: pointer.y });
            const group = getGroupFromDraggableObject(draggableObject);

            if (draggableObject.label === 'groupHandle') {
                group.origin = {x: pointer.x, y: pointer.y };

                if (isCtrlPressed) {
                    const group = getGroupById(draggableObject.group.id)

                    group.objects.forEach(machineObj => {
                        if (machineObj.body) {
                            machineObj.relativePosition.x = machineObj.body.position.x - group.origin.x;
                            machineObj.relativePosition.y = machineObj.body.position.y - group.origin.y;
                        } else {
                            machineObj.relativePosition.x = machineObj.phaserObject.x - group.origin.x;
                            machineObj.relativePosition.y = machineObj.phaserObject.y - group.origin.y;
                        }
                    });
                } else {
                    group.origin.x = pointer.x;
                    group.origin.y = pointer.y;

                    group.objects.forEach(machineObj => {
                        const x = group.origin.x +  machineObj.relativePosition.x;
                        const y = group.origin.y + machineObj.relativePosition.y;

                        // physical objects update their sprites automatically
                        // otherwise update the sprite manually
                        if (machineObj.body) {
                            Matter.Body.setPosition(machineObj.body, { x,y });
                        } else {
                            machineObj.phaserObject.setPosition(x, y);
                        }
                    });
                }

                // console.log(`${Math.round(pointer.x)}, ${Math.round(pointer.y)}`);
            } else {

                const machineObj = getMachineObjectByBody(draggableObject);
                machineObj.relativePosition.x = pointer.x - pointerOffset.x - group.origin.x;
                machineObj.relativePosition.y = pointer.y - pointerOffset.y - group.origin.y;
                Matter.Body.setPosition(draggableObject, {
                    x: pointer.x - pointerOffset.x,
                    y: pointer.y - pointerOffset.y
                });
            }


        }
    });

    phaserContext.input.on('pointerup', (pointer) => {
        if (!draggableObject) return;

        const group = getGroupFromDraggableObject(draggableObject);

        const alteredConfig = JSON.parse(JSON.stringify(group.groupConfig));
        alteredConfig.objects = alteredConfig.objects.map(originalObj => {
            const alteredObj = group.objects.find(obj => obj.id === originalObj.id);
            return {
                ...originalObj,
                x: alteredObj.relativePosition.x,
                y: alteredObj.relativePosition.y,
            }
        });
        alteredConfig.origin = {
            ...group.origin
        };

        const newGroupData = JSON.stringify(alteredConfig, null, 2);
        navigator.clipboard.writeText(newGroupData).then(() => {
            console.log(`Group data '${group.id} copied to clipboard`);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });

        draggableObject = null;
        pointerOffset = null;
    });


}

function registerPhysicsItemDrag(){
    let grabbedBody = null;
    let grabConstraint = null;
    let grabOffset = null;

    // Ratio (0 to 1): how much of the center is 'no swing'. 0 = only center, 1 = whole shape
    const centerNoSwingRatio = 0.4; // Tweak this value as needed

    phaserContext.input.on('pointerdown', (pointer) => {
        const pointerPosition = {x: pointer.worldX, y: pointer.worldY};
        const bodiesUnderPointer = phaserContext.matter.intersectPoint(pointerPosition.x, pointerPosition.y);
        // Only grab dynamic (not static) bodies
        grabbedBody = bodiesUnderPointer.find(body => !body.isStatic);
        if (grabbedBody) {
            // Calculate offset from body center to grab point
            grabOffset = {
                x: pointer.worldX - grabbedBody.position.x,
                y: pointer.worldY - grabbedBody.position.y
            };

            // Center of the body
            const centerX = grabbedBody.position.x;
            const centerY = grabbedBody.position.y;
            // Distance from pointer to center
            const dx = pointer.worldX - centerX;
            const dy = pointer.worldY - centerY;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);
            // Maximum possible radius (from center to farthest bound corner)
            const bounds = grabbedBody.bounds;
            const maxRadius = Math.max(
                Math.abs(bounds.max.x - centerX),
                Math.abs(bounds.min.x - centerX),
                Math.abs(bounds.max.y - centerY),
                Math.abs(bounds.min.y - centerY),
                Math.sqrt(Math.pow(bounds.max.x - centerX, 2) + Math.pow(bounds.max.y - centerY, 2)),
                Math.sqrt(Math.pow(bounds.min.x - centerX, 2) + Math.pow(bounds.min.y - centerY, 2)),
                Math.sqrt(Math.pow(bounds.max.x - centerX, 2) + Math.pow(bounds.min.y - centerY, 2)),
                Math.sqrt(Math.pow(bounds.min.x - centerX, 2) + Math.pow(bounds.max.y - centerY, 2))
            );
            const swingThreshold = centerNoSwingRatio * maxRadius;
            if (distToCenter >= swingThreshold) {
                // Only allow swing if grabbed outside the center circle
                grabConstraint = Matter.Constraint.create({
                    pointA: { x: pointer.worldX, y: pointer.worldY },
                    bodyB: grabbedBody,
                    pointB: { x: grabOffset.x, y: grabOffset.y },
                    length: 0,
                    stiffness: 0.2 // Feel free to tweak for more/less swing
                });
                phaserContext.matter.world.add(grabConstraint);
            } else {
                // No swing if grabbed from the center region
                grabbedBody = null;
                grabOffset = null;
            }
        }
    });

    phaserContext.input.on('pointermove', (pointer) => {
        if (grabConstraint) {
            // Move the constraint's anchor to follow the pointer
            grabConstraint.pointA.x = pointer.worldX;
            grabConstraint.pointA.y = pointer.worldY;
        }
    });

    phaserContext.input.on('pointerup', () => {
        if (grabConstraint) {
            phaserContext.matter.world.remove(grabConstraint);
            grabConstraint = null;
            grabbedBody = null;
            grabOffset = null;
        }
    });
}