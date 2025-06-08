import { Math as PhaserMath } from "phaser";
import RobotArm from "./RobotArm.js";
import {addObjectBuilder, createGroupFromConfig, getMachineObjectById} from "../logic/groupManager.js";

const robotConfig =
    {
        "id": "robotGroup",
        "origin": {
            "x": 444.9173341040899,
            "y": 270.5968435355174
        },
        "showHandle": true,
        "objects": [
            {
                "type": "paddle",
                "id": "robotBase",
                "x": 8.808748740098679,
                "y": 89.26275251122695,
                "w": 200,
                "h": 10
            },
            {
                "type": "robotArm",
                "id": "robotArm",
                "x": 8,
                "y": 170,
            },
            {
                type: "label",
                id: "coffeeLabel",
                x: 140,
                y: 160,
                labelConfig: {
                    width: 140,
                    text: "AI Agent"
                }
            }
        ]
    }

let phaserContext;
let robotArm;

export function initRobot(context) {
    phaserContext = context;
    addObjectBuilder('robotArm', (phaserContext, group, itemConfig) => {
        const robotArm = new RobotArm(
            phaserContext,
            itemConfig.x,
            itemConfig.y,
            itemConfig.robotArmConfig
        );
        phaserContext.add.existing(robotArm);

        return {
            phaserObject: robotArm
        }
    })

    createGroupFromConfig(robotConfig);


    robotArm = getMachineObjectById('robotArm').phaserObject;
    goTo(390, 552, 0);

    phaserContext.time.addEvent({
        delay: 10000,
        callback: throwCup,
        loop: true
    });

    // on click, run goTo with the click position
    // phaserContext.input.on('pointerdown', (pointer) => {
    //     goTo(pointer.worldX, pointer.worldY, 200);
    // });
}

function goTo(x, y, duration){
    robotArm.goTo(x, y, duration);

    // const graphics = window.robotArmGraphics || phaserContext.add.graphics();
    // window.robotArmGraphics = graphics;
    // graphics.clear();
    // graphics.fillStyle(0xff0000, 0.9);
    // graphics.fillCircle(x, y, 10);

}

export function throwCup() {
    const armMoveTime = 1000;
    const pincerMoveTime = 300;
    const location1 = {
        x: PhaserMath.Between(300, 500),
        y: 500
    }
    const location2 = {
        x: location1.x,
        y: 600
    }
    const location3 = {
        x: PhaserMath.Between(500, 600),
        y: PhaserMath.Between(300, 500)
    }

    robotArm.setPincersDistance(60, pincerMoveTime);
    goTo(location1.x, location1.y, armMoveTime);

    phaserContext.time.addEvent({
        delay: 2 * armMoveTime,
        callback: () => {
            goTo(location2.x, location2.y, armMoveTime);
        },
        loop: false
    });
    phaserContext.time.addEvent({
        delay: 3 * armMoveTime,
        callback: () => {
            robotArm.setPincersDistance(20, pincerMoveTime / 2);
        },
        loop: false
    });
    phaserContext.time.addEvent({
        delay: 5 * armMoveTime,
        callback: () => {
            goTo(location3.x, location3.y, armMoveTime);
        },
        loop: false
    });
}

export function throwCup2(){
    console.log('throwcup')
    const armMoveTime = 1000;
    const pincerMoveTime = 300;
    const cupLocation = {
        x: 390,
        y: 590
    }
    robotArm.setPincersDistance(80, pincerMoveTime);
    goTo(cupLocation.x - 40, cupLocation.y - 100, armMoveTime);

    phaserContext.time.addEvent({
        delay: 2 * armMoveTime,
        callback: () => {
            goTo(cupLocation.x, cupLocation.y, armMoveTime);
        },
        loop: false
    });
    phaserContext.time.addEvent({
        delay: 2.6 * armMoveTime,
        callback: () => {
            robotArm.setPincersDistance(30, pincerMoveTime / 2);
        },
        loop: false
    });
    phaserContext.time.addEvent({
        delay: 3 * armMoveTime,
        callback: () => {
            goTo(cupLocation.x + 280, cupLocation.y - 150, armMoveTime);
            // robotArm.setPincersDistance(20, pincerMoveTime);
        },
        loop: false
    });

}