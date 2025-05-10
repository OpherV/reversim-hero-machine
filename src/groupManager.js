import {addStatic} from "./utils.js";

let generalContext;
let phaserContext;
let shapes;

const groups = []

const objectBuilders = {}

export function initGroupManager(context, shapesData) {
    generalContext = context;
    phaserContext = context.phaserContext;
    shapes = shapesData;

    addObjectBuilder('sprite', spriteBuilder)
    addObjectBuilder('static', staticBuilder)
}

function staticBuilder(group, itemConfig) {
    const options = {
        group: itemConfig.group,
        sprite: itemConfig.sprite,
    }

    if (itemConfig.shapeName) {
        options.shape = shapes[itemConfig.shapeName];
    } else {
        options.shape = itemConfig.shape;
    }

    return addStatic(
        itemConfig.x,
        itemConfig.y,
        options
    );
}

function spriteBuilder(group, itemConfig) {
    let shape;
    let phaserObject;
    let body;

    if (itemConfig.shapeName) {
        shape = shapes[itemConfig.shapeName];
    } else {
        shape = itemConfig.matterBodyConfig?.shape;
    }

    if (shape) {
        phaserObject = phaserContext.matter.add.sprite(
            itemConfig.x,
            itemConfig.y,
            itemConfig.sprite,
            null,
            itemConfig.matterBodyConfig
        )
        body = phaserObject.body;
    } else {
        phaserObject = phaserContext.add.sprite(
            itemConfig.x,
            itemConfig.y,
            itemConfig.sprite);
    }

    phaserObject.displayWidth = itemConfig.displayWidth ?? phaserObject.width;
    phaserObject.displayHeight = itemConfig.displayHeight ?? phaserObject.height;
    phaserObject.setDepth(itemConfig.depth ?? 100);

    return {
        phaserObject,
        body
    }
}

export function createMachineObjFromConfig(group, itemConfig) {
    if (objectBuilders[itemConfig.type]) {
        return {
            ...itemConfig,
            ...objectBuilders[itemConfig.type](group, itemConfig)
        };
    } else {
        console.warn(`No object builder found for type ${itemConfig.type}`);
        return null;
    }
}

export function createGroupFromConfig(groupConfig) {
    const group = {
        id: groupConfig.id,
        groupConfig,
        origin: {x: groupConfig.origin.x, y: groupConfig.origin.y},
        showHandle: groupConfig.showHandle,
        objects: []
    };

    groups.push(group);

    groupConfig.objects.forEach(machineObjConfig => {
        const machineObj = createMachineObjFromConfig(group, {
            ...machineObjConfig,
            group,
            x: group.origin.x + machineObjConfig.x,
            y: group.origin.y + machineObjConfig.y,
            relativePosition: {
                x: machineObjConfig.x,
                y: machineObjConfig.y
            }
        });
        if (machineObj) {
            machineObj.group = group; // todo instead implement reverse indexing
            machineObj.phaserObject.setDepth(machineObjConfig.depth ?? 100);
            group.objects.push(machineObj);
        }
    });

    const groupHandle = phaserContext.matter.add.circle(group.origin.x, group.origin.y, 10, {
        isStatic: true,
        mass: Infinity,
        inertia: Infinity,
        isSensor: true,
        label: "groupHandle", // todo rename to groupHandle
        render: {
            visible: group.showHandle,
            lineColor: 0xffff00
        }
    });
    // todo don't affect inner members, fetch some other way
    groupHandle.group = group;

    return group;
}

export function addObjectBuilder(name, builderFunction){
    if (objectBuilders[name]) {
        console.warn(`Object builder with name ${name} already exists.`);
        return;
    } else {
        objectBuilders[name] = builderFunction;
    }
}

export function getMachineObjectById(id) {
    for (const group of groups) {
        const machineObj = group.objects.find(machineObj => {
            return machineObj.id === id;
        });
        if (machineObj) {
            return machineObj;
        }
    }
}

export function getMachineObjectByBody(body) {
    for (const group of groups) {
        const machineObj = group.objects.find(machineObj => {
            return machineObj.body === body;
        });
        if (machineObj) {
            return machineObj;
        }
    }
}

export function getGroupById(id) {
    return groups.find(group => group.id === id);
}