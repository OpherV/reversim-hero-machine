import { Math as PhaserMath } from "phaser";
import RobotArm from "./RobotArm.js";

let phaserContext;
let robotArm;

export function initRobot(context) {
    phaserContext = context;

    // robotArm = new RobotArm(context, 600, 100);
    robotArm = new RobotArm(context, 500, 370);
    phaserContext.add.existing(robotArm);

    goTo(390, 552, 0);

    phaserContext.time.addEvent({
        delay: 4000,
        callback: throwCup,
        loop: true
    });
}

function goTo(x, y, duration){
    robotArm.goTo(x, y, duration);

    const graphics = window.robotArmGraphics || phaserContext.add.graphics();
    window.robotArmGraphics = graphics;
    graphics.clear();
    graphics.fillStyle(0xff0000, 0.9);
    graphics.fillCircle(x, y, 10);

}

export function throwCup() {
    const armMoveTime = 1000;
    const pincerMoveTime = 300;
    const location1 = {
        x: PhaserMath.Between(390 - 100, 600),
        y: PhaserMath.Between(450, 580)
    }
    const location2 = {
        x: PhaserMath.Between(390 - 100, 600),
        y: PhaserMath.Between(450, 580)
    }
    const location3 = {
        x: PhaserMath.Between(390 - 100, 600),
        y: PhaserMath.Between(450, 580)
    }

    robotArm.setPincersDistance(80, pincerMoveTime);
    goTo(location1.x, location1.y, armMoveTime);

    phaserContext.time.addEvent({
        delay: 2 * armMoveTime,
        callback: () => {
            goTo(location2.x, location2.y, armMoveTime);
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
        delay: 3.5 * armMoveTime,
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